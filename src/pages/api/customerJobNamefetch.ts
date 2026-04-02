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

  const rawPage = req.query.page;
  const rawLimit = req.query.limit;
  const rawSearch = req.query.searchQuery;
  const page = Array.isArray(rawPage) ? rawPage[0] : rawPage;
  const limit = Array.isArray(rawLimit) ? rawLimit[0] : rawLimit;
  const searchQuery = Array.isArray(rawSearch) ? rawSearch[0] : rawSearch;

  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
      return res.status(500).json({ error: 'Backend API URL not configured' });
    }

    const params = new URLSearchParams();
    params.set('customerId', customerId);
    if (page) params.set('page', String(page));
    if (limit) params.set('limit', String(limit));
    if (searchQuery && String(searchQuery).trim()) {
      params.set('searchQuery', String(searchQuery).trim());
    }

    const token = req.headers.authorization || '';
    const response = await fetch(`${apiBaseUrl}/fetchCustomerJobs?${params.toString()}`, {
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
