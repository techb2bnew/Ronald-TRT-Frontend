"use client";
import React, { useState } from 'react';
export default function Technicians() {
  const [vin, setVin] = useState('');
  const [vehicleData, setVehicleData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchVehicleDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVIN/${vin}?format=json`);
      const data = await response.json();
      const relevantData = data.Results.filter((item: any) =>
        ['Vehicle Descriptor', 'Make', 'Manufacturer Name', 'Model', 'Model Year', 'Vehicle Type'].includes(item.Variable) &&
       item.Value != null && item.Value !== 'N/A'
      );
      setVehicleData(relevantData);
    } catch (error) {
      console.error('Error fetching vehicle details:', error);
    } finally {
      setLoading(false);
    }
  };
  const renderValue = (value: any) => {
    if (value === null || value === '' || value === 'N/A') {
      return 'N/A';
    }
    return value;
  };
  return (
    <div className='main-container mb-5'>
      <h1 className="text-lg leading-6 font-bold text-gray-900">Create New Job</h1>
      <p className='text-sm'>Onboard clients effortlessly for seamless collaboration!</p>
      <div className='bg-white p-4 mt-5 w-[60%] m-auto'>
        <form className="">
          <div className="flex justify-between">
            <h2 className="text-lg leading-6 font-bold text-gray-900">Create New Job</h2>
            <button className='bg-black p-2 text-sm text-white rounded'>Add Another Vehicle +</button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {/* Client Name and Business Name */}
            <div className='mb-2'>
              <label htmlFor="" className='text-sm'>ViN <span className='text-[red]'>*</span> </label>
              <div className='flex gap-3 items-center'>
                <input
                  type="text"
                  placeholder="5YJSA3DS*EF"
                  value={vin}
                  onChange={(e) => setVin(e.target.value)}
                  className="input text-xs mt-1 input-bordered w-[40%] p-3 rounded border border-gray-400"
                />
                <button type="button" onClick={fetchVehicleDetails} className="primary-bg pl-5 pr-5 text-sm p-2 rounded">Fetch Car Details</button>
              </div>
            </div>
          </div>
          <div>
          {vehicleData && !loading && (
          <div className="overflow-x-auto rounded-md mt-4 mb-5">
        <table className="table w-full ">
          {/* Table header */}
          <thead>
            <tr>
              <th className='text-xs text-left'>Vehicle Description</th>
              <th className='text-xs text-left'>Make</th>
              <th className='text-xs text-left'>Manufacture Name</th>
              <th className='text-xs text-left'>Model</th>
              <th className='text-xs text-left'>Model Year</th>
              <th className='text-xs text-left'>Vehicle Type</th> 
            </tr>
          </thead>
          <tbody>
          <tr>
                <td className="text-xs">
                  {renderValue(vehicleData.find((item: any) => item.Variable === 'Vehicle Descriptor')?.Value)}
                </td>
                <td className="text-xs">
                  {renderValue(vehicleData.find((item: any) => item.Variable === 'Make')?.Value)}
                </td>
                <td className="text-xs">
                  {renderValue(vehicleData.find((item: any) => item.Variable === 'Manufacturer Name')?.Value)}
                </td>
                <td className="text-xs">
                  {renderValue(vehicleData.find((item: any) => item.Variable === 'Model')?.Value)}
                </td>
                <td className="text-xs">
                  {renderValue(vehicleData.find((item: any) => item.Variable === 'Model Year')?.Value)}
                </td>
                <td className="text-xs">
                  {renderValue(vehicleData.find((item: any) => item.Variable === 'Vehicle Type')?.Value)}
                </td>
              </tr>
          </tbody>
        </table>
      </div>
      )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Client Name and Business Name */}
            <div className='mb-2'>
              <label htmlFor="" className='text-sm'>Color <span className='text-[red]'>*</span></label>
               <select name="" id="" className='input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400'>
                <option value="">Select color</option>
                <option value="">Red</option>
                <option value="">Black</option>
                <option value="">White</option>
                <option value="">Orange</option>
                <option value="">Silver</option>
                <option value="">Gray</option>
                <option value="">Brown</option>
               </select>
            </div> 
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Client Name and Business Name */}
            <div className='mb-2'>
              <label htmlFor="" className='text-sm'>Vehicle Description</label>
               <textarea name="" id="" placeholder='Enter Description' className="input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400"></textarea>
            </div> 
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Client Name and Business Name */}
            <div className='mb-2'>
              <label htmlFor="" className='text-sm'>Assign Technician <span className='text-[red]'>*</span></label>
              <div className='flex gap-3 items-center'> 
              <select name="" id="" className='input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400'>
                <option value="">Select technician</option>
               </select>
                <button type="submit" className="primary-bg pl-5 pr-5 text-sm p-2 rounded">Submit</button>
              </div>
           
            </div> 
          </div> 
        </form>
      </div>
    </div>
  );
}
