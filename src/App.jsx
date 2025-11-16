import { useEffect, useState } from "react";
import LoginScreen from "./LoginScreen";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showComposer, setShowComposer] = useState(false);

  const email = localStorage.getItem("email");
  const password = localStorage.getItem("password");

  useEffect(() => {
    if (email && password) {
      setLoggedIn(true);
      loadInbox();
    }
  }, []);

  const loadInbox = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://gpuremail-backend.onrender.com/api/emails", {
        headers: {
          "x-email": email,
          "x-password": password,
        },
      });

      const data = await res.json();
      setEmails(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const sendEmail = async (to, subject, body) => {
    const res = await fetch("https://gpuremail-backend.onrender.com/api/emails/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-email": email,
        "x-password": password,
      },
      body: JSON.stringify({ to, subject, body }),
    });

    const data = await res.json();
    if (data.success) {
      alert("Email sent!");
      setShowComposer(false);
      loadInbox();
    } else {
      alert("Failed to send email.");
    }
  };

  if (!loggedIn) {
    return <LoginScreen onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Inbox</h1>

      <button
        onClick={() => setShowComposer(true)}
        className="bg-green-600 text-white px-4 py-2 rounded mb-4"
      >
        Compose
      </button>

      {loading ? <p>Loading...</p> : null}

      <ul className="space-y-3">
        {emails.map((email) => (
          <li
            key={email.id}
            className="border p-3 rounded shadow bg-white"
          >
            <p className="font-semibold">{email.subject}</p>
            <p className="text-sm text-gray-500">{email.from}</p>
            <p className="text-xs text-gray-400">{email.date}</p>
          </li>
        ))}
      </ul>

      {showComposer && (
        <Composer
          onClose={() => setShowComposer(false)}
          onSend={sendEmail}
        />
      )}
    </div>
  );
}

// --------------------------------------------------
// Email Composer Component
// --------------------------------------------------
function Composer({ onClose, onSend }) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
      <div className="bg-white p-6 rounded shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4">New Email</h2>

        <input
          className="border p-2 w-full mb-2"
          placeholder="To:"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />

        <input
          className="border p-2 w-full mb-2"
          placeholder="Subject:"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />

        <textarea
          className="border p-2 w-full mb-2 h-32"
          placeholder="Message body..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />

        <div className="flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded"
          >
            Cancel
          </button>

          <button
            onClick={() => onSend(to, subject, body)}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
