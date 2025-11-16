import React, { useState, useEffect } from 'react';
import { Send, Star, Trash2, Menu, Search, Settings, Plus, ChevronLeft, ChevronRight, LogOut, UserPlus, FolderOpen, RefreshCw, X, Reply, ReplyAll, Forward } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || "https://gpuremail-backend.onrender.com";

const THEMES = {
  voyage: {
    name: 'Voyage (Default)',
    bg: 'from-slate-950 via-blue-950 to-purple-950',
    sidebar: 'bg-slate-900/50 backdrop-blur-sm border-slate-700/50',
    topbar: 'bg-slate-900/80 backdrop-blur-md border-slate-700/50',
    card: 'bg-slate-800/50 backdrop-blur-sm border-slate-700/50',
    button: 'bg-cyan-600 hover:bg-cyan-500',
    buttonSecondary: 'bg-slate-700 hover:bg-slate-600',
    accent: 'text-cyan-400',
    accentHover: 'hover:text-cyan-300',
    text: 'text-slate-100',
    textSecondary: 'text-slate-400',
    textMuted: 'text-slate-500',
    border: 'border-slate-700',
    hover: 'hover:bg-slate-800/50',
    active: 'bg-slate-700/50',
    input: 'bg-slate-800/50 border-slate-600 focus:border-cyan-500',
  },
  midnight: {
    name: 'Midnight Blue',
    bg: 'from-slate-950 to-blue-950',
    sidebar: 'bg-slate-900 border-slate-800',
    topbar: 'bg-slate-900 border-slate-800',
    card: 'bg-slate-800 border-slate-700',
    button: 'bg-blue-600 hover:bg-blue-500',
    buttonSecondary: 'bg-slate-700 hover:bg-slate-600',
    accent: 'text-blue-400',
    accentHover: 'hover:text-blue-300',
    text: 'text-slate-100',
    textSecondary: 'text-slate-400',
    textMuted: 'text-slate-500',
    border: 'border-slate-700',
    hover: 'hover:bg-slate-800',
    active: 'bg-slate-800',
    input: 'bg-slate-800 border-slate-700 focus:border-blue-500',
  },
  ember: {
    name: 'Ember',
    bg: 'from-slate-950 via-orange-950/20 to-red-950/20',
    sidebar: 'bg-slate-900 border-slate-800',
    topbar: 'bg-slate-900 border-slate-800',
    card: 'bg-slate-800 border-slate-700',
    button: 'bg-orange-600 hover:bg-orange-500',
    buttonSecondary: 'bg-slate-700 hover:bg-slate-600',
    accent: 'text-orange-400',
    accentHover: 'hover:text-orange-300',
    text: 'text-slate-100',
    textSecondary: 'text-slate-400',
    textMuted: 'text-slate-500',
    border: 'border-slate-700',
    hover: 'hover:bg-slate-800',
    active: 'bg-slate-800',
    input: 'bg-slate-800 border-slate-700 focus:border-orange-500',
  },
  forest: {
    name: 'Forest',
    bg: 'from-slate-950 via-emerald-950/20 to-teal-950/20',
    sidebar: 'bg-slate-900 border-slate-800',
    topbar: 'bg-slate-900 border-slate-800',
    card: 'bg-slate-800 border-slate-700',
    button: 'bg-emerald-600 hover:bg-emerald-500',
    buttonSecondary: 'bg-slate-700 hover:bg-slate-600',
    accent: 'text-emerald-400',
    accentHover: 'hover:text-emerald-300',
    text: 'text-slate-100',
    textSecondary: 'text-slate-400',
    textMuted: 'text-slate-500',
    border: 'border-slate-700',
    hover: 'hover:bg-slate-800',
    active: 'bg-slate-800',
    input: 'bg-slate-800 border-slate-700 focus:border-emerald-500',
  }
};

