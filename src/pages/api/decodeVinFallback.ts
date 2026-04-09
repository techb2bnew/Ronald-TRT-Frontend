import type { NextApiRequest, NextApiResponse } from 'next';
import { createDecoder } from '@cardog/corgi';

let sharedDecoder: Awaited<ReturnType<typeof createDecoder>> | null = null;

async function getSharedDecoder() {
  if (!sharedDecoder) {
    sharedDecoder = await createDecoder({ runtime: 'node' });
  }
  return sharedDecoder;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const vinRaw = req.query.vin;
    const vin = Array.isArray(vinRaw) ? vinRaw[0] : vinRaw;
    if (!vin || String(vin).trim().length < 8) {
      return res.status(400).json({ error: 'VIN is required' });
    }
    const normalizedVin = String(vin).trim().toUpperCase();

    const decoder = await getSharedDecoder();
    const decoded = await decoder.decode(normalizedVin);
    const vehicle = (decoded?.components?.vehicle ?? {}) as Record<string, unknown>;
    const plant = (decoded?.components?.plant ?? {}) as Record<string, unknown>;
    const wmi = (decoded?.components?.wmi ?? {}) as Record<string, unknown>;
    const modelYear = decoded?.components?.modelYear?.year;

    const vehicleDetails: Record<string, string> = {};
    if (vehicle.make) vehicleDetails.make = String(vehicle.make);
    if (wmi.manufacturer || vehicle.make) {
      vehicleDetails.manufacturerName = String(wmi.manufacturer || vehicle.make);
    }
    if (vehicle.model) vehicleDetails.model = String(vehicle.model);
    if (modelYear || vehicle.year) vehicleDetails.modelYear = String(modelYear || vehicle.year);
    if (vehicle.bodyStyle) vehicleDetails.bodyClass = String(vehicle.bodyStyle);
    if (vehicle.vehicleType || wmi.vehicleType || vehicle.bodyStyle) {
      vehicleDetails.vehicleType = String(vehicle.vehicleType || wmi.vehicleType || vehicle.bodyStyle);
    }
    if (plant.country) vehicleDetails.plantCountry = String(plant.country);
    if (plant.city) vehicleDetails.plantCompanyName = String(plant.city);
    if (normalizedVin.length >= 11) {
      vehicleDetails.vehicleDescriptor = `${normalizedVin.slice(0, 8)}*${normalizedVin.slice(9, 11)}`;
    }

    if (!Object.keys(vehicleDetails).length) {
      return res.status(404).json({ status: false, error: 'Fallback decoder returned no vehicle details' });
    }

    return res.status(200).json({ status: true, vehicleDetails });
  } catch (error: any) {
    console.error('Error in decodeVinFallback API:', error);
    return res.status(500).json({ status: false, error: error?.message || 'Fallback decode failed' });
  }
}
