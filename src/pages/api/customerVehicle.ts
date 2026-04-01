// pages/api/vehicalList.ts
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
      customerId: rawCustomerId,
      roleType: rawRoleType,
      limit: rawLimit = '10',
      page: rawPage = '1',
    } = req.query;

    const customerId = toSingleString(rawCustomerId);
    const roleType = toSingleString(rawRoleType);
    const limit = toSingleString(rawLimit);
    const page = toSingleString(rawPage);

    // Ensure the required parameters are present
    if (!customerId) {
      return res.status(400).json({ error: 'customerId parameter is required' });
    }

    if (!roleType) {
      return res.status(400).json({ error: 'roleType parameter is required' });
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
      return res.status(500).json({ error: 'Backend API URL not configured' });
    }

    // Construct the backend URL for fetching vehicles based on customerId
    const backendUrl = `${apiBaseUrl}/fetchVehicleCustomerList?customerId=${encodeURIComponent(customerId)}` +
                        `&roleType=${encodeURIComponent(roleType)}` +
                        `&limit=${encodeURIComponent(limit)}` +
                        `&page=${encodeURIComponent(page)}`;

     

    // Add token for authorization if available
    const token = req.headers.authorization || '';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = token;
    }

    // Send request to the backend API
    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers,
    });

    if (backendResponse.status === 401) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      return res.status(backendResponse.status).json(errorData);
    }

    const data = await backendResponse.json();

    // Return the data fetched from the backend
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in vehicalInfo API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
