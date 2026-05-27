import type { NextApiRequest, NextApiResponse } from 'next';

function toSingleString(value: string | string[] | undefined): string {
  if (!value) return '';
  return Array.isArray(value) ? value[0] : value;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
      return res.status(500).json({ error: 'Backend API URL not configured' });
    }

    const customerId = toSingleString(req.query.customerId);
    if (!customerId) {
      return res.status(400).json({ error: 'customerId parameter is required' });
    }

    const page = toSingleString(req.query.page) || '1';
    const limit = toSingleString(req.query.limit) || '10';
    const token = req.headers.authorization || '';

    const backendResponse = await fetch(
      `${apiBaseUrl}/fetchCustomerVehicles?customerId=${encodeURIComponent(customerId)}&page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: token }),
        },
      }
    );

    const data = await backendResponse.json().catch(() => ({}));
    if (!backendResponse.ok) {
      return res.status(backendResponse.status).json(data);
    }
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in fetchCustomerVehicles API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
