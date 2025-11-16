import React, { useState, useEffect } from 'react';
import { Send, Star, Trash2, Menu, Search, Settings, Plus, Paperclip, ChevronLeft, ChevronRight, LogOut, UserPlus, FolderOpen, RefreshCw, X } from 'lucide-react';

const API_BASE = "https://gpuremail-backend.onrender.com";

export default function GPureMail() {
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
  const [theme, setTheme] = useState(localStorage.getItem('gpuremail_theme') || 'grey');

  useEffect(() => {
    const stored = localStorage.getItem("gpuremail_accounts");
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
        localStorage.setItem("gpuremail_accounts", JSON.stringify(updated));
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
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
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
    localStorage.setItem("gpuremail_accounts", JSON.stringify(updated));
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

  const sendEmail = async (to, subject, body, options = {}) => {
    try {
      await fetch(`${API_BASE}/api/emails/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-email": currentAccount.email,
          "x-password": atob(currentAccount.password),
        },
        body: JSON.stringify({ 
          to, 
          subject, 
          body,
          priority: options.priority,
          requestReceipt: options.requestReceipt
        }),
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
    localStorage.setItem('gpuremail_theme', newTheme);
  };

  const getThemeColors = () => {
    switch(theme) {
      case 'navy': return 'from-zinc-900 to-blue-950';
      case 'red': return 'from-zinc-900 to-red-950';
      default: return '';
    }
  };

  if (showLogin) {
    return <LoginScreen onLogin={handleLogin} onCancel={() => setShowLogin(false)} loading={loading} error={error} hasAccounts={accounts.length > 0} />;
  }

  if (showSettings) {
    return <SettingsScreen theme={theme} onThemeChange={changeTheme} onClose={() => setShowSettings(false)} />;
  }

  return (
    <div className={`flex h-screen bg-zinc-950 text-zinc-100 bg-gradient-to-br ${getThemeColors()}`}>
      {sidebarOpen && window.innerWidth <= 768 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      <div className={`${sidebarOpen ? 'w-64' : 'w-0 md:w-16'} fixed md:relative z-50 h-full bg-zinc-900 border-r border-zinc-800 transition-all duration-300 flex flex-col overflow-hidden`}>
        <div className="p-4 flex items-center justify-between border-b border-zinc-800 shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-zinc-800 rounded">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          {sidebarOpen && <h1 className="text-xl font-bold">GPureMail</h1>}
        </div>

        {sidebarOpen && accounts.length > 0 && (
          <div className="p-4 border-b border-zinc-800 shrink-0">
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {accounts.map((account) => (
                <div key={account.id} className={`flex items-center gap-2 p-2 rounded ${currentAccount?.id === account.id ? "bg-zinc-800" : "hover:bg-zinc-800"}`}>
                  <button onClick={() => switchAccount(account)} className="flex-1 text-left flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center text-xs font-bold border border-zinc-600 shrink-0">
                      {account.email[0].toUpperCase()}
                    </div>
                    <span className="text-sm truncate">{account.email}</span>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); removeAccount(account.id); }} className="p-1 hover:bg-zinc-700 rounded shrink-0">
                    <LogOut size={14} />
                  </button>
                </div>
              ))}
              <button onClick={() => setShowLogin(true)} className="w-full flex items-center gap-2 p-2 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded">
                <UserPlus size={16} />
                Add Account
              </button>
            </div>
          </div>
        )}

        {sidebarOpen && (
          <div className="px-4 mb-4 mt-4 shrink-0">
            <button onClick={() => { setComposing(true); setReplyMode(null); setForwardMode(null); if (window.innerWidth <= 768) setSidebarOpen(false); }} className="w-full bg-zinc-700 hover:bg-zinc-600 text-zinc-100 px-4 py-3 rounded-lg flex items-center gap-2 font-medium">
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
              className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left ${selectedFolder === folder.name ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-300 hover:bg-zinc-800'}`}
            >
              <FolderOpen size={18} />
              {sidebarOpen && <span className="flex-1 text-sm truncate">{folder.name}</span>}
            </button>
          ))}
        </nav>

        {sidebarOpen && (
          <div className="p-4 border-t border-zinc-800 shrink-0">
            <button onClick={() => setShowSettings(true)} className="w-full flex items-center gap-2 p-2 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded">
              <Settings size={16} />
              Settings
            </button>
            <button onClick={() => { setPagination({ page: 1, totalPages: 1, hasMore: false }); fetchEmails(currentAccount, selectedFolder, 1); }} className="w-full flex items-center gap-2 p-2 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded mt-2">
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar currentAccount={currentAccount} sidebarOpen={sidebarOpen} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {error && (
          <div className="bg-red-900 border-b border-red-700 p-4 text-sm flex justify-between items-center">
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

function LoginScreen({ onLogin, onCancel, loading, error, hasAccounts }) {
  const [loginData, setLoginData] = useState({ email: "", password: "" });

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-lg p-8 w-full max-w-md border border-zinc-800">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-100 mb-2">GPureMail</h1>
            <p className="text-zinc-400 text-sm">Sign in with PurelyMail</p>
          </div>
          {hasAccounts && (
            <button onClick={onCancel} className="text-zinc-400 hover:text-zinc-100 text-2xl">×</button>
          )}
        </div>
        
        {error && <div className="bg-red-900 text-red-100 p-3 rounded mb-4 text-sm">{error}</div>}
        
        <div className="space-y-4">
          <input
            value={loginData.email}
            onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
            type="email"
            placeholder="Email Address"
            disabled={loading}
            className="w-full bg-zinc-800 text-zinc-100 px-4 py-3 rounded border border-zinc-700 focus:outline-none focus:border-zinc-500 disabled:opacity-50"
          />
          <input
            value={loginData.password}
            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
            type="password"
            placeholder="Password"
            disabled={loading}
            onKeyPress={(e) => e.key === 'Enter' && !loading && onLogin(loginData)}
            className="w-full bg-zinc-800 text-zinc-100 px-4 py-3 rounded border border-zinc-700 focus:outline-none focus:border-zinc-500 disabled:opacity-50"
          />
          <button
            onClick={() => onLogin(loginData)}
            disabled={loading}
            className="w-full bg-zinc-700 hover:bg-zinc-600 text-zinc-100 py-3 rounded font-medium disabled:opacity-50 transition-colors"
          >
            {loading ? "Connecting..." : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsScreen({ theme, onThemeChange, onClose }) {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-lg p-8 w-full max-w-md border border-zinc-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Settings</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-100 text-3xl leading-none">×</button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Theme</label>
            <div className="space-y-2">
              {[
                { id: 'grey', name: 'Dark Grey (Default)', gradient: 'from-zinc-800 to-zinc-900' },
                { id: 'navy', name: 'Navy Blue', gradient: 'from-zinc-800 to-blue-950' },
                { id: 'red', name: 'Deep Red', gradient: 'from-zinc-800 to-red-950' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => onThemeChange(t.id)}
                  className={`w-full p-3 rounded border ${theme === t.id ? 'border-zinc-500 bg-zinc-800' : 'border-zinc-700 bg-zinc-900'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 bg-gradient-to-br ${t.gradient} rounded`}></div>
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

function TopBar({ currentAccount, sidebarOpen, onMenuClick }) {
  return (
    <div className="bg-zinc-900 border-b border-zinc-800 p-4 shrink-0">
      <div className="flex items-center gap-4">
        {!sidebarOpen && (
          <button onClick={onMenuClick} className="p-2 hover:bg-zinc-800 rounded md:hidden">
            <Menu size={20} />
          </button>
        )}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="Search mail"
            className="w-full bg-zinc-800 text-zinc-100 pl-10 pr-4 py-2 rounded-lg border border-zinc-700 focus:outline-none focus:border-zinc-500"
          />
        </div>
        {currentAccount && (
          <div className="text-sm text-zinc-400 hidden sm:block">{currentAccount.email}</div>
        )}
      </div>
    </div>
  );
}

function EmailList({ emails, loading, selectedEmail, unreadOnly, pagination, onUnreadOnlyChange, onPageChange, setSelectedEmail }) {
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

  const formatFullDate = (timestamp) => {
    return new Date(timestamp).toLocaleString([], { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const unreadCount = emails.filter(e => e.unread).length;

  return (
    <div className={`${selectedEmail ? 'hidden md:flex' : 'flex'} w-full md:w-96 border-r border-zinc-800 flex-col`}>
      <div className="p-3 border-b border-zinc-800 shrink-0">
        <div className="flex gap-2 items-center">
          <button
            onClick={() => onUnreadOnlyChange(false)}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${!unreadOnly ? 'bg-zinc-700 text-zinc-100' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
          >
            All
          </button>
          <button
            onClick={() => onUnreadOnlyChange(true)}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${unreadOnly ? 'bg-zinc-700 text-zinc-100' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
          >
            Unread {unreadCount > 0 && <span className="ml-1 bg-zinc-600 px-1.5 py-0.5 rounded text-xs">{unreadCount}</span>}
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-zinc-500">Loading...</div>
        ) : emails.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">No emails</div>
        ) : (
          emails.map((email) => (
            <div
              key={email.id}
              onClick={() => setSelectedEmail(email)}
              className={`p-4 border-b border-zinc-800 hover:bg-zinc-900 cursor-pointer transition-colors ${
                selectedEmail?.id === email.id ? 'bg-zinc-800' : email.unread ? 'bg-zinc-900' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center font-bold text-sm border border-zinc-600">
                    {email.from[0]?.toUpperCase()}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-medium truncate ${email.unread ? "text-zinc-100" : "text-zinc-400"}`}>
                      {email.from}
                    </span>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-xs text-zinc-500" title={formatFullDate(email.timestamp)}>
                        {formatDate(email.timestamp)}
                      </span>
                      {email.starred && <Star size={14} className="text-yellow-500 fill-yellow-500" />}
                    </div>
                  </div>
                  <div className={`text-sm mb-1 truncate ${email.unread ? "font-medium text-zinc-200" : "text-zinc-500"}`}>
                    {email.subject}
                  </div>
                  <div className="text-sm text-zinc-600 truncate">{email.preview}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function EmailView({ email, onBack, onDelete, onStar, onReply, onReplyAll, onForward }) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-zinc-900">
      <div className="p-4 md:p-6 border-b border-zinc-800 shrink-0 bg-zinc-900">
        <div className="flex items-start justify-between mb-4">
          <button onClick={onBack} className="p-2 hover:bg-zinc-800 rounded mr-2 md:hidden">
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl md:text-2xl font-semibold mb-3 text-zinc-100">{email.subject}</h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center font-bold border-zinc-600 border shrink-0">
                {email.from[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-medium text-zinc-200 truncate">{email.from}</div>
                <div className="text-sm text-zinc-500 truncate">{email.fromAddress}</div>
              </div>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={onStar} className="p-2