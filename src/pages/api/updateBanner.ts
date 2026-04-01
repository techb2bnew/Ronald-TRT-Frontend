// pages/api/updateBanner.ts
import { NextApiRequest, NextApiResponse } from 'next';

import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';

const uploadDir = path.join(process.cwd(), 'public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export const config = {
  api: {
    bodyParser: false,
  },
};

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: false, error: 'Method not allowed' });
  }

  const form = new IncomingForm({
    uploadDir,
    keepExtensions: true,
    multiples: true,
    maxFileSize: MAX_FILE_SIZE,
  });

  try {
    const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve([fields, files]);
      });
    });

    // Validate required fields
    if (!files.bannerImages) {
      return res.status(400).json({
        status: false,
        error: "No banner image provided or invalid file format."
      });
    }

    // Process files
    const bannerImages = Array.isArray(files.bannerImages) 
      ? files.bannerImages 
      : [files.bannerImages];

    const invalidFiles = bannerImages.some((file:any) => 
      !ALLOWED_MIME_TYPES.includes(file.mimetype) ||
      file.size > MAX_FILE_SIZE
    );

    if (invalidFiles) {
      // Clean up uploaded files if validation fails
      bannerImages.forEach((file:any) => {
        if (fs.existsSync(file.filepath)) {
          fs.unlinkSync(file.filepath);
        }
      });
      return res.status(400).json({
        status: false,
        error: "Invalid file format or file too large (max 5MB)"
      });
    }

    const savedFiles = bannerImages.map((file:any) => {
      const newFilename = `banner-${Date.now()}-${file.originalFilename}`;
      const newPath = path.join(uploadDir, newFilename);
      fs.renameSync(file.filepath, newPath);
      return {
        url: `/uploads/${newFilename}`,
        name: file.originalFilename,
        size: file.size,
        type: file.mimetype
      };
    });

    // Here you would save to your database (example logic)
    const bannerData = {
      id: fields.id || 'defaultBannerId',
      bannerImages: savedFiles,
      userId: fields.userId,
      roleType: fields.roleType
    };

    // Save banner data to the database (pseudo code)
    // await db.saveBanner(bannerData);

    return res.status(200).json({
      status: true,
      message: "User banner updated successfully",
      banners: [bannerData] // Respond with updated data
    });
  } catch (error) {
    console.error('Error during file upload:', error);
    return res.status(500).json({
      status: false,
      error: 'Internal server error'
    });
  }
}
