// pages/api/customerJobNamefetch.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Access customerId from query, not from body for GET requests
  let { customerId } = req.query;

  // If customerId is an array, get the first value
  if (Array.isArray(customerId)) {
    customerId = customerId[0];
  }

  // Validate that customerId is a string
  if (!customerId || typeof customerId !== 'string') {
    return res.status(400).json({ error: 'customerId is required and must be a string' });
  }

  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
      return res.status(500).json({ error: 'Backend API URL not configured' });
    }

    const token = req.headers.authorization || '';
    const response = await fetch(`${apiBaseUrl}/fetchCustomerJobs?customerId=${encodeURIComponent(customerId)}`, {
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
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching customer job data:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
