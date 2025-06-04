// pages/api/customer.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    page = '1',
    limit = '10',
    searchQuery = '',
    userId = '',
    roleType = '',
  } = req.query;

  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
      return res.status(500).json({ error: 'Backend API URL not configured' });
    }

    // Build backend URL conditionally (search or normal listing)
    let backendUrl = '';
    if (typeof searchQuery === 'string' && searchQuery.trim() !== '') {
      backendUrl = `${apiBaseUrl}/searchCustomers?userId=${encodeURIComponent(userId as string)}&searchQuery=${encodeURIComponent(searchQuery)}&roleType=${encodeURIComponent(roleType as string)}`;
    } else {
      backendUrl = `${apiBaseUrl}/fetchCustomer?userId=${encodeURIComponent(userId as string)}&page=${encodeURIComponent(page as string)}&limit=${encodeURIComponent(limit as string)}&roleType=${encodeURIComponent(roleType as string)}`;
    }

    // Forward the GET request with Authorization header if present
    const token = req.headers.authorization || '';

    const response = await fetch(backendUrl, {
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

    // If you want, filter out customers with some condition here
    // Example: filter deleted customers if needed (optional)
    // if (data.customers) {
    //   data.customers = data.customers.filter((c: any) => !c.deletedStatus);
    // }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
