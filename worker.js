// Cloudflare Worker for GPureMail (PurelyMail Client)
// Stateless - credentials sent with each request from browser

import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import nodemailer from 'nodemailer';

const IMAP_HOST = 'imap.purelymail.com';
const IMAP_PORT = 993;
const SMTP_HOST = 'smtp.purelymail.com';
const SMTP_PORT = 587;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      let response;

      if (path === '/api/auth/verify' && request.method === 'POST') {
        response = await handleVerify(request);
      } else if (path === '/api/emails' && request.method === 'POST') {
        response = await handleFetchEmails(request);
      } else if (path === '/api/emails/send' && request.method === 'POST') {
        response = await handleSendEmail(request);
      } else {
        response = new Response(JSON.stringify({ error: 'Not found' }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

async function handleVerify(request) {
  const { email, password } = await request.json();
  
  try {
    const connection = await imaps.connect({
      imap: {
        user: email,
        password: password,
        host: IMAP_HOST,
        port: IMAP_PORT,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
      }
    });

    await connection.openBox('INBOX');
    await connection.end();

    return new Response(JSON.stringify({ 
      success: true
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Authentication failed'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleFetchEmails(request) {
  const { email, password } = await request.json();

  try {
    const connection = await imaps.connect({
      imap: {
        user: email,
        password: password,
        host: IMAP_HOST,
        port: IMAP_PORT,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
      }
    });

    await connection.openBox('INBOX');

    const searchCriteria = ['ALL'];
    const fetchOptions = {
      bodies: ['HEADER', 'TEXT'],
      struct: true
    };

    const messages = await connection.search(searchCriteria, fetchOptions);
    
    const emails = await Promise.all(messages.slice(-50).reverse().map(async (item) => {
      const header = item.parts.find(part => part.which === 'HEADER');
      const body = item.parts.find(part => part.which === 'TEXT');
      
      const parsed = await simpleParser(header.body);
      const bodyParsed = await simpleParser(body?.body || '');

      return {
        id: item.attributes.uid,
        from: parsed.from?.text || 'Unknown',
        email: parsed.from?.value?.[0]?.address || '',
        subject: parsed.subject || '(no subject)',
        preview: bodyParsed.text?.substring(0, 100) || '',
        body: bodyParsed.text || bodyParsed.html || '',
        time: formatDate(parsed.date),
        unread: !item.attributes.flags.includes('\\Seen'),
        starred: item.attributes.flags.includes('\\Flagged')
      };
    }));

    await connection.end();

    return new Response(JSON.stringify({ emails }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleSendEmail(request) {
  const { email, password, to, subject, body } = await request.json();

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: false,
      auth: {
        user: email,
        pass: password
      }
    });

    await transporter.sendMail({
      from: email,
      to,
      subject,
      text: body
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function formatDate(date) {
  if (!date) return '';
  const now = new Date();
  const emailDate = new Date(date);
  const diffMs = now - emailDate;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return emailDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return emailDate.toLocaleDateString('en-US', { weekday: 'short' });
  } else {
    return emailDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
