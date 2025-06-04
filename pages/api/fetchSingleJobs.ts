// pages/api/fetchSingleJobs.ts
import type { NextApiRequest, NextApiResponse } from 'next';

function toSingleString(value: string | string[] | undefined): string {
  if (!value) return '';
  return Array.isArray(value) ? value[0] : value;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
      return res.status(500).json({ error: 'Backend API URL not configured' });
    }

    // Extract jobid from query parameters or body
    // Since you send via POST but with query parameter, get from query:
    const rawJobId = req.query.jobid || req.body.jobid;
    const jobId = toSingleString(rawJobId);

    if (!jobId) {
      return res.status(400).json({ error: 'Job ID is required' });
    }

    const backendUrl = `${apiBaseUrl}/fetchSingleJobs?jobid=${encodeURIComponent(jobId)}`;

    // Forward authorization header if exists
    const token = req.headers.authorization || '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = token;
    }

    // Forward the POST request to backend
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in fetchSingleJobs API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
