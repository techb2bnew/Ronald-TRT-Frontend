import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Allow POST method (since frontend is using POST)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { technicianId } = req.body;

  // Check if technicianId is present in the body
  if (!technicianId || typeof technicianId !== 'string') {
    return res.status(400).json({ error: 'technicianId is required' });
  }

  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
      return res.status(500).json({ error: 'Backend API URL not configured' });
    }

    const token = req.headers.authorization || '';

    // Fetch technician profile from the external API
    const response = await fetch(`${apiBaseUrl}/fetchTechnicianProfile?technicianId=${encodeURIComponent(technicianId)}`, {
      method: 'GET', // The fetch method to the external API is still GET
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

    return res.status(200).json(data); // Return the fetched data to the frontend
  } catch (error) {
    console.error('Error fetching technician profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
