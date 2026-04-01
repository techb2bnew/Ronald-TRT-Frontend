import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Disable Next.js body parser for JSON bodies
export const config = {
  api: { bodyParser: true },  // Allow JSON parsing
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
      return res.status(500).json({ error: 'Backend API URL not configured' });
    }

    const token = req.headers.authorization || '';

    const { jobName, assignCustomer, jobDescription,roleType, assignTechnician, estimatedBy, createdBy, selectedTechnicians, jobId } = req.body;

    // Prepare the data to be sent to the backend API
    const dataToSend = {
      jobName,
      assignCustomer,
      jobDescription,
      roleType,
      assignTechnician,
      estimatedBy,
      createdBy,
      selectedTechnicians,
      jobId,
    }; 
    const endpoint = jobId ? 'updateJob' : 'technicianCreateJob';

    // Use axios to send the data
    const response = await axios.post(`${apiBaseUrl}/${endpoint}`, dataToSend, {
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
    });

    return res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error('Error in job API:', error.response?.data || error.message || error);
    return res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Internal server error',
      details: error.response?.data || error.message,
    });
  }
}
