import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { emailOrPhone } = req.body;

    if (!emailOrPhone || typeof emailOrPhone !== 'string') {
      return res.status(400).json({ error: 'Email or phone is required' });
    }

    // You can add your server-side validation here if needed

    // Forward request to backend API (adjust URL and payload as required)
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone }),
    });

    const contentType = backendResponse.headers.get('content-type') || '';

    let data: any;
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
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
