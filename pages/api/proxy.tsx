import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export const config = {
    api: {
        bodyParser: false,  // disable Next.js body parsing, so we get raw stream
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const token = req.headers.authorization || '';
        const rawPath = req.query.path as string;

        if (!rawPath) {
            return res.status(400).json({ message: 'Missing path parameter' });
        }

        const BASE_API_URL = process.env.SECRET_API_BASE || 'https://techrepairtracker.base2brand.com';
        const path = Buffer.from(rawPath, 'base64').toString('utf-8').trim();
        const finalURL = `${BASE_API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
        console.log('Incoming req.method:', req.method);
        console.log('Raw path:', rawPath);
        console.log('Decoded path:', path);
        console.log('Final URL:', finalURL);

        // Clone headers and remove headers Axios/Node cannot handle
        const headers = { ...req.headers };
        delete headers['content-length'];
        delete headers['host'];

        // Make axios request forwarding incoming request stream as data
        const axiosResponse = await axios({
            method: req.method,
            url: finalURL,
            headers,
            data: req,           // Pass incoming request stream
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            responseType: 'stream',  // stream response back to client
        });

        // Forward response headers (optional, you can filter if needed)
        Object.entries(axiosResponse.headers).forEach(([key, value]) => {
            res.setHeader(key, value as string);
        });

        // Pipe response stream to client
        res.status(axiosResponse.status);
        axiosResponse.data.pipe(res);

    } catch (error: any) {
        console.error('❌ Proxy error:', error.response?.status, error.message);

        // Safely stringify error details to avoid circular structure issue
        let safeDetail = null;
        try {
            safeDetail = error.response?.data
                ? JSON.parse(JSON.stringify(error.response.data))
                : null;
        } catch {
            safeDetail = null;
        }

        res.status(error.response?.status || 500).json({
            message: error.message,
            detail: safeDetail,
        });
    }
}
