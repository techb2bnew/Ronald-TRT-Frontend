import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { customerId } = req.body;

  if (!customerId) {
    return res.status(400).json({ error: 'customerId is required' });
  }

  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
      return res.status(500).json({ error: 'Backend API URL not configured' });
    }

    const token = req.headers.authorization || '';

    const response = await fetch(`${apiBaseUrl}/fetchSingleCustomer?customerId=${encodeURIComponent(customerId)}`, {
      method: 'POST',
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

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching single customer:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
