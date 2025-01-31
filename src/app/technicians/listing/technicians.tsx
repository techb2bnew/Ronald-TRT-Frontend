// components/TechnicianTable.tsx
import React, { useState, useEffect } from 'react';
import TableActions from '../../component/action';
import CommonHeader from '../../component/commonHeader';
import { useRouter } from "next/navigation";
import SortableTable from '../../component/shorting'; // Import SortableTable
import Link from 'next/link';
import { toast } from 'react-toastify';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';  // ✅ Get the base URL here

const TechnicianTable: React.FC = () => {
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<string>('id'); // Manage sorting column state
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc'); // Sorting direction state
  const router = useRouter();

  const handleSearch = (searchTerm: string) => {
    console.log('Searching for:', searchTerm);
    // Implement search logic here
  };

  const handleDeleteSuccess = (deletedId: string) => {
    toast.success('Technician deleted successfully');

    // ✅ Remove the deleted technician from the table
    setTechnicians((prev) => prev.filter((tech) => tech.id !== deletedId));
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
          method: 'GET',
          headers,
        });

        const data = await response.json();

        if (response.ok) {
          setTechnicians(data.technician.technicians);
        } else {
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
  }, [router]);

  // Function to handle sorting logic
  const handleSort = (column: string) => {
    const direction = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(direction);
    setSortBy(column);

    const sortedTechnicians = [...technicians].sort((a, b) => {
      if (column === 'name') {
        const nameA = `${a.firstName} ${a.lastName}`;
        const nameB = `${b.firstName} ${b.lastName}`;
        return direction === 'asc'
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      }
      if (a[column] < b[column]) return direction === 'asc' ? -1 : 1;
      if (a[column] > b[column]) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    setTechnicians(sortedTechnicians);
  };



  // Render row function for SortableTable
  const renderRow = (tech: any) => (
    <tr key={tech.id}>
      <td>{tech.id}</td>
      <td>{tech.firstName} {tech.lastName}</td>
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
      <td><Link href='/jobs/create-job/create' className='flex gap-2 items-center border border-black rounded p-2 pl-5 pr-5 w-[fit-content]'>Create Job
        <svg width="20" height="20" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22.5C17.5228 22.5 22 18.0228 22 12.5C22 6.97715 17.5228 2.5 12 2.5C6.47715 2.5 2 6.97715 2 12.5C2 18.0228 6.47715 22.5 12 22.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 8.5V16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 12.5H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg></Link></td>
      <td>
        <TableActions
          editRoute={`/technicians/create-technician?technicianId=${tech.id}`}
          deleteRoute={`${apiUrl}/deleteTechnician`}  // Pass the correct endpoint
          itemId={tech.id}  // Pass the technician ID
          idKey="technicianId"
          onDeleteSuccess={() => handleDeleteSuccess(tech.id)}
        />
      </td>
    </tr>
  );

  return (
    <div className="container mx-auto mt-4">
      <CommonHeader heading="IFS Technicians" onSearch={handleSearch} buttonLabel="Create Technician" buttonLink="/technicians/create-technician" />

      {/* Pass sorting function and sort direction to the SortableTable component */}
      <SortableTable
        headers={['ID', 'Name', 'Email', 'Phone Number', 'Pay Rate', 'Account Status', 'Create New Job', 'Action']}
        data={technicians}
        renderRow={renderRow}
        sortBy={sortBy}
        sortDirection={sortDirection} // Pass direction to indicate the current sorting state
        handleSort={handleSort} // Pass sorting handler
      />
    </div>
  );
};

export default TechnicianTable;
