// pages/api/importActiveJob.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
      return res.status(500).json({ error: 'Backend API URL not configured' });
    }

    const token = req.headers.authorization || '';

    // Forward POST body as JSON to backend API
    const response = await fetch(`${apiBaseUrl}/importActiveJob`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: token } : {}),
      },
      body: JSON.stringify(req.body),
    });

    const text = await response.text();

    try {
      const data = JSON.parse(text);
      if (!response.ok) {
        return res.status(response.status).json(data);
      }
      return res.status(200).json(data);
    } catch {
      // Backend returned non-JSON (HTML error page maybe)
      return res.status(response.ok ? 200 : 500).json({ error: 'Backend API returned invalid JSON', details: text });
    }
  } catch (error) {
    console.error('Error in importActiveJob API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
