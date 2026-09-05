import React from 'react';
import { 
  AppWindow, 
  Cpu, 
  Globe, 
  Terminal, 
  Code, 
  MessageSquare, 
  Music, 
  Cloud, 
  Zap, 
  ShieldCheck, 
  Folder
} from 'lucide-react';

export interface ProcessBrandMeta {
  isSystem: boolean;
  label: string;
  category: string;
  icon: React.ReactNode;
  badgeBg: string;
  accentColor: string;
  borderColor: string;
}

// System daemon process names to identify Windows background noise
export const SYSTEM_PROCESS_NAMES = new Set([
  'svchost.exe', 'system', 'idle', 'tagsrv.exe', 'nimdnsresponder.exe', 
  'qkactivedefense.exe', 'services.exe', 'lsass.exe', 'csrss.exe', 'smss.exe', 
  'wininit.exe', 'winlogon.exe', 'spoolsv.exe', 'searchhost.exe', 'ctfmon.exe', 
  'taskhostw.exe', 'runtimebroker.exe', 'sihost.exe', 'fontdrvhost.exe', 
  'dwmp.exe', 'dwm.exe', 'conhost.exe', 'wmiusr.exe', 'wmiprvse.exe', 'registry',
  'explorer.exe', 'securityhealthservice.exe', 'smartscreen.exe'
]);

// Official Brave Lion Logo SVG
export function BraveIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 256 313" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="braveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FB542B" />
          <stop offset="50%" stopColor="#FF3C00" />
          <stop offset="100%" stopColor="#FF1B00" />
        </linearGradient>
      </defs>
      <path
        d="M128 0L38.2 39.8L21.3 125.7C10.7 179.9 44.6 233.1 98.4 250.2L128 259.6L157.6 250.2C211.4 233.1 245.3 179.9 234.7 125.7L217.8 39.8L128 0Z"
        fill="url(#braveGrad)"
      />
      <path
        d="M128 24.5L57.5 55.7L44.2 123.6C35.9 166.4 62.7 208.5 105.1 222L128 229.3L150.9 222C193.3 208.5 220.1 166.4 211.8 123.6L198.5 55.7L128 24.5Z"
        fill="#FF2600"
      />
      <path
        d="M128 50L80 75L72 120C67 150 85 180 115 190L128 194L141 190C171 180 189 150 184 120L176 75L128 50Z"
        fill="#FFFFFF"
        fillOpacity="0.9"
      />
      <circle cx="108" cy="115" r="7" fill="#FF1B00" />
      <circle cx="148" cy="115" r="7" fill="#FF1B00" />
      <path d="M128 135L118 152H138L128 135Z" fill="#FF3C00" />
      <path d="M110 166C116 172 140 172 146 166" stroke="#FF1B00" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

// Official Google Chrome Logo SVG
export function ChromeIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="#FFFFFF" />
      <path d="M50 24C35.6 24 24 35.6 24 50C24 53.6 24.7 57.1 26.1 60.2L12 35.8C18.2 21.6 32.8 12 50 12C63.2 12 75.1 17.6 83.2 26.8L54.7 26.8C53.2 24.9 51.7 24 50 24Z" fill="#EA4335" />
      <path d="M50 24L78.6 24C84.3 31.6 87.7 41.2 87.7 51.5C87.7 67.8 77.8 81.8 63.8 87.3L50.8 64.8C54.4 62.8 56.8 59 56.8 54.6C56.8 45.8 49.6 38.6 40.8 38.6L50 24Z" fill="#FBBC05" />
      <path d="M26.1 60.2L12 35.8C10.7 40.2 10 44.9 10 49.8C10 70.8 26.2 87.9 46.8 89.6L60.6 65.7C58 67.8 54.7 69 51.2 69C40.6 69 31.6 61.9 28.9 52.2L26.1 60.2Z" fill="#34A853" />
      <circle cx="50" cy="50" r="18" fill="#FFFFFF" />
      <circle cx="50" cy="50" r="14" fill="#1A73E8" />
    </svg>
  );
}

