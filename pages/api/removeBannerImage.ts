import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== 'DELETE') {
      return res.status(405).json({ 
        status: false, 
        error: 'Method not allowed' 
      });
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
      return res.status(500).json({ 
        status: false, 
        error: 'Backend API URL not configured' 
      });
    }

    const { bannerId, imageUrl } = req.query;

    if (!bannerId || !imageUrl) {
      return res.status(400).json({ 
        status: false, 
        error: 'Missing bannerId or imageUrl' 
      });
    }

    const token = req.headers.authorization || '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = token;
    }

    const backendUrl = `${apiBaseUrl}/bannerImages?bannerId=${encodeURIComponent(bannerId.toString())}&imageUrl=${encodeURIComponent(imageUrl.toString())}`;

    const backendResponse = await fetch(backendUrl, {
      method: 'DELETE',
      headers,
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      return res.status(backendResponse.status).json({ 
        status: false, 
        ...errorData 
      });
    }

    const data = await backendResponse.json();
    return res.status(200).json({ 
      status: true, 
      ...data 
    });

  } catch (error) {
    console.error('Error in banner image deletion API:', error);
    return res.status(500).json({ 
      status: false, 
      error: 'Internal server error' 
    });
  }
}