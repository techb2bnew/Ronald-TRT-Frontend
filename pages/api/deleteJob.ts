import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { jobid, deletedStatus } = req.body; // Expecting jobid, userRole, deletedStatus from the request body
    const token = req.headers.authorization?.split(' ')[1]; // Extract token from Authorization header
 
    console.log("jobid:", jobid);

    if (!token || !jobid ) {
      return res.status(400).json({ message: 'Missing token, jobid, or userRole' });
    }

    // Implement your deletion logic here (e.g., delete the job from the database)
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/deleteJobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // Pass the token in the Authorization header
      },
      body: JSON.stringify({ jobid, deletedStatus }), // Pass jobid, userRole, and deletedStatus to backend
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

    // Send success response
    return res.status(200).json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Delete Job error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
