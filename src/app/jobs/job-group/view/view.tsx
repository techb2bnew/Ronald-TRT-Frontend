"use client";
import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loading from "@/app/component/loader";
import Breadcrumb from "@/app/component/breadcrumb";
import { capitalize } from "@mui/material";
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import Link from "next/link";
import Image from "next/image";
import Edit from "../../../../../public/edit.svg";

export default function ViewDetails() {
  const [jobData, setJobsData] = useState<any[]>([]); // Array to store multiple jobs
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [userType, setUserType] = useState<string | null>(null);

  const fetchCustomerData = async (vin: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api";

    try {
      const token = localStorage.getItem("token");
      const roleType = localStorage.getItem("types");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${apiUrl}/fetchGroupJobByVin?roleType=${roleType}&vin=${vin}`,
        {
          method: "GET",
          headers,
        }
      );

      const data = await response.json();

      if (response.ok) {
        setJobsData(data.GroupJob); // Set all GroupJob data
      } else {
        toast.error(data.error || "Error fetching data");
      }
    } catch (error) {
      toast.error("An error occurred while fetching data");
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const vin = searchParams.get("vin") || "";

    if (vin) {
      setIsEdit(true);
      fetchCustomerData(vin);
    } else {
      setIsEdit(false);
    }
  }, []);

  // const calculateTotalCost = (job: any) => {
  //   if (job?.jobDescription && Array.isArray(job.jobDescription)) {
  //     return job.jobDescription.reduce((total: number, item: string) => {
  //       const parsedItem = JSON.parse(item);
  //       return total + parseFloat(parsedItem.cost || '0');
  //     }, 0);
  //   }
  //   return 0;
  // };
  const calculateTotalCost = (jobData: any) => {
    let subtotalcost = 0;
  
    // Check if jobDescription exists and is an array
    if (jobData?.jobDescription && Array.isArray(jobData.jobDescription)) {
      subtotalcost = jobData.jobDescription.reduce((total: number, item: any) => {
        let parsedItem = item;
  
        // Only parse if item is a string
        if (typeof item === 'string') {
          try {
            parsedItem = JSON.parse(item); // Parse the stringified JSON
          } catch (error) {
            console.error("Error parsing job description:", error);
            return total; // Skip this item if parsing fails
          }
        }
  
        // Check if parsedItem has a cost property and is a number
        const cost = parseFloat(parsedItem?.cost || '0');
        return total + (isNaN(cost) ? 0 : cost);
      }, 0);
    }
  
    // Check if jobData has valid `simpleFlatRate` and `amountPercentage`
    const simpleFlatRate = parseFloat(jobData?.simpleFlatRate || '0');
    const amountPercentage = parseFloat(jobData?.amountPercentage || '0');
  
    // If jobData's `simpleFlatRate` or `amountPercentage` are null, fallback to technicians
    const finalSimpleFlatRate = isNaN(simpleFlatRate) || simpleFlatRate <= 0
      ? parseFloat(jobData?.technicians?.[0]?.simpleFlatRate || '0')
      : simpleFlatRate;
      
    const finalAmountPercentage = isNaN(amountPercentage) || amountPercentage <= 0
      ? parseFloat(jobData?.technicians?.[0]?.amountPercentage || '0')
      : amountPercentage;
  
    // Calculate the percentage amount
    const percentageAmount = !isNaN(finalAmountPercentage) && finalAmountPercentage > 0
      ? (subtotalcost * finalAmountPercentage) / 100
      : 0;
  
    // Calculate the totalCost by adding final simpleFlatRate and percentageAmount if available
    const totalCost = finalSimpleFlatRate + subtotalcost + percentageAmount;
  
    return totalCost;
  };
    React.useEffect(() => {
      const type = localStorage.getItem('types');
      setUserType(type);
    });
  
  if (!jobData || jobData.length === 0) {
    return (
      <div>
        <Loading />
      </div>
    );
  }

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Group Work Orders', href: '/jobs/job-group/listing' },
          { label: 'View Detail', href: '/jobs/job-group/listing' }
        ]}
      />
      <div className="max-w-7xl mx-auto p-4 rounded-lg shadow bg-white">
        {jobData.map((job, index) => (
          <div key={index} className="bg-blue rounded-lg shadow-md mb-6">
            <div className="flex justify-between items-center border-b border-[#ccc] pb-3 mb-2 pl-6 pr-6 pt-4">
            <h2 className="text-xl font-bold ">
              Work Order Id - {job?.id}
            </h2>
            <Link className="p-2 bg-white rounded" href={`/jobs/create-job/create?jobId=${job.id}&groupjob`} data-tooltip-id="edit"
        data-tooltip-content="Edit">
          <Image alt="edit" src={Edit} className="w-[14px]" />
        </Link>
        </div>
            <div className="grid grid-cols-2 gap-3 p-6">
              {/* Left Section */}
              <div className="  p-5 bg-white  rounded">

                <div className="mb-4 border-b border-gray-500 text-sm mb-3 pb-4 capitalize">
                  <strong className="w-[200px] inline-block">
                    Customer Name:
                  </strong>{" "}
                  {job?.customer?.firstName} {job?.customer?.lastName}
                </div>
                <div className="mb-4 border-b border-gray-500 text-sm mb-3 pb-4">
                  <strong className="w-[200px] inline-block">
                    Customer Email:
                  </strong>{" "}
                  {job?.customer?.email}
                </div>
                <div className="mb-4 border-b border-gray-500 text-sm mb-3 pb-4">
                  <strong className="w-[200px] inline-block">
                    Customer Ph. Number:
                  </strong>{" "}
                  {job?.customer?.phoneNumber}
                </div>
                <div className="mb-4 border-b border-gray-500 text-sm mb-3 pb-4">
                  <strong className="w-[200px] inline-block">VIN:</strong>{" "}
                  {job?.vin}
                </div>
                <div className="mb-4 border-b border-gray-500 text-sm mb-3 pb-4 capitalize">
                  <strong className="w-[200px] inline-block">Model:</strong>{" "}
                  {job?.model}
                </div>
                <div className="mb-4 border-b border-gray-500 text-sm mb-3 pb-4 capitalize">
                  <strong className="w-[200px] inline-block">
                    Manufacture Name:
                  </strong>{" "}
                  {job?.manufacturerName}
                </div>

                <div className="mb-4 border-b border-gray-500 text-sm mb-3 pb-4 flex">
  <strong className="w-[200px] inline-block">Job Description:</strong>
  {job?.jobDescription && Array.isArray(job.jobDescription) ? (
    <ul className="list-none">
      {job.jobDescription.map((item: string | object, index: number) => {
        let parsedItem;

        // Check if the item is a stringified JSON and try to parse it
        try {
          parsedItem = typeof item === 'string' ? JSON.parse(item) : item;
        } catch (error) {
          console.error("Error parsing job description:", error);
          parsedItem = {}; // Fallback in case of an error
        }

        return (
          <li key={index}>
            <span className="block">
              {parsedItem?.jobDescription || "No description available"}
            </span>
          </li>
        );
      })}
    </ul>
  ) : (
    'No job descriptions available'
  )}
</div>


{userType !== 'single-technician' && (

<div className="mb-4 border-b border-gray-500 text-sm mb-3 pb-4 flex capitalize">
  <strong className="w-[200px] min-w-[200px] inline-block capitalize">R/I/R/R</strong>

  {(() => {
    if (!job) return null;

    // Parse jobDescription items and calculate total cost
    let totalCost = 0;

    if (job?.jobDescription && Array.isArray(job.jobDescription)) {
      totalCost = job.jobDescription.reduce((sum: number, item: any) => {
        return sum + Number(item?.cost || 0); // Accumulate the cost
      }, 0);
    }

    const simpleFlatRate = Number(job.simpleFlatRate);
    const amountPercentage = Number(job.amountPercentage);

    // If both are invalid in the first job data, fallback to technician data
    const fallbackSimpleFlatRate = Number(job?.technicians?.[0]?.simpleFlatRate || 0);
    const fallbackAmountPercentage = Number(job?.technicians?.[0]?.amountPercentage || 0);

    // Check if both simpleFlatRate and amountPercentage are invalid
    if (
      (isNaN(simpleFlatRate) || simpleFlatRate === 0) &&
      (isNaN(amountPercentage) || amountPercentage === 0)
    ) {
      // Fallback to technician data if primary values are invalid
      if (!isNaN(fallbackSimpleFlatRate) && fallbackSimpleFlatRate > 0) {
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            ${fallbackSimpleFlatRate.toFixed(2)}
          </div>
        );
      }

      // If technician simpleFlatRate is also invalid, fallback to percentage-based calculation
      if (!isNaN(fallbackAmountPercentage) && fallbackAmountPercentage > 0) {
        const fallbackPercentageAmount = (totalCost * fallbackAmountPercentage) / 100;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            ${fallbackPercentageAmount.toFixed(2)} ({fallbackAmountPercentage}%)
          </div>
        );
      }

      // Show red dot with tooltip if both fallback values are invalid
      const tooltipId = `tooltip-${job.id}`;
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span
            data-tooltip-id={tooltipId}
            data-tooltip-content="R/I/R/R price is not added for this job."
            style={{
              height: '12px',
              width: '12px',
              backgroundColor: 'red',
              borderRadius: '50%',
              display: 'inline-block',
              cursor: 'pointer',
            }}
          ></span>
          <Tooltip id={tooltipId} place="top" />
        </div>
      );
    }

    // If jobData has valid `simpleFlatRate` or `amountPercentage`, show them
    if (!isNaN(simpleFlatRate) && simpleFlatRate > 0) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          ${simpleFlatRate.toFixed(2)}
        </div>
      );
    }

    // Show percentage-based calculation
    if (!isNaN(amountPercentage) && amountPercentage > 0) {
      const percentageAmount = (totalCost * amountPercentage) / 100;
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          ${percentageAmount.toFixed(2)} ({amountPercentage}%)
        </div>
      );
    }

    return null;
  })()}
</div>
)}
{userType === 'single-technician' && (
              <div className='mb-4 border-b border-gray-500 text-sm mb-3 pb-4'><strong className='w-[210px] inline-block'>Labour Cost:</strong> ${job?.labourCost}</div>

                )}













                <div className="mb-4 border-b border-gray-500 text-sm mb-3 pb-4">
                  <strong className="w-[200px] inline-block">Total Cost: </strong> ${calculateTotalCost(job).toFixed(2)}
                </div>

                <div className="mb-4 border-b border-gray-500 text-sm mb-3 pb-4">
                  <strong className="w-[200px] inline-block">Images:</strong>
                  {job?.images && Array.isArray(job.images) && job.images.length > 0 ? (
                    <div className="flex gap-2 mt-2">
                      {job.images.map((image: string, index: number) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Job Image ${index + 1}`}
                          className="w-[70px] h-[70px] rounded-lg shadow cursor-pointer hover:scale-105 transition"
                          onClick={() => window.open(image, '_blank')} // Opens image in a new tab
                        />
                      ))}
                    </div>
                  ) : (
                    <p>No images available</p>
                  )}
                </div>

              </div>

              {/* Right Section */}
              <div className="  p-5 bg-white  rounded">
                {/* Technicians Section */}
                <div className="mb-4 border-b border-gray-500 text-sm mb-3 pb-4 flex capitalize">
                  <strong className="w-[200px] min-w-[200px] inline-block">Technician Name:</strong>
                  {job.technicians?.map((t: any) => `${t.firstName} ${t.lastName}`).join(', ')}
                </div>

                <div className="mb-4 border-b border-gray-500 text-sm mb-3 pb-4 flex">
                  <strong className="w-[200px] min-w-[200px] inline-block">Technician Email:</strong>
                  {job.technicians?.map((t: any) => t.email).join(', ')}
                </div>

                <div className="mb-4 border-b border-gray-500 text-sm mb-3 pb-4 flex">
                  <strong className="w-[200px] min-w-[200px] inline-block">Technician Ph. Number:</strong>
                  {job.technicians?.map((t: any) => t.phoneNumber || 'N/A').join(', ')}
                </div>
                <div className="mb-4 border-b border-gray-500 text-sm mb-3 pb-4 flex capitalize">
                  <strong className="w-[200px] min-w-[200px] inline-block capitalize">payRate</strong>
                  {job.technicians?.map((t: any) => t.payRate || capitalize)}
                </div>

                {/* {job.technicians?.length > 0 && (
                <div className=""> 
                  {job.technicians.map((tech: any, techIndex: any) => (
                    <div
                      key={techIndex}
                      className="  mb-3   rounded"
                    >
                       <div className="mb-4 border-b border-gray-500 text-sm mb-3 pb-4">
                        <strong className="w-[200px] inline-block">Technician Name:</strong>{" "}
                        {tech.firstName} {tech.lastName}
                      </div>
                      <div className="mb-4 border-b border-gray-500 text-sm mb-3 pb-4">
                        <strong className="w-[200px] inline-block">Technician Email:</strong>{" "}
                        {tech.email}
                      </div>
                      <div className="mb-4 border-b border-gray-500 text-sm mb-3 pb-4">
                        <strong className="w-[200px] inline-block">Technician Phone Number:</strong>{" "}
                        {tech.phoneNumber}
                      </div>
                       
                    </div>
                  ))}
                </div>
              )} */}


                <div className="mb-4 border-b border-gray-500 text-sm mb-3 pb-4 capitalize">
                  <strong className="w-[200px] inline-block">Make:</strong>{" "}
                  {job?.make}
                </div>
                <div className="mb-4 border-b border-gray-500 text-sm mb-3 pb-4 capitalize">
                  <strong className="w-[200px] inline-block">Model Year:</strong>{" "}
                  {job?.modelYear}
                </div>
                <div className="mb-4 border-b border-gray-500 text-sm mb-3 pb-4 capitalize">
                  <strong className="w-[200px] inline-block">
                    Vehicle Type:
                  </strong>{" "}
                  {job?.vehicleType}
                </div>
                <div className="mb-4 border-b border-gray-500 text-sm mb-3 pb-4 capitalize">
                  <strong className="w-[200px] inline-block">Color:</strong>{" "}
                  {job?.color}
                </div>
                <div className="mb-4 border-b border-gray-500 text-sm mb-3 pb-4">
                  <strong className="w-[200px] inline-block">Job Status:</strong>
                  <span
                    className={`badge ${job.jobStatus
                      ? "badge-success bg-[#E6F9DD] text-[#1A932E] p-2 pl-4 pr-4 rounded shadow"
                      : "badge-error bg-[#FFE4E1] text-[#FF0000] p-2 pl-4 pr-4 rounded shadow"
                      }`}
                  >
                    {job.jobStatus ? "Completed" : "Inprogress"}
                  </span>
                </div>
                <div className="mb-4 border-b border-gray-500 text-sm mb-3 pb-4">
                  <strong className="w-[200px] inline-block">Date:</strong>{" "}
                  {new Date(job.updatedAt).toLocaleDateString("en-GB")}
                </div>


              </div>
            </div>
          </div>
        ))}
        <ToastContainer />
      </div>
    </>

  );

}