// Official Microsoft Edge Logo SVG
export function EdgeIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="edgeGrad1" x1="15%" y1="20%" x2="85%" y2="85%">
          <stop offset="0%" stopColor="#0C84D4" />
          <stop offset="50%" stopColor="#03B388" />
          <stop offset="100%" stopColor="#12D66C" />
        </linearGradient>
        <linearGradient id="edgeGrad2" x1="10%" y1="10%" x2="90%" y2="90%">
          <stop offset="0%" stopColor="#0A2A82" />
          <stop offset="60%" stopColor="#0B5FA5" />
          <stop offset="100%" stopColor="#0C84D4" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="#000000" fillOpacity="0.04" />
      <path
        d="M89 54.2C88.2 73.5 72.3 89 52.7 89C32.1 89 15.5 72.4 15.5 51.8C15.5 35.8 25.5 22.2 39.7 16.9C36.9 24.3 40.5 33.1 48 36.3C55.4 39.5 64.1 36 67.3 28.6C68.9 25 69.1 21 68.1 17.4C80.8 24.3 89.4 37.8 89 54.2Z"
        fill="url(#edgeGrad1)"
      />
      <path
        d="M52.7 30C38 30 26 42 26 56.7C26 69.5 35.1 80.2 47.4 82.7C42.8 77.8 40.2 71.2 40.2 64.2C40.2 50.1 51.6 38.7 65.7 38.7C71.3 38.7 76.5 40.5 80.7 43.6C77.4 35.7 69.7 30 60.8 30H52.7Z"
        fill="url(#edgeGrad2)"
      />
    </svg>
  );
}

// Official Mozilla Firefox Logo SVG
export function FirefoxIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ffFire" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE600" />
          <stop offset="40%" stopColor="#FF6B00" />
          <stop offset="100%" stopColor="#FF1443" />
        </linearGradient>
        <radialGradient id="ffGlobe" cx="60%" cy="60%" r="50%">
          <stop offset="0%" stopColor="#3023AE" />
          <stop offset="70%" stopColor="#53A0FD" />
          <stop offset="100%" stopColor="#7F53AC" />
        </radialGradient>
      </defs>
      <circle cx="55" cy="55" r="35" fill="url(#ffGlobe)" />
      <path
        d="M87 40C84 25 70 12 52 11C40 10 28 17 21 26C15 34 12 45 14 56C17 73 31 87 49 89C67 91 84 80 89 63C93 49 90 43 87 40Z"
        fill="url(#ffFire)"
      />
      <circle cx="53" cy="53" r="26" fill="url(#ffGlobe)" />
      <path
        d="M52 22C43 28 35 37 34 49C33 58 37 67 44 73C38 68 34 60 35 52C36 43 42 35 50 30C58 25 68 25 74 29C70 24 62 21 52 22Z"
        fill="#FFE600"
      />
    </svg>
  );
}

// Antigravity IDE Official Logo (DeepMind / Google Antigravity)
export function AntigravityIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="agyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#C084FC" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      <path
        d="M50 18L76 74L50 62L24 74L50 18Z"
        fill="url(#agyGrad)"
      />
      <circle cx="50" cy="46" r="8" fill="#FFFFFF" />
      <path d="M50 26L68 66L50 57L32 66L50 26Z" stroke="#FFFFFF" strokeWidth="2" strokeOpacity="0.4" />
      <circle cx="50" cy="80" r="4" fill="#38BDF8" />
    </svg>
  );
}

// VS Code Official Logo SVG
export function VSCodeIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M72 12L22 42L12 34L4 39L15 50L4 61L12 66L22 58L72 88L92 78V22L72 12Z" fill="#007ACC" />
      <path d="M72 12L22 42L36 50L72 26V12Z" fill="#1F9CF0" />
      <path d="M72 88L22 58L36 50L72 74V88Z" fill="#0065A9" />
      <path d="M72 26L36 50L72 74V26Z" fill="#007ACC" />
      <path d="M72 12L92 22V78L72 88V12Z" fill="#1F9CF0" />
    </svg>
  );
}

