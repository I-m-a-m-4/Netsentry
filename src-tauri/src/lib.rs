#[cfg(desktop)]
use tauri::Manager;
use tauri::Emitter;
use std::process::Command;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use std::path::PathBuf;
use serde::{Serialize, Deserialize};
use sysinfo::{System, Networks, RefreshKind, ProcessRefreshKind};
use windows::Networking::Connectivity::NetworkInformation;
use rusqlite::{Connection, params};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ProcessNetworkData {
    pub pid: u32,
    pub name: String,
    pub exe_path: String,
    pub inbound_rate: f64,  // KB/s
    pub outbound_rate: f64, // KB/s
    pub cpu_usage: f64,
    pub memory_usage: u64,  // MB
    pub connections_count: u32,
    pub is_paused: bool,
    pub sockets: Vec<ConnectionInfo>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ConnectionInfo {
    pub protocol: String,
    pub local_address: String,
    pub foreign_address: String,
    pub state: String,
    pub pid: u32,
}

// Track active firewall block rules by program path
lazy_static::lazy_static! {
    static ref PAUSED_PROCESSES: Arc<Mutex<std::collections::HashSet<String>>> = Arc::new(Mutex::new(std::collections::HashSet::new()));
    static ref ANALYTICS_DB: Mutex<Option<Connection>> = Mutex::new(None);
}

#[derive(Serialize, Clone, Debug)]
pub struct DailyTotal {
    pub date: String,
    pub total_inbound_mb: f64,
    pub total_outbound_mb: f64,
}

/// Real-time system-level telemetry emitted each tick.
/// All totals are ABSOLUTE — React must assign, never accumulate.
#[derive(Serialize, Clone, Debug)]
pub struct SystemTelemetry {
    pub rx_rate_kbps: f64,      // adapter-measured, divided by real elapsed seconds
    pub tx_rate_kbps: f64,
    pub interval_ms: u64,       // real measured sampling gap; the divisor behind the rates
    pub session_rx_mb: f64,     // cumulative since launch
    pub session_tx_mb: f64,
    pub today_rx_mb: f64,       // since local midnight, persisted to SQLite
    pub today_tx_mb: f64,
}

#[derive(Serialize, Clone, Debug)]
pub struct NetworkDataPayload {
    pub processes: Vec<ProcessNetworkData>,
    pub system: SystemTelemetry,
}

fn init_analytics_db(db_path: PathBuf) {
    match Connection::open(&db_path) {
        Ok(conn) => {
            let _ = conn.execute_batch("
                CREATE TABLE IF NOT EXISTS daily_totals (
                    date TEXT PRIMARY KEY,
                    total_inbound_mb REAL NOT NULL DEFAULT 0.0,
                    total_outbound_mb REAL NOT NULL DEFAULT 0.0
                );
                CREATE TABLE IF NOT EXISTS hourly_snapshots (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp INTEGER NOT NULL,
                    total_inbound_kb REAL NOT NULL,
                    total_outbound_kb REAL NOT NULL
                );
            ");
            if let Ok(mut db) = ANALYTICS_DB.lock() {
                *db = Some(conn);
            }
            println!("NetSentry: Analytics DB initialised at {:?}", db_path);
        }
        Err(e) => println!("NetSentry: Failed to open analytics DB: {}", e),
    }
}

/// Flush pending MB to the DB. Takes MB directly (no /1024 inside).
fn record_usage_to_db(inbound_mb: f64, outbound_mb: f64) {
    if let Ok(db) = ANALYTICS_DB.lock() {
        if let Some(conn) = db.as_ref() {
            let now_ts = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs() as i64;
            // Upsert today's running total (SQLite resolves 'localtime' server-side)
            let _ = conn.execute(
                "INSERT INTO daily_totals (date, total_inbound_mb, total_outbound_mb)
                 VALUES (date('now', 'localtime'), ?1, ?2)
                 ON CONFLICT(date) DO UPDATE SET
                   total_inbound_mb = total_inbound_mb + excluded.total_inbound_mb,
                   total_outbound_mb = total_outbound_mb + excluded.total_outbound_mb",
                params![inbound_mb, outbound_mb],
            );
            // Insert fine-grained snapshot (store in KB for existing schema)
            let _ = conn.execute(
                "INSERT INTO hourly_snapshots (timestamp, total_inbound_kb, total_outbound_kb) VALUES (?1, ?2, ?3)",
                params![now_ts, inbound_mb * 1024.0, outbound_mb * 1024.0],
            );
        }
    }
}

/// Load today's already-persisted totals so we can seed in-memory accumulators.
fn load_today_totals() -> (f64, f64) {
    if let Ok(db) = ANALYTICS_DB.lock() {
        if let Some(conn) = db.as_ref() {
            let result = conn.query_row(
                "SELECT total_inbound_mb, total_outbound_mb FROM daily_totals WHERE date = date('now', 'localtime')",
                [],
                |row| Ok((row.get::<_, f64>(0)?, row.get::<_, f64>(1)?)),
            );
            if let Ok(pair) = result {
                return pair;
            }
        }
    }
    (0.0, 0.0)
}

/// The current local date exactly as SQLite formats it (`YYYY-MM-DD`).
///
/// Rollover detection MUST use the same clock the `daily_totals` rows are keyed by.
/// A UTC-derived day index would flip at UTC midnight while rows are keyed by
/// `date('now','localtime')`, so on any machine with a UTC offset the in-memory
/// total and the persisted row would disagree for the length of that offset.
fn local_date_string() -> String {
    if let Ok(db) = ANALYTICS_DB.lock() {
        if let Some(conn) = db.as_ref() {
            if let Ok(d) = conn.query_row("SELECT date('now', 'localtime')", [], |row| row.get::<_, String>(0)) {
                return d;
            }
        }
    }
    String::new()
}

// Helper to create a process command without spawning a console window on Windows
fn create_cmd(program: &str) -> Command {
    let mut cmd = Command::new(program);
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
    }
    cmd
}

// Execute netsh firewall commands
fn run_firewall_command(args: &[&str]) -> Result<String, String> {
    let output = create_cmd("netsh")
        .args(args)
        .output()
        .map_err(|e| e.to_string())?;
    
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
fn pause_inbound_traffic(exe_path: String, name: String) -> Result<bool, String> {
    let rule_name = format!("NetSentry - Block - {}", name);
    let _ = run_firewall_command(&[
        "advfirewall", "firewall", "delete", "rule",
        &format!("name={}", rule_name)
    ]);
    
    run_firewall_command(&[
        "advfirewall", "firewall", "add", "rule",
        &format!("name={}", rule_name),
        "dir=in",
        "action=block",
        &format!("program={}", exe_path),
        "enable=yes"
    ])?;

    if let Ok(mut paused) = PAUSED_PROCESSES.lock() {
        paused.insert(exe_path);
    }
    
    Ok(true)
}

#[tauri::command]
fn resume_inbound_traffic(exe_path: String, name: String) -> Result<bool, String> {
    let rule_name = format!("NetSentry - Block - {}", name);
    run_firewall_command(&[
        "advfirewall", "firewall", "delete", "rule",
        &format!("name={}", rule_name)
    ])?;

    if let Ok(mut paused) = PAUSED_PROCESSES.lock() {
        paused.remove(&exe_path);
    }
    
    Ok(true)
}

#[tauri::command]
fn resume_all_traffic() -> Result<bool, String> {
    let ps_cmd = "Get-NetFirewallRule -DisplayName 'NetSentry - Block - *' | Remove-NetFirewallRule";
    let output = create_cmd("powershell")
        .args(&["-Command", ps_cmd])
        .output()
        .map_err(|e| e.to_string())?;

    if let Ok(mut paused) = PAUSED_PROCESSES.lock() {
        paused.clear();
    }
    
    Ok(output.status.success())
}

#[tauri::command]
fn kill_process(pid: u32) -> Result<bool, String> {
    let output = create_cmd("taskkill")
        .args(&["/F", "/PID", &pid.to_string()])
        .output()
        .map_err(|e| e.to_string())?;
        
    if output.status.success() {
        Ok(true)
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
fn open_file_location(exe_path: String) -> Result<bool, String> {
    let _output = Command::new("explorer")
        .args(&[&format!("/select,\"{}\"", exe_path)])
        .spawn()
        .map_err(|e| e.to_string())?;
        
    Ok(true)
}

#[derive(Serialize, Clone, Debug)]
pub struct ConnectionStatus {
    pub is_metered: bool,
    pub is_wwan: bool,
}

/// Check whether the active internet connection is metered (via NLM COM) and/or
/// a true WWAN/cellular profile (via WinRT NetworkInformation).
#[tauri::command]
fn is_metered_connection() -> Result<ConnectionStatus, String> {
    let is_metered = is_metered_network::check().unwrap_or(false);

    // Use WinRT to detect actual mobile/cellular interface.
    // Runs in an Option-returning closure so any failure silently returns false.
    let is_wwan = (|| -> Option<bool> {
        let profile = NetworkInformation::GetInternetConnectionProfile().ok()?;
        profile.IsWwanConnectionProfile().ok()
    })().unwrap_or(false);

    Ok(ConnectionStatus { is_metered, is_wwan })
}

#[tauri::command]
fn get_daily_totals(days: u32) -> Vec<DailyTotal> {
    if let Ok(db) = ANALYTICS_DB.lock() {
        if let Some(conn) = db.as_ref() {
            let limit = days.max(1).min(90) as i64;
            let mut stmt = match conn.prepare(
                "SELECT date, total_inbound_mb, total_outbound_mb FROM daily_totals ORDER BY date DESC LIMIT ?1"
            ) {
                Ok(s) => s,
                Err(_) => return vec![],
            };
            let rows = match stmt.query_map(params![limit], |row| {
                Ok(DailyTotal {
                    date: row.get(0)?,
                    total_inbound_mb: row.get(1)?,
                    total_outbound_mb: row.get(2)?,
                })
            }) {
                Ok(iter) => iter,
                Err(_) => return vec![],
            };
            return rows.filter_map(|r| r.ok()).collect();
        }
    }
    vec![]
}

#[tauri::command]
fn enable_data_saver_mode(allowed_exe_paths: Vec<String>) -> Result<bool, String> {
    // Clean up any existing data saver rules first
    let _ = run_firewall_command(&["advfirewall", "firewall", "delete", "rule", "name=NetSentry-DataSaver-BlockAll"]);
    // Add blanket outbound block rule
    run_firewall_command(&[
        "advfirewall", "firewall", "add", "rule",
        "name=NetSentry-DataSaver-BlockAll",
        "dir=out",
        "action=block",
        "enable=yes",
    ])?;
    // Add per-app allow rules for whitelisted executables
    for exe_path in &allowed_exe_paths {
        let fname = std::path::Path::new(exe_path)
            .file_name()
            .map(|f| f.to_string_lossy().to_string())
            .unwrap_or_else(|| exe_path.clone());
        let rule_name = format!("NetSentry-DataSaver-Allow-{}", fname);
        let _ = run_firewall_command(&["advfirewall", "firewall", "delete", "rule", &format!("name={}", rule_name)]);
        let _ = run_firewall_command(&[
            "advfirewall", "firewall", "add", "rule",
            &format!("name={}", rule_name),
            "dir=out",
            "action=allow",
            &format!("program={}", exe_path),
            "enable=yes",
        ]);
    }
    Ok(true)
}

#[tauri::command]
fn disable_data_saver_mode() -> Result<bool, String> {
    // Remove the blanket outbound block rule
    let _ = run_firewall_command(&["advfirewall", "firewall", "delete", "rule", "name=NetSentry-DataSaver-BlockAll"]);
    // Remove all per-app allow rules we created
    let ps_cmd = "Get-NetFirewallRule | Where-Object { $_.DisplayName -like 'NetSentry-DataSaver-Allow-*' } | Remove-NetFirewallRule";
    let _ = create_cmd("powershell").args(&["-Command", ps_cmd]).output();
    Ok(true)
}


// Read netstat connections to map active ports to PIDs
fn get_active_connections() -> Vec<ConnectionInfo> {
    let mut connections = Vec::new();
    let output = create_cmd("netstat")
        .args(&["-ano"])
        .output();
        
    if let Ok(out) = output {
        let stdout = String::from_utf8_lossy(&out.stdout);
        for line in stdout.lines() {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 4 {
                let proto = parts[0];
                if proto == "TCP" || proto == "UDP" {
                    let local = parts[1];
                    let foreign = parts[2];
                    
                    let (state, pid_str) = if proto == "TCP" && parts.len() >= 5 {
                        (parts[3], parts[4])
                    } else {
                        ("*", parts[3])
                    };
                    
                    if let Ok(pid) = pid_str.parse::<u32>() {
                        connections.push(ConnectionInfo {
                            protocol: proto.to_string(),
                            local_address: local.to_string(),
                            foreign_address: foreign.to_string(),
                            state: state.to_string(),
                            pid,
                        });
                    }
                }
            }
        }
    }
    connections
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  println!("NetSentry: Initializing Builder...");
  
  #[allow(unused_mut)]
  let mut builder = tauri::Builder::default()
    .plugin(tauri_plugin_log::Builder::default()
      .level(log::LevelFilter::Info)
      .build())
    .invoke_handler(tauri::generate_handler![
      pause_inbound_traffic,
      resume_inbound_traffic,
      resume_all_traffic,
      kill_process,
      open_file_location,
      is_metered_connection,
      get_daily_totals,
      enable_data_saver_mode,
      disable_data_saver_mode
    ])
    .plugin(tauri_plugin_sql::Builder::default().build())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_stronghold::Builder::new(|_password| {
      "netsentry-secure-key-2026".as_bytes().to_vec()
    }).build())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_process::init())
    .plugin(tauri_plugin_http::init())
    .plugin(tauri_plugin_notification::init())
    .plugin(tauri_plugin_shell::init());

  #[cfg(desktop)]
  {
    builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
      println!("NetSentry: Second instance detected — focusing existing window.");
      if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
      }
    }));
  }

  builder
    .on_window_event(|window, event| {
      if let tauri::WindowEvent::CloseRequested { api, .. } = event {
        let _ = window.hide();
        api.prevent_close();
      }
    })
    .setup(|app| {
      println!("NetSentry: Entering setup...");

      #[cfg(desktop)]
      {
        use tauri::menu::{Menu, MenuItem};
        use tauri::tray::TrayIconBuilder;
        // Explicitly show and focus main window
        if let Some(window) = app.get_webview_window("main") {
          println!("NetSentry: Showing and focusing main window...");
          let _ = window.show();
          let _ = window.unminimize();
          let _ = window.set_focus();
        }

        // Build tray menu
        let quit_i = MenuItem::with_id(app, "quit", "Quit NetSentry", true, None::<&str>)?;
        let show_i = MenuItem::with_id(app, "show", "Show NetSentry", true, None::<&str>)?;
        let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

        if let Some(tray_icon) = app.default_window_icon().cloned() {
          let _ = TrayIconBuilder::new()
            .icon(tray_icon)
            .menu(&menu)
            .on_menu_event(|app, event| {
              match event.id.as_ref() {
                "quit" => {
                  println!("NetSentry: Quit requested from tray.");
                  std::process::exit(0);
                }
                "show" => {
                  if let Some(win) = app.get_webview_window("main") {
                    let _ = win.show();
                    let _ = win.unminimize();
                    let _ = win.set_focus();
                  }
                }
                _ => {}
              }
            })
            .build(app);
        }

        // Initialise analytics SQLite DB
        let db_path = app.path().app_data_dir()
            .unwrap_or_else(|_| PathBuf::from("."))
            .join("netsentry.db");
        init_analytics_db(db_path);

        // Start background event loop for streaming process network data
        let app_handle = app.handle().clone();
        std::thread::spawn(move || {
            // Use cheaper targeted refresh — we only need process name/exe/cpu/memory
            let refresh_kind = RefreshKind::new()
                .with_processes(ProcessRefreshKind::new().with_cpu().with_memory().with_exe(sysinfo::UpdateKind::OnlyIfNotSet));
            let mut sys = System::new_with_specifics(refresh_kind);

            // refresh_list() picks up adapters added or removed at runtime (e.g. USB tether, reconnect Wi-Fi)
            let mut networks = Networks::new_with_refreshed_list();
            let mut prev_net_data: std::collections::HashMap<String, (u64, u64)> = std::collections::HashMap::new();
            // Prime prev_net_data so the very first delta is 0, not a whole-session spike
            for (name, network) in &networks {
                prev_net_data.insert(name.clone(), (network.total_received(), network.total_transmitted()));
            }

            // Load today's already-persisted totals from SQLite so a restart continues correctly
            let (seed_rx, seed_tx) = load_today_totals();
            let mut today_rx_mb: f64 = seed_rx;
            let mut today_tx_mb: f64 = seed_tx;
            let mut session_rx_mb: f64 = 0.0;
            let mut session_tx_mb: f64 = 0.0;
            // Unflushed MB accumulated since last DB write
            let mut pending_rx_mb: f64 = 0.0;
            let mut pending_tx_mb: f64 = 0.0;
            let mut tick_count: u64 = 0;
            // Track the local date for midnight rollover, using the same clock the
            // daily_totals rows are keyed by so the two can never disagree.
            let mut current_date = local_date_string();

            let mut last_tick = Instant::now();

            loop {
                let tick_start = Instant::now();

                // Cheaper: refresh only processes we care about (cpu, mem, exe)
                sys.refresh_processes_specifics(ProcessRefreshKind::new().with_cpu().with_memory().with_exe(sysinfo::UpdateKind::OnlyIfNotSet));
                // refresh_list() detects new/removed adapters (e.g. hotspot reconnect)
                networks.refresh_list();
                let connections = get_active_connections();

                // Real elapsed time since last tick for accurate KB/s
                let elapsed_secs = last_tick.elapsed().as_secs_f64().max(0.01);
                last_tick = Instant::now();

                // Group connections by PID
                let mut pid_connections: std::collections::HashMap<u32, Vec<ConnectionInfo>> = std::collections::HashMap::new();
                for conn in &connections {
                    pid_connections.entry(conn.pid).or_insert_with(Vec::new).push(conn.clone());
                }

                // Calculate physical network adapter delta bytes
                let mut total_rx_delta = 0u64;
                let mut total_tx_delta = 0u64;

                for (name, network) in &networks {
                    let name_lower = name.to_lowercase();
                    // Skip ALL virtual, loopback, and tunnel adapters.
                    // Only count genuine physical interfaces (Wi-Fi, Ethernet, WWAN/LTE).
                    if name_lower.contains("loopback")
                        || name_lower == "lo"
                        || name_lower.starts_with("vethernet")
                        || name_lower.starts_with("veth")
                        || name_lower.contains("hyper-v")
                        || name_lower.contains("hyperv")
                        || name_lower.contains("virtual")
                        || name_lower.contains("vmware")
                        || name_lower.contains("vmnet")
                        || name_lower.contains("virtualbox")
                        || name_lower.contains("vbox")
                        || name_lower.contains("tap")
                        || name_lower.contains("tun")
                        || name_lower.contains("wsl")
                        || name_lower.contains("docker")
                        || name_lower.contains("vpn")
                        || name_lower.contains("wireguard")
                        || name_lower.contains("nordvpn")
                        || name_lower.contains("expressvpn")
                        || name_lower.contains("isatap")
                        || name_lower.contains("teredo")
                        || name_lower.contains("6to4")
                    {
                        continue;
                    }

                    let current_rx = network.total_received();
                    let current_tx = network.total_transmitted();

                    if let Some(&(prev_rx, prev_tx)) = prev_net_data.get(name) {
                        // New adapter (first time seen) has no prev entry — skip to avoid spike
                        if current_rx >= prev_rx { total_rx_delta += current_rx - prev_rx; }
                        if current_tx >= prev_tx { total_tx_delta += current_tx - prev_tx; }
                    }
                    // Always update, even for new adapters (will contribute from next tick)
                    prev_net_data.insert(name.clone(), (current_rx, current_tx));
                }

                // Convert to KB/s using REAL elapsed time, not assumed 1 s
                let rx_kbps = (total_rx_delta as f64 / 1024.0) / elapsed_secs;
                let tx_kbps = (total_tx_delta as f64 / 1024.0) / elapsed_secs;
                let tick_rx_mb = total_rx_delta as f64 / (1024.0 * 1024.0);
                let tick_tx_mb = total_tx_delta as f64 / (1024.0 * 1024.0);

                // --- Local midnight rollover check ---
                let now_day = local_date_string();
                if !now_day.is_empty() && now_day != current_date {
                    // Flush pending before resetting
                    if pending_rx_mb > 0.0 || pending_tx_mb > 0.0 {
                        record_usage_to_db(pending_rx_mb, pending_tx_mb);
                        pending_rx_mb = 0.0;
                        pending_tx_mb = 0.0;
                    }
                    today_rx_mb = 0.0;
                    today_tx_mb = 0.0;
                    current_date = now_day;
                }

                // Accumulate this tick's bytes
                today_rx_mb += tick_rx_mb;
                today_tx_mb += tick_tx_mb;
                session_rx_mb += tick_rx_mb;
                session_tx_mb += tick_tx_mb;
                pending_rx_mb += tick_rx_mb;
                pending_tx_mb += tick_tx_mb;

                tick_count += 1;

                // Flush to SQLite every 15 ticks (~15 s) — crash costs at most 15 s of data
                if tick_count % 15 == 0 && (pending_rx_mb > 0.0 || pending_tx_mb > 0.0) {
                    record_usage_to_db(pending_rx_mb, pending_tx_mb);
                    pending_rx_mb = 0.0;
                    pending_tx_mb = 0.0;
                }

                let paused_list = if let Ok(paused) = PAUSED_PROCESSES.lock() {
                    paused.clone()
                } else {
                    std::collections::HashSet::new()
                };

                let mut candidates = Vec::new();
                let mut total_weight = 0.0;

                // Group candidate processes and calculate weights for estimated share
                for (pid, process) in sys.processes() {
                    let pid_u32 = pid.as_u32();
                    let process_sockets = pid_connections.get(&pid_u32).cloned().unwrap_or_default();
                    let conn_count = process_sockets.len() as u32;

                    if conn_count > 0 || process.name().eq_ignore_ascii_case("chrome.exe") || process.name().eq_ignore_ascii_case("msedge.exe") || process.name().eq_ignore_ascii_case("firefox.exe") {
                        let exe_path = process.exe().map(|p| p.to_string_lossy().to_string()).unwrap_or_default();
                        let is_paused = paused_list.contains(&exe_path);

                        let weight = if is_paused {
                            0.0
                        } else {
                            (conn_count as f64 * 3.0) + (process.cpu_usage() as f64 * 1.5) + 0.1
                        };

                        total_weight += weight;
                        candidates.push((pid_u32, process, exe_path, is_paused, process_sockets, conn_count, weight));
                    }
                }

                let mut process_data = Vec::new();
                for (pid_u32, process, exe_path, is_paused, process_sockets, conn_count, weight) in candidates {
                    let (inbound_rate, outbound_rate) = if total_weight > 0.0 {
                        let share = weight / total_weight;
                        (rx_kbps * share, tx_kbps * share)
                    } else {
                        (0.0, 0.0)
                    };

                    let mem_mb = process.memory() / (1024 * 1024);

                    process_data.push(ProcessNetworkData {
                        pid: pid_u32,
                        name: process.name().to_string(),
                        exe_path,
                        inbound_rate: (inbound_rate * 10.0).round() / 10.0,
                        outbound_rate: (outbound_rate * 10.0).round() / 10.0,
                        cpu_usage: (process.cpu_usage() as f64 * 10.0).round() / 10.0,
                        memory_usage: mem_mb,
                        connections_count: conn_count,
                        is_paused,
                        sockets: process_sockets,
                    });
                }

                // Sort by combined throughput descending
                process_data.sort_by(|a, b| {
                    let total_a = a.inbound_rate + a.outbound_rate;
                    let total_b = b.inbound_rate + b.outbound_rate;
                    total_b.partial_cmp(&total_a).unwrap_or(std::cmp::Ordering::Equal)
                });

                // Report the interval the rates were actually divided by (previous adapter
                // read -> this one). tick_start.elapsed() would be work time only, and would
                // under-report the real sampling gap by however long the loop slept.
                let interval_ms = (elapsed_secs * 1000.0).round() as u64;

                // Emit combined payload — all totals are absolute; React assigns, never accumulates
                let _ = app_handle.emit("network-data", NetworkDataPayload {
                    processes: process_data,
                    system: SystemTelemetry {
                        rx_rate_kbps: (rx_kbps * 10.0).round() / 10.0,
                        tx_rate_kbps: (tx_kbps * 10.0).round() / 10.0,
                        interval_ms,
                        session_rx_mb: (session_rx_mb * 1000.0).round() / 1000.0,
                        session_tx_mb: (session_tx_mb * 1000.0).round() / 1000.0,
                        today_rx_mb: (today_rx_mb * 1000.0).round() / 1000.0,
                        today_tx_mb: (today_tx_mb * 1000.0).round() / 1000.0,
                    },
                });

                // Target 1 s period — subtract work time so the loop doesn't drift
                let work_ms = tick_start.elapsed().as_millis() as u64;
                let sleep_ms = 1000u64.saturating_sub(work_ms);
                std::thread::sleep(Duration::from_millis(sleep_ms));
            }
        });
      }
      
      println!("NetSentry: Setup completed successfully.");
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
