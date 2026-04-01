import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
      return res.status(500).json({ error: 'Backend API URL not configured' });
    }

    const token = req.headers.authorization || '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = token;
    }

    const body = req.body;
    if (!body || Object.keys(body).length === 0) {
      return res.status(400).json({ error: 'Missing request body' });
    }

    const backendUrl = `${apiBaseUrl}/singleRecoverRecord`;

    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      return res.status(backendResponse.status).json(errorData);
    }

    const data = await backendResponse.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in singleRecoverRecord API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
