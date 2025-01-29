// components/TechnicianTable.tsx
import React, { useState, useEffect } from 'react';
import TableActions from '../../component/action';
import CommonHeader from '../../component/commonHeader';
import { useRouter } from "next/navigation";
const TechnicianTable: React.FC = () => {
  const [technicians, setTechnicians] = useState<any[]>([]);
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

      const response = await fetch(`${apiUrl}/fetchTechnician`, {
        method: 'GET', // Assuming you're using a GET request to fetch technicians
        headers, // Pass the headers object
      });

      const data = await response.json();

      if (response.ok) {
        // Assuming the response has an array called "technician"
        setTechnicians(data.technician);
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
      <CommonHeader heading='IFS Technicians' title="Onboard clients effortlessly for seamless collaboration!" onSearch={handleSearch} buttonLabel="Create Technician" buttonLink="/technicians/create-technician" />

      <div className="overflow-x-auto rounded-md">
        <table className="table w-full table-fixed">
          {/* Table header */}
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone Number</th>
              <th>Pay Rate</th>
              <th>Account Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {/* Table body */}
            {technicians.map((tech, index) => (
              <tr key={index}>
                <td>{tech.id}</td>
                <td> {tech.firstName} {tech.lastName}</td>
                <td>{tech.email}</td>
                <td>{tech.phoneNumber}</td>
                <td>{tech.payRate}</td>
                <td>
                <span 
                  className={`badge ${tech.isApproved === true ? 'badge-success bg-[#E6F9DD] text-[#1A932E] p-2 pl-4 pr-4 rounded shadow' : 'badge-error bg-[#FFE4E1] text-[#FF0000] p-2 pl-4 pr-4 rounded shadow'}`}
                >
                  {tech.isApproved === true ? 'Active' : 'Inactive'}
                </span>
              </td>

                <td>
                  <TableActions
                    editRoute="/technicians/create-technician"
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

export default TechnicianTable;
