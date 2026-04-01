import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { technicianId } = req.body; // Expecting technicianId from the request body
    const token = req.headers.authorization?.split(' ')[1]; // Extract the token from Authorization header

    if (!token || !technicianId) {
      return res.status(400).json({ message: 'Missing token or technicianId' });
    }

    // Make the necessary backend call to delete the technician (in your DB, etc.)
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/deleteTechnician`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // Pass the token in the Authorization header
      },
      body: JSON.stringify({ technicianId }),
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
    return res.status(200).json({ message: 'Technician deleted successfully' });
  } catch (error) {
    console.error('Delete technician error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
