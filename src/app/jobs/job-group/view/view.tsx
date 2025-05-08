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
import User from '../../../../../public/user.png'

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
      const userId = localStorage.getItem("userID");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${apiUrl}/fetchGroupJobByVin?roleType=${roleType}&vin=${vin}&filterType=${filterType}&userId=${userId}`,
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
        <div className="w-[80%] ml-auto p-4 laptop-narrow">
          <div className='flex items-center gap-4 justify-between mb-5 bg-white p-3 sticky top-[4.8rem]'>
            {/* Keep your search and filter buttons here */}
            <div className="flex w-[300px] relative search__input">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', right: '10px', top: '12px', zIndex: '1' }} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <TextField fullWidth size="small" type='search' id="filled" color="warning" label="Search" variant="filled" onChange={(e) => {
                const value = e.target.value;
                const query = value.trim();

                if (value === "") {
                  const vin = new URLSearchParams(window.location.search).get("vin") || "";
                  fetchCustomerData(vin);
                } else {
                  fetchSearchedCustomerData(query);
                }
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
              <button className="text-xs border border-gray-300 p-3 pl-4 pr-4 bg-white rounded hover:text-white hover:bg-[#383d71]" onClick={() => {
                fetchCustomerData(vin);
              }}>
                All Data
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
        <div className="w-[80%] ml-auto p-4 laptop-narrow">

          <div className='flex items-center gap-4 justify-between mb-5 bg-white p-3 sticky top-[4.8rem]'>

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
              <button className="text-xs border border-gray-300 p-3 pl-4 pr-4 bg-white rounded hover:text-white hover:bg-[#383d71]" onClick={() => {
                fetchCustomerData(vin);
              }}>
                All Data
              </button>
            </div>
          </div>

          <div className="rounded-lg    ">
            {jobData.map((job, index) => (
              <div key={job?.id} className="bg-blue rounded-lg shadow-md mb-6">
                <div className="flex justify-between items-center   pb-3 pl-6 pr-6 pt-4">
                  <h2 className="text-xl font-bold ">
                    Work Order Id - {job?.id}
                  </h2>
                  <Link className="p-2" href={`/jobs/create-job/create?jobId=${job.id}&groupjob`} data-tooltip-id="edit"
                    data-tooltip-content="Edit">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M18.5 2.50023C18.8978 2.1024 19.4374 1.87891 20 1.87891C20.5626 1.87891 21.1022 2.1024 21.5 2.50023C21.8978 2.89805 22.1213 3.43762 22.1213 4.00023C22.1213 4.56284 21.8978 5.1024 21.5 5.50023L12 15.0002L8 16.0002L9 12.0002L18.5 2.50023Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>

                  </Link>
                </div>
                <div className="flex items-center gap-3 pl-6 pr-2 pt-4 bg-white">
                  {job.technicians?.length > 0 ? (
                    job.technicians.map((t: any, index: number) => (
                      t.image ? (
                        <img
                          key={index}
                          src={t.image}
                          alt=""
                          onClick={() => setPreviewImage(t.image)}
                          className="w-[60px] h-[60px] rounded-full object-cover"
                        />
                      ) : (
                        <div
                          key={index}
                          className="w-[60px] h-[60px] rounded-full bg-[#383D71] flex items-center justify-center text-white font-bold text-2xl"
                        >
                          {t.firstName?.charAt(0)?.toUpperCase() || 'T'}
                        </div>
                      )
                    ))
                  ) : (
                    <div className="w-[60px] h-[60px] rounded-full bg-[#383D71] flex items-center justify-center text-white font-bold text-2xl">
                      T
                    </div>
                  )}

                  <div className="text-sm capitalize">
                    {job.technicians?.map((t: any, index: number) => (
                      <h1 key={index} className="text-[16px] font-bold mb-0">
                        {t.firstName || 'N/A'} {t.lastName || 'N/A'}
                      </h1>
                    ))}
                    <p className="text-[14px]">Technician</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 pl-6 pr-2 pb-3 pt-4 bg-white">

                  <div className="pl-2 pr-2">
                    {/* Technicians Section */}



                    <div className="mb-2 text-sm items-center flex">
                      <strong className="mr-3 inline-block w-[180px]">Technician Email: </strong>
                      {job.technicians?.map((t: any, index: number) => (
                        <a key={index} href={`mailto:${t.email}`} className="hover:underline">
                          {t.email}
                        </a>
                      ))}
                    </div>

                    <div className="mb-2 text-sm items-center flex">
                      <strong className="mr-3 inline-block w-[180px]">Technician Number: </strong>
                      {job.technicians?.map((t: any) => t.phoneNumber || 'N/A').join(', ')}
                    </div>

                    <div className="mb-2 text-sm items-center flex">
                      <strong className="mr-3 block w-[180px]">
                        Vehicle Type:
                      </strong>{" "}
                      {job?.vehicleType}
                    </div>

                    <div className="mb-2 text-sm items-center flex">
                      <strong className="  inline-block mr-3 w-[180px]">Date: </strong>{" "}
                      {new Date(job.updatedAt).toLocaleDateString("en-GB")}
                    </div>
                  </div>
                  <div className="pl-2 pr-2">


                    {userType !== 'single-technician' && (

                      <div className="mb-2 text-sm items-center flex">

                        <strong className="mr-3 inline-block w-[180px] capitalize ">R/I/R/R: </strong>

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
                        <strong className='mr-3 inline-block w-[180px]'>Labour Cost:</strong> ${job?.labourCost}</div>

                    )}

                    <div className="mb-2 text-sm items-center flex">
                      <strong className="mr-3 inline-block w-[180px]">Total Cost: </strong> ${calculateTotalCost(job).toFixed(2)}
                    </div>
                    <div className="mb-2 text-sm items-center flex">

                      <strong className="mr-3 inline-block capitalize w-[180px]">Pay Rate:</strong>
                      {job.technicians?.map((t: any) => t.payRate || capitalize)}
                    </div>
                    <div className=" text-sm items-center flex">

                      <strong className="mr-3 inline-block w-[180px]">Job Status:</strong>
                      <span
                        className={`badge ${job.jobStatus
                          ? "badge-success bg-[#E6F9DD] text-[#1A932E] p-1 pl-4 pr-4 rounded shadow"
                          : "badge-error bg-[#FFE4E1] text-[#FF0000] p-1 pl-4 pr-4 rounded shadow"
                          }`}
                      >
                        {job.jobStatus ? "Completed" : "Inprogress"}
                      </span>
                    </div>

                    <div className="mt-2 text-sm items-center flex">
                      <strong className="mr-3 inline-block w-[180px]">Attachment</strong>
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
                <p className="text-[14px] flex items-start gap-1 mb-3 pb-3 bg-white pl-4 pr-4 border-t border-gray-500 pt-3  ">
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
          <h2 className="text-[18px] font-[600] mb-5 mt-4 text-[#383D71]">Customer Details</h2>
          {jobData.map((job, index) => (
            <div key={job.id} className="mb-5">
              <div className="flex gap-2 mb-4">
                {job?.customer?.image ? (
                  <img
                    key={index}
                    src={job.customer.image}
                    alt=""
                    onClick={() => setPreviewImage(job.customer.image)}
                    className="w-[40px] h-[40px] rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-[40px] h-[40px] rounded-full bg-[#383D71] flex items-center justify-center text-white font-bold"
                  >
                    {job?.customer?.firstName?.charAt(0)?.toUpperCase() || 'C'}
                  </div>
                )}
                <div>
                  <h2 className="font-[600] text-[#383D71]">{job.customer.firstName}{job.customer.lastName}</h2>
                  <p className="text-[12px] text-[#383D71]">Customer</p>
                </div>
              </div>
              <p className="text-[14px] flex items-center gap-1 mb-2">
                <svg width="30" height="30" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="17" cy="17" r="17" fill="#EDEEFF" />
                  <g clipPath="url(#clip0_2878_3032)">
                    <path d="M24.5001 20.6901V22.9401C24.5009 23.1489 24.4581 23.3557 24.3745 23.5471C24.2908 23.7385 24.168 23.9103 24.0141 24.0515C23.8602 24.1927 23.6785 24.3002 23.4806 24.3671C23.2828 24.434 23.0731 24.4589 22.8651 24.4401C20.5572 24.1893 18.3403 23.4007 16.3926 22.1376C14.5804 20.9861 13.0441 19.4497 11.8926 17.6376C10.6251 15.681 9.83625 13.4533 9.59007 11.1351C9.57133 10.9277 9.59598 10.7186 9.66245 10.5213C9.72892 10.3239 9.83575 10.1426 9.97615 9.98879C10.1165 9.83499 10.2874 9.7121 10.4779 9.62796C10.6684 9.54382 10.8743 9.50027 11.0826 9.50007H13.3326C13.6966 9.49649 14.0494 9.62538 14.3254 9.86272C14.6014 10.1001 14.7816 10.4297 14.8326 10.7901C14.9275 11.5101 15.1037 12.2171 15.3576 12.8976C15.4585 13.166 15.4803 13.4578 15.4205 13.7382C15.3607 14.0187 15.2217 14.2762 15.0201 14.4801L14.0676 15.4326C15.1352 17.3102 16.6899 18.8649 18.5676 19.9326L19.5201 18.9801C19.724 18.7784 19.9814 18.6395 20.2619 18.5796C20.5424 18.5198 20.8341 18.5417 21.1026 18.6426C21.783 18.8965 22.49 19.0726 23.2101 19.1676C23.5744 19.219 23.9071 19.4025 24.145 19.6832C24.3828 19.9639 24.5092 20.3223 24.5001 20.6901Z" stroke="#383D71" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                  <defs>
                    <clipPath id="clip0_2878_3032">
                      <rect width="18" height="18" fill="white" transform="translate(8 8)" />
                    </clipPath>
                  </defs>
                </svg>


                <a className="hover:underline text-[#383D71]" href={`tel:${job.customer?.phoneNumber}`}>{job.customer?.phoneNumber || '-'}</a>
              </p>

              <p className="text-[14px] flex items-center gap-1 mb-2">
                <svg width="30" height="30" style={{ minWidth: '30px' }} viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="17" cy="17" r="17" fill="#EDEEFF" />
                  <path d="M10.3337 10.332H23.667C24.5837 10.332 25.3337 11.082 25.3337 11.9987V21.9987C25.3337 22.9154 24.5837 23.6654 23.667 23.6654H10.3337C9.41699 23.6654 8.66699 22.9154 8.66699 21.9987V11.9987C8.66699 11.082 9.41699 10.332 10.3337 10.332Z" stroke="#383D71" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M25.3337 12L17.0003 17.8333L8.66699 12" stroke="#383D71" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                </svg>

                <a className="hover:underline text-[#383D71]" style={{ wordBreak: 'break-all' }} href={`mailto:${job.customer?.email}`}>{job.customer?.email || '-'}</a>
              </p>

              <p className="text-[14px] flex items-center gap-1 mb-2 text-[#383D71]">
                <svg width="30" height="30" style={{ minWidth: '30px' }} viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="17" cy="17" r="17" fill="#EDEEFF" />
                  <g clipPath="url(#clip0_2878_3030)">
                    <path d="M24.5 15.3359C24.5 21.1693 17 26.1693 17 26.1693C17 26.1693 9.5 21.1693 9.5 15.3359C9.5 13.3468 10.2902 11.4392 11.6967 10.0326C13.1032 8.62611 15.0109 7.83594 17 7.83594C18.9891 7.83594 20.8968 8.62611 22.3033 10.0326C23.7098 11.4392 24.5 13.3468 24.5 15.3359Z" stroke="#383D71" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M17 17.8359C18.3807 17.8359 19.5 16.7166 19.5 15.3359C19.5 13.9552 18.3807 12.8359 17 12.8359C15.6193 12.8359 14.5 13.9552 14.5 15.3359C14.5 16.7166 15.6193 17.8359 17 17.8359Z" stroke="#383D71" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                  <defs>
                    <clipPath id="clip0_2878_3030">
                      <rect width="20" height="20" fill="white" transform="translate(7 7)" />
                    </clipPath>
                  </defs>
                </svg>

                {job.customer?.address || '-'}
              </p>

              <p className="text-[14px] flex items-center gap-1 mb-2 text-[#383D71]">
                <svg width="30" height="30" style={{ minWidth: '30px' }} viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="17" cy="17" r="17" fill="#EDEEFF" />
                  <path fillRule="evenodd" clipRule="evenodd" d="M24.7353 13.9291H24.7957C25.2133 13.9291 25.1529 14.241 25.8824 14.1656C26.6119 14.0851 27.1602 13.9593 27.1854 13.6725C27.2105 13.3858 26.9238 12.9682 26.3251 12.8123C25.7264 12.6563 25.2586 12.6311 25.2586 12.6311C25.2586 12.6311 24.7353 12.5255 24.7353 12.8928V13.3858C24.7353 13.3858 24.6448 13.426 24.4838 13.3908C24.1669 12.7066 23.704 11.7306 23.4374 11.2678C23.0701 10.6289 22.406 10.156 19.2165 10.0302C19.2819 10.0151 18.9046 10 17.6167 10C17.5211 10 17.4205 10 17.3198 10H17.2645H17.2595H17.2544H17.2293H17.0934H16.9576H16.9325H16.9274H16.9224H16.8671C16.7664 10 16.6658 10 16.5702 10C15.2823 10.005 14.905 10.0151 14.9704 10.0302C11.7808 10.156 11.1218 10.6289 10.7495 11.2678C10.4829 11.7306 10.02 12.7116 9.7031 13.3908C9.54211 13.4311 9.45156 13.3858 9.45156 13.3858C9.45156 13.3858 9.45156 13.255 9.45156 12.8928C9.45156 12.5305 8.92835 12.6311 8.92835 12.6311C8.92835 12.6311 8.46047 12.6563 7.8618 12.8123C7.26313 12.9682 6.97637 13.3858 7.00152 13.6725C7.02668 13.9593 7.57504 14.0901 8.30452 14.1656C9.03399 14.2461 8.97362 13.9291 9.39119 13.9291H9.45156C9.39622 14.0448 9.36603 14.1153 9.36603 14.1153C9.37106 14.1505 7.61026 15.2925 7.46436 15.5591C7.03171 16.3389 7.00152 17.1187 7.00152 17.1187V17.1237V17.1287V17.1338V17.1388V17.1438V17.1539V17.164V17.169V17.174V17.1891V17.2042V17.2092V17.2193V17.2344V17.2394V17.2595V17.2646V17.2797V17.2948V17.2998V17.3249V17.33V17.3501V17.3652V17.3753V17.4004V17.4306V17.4407V17.4608V17.4859V17.491V17.5262V17.5362V17.5614V17.5866V17.5966V17.6318V17.6369V17.667C7.00152 17.7274 7.00655 17.7928 7.01158 17.8633V17.9035V17.9437V17.9538C7.01158 17.9941 7.01661 18.0343 7.01661 18.0745V18.0846V18.1249V18.1299C7.01661 18.155 7.01661 18.1802 7.02164 18.2104V18.2255V18.2607V18.2808V18.3211V18.3714V18.4116V18.4317V18.472V18.477C7.02164 18.5072 7.02668 18.5374 7.02668 18.5676V18.5827V18.6279V18.638C7.02668 18.6682 7.03171 18.6984 7.03171 18.7286V18.7386L7.03674 18.7839V18.804V18.8493L7.04177 18.9046L7.0468 18.9499V18.97L7.05183 19.0103V19.0304C7.05183 19.0556 7.05686 19.0807 7.05686 19.1059V19.131L7.06189 19.1763V19.1813C7.06189 19.2115 7.06692 19.2367 7.06692 19.2669V19.297L7.07195 19.3323V19.3675L7.07698 19.4027C7.07698 19.4228 7.08202 19.4429 7.08202 19.458V21.239C7.26313 21.2792 7.37884 21.3044 7.37884 21.3044C7.37884 21.3044 10.3722 22.4816 16.1124 22.4816H16.3237H16.3992H16.4143H17.7022H17.7726H17.7877H18.2958C24.0361 22.4816 27.0294 21.3044 27.0294 21.3044V19.453L27.0344 19.3977L27.0395 19.3625V19.3272L27.0445 19.292V19.2618C27.0445 19.2316 27.0495 19.2065 27.0495 19.1763V19.1713L27.0546 19.126V19.1008C27.0546 19.0757 27.0596 19.0505 27.0596 19.0254V19.0053L27.0646 18.965V18.9449L27.0697 18.8996L27.0747 18.8443V18.799V18.7789L27.0797 18.7336V18.7235C27.0797 18.6933 27.0848 18.6632 27.0848 18.633V18.6229V18.5776V18.5625C27.0848 18.5324 27.0898 18.5022 27.0898 18.472V18.467V18.4267V18.4066V18.3663V18.316V18.2758V18.2557V18.2204V18.2054C27.0898 18.1802 27.0948 18.15 27.0948 18.1249V18.1198V18.0796V18.0695C27.0948 18.0293 27.0999 17.989 27.0999 17.9488V17.9387V17.8985V17.8582C27.1049 17.7878 27.1049 17.7224 27.1099 17.662V17.6318V17.6268V17.5916V17.5815V17.5564V17.5312V17.5212V17.4859V17.4809V17.4558V17.4356V17.4256V17.3954V17.3702V17.3602V17.3451V17.3249V17.3199V17.2948V17.2897V17.2746V17.2595V17.2545V17.2344V17.2294V17.2143V17.2042V17.1992V17.1841V17.169V17.164V17.1589V17.1489V17.1388V17.1338V17.1287V17.1237V17.1187V17.1137C27.1099 17.1137 27.0797 16.3339 26.6471 15.5541C26.5012 15.2874 24.7404 14.1505 24.7454 14.1102C24.7454 14.1102 24.7152 14.0398 24.6599 13.9241L24.7353 13.9291ZM7.12729 21.8829V23.4676C7.12729 23.8299 7.42411 24.1267 7.78634 24.1267H9.46665C9.82887 24.1267 10.1257 23.8299 10.1257 23.4676V22.5269C9.0843 22.3709 8.058 22.1596 7.12729 21.8829ZM24.0713 22.5671V23.4626C24.0713 23.8248 24.3681 24.1217 24.7303 24.1217H26.4106C26.7728 24.1217 27.0697 23.8248 27.0697 23.4626V21.9634C26.1239 22.225 25.1026 22.4162 24.0713 22.5621V22.5671ZM22.2903 18.1903C22.2903 18.1903 22.7129 17.335 23.3871 17.1539C24.0612 16.9728 26.1591 16.8068 26.1591 16.8068C26.1591 16.8068 26.5364 16.9778 26.3905 17.2948C26.2446 17.6117 26.4458 18.1047 25.1227 18.2204C23.7946 18.3362 23.045 18.3915 23.045 18.3915C23.045 18.3915 22.4111 18.5625 22.2954 18.1903H22.2903ZM11.9066 18.1903C11.9066 18.1903 11.484 17.335 10.8099 17.1539C10.1358 16.9728 8.04291 16.8068 8.04291 16.8068C8.04291 16.8068 7.6656 16.9778 7.81149 17.2948C7.95739 17.6117 7.75615 18.1047 9.07927 18.2204C10.4074 18.3362 11.157 18.3915 11.157 18.3915C11.157 18.3915 11.7909 18.5625 11.9066 18.1903ZM16.2935 11.0364H16.8922C16.9023 11.0313 16.9123 11.0213 16.9224 11.0112C16.9878 10.7798 17.0834 10.4578 16.701 10.4679C15.4333 10.5031 13.0134 10.5987 12.4047 10.7647C11.5696 10.9961 10.7596 12.1482 10.5282 12.8424C10.3018 13.5266 10.6087 13.7329 11.7658 13.7379C12.9631 13.7329 15.7502 13.5971 17.028 13.592H17.0532H17.0784H17.0934H17.1085H17.1337H17.1588C18.4367 13.5971 21.2238 13.7329 22.4211 13.7379C23.5782 13.7329 23.8851 13.5317 23.6587 12.8424C23.4273 12.1482 22.6224 10.9961 21.7822 10.7647C21.2087 10.6037 19.0203 10.5131 17.7122 10.4729C17.2846 10.4578 17.3601 10.7094 17.4406 11.0062C17.4506 11.0162 17.4607 11.0213 17.4708 11.0313H18.0644C18.3663 11.0313 18.6178 11.2778 18.6178 11.5847V11.7658C18.6178 11.9168 18.492 12.0425 18.3411 12.0425H16.0118C15.8609 12.0425 15.7351 11.9168 15.7351 11.7658V11.5847C15.7351 11.2829 15.9816 11.0313 16.2885 11.0313L16.2935 11.0364ZM20.1271 18.6732H20.0415H14.1504H14.0649C14.0347 18.6732 14.0095 18.6984 14.0095 18.7286V19.9158C14.0095 19.946 14.0347 19.9712 14.0649 19.9712H14.1504H20.0415H20.1271C20.1572 19.9712 20.1824 19.946 20.1824 19.9158V18.7286C20.1824 18.6984 20.1572 18.6732 20.1271 18.6732ZM13.758 16.5653C13.758 16.5653 12.4298 16.7112 12.6059 17.7475C12.777 18.7839 13.3857 20.6604 13.3857 20.6604C13.3857 20.6604 13.8737 21.3798 14.8849 21.3798H16.364H16.369H16.374H16.3841H16.3942H16.4092H16.4243H16.4445H16.4495H16.4545H16.4646H16.4747H16.4847H16.4897H16.5048H16.5099H16.5199H16.525H16.5401H16.5501H16.5702H16.5753H16.5954H16.6004H16.6055H16.6256H16.6356H16.6558H16.6658H16.6709H16.6859H16.691H16.7061H16.7212H16.7463H16.7564H16.7765H16.7866H16.7916H16.8017H16.8318H16.852H16.8721H16.8872H16.9073H16.9174H16.9224H16.9425H16.9626H16.9677H16.9928H17.0029H17.0079H17.013H17.0431H17.0482H17.0532H17.0582H17.0884H17.0934H17.0985H17.1035H17.1337H17.1387H17.1438H17.1538H17.179H17.184H17.2041H17.2243H17.2293H17.2393H17.2595H17.2746H17.2947H17.3148H17.345H17.3551H17.3601H17.3701H17.3903H17.4003H17.4255H17.4406H17.4557H17.4607H17.4758H17.4808H17.4909H17.511H17.5211H17.5412H17.5462H17.5513H17.5714H17.5764H17.5965H17.6066H17.6217H17.6267H17.6368H17.6418H17.6569H17.6619H17.672H17.6821H17.6921H17.6972H17.7022H19.2718C20.283 21.3798 20.771 20.6604 20.771 20.6604C20.771 20.6604 21.3747 18.7839 21.5508 17.7475C21.7219 16.7112 20.3987 16.5653 20.3987 16.5653H17.9386H16.1024H13.7278H13.758Z" fill="#383D71" />
                </svg>
                {job.vin || '-'}
              </p>

              <p className="text-[14px] flex items-center gap-1 mb-2 text-[#383D71]">
                <svg width="30" height="30" style={{ minWidth: '30px' }} viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="17" cy="17" r="17" fill="#EDEEFF" />
                  <g clipPath="url(#clip0_2878_3029)">
                    <path d="M15.6128 11.3564C13.5491 11.8375 11.8879 13.4741 11.3806 15.5257C10.8718 17.5838 11.4542 19.6817 12.9386 21.1374C13.4637 21.6524 13.7773 22.4778 13.7773 23.3454V23.4839C13.7773 24.0552 14.0265 24.5692 14.4218 24.9235V26.062C14.4218 27.1282 15.2892 27.9956 16.3554 27.9956H17.6445C18.7106 27.9956 19.578 27.1282 19.578 26.062V24.9235C19.9733 24.5692 20.2226 24.0552 20.2226 23.4839V23.3428C20.2226 22.4884 20.5529 21.6474 21.1061 21.0929C22.1989 19.9978 22.8007 18.5427 22.8007 16.9956C22.8007 13.2969 19.3731 10.4799 15.6128 11.3564ZM18.289 26.062C18.289 26.4174 17.9998 26.7065 17.6445 26.7065H16.3554C16 26.7065 15.7109 26.4174 15.7109 26.062V25.4174H18.289V26.062ZM20.1936 20.1824C19.3928 20.9849 18.9335 22.1368 18.9335 23.3428V23.4839C18.9335 23.8392 18.6444 24.1284 18.289 24.1284H15.7109C15.3555 24.1284 15.0663 23.8392 15.0663 23.4839V23.3454C15.0663 22.1208 14.6198 20.9806 13.8412 20.2171C12.6857 19.084 12.2337 17.4459 12.632 15.8351C13.0241 14.2492 14.309 12.984 15.9055 12.6118C18.8563 11.9237 21.5116 14.1265 21.5116 16.9956C21.5116 18.1989 21.0435 19.3306 20.1936 20.1824Z" fill="#383D71" />
                    <path d="M11.9858 11.0782L10.1628 9.25519C9.91111 9.00348 9.50299 9.00348 9.25128 9.25519C8.99957 9.5069 8.99957 9.91497 9.25128 10.1667L11.0743 11.9897C11.326 12.2414 11.7341 12.2414 11.9858 11.9897C12.2375 11.738 12.2375 11.3299 11.9858 11.0782Z" fill="#383D71" />
                    <path d="M9.26562 16.3516H6.64453C6.28858 16.3516 6 16.6401 6 16.9961C6 17.352 6.28858 17.6406 6.64453 17.6406H9.26562C9.62158 17.6406 9.91016 17.352 9.91016 16.9961C9.91016 16.6401 9.62158 16.3516 9.26562 16.3516Z" fill="#383D71" />
                    <path d="M27.3555 16.3516H24.7344C24.3784 16.3516 24.0898 16.6401 24.0898 16.9961C24.0898 17.352 24.3784 17.6406 24.7344 17.6406H27.3555C27.7114 17.6406 28 17.352 28 16.9961C28 16.6401 27.7114 16.3516 27.3555 16.3516Z" fill="#383D71" />
                    <path d="M24.7475 9.25519C24.4959 9.00348 24.0878 9.00348 23.836 9.25519L22.013 11.0782C21.7613 11.3298 21.7613 11.738 22.013 11.9897C22.2647 12.2414 22.6728 12.2414 22.9245 11.9897L24.7475 10.1667C24.9992 9.91502 24.9992 9.5069 24.7475 9.25519Z" fill="#383D71" />
                    <path d="M17 6C16.644 6 16.3555 6.28858 16.3555 6.64453V9.26562C16.3555 9.62158 16.644 9.91016 17 9.91016C17.356 9.91016 17.6445 9.62158 17.6445 9.26562V6.64453C17.6445 6.28858 17.356 6 17 6Z" fill="#383D71" />
                    <path d="M16.9992 13.7734C16.7343 13.7734 16.4644 13.8052 16.1975 13.8677C15.0861 14.1271 14.1557 15.042 13.8824 16.1442C13.7967 16.4897 14.0073 16.8392 14.3528 16.9249C14.6983 17.0106 15.0478 16.7999 15.1335 16.4545C15.2908 15.8203 15.8488 15.2728 16.491 15.1229C16.6621 15.0828 16.8331 15.0625 16.9992 15.0625C17.3552 15.0625 17.6437 14.7739 17.6437 14.418C17.6437 14.062 17.3552 13.7734 16.9992 13.7734Z" fill="#383D71" />
                  </g>
                  <defs>
                    <clipPath id="clip0_2878_3029">
                      <rect width="22" height="22" fill="white" transform="translate(6 6)" />
                    </clipPath>
                  </defs>
                </svg>
                {job.make || '-'}
              </p>

              <p className="text-[14px] flex items-center gap-1 mb-2 text-[#383D71]">
                <svg width="30" height="30" style={{ minWidth: '30px' }} viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="17" cy="17" r="17" fill="#EDEEFF" />
                  <path fillRule="evenodd" clipRule="evenodd" d="M24.7353 13.9291H24.7957C25.2133 13.9291 25.1529 14.241 25.8824 14.1656C26.6119 14.0851 27.1602 13.9593 27.1854 13.6725C27.2105 13.3858 26.9238 12.9682 26.3251 12.8123C25.7264 12.6563 25.2586 12.6311 25.2586 12.6311C25.2586 12.6311 24.7353 12.5255 24.7353 12.8928V13.3858C24.7353 13.3858 24.6448 13.426 24.4838 13.3908C24.1669 12.7066 23.704 11.7306 23.4374 11.2678C23.0701 10.6289 22.406 10.156 19.2165 10.0302C19.2819 10.0151 18.9046 10 17.6167 10C17.5211 10 17.4205 10 17.3198 10H17.2645H17.2595H17.2544H17.2293H17.0934H16.9576H16.9325H16.9274H16.9224H16.8671C16.7664 10 16.6658 10 16.5702 10C15.2823 10.005 14.905 10.0151 14.9704 10.0302C11.7808 10.156 11.1218 10.6289 10.7495 11.2678C10.4829 11.7306 10.02 12.7116 9.7031 13.3908C9.54211 13.4311 9.45156 13.3858 9.45156 13.3858C9.45156 13.3858 9.45156 13.255 9.45156 12.8928C9.45156 12.5305 8.92835 12.6311 8.92835 12.6311C8.92835 12.6311 8.46047 12.6563 7.8618 12.8123C7.26313 12.9682 6.97637 13.3858 7.00152 13.6725C7.02668 13.9593 7.57504 14.0901 8.30452 14.1656C9.03399 14.2461 8.97362 13.9291 9.39119 13.9291H9.45156C9.39622 14.0448 9.36603 14.1153 9.36603 14.1153C9.37106 14.1505 7.61026 15.2925 7.46436 15.5591C7.03171 16.3389 7.00152 17.1187 7.00152 17.1187V17.1237V17.1287V17.1338V17.1388V17.1438V17.1539V17.164V17.169V17.174V17.1891V17.2042V17.2092V17.2193V17.2344V17.2394V17.2595V17.2646V17.2797V17.2948V17.2998V17.3249V17.33V17.3501V17.3652V17.3753V17.4004V17.4306V17.4407V17.4608V17.4859V17.491V17.5262V17.5362V17.5614V17.5866V17.5966V17.6318V17.6369V17.667C7.00152 17.7274 7.00655 17.7928 7.01158 17.8633V17.9035V17.9437V17.9538C7.01158 17.9941 7.01661 18.0343 7.01661 18.0745V18.0846V18.1249V18.1299C7.01661 18.155 7.01661 18.1802 7.02164 18.2104V18.2255V18.2607V18.2808V18.3211V18.3714V18.4116V18.4317V18.472V18.477C7.02164 18.5072 7.02668 18.5374 7.02668 18.5676V18.5827V18.6279V18.638C7.02668 18.6682 7.03171 18.6984 7.03171 18.7286V18.7386L7.03674 18.7839V18.804V18.8493L7.04177 18.9046L7.0468 18.9499V18.97L7.05183 19.0103V19.0304C7.05183 19.0556 7.05686 19.0807 7.05686 19.1059V19.131L7.06189 19.1763V19.1813C7.06189 19.2115 7.06692 19.2367 7.06692 19.2669V19.297L7.07195 19.3323V19.3675L7.07698 19.4027C7.07698 19.4228 7.08202 19.4429 7.08202 19.458V21.239C7.26313 21.2792 7.37884 21.3044 7.37884 21.3044C7.37884 21.3044 10.3722 22.4816 16.1124 22.4816H16.3237H16.3992H16.4143H17.7022H17.7726H17.7877H18.2958C24.0361 22.4816 27.0294 21.3044 27.0294 21.3044V19.453L27.0344 19.3977L27.0395 19.3625V19.3272L27.0445 19.292V19.2618C27.0445 19.2316 27.0495 19.2065 27.0495 19.1763V19.1713L27.0546 19.126V19.1008C27.0546 19.0757 27.0596 19.0505 27.0596 19.0254V19.0053L27.0646 18.965V18.9449L27.0697 18.8996L27.0747 18.8443V18.799V18.7789L27.0797 18.7336V18.7235C27.0797 18.6933 27.0848 18.6632 27.0848 18.633V18.6229V18.5776V18.5625C27.0848 18.5324 27.0898 18.5022 27.0898 18.472V18.467V18.4267V18.4066V18.3663V18.316V18.2758V18.2557V18.2204V18.2054C27.0898 18.1802 27.0948 18.15 27.0948 18.1249V18.1198V18.0796V18.0695C27.0948 18.0293 27.0999 17.989 27.0999 17.9488V17.9387V17.8985V17.8582C27.1049 17.7878 27.1049 17.7224 27.1099 17.662V17.6318V17.6268V17.5916V17.5815V17.5564V17.5312V17.5212V17.4859V17.4809V17.4558V17.4356V17.4256V17.3954V17.3702V17.3602V17.3451V17.3249V17.3199V17.2948V17.2897V17.2746V17.2595V17.2545V17.2344V17.2294V17.2143V17.2042V17.1992V17.1841V17.169V17.164V17.1589V17.1489V17.1388V17.1338V17.1287V17.1237V17.1187V17.1137C27.1099 17.1137 27.0797 16.3339 26.6471 15.5541C26.5012 15.2874 24.7404 14.1505 24.7454 14.1102C24.7454 14.1102 24.7152 14.0398 24.6599 13.9241L24.7353 13.9291ZM7.12729 21.8829V23.4676C7.12729 23.8299 7.42411 24.1267 7.78634 24.1267H9.46665C9.82887 24.1267 10.1257 23.8299 10.1257 23.4676V22.5269C9.0843 22.3709 8.058 22.1596 7.12729 21.8829ZM24.0713 22.5671V23.4626C24.0713 23.8248 24.3681 24.1217 24.7303 24.1217H26.4106C26.7728 24.1217 27.0697 23.8248 27.0697 23.4626V21.9634C26.1239 22.225 25.1026 22.4162 24.0713 22.5621V22.5671ZM22.2903 18.1903C22.2903 18.1903 22.7129 17.335 23.3871 17.1539C24.0612 16.9728 26.1591 16.8068 26.1591 16.8068C26.1591 16.8068 26.5364 16.9778 26.3905 17.2948C26.2446 17.6117 26.4458 18.1047 25.1227 18.2204C23.7946 18.3362 23.045 18.3915 23.045 18.3915C23.045 18.3915 22.4111 18.5625 22.2954 18.1903H22.2903ZM11.9066 18.1903C11.9066 18.1903 11.484 17.335 10.8099 17.1539C10.1358 16.9728 8.04291 16.8068 8.04291 16.8068C8.04291 16.8068 7.6656 16.9778 7.81149 17.2948C7.95739 17.6117 7.75615 18.1047 9.07927 18.2204C10.4074 18.3362 11.157 18.3915 11.157 18.3915C11.157 18.3915 11.7909 18.5625 11.9066 18.1903ZM16.2935 11.0364H16.8922C16.9023 11.0313 16.9123 11.0213 16.9224 11.0112C16.9878 10.7798 17.0834 10.4578 16.701 10.4679C15.4333 10.5031 13.0134 10.5987 12.4047 10.7647C11.5696 10.9961 10.7596 12.1482 10.5282 12.8424C10.3018 13.5266 10.6087 13.7329 11.7658 13.7379C12.9631 13.7329 15.7502 13.5971 17.028 13.592H17.0532H17.0784H17.0934H17.1085H17.1337H17.1588C18.4367 13.5971 21.2238 13.7329 22.4211 13.7379C23.5782 13.7329 23.8851 13.5317 23.6587 12.8424C23.4273 12.1482 22.6224 10.9961 21.7822 10.7647C21.2087 10.6037 19.0203 10.5131 17.7122 10.4729C17.2846 10.4578 17.3601 10.7094 17.4406 11.0062C17.4506 11.0162 17.4607 11.0213 17.4708 11.0313H18.0644C18.3663 11.0313 18.6178 11.2778 18.6178 11.5847V11.7658C18.6178 11.9168 18.492 12.0425 18.3411 12.0425H16.0118C15.8609 12.0425 15.7351 11.9168 15.7351 11.7658V11.5847C15.7351 11.2829 15.9816 11.0313 16.2885 11.0313L16.2935 11.0364ZM20.1271 18.6732H20.0415H14.1504H14.0649C14.0347 18.6732 14.0095 18.6984 14.0095 18.7286V19.9158C14.0095 19.946 14.0347 19.9712 14.0649 19.9712H14.1504H20.0415H20.1271C20.1572 19.9712 20.1824 19.946 20.1824 19.9158V18.7286C20.1824 18.6984 20.1572 18.6732 20.1271 18.6732ZM13.758 16.5653C13.758 16.5653 12.4298 16.7112 12.6059 17.7475C12.777 18.7839 13.3857 20.6604 13.3857 20.6604C13.3857 20.6604 13.8737 21.3798 14.8849 21.3798H16.364H16.369H16.374H16.3841H16.3942H16.4092H16.4243H16.4445H16.4495H16.4545H16.4646H16.4747H16.4847H16.4897H16.5048H16.5099H16.5199H16.525H16.5401H16.5501H16.5702H16.5753H16.5954H16.6004H16.6055H16.6256H16.6356H16.6558H16.6658H16.6709H16.6859H16.691H16.7061H16.7212H16.7463H16.7564H16.7765H16.7866H16.7916H16.8017H16.8318H16.852H16.8721H16.8872H16.9073H16.9174H16.9224H16.9425H16.9626H16.9677H16.9928H17.0029H17.0079H17.013H17.0431H17.0482H17.0532H17.0582H17.0884H17.0934H17.0985H17.1035H17.1337H17.1387H17.1438H17.1538H17.179H17.184H17.2041H17.2243H17.2293H17.2393H17.2595H17.2746H17.2947H17.3148H17.345H17.3551H17.3601H17.3701H17.3903H17.4003H17.4255H17.4406H17.4557H17.4607H17.4758H17.4808H17.4909H17.511H17.5211H17.5412H17.5462H17.5513H17.5714H17.5764H17.5965H17.6066H17.6217H17.6267H17.6368H17.6418H17.6569H17.6619H17.672H17.6821H17.6921H17.6972H17.7022H19.2718C20.283 21.3798 20.771 20.6604 20.771 20.6604C20.771 20.6604 21.3747 18.7839 21.5508 17.7475C21.7219 16.7112 20.3987 16.5653 20.3987 16.5653H17.9386H16.1024H13.7278H13.758Z" fill="#383D71" />
                </svg>
                {job.model || '-'}
              </p>

              <p className="text-[14px] flex items-center gap-1 mb-2 text-[#383D71]">
                <svg width="30" height="30" style={{ minWidth: '30px' }} viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="17" cy="17" r="17" fill="#EDEEFF" />
                  <path d="M22.8333 10.3359H11.1667C10.2462 10.3359 9.5 11.0821 9.5 12.0026V23.6693C9.5 24.5897 10.2462 25.3359 11.1667 25.3359H22.8333C23.7538 25.3359 24.5 24.5897 24.5 23.6693V12.0026C24.5 11.0821 23.7538 10.3359 22.8333 10.3359Z" stroke="#383D71" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M20.334 8.66406V11.9974" stroke="#383D71" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M13.666 8.66406V11.9974" stroke="#383D71" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9.5 15.3359H24.5" stroke="#383D71" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                </svg>

                {job.modelYear || '-'}
              </p>


              <p className="text-[14px] flex items-center gap-1 mb-2 text-[#383D71]">
                <svg width="30" height="30" style={{ minWidth: '30px' }} viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="17" cy="17" r="17" fill="#EDEEFF" />
                  <path d="M7.07048 18.1327L13.0367 24.0989C13.8591 24.9213 15.1973 24.9214 16.0198 24.0989L23.9747 16.144C24.2517 15.867 24.2443 15.4183 23.9747 15.1496L14.031 5.20593C13.7565 4.93138 13.3113 4.93133 13.0367 5.20593C12.7621 5.48047 12.7621 5.92569 13.0367 6.20029L14.5282 7.69185L7.07048 15.1496C6.24609 15.974 6.24599 17.3083 7.07048 18.1327ZM21.4888 14.6525L11.0479 13.1609L15.5225 8.68626L21.4888 14.6525ZM8.06484 16.144L9.80498 14.4038L21.986 16.144L15.0254 23.1046C14.7513 23.3788 14.3052 23.3788 14.031 23.1046L8.06484 17.1384C7.79001 16.8635 7.79001 16.4188 8.06484 16.144Z" fill="#383D71" />
                  <path d="M23.4224 19.414L22.2037 21.5244C22.0193 21.8437 21.9219 22.2081 21.9219 22.5781C21.9219 23.7412 22.8681 24.6875 24.0312 24.6875C25.1944 24.6875 26.1406 23.7412 26.1406 22.5781C26.1406 22.208 26.0432 21.8436 25.8587 21.5243L24.6401 19.414C24.5145 19.1965 24.2824 19.0625 24.0312 19.0625C23.7801 19.0625 23.548 19.1965 23.4224 19.414ZM24.641 22.2275C24.703 22.3348 24.7344 22.4528 24.7344 22.5781C24.7344 22.9658 24.419 23.2812 24.0312 23.2812C23.6435 23.2812 23.3281 22.9658 23.3281 22.5781C23.3281 22.4528 23.3596 22.3348 23.4215 22.2275L24.0312 21.1717L24.641 22.2275Z" fill="#383D71" />
                </svg>
                {job.color || '-'}
              </p>

            </div>
          ))}

        </div>
      </div>

    </>

  );

}
