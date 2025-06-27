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

async function parseForm(req: NextApiRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> {
  const form = formidable({ 
    multiples: true,
    keepExtensions: true,
    allowEmptyFiles: false,
    filename: (name, ext, part) => {
      return `${Date.now()}-${part.originalFilename}`;
    }
  });

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
    
    // Log received data for debugging 

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
      throw new Error('Backend API URL not configured');
    }

    const token = req.headers.authorization;
    if (!token) {
      throw new Error('Authorization token missing');
    }

    const vehicleId = fields.vehicleId?.[0];
    console.log(vehicleId, 'vehicleId');
    
    const endpoint = vehicleId ? 'updateVehicleInfo' : 'addVehicleInfo';
    const fileFieldName = vehicleId ? 'updateImages' : 'images';

    const formData = new FormData();
    
    // Append fields
    for (const key in fields) {
      const values = Array.isArray(fields[key]) ? fields[key] : [fields[key]];
      for (const value of values) {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      }
    }

    // Append files
    for (const key in files) {
      const fileArr = toFileArray(files[key] as File | File[]);
      for (const file of fileArr) {
        if (!fs.existsSync(file.filepath)) {
          throw new Error(`File not found: ${file.filepath}`);
        }
        formData.append(
          fileFieldName,
          fs.createReadStream(file.filepath),
          {
            filename: file.originalFilename || 'file',
            contentType: file.mimetype || 'application/octet-stream',
          }
        );
      }
    }

    // Temporary file cleanup
    const tempFiles = Object.values(files).flatMap(toFileArray);
    
    try {
      const response = await axios.post(`${apiBaseUrl}/${endpoint}`, formData, {
        headers: {
          Authorization: token,
          ...formData.getHeaders(),
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      return res.status(response.status).json(response.data);
    } finally {
      // Clean up temporary files
      tempFiles.forEach(file => {
        try {
          fs.unlinkSync(file.filepath);
        } catch (cleanupError) {
          console.error('Error cleaning up temp file:', cleanupError);
        }
      });
    }
    
  } catch (error: any) {
    console.error('API Error:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });

    const statusCode = error.response?.status || 500;
    return res.status(statusCode).json({ 
      error: error.message || 'Internal server error',
      details: error.response?.data || error.stack 
    });
  }
}