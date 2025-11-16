import React, { useState, useEffect } from 'react';
import { Mail, Send, Inbox, Star, Clock, Trash2, Menu, Search, Settings, Plus, Paperclip, Image, Smile, ChevronLeft, ChevronRight, LogOut, UserPlus } from 'lucide-react';

const API_BASE = "https://gpuremail-backend.onrender.com/api";

export default function GPureMail() {
  const [accounts, setAccounts] = useState([]);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [composing, setComposing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogin, setShowLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [replyMode, setReplyMode] = useState(null);
  const [forwardMode, setForwardMode] = useState(null);

  // ------------------------------
  // Load accounts on startup
  // ------------------------------
  useEffect(() => {
    const stored = localStorage.getItem("gpuremail_accounts");
    if (stored) {
      const accts = JSON.parse(stored);
      setAccounts(accts);
      if (accts.length > 0) {
        setCurrentAccount(accts[0]);
        setShowLogin(false);
        fetchEmails(accts[0]);
      }
    }
  }, []);

  // ------------------------------
  // LOGIN
  // ------------------------------
  const handleLogin = async (credentials) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

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
        fetchEmails(newAccount);
      }
    } catch (err) {
      console.error("Login failed:", err);
    }
    setLoading(false);
  };

  // ------------------------------
  // FETCH EMAILS
  // ------------------------------
  const fetchEmails = async (account) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/emails`, {
        method: "GET",
        headers: {
          "x-email": account.email,
          "x-password": atob(account.password),
        },
      });

      const data = await res.json();
      setEmails(data || []);
    } catch (err) {
      console.error("Fetch failed:", err);
    }
    setLoading(false);
  };

  // ------------------------------
  // MARK AS READ
  // ------------------------------
  const markRead = async (emailObj) => {
    try {
      await fetch(`${API_BASE}/emails/mark-read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-email": currentAccount.email,
          "x-password": atob(currentAccount.password),
        },
        body: JSON.stringify({ uid: emailObj.id }),
      });

      // Update UI instantly
      setEmails((prev) =>
        prev.map((e) =>
          e.id === emailObj.id ? { ...e, unread: false } : e
        )
      );
    } catch (err) {
      console.error("Mark read failed:", err);
    }
  };

  // ------------------------------
  // DELETE EMAIL
  // ------------------------------
  const deleteEmail = async (emailObj) => {
    if (!window.confirm("Delete this email?")) return;

    try {
      await fetch(`${API_BASE}/emails/delete/${emailObj.id}`, {
        method: "DELETE",
        headers: {
          "x-email": currentAccount.email,
          "x-password": atob(currentAccount.password),
        },
      });

      // Update UI instantly
      setEmails((prev) => prev.filter((e) => e.id !== emailObj.id));
      setSelectedEmail(null);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // ------------------------------
  // SWITCH ACCOUNT
  // ------------------------------
  const switchAccount = (account) => {
    setCurrentAccount(account);
    setSelectedEmail(null);
    setComposing(false);
    fetchEmails(account);
  };

  // ------------------------------
  // REMOVE ACCOUNT
  // ------------------------------
  const removeAccount = (accountId) => {
    const updated = accounts.filter((a) => a.id !== accountId);
    setAccounts(updated);
    localStorage.setItem("gpuremail_accounts", JSON.stringify(updated));

    if (currentAccount?.id === accountId) {
      setCurrentAccount(updated[0] || null);
      if (updated[0]) fetchEmails(updated[0]);
      else setShowLogin(true);
    }
  };

  // ------------------------------
  // SEND EMAIL
  // ------------------------------
  const sendEmail = async (to, subject, body) => {
    try {
      await fetch(`${API_BASE}/emails/send`, {
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
      fetchEmails(currentAccount);
    } catch (err) {
      console.error("Send failed:", err);
    }
  };

  // ------------------------------
  // LOGIN UI
  // ------------------------------
  if (showLogin) {
    return <LoginScreen onLogin={handleLogin} loading={loading} />;
  }

  // ------------------------------
  // RENDER MAIN UI
  // ------------------------------
  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      {/* SIDEBAR */}
      <div className={`${sidebarOpen ? "w-64" : "w-16"} bg-zinc-900 border-r border-zinc-800 transition-all duration-300 flex flex-col`}>
        <div className="p-4 flex items-center justify-between border-b border-zinc-800">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-zinc-800 rounded">
            <Menu size={20} />
          </button>
          {sidebarOpen && <h1 className="text-xl font-bold">GPureMail</h1>}
        </div>

        {/* Accounts */}
        {sidebarOpen && accounts.length > 0 && (
          <div className="p-4 border-b border-zinc-800">
            <div className="space-y-2">
              {accounts.map((account) => (
                <div key={account.id} className={`flex items-center gap-2 p-2 rounded ${currentAccount?.id === account.id ? "bg-zinc-800" : "hover:bg-zinc-800"}`}>
                  <button onClick={() => switchAccount(account)} className="flex-1 text-left flex items-center gap-2">
                    <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center text-xs font-bold border border-zinc-600">
                      {account.email[0].toUpperCase()}
                    </div>
                    <span className="text-sm truncate">{account.email}</span>
                  </button>
                  <button onClick={() => removeAccount(account.id)} className="p-1 hover:bg-zinc-700 rounded">
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

        {/* Compose */}
        {sidebarOpen && (
          <div className="px-4 mb-4 mt-4">
            <button onClick={() => { setComposing(true); setReplyMode(null); setForwardMode(null); }} className="w-full bg-zinc-700 hover:bg-zinc-600 text-zinc-100 px-4 py-3 rounded-lg flex items-center gap-2 font-medium">
              <Plus size={20} />
              Compose
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="space-y-1 px-2 flex-1 overflow-y-auto">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-zinc-800 text-left text-zinc-300">
            <Inbox size={20} />
            {sidebarOpen && <span className="flex-1">Inbox</span>}
            {sidebarOpen && emails.filter((e) => e.unread).length > 0 && (
              <span className="bg-zinc-700 text-zinc-100 text-xs px-2 py-1 rounded-full">
                {emails.filter((e) => e.unread).length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col">
        {/* TOP BAR */}
        <TopBar currentAccount={currentAccount} sidebarOpen={sidebarOpen} />

        <div className="flex-1 flex overflow-hidden">

          {/* LIST VIEW */}
          {!composing && !selectedEmail && (
            <EmailList
              emails={emails}
              loading={loading}
              setSelectedEmail={(emailObj) => {
                setSelectedEmail(emailObj);
                markRead(emailObj);
              }}
            />
          )}

          {/* EMAIL VIEW */}
          {selectedEmail && !composing && (
            <EmailView
              email={selectedEmail}
              onBack={() => setSelectedEmail(null)}
              onDelete={() => deleteEmail(selectedEmail)}
              onReply={() => {
                setReplyMode(selectedEmail);
                setComposing(true);
              }}
              onForward={() => {
                setForwardMode(selectedEmail);
                setComposing(true);
              }}
            />
          )}

          {/* COMPOSE */}
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

/* ---------------------------------------------
   COMPONENT: LoginScreen
--------------------------------------------- */
function LoginScreen({ onLogin, loading }) {
  const [loginData, setLoginData] = useState({ email: "", password: "" });

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-lg p-8 w-full max-w-md border border-zinc-800">
        <h1 className="text-3xl font-bold text-zinc-100 mb-2 text-center">GPureMail</h1>
        <p className="text-zinc-400 text-center mb-6 text-sm">Sign in with your PurelyMail account</p>

        <div className="space-y-4">
          <input
            value={loginData.email}
            onChange={(e) =>
              setLoginData({ ...loginData, email: e.target.value })
            }
            type="email"
            placeholder="Email Address"
            className="w-full bg-zinc-800 text-zinc-100 px-4 py-3 rounded border border-zinc-700 focus:outline-none focus:border-zinc-500"
          />
          <input
            value={loginData.password}
            onChange={(e) =>
              setLoginData({ ...loginData, password: e.target.value })
            }
            type="password"
            placeholder="Password"
            className="w-full bg-zinc-800 text-zinc-100 px-4 py-3 rounded border border-zinc-700 focus:outline-none focus:border-zinc-500"
          />

          <button
            onClick={() => onLogin(loginData)}
            disabled={loading}
            className="w-full bg-zinc-700 hover:bg-zinc-600 text-zinc-100 py-3 rounded font-medium disabled:opacity-50 transition-colors"
          >
            {loading ? "Connecting…" : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------
   COMPONENT: TopBar
--------------------------------------------- */
function TopBar({ currentAccount, sidebarOpen }) {
  return (
    <div className="bg-zinc-900 border-b border-zinc-800 p-4">
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="Search mail"
            className="w-full bg-zinc-800 text-zinc-100 pl-10 pr-4 py-2 rounded-lg border border-zinc-700 focus:outline-none focus:border-zinc-500"
          />
        </div>

        {sidebarOpen && currentAccount && (
          <div className="text-sm text-zinc-400">{currentAccount.email}</div>
        )}

        <button className="p-2 hover:bg-zinc-800 rounded">
          <Settings size={20} />
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------
   COMPONENT: EmailList
--------------------------------------------- */
function EmailList({ emails, loading, setSelectedEmail }) {
  return (
    <div className="w-full md:w-96 border-r border-zinc-800 overflow-y-auto">
      {loading ? (
        <div className="p-8 text-center text-zinc-500">Loading...</div>
      ) : emails.length === 0 ? (
        <div className="p-8 text-center text-zinc-500">No emails</div>
      ) : (
        emails.map((email) => (
          <div
            key={email.id}
            onClick={() => setSelectedEmail(email)}
            className={`p-4 border-b border-zinc-800 hover:bg-zinc-900 cursor-pointer ${
              email.unread ? "bg-zinc-900" : ""
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center font-bold text-sm border border-zinc-600">
                  {email.from[0]}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`font-medium ${
                      email.unread ? "text-zinc-100" : "text-zinc-400"
                    }`}
                  >
                    {email.from}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {new Date(email.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <div
                  className={`text-sm mb-1 ${
                    email.unread
                      ? "font-medium text-zinc-200"
                      : "text-zinc-500"
                  }`}
                >
                  {email.subject}
                </div>

                <div className="text-sm text-zinc-600 truncate">
                  {email.preview}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* ---------------------------------------------
   COMPONENT: EmailView
--------------------------------------------- */
function EmailView({ email, onBack, onDelete, onReply, onForward }) {
  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-start justify-between mb-4">
          <button onClick={onBack} className="md:hidden p-2 hover:bg-zinc-800 rounded">
            <ChevronLeft size={20} />
          </button>

          <div className="flex-1">
            <h2 className="text-2xl font-semibold mb-2 text-zinc-100">
              {email.subject}
            </h2>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center font-bold border-zinc-600 border">
                {email.from[0]}
              </div>

              <div>
                <div className="font-medium text-zinc-200">{email.from}</div>
                <div className="text-sm text-zinc-500">
                  {email.fromAddress}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={onDelete} className="p-2 hover:bg-zinc-800 rounded">
              <Trash2 size={20} className="text-zinc-500" />
            </button>
          </div>
        </div>

        <div className="text-sm text-zinc-500">
          {new Date(email.timestamp).toLocaleString()}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-6 text-zinc-300 leading-relaxed overflow-y-auto">
        {email.bodyHTML ? (
          <div
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: email.bodyHTML }}
          />
        ) : (
          <pre className="whitespace-pre-wrap">{email.bodyText}</pre>
        )}
      </div>

      {/* Actions */}
      <div className="p-6 border-t border-zinc-800 flex gap-2">
        <button
          onClick={onReply}
          className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded flex items-center gap-2"
        >
          <ChevronLeft size={16} />
          Reply
        </button>

        <button
          onClick={onForward}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded flex items-center gap-2"
        >
          <ChevronRight size={16} />
          Forward
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------
   COMPONENT: ComposeEmail
--------------------------------------------- */
function ComposeEmail({ onSend, onClose, replyTo, forwardOf }) {
  const [to, setTo] = useState(
    replyTo ? replyTo.fromAddress : ""
  );
  const [subject, setSubject] = useState(
    replyTo
      ? `Re: ${replyTo.subject}`
      : forwardOf
      ? `Fwd: ${forwardOf.subject}`
      : ""
  );
  const [body, setBody] = useState(() => {
    if (replyTo) {
      return `\n\n----- Original message -----\n${replyTo.bodyText || ""}`;
    }

    if (forwardOf) {
      return `\n\n----- Forwarded message -----\n${forwardOf.bodyText || ""}`;
    }

    return "";
  });

  return (
    <div className="flex-1 flex flex-col bg-zinc-900 m-4 rounded-lg overflow-hidden border border-zinc-800">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-100">New Message</h3>
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-100 text-2xl">
          ×
        </button>
      </div>

      {/* To */}
      <div className="border-b border-zinc-800">
        <input
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="To"
          className="w-full bg-transparent px-4 py-3 text-zinc-100 focus:outline-none"
        />
      </div>

      {/* Subject */}
      <div className="border-b border-zinc-800">
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          className="w-full bg-transparent px-4 py-3 text-zinc-100 focus:outline-none"
        />
      </div>

      {/* Body */}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Compose your email…"
        className="flex-1 bg-transparent px-4 py-3 text-zinc-100 focus:outline-none resize-none"
      />

      {/* Footer */}
      <div className="p-4 border-t border-zinc-800 flex items-center justify-between">
        <div className="flex gap-2">
          <button className="p-2 hover:bg-zinc-800 rounded text-zinc-400">
            <Paperclip size={20} />
          </button>
          <button className="p-2 hover:bg-zinc-800 rounded text-zinc-400">
            <Image size={20} />
          </button>
          <button className="p-2 hover:bg-zinc-800 rounded text-zinc-400">
            <Smile size={20} />
          </button>
        </div>

        <button
          onClick={() => onSend(to, subject, body)}
          className="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 rounded flex items-center gap-2 font-medium text-zinc-100"
        >
          <Send size={16} />
          Send
        </button>
      </div>
    </div>
  );
}
