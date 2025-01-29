"use client";
import React, { useState, useEffect } from 'react'; 
import TableActions from '../../../component/action';
import CommonHeader from '../../../component/commonHeader';
import { useRouter } from "next/navigation";
const JobTable: React.FC = () => {
    const [activeJob, setActiveJob] = useState<any[]>([]);
    const router = useRouter();
  
    const handleSearch = (searchTerm: string) => {
      console.log('Searching for:', searchTerm);
      // Implement search logic here
    };
    useEffect(() => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    const fetchTechnicians = async () => {
      try {
        // Retrieve token from localStorage
        const token = localStorage.getItem('token');
  
        // Create headers object
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
  
        // If the token exists, add the Authorization header
        if (token) {
          headers['Authorization'] = `Token ${token}`;
        }
  
        const response = await fetch(`${apiUrl}/fetchAllJobs`, {
          method: 'GET', // Assuming you're using a GET request to fetch 
          headers, // Pass the headers object
        });
  
        const data = await response.json();
  
        if (response.ok) {
          // Assuming the response has an array called "technician"
          setActiveJob(data.jobs);
        } else {
          // Check for 'Invalid Token' in the response and redirect to login if found
          if (data.error && data.error === 'Invalid Token') {
            router.push('/login');
          } else {
            console.error('Error fetching technician data:', data.error);
          }
        }
      } catch (error) {
        console.error('Error fetching technician data:', error);
      }
    };
  
    fetchTechnicians();
  }, [router]); // Add `router` to the dependency array
  return (
    <div className="container mx-auto mt-4">
      <CommonHeader heading='Active Jobs' title="Onboard clients effortlessly for seamless collaboration!" onSearch={handleSearch} buttonLabel="Create job" buttonLink="/jobs/create-job/create" />

      <div className="overflow-auto rounded-md">
        <table className="table w-full table-fixed">
          {/* Table header */}
          <thead>
            <tr>
              <th className='w-[50px]'>ID</th>
              <th className='w-[150px]'>Job Description</th>
              <th className='w-[120px]'>Client Name</th>
              <th className='w-[150px]'>Email</th>
              <th className='w-[120px]'>Client Ph. Number</th>
              <th className='w-[100px]'>Technician Name</th>
              <th className='w-[100px]'>Tech.  Ph. Number</th>
              <th className='w-[160px]'>VIN</th>
              <th className='w-[100px]'>Vehicle Make</th>
              <th className='w-[100px]'>Status</th>
              <th className='w-[100px]'>Date</th>
              <th className='w-[160px]'>Action</th>

            </tr>
          </thead>
          <tbody>
            {/* Table body */}
            {activeJob.map((job, index) => (
              <tr key={index}>
                <td>{job.id}</td>
                <td>{job.jobDescription}</td>
                <td>{job?.customer?.name} {job?.customer?.lastName}</td>
                <td>{job?.customer?.email}</td>
                <td>{job?.customer?.phoneNumber}</td>
                <td>{job?.technician?.name} {job?.technician?.lastName}</td>
                <td>{job?.technician?.phoneNumber}</td>
                <td>{job.vin}</td>
                <td>{job.make}</td>
                <td>Active</td>  
                <td>{new Date(job.createdAt).toLocaleDateString('en-US')}</td>
                <td> 
                  <TableActions
                    editRoute="/workshop/clients/create"
                  /> 
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JobTable;
