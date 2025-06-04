 
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        console.log('Received body:', req.body);

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const payload = { email, password };

        console.log('Sending payload to backend:', payload);

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: process.env.NEXT_PUBLIC_TOKEN || '',
            },
            body: JSON.stringify(payload),
        });


        console.log('Backend response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Backend error response:', errorText);
            return res.status(response.status).json({ message: errorText || 'Backend error' });
        }

        const data = await response.json();
        console.log('Backend response data:', data);

        return res.status(200).json(data);
    } catch (error) {
        console.error('Proxy API error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

