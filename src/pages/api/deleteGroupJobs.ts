// deleteGroupJobs.ts

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { vin, deletedStatus } = req.body; // Expect vin and deletedStatus from the request body
    const token = req.headers.authorization?.split(' ')[1]; // Extract token from Authorization header

    if (!token || !vin || deletedStatus === undefined) {
      return res.status(400).json({ message: 'Missing token, vin, or deletedStatus' });
    }

    // Make sure to check if the token is valid and associated with the current user (optional validation)
    // Here, you can implement your database logic to update the job group status using `vin`
    // Example logic (this could be a DB call or any other backend logic):
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/deleteGroupJobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // Pass token for authentication
      },
      body: JSON.stringify({
        vin,
        deletedStatus,
      }),
    });

    const contentType = response.headers.get('content-type') || '';
    let data;

    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error('Backend response is not JSON:', text);
      return res.status(response.status).send(text);
    }

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    // Success response
    return res.status(200).json({ message: 'Job group deletion status updated successfully' });
  } catch (error) {
    console.error('Delete group job error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
