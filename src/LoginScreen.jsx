import React, { useState } from 'react';

// This is the new component to handle login state and UI
export default function LoginScreen({ onLogin, loading }) {
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const submitLogin = () => {
    onLogin(loginData);
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
