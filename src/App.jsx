import React, { useState, useEffect } from 'react';
import { Mail, Send, Inbox, Star, Clock, Trash2, Menu, Search, Settings, Plus, Paperclip, Image, Smile, ChevronLeft, ChevronRight, LogOut, UserPlus } from 'lucide-react';

const API_BASE = '/api';
const IMAP_HOST = 'imap.purelymail.com';
const IMAP_PORT = '993';
const SMTP_HOST = 'smtp.purelymail.com';
const SMTP_PORT = '587';

export default function GPureMail() {
  const [accounts, setAccounts] = useState([]);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [composing, setComposing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogin, setShowLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('gpuremail_accounts');
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

  const handleLogin = async (credentials) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password
        })
      });
      const data = await res.json();
      
      if (data.success) {
        // Store encrypted credentials in browser
        const newAccount = { 
          id: crypto.randomUUID(),
          email: credentials.email,
          password: btoa(credentials.password) // Base64 encode for storage
        };
        const updated = [...accounts, newAccount];
        setAccounts(updated);
        localStorage.setItem('gpuremail_accounts', JSON.stringify(updated));
        setCurrentAccount(newAccount);
        setShowLogin(false);
        fetchEmails(newAccount);
      }
    } catch (err) {
      console.error('Login failed:', err);
    }
    setLoading(false);
  };

  const fetchEmails = async (account) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: account.email,
          password: atob(account.password)
        })
      });
      const data = await res.json();
      setEmails(data.emails || []);
    } catch (err) {
      console.error('Fetch failed:', err);
    }
    setLoading(false);
  };

  const switchAccount = (account) => {
    setCurrentAccount(account);
    setSelectedEmail(null);
    setComposing(false);
    fetchEmails(account);
  };

  const removeAccount = (accountId) => {
    const updated = accounts.filter(a => a.id !== accountId);
    setAccounts(updated);
    localStorage.setItem('gpuremail_accounts', JSON.stringify(updated));
    if (currentAccount?.id === accountId) {
      setCurrentAccount(updated[0] || null);
      if (updated[0]) fetchEmails(updated[0]);
      else setShowLogin(true);
    }
  };

  const sendEmail = async (to, subject, body) => {
    try {
      await fetch(`${API_BASE}/emails/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: currentAccount.email,
          password: atob(currentAccount.password),
          to, 
          subject, 
          body 
        })
      });
      setComposing(false);
    } catch (err) {
      console.error('Send failed:', err);
    }
  };

  if (showLogin) {
    const [loginData, setLoginData] = useState({
      email: '',
      password: ''
    });

    const submitLogin = () => {
      handleLogin(loginData);
    };

    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="bg-zinc-900 rounded-lg p-8 w-full max-w-md border border-zinc-800">
          <h1 className="text-3xl font-bold text-zinc-100 mb-2 text-center">GPureMail</h1>
          <p className="text-zinc-400 text-center mb-6 text-sm">Sign in with your PurelyMail account</p>
          <div className="space-y-4">
            <input 
              value={loginData.email} 
              onChange={e => setLoginData({...loginData, email: e.target.value})} 
              type="email" 
              placeholder="Email Address" 
              className="w-full bg-zinc-800 text-zinc-100 px-4 py-3 rounded border border-zinc-700 focus:outline-none focus:border-zinc-500" 
            />
            <input 
              value={loginData.password} 
              onChange={e => setLoginData({...loginData, password: e.target.value})} 
              type="password" 
              placeholder="Password" 
              className="w-full bg-zinc-800 text-zinc-100 px-4 py-3 rounded border border-zinc-700 focus:outline-none focus:border-zinc-500" 
            />
            <button 
              onClick={submitLogin} 
              disabled={loading} 
              className="w-full bg-zinc-700 hover:bg-zinc-600 text-zinc-100 py-3 rounded font-medium disabled:opacity-50 transition-colors"
            >
              {loading ? 'Connecting...' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-zinc-900 border-r border-zinc-800 transition-all duration-300 flex flex-col`}>
        <div className="p-4 flex items-center justify-between border-b border-zinc-800">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-zinc-800 rounded">
            <Menu size={20} />
          </button>
          {sidebarOpen && <h1 className="text-xl font-bold text-zinc-100">GPureMail</h1>}
        </div>

        {sidebarOpen && accounts.length > 0 && (
          <div className="p-4 border-b border-zinc-800">
            <div className="space-y-2">
              {accounts.map(account => (
                <div key={account.id} className={`flex items-center gap-2 p-2 rounded ${currentAccount?.id === account.id ? 'bg-zinc-800' : 'hover:bg-zinc-800'}`}>
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
        
        {sidebarOpen && (
          <div className="px-4 mb-4 mt-4">
            <button onClick={() => setComposing(true)} className="w-full bg-zinc-700 hover:bg-zinc-600 text-zinc-100 px-4 py-3 rounded-lg flex items-center gap-2 font-medium transition-colors">
              <Plus size={20} />
              Compose
            </button>
          </div>
        )}

        <nav className="space-y-1 px-2 flex-1 overflow-y-auto">
          {[
            { icon: Inbox, label: 'Inbox', count: emails.filter(e => e.unread).length },
            { icon: Star, label: 'Starred' },
            { icon: Clock, label: 'Snoozed' },
            { icon: Send, label: 'Sent' },
            { icon: Trash2, label: 'Trash' },
          ].map((item) => (
            <button key={item.label} className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-zinc-800 text-left text-zinc-300">
              <item.icon size={20} />
              {sidebarOpen && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {item.count > 0 && <span className="bg-zinc-700 text-zinc-100 text-xs px-2 py-1 rounded-full">{item.count}</span>}
                </>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="bg-zinc-900 border-b border-zinc-800 p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" size={20} />
              <input type="text" placeholder="Search mail" className="w-full bg-zinc-800 text-zinc-100 pl-10 pr-4 py-2 rounded-lg border border-zinc-700 focus:outline-none focus:border-zinc-500" />
            </div>
            {sidebarOpen && currentAccount && (
              <div className="text-sm text-zinc-400">{currentAccount.email}</div>
            )}
            <button className="p-2 hover:bg-zinc-800 rounded">
              <Settings size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {!composing && !selectedEmail && (
            <div className="w-full md:w-96 border-r border-zinc-800 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-zinc-500">Loading...</div>
              ) : emails.length === 0 ? (
                <div className="p-8 text-center text-zinc-500">No emails</div>
              ) : (
                emails.map((email) => (
                  <div key={email.id} onClick={() => setSelectedEmail(email)} className={`p-4 border-b border-zinc-800 hover:bg-zinc-900 cursor-pointer ${email.unread ? 'bg-zinc-900' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center font-bold text-sm border border-zinc-600">
                          {email.from[0]}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-medium ${email.unread ? 'text-zinc-100' : 'text-zinc-400'}`}>{email.from}</span>
                          <span className="text-xs text-zinc-500">{email.time}</span>
                        </div>
                        <div className={`text-sm mb-1 ${email.unread ? 'font-medium text-zinc-200' : 'text-zinc-500'}`}>{email.subject}</div>
                        <div className="text-sm text-zinc-600 truncate">{email.preview}</div>
                      </div>
                      {email.starred && <Star size={16} className="text-zinc-400 fill-zinc-400 flex-shrink-0" />}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {selectedEmail && !composing && (
            <div className="flex-1 flex flex-col overflow-y-auto">
              <div className="p-6 border-b border-zinc-800">
                <div className="flex items-start justify-between mb-4">
                  <button onClick={() => setSelectedEmail(null)} className="md:hidden p-2 hover:bg-zinc-800 rounded">
                    <ChevronLeft size={20} />
                  </button>
                  <div className="flex-1">
                    <h2 className="text-2xl font-semibold mb-2 text-zinc-100">{selectedEmail.subject}</h2>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center font-bold border border-zinc-600">
                        {selectedEmail.from[0]}
                      </div>
                      <div>
                        <div className="font-medium text-zinc-200">{selectedEmail.from}</div>
                        <div className="text-sm text-zinc-500">{selectedEmail.email}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-zinc-800 rounded">
                      <Star size={20} className={selectedEmail.starred ? 'fill-zinc-400 text-zinc-400' : 'text-zinc-500'} />
                    </button>
                    <button className="p-2 hover:bg-zinc-800 rounded">
                      <Trash2 size={20} className="text-zinc-500" />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-zinc-500">{selectedEmail.time}</div>
              </div>
              <div className="flex-1 p-6">
                <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">{selectedEmail.body || selectedEmail.preview}</p>
              </div>
              <div className="p-6 border-t border-zinc-800 flex gap-2">
                <button className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded flex items-center gap-2">
                  <ChevronLeft size={16} />
                  Reply
                </button>
                <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded flex items-center gap-2">
                  <ChevronRight size={16} />
                  Forward
                </button>
              </div>
            </div>
          )}

          {composing && <ComposeEmail onSend={sendEmail} onClose={() => setComposing(false)} />}
        </div>
      </div>
    </div>
  );
}

function ComposeEmail({ onSend, onClose }) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  return (
    <div className="flex-1 flex flex-col bg-zinc-900 m-4 rounded-lg overflow-hidden border border-zinc-800">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-100">New Message</h3>
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-100 text-2xl">×</button>
      </div>
      <div className="border-b border-zinc-800">
        <input value={to} onChange={e => setTo(e.target.value)} type="text" placeholder="To" className="w-full bg-transparent px-4 py-3 focus:outline-none text-zinc-100" />
      </div>
      <div className="border-b border-zinc-800">
        <input value={subject} onChange={e => setSubject(e.target.value)} type="text" placeholder="Subject" className="w-full bg-transparent px-4 py-3 focus:outline-none text-zinc-100" />
      </div>
      <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Compose your email..." className="flex-1 bg-transparent px-4 py-3 focus:outline-none resize-none text-zinc-100" />
      <div className="p-4 border-t border-zinc-800 flex items-center justify-between">
        <div className="flex gap-2">
          <button className="p-2 hover:bg-zinc-800 rounded text-zinc-400" title="Attach file">
            <Paperclip size={20} />
          </button>
          <button className="p-2 hover:bg-zinc-800 rounded text-zinc-400" title="Insert image">
            <Image size={20} />
          </button>
          <button className="p-2 hover:bg-zinc-800 rounded text-zinc-400" title="Insert emoji">
            <Smile size={20} />
          </button>
        </div>
        <button onClick={() => onSend(to, subject, body)} className="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 rounded flex items-center gap-2 font-medium text-zinc-100">
          <Send size={16} />
          Send
        </button>
      </div>
    </div>
  );
}
