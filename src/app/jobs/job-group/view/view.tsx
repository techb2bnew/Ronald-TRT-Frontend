"use client";
import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loading from "@/app/component/loader";
import Breadcrumb from "@/app/component/breadcrumb";
import { capitalize, TextField } from "@mui/material";
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import Link from "next/link";
import Image from "next/image";
import Edit from "../../../../../public/edit.svg"; 
import Empty from '@/app/component/empty';

export default function ViewDetails() {
  const [jobData, setJobsData] = useState<any[]>([]); // Array to store multiple jobs
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [userType, setUserType] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'' | 'completed' | 'inProgress' | 'missingPayRates'>('');
  const [vin, setVin] = useState('');

  const fetchCustomerData = async (vin: string, filterType: string = '') => {
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
        `${apiUrl}/fetchGroupJobByVin?roleType=${roleType}&vin=${vin}&filterType=${filterType}`,
        {
          method: "GET",
          headers,
        }
      );
  
      const data = await response.json();
  
      if (response.ok) {
        setJobsData(data.GroupJob);
      } else {
        toast.error(data.error || "Error fetching data");
      }
    } catch (error) {
      toast.error("An error occurred while fetching data");
    }
  };
  const fetchSearchedCustomerData = async (query: string) => {
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
      const searchParams = new URLSearchParams(window.location.search);
      const vin = searchParams.get("vin") || "";
      const response = await fetch(
        `${apiUrl}/searchGroupJobByVin?searchQuery=${encodeURIComponent(query)}&roleType=${encodeURIComponent(roleType || "")}&vin=${encodeURIComponent(vin || '')}`,
        {
          method: "GET",
          headers,
        }
      );

      const data = await response.json();

      if (response.ok) {
        setJobsData(data.searchGroup);
      } else {
        toast.error(data.error || "Error searching jobs");
      }
    } catch (error) {
      toast.error("An error occurred during search");
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const vin = searchParams.get("vin") || "";

    if (vin) {
      setIsEdit(true);
      setVin(vin); 
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

  if (!jobData) {
    return (
      <div>
        <Loading />
      </div>
    );
  }
 
  if (jobData.length === 0) {
    return (
      <>
        <div className="w-[1000px] ml-auto p-4 laptop-narrow">
          <div className='flex items-center gap-4 justify-between mb-5 bg-white p-3 sticky top-[4.8rem]'>
            {/* Keep your search and filter buttons here */}
            <div className="flex w-[300px] relative search__input">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', right: '10px', top: '12px', zIndex: '1' }} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <TextField fullWidth size="small" type='search' id="filled" color="warning" label="Search" variant="filled" onChange={(e) => {
                const query = e.target.value.trim();
                fetchSearchedCustomerData(query);
              }} />
            </div>
            <div className='flex items-center gap-4'>
              <button className="text-xs border border-gray-300 p-3 pl-4 pr-4 bg-white rounded hover:text-white hover:bg-green-600" onClick={() => {
                setFilterType('completed');
                fetchCustomerData(vin, 'completed');
              }}>
                Completed Jobs
              </button>
              <button className="text-xs border border-gray-300 p-3 pl-4 pr-4 bg-white rounded hover:text-white hover:bg-yellow-500" onClick={() => {
                setFilterType('inProgress');
                fetchCustomerData(vin, 'inProgress');
              }}>
                In Progress Jobs
              </button>
              <button className="text-xs border border-gray-300 p-3 pl-4 pr-4 bg-white rounded hover:text-white hover:bg-[#383d71]" onClick={() => {
                setFilterType('missingPayRates');
                fetchCustomerData(vin, 'missingPayRates');
              }}>
                Pay Rates Missing
              </button>
            </div>
          </div>
          <Empty />
        </div>
      </>
    );
  }
  return (
    <>

      <div>
        <div className="w-[1000px] ml-auto p-4 laptop-narrow">
       
                  <div className='flex items-center gap-4 justify-between mb-5 bg-white p-3 sticky top-[4.8rem]'>

                    <div className="flex w-[300] relative search__input">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', right: '10px', top: '12px', zIndex: '1' }} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>

                      <TextField fullWidth size="small" type='search' id="filled" color="warning" label="Search" variant="filled" onChange={(e) => {
                        const query = e.target.value.trim();
                        fetchSearchedCustomerData(query);
                      }} />

                    </div>
                    <div className='flex items-center gap-4'>
                      <button
                        className="text-xs border border-gray-300 p-3 pl-4 pr-4 bg-white rounded hover:text-white hover:bg-green-600"
                        onClick={() => {
                          setFilterType('completed');
                          fetchCustomerData(vin, 'completed');
                        }}
                        
                      
                      >
                        Completed Jobs
                      </button>
                      <button
                        className="text-xs border border-gray-300 p-3 pl-4 pr-4 bg-white rounded hover:text-white hover:bg-yellow-500"
                        onClick={() => {
                          setFilterType('inProgress');
                          fetchCustomerData(vin, 'inProgress');
                        }}
                      >
                        In Progress Jobs
                      </button>
                      <button
                        className="text-xs border border-gray-300 p-3 pl-4 pr-4 bg-white rounded hover:text-white hover:bg-[#383d71]"
                        onClick={() => {
                          setFilterType('missingPayRates');
                          fetchCustomerData(vin, 'missingPayRates');
                        }}
                      >
                        Pay Rates Missing
                      </button>
                    </div>
                  </div>
           
          <div className="rounded-lg    ">
            {jobData.map((job, index) => (
              <div key={job?.id} className="bg-blue rounded-lg shadow-md mb-6">
                <div className="flex justify-between items-center   pb-3   pl-6 pr-6 pt-4">
                  <h2 className="text-xl font-bold ">
                    Work Order Id - {job?.id}
                  </h2>
                  <Link className="p-2 bg-white rounded" href={`/jobs/create-job/create?jobId=${job.id}&groupjob`} data-tooltip-id="edit"
                    data-tooltip-content="Edit">
                    <Image alt="edit" src={Edit} className="w-[14px]" />
                  </Link>
                </div>
                <div className="flex pl-2 pr-2 pt-4  bg-white">

                  <div className="pl-2 pr-2">
                    {/* Technicians Section */}
                    <div className="mb-2 text-sm flex capitalize">

                      {job.technicians?.map((t: any, index: number) => (
                        <a key={index} href={`tel:${t.phoneNumber}`} className="hover:underline">
                          {t.phoneNumber || 'N/A'}
                        </a>
                      ))}
                    </div>

                    <div className="mb-2 text-sm items-center flex">
                      <strong className="mr-3 inline-block">Technician Email: </strong>
                      {job.technicians?.map((t: any, index: number) => (
                        <a key={index} href={`mailto:${t.email}`} className="hover:underline">
                          {t.email}
                        </a>
                      ))}
                    </div>

                    <div className="mb-2 text-sm items-center flex">
                      <strong className="mr-3 inline-block">Technician Number: </strong>
                      {job.technicians?.map((t: any) => t.phoneNumber || 'N/A').join(', ')}
                    </div>

                    <div className="mb-2 text-sm items-center flex">
                      <strong className="mr-3 block">
                        Vehicle Type:
                      </strong>{" "}
                      {job?.vehicleType}
                    </div>

                    <div className="mb-2 text-sm items-center flex">
                      <strong className="  inline-block mr-3">Date: </strong>{" "}
                      {new Date(job.updatedAt).toLocaleDateString("en-GB")}
                    </div>
                  </div>
                  <div className="pl-2 pr-2">


                    {userType !== 'single-technician' && (

                      <div className="mb-2 text-sm items-center flex">

                        <strong className="mr-3 inline-block capitalize">R/I/R/R: </strong>

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
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'red' }}>
                                {/* <span
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
                                <Tooltip id={tooltipId} place="top" /> */}
                                Per Job
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
                      <div className="mb-2 text-sm items-center flex">
                        <strong className='mr-3 inline-block'>Labour Cost:</strong> ${job?.labourCost}</div>

                    )}

                    <div className="mb-2 text-sm items-center flex">
                      <strong className="mr-2 inline-block">Total Cost: </strong> ${calculateTotalCost(job).toFixed(2)}
                    </div>
                    <div className="mb-2 text-sm items-center flex">

                      <strong className="mr-3 inline-block capitalize">Pay Rate:</strong>
                      {job.technicians?.map((t: any) => t.payRate || capitalize)}
                    </div>
                    <div className=" text-sm items-center flex">

                      <strong className="mr-3 inline-block">Job Status:</strong>
                      <span
                        className={`badge ${job.jobStatus
                          ? "badge-success bg-[#E6F9DD] text-[#1A932E] p-1 pl-4 pr-4 rounded shadow"
                          : "badge-error bg-[#FFE4E1] text-[#FF0000] p-1 pl-4 pr-4 rounded shadow"
                          }`}
                      >
                        {job.jobStatus ? "Completed" : "Inprogress"}
                      </span>
                    </div>


                  </div>
                  <div className="w-[200px]">
                    <div className=" text-sm items-center  ">
                      <strong className="mr-3 inline-block">Attachment</strong>
                      {job?.images && Array.isArray(job.images) && job.images.length > 0 ? (
                        <div className="flex gap-2 mt-2">
                          {job.images.map((image: string, index: number) => (
                            <img
                              key={index}
                              src={image}
                              alt={`Job Image ${index + 1}`}
                              className="w-[70px] h-[70px] rounded shadow-lg cursor-pointer hover:scale-105 transition"
                              onClick={() => setPreviewImage(image)}
                            />
                          ))}
                        </div>
                      ) : (
                        <p>No images available</p>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-[14px] flex items-start gap-1 mb-3 pb-3 bg-white pl-4 pr-4 border-t border-gray-500 pt-3 ">
                  <strong className="mr-3 pl-1 inline-block">Job Description:</strong>
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
                </p>
              </div>
            ))}
          </div>
          <ToastContainer />

          {previewImage && (
            <div
              className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
              onClick={() => setPreviewImage(null)} // Close on backdrop click
            >
              <img src={previewImage} alt="Preview" className="max-w-[90%] max-h-[90%] rounded shadow-lg" />
            </div>
          )}
        </div>
        <div className="rightsidebar shadow-lg">
          {jobData.map((job, index) => (
            <div key={job.id} className="mb-4">
              <h2 className="font-[600]">{job.customer.firstName}{job.customer.lastName}</h2>
              <p className="text-[14px] flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75L6.75 3m0 0h10.5m-10.5 0v3.75m10.5 0L21.75 6.75m0 0v10.5m0 0L17.25 21m0 0H6.75m10.5 0v-3.75M6.75 21L2.25 17.25m0 0V6.75" /></svg>
                <a className="hover:underline" href={`tel:${job.customer?.phoneNumber}`}>{job.customer?.phoneNumber || '-'}</a>
              </p>

              <p className="text-[14px] flex items-center gap-1">
                <svg className="w-4 h-4 w-min-[20px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-18 0v8a2 2 0 002 2h14a2 2 0 002-2V8m-18 0l9-6 9 6" /></svg>
                <a className="hover:underline" href={`mailto:${job.customer?.email}`}>{job.customer?.email || '-'}</a>
              </p>

              <p className="text-[14px] flex items-center gap-1">
                <svg className="w-4 h-4 w-min-[20px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 12.414a2 2 0 00-2.828 0L6.343 16.657a8 8 0 1111.314 0z" /></svg>
                {job.customer?.address || '-'}
              </p>

              <p className="text-[14px] flex items-center gap-1">
                <svg className="w-4 h-4 w-min-[20px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                {job.vin || '-'}
              </p>

              <p className="text-[14px] flex items-center gap-1">
                <svg className="w-4 h-4 w-min-[20px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                {job.make || '-'}
              </p>

              <p className="text-[14px] flex items-center gap-1">
                <svg className="w-4 h-4 w-min-[20px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.75L15.25 8H18a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8a2 2 0 012-2h2.75L12 4.75z" /></svg>
                {job.model || '-'}
              </p>

              <p className="text-[14px] flex items-center gap-1">
                <svg className="w-4 h-4 w-min-[20px] text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {job.modelYear || '-'}
              </p>


              <p className="text-[14px] flex items-center gap-1">
                <svg className="w-4 h-4 w-min-[20px]" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16z" /></svg>
                {job.color || '-'}
              </p>

            </div>
          ))}

        </div>
      </div>
    </>

  );

}
