import { useState } from "react";

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");

    try {
      const res = await fetch("https://gpuremail-backend.onrender.com/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("email", email);
        localStorage.setItem("password", password);
        onLogin();
      } else {
        setError("Invalid login credentials.");
      }
    } catch (err) {
      console.error(err);
      setError("Server error.");
    }
  };

  return (
    <div className="flex flex-col items-center p-6 mt-20">
      <h1 className="text-3xl font-bold mb-4">GPureMail Login</h1>

      {error && <p className="text-red-500 mb-2">{error}</p>}

      <input
        className="border p-2 mb-2 w-80"
        placeholder="Email Address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        className="border p-2 mb-2 w-80"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        onClick={handleLogin}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Log In
      </button>
    </div>
  );
}
