// File: pages/api/reset-password.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { password, token } = req.body;

    if (!password || !token) {
      return res.status(400).json({ error: 'Password and token are required' });
    }

    // Forward the reset password request to your backend
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, token }),
    });

    const contentType = backendResponse.headers.get('content-type') || '';
    let data;

    if (contentType.includes('application/json')) {
      data = await backendResponse.json();
    } else {
      const text = await backendResponse.text();
      console.error('Backend response is not JSON:', text);
      return res.status(backendResponse.status).send(text);
    }

    if (!backendResponse.ok) {
      return res.status(backendResponse.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
