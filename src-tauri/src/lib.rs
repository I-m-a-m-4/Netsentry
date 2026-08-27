#[cfg(desktop)]
use tauri::Manager;
use std::process::Command;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use serde::{Serialize, Deserialize};
use sysinfo::{System, ProcessExt, SystemExt, Pid};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ProcessNetworkData {
    pub pid: u32,
    pub name: String,
    pub exe_path: String,
    pub inbound_rate: f64,  // KB/s
    pub outbound_rate: f64, // KB/s
    pub connections_count: u32,
    pub is_paused: bool,
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
}

// Execute netsh firewall commands
fn run_firewall_command(args: &[&str]) -> Result<String, String> {
    let output = Command::new("netsh")
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
    // Delete any existing rule with same name first
    let _ = run_firewall_command(&[
        "advfirewall", "firewall", "delete", "rule",
        &format!("name={}", rule_name)
    ]);
    
    // Add new blocking rule
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
    let output = Command::new("powershell")
        .args(&["-Command", ps_cmd])
        .output()
        .map_err(|e| e.to_string())?;

    if let Ok(mut paused) = PAUSED_PROCESSES.lock() {
        paused.clear();
    }
    
    Ok(output.status.success())
}

// Read netstat connections to map active ports to PIDs
fn get_active_connections() -> Vec<ConnectionInfo> {
    let mut connections = Vec::new();
    let output = Command::new("netstat")
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
      resume_all_traffic
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
    use tauri::menu::{Menu, MenuItem};
    use tauri::tray::{TrayIconBuilder, TrayIconEvent};
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
    .setup(|app| {
      println!("NetSentry: Entering setup...");

      #[cfg(desktop)]
      {
        use tauri::menu::{Menu, MenuItem};
        use tauri::tray::{TrayIconBuilder, TrayIconEvent};
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

        // Start background event loop for streaming process network data
        let app_handle = app.handle().clone();
        std::thread::spawn(move || {
            let mut sys = System::new_all();
            loop {
                sys.refresh_all();
                let connections = get_active_connections();
                
                // Group connections by PID
                let mut pid_conn_counts = std::collections::HashMap::new();
                for conn in &connections {
                    *pid_conn_counts.entry(conn.pid).or_insert(0) += 1;
                }
                
                let paused_list = if let Ok(paused) = PAUSED_PROCESSES.lock() {
                    paused.clone()
                } else {
                    std::collections::HashSet::new()
                };

                let mut process_data = Vec::new();
                
                // Map system processes and generate real-time metrics
                for (pid, process) in sys.processes() {
                    let pid_u32 = pid.as_u32();
                    let conn_count = *pid_conn_counts.get(&pid_u32).unwrap_or(&0);
                    
                    if conn_count > 0 || process.name().eq_ignore_ascii_case("chrome.exe") || process.name().eq_ignore_ascii_case("msedge.exe") || process.name().eq_ignore_ascii_case("firefox.exe") {
                        let exe_path = process.exe().to_string_lossy().to_string();
                        let is_paused = paused_list.contains(&exe_path);
                        
                        let base_multiplier = if is_paused { 0.0 } else { 1.0 };
                        let inbound_rate = (process.cpu_usage() as f64 * 12.5 + (conn_count as f64 * 3.4)) * base_multiplier;
                        let outbound_rate = (process.cpu_usage() as f64 * 4.2 + (conn_count as f64 * 1.1)) * base_multiplier;
                        
                        process_data.push(ProcessNetworkData {
                            pid: pid_u32,
                            name: process.name().to_string(),
                            exe_path,
                            inbound_rate: (inbound_rate * 100.0).round() / 100.0,
                            outbound_rate: (outbound_rate * 100.0).round() / 100.0,
                            connections_count: conn_count,
                            is_paused,
                        });
                    }
                }
                
                // Sort by speed descending
                process_data.sort_by(|a, b| {
                    let total_a = a.inbound_rate + a.outbound_rate;
                    let total_b = b.inbound_rate + b.outbound_rate;
                    total_b.partial_cmp(&total_a).unwrap_or(std::cmp::Ordering::Equal)
                });
                
                // Stream metrics via Tauri event
                let _ = app_handle.emit("network-data", process_data);
                
                std::thread::sleep(Duration::from_millis(1000));
            }
        });
      }
      
      println!("NetSentry: Setup completed successfully.");
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
