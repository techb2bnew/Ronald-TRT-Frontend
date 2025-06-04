import type { NextApiRequest, NextApiResponse } from 'next';
import formidable, { File } from 'formidable';
import FormData from 'form-data';
import fs from 'fs';
import axios from 'axios';

// Disable Next.js body parser for multipart forms
export const config = {
  api: { bodyParser: false },
};

// Convert file or array of files to array
function toFileArray(fileOrFiles: File | File[] | undefined): File[] {
  if (!fileOrFiles) return [];
  return Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
}

// Parse multipart form data with formidable
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

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
      return res.status(500).json({ error: 'Backend API URL not configured' });
    }

    const token = req.headers.authorization || '';

    // Determine endpoint based on presence of jobId
    const jobId = fields.jobId;
    const endpoint = jobId ? 'updateJob' : 'technicianCreateJob';

    const formData = new FormData();

    // Append fields to formData
    for (const key in fields) {
      const val = fields[key];
      if (Array.isArray(val)) {
        val.forEach(v => formData.append(key, v));
      } else if (val !== undefined && val !== null) {
        formData.append(key, String(val));
      }
    }

    // Append files to formData
    for (const key in files) {
      const fileArr = toFileArray(files[key] as File | File[]);
      for (const file of fileArr) {
        formData.append(key, fs.createReadStream(file.filepath), {
          filename: file.originalFilename || 'file',
          contentType: file.mimetype || undefined,
        });
      }
    }

    // Use axios to send formData
    const response = await axios.post(`${apiBaseUrl}/${endpoint}`, formData, {
      headers: {
        Authorization: token,
        ...formData.getHeaders(),
      },
      maxBodyLength: Infinity,  // to allow large files
      maxContentLength: Infinity,
    });

    return res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error('Error in job API:', error.response?.data || error.message || error);
    return res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Internal server error',
      details: error.response?.data || error.message,
    });
  }
}
