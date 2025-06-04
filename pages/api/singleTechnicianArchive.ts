import type { NextApiRequest, NextApiResponse } from 'next';

function toSingleString(value: string | string[] | undefined): string {
  if (!value) return '';
  return Array.isArray(value) ? value[0] : value;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { method } = req;

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
      return res.status(500).json({ error: 'Backend API URL not configured' });
    }

    const token = req.headers.authorization || '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = token;

    if (method === 'GET') {
      // Extract query parameters
      const {
        type,
        searchQuery: rawSearchQuery,
        page: rawPage = '1',
        limit: rawLimit = '10',
        roleType,
        userId: rawUserId,
        types, // fallback for roleType
      } = req.query;

      // Use roleType or fallback to 'types' query param
      const rawRoleType = roleType ?? types;

      const searchQuery = toSingleString(rawSearchQuery);
      const page = toSingleString(rawPage);
      const limit = toSingleString(rawLimit);
      const roleTypeFinal = toSingleString(rawRoleType);
      const userId = toSingleString(rawUserId);

      // Default archive type to 'technician' if not provided
      const archiveTypeRaw = toSingleString(type);
      const archiveType = archiveTypeRaw ? archiveTypeRaw.toLowerCase() : 'technician';

      if (!roleTypeFinal) {
        return res.status(400).json({ error: 'roleType parameter is required' });
      }

      // Validate archive type
      const validTypes = ['technician', 'customer', 'job'];
      if (!validTypes.includes(archiveType)) {
        return res.status(400).json({
          error: `Invalid archive type. Must be one of ${validTypes.join(', ')}`,
        });
      }

      // Build backend API URL
      let backendUrl = '';

      const baseParams = `page=${page}&limit=${limit}&roleType=${encodeURIComponent(roleTypeFinal)}`;
      const baseParamsTech = `page=${page}&limit=${limit}&types=${encodeURIComponent(roleTypeFinal)}`;
      const userParam = userId ? `&userId=${encodeURIComponent(userId)}` : '';

      if (archiveType === 'technician') {
        backendUrl = searchQuery.trim()
          ? `${apiBaseUrl}/searchArchivedTechnician?searchQuery=${encodeURIComponent(searchQuery)}&types=${encodeURIComponent(roleTypeFinal)}`
          : `${apiBaseUrl}/fetchArchivedTechnician?${baseParamsTech}`;
      } else if (archiveType === 'customer') {
        backendUrl = searchQuery.trim()
          ? `${apiBaseUrl}/searchArchivedCustomer?searchQuery=${encodeURIComponent(searchQuery)}&roleType=${encodeURIComponent(roleTypeFinal)}${userParam}`
          : `${apiBaseUrl}/fetchArchivedCustomer?${baseParams}${userParam}`;
      } else if (archiveType === 'job') {
        backendUrl = searchQuery.trim()
          ? `${apiBaseUrl}/searchfetchArchivedJob?searchQuery=${encodeURIComponent(searchQuery)}&roleType=${encodeURIComponent(roleTypeFinal)}${userParam}`
          : `${apiBaseUrl}/fetchArchivedJob?${baseParams}${userParam}`;
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

    } else if (method === 'POST') {
      // For recoverRecords endpoint
      const body = req.body;

      if (!body || Object.keys(body).length === 0) {
        return res.status(400).json({ error: 'Missing request body' });
      }

      const backendUrl = `${apiBaseUrl}/recoverRecords`;

      const response = await fetch(backendUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return res.status(response.status).json(errorData);
      }

      const data = await response.json();
      return res.status(200).json(data);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in archive API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}