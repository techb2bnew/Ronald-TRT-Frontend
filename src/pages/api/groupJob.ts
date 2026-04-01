// pages/api/groupJob.ts
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
      filterType: rawFilterType,
      searchQuery: rawSearchQuery,
      roleType: rawRoleType,
      userId: rawUserId,
      limit: rawLimit = '10',
      page: rawPage = '1',
    } = req.query;

    const filterType = toSingleString(rawFilterType);
    const searchQuery = toSingleString(rawSearchQuery);
    const roleType = toSingleString(rawRoleType);
    const userId = toSingleString(rawUserId);
    const limit = toSingleString(rawLimit);
    const page = toSingleString(rawPage);

    if (!roleType) {
      return res.status(400).json({ error: 'roleType parameter is required' });
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
      return res.status(500).json({ error: 'Backend API URL not configured' });
    }

    let backendUrl = '';

    if (filterType) {
      // Fetch group job with filterType
      backendUrl = `${apiBaseUrl}/fetchGroupJob?filterType=${encodeURIComponent(filterType)}&roleType=${encodeURIComponent(roleType)}&userId=${encodeURIComponent(userId)}`;
    } else if (searchQuery && searchQuery.trim() !== '') {
      // Search group job
      backendUrl = `${apiBaseUrl}/searchGroupJob?searchQuery=${encodeURIComponent(searchQuery)}&roleType=${encodeURIComponent(roleType)}`;
    } else {
      // Default fetch group job pagination
      backendUrl = `${apiBaseUrl}/fetchGroupJob?page=${encodeURIComponent(page)}&roleType=${encodeURIComponent(roleType)}&limit=${encodeURIComponent(limit)}&userId=${encodeURIComponent(userId)}`;
    }

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
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('Error in groupJob API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
