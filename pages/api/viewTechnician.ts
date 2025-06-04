// pages/api/viewTechnician.ts
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

    const { technicianId } = req.body;
    if (!technicianId) {
      return res.status(400).json({ error: 'technicianId is required' });
    }

    const token = req.headers.authorization || '';

    const response = await fetch(`${apiBaseUrl}/fetchSingleTechnician?technicianId=${encodeURIComponent(technicianId)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: token } : {}),
      },
      // No body needed as param is in query string, but keep empty for POST
      body: JSON.stringify({ technicianId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching single technician:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
