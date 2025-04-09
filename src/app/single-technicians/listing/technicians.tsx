// components/TechnicianTable.tsx
import React, { useState, useEffect, useRef } from 'react';
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
import Eye from '../../../../public/eye.svg'
import Image from 'next/image';
import { ExportToCsv } from 'export-to-csv-file';
import Breadcrumb from '@/app/component/breadcrumb';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';  // ✅ Get the base URL here

interface Singletechnician {
  id: string;
  name: string;
  email: string;
  deletedStatus?: boolean;
  Role: { name: string };
}
const TechnicianTable: React.FC = () => {
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<string>('id'); // Manage sorting column state
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc'); // Sorting direction state
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);


  const handleAccountStatusChange = async (techId: number, accountStatus: boolean) => {
    const newStatus = accountStatus ? 'Active' : 'Inactive';

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to change the account status to ${newStatus}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#383d71',
      cancelButtonColor: 'black',
      confirmButtonText: 'Yes, change it!',
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        };

        const response = await axios.post(
          `${apiUrl}/updateTechnicianAccountStatus`, // Correct API
          {
            technicianId: techId,
            accountStatus: accountStatus, // Corrected here
          },
          config
        );

        if (response.data.status) {
          Swal.fire({
            title: 'Success!',
            text: `Account status changed to ${newStatus}.`,
            icon: 'success',
            confirmButtonColor: '#383d71',
            confirmButtonText: 'OK',
          });
          fetchTechnicians();
        } else {
          throw new Error('Account status API failed');
        }
      } catch (error) {
        console.error('Error updating account status:', error);
        Swal.fire({
          title: 'Error!',
          text: 'Error updating account status.',
          icon: 'error',
          confirmButtonText: 'OK',
        });
      }
    }
  };

  const handleApprovalChange = async (techId: number, isApproved: boolean) => {
    const newStatus = isApproved ? 'Approved' : 'Accept';

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to change the status to ${newStatus}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#383d71',
      cancelButtonColor: 'black',
      confirmButtonText: 'Yes, change it!',
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        };

        const response = await axios.post(
          `${apiUrl}/technicianActiveUnactiveAccount`, // Correct API
          {
            technicianId: techId,
            isApproved: isApproved, // Corrected here
          },
          config
        );

        if (response.data.status) {
          Swal.fire({
            title: 'Success!',
            text: `Technician status changed to ${newStatus}.`,
            icon: 'success',
            confirmButtonColor: '#383d71',
            confirmButtonText: 'OK',
          });
          fetchTechnicians();
        } else {
          throw new Error('Approval API failed');
        }
      } catch (error) {
        console.error('Error updating approval status:', error);
        Swal.fire({
          title: 'Error!',
          text: 'Error updating approval status.',
          icon: 'error',
          confirmButtonText: 'OK',
        });
      }
    }
  };








  const fetchTechnicians = async (page = 1, query = '') => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const roleType = localStorage.getItem('types') || "";
      if (!token) {
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
        ? `${apiUrl}/searchTechnicians?searchQuery=${encodeURIComponent(query)}&types=single-technician`
        : `${apiUrl}/fetchIndividualTechnician?page=${page}`;

      const response = await fetch(endpoint, { method: 'GET', headers });
      if (response.status == 400) {
        localStorage.removeItem('token');
        router.push('/');
      }
      const data = await response.json();
      if (response.ok) {

        // Handle technicians array for both APIs correctly
        const fetchedTechnicians: Singletechnician[] = query.trim()
          ? data.technicians || []  // For search API response
          : data.technician?.technicians || [];  // For pagination API response
        //  const filteredSingleTechnician = fetchedTechnicians.filter(SingleTechnician => !SingleTechnician.deletedStatus);
        const filteredSingleTechnician = fetchedTechnicians.filter(SingleTechnician => SingleTechnician?.Role?.name !== "super admin");
        setTechnicians(filteredSingleTechnician);
        setTotalPages(data.technician?.totalPages || 1);
      } else {
        console.error('Error fetching technicians:',);
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

  useEffect(() => {
    // Get user role from localStorage (or API)
    const storedRole = localStorage.getItem("types");
    setUserRole(storedRole);
  }, []);


  const [statuses, setStatuses] = useState<{ [key: string]: string }>({});
  useEffect(() => {
    const loadedStatuses: { [key: string]: string } = {};
    technicians.forEach((tech) => {
      const storedStatus = localStorage.getItem(`techStatus_${tech.id}`);
      if (storedStatus) {
        loadedStatuses[tech.id] = storedStatus;
      } else {
        loadedStatuses[tech.id] = tech.accountStatus ? "Approved" : "Accept";
      }
    });
    setStatuses(loadedStatuses);
  }, [technicians]);



  // CSV Export Functions
  const downloadCSV = () => {
    const csvOptions = {
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalSeparator: '.',
      showLabels: true,
      showTitle: true,
      title: 'Single Technician Data',
      useTextFile: false,
      useBom: true,
      useKeysAsHeaders: true, // Use object keys as headers
    };

    const csvExporter = new ExportToCsv(csvOptions);

    const formattedData = technicians.map((singletechnicians) => ({
      ID: singletechnicians.id,
      Name: `${singletechnicians.firstName} ${singletechnicians.lastName}`,
      Email: singletechnicians.email,
      Phone: singletechnicians.phoneNumber,
      Address: singletechnicians.address,
      Country: singletechnicians.country,
      City: singletechnicians.city,
      State: singletechnicians.state,
      ZipCode: singletechnicians.zipCode,
    }));

    csvExporter.generateCsv(formattedData);
  };
  // Render row function for SortableTable
  const renderRow = (tech: any) => {
    const status = statuses[tech.id] || "Accept";

    return (
      <tr key={tech.id}>
        <td>{tech.id}</td>
        <td>
  <div className="flex items-center gap-2">
    {tech?.image ? (
      <img src={tech.image} alt="" className="w-[40px] h-[40px] rounded-full object-cover" />
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-[40px] h-[40px] text-black-400 bg-gray-300 p-2 rounded-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M4 21v-2a4 4 0 0 1 3-3.87" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    )}
    <span>{tech?.firstName} {tech?.lastName}</span>
  </div>
</td> 
        <td>{tech.email}</td>
        <td>{tech.phoneNumber}</td>
        {/* <td>{tech.payRate}</td> */}
        <td
           onClick={() => {
            if (tech.accountStatus || tech.isApproved) {
              handleAccountStatusChange(tech.id, !tech.accountStatus);
            }
          }} // Corrected here
          style={{ cursor: tech.isApproved || tech.accountStatus  ? 'pointer' : 'not-allowed' }}
        >

        
          <span
            className={`badge ${tech.accountStatus
                ? 'badge-success bg-[#E6F9DD] text-[#1A932E] p-2 pl-4 pr-4 rounded shadow block text-center w-[100px]'
                : 'badge-error bg-[#FFE4E1] text-[#FF0000] p-2 pl-4 pr-4 rounded shadow block text-center w-[100px]'
              }`}
          >
            {tech.accountStatus ? 'Active' : 'Inactive'}
          </span>
        </td>

        <td
          onClick={() => handleApprovalChange(tech.id, !tech.isApproved)} // Corrected here
          style={{ cursor: 'pointer' }}
        >
          <span
            className={`badge ${tech.isApproved
                ? 'badge-success bg-[#E6F9DD] text-[#1A932E] p-2 pl-4 pr-4 rounded shadow block text-center w-[100px]'
                : 'badge-error bg-[#FFE4E1] text-[#FF0000] p-2 pl-4 pr-4 rounded shadow block text-center w-[100px]'
              }`}
          >
            {tech.isApproved ? 'Approved' : 'Accept'}
          </span>
        </td>

        <td>
          <TableActions
            editRoute={`/technicians/create-technician?technicianId=${tech.id}&singletechnician`}
            viewRoute={`/single-technicians/view?technicianId=${tech.id}`}
            deleteRoute={`${apiUrl}/deleteTechnician`}  // Pass the correct endpoint
            itemId={tech.id}  // Pass the technician ID
            idKey="technicianId"
            userRole='Technician'
            onDeleteSuccess={() => handleDeleteSuccess(tech.id)}
          />
          {/* <Link className="p-1" href={`/single-technicians/view?technicianId=${tech.id}`}>
         <Image alt='eye' src={Eye} className='w-[16px]' /> 
         </Link> */}

        </td>
      </tr>
    )
  };



  return (
    <div className="container mx-auto mt-4">
      <Breadcrumb
        items={[
          { label: 'Single Technicians', href: '/single-technicians/listing' }
        ]}
      />
      <CommonHeader heading="Single Technicians" onSearch={(term) => setSearchTerm(term)} onExport={downloadCSV} userRole='SingleTechnician' buttonLabel="Create Technician" buttonLink="/technicians/create-technician?singletechnician" />


      <SortableTable
        headers={['ID', 'Name', 'Email', 'Phone Number', 'Status', 'Account Status', 'Action']}
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
