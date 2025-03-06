"use client"; 
import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Loading from '@/app/component/loader'; 


interface Permission {
    id:string;
    permissionName: string;
    action: string;
    isActive:string;
    createdAt:string;
  }
  
  interface RoleData { 
    Permissions: Permission[]; // Ensure TypeScript knows this exists
  }
  
export default function ViewDetails() { 
    const [roleData, setRoleData] = useState<RoleData | null>(null);  // Using `any` type for flexibility
    const [role, setRole] = useState<any>(null);   // Using `any` type for flexibility
  const [isEdit, setIsEdit] = useState<boolean>(false);

  const fetchCustomerData = async (roleId: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${apiUrl}/roles/getRoleById?roleId=${roleId}`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      if (response.ok) {  
        setRole(data[0])
        setRoleData(data[0]);  // Set the  CustomerData data
      } else {
        toast.error(data.error || 'Error fetching technician data');
      }
    } catch (error) {
      toast.error('An error occurred while fetching technician data');
    }
  };
  
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const techId = searchParams.get('roleId') || '';

    if (techId) {
      setIsEdit(true);  // Set to true if `fetchCustomerData` exists in the URL
      fetchCustomerData(techId);
    } else {
      setIsEdit(false);
    }
  }, []);

  if (!roleData) {
    return <div><Loading /></div>;
  }

  return (
    <div className='max-w-5xl mx-auto p-4 rounded-lg shadow bg-white'>
      <div className="bg-[#F6F6F6] rounded-lg shadow-md">
        <div className="flex justify-between items-center pr-5 border-b border-[#ccc]  mb-2 pb-3">
            <h2 className="text-xl font-bold mb-4 pt-4 pl-6 ">Role Details</h2>
             <div className='flex gap-4'>
                <p><b>Name:</b> {role.name}</p>
                <p><b>Type:</b> {role.type}</p>
            </div>   
        </div>
      <div className="overflow-auto rounded-md">
        <table className="table w-full table-fixed">
            <thead>
                <tr>
                    <th>id</th>
                    <th>Permission Name</th>
                    <th>Action</th> 
                    <th>Created At</th>
                </tr>
            </thead>
            <tbody>
            {roleData?.Permissions?.map((item: Permission, index: number) => (
                <tr>
                    <td>{item?.id}</td>
                    <td>{item?.permissionName}</td>
                    <td>{item?.action}</td>
                    <td>  {new Date(item.createdAt).toLocaleDateString('en-GB')}</td>
                </tr>
            ))}
            </tbody>
        </table> 
      </div>
      </div>
      <ToastContainer />
    </div>
  );
}
