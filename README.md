# Voyage Email Client

A modern, beautiful space-themed email client built with React. Designed for limitless communication.

## Features

- 🌌 Beautiful space-themed UI with multiple dark themes
- 📧 Multi-account support
- 📂 Full folder management
- ⭐ Star/flag emails
- 🔍 Fast and responsive
- 📱 Mobile-friendly design
- 🎨 4 stunning themes: Voyage (default), Midnight Blue, Ember, Forest

## Quick Start

### Frontend Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your backend URL:
   ```
   VITE_API_BASE=https://your-backend-url.com
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Backend Setup

1. Navigate to backend directory
2. Install dependencies:
   ```bash
   npm install
   ```

3. Update `server.js` with your IMAP/SMTP settings (default: PurelyMail)

4. Start the backend:
   ```bash
   npm start
   ```

## Configuration

### IMAP/SMTP Settings

Edit `server.js` to change email provider settings:

```javascript
const IMAP_HOST = 'imap.your-provider.com';
const IMAP_PORT = 993;
const SMTP_HOST = 'smtp.your-provider.com';
const SMTP_PORT = 587;
```

### Themes

Voyage includes 4 built-in themes. Change theme in Settings or modify `THEMES` object in `App.jsx`.

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Node.js, Express, node-imap, nodemailer
- **Icons**: Lucide React

## License

MIT

## Contributing

Pull requests welcome! Please ensure code follows existing style and includes appropriate error handling.