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

    const { technicianId, accountStatus } = req.body;

    if (!technicianId || typeof accountStatus !== 'boolean') {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    const token = req.headers.authorization || '';

    const response = await fetch(`${apiBaseUrl}/updateTechnicianAccountStatus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: token } : {}),
      },
      body: JSON.stringify({ technicianId, accountStatus }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error updating technician account status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
