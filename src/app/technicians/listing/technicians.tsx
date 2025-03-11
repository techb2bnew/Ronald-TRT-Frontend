// components/TechnicianTable.tsx
import React, { useState, useEffect, useRef  } from 'react';
import TableActions from '../../component/action';
import CommonHeader from '../../component/commonHeader';
import { useRouter } from "next/navigation";
import SortableTable from '../../component/shorting'; // Import SortableTable
import Link from 'next/link';
import { toast } from 'react-toastify';
import axios from 'axios';
import Swal from 'sweetalert2';
import Pagination from '../../component/pagination';
import Empty from '@/app/component/empty';
import Loader from '@/app/component/loader';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';  // ✅ Get the base URL here
interface Technicians {
  id: string;
  name: string;
  email: string;
  deletedStatus?: boolean;
  Role: { name: string };
}
const TechnicianTable: React.FC = () => {
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<string>('id'); // Manage sorting column state
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc'); // Sorting direction state
  const router = useRouter(); 
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);  
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleTechnicianStatus = async (technicianId: number, newStatus: boolean) => {
    // Show confirmation dialog
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to change the status of this account?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF502E',
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
          axios.post(`${apiUrl}/technicianActiveUnactiveAccount`, {
            technicianId,
            isApproved: newStatus
          }, config),
          axios.post(`${apiUrl}/updateTechnicianAccountStatus`, {
            technicianId,
            accountStatus: newStatus
          }, config)
        ]);
  
        if (approvalResponse.data.status && statusResponse.data.status) {
          // Optimistically update local state
          setTechnicians(prev => prev.map(tech => {
            if (tech.id === technicianId) {
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
            confirmButtonColor: '#EF502E',
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

  const fetchTechnicians = async (page = 1, query = '') => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const roleType = localStorage.getItem('types') || "";
      if (!token){
        localStorage.removeItem('token');
        router.push('/');
        return;
      }
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Determine correct endpoint
      const endpoint = query.trim()
        ? `${apiUrl}/searchTechnicians?searchQuery=${encodeURIComponent(query)}&types=${encodeURIComponent(roleType)}`
        : `${apiUrl}/fetchTechnician?page=${page}`;

      const response = await fetch(endpoint, { method: 'GET', headers }); 
      if (response.status == 400) {
        localStorage.removeItem('token');
        router.push('/');
      }
      const data = await response.json(); 
      if (response.ok) {
         // Handle technicians array for both APIs correctly 

         const fetchedTechnicians: Technicians[] = query.trim()
            ? data.technicians || []
            : data.technician?.technicians || [];
            const filteredTechnicians = fetchedTechnicians.filter(technician => technician?.Role?.name !== "super admin");

           setTechnicians(filteredTechnicians);
          setTotalPages(data.technician?.totalPages || 1); 
      } else {
        console.error('Error fetching technicians:', );
      } 
    }
      catch (error) {
      // router.push('/');
      console.error('Error fetching technicians:', error);
    } finally {
      setLoading(false);
    }
  };

  // Unified useEffect to handle both search and pagination
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchTechnicians(currentPage, searchTerm);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [currentPage, searchTerm]);

 
  const handleDeleteSuccess = (deletedId: string) => {
    // toast.success('Technician deleted successfully'); 
    // ✅ Remove the deleted technician from the table
    setTechnicians((prev) => prev.filter((tech) => tech.id !== deletedId));
  };



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
  const handlePageChange = (data: { selected: number }) => {
    console.log(`Going to page number ${data.selected + 1}`);  // react-paginate uses zero-based index
    setCurrentPage(data.selected + 1);
  };

 

  // Render row function for SortableTable
  const renderRow = (tech: any) => {

        const [status, setStatus] = useState("");
      
          useEffect(() => {
            // Check if status is already set in localStorage
            const storedStatus = localStorage.getItem(`techStatus_${tech.id}`);
            if (storedStatus) {
              setStatus(storedStatus);
            } else {
              // Set initial status based on accountStatus
              if (tech.accountStatus === false) {
                setStatus("Accept");
              } else if (tech.accountStatus === true) {
                setStatus("Approved");
              } else {
                setStatus("Restricted");
              }
            }
          }, [tech.accountStatus, tech.id]);
        
          const handleStatusChange = async () => {
            let newStatus;
            if (status === "Accept") {
              newStatus = "Approved";
            } else {
              newStatus = status === "Approved" ? "Restricted" : "Approved";
            }
        
            // Update status in the backend
            await toggleTechnicianStatus(tech.id, newStatus === "Approved");
        
            // Update status in localStorage and state
            localStorage.setItem(`techStatus_${tech.id}`, newStatus);
            setStatus(newStatus);
          };
        return (
    <tr key={tech.id}>
      <td>{tech.id}</td>
      <td>{tech.firstName} {tech.lastName}</td>
      <td>{tech.email}</td>
      <td>{tech.phoneNumber}</td>
      {/* <td>{tech.payRate}</td> */}
       <td onClick={handleStatusChange} style={{ cursor: 'pointer' }}>
        <span
          className={`badge ${tech.accountStatus ? 'badge-success bg-[#E6F9DD] text-[#1A932E] p-2 pl-4 pr-4 rounded shadow' : 'badge-error bg-[#FFE4E1] text-[#FF0000] p-2 pl-4 pr-4 rounded shadow'}`}
        >
          {tech.accountStatus ? 'Active' : 'Inactive'}
        </span>
      </td>
        <td className='font-sm'>
        <Link href='/jobs/create-job/create' className='flex gap-1 items-center border border-black rounded p-2 pl-2 pr-2 w-[120px] justify-center'>Create Job
        <svg width="20" height="20" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22.5C17.5228 22.5 22 18.0228 22 12.5C22 6.97715 17.5228 2.5 12 2.5C6.47715 2.5 2 6.97715 2 12.5C2 18.0228 6.47715 22.5 12 22.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 8.5V16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 12.5H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg></Link>
        </td>
      <td onClick={handleStatusChange} style={{ cursor: 'pointer' }}>
      <span
          className={`badge ${
            status === "Accept"
              ? "bg-blue-100 text-blue-700 p-2 pl-4 pr-4 rounded shadow"
              : status === "Approved"
              ? "bg-[#E6F9DD] text-[#1A932E] p-2 pl-4 pr-4 rounded shadow"
              : "bg-[#FFE4E1] text-[#FF0000] p-2 pl-4 pr-4 rounded shadow"
          }`}
        >
          {status}
        </span>
      </td>
      <td> 
        <TableActions
          editRoute={`/technicians/create-technician?technicianId=${tech.id}`}
          viewRoute={`/technicians/view?technicianId=${tech.id}`}
          deleteRoute={`${apiUrl}/deleteTechnician`}  // Pass the correct endpoint
          itemId={tech.id}  // Pass the technician ID
          idKey="technicianId"
          onDeleteSuccess={() => handleDeleteSuccess(tech.id)}
        />
      </td>
    </tr>
  );
}


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
    const csvData = convertToCSV(technicians);
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'technicians.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  return (
    <div className="container mx-auto mt-4">
      <CommonHeader heading="IFS Technicians" onSearch={(term) => setSearchTerm(term)}  onExport={downloadCSV}   buttonLabel="Create Technician" buttonLink="/technicians/create-technician" />

    
        <SortableTable
          headers={['ID', 'Name', 'Email', 'Phone Number', 'Status','Create New Job', 'Account Status',  'Action']}
          data={technicians}
          renderRow={renderRow}
          sortBy={sortBy}
          sortDirection={sortDirection}
          handleSort={handleSort}
          loading={loading}
        />
     

<Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />

    </div>
  );
};

export default TechnicianTable;
