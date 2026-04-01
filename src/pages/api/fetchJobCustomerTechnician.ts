// fetchJobCustomerTechnician

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only GET method allowed here as per your fetch example
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { endpoint, ...params } = req.query;

    if (!endpoint || typeof endpoint !== 'string') {
      return res.status(400).json({ error: 'Endpoint parameter is required' });
    }

    // Validate allowed endpoints (optional security)
    const allowedEndpoints = ['fetchCustomer', 'fetchTechnicianJob'];
    if (!allowedEndpoints.includes(endpoint)) {
      return res.status(400).json({ error: 'Invalid endpoint parameter' });
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
      return res.status(500).json({ error: 'Backend API URL not configured' });
    }

    // Build query string from params
    const urlParams = new URLSearchParams();
    for (const key in params) {
      const val = params[key];
      if (Array.isArray(val)) {
        val.forEach(v => urlParams.append(key, v));
      } else if (val) {
        urlParams.append(key, val.toString());
      }
    }

    const backendUrl = `${apiBaseUrl}/${endpoint}${urlParams.toString() ? `?${urlParams.toString()}` : ''}`;

    // Forward authorization header if exists
    const token = req.headers.authorization || '';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = token;
    }

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers,
    });

    if (response.status === 401) {
      // Handle unauthorized (optional)
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();

    // Forward data as-is
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in fetchData API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
