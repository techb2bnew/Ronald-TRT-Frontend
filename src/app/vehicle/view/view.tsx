"use client";
import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Loading from '@/app/component/loader';
import Breadcrumb from '@/app/component/breadcrumb';

export default function ViewDetails() {
  const [jobData, setJobsData] = useState<any>(null);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [roleType, setUserType] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchCustomerData = async (vehicleId: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/fetchSingleVehicleInfo?vehicleId=${vehicleId}`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      if (response.ok) {
        setJobsData(data.vehicle.vehicle);
      } else {
        toast.error(data.error || 'Error fetching vehicle data');
      }
    } catch (error) {
      toast.error('An error occurred while fetching vehicle data');
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const vehicleId = searchParams.get('vehicleId') || '';

    if (vehicleId) {
      fetchCustomerData(vehicleId);
    }
  }, []);

  React.useEffect(() => {
    const type = localStorage.getItem('types');
    setUserType(type);
  }, []);

  if (!jobData) {
    return <div><Loading /></div>;
  }
  const subTotalCost = jobData.jobDescription?.reduce((acc: number, job: any) => {
    return acc + parseFloat(job.cost || '0');
  }, 0);

 const calculateTechnicianTotalCost = (jobData: any) => {
  if (!jobData) return 0;

  // Calculate subtotal from jobDescription
  let subtotalcost = 0;
  if (Array.isArray(jobData.jobDescription)) {
    subtotalcost = jobData.jobDescription.reduce((total: number, item: any) => {
      let parsedItem = item;
      if (typeof item === 'string') {
        try {
          parsedItem = JSON.parse(item);
        } catch {
          return total;
        }
      }
      const cost = parseFloat(parsedItem?.cost || '0');
      return total + (isNaN(cost) ? 0 : cost);
    }, 0);
  }

  // If no technicians, return just the subtotal
  if (!Array.isArray(jobData.assignedTechnicians)) {
    return subtotalcost;
  }

  let technicianTotal = subtotalcost;

  // Check if labourCost exists and add it to the total if available
  const labourCost = parseFloat(jobData.labourCost || '0');
  if (!isNaN(labourCost) && labourCost > 0) {
    technicianTotal += labourCost; // Add labourCost to the technician total
  }

  // Process each technician
  jobData.assignedTechnicians.forEach((tech: any) => {
    const techDetails = tech.VehicleTechnician;
    if (!techDetails) return;

    // Parse simpleFlatRate
    let simpleFlatRate = 0;
    try {
      if (techDetails.simpleFlatRate && techDetails.simpleFlatRate !== "null") {
        const parsedRate = JSON.parse(techDetails.simpleFlatRate);
        
        if (techDetails.payRate === "Pay Per Vehicles" && techDetails.payVehicleType) {
          // For Pay Per Vehicles, get the rate for the specific vehicle type
          simpleFlatRate = parseFloat(parsedRate[techDetails.payVehicleType]) || 0;
        } else if (typeof parsedRate === 'object') {
          // For other payment methods, try to get a technician rate
          const technicianRate = parsedRate['technician'];
          simpleFlatRate = parseFloat(technicianRate) || 0;
        } else if (typeof parsedRate === 'number') {
          simpleFlatRate = parsedRate;
        }
      }
    } catch (error) {
      console.error('Error parsing simpleFlatRate:', error);
      simpleFlatRate = 0;
    }

    // Parse amountPercentage safely
    const amountPercentage = parseFloat(
      techDetails?.amountPercentage === "null" ? "0" : techDetails?.amountPercentage || "0"
    );

    // Add costs based on payment method
    if (techDetails.payRate === "Simple Flat Rate" && simpleFlatRate > 0) {
      technicianTotal += simpleFlatRate;
    } 
    else if (techDetails.payRate === "Pay Per Vehicles" && simpleFlatRate > 0) {
      technicianTotal += simpleFlatRate;
    }
    else if (amountPercentage > 0) {
      technicianTotal += (amountPercentage * subtotalcost) / 100;
    }
  });

  return technicianTotal;
};

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Vehicles Info', href: '/vehicle/vehicle' },
          { label: 'View Detail', href: '/vehicle/vehicle' }
        ]}
      />
      <div className='max-w-7xl mx-auto p-4 rounded-lg shadow bg-white'>
        <div className="bg-blue rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-2 pt-4 pl-6 border-b border-[#ccc] pb-3">Vehicle Detail</h2>
          <div className="grid grid-cols-2 gap-3 p-6">
            {/* Left Section */}
            <div className='shadow-lg p-5 bg-white rounded'>
              <p className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'>
                <strong className='w-[210px] inline-block'>Job Name:</strong>
                {jobData?.jobName || <span className="text-black-500">N/A</span>}
              </p>
              <p className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'>
                <strong className='w-[210px] inline-block'>VIN:</strong>
                {jobData?.vin || <span className="text-black-500">N/A</span>}
              </p>
              <p className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'>
                <strong className='w-[210px] inline-block'>Vehicle Descriptor:</strong>
                {jobData?.vehicleDescriptor || <span className="text-black-500">N/A</span>}
              </p>
              <p className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'>
                <strong className='w-[210px] inline-block'>Make:</strong>
                {jobData?.make || <span className="text-black-500">N/A</span>}
              </p>
              <p className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'>
                <strong className='w-[210px] inline-block'>Model:</strong>
                {jobData?.model || <span className="text-black-500">N/A</span>}
              </p>
              <p className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'>
                <strong className='w-[210px] inline-block'>Model Year:</strong>
                {jobData?.modelYear || <span className="text-black-500">N/A</span>}
              </p>
              <p className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'>
                <strong className='w-[210px] inline-block'>Manufacturer Name:</strong>
                {jobData?.manufacturerName || <span className="text-black-500">N/A</span>}
              </p>
              <p className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'>
                <strong className='w-[210px] inline-block'>Vehicle Type:</strong>
                {jobData?.vehicleType || <span className="text-black-500">N/A</span>}
              </p>
            </div>

            {/* Right Section */}
            <div className='shadow-lg p-5 bg-white rounded'>
              <p className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'>
                <strong className='w-[210px] inline-block'>Body Class:</strong>
                {jobData?.bodyClass || <span className="text-black-500">N/A</span>}
              </p>
              <p className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'>
                <strong className='w-[210px] inline-block'>Color:</strong>
                {jobData?.color || <span className="text-black-500">N/A</span>}
              </p>
              <p className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'>
                <strong className='w-[210px] inline-block'>Plant Country:</strong>
                {jobData?.plantCountry || <span className="text-black-500">N/A</span>}
              </p>
              <p className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'>
                <strong className='w-[210px] inline-block'>Plant Company:</strong>
                {jobData?.plantCompanyName || <span className="text-black-500">N/A</span>}
              </p>
              <p className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'>
                <strong className='w-[210px] inline-block'>Plant State:</strong>
                {jobData?.plantState || <span className="text-black-500">N/A</span>}
              </p>
              <p className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'>
                <strong className='w-[210px] inline-block'>Created By:</strong>
                {jobData?.createdBy || <span className="text-black-500">N/A</span>}
              </p>
              <p className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'>
                <strong className='w-[210px] inline-block'>Customer:</strong>
                {jobData?.customer?.fullName || <span className="text-black-500">N/A</span>}
              </p>
              <p className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'>
                <strong className='w-[210px] inline-block'>Customer Email:</strong>
                {jobData?.customer?.email ? (
                  <a className="hover:underline" href={`mailto:${jobData.customer.email}`}>
                    {jobData.customer.email}
                  </a>
                ) : <span className="text-black-500">N/A</span>}
              </p>
            </div>
          </div>

          {/* Job Description Section */}
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-3 text-white">Work Order Description</h3>
            {jobData?.jobDescription?.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {jobData.jobDescription.map((job: any, index: number) => (
                  <div key={index} className="bg-gray-50 p-4 rounded shadow">
                    <p className="mb-2"><strong className='w-[210px] inline-block'>Description:</strong> {job.jobDescription || 'N/A'}</p>
                    <p><strong className='w-[210px] inline-block'>Cost:</strong> ${job.cost || '0'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No work order descriptions available</p>
            )}

            <p className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4 bg-white p-4 mt-4'>
              <strong className='w-[210px] inline-block font-semibold'>Sub Total Cost:</strong>
              <span>{subTotalCost ? `$${subTotalCost}` : <span className="text-black-500">N/A</span>}</span>
            </p>
          </div>
          <div className="pl-6 pr-6">
            <div className=' border-b border-gray-500 text-sm bg-white p-4 flex'>

              <strong className='w-[210px] inline-block'>Total Cost:</strong>


              ${calculateTechnicianTotalCost(jobData).toFixed(2)}


            </div>
          </div>
          {/* Assigned Technicians Section */}
          <div className="p-6">

            {jobData?.assignedTechnicians?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobData.assignedTechnicians.map((tech: any) => {
                  let flatRateDisplay = "N/A"; // Default display message
                  if (tech.VehicleTechnician?.simpleFlatRate) {
                    try {
                      const rates = JSON.parse(tech.VehicleTechnician.simpleFlatRate);
                      const entries = Object.entries(rates);

                      // Check if "default" key exists and handle it
                      if (entries.length === 1 && entries[0][0] === "default") {
                        flatRateDisplay = (entries[0][1] as string).toString(); // Type assertion here
                      } else {
                        // Show non-default entries if available
                        flatRateDisplay = entries
                          .filter(([type]) => type !== "default") // Exclude the "default" key if present
                          .map(([type, amount]) => `${type}: ${amount}`)
                          .join(", ");
                        if (flatRateDisplay === "") {
                          flatRateDisplay = ""; // If no non-default rates, set to "N/A"
                        }
                      }

                      // Remove the word "technician" if it appears in the string
                      flatRateDisplay = flatRateDisplay.replace(/technician/gi, "").trim(); // Remove 'technician'

                    } catch (e) {
                      // If parsing fails, fallback to the original string value
                      flatRateDisplay = tech.VehicleTechnician.simpleFlatRate;
                    }
                  }


                  return (
                    <div key={tech.id} className="bg-gray-50 p-4 rounded shadow">
                      <p className="mb-1"><strong className='w-[210px] inline-block'>Name:</strong> {tech.firstName} {tech.lastName}</p>
                      <p className="mb-1"><strong className='w-[210px] inline-block'>Email:</strong> {tech.email}</p>
                      <p className="mb-1"><strong className='w-[210px] inline-block'>Phone:</strong> {tech.phoneNumber}</p>
                      {tech.VehicleTechnician && (
                        <>
                          {tech.VehicleTechnician.payRate && (
                            <p className="mb-1"><strong className='w-[210px] inline-block'>Pay Rate:</strong> {tech.VehicleTechnician.payRate}</p>
                          )}
                          {tech.VehicleTechnician.payVehicleType && (
                            <p className="mb-1"><strong className='w-[210px] inline-block'>Pay Vehicle Type:</strong> {tech.VehicleTechnician.payVehicleType}</p>
                          )}
                          {roleType === 'single-technician' && (
                            <p className="mb-1"><strong className='w-[210px] inline-block'>Labour Cost:</strong> ${jobData.labourCost}</p>

                          )}
                          {jobData.labourCost !== null || roleType !== 'single-technician' && ( 
                            <p className="mb-1"><strong className='w-[210px] inline-block'>Labour Cost:</strong> ${jobData.labourCost}</p>
                          )}
                          {roleType !== 'single-technician' && (
                              <div>
                          {flatRateDisplay && (
                            <p className="mb-1"><strong className='w-[210px] inline-block'>Amount:</strong> {flatRateDisplay}</p>
                          )}
                          {tech.VehicleTechnician?.amountPercentage &&
                            tech.VehicleTechnician?.amountPercentage !== "undefined" &&
                            tech.VehicleTechnician?.amountPercentage !== "" ? (
                            <p className="mb-1">
                              <strong className='w-[210px] inline-block'>Amount Percentage:</strong>
                              {tech.VehicleTechnician.amountPercentage}%
                            </p>
                          ) : null}
                          </div>
                          )}

                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500">No technicians assigned</p>
            )}
          </div>




          {/* Images Section */}
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-3 text-white">Images</h3>
            <div className="flex flex-wrap gap-4">
              {jobData?.images?.length > 0 ? (
                jobData.images.map((img: string, index: number) => (
                  <img
                    key={index}
                    src={img}
                    alt={`Vehicle image ${index + 1}`}
                    className="w-32 h-32 object-cover rounded cursor-pointer"
                    onClick={() => setPreviewImage(img)}
                  />
                ))
              ) : (
                <p className="text-white">No images available</p>
              )}
            </div>
          </div>
        </div>
        <ToastContainer />
        {previewImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
            onClick={() => setPreviewImage(null)}
          >
            <img src={previewImage} alt="Preview" className="max-w-[90%] max-h-[90%] rounded shadow-lg" />
          </div>
        )}
      </div>
    </>
  );
}