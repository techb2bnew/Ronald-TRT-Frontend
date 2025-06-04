// pages/api/viewGroupJobByVin.ts
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
      roleType: rawRoleType,
      vin: rawVin,
      filterType: rawFilterType,
      userId: rawUserId,
    } = req.query;

    const roleType = toSingleString(rawRoleType);
    const vin = toSingleString(rawVin);
    const filterType = toSingleString(rawFilterType);
    const userId = toSingleString(rawUserId);

    if (!roleType || !vin) {
      return res.status(400).json({ error: 'roleType and vin parameters are required' });
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
      return res.status(500).json({ error: 'Backend API URL not configured' });
    }

    let backendUrl = `${apiBaseUrl}/fetchGroupJobByVin?roleType=${encodeURIComponent(roleType)}&vin=${encodeURIComponent(vin)}`;

    if (filterType) {
      backendUrl += `&filterType=${encodeURIComponent(filterType)}`;
    }

    if (userId) {
      backendUrl += `&userId=${encodeURIComponent(userId)}`;
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
    console.error('Error in fetchGroupJobByVin API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
