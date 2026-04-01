// pages/api/singleTechJobs.ts
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
    const {
      searchQuery: rawSearchQuery,
      page: rawPage = '1',
      limit: rawLimit = '10',
      roleType: rawRoleType,
    } = req.query;

    const searchQuery = toSingleString(rawSearchQuery);
    const page = toSingleString(rawPage);
    const limit = toSingleString(rawLimit);
    const roleType = toSingleString(rawRoleType);

    if (!roleType) {
      return res.status(400).json({ error: 'roleType parameter is required' });
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
      return res.status(500).json({ error: 'Backend API URL not configured' });
    }

    let backendUrl = '';
    if (searchQuery && searchQuery.trim() !== '') {
      backendUrl = `${apiBaseUrl}/searchTechnicianActiveJob?searchQuery=${encodeURIComponent(searchQuery)}&roleType=${encodeURIComponent(roleType)}`;
    } else {
      backendUrl = `${apiBaseUrl}/fetchAllJobs?page=${page}&limit=${limit}&roleType=${encodeURIComponent(roleType)}`;
    }

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
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in jobs API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
