import type { NextApiRequest, NextApiResponse } from 'next';
import formidable, { File } from 'formidable';
import FormData from 'form-data';
import fs from 'fs';
import axios from 'axios';

// Disable Next.js bodyParser for this route
export const config = {
  api: {
    bodyParser: false,
  },
};

function toFileArray(fileOrFiles: File | File[] | undefined): File[] {
  if (!fileOrFiles) return [];
  return Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
}

function parseForm(req: NextApiRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> {
  const form = formidable({ multiples: true, keepExtensions: true });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fields, files } = await parseForm(req);

    const {
      customerId,
      firstName,
      lastName,
      phoneNumber,
      email,
      address,
      country,
      state,
      city,
      zipCode,
      roleType,
      userId,
    } = fields;

    if (
      !firstName || !lastName || !phoneNumber || !email || !address || !country ||
      !state || !city || !zipCode || !roleType || !userId
    ) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
      return res.status(500).json({ error: 'Backend API URL not configured' });
    }

    const token = req.headers.authorization || '';

    const formData = new FormData();
    formData.append('firstName', String(firstName));
    formData.append('lastName', String(lastName));
    formData.append('phoneNumber', String(phoneNumber));
    formData.append('email', String(email));
    formData.append('address', String(address));
    formData.append('country', String(country));
    formData.append('state', String(state));
    formData.append('city', String(city));
    formData.append('zipCode', String(zipCode));
    formData.append('roleType', String(roleType));
    formData.append('userId', String(userId));

    if (customerId) {
      formData.append('customerId', String(customerId));
    }

    if (files.image) {
      const fileArr = toFileArray(files.image as File | File[]);
      for (const file of fileArr) {
        formData.append('image', fs.createReadStream(file.filepath), file.originalFilename || 'image');
      }
    }

    // Use axios to send multipart/form-data correctly
    const response = await axios.post(
      `${apiBaseUrl}/${customerId ? 'updateCustomer' : 'createCustomer'}`,
      formData,
      {
        headers: {
          Authorization: token,
          ...formData.getHeaders(),
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
