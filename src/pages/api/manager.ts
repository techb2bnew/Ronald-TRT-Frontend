import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    page = '1',
    limit = '10',
    searchQuery = '', // This might be string or string[] based on the request
    roleType = '', // if you use this param as in your frontend
  } = req.query;

  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
      return res.status(500).json({ error: 'Backend API URL not configured' });
    }

    // Ensure searchQuery is a string before calling trim
    let backendUrl = '';
    if (typeof searchQuery === 'string' && searchQuery.trim() !== '') {
      // For search query
      backendUrl = `${apiBaseUrl}/searchTechnicians?searchQuery=${encodeURIComponent(searchQuery)}&roleType=${encodeURIComponent(roleType as string)}`;
    } else {
      // For pagination and fetch all technicians
      backendUrl = `${apiBaseUrl}/fetchManagers?page=${encodeURIComponent(page as string)}&limit=${encodeURIComponent(limit as string)}&roleType=${encodeURIComponent(roleType as string)}`;
    }

    // Forward the GET request to the backend API
    const token = req.headers.authorization || ''; // pass auth header if present

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

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching technicians:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
