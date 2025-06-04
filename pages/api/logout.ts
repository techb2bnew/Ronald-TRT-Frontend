import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email } = req.body;
    const token = req.headers.authorization?.split(' ')[1]; // Extract token from Authorization header

    if (!token || !email) {
      return res.status(400).json({ message: 'Missing token or email' });
    }

    // Forward the logout request to your backend or authentication service for invalidating the token
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // Pass the token in the Authorization header
      },
      body: JSON.stringify({ email }), // Send email to server
    });

    const contentType = backendResponse.headers.get('content-type') || '';
    let data;

    // Handle response based on content type
    if (contentType.includes('application/json')) {
      data = await backendResponse.json();
    } else {
      const text = await backendResponse.text();
      console.error('Backend response is not JSON:', text);
      return res.status(backendResponse.status).send(text);
    }

    if (!backendResponse.ok) {
      return res.status(backendResponse.status).json(data);
    }

    // Respond with a success message
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