// Discord Logo SVG
export function DiscordIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="22" fill="#5865F2" />
      <path
        d="M72 32C67 29.5 62 28 56.5 27C56 28 55 30 54.5 31C49 30 43.5 30 38 31C37.5 30 36.5 28 36 27C30.5 28 25.5 29.5 20.5 32C10.5 47 7.5 61.5 9 76C15.5 81 22 81 28 81C29.5 79 31 77 32 75C29.5 74 27.5 72.5 25.5 71C26 70.5 26.5 70 27 69.5C39 75 53 75 65 69.5C65.5 70 66 70.5 66.5 71C64.5 72.5 62.5 74 60 75C61 77 62.5 79 64 81C70 81 76.5 81 83 76C85 59 80 45 72 32ZM34 62C30 62 27 58 27 53.5C27 49 30 45 34 45C38 45 41 49 41 53.5C41 58 38 62 34 62ZM58 62C54 62 51 58 51 53.5C51 49 54 45 58 45C62 45 65 49 65 53.5C65 58 62 62 58 62Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

// Slack Logo SVG
export function SlackIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="22" fill="#4A154B" />
      <g transform="translate(18, 18) scale(0.64)">
        <path d="M23 49C23 43.5 18.5 39 13 39C7.5 39 3 43.5 3 49C3 54.5 7.5 59 13 59H23V49Z" fill="#36C5F0" />
        <path d="M28 49C28 54.5 32.5 59 38 59C43.5 59 48 54.5 48 49V23C48 17.5 43.5 13 38 13C32.5 13 28 17.5 28 23V49Z" fill="#36C5F0" />
        <path d="M49 23C43.5 23 39 18.5 39 13C39 7.5 43.5 3 49 3C54.5 3 59 7.5 59 13C59 18.5 54.5 23 49 23Z" fill="#2EB67D" />
        <path d="M49 28C54.5 28 59 32.5 59 38C59 43.5 54.5 48 49 48H23C17.5 48 13 43.5 13 38C13 32.5 17.5 28 23 28H49Z" fill="#2EB67D" />
        <path d="M77 49C77 54.5 81.5 59 87 59C92.5 59 97 54.5 97 49C97 43.5 92.5 39 87 39H77V49Z" fill="#ECB22E" />
        <path d="M72 49C72 43.5 67.5 39 62 39C56.5 39 52 43.5 52 49V75C52 80.5 56.5 85 62 85C67.5 85 72 80.5 72 75V49Z" fill="#ECB22E" />
        <path d="M49 77C54.5 77 59 81.5 59 87C59 92.5 54.5 97 49 97C43.5 97 39 92.5 39 87C39 81.5 43.5 77 49 77Z" fill="#E01E5A" />
        <path d="M49 72C43.5 72 39 67.5 39 62C39 56.5 43.5 52 49 52H75C80.5 52 85 56.5 85 62C85 67.5 80.5 72 75 72H49Z" fill="#E01E5A" />
      </g>
    </svg>
  );
}

// Spotify Logo SVG
export function SpotifyIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="#1DB954" />
      <path d="M68 64C66.8 64 65.7 63.6 64.7 63C52.8 55.7 37.3 54.2 22.8 57.5C20.5 58 18.2 56.6 17.7 54.3C17.2 52 18.6 49.7 20.9 49.2C37.5 45.4 54.9 47.1 68.3 55.3C70.3 56.5 70.9 59.2 69.7 61.2C68.9 63 68.4 64 68 64Z" fill="#000000" />
      <path d="M72.5 51.5C71.1 51.5 69.8 51 68.6 50.2C55.5 42.1 36.3 39.9 21.8 44.3C19.2 45.1 16.5 43.6 15.7 41C14.9 38.4 16.4 35.7 19 34.9C35.9 29.8 57.4 32.3 72.4 41.5C74.6 42.9 75.3 45.8 73.9 48C73.4 50.2 72.8 51.5 72.5 51.5Z" fill="#000000" />
      <path d="M77 38.5C75.3 38.5 73.7 37.9 72.3 37C57.6 28.3 33.5 27.5 19.5 31.7C16.3 32.7 12.9 30.9 11.9 27.7C10.9 24.5 12.7 21.1 15.9 20.1C32.3 15.1 59.1 16.1 76 26.2C78.8 27.9 79.8 31.5 78.1 34.3C77.4 37 77 38.5 77 38.5Z" fill="#000000" />
    </svg>
  );
}

