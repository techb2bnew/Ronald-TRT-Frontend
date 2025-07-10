import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Disable Next.js bodyParser for this route
export const config = {
  api: {
    bodyParser: true, // Default is true, but ensure it's properly set to allow JSON
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      customerId,
      fullName,
      phoneNumber,
      email,
      address,
      roleType,
      userId,
    } = req.body;

    if (
      !fullName || !roleType || !userId
    ) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
      return res.status(500).json({ error: 'Backend API URL not configured' });
    }

    const token = req.headers.authorization || '';

    const requestBody = {
      fullName: String(fullName),
      phoneNumber: String(phoneNumber),
      email: String(email),
      address: String(address),
      roleType: String(roleType),
      userId: String(userId),
      ...(customerId && { customerId: String(customerId) }),
    };

    // Use axios to send the JSON body
    const response = await axios.post(
      `${apiBaseUrl}/${customerId ? 'updateCustomer' : 'createCustomer'}`,
      requestBody,
      {
        headers: {
          Authorization: token,
        },
      }
    );

    return res.status(200).json({
      message: customerId ? 'Customer updated successfully' : 'Customer created successfully',
      customer: response.data,
    });

  } catch (error: any) {
    console.error('Error processing customer request:', error.response?.data || error.message || error);
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || 'Internal server error';
    return res.status(status).json({ error: message });
  }
}