export default function Voyage() {
  const [accounts, setAccounts] = useState([]);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [emails, setEmails] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, hasMore: false });
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState("INBOX");
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [composing, setComposing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [showLogin, setShowLogin] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [replyMode, setReplyMode] = useState(null);
  const [forwardMode, setForwardMode] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('voyage_theme') || 'voyage');

  const t = THEMES[theme];

  useEffect(() => {
    const stored = localStorage.getItem("voyage_accounts");
    if (stored) {
      const accts = JSON.parse(stored);
      setAccounts(accts);
      if (accts.length > 0) {
        setCurrentAccount(accts[0]);
        setShowLogin(false);
        fetchFolders(accts[0]);
        fetchEmails(accts[0], "INBOX", 1);
      }
    }
  }, []);

  const handleLogin = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        signal: controller.signal
      });

      clearTimeout(timeout);
      const data = await res.json();
      
      if (data.success) {
        const newAccount = {
          id: crypto.randomUUID(),
          email: credentials.email,
          password: btoa(credentials.password),
        };

        const updated = [...accounts, newAccount];
        setAccounts(updated);
        localStorage.setItem("voyage_accounts", JSON.stringify(updated));
        setCurrentAccount(newAccount);
        setShowLogin(false);
        fetchFolders(newAccount);
        fetchEmails(newAccount, "INBOX", 1);
      } else {
        setError("Login failed: " + (data.error || "Invalid credentials"));
      }
    } catch (err) {
      console.error("Login error:", err);
      if (err.name === 'AbortError') {
        setError("Connection timeout. Server may be slow.");
      } else {
        setError("Connection error. Backend may be offline.");
      }
    }
    setLoading(false);
  };

  const fetchFolders = async (account) => {
    try {
      const res = await fetch(`${API_BASE}/api/folders`, {
        headers: {
          "x-email": account.email,
          "x-password": atob(account.password),
        },
      });
      const data = await res.json();
      setFolders(data.folders || []);
    } catch (err) {
      console.error("Folders error:", err);
    }
  };

  const fetchEmails = async (account, folder, page = 1) => {
    setLoading(true);
    setError(null);
    setEmails([]);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const res = await fetch(`${API_BASE}/api/emails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: account.email,
          password: atob(account.password),
          folder,
          page,
          pageSize: 25,
          unreadOnly
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data = await res.json();
      setEmails(data.emails || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, hasMore: false });
    } catch (err) {
      console.error("Fetch error:", err);
      if (err.name === 'AbortError') {
        setError("Timeout loading emails. Server is slow.");
      } else {
        setError("Failed to load emails: " + err.message);
      }
      setEmails([]);
    }
    setLoading(false);
  };

  const fetchEmailBody = async (emailObj) => {
    try {
      const res = await fetch(`${API_BASE}/api/emails/${emailObj.id}?folder=${selectedFolder}`, {
        headers: {
          "x-email": currentAccount.email,
          "x-password": atob(currentAccount.password),
        },
      });
      const data = await res.json();
      return { ...emailObj, bodyText: data.bodyText, bodyHTML: data.bodyHTML };
    } catch (err) {
      console.error("Fetch body failed:", err);
      return emailObj;
    }
  };

  const markRead = async (emailObj) => {
    try {
      await fetch(`${API_BASE}/api/emails/mark-read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-email": currentAccount.email,
          "x-password": atob(currentAccount.password),
        },
        body: JSON.stringify({ uid: emailObj.id, folder: selectedFolder }),
      });
      setEmails((prev) => prev.map((e) => e.id === emailObj.id ? { ...e, unread: false } : e));
    } catch (err) {
      console.error("Mark read failed:", err);
    }
  };

  const toggleStar = async (emailObj) => {
    try {
      await fetch(`${API_BASE}/api/emails/star`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-email": currentAccount.email,
          "x-password": atob(currentAccount.password),
        },
        body: JSON.stringify({ uid: emailObj.id, starred: !emailObj.starred, folder: selectedFolder }),
      });
      setEmails((prev) => prev.map((e) => e.id === emailObj.id ? { ...e, starred: !e.starred } : e));
      if (selectedEmail?.id === emailObj.id) {
        setSelectedEmail({ ...selectedEmail, starred: !selectedEmail.starred });
      }
    } catch (err) {
      console.error("Star failed:", err);
    }
  };

  const deleteEmail = async (emailObj) => {
    if (!window.confirm("Delete this email?")) return;
    try {
      await fetch(`${API_BASE}/api/emails/delete/${emailObj.id}?folder=${selectedFolder}`, {
        method: "DELETE",
        headers: {
          "x-email": currentAccount.email,
          "x-password": atob(currentAccount.password),
        },
      });
      setEmails((prev) => prev.filter((e) => e.id !== emailObj.id));
      setSelectedEmail(null);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const switchAccount = (account) => {
    setCurrentAccount(account);
    setSelectedEmail(null);
    setComposing(false);
    setSelectedFolder("INBOX");
    setUnreadOnly(false);
    setPagination({ page: 1, totalPages: 1, hasMore: false });
    fetchFolders(account);
    fetchEmails(account, "INBOX", 1);
    if (window.innerWidth <= 768) setSidebarOpen(false);
  };

  const removeAccount = (accountId) => {
    const updated = accounts.filter((a) => a.id !== accountId);
    setAccounts(updated);
    localStorage.setItem("voyage_accounts", JSON.stringify(updated));
    if (currentAccount?.id === accountId) {
      setCurrentAccount(updated[0] || null);
      if (updated[0]) {
        setPagination({ page: 1, totalPages: 1, hasMore: false });
        fetchFolders(updated[0]);
        fetchEmails(updated[0], "INBOX", 1);
      } else {
        setShowLogin(true);
      }
    }
  };

  const sendEmail = async (to, subject, body) => {
    try {
      await fetch(`${API_BASE}/api/emails/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-email": currentAccount.email,
          "x-password": atob(currentAccount.password),
        },
        body: JSON.stringify({ to, subject, body }),
      });
      setComposing(false);
      setReplyMode(null);
      setForwardMode(null);
      fetchEmails(currentAccount, selectedFolder);
    } catch (err) {
      console.error("Send failed:", err);
      alert("Failed to send email: " + err.message);
    }
  };

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('voyage_theme', newTheme);
  };

  if (showLogin) {
    return <LoginScreen onLogin={handleLogin} onCancel={() => setShowLogin(false)} loading={loading} error={error} hasAccounts={accounts.length > 0} theme={t} />;
  }

  if (showSettings) {
    return <SettingsScreen theme={theme} onThemeChange={changeTheme} onClose={() => setShowSettings(false)} currentTheme={t} />;
  }

  return (
    <div className={`flex h-screen ${t.text} bg-gradient-to-br ${t.bg}`}>
      {sidebarOpen && window.innerWidth <= 768 && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      <div className={`${sidebarOpen ? 'w-64' : 'w-0 md:w-16'} fixed md:relative z-50 h-full ${t.sidebar} border-r ${t.border} transition-all duration-300 flex flex-col overflow-hidden`}>
        <div className={`p-4 flex items-center justify-between border-b ${t.border} shrink-0`}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`p-2 ${t.hover} rounded transition`}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          {sidebarOpen && <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Voyage</h1>}
        </div>

        {sidebarOpen && accounts.length > 0 && (
          <div className={`p-4 border-b ${t.border} shrink-0`}>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {accounts.map((account) => (
                <div key={account.id} className={`flex items-center gap-2 p-2 rounded transition ${currentAccount?.id === account.id ? t.active : t.hover}`}>
                  <button onClick={() => switchAccount(account)} className="flex-1 text-left flex items-center gap-2 min-w-0">
                    <div className={`w-8 h-8 ${t.buttonSecondary} rounded-full flex items-center justify-center text-xs font-bold border ${t.border} shrink-0`}>
                      {account.email[0].toUpperCase()}
                    </div>
                    <span className="text-sm truncate">{account.email}</span>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); removeAccount(account.id); }} className={`p-1 ${t.hover} rounded shrink-0 transition`}>
                    <LogOut size={14} />
                  </button>
                </div>
              ))}
              <button onClick={() => setShowLogin(true)} className={`w-full flex items-center gap-2 p-2 text-sm ${t.textSecondary} ${t.accentHover} ${t.hover} rounded transition`}>
                <UserPlus size={16} />
                Add Account
              </button>
            </div>
          </div>
        )}

        {sidebarOpen && (
          <div className="px-4 mb-4 mt-4 shrink-0">
            <button onClick={() => { setComposing(true); setReplyMode(null); setForwardMode(null); if (window.innerWidth <= 768) setSidebarOpen(false); }} className={`w-full ${t.button} ${t.text} px-4 py-3 rounded-lg flex items-center gap-2 font-medium transition`}>
              <Plus size={20} />
              Compose
            </button>
          </div>
        )}

        <nav className="space-y-1 px-2 flex-1 overflow-y-auto">
          {folders.map((folder) => (
            <button
              key={folder.name}
              onClick={() => {
                setSelectedFolder(folder.name);
                setSelectedEmail(null);
                setUnreadOnly(false);
                setPagination({ page: 1, totalPages: 1, hasMore: false });
                fetchEmails(currentAccount, folder.name, 1);
                if (window.innerWidth <= 768) setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left transition ${selectedFolder === folder.name ? `${t.active} ${t.text}` : `${t.textSecondary} ${t.hover}`}`}
            >
              <FolderOpen size={18} />
              {sidebarOpen && <span className="flex-1 text-sm truncate">{folder.name}</span>}
            </button>
          ))}
        </nav>

        {sidebarOpen && (
          <div className={`p-4 border-t ${t.border} shrink-0`}>
            <button onClick={() => setShowSettings(true)} className={`w-full flex items-center gap-2 p-2 text-sm ${t.textSecondary} ${t.accentHover} ${t.hover} rounded transition`}>
              <Settings size={16} />
              Settings
            </button>
            <button onClick={() => { setPagination({ page: 1, totalPages: 1, hasMore: false }); fetchEmails(currentAccount, selectedFolder, 1); }} className={`w-full flex items-center gap-2 p-2 text-sm ${t.textSecondary} ${t.accentHover} ${t.hover} rounded mt-2 transition`}>
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar currentAccount={currentAccount} sidebarOpen={sidebarOpen} onMenuClick={() => setSidebarOpen(!sidebarOpen)} theme={t} />

        {error && (
          <div className="bg-red-900/20 border-b border-red-500/50 p-4 text-sm flex justify-between items-center backdrop-blur-sm">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-200 hover:text-white">×</button>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden">
          {!composing && (
            <EmailList
              emails={emails}
              loading={loading}
              selectedEmail={selectedEmail}
              unreadOnly={unreadOnly}
              pagination={pagination}
              theme={t}
              onUnreadOnlyChange={(value) => {
                setUnreadOnly(value);
                setPagination({ page: 1, totalPages: 1, hasMore: false });
                fetchEmails(currentAccount, selectedFolder, 1);
              }}
              onPageChange={(newPage) => {
                fetchEmails(currentAccount, selectedFolder, newPage);
              }}
              setSelectedEmail={async (emailObj) => {
                const fullEmail = await fetchEmailBody(emailObj);
                setSelectedEmail(fullEmail);
                markRead(emailObj);
              }}
            />
          )}

          {selectedEmail && !composing && (
            <EmailView
              email={selectedEmail}
              theme={t}
              onBack={() => setSelectedEmail(null)}
              onDelete={() => deleteEmail(selectedEmail)}
              onStar={() => toggleStar(selectedEmail)}
              onReply={() => {
                setReplyMode(selectedEmail);
                setComposing(true);
              }}
              onReplyAll={() => {
                setReplyMode({ ...selectedEmail, replyAll: true });
                setComposing(true);
              }}
              onForward={() => {
                setForwardMode(selectedEmail);
                setComposing(true);
              }}
            />
          )}

          {composing && (
            <ComposeEmail
              theme={t}
              onSend={sendEmail}
              onClose={() => { 
                setComposing(false); 
                setReplyMode(null); 
                setForwardMode(null);
              }}
              replyTo={replyMode}
              forwardOf={forwardMode}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function LoginScreen({ onLogin, onCancel, loading, error, hasAccounts, theme }) {
  const [loginData, setLoginData] = useState({ email: "", password: "" });

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bg} flex items-center justify-center p-4`}>
      <div className={`${theme.card} rounded-lg p-8 w-full max-w-md border ${theme.border}`}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">Voyage</h1>
            <p className={`${theme.textSecondary} text-sm`}>Email for the limitless</p>
          </div>
          {hasAccounts && (
            <button onClick={onCancel} className={`${theme.textSecondary} ${theme.accentHover} text-2xl transition`}>×</button>
          )}
        </div>
        
        {error && <div className="bg-red-900/20 text-red-200 p-3 rounded mb-4 text-sm border border-red-500/50">{error}</div>}
        
        <div className="space-y-4">
          <input
            value={loginData.email}
            onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
            type="email"
            placeholder="Email Address"
            disabled={loading}
            className={`w-full ${theme.input} ${theme.text} px-4 py-3 rounded border focus:outline-none transition disabled:opacity-50`}
          />
          <input
            value={loginData.password}
            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
            type="password"
            placeholder="Password"
            disabled={loading}
            onKeyPress={(e) => e.key === 'Enter' && !loading && onLogin(loginData)}
            className={`w-full ${theme.input} ${theme.text} px-4 py-3 rounded border focus:outline-none transition disabled:opacity-50`}
          />
          <button
            onClick={() => onLogin(loginData)}
            disabled={loading}
            className={`w-full ${theme.button} ${theme.text} py-3 rounded font-medium disabled:opacity-50 transition`}
          >
            {loading ? "Connecting..." : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsScreen({ theme: themeKey, onThemeChange, onClose, currentTheme }) {
  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentTheme.bg} flex items-center justify-center p-4`}>
      <div className={`${currentTheme.card} rounded-lg p-8 w-full max-w-md border ${currentTheme.border}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Settings</h2>
          <button onClick={onClose} className={`${currentTheme.textSecondary} ${currentTheme.accentHover} text-3xl leading-none transition`}>×</button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-3">Theme</label>
            <div className="space-y-2">
              {Object.entries(THEMES).map(([key, t]) => (
                <button
                  key={key}
                  onClick={() => onThemeChange(key)}
                  className={`w-full p-3 rounded border transition ${themeKey === key ? `${currentTheme.active} border-cyan-500` : `${currentTheme.hover} ${currentTheme.border}`}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-gradient-to-br ${t.bg} rounded border ${t.border}`}></div>
                    <span>{t.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TopBar({ currentAccount, sidebarOpen, onMenuClick, theme }) {
  return (
    <div className={`${theme.topbar} border-b ${theme.border} p-4 shrink-0`}>
      <div className="flex items-center gap-4">
        {!sidebarOpen && (
          <button onClick={onMenuClick} className={`p-2 ${theme.hover} rounded md:hidden transition`}>
            <Menu size={20} />
          </button>
        )}
        <div className="flex-1 relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.textMuted}`} size={18} />
          <input
            type="text"
            placeholder="Search mail"
            className={`w-full ${theme.input} ${theme.text} pl-10 pr-4 py-2 rounded-lg border focus:outline-none transition`}
          />
        </div>
        {currentAccount && (
          <div className={`text-sm ${theme.textSecondary} hidden sm:block`}>{currentAccount.email}</div>
        )}
      </div>
    </div>
  );
}

function EmailList({ emails, loading, selectedEmail, unreadOnly, pagination, onUnreadOnlyChange, onPageChange, setSelectedEmail, theme }) {
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const unreadCount = emails.filter(e => e.unread).length;

  return (
    <div className={`${selectedEmail ? 'hidden md:flex' : 'flex'} w-full md:w-96 border-r ${theme.border} flex-col`}>
      <div className={`p-3 border-b ${theme.border} shrink-0`}>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => onUnreadOnlyChange(false)}
            className={`flex-1 px-3 py-2 rounded text-sm font-medium transition ${!unreadOnly ? `${theme.button} ${theme.text} shadow-lg` : `${theme.buttonSecondary} ${theme.textSecondary} hover:bg-slate-600`}`}
          >
            All
          </button>
          <button
            onClick={() => onUnreadOnlyChange(true)}
            className={`flex-1 px-3 py-2 rounded text-sm font-medium transition ${unreadOnly ? `${theme.button} ${theme.text} shadow-lg` : `${theme.buttonSecondary} ${theme.textSecondary} hover:bg-slate-600`}`}
          >
            Unread {unreadCount > 0 && <span className={`ml-1 ${unreadOnly ? 'bg-cyan-700' : 'bg-slate-600'} px-1.5 py-0.5 rounded text-xs font-bold`}>{unreadCount}</span>}
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className={`p-8 text-center ${theme.textMuted}`}>Loading...</div>
        ) : emails.length === 0 ? (
          <div className={`p-8 text-center ${theme.textMuted}`}>No emails</div>
        ) : (
          emails.map((email) => (
            <div
              key={email.id}
              onClick={() => setSelectedEmail(email)}
              className={`p-4 border-b ${theme.border} ${theme.hover} cursor-pointer transition ${
                selectedEmail?.id === email.id ? theme.active : email.unread ? theme.card : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 ${theme.buttonSecondary} rounded-full flex items-center justify-center font-bold text-sm border ${theme.border}`}>
                    {email.from[0]?.toUpperCase()}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-medium truncate ${email.unread ? theme.text : theme.textSecondary}`}>
                      {email.from}
                    </span>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className={`text-xs ${theme.textMuted}`}>
                        {formatDate(email.timestamp)}
                      </span>
                      {email.starred && <Star size={14} className="text-yellow-500 fill-yellow-500" />}
                    </div>
                  </div>
                  <div className={`text-sm mb-1 truncate ${email.unread ? `font-medium ${theme.text}` : theme.textSecondary}`}>
                    {email.subject}
                  </div>
                  <div className={`text-sm ${theme.textMuted} truncate`}>{email.preview}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className={`p-3 border-t ${theme.border} flex items-center justify-between shrink-0`}>
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className={`p-2 rounded ${theme.hover} disabled:opacity-50 transition`}
          >
            <ChevronLeft size={18} />
          </button>
          <span className={`text-sm ${theme.textSecondary}`}>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={!pagination.hasMore}
            className={`p-2 rounded ${theme.hover} disabled:opacity-50 transition`}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

function EmailView({ email, onBack, onDelete, onStar, onReply, onReplyAll, onForward, theme }) {
  return (
    <div className={`flex-1 flex flex-col overflow-hidden ${theme.card}`}>
      <div className={`p-4 md:p-6 border-b ${theme.border} shrink-0`}>
        <div className="flex items-start justify-between mb-4">
          <button onClick={onBack} className={`p-2 ${theme.hover} rounded mr-2 md:hidden transition`}>
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className={`text-xl md:text-2xl font-semibold mb-3 ${theme.text}`}>{email.subject}</h2>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${theme.buttonSecondary} rounded-full flex items-center justify-center font-bold border ${theme.border} shrink-0`}>
                {email.from[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className={`font-medium ${theme.text} truncate`}>{email.from}</div>
                <div className={`text-sm ${theme.textSecondary} truncate`}>{email.fromAddress}</div>
              </div>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={onStar} className={`p-2 ${theme.hover} rounded transition`}>
              <Star size={20} className={email.starred ? "text-yellow-500 fill-yellow-500" : ""} />
            </button>
            <button onClick={onDelete} className={`p-2 ${theme.hover} rounded transition`}>
              <Trash2 size={20} />
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onReply} className={`${theme.buttonSecondary} px-4 py-2 rounded text-sm flex items-center gap-2 transition`}>
            <Reply size={16} />
            Reply
          </button>
          <button onClick={onReplyAll} className={`${theme.buttonSecondary} px-4 py-2 rounded text-sm flex items-center gap-2 transition`}>
            <ReplyAll size={16} />
            Reply All
          </button>
          <button onClick={onForward} className={`${theme.buttonSecondary} px-4 py-2 rounded text-sm flex items-center gap-2 transition`}>
            <Forward size={16} />
            Forward
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {email.bodyHTML ? (
          <div dangerouslySetInnerHTML={{ __html: email.bodyHTML }} className={`prose prose-invert max-w-none ${theme.text}`} />
        ) : (
          <pre className={`whitespace-pre-wrap font-sans ${theme.text}`}>{email.bodyText}</pre>
        )}
      </div>
    </div>
  );
}

function ComposeEmail({ onSend, onClose, replyTo, forwardOf, theme }) {
  const [to, setTo] = useState(replyTo ? replyTo.fromAddress : "");
  const [subject, setSubject] = useState(
    replyTo ? `Re: ${replyTo.subject}` : 
    forwardOf ? `Fwd: ${forwardOf.subject}` : 
    ""
  );
  const [body, setBody] = useState(
    replyTo ? `\n\n--- Original Message ---\nFrom: ${replyTo.from}\nSubject: ${replyTo.subject}\n\n${replyTo.bodyText || ""}` :
    forwardOf ? `\n\n--- Forwarded Message ---\nFrom: ${forwardOf.from}\nSubject: ${forwardOf.subject}\n\n${forwardOf.bodyText || ""}` :
    ""
  );

  return (
    <div className={`flex-1 flex flex-col ${theme.card}`}>
      <div className={`p-4 md:p-6 border-b ${theme.border} shrink-0`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">New Message</h2>
          <button onClick={onClose} className={`${theme.textSecondary} ${theme.accentHover} text-2xl transition`}>×</button>
        </div>
        <div className="space-y-3">
          <input
            type="email"
            placeholder="To"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className={`w-full ${theme.input} px-4 py-2 rounded border focus:outline-none transition`}
          />
          <input
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={`w-full ${theme.input} px-4 py-2 rounded border focus:outline-none transition`}
          />
        </div>
      </div>
      <div className="flex-1 p-4 md:p-6 overflow-y-auto">
        <textarea
          placeholder="Write your message..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className={`w-full h-full ${theme.input} p-4 rounded border focus:outline-none resize-none transition`}
        />
      </div>
      <div className={`p-4 md:p-6 border-t ${theme.border} shrink-0`}>
        <div className="flex gap-2">
          <button
            onClick={() => onSend(to, subject, body)}
            className={`${theme.button} px-6 py-2 rounded flex items-center gap-2 font-medium transition`}
          >
            <Send size={18} />
            Send
          </button>
          <button onClick={onClose} className={`${theme.buttonSecondary} px-6 py-2 rounded transition`}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}