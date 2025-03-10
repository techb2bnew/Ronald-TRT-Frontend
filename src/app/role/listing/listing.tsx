// components/JobTable.tsx
"use client";
import React, { useState, useEffect, useCallback } from 'react'; 
import TableActions from '../../component/action';
import CommonHeader from '../../component/commonHeader';
import { useRouter } from "next/navigation";
import { toast } from 'react-toastify';
import Pagination from '../../component/pagination';
import axios from 'axios';
import Swal from 'sweetalert2'; 
import Empty from '@/app/component/empty';
import Loader from '@/app/component/loader';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';  // ✅ Get the base URL here
interface Roles {
  id: string;
  name: string;
  email: string;
  deletedStatus?: boolean;
}
const RoleTable: React.FC = () => {
  const [activeRole, setActiveRoles] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<string>('id'); // Manage sorting column state
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc'); // Sorting direction state
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);  
  const [loading, setLoading] = useState<boolean>(true); 
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (searchTerm: string) => {
    console.log('Searching for:', searchTerm);
    // Implement search logic here
  };
  const handleDeleteSuccess = (deletedId: string) => {
      // toast.success('Technician deleted successfully');
  
      // ✅ Remove the deleted technician from the table
      setActiveRoles((prev) => prev.filter((cust) => cust.id !== deletedId));
    };
    const fetchRoles = async (page = 1, query = '') => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
    
        const response = await fetch(`${apiUrl}/getRoles?page=${currentPage}`, {
          method: 'GET',
          headers,
        });
    
        const data = await response.json();
        if (response.ok) {

          const fetchedTechnicians: Roles[] = query.trim()
          ? data.roles || []  // For search API response
          : data.roles || [];  // For pagination API response
          // const filteredSingleTechnician = fetchedTechnicians.filter(SingleTechnician => !SingleTechnician.deletedStatus);
          setActiveRoles(fetchedTechnicians); 
         setTotalPages(data.totalPages || 1); 
        } else {
          if (data.error === 'Invalid Token') {
            router.push('/');
          } else {
            console.error('Error fetching roles:', data.error);
          }
        }
      } catch (error) {
        console.error('Error fetching roles:', error);
      } finally {
        setLoading(false);
      }
    };
    
 
   
 // Unified useEffect to handle both search and pagination
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchRoles(currentPage, searchTerm);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [currentPage, searchTerm]);



  // Function to handle sorting logic
  const handleSort = (column: string) => {
    const direction = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(direction);
    setSortBy(column);

    const sortedJobs = [...activeRole].sort((a, b) => {
      if (column === 'customerName') {
        const nameA = `${a?.customer?.firstName} ${a?.customer?.lastName}`;
        const nameB = `${b?.customer?.firstName} ${b?.customer?.lastName}`;
        return direction === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      if (column === 'technicianName') {
        const nameF = `${a?.technician?.firstName} ${a?.technician?.lastName}`;
        const nameL = `${b?.technician?.firstName} ${b?.technician?.lastName}`;
        return direction === 'asc' ? nameF.localeCompare(nameL) : nameL.localeCompare(nameF);
      }

      if (a[column] < b[column]) return direction === 'asc' ? -1 : 1;
      if (a[column] > b[column]) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    setActiveRoles(sortedJobs);
  };


 
  const handlePageChange = (data: { selected: number }) => {
    console.log(`Going to page number ${data.selected + 1}`);  // react-paginate uses zero-based index
    setCurrentPage(data.selected + 1);
  };

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
  const csvData = convertToCSV(activeRole);
  const blob = new Blob([csvData], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', 'jobs.csv');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

  const renderRow = (role: any) => (
    <tr key={role.id}>
      <td>{role.id}</td> 
      <td>{role?.name}</td>
      <td> {role?.type}</td> 
      <td>{new Date(role.createdAt).toLocaleDateString('en-GB')}</td>
      {/* <td onClick={() => toggleApproval(role.id, role.jobStatus)} style={{ cursor: 'pointer' }}>
        <span
          className={`badge ${role.jobStatus ? 'badge-success bg-[#E6F9DD] text-[#1A932E] p-2 pl-4 pr-4 rounded shadow' : 'badge-error bg-[#FFE4E1] text-[#FF0000] p-2 pl-4 pr-4 rounded shadow'}`}
        >
          {role.jobStatus ? 'Completed' : 'In Progress'}
        </span>
      </td>  */}
      <td>
        <TableActions   
          editRoute={`/role/create?roleId=${role.id}`}   
         deleteRoute={`${apiUrl}/roles/deleteRole`}  // Pass the correct endpoint
         viewRoute={`/role/view?roleId=${role.id}`}
           idKey="roleId"
          itemId={role.id}  // Pass the technician ID
          onDeleteSuccess={() => handleDeleteSuccess(role.id)} 
           />
      </td>
    </tr>
  );

  return (
    <div className="container mx-auto mt-4">
      <CommonHeader heading="Roles" onSearch={(term) => setSearchTerm(term)}  onExport={downloadCSV} buttonLabel="Create role" buttonLink="/role/create" />

      <div className="overflow-auto rounded-md">
        <table className="table w-full table-fixed">
          <thead>
            <tr>
              <th className="w-[50px]" onClick={() => handleSort('id')}>
                ID
                {sortBy === 'id' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white-500' : 'text-white'}`}>
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th> 
              <th className="w-[120px]" onClick={() => handleSort('customerName')}>
                Role Name
                {sortBy === 'customerName' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white-500' : 'text-white'}`}>
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th className="w-[150px]">
                Role Type 
              </th>
              <th className="w-[120px]" >
                Created At 
              </th>   
              <th className="w-[160px]">Action</th>
            </tr>
          </thead>
          <tbody>
              {loading ? (
                          <tr>
                            <td colSpan={5} className="text-center py-10">
                              <Loader />
                            </td>
                          </tr>
                        ) : activeRole.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-10">
                              <Empty />
                            </td>
                          </tr>
                        ) : (
                          activeRole.map((role) => renderRow(role))
                        )}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
    </div>
  );
};

export default RoleTable;
