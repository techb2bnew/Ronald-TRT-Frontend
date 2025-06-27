import type { NextApiRequest, NextApiResponse } from 'next';
import formidable, { File } from 'formidable';
import fs from 'fs';
import FormData from 'form-data';
import axios from 'axios';

export const config = {
  api: { bodyParser: false },
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
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { fields, files } = await parseForm(req);
    const formData = new FormData();

    for (const key in fields) {
      const value = fields[key];
      if (typeof value === 'string') {
        formData.append(key, value);
      } else if (Array.isArray(value)) {
        value.forEach((v) => formData.append(key, v));
      }
    }

    for (const [key, fileOrFiles] of Object.entries(files)) {
      const fileArr = toFileArray(fileOrFiles as File | File[]);

      for (const file of fileArr) {
        formData.append(key, fs.createReadStream(file.filepath), file.originalFilename || 'unknown-file');
      }
    }

    const isUpdate = Boolean(fields.technicianId);

    const apiUrl = isUpdate
      ? `${process.env.NEXT_PUBLIC_API_URL}/updateTechnician`
      : `${process.env.NEXT_PUBLIC_API_URL}/register`;

    // Get Authorization header from client request
    const token = req.headers.authorization || '';

    const headers = {
      ...formData.getHeaders(),
      ...(token ? { Authorization: token } : {}),
    };

    const response = await axios.post(apiUrl, formData, {
      headers,
      maxBodyLength: Infinity,
    });

    return res.status(200).json(response.data);
  } catch (error: any) {
    // Catch and forward the exact error message from the API response
    if (error.response?.data?.error) {
      return res.status(400).json({ message: error.response.data.error }); // Forward exact error message
    }

    // For other types of errors
    console.error('Error forwarding technician request:', error.response?.data || error.message || error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}


