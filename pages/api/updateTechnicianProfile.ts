import type { NextApiRequest, NextApiResponse } from 'next';
import formidable, { File } from 'formidable';
import fs from 'fs';
import FormData from 'form-data';
import axios from 'axios';

export const config = {
  api: { bodyParser: false }, // Disable body parsing to handle file uploads
};

// Helper function to convert file array
function toFileArray(fileOrFiles: File | File[] | undefined): File[] {
  if (!fileOrFiles) return [];
  return Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
}

// Helper function to parse the form data
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
    // Parse form data (fields and files)
    const { fields, files } = await parseForm(req);
    
    const formData = new FormData();
    
    // Add fields to FormData
    for (const key in fields) {
      const value = fields[key];
      if (typeof value === 'string') {
        formData.append(key, value);
      } else if (Array.isArray(value)) {
        value.forEach((v) => formData.append(key, v));
      }
    }
    
    // Add files (profile image or other attachments) to FormData
    for (const [key, fileOrFiles] of Object.entries(files)) {
      const fileArr = toFileArray(fileOrFiles as File | File[]);
      for (const file of fileArr) {
        formData.append(key, fs.createReadStream(file.filepath), file.originalFilename || 'unknown-file');
      }
    }

    // Send the form data to an external API to update the technician's profile
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/updateTechnicianProfile`;

    const token = req.headers.authorization || '';

    const headers = {
      ...formData.getHeaders(),
      ...(token ? { Authorization: token } : {}),
    };

    const response = await axios.post(apiUrl, formData, {
      headers,
      maxBodyLength: Infinity, // Handle large files
    });

    return res.status(200).json(response.data);
  } catch (error: any) {
    console.error('Error updating technician profile:', error.response?.data || error.message || error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
