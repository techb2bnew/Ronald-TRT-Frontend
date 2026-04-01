import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      return res.status(500).json({ error: 'Backend API URL not configured' });
    }

    // const { userId, roleType } = req.query;
    // if (!userId || !roleType) {
    //   return res.status(400).json({ error: 'Missing required parameters' });
    // }

    const token = req.headers.authorization || '';

    // Fetch banner images from the external API
    const response = await fetch(`${apiUrl}/bannerImages`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: token } : {}),
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json(errorData);
    }

    // Forward the exact response from the external API to the client
    const data = await response.json();

    // console.log('Fetched Banner Data:', data); // Log the full API response

    // Directly return the response from the external API as is
    return res.status(200).json(data);  // Send the same data back to the client

  } catch (error) {
    console.error('Error fetching banner data:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
