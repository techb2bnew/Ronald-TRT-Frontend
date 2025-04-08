// components/ClientListing.tsx
"use client";
import React, { useState, useEffect } from 'react';
import TableActions from '../../component/action';
import CommonHeader from '../../component/commonHeader';
import { useRouter } from "next/navigation";
import { toast } from 'react-toastify';
import Pagination from '../../component/pagination';
import Empty from '@/app/component/empty';
import Loader from '@/app/component/loader';
import Swal from 'sweetalert2';
import axios from 'axios';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';  // ✅ Get the base URL here

export default function ClientListing() {
  const [customer, setCustomer] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<string>('id'); // Default sorting column is 'id'
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc'); // Sorting direction state
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);  
  const [loading, setLoading] = useState<boolean>(true); 
  const [searchTerm, setSearchTerm] = useState(''); 

 
const handleDeleteSuccess = (deletedId: string) => {
    // toast.success('Technician deleted successfully');

    // ✅ Remove the deleted technician from the table
    setCustomer((prev) => prev.filter((cust) => cust.id !== deletedId));
  };
 
    
    const fetchAdmin = async (page = 1, query = '') => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
  
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
  
        // Determine correct endpoint
        const endpoint = query.trim()
          ? `${apiUrl}/searchIfsAdmin?searchQuery=${encodeURIComponent(query)}`
          : `${apiUrl}/fetchIfsAdmin?page=${page}`;
  
        const response = await fetch(endpoint, { method: 'GET', headers });
        if (response.status == 400) {
          localStorage.removeItem('token');
          router.push('/');
        }
        const data = await response.json();
        if (response.ok) {
           // Handle customers array for both APIs correctly
           const fetchedCustomers = query.trim()
           ? data.customers || []  // For search API response
           : data.admins?.admins || [];  // For pagination API response
  
           setCustomer(fetchedCustomers);
          setTotalPages(data.admins?.totalPages || 1);
        } else {
          if (data.error === 'Invalid Token') {
            router.push('/');
          } else {
            console.error('Error fetching customers:', data.error);
          }
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
      } finally {
        setLoading(false);
      }
    };
 
 

  const handleSort = (column: string) => {
    const direction = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(direction);
    setSortBy(column);
  
    const sortedCustomers = [...customer].sort((a, b) => {
      if (column === 'name') {
        const nameA = `${a.firstName} ${a.lastName}`;
        const nameB = `${b.firstName} ${b.lastName}`;
        return direction === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
  
      if (a[column] < b[column]) return direction === 'asc' ? -1 : 1;
      if (a[column] > b[column]) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  
    setCustomer(sortedCustomers);
  };
  const handlePageChange = (data: { selected: number }) => {
    console.log(`Going to page number ${data.selected + 1}`);  // react-paginate uses zero-based index
    setCurrentPage(data.selected + 1);
  };

    // Unified useEffect to handle both search and pagination
    useEffect(() => {
      const timeoutId = setTimeout(() => {
        fetchAdmin(currentPage, searchTerm);
      }, 500);
      return () => clearTimeout(timeoutId);
    }, [currentPage, searchTerm]);

 

   
// CSV Export Functions
const convertToCSV = (data:any) => {
  const csvRows = [];
  // Get headers
  csvRows.push(Object.keys(data[0]).join(','));
  // Convert data to csv
  for (const row of data) {
    csvRows.push(Object.values(row).join(','));
  }
  return csvRows.join('\n');
};

const downloadCSV = () => {
  const csvData = convertToCSV(customer);
  const blob = new Blob([csvData], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', 'customers.csv');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const toggleTechnicianStatus = async (adminId: number, currentApprovalStatus: boolean) => {
  // Show confirmation dialog
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: 'Do you want to change the status of this account?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#383d71',
    cancelButtonColor: 'black',
    confirmButtonText: 'Yes, change it!'
  });

  if (result.isConfirmed) {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        }
      };

      // Call both APIs simultaneously
      const [approvalResponse, statusResponse] = await Promise.all([
        axios.post(`${apiUrl}/updateIfsAdminActiveStatus`, {
          adminId,
          isApproved: !currentApprovalStatus
        }, config),
        axios.post(`${apiUrl}/updateIfsAdminApprovedAccount`, {
          adminId,
          accountStatus: !currentApprovalStatus
        }, config)
      ]);

      if (approvalResponse.data.status && statusResponse.data.status) {
        // Optimistically update local state
        setCustomer(prev => prev.map(tech => {
          if (tech.id === adminId) {
            return { 
              ...tech, 
              isApproved: !tech.isApproved, 
              accountStatus: !tech.accountStatus 
            };
          }
          return tech;
        }));

        Swal.fire({
          title: 'Success!',
          text: 'Technician status updated successfully.',
          icon: 'success',
          confirmButtonColor: '#383d71',
          confirmButtonText: 'OK'
        });
      } else {
        throw new Error('One of the API calls failed');
      }
    } catch (error) {
      console.error('Error updating technician status:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Error updating technician status.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  } else {
    Swal.fire({
      title: 'Cancelled',
      text: 'Technician status change was cancelled.',
      icon: 'info',
      confirmButtonText: 'OK'
    });
  }
};

  const renderRow = (cust: any) => (
    <tr key={cust.id}>
      <td>{cust.id}</td>
      <td>{cust.firstName} {cust.lastName}</td>
      <td>{cust.email}</td>
      <td>{cust.phoneNumber}</td>
      <td>{cust.address}</td>
      <td>{cust.country}</td>
      <td onClick={() => toggleTechnicianStatus(cust.id, cust.accountStatus)} style={{ cursor: 'pointer' }}>
        <span
          className={`badge ${cust.accountStatus ? 'badge-success bg-[#E6F9DD] text-[#1A932E] p-2 pl-4 pr-4 rounded shadow' : 'badge-error bg-[#FFE4E1] text-[#FF0000] p-2 pl-4 pr-4 rounded shadow'}`}
        >
          {cust.accountStatus ? 'Active' : 'Inactive'}
        </span>
      </td> 
      <td onClick={() => toggleTechnicianStatus(cust.id, cust.isApproved)} style={{ cursor: 'pointer' }}>
        <span
          className={`badge ${cust.isApproved ? 'badge-success bg-[#E6F9DD] text-[#1A932E] p-2 pl-4 pr-4 rounded shadow' : 'badge-error bg-[#FFE4E1] text-[#FF0000] p-2 pl-4 pr-4 rounded shadow'}`}
        >
          {cust.isApproved ? 'Approved' : 'Disapproved'}
        </span>
      </td>
      <td>
      <TableActions 
         editRoute={`/admin/create?adminId=${cust.id}`}   
         deleteRoute={`${apiUrl}/deleteIfsAdmin`} 
         viewRoute={`/admin/view?adminId=${cust.id}`}
         idKey="adminId"
         userRole='Admin' 
          itemId={cust.id}  // Pass the technician ID
          onDeleteSuccess={() => handleDeleteSuccess(cust.id)} />
      </td>
    </tr>
  );

  return (
    <div className="container mx-auto mt-4">
      <CommonHeader heading='IFS Admin' onSearch={(term) => setSearchTerm(term)} userRole='Admin' onExport={downloadCSV}  buttonLabel="Create IFS Admin" buttonLink="/admin/create" />

      <div className="overflow-x-auto rounded-md">
        <table className="table w-full table-fixed">
          <thead>
            <tr>
              <th className="w-[50px]" onClick={() => handleSort('id')}>
                ID
                {sortBy === 'id' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white' : 'text-white'}`}>
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th className="w-[150px]" onClick={() => handleSort('name')}>
                Name
                {sortBy === 'name' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white' : 'text-white'}`}>
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th className="w-[200px]" onClick={() => handleSort('email')}>
                Email
                {sortBy === 'email' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white' : 'text-white'}`}>
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th className="w-[150px]" onClick={() => handleSort('phoneNumber')}>
                Phone Number
                {sortBy === 'phoneNumber' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white' : 'text-white'}`}>
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th className="w-[150px]" onClick={() => handleSort('address')}>
                Address
                {sortBy === 'address' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white' : 'text-white'}`}>
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th className="w-[100px]" onClick={() => handleSort('country')}>
                Country
                {sortBy === 'country' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white' : 'text-white'}`}>
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th className="w-[100px]">Status</th>
              <th className="w-[100px]">Account Status</th>
              <th className="w-[160px]">Action</th>
            </tr>
          </thead>
          <tbody>
          {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-10">
                  <Loader />
                </td>
              </tr>
            ) : customer.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-10">
                  <Empty />
                </td>
              </tr>
            ) : (
              customer.map((cust) => renderRow(cust))
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />

    </div>
  );
}
