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
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
      return res.status(500).json({ error: 'Backend API URL not configured' });
    }

    const vin = toSingleString(req.query.vin);
    if (!vin) {
      return res.status(400).json({ error: 'vin parameter is required' });
    }

    const jobId = toSingleString(req.query.jobId);
    const jobQuery = jobId ? `&jobId=${encodeURIComponent(jobId)}` : '';

    const token = req.headers.authorization || '';

    const backendResponse = await fetch(
      `${apiBaseUrl}/fetchSingleVehicleInfoByVin?vin=${encodeURIComponent(vin)}${jobQuery}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: token }),
        },
      }
    );

    const data = await backendResponse.json().catch(() => ({}));
    if (!backendResponse.ok) {
      return res.status(backendResponse.status).json(data);
    }
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in fetchSingleVehicleInfoByVin API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
