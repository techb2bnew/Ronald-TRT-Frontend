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
      page: rawPage = '1',
      limit: rawLimit = '10',
      userId: rawUserId,
      roleType: rawRoleType = 'single-technician',
    } = req.query;

    const page = toSingleString(rawPage);
    const limit = toSingleString(rawLimit);
    const userId = toSingleString(rawUserId);
    const roleType = toSingleString(rawRoleType);

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
      return res.status(500).json({ error: 'Backend API URL not configured' });
    }

    const params = new URLSearchParams();
    if (page) params.set('page', page);
    if (limit) params.set('limit', limit);
    if (roleType) params.set('roleType', roleType);
    if (userId) params.set('userId', userId);

    const backendUrl = `${apiBaseUrl}/fetchAllCustomer?${params.toString()}`;

    const token = req.headers.authorization || '';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = token;

    const response = await fetch(backendUrl, { method: 'GET', headers });

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
    console.error('Error in fetchAllCustomer API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

