// pages/api/technician.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    page = '1',
    limit = '10',
    searchQuery = '',
    types = '', // if you use this param as in your frontend
  } = req.query;

  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
      return res.status(500).json({ error: 'Backend API URL not configured' });
    }

    // Compose backend endpoint URL based on presence of searchQuery
    let backendUrl = '';
    if (typeof searchQuery === 'string' && searchQuery.trim() !== '') {
      backendUrl = `${apiBaseUrl}/searchTechnicians?searchQuery=${encodeURIComponent(searchQuery)}&types=${encodeURIComponent(types as string)}`;
    } else {
      backendUrl = `${apiBaseUrl}/fetchTechnician?page=${encodeURIComponent(page as string)}&limit=${encodeURIComponent(limit as string)}`;
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

    // Optionally filter out 'super admin' here, or just pass data as-is
    if (data.technicians) {
      data.technicians = data.technicians.filter((t: any) => t.Role?.name?.toLowerCase() !== 'super admin');
    } else if (data.technician?.technicians) {
      data.technician.technicians = data.technician.technicians.filter((t: any) => t.Role?.name?.toLowerCase() !== 'super admin');
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching technicians:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
