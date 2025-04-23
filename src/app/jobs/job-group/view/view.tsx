"use client";
import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loading from "@/app/component/loader";
import Breadcrumb from "@/app/component/breadcrumb";
import { capitalize } from "@mui/material";

export default function ViewDetails() {
  const [jobData, setJobsData] = useState<any[]>([]); // Array to store multiple jobs
  const [isEdit, setIsEdit] = useState<boolean>(false);

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

  const calculateTotalCost = (job: any) => {
    if (job?.jobDescription && Array.isArray(job.jobDescription)) {
      return job.jobDescription.reduce((total: number, item: string) => {
        const parsedItem = JSON.parse(item);
        return total + parseFloat(parsedItem.cost || '0');
      }, 0);
    }
    return 0;
  };

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
            <h2 className="text-xl font-bold mb-2 pt-4 pl-6 border-b border-[#ccc] pb-3">
              Work Order Id - {job?.id}
            </h2>
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
                      {job.jobDescription.map((item: string, index: number) => {
                        const parsed = JSON.parse(item);
                        return (
                          <li key={index}>
                            <span className="block">
                              {parsed.jobDescription}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    'No job descriptions available'
                  )}
                </div>



                <div className="mb-4 border-b border-gray-500 text-sm mb-3 pb-4 flex capitalize">
  <strong className="w-[200px] min-w-[200px] inline-block capitalize">R/I/R/R</strong>

  {(() => {
    const validTechs = job?.technicians || []; // Get all technicians from job context
    const flatRate = Number(job?.technicians?.[0]?.simpleFlatRate || 0); // Get the flat rate from the job context, if available

    // If no technicians are available, return a message
    if (validTechs.length === 0) {
      return <div>No technicians available.</div>;
    }

    // Calculate the amount to distribute per technician without percentage
    const amountPerTech = flatRate / validTechs.length;
    let calculatedPay = 0;
    // Iterate over all technicians and calculate the total amount
    validTechs.forEach((tech: any) => {
      const amountPercentage = Number(tech.amountPercentage); // Get the technician's percentage

      if (!isNaN(amountPercentage)) {
        // If technician has an amountPercentage, calculate pay based on percentage
        calculatedPay = (amountPercentage / 100) * amountPerTech;
      } else {
        // Otherwise, distribute flatRate equally among all technicians
        calculatedPay = amountPerTech;
      }
    });

    return (
      <div className="">
        ${calculatedPay.toFixed(2)} {/* Display the total calculated pay once */}
      </div>
    );
  })()}
</div>












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
