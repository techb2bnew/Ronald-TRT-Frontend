"use client";
import React, { useState, useEffect } from 'react'; 
import TableActions from '../../component/action';
import CommonHeader from '../../component/commonHeader';
import { useRouter } from "next/navigation"; 
  export default function ClientListing() {
    const [customer, setCustomer] = useState<any[]>([]);
    const router = useRouter();
  
    const handleSearch = (searchTerm: string) => {
      console.log('Searching for:', searchTerm);
      // Implement search logic here
    };
    useEffect(() => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    const fetchCustomer = async () => {
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
  
        const response = await fetch(`${apiUrl}/fetchCustomer`, {
          method: 'GET', // Assuming you're using a GET request to fetch 
          headers, // Pass the headers object
        });
  
        const data = await response.json();
  
        if (response.ok) {
          // Assuming the response has an array called "technician"
          setCustomer(data.customers);
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
  
    fetchCustomer();
  }, [router]); // Add `router` to the dependency array
  return (
    <div className="container mx-auto mt-4">
      <CommonHeader heading='IFS Clients' title="Onboard clients effortlessly for seamless collaboration!" onSearch={handleSearch} buttonLabel="Create IFS Client" buttonLink="/client/create" />

      <div className="overflow-x-auto rounded-md">
        <table className="table w-full table-fixed">
          {/* Table header */}
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone Number</th>
              <th>Address</th>
              <th>Country</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {/* Table body */}
            {customer.map((customer, index) => (
              <tr key={index}>
                <td>{customer.id}</td>
                <td>{customer.firstName}</td>
                <td>{customer.email}</td>
                <td>{customer.phoneNumber}</td>
                <td>{customer.address}</td>
                <td> 
                  {customer.country}
                </td>
                <td> 
                  <TableActions
                    editRoute="/create-technician"
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
 
