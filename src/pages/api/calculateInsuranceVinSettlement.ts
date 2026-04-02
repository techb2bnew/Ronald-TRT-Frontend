import type { NextApiRequest, NextApiResponse } from 'next';

function toSingleString(value: string | string[] | undefined): string {
  if (!value) return '';
  return Array.isArray(value) ? value[0] : value;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const jobId = toSingleString(req.query.jobId);
  const vin = toSingleString(req.query.vin);

  if (!jobId || !vin) {
    return res.status(400).json({ error: 'jobId and vin are required' });
  }

  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
      return res.status(500).json({ error: 'Backend API URL not configured' });
    }

    const params = new URLSearchParams();
    params.set('jobId', jobId);
    params.set('vin', vin.trim());

    const token = req.headers.authorization || '';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = token;

    const backendUrl = `${apiBaseUrl}/calculateInsuranceVinSettlement?${params.toString()}`;
    const response = await fetch(backendUrl, { method: 'GET', headers });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in calculateInsuranceVinSettlement API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
