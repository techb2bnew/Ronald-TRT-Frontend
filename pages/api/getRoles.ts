// pages/api/getRoles.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
      return res.status(500).json({ error: 'Backend API URL not configured' });
    }

    const token = req.headers.authorization || '';

    const response = await fetch(`${apiBaseUrl}/getRoles`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: token } : {}),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();

    // Optional: filter out 'super admin' here, or do it on client side
    if (data.roles) {
      data.roles = data.roles.filter((role: any) => role.name.toLowerCase() !== 'super admin');
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