// Telegram Logo SVG
export function TelegramIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="tgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2AABEE" />
          <stop offset="100%" stopColor="#229ED9" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#tgGrad)" />
      <path d="M22 49L73 28C75.5 27 77.5 28.5 76.5 32L68 72C67.5 75 65.5 75.5 63 74L49 64L42 71C41 72 40 73 38 73L39 59L65 35C66 34 65 33.5 63.5 34.5L31 55L22 49Z" fill="#FFFFFF" />
    </svg>
  );
}

// WhatsApp Logo SVG
export function WhatsAppIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="#25D366" />
      <path d="M50 18C32.3 18 18 32.3 18 50C18 56.1 19.7 61.8 22.7 66.7L19 80L32.8 76.4C37.4 78.9 42.6 80.3 48.1 80.3C65.8 80.3 80.1 66 80.1 48.3C80.1 30.6 65.8 18 50 18ZM68.4 61.4C67.6 63.6 64.5 65.4 62 65.9C60.3 66.2 58.1 66.5 50.8 63.5C41.5 59.7 35.5 50.2 35 49.6C34.6 49 31.4 44.8 31.4 40.4C31.4 36 33.6 33.9 34.5 32.9C35.2 32.2 36.3 31.8 37.3 31.8C37.6 31.8 38 31.8 38.3 31.8C39.2 31.9 39.7 31.9 40.3 33.3C41.1 35.1 42.9 39.5 43.1 40C43.3 40.5 43.5 41.2 43.2 41.8C42.8 42.4 42.6 42.7 42 43.4C41.5 44 41 44.7 40.5 45.2C40 45.7 39.5 46.3 40.1 47.3C40.7 48.3 42.8 51.7 45.9 54.5C49.9 58.1 53.2 59.2 54.2 59.7C55.2 60.1 55.8 60 56.4 59.3C57 58.6 59 56.3 59.7 55.3C60.4 54.3 61.2 54.4 62.1 54.7C63 55.1 68 57.6 69 58.1C70 58.6 70.7 58.9 70.9 59.3C71.1 59.7 71.1 61.6 68.4 61.4Z" fill="#FFFFFF" />
    </svg>
  );
}

// Steam Logo SVG
export function SteamIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="steamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#171A21" />
          <stop offset="100%" stopColor="#1B2838" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#steamGrad)" stroke="#66C0F4" strokeWidth="2" />
      <path d="M72 38C72 45.7 65.7 52 58 52C53.3 52 49.2 49.7 46.7 46.1L33.7 53.6C34 54.7 34.2 55.8 34.2 57C34.2 62.5 29.7 67 24.2 67C18.7 67 14.2 62.5 14.2 57C14.2 51.5 18.7 47 24.2 47C25.7 47 27.1 47.3 28.4 47.9L41.6 40.3C42 33 48.3 27 56 27C64.8 27 72 34.2 72 38Z" fill="#66C0F4" />
      <circle cx="58" cy="38" r="7" fill="#171A21" />
      <circle cx="24.2" cy="57" r="5" fill="#171A21" />
    </svg>
  );
}

