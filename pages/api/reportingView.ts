// pages/api/reportingView.ts
import type { NextApiRequest, NextApiResponse } from 'next';

function toSingleString(value: string | string[] | undefined): string {
  if (!value) return '';
  return Array.isArray(value) ? value[0] : value;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
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

    const token = req.headers.authorization || '';

    const backendResponse = await fetch(`${apiBaseUrl}/fetchSingleCustomer?customerId=${encodeURIComponent(customerId)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: token }),
      },
      // no body since it's in query param, or you can add body: JSON.stringify({ customerId }) if backend expects JSON body
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      return res.status(backendResponse.status).json(errorData);
    }

    const data = await backendResponse.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in fetchSingleCustomer API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