// Windows Modern 4-Pane OS Logo SVG
export function WindowsSystemIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 14L46 9V47H12V14Z" fill="#0078D4" />
      <path d="M52 8L88 3V47H52V8Z" fill="#0078D4" />
      <path d="M12 53H46V91L12 86V53Z" fill="#0078D4" />
      <path d="M52 53H88V97L52 92V53Z" fill="#0078D4" />
    </svg>
  );
}

// Language Server / Compiler Icon
export function LanguageServerIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <div className={`rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center p-1 ${className}`}>
      <Code className="w-full h-full text-amber-500" />
    </div>
  );
}

/**
 * Intelligent Process Brand & Icon Resolver
 * Inspects process name and full executable path to provide authentic branding.
 */
export function getProcessBrandMeta(name: string, path: string): ProcessBrandMeta {
  const n = (name || '').toLowerCase();
  const p = (path || '').toLowerCase();
  const isSystem = SYSTEM_PROCESS_NAMES.has(n) || p.includes('windows\\system32') || p.includes('windows\\syswow64');

  // 1. Brave Browser
  if (n.includes('brave')) {
    return {
      isSystem: false,
      label: 'Brave Browser',
      category: 'Web Browser',
      icon: <BraveIcon className="w-5 h-5" />,
      badgeBg: 'bg-orange-500/10 border-orange-500/30 text-orange-500',
      accentColor: '#FF3C00',
      borderColor: 'border-orange-500/40',
    };
  }

  // 2. Google Chrome
  if (n.includes('chrome')) {
    return {
      isSystem: false,
      label: 'Google Chrome',
      category: 'Web Browser',
      icon: <ChromeIcon className="w-5 h-5" />,
      badgeBg: 'bg-blue-500/10 border-blue-500/30 text-blue-500',
      accentColor: '#1A73E8',
      borderColor: 'border-blue-500/40',
    };
  }

  // 3. Microsoft Edge
  if (n.includes('msedge') || (n.includes('edge') && !n.includes('language'))) {
    return {
      isSystem: false,
      label: 'Microsoft Edge',
      category: 'Web Browser',
      icon: <EdgeIcon className="w-5 h-5" />,
      badgeBg: 'bg-teal-500/10 border-teal-500/30 text-teal-500',
      accentColor: '#03B388',
      borderColor: 'border-teal-500/40',
    };
  }

  // 4. Mozilla Firefox
  if (n.includes('firefox')) {
    return {
      isSystem: false,
      label: 'Mozilla Firefox',
      category: 'Web Browser',
      icon: <FirefoxIcon className="w-5 h-5" />,
      badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
      accentColor: '#FF6B00',
      borderColor: 'border-amber-500/40',
    };
  }

  // 5. Antigravity IDE (DeepMind / Google Antigravity)
  if (n.includes('antigravity')) {
    return {
      isSystem: false,
      label: 'Antigravity IDE',
      category: 'Developer Tool',
      icon: <AntigravityIcon className="w-5 h-5" />,
      badgeBg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
      accentColor: '#818CF8',
      borderColor: 'border-indigo-500/40',
    };
  }

  // 6. Language Server / Rust Analyzer / TypeScript Server
  if (n.includes('language_server') || n.includes('rust-analyzer') || n.includes('tsserver')) {
    return {
      isSystem: false,
      label: n.includes('rust') ? 'Rust Language Server' : 'IDE Language Server',
      category: 'Developer Tool',
      icon: <LanguageServerIcon className="w-5 h-5" />,
      badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
      accentColor: '#F59E0B',
      borderColor: 'border-amber-500/40',
    };
  }

  // 7. Visual Studio Code
  if (n.includes('code.exe') || (n.includes('code') && p.includes('vscode'))) {
    return {
      isSystem: false,
      label: 'Visual Studio Code',
      category: 'Developer Tool',
      icon: <VSCodeIcon className="w-5 h-5" />,
      badgeBg: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
      accentColor: '#007ACC',
      borderColor: 'border-sky-500/40',
    };
  }

  // 8. Discord
  if (n.includes('discord')) {
    return {
      isSystem: false,
      label: 'Discord',
      category: 'Social & Chat',
      icon: <DiscordIcon className="w-5 h-5" />,
      badgeBg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
      accentColor: '#5865F2',
      borderColor: 'border-indigo-500/40',
    };
  }

  // 9. Slack
  if (n.includes('slack')) {
    return {
      isSystem: false,
      label: 'Slack',
      category: 'Productivity',
      icon: <SlackIcon className="w-5 h-5" />,
      badgeBg: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
      accentColor: '#4A154B',
      borderColor: 'border-purple-500/40',
    };
  }

  // 10. Spotify
  if (n.includes('spotify')) {
    return {
      isSystem: false,
      label: 'Spotify Music',
      category: 'Media & Streaming',
      icon: <SpotifyIcon className="w-5 h-5" />,
      badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500',
      accentColor: '#1DB954',
      borderColor: 'border-emerald-500/40',
    };
  }

  // 11. Telegram
  if (n.includes('telegram')) {
    return {
      isSystem: false,
      label: 'Telegram Messenger',
      category: 'Social & Chat',
      icon: <TelegramIcon className="w-5 h-5" />,
      badgeBg: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
      accentColor: '#229ED9',
      borderColor: 'border-sky-500/40',
    };
  }

  // 12. WhatsApp
  if (n.includes('whatsapp')) {
    return {
      isSystem: false,
      label: 'WhatsApp Desktop',
      category: 'Social & Chat',
      icon: <WhatsAppIcon className="w-5 h-5" />,
      badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      accentColor: '#25D366',
      borderColor: 'border-emerald-500/40',
    };
  }

  // 13. Steam
  if (n.includes('steam')) {
    return {
      isSystem: false,
      label: 'Steam Client',
      category: 'Gaming Platform',
      icon: <SteamIcon className="w-5 h-5" />,
      badgeBg: 'bg-slate-500/10 border-slate-500/30 text-sky-300',
      accentColor: '#66C0F4',
      borderColor: 'border-sky-500/40',
    };
  }

  // 14. Windows System Processes
  if (isSystem) {
    return {
      isSystem: true,
      label: n === 'svchost.exe' ? 'Host Process for Windows Services' : (name || 'Windows System'),
      category: 'Windows Core',
      icon: <WindowsSystemIcon className="w-5 h-5" />,
      badgeBg: 'bg-slate-500/10 border-slate-500/20 text-slate-400',
      accentColor: '#0078D4',
      borderColor: 'border-slate-500/30',
    };
  }

  // 15. Node / NPM / Expo / React Native Dev Tools
  if (n.includes('node') || n.includes('npm') || n.includes('expo') || n.includes('deno') || n.includes('bun')) {
    return {
      isSystem: false,
      label: name.replace(/\.exe$/i, ''),
      category: 'Developer Runtime',
      icon: <Terminal className="w-5 h-5 text-emerald-500" />,
      badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500',
      accentColor: '#10B981',
      borderColor: 'border-emerald-500/40',
    };
  }

  // 16. Default Application Fallback
  return {
    isSystem: false,
    label: name.replace(/\.exe$/i, ''),
    category: 'Desktop App',
    icon: <AppWindow className="w-5 h-5 text-primary" />,
    badgeBg: 'bg-primary/10 border-primary/20 text-primary',
    accentColor: 'hsl(var(--primary))',
    borderColor: 'border-primary/30',
  };
}

/**
 * Universal App Icon Component with fallback
 */
export function AppIcon({ 
  name, 
  exePath, 
  className = "w-6 h-6",
  large = false 
}: { 
  name: string; 
  exePath?: string; 
  className?: string;
  large?: boolean;
}) {
  const meta = getProcessBrandMeta(name, exePath || '');
  return (
    <div className={`relative flex items-center justify-center shrink-0 transition-transform ${large ? 'p-2.5 rounded-2xl' : 'p-1.5 rounded-xl'} ${meta.badgeBg}`}>
      {meta.icon}
    </div>
  );
}
