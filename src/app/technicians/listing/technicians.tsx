"use client";
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
import { ExportToCsv } from 'export-to-csv-file';
import Breadcrumb from '@/app/component/breadcrumb';
import { useSidebar } from "@/app/component/SidebarContext";
import Papa from 'papaparse';


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
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc'); // Sorting direction state
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { isCollapsed } = useSidebar();
  const [pageSize, setPageSize] = useState(10);
  const [totalJobs, setTotalJobs] = useState(10);

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

  const fetchTechnicians = async (page = 1, query = '', limit = pageSize) => {
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
        ? `${apiUrl}/searchTechnicians?searchQuery=${encodeURIComponent(query)}&types=${encodeURIComponent(roleType)}`
        : `${apiUrl}/fetchTechnician?page=${page}&limit=${limit}`;

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
      fetchTechnicians(currentPage, searchTerm, pageSize);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [currentPage, searchTerm, pageSize]);


  const handleDeleteSuccess = (deletedId: string) => {
    // toast.success('Technician deleted successfully'); 
    // ✅ Remove the deleted technician from the table
    setTechnicians((prev) => prev.filter((tech) => tech.id !== deletedId));
  };



  // Function to handle sorting logic
  const handleSort = (column: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortBy === column) {
      direction = sortDirection === 'asc' ? 'desc' : 'asc';
    }
    setSortDirection(direction);
    setSortBy(column);

    // Properly sort data
    const sortedData = [...technicians].sort((a, b) => {
      let valueA, valueB;

      if (column === 'name') {
        valueA = `${a.firstName} ${a.lastName}`.toLowerCase(); // Combine firstName and lastName
        valueB = `${b.firstName} ${b.lastName}`.toLowerCase();
      } else {
        valueA = a[column]?.toString().toLowerCase() || ''; // Handle undefined
        valueB = b[column]?.toString().toLowerCase() || '';
      }

      if (valueA < valueB) return direction === 'asc' ? -1 : 1;
      if (valueA > valueB) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    setTechnicians(sortedData);
  };









  const handlePageChange = (data: { selected: number }) => {
    console.log(`Going to page number ${data.selected + 1}`);  // react-paginate uses zero-based index
    setCurrentPage(data.selected + 1);
  };



  // Render row function for SortableTable
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

  const handlePageSizeChange = (size: number) => {
    // Calculate the total number of pages based on the current totalJobs and the new pageSize
    const newTotalPages = Math.ceil(totalJobs / size);

    // If the current page is greater than the new total pages, reset it to the last page
    let newPage = currentPage;
    if (newPage > newTotalPages) {
      newPage = newTotalPages;
    }

    // Update the state with the new page size and set the current page accordingly
    setPageSize(size);
    setCurrentPage(newPage); // Set the current page to the last valid page
  };


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
            <Link href={`/technicians/view?technicianId=${tech.id}`}>
              {tech?.firstName} {tech?.lastName}
            </Link>

          </div>
        </td>

        <td>
          <a href={`mailto:${tech.email}`} style={{ color: '#383d71' }}>
            {tech.email}
          </a>
        </td>
        <td>
          <a href={`tel:${tech.phoneNumber}`} style={{ color: '#383d71' }}>
            {tech.phoneNumber}
          </a>
        </td>

        {/* <td>{tech.payRate}</td> */}

        <td
          onClick={() => {
            if (tech.accountStatus || tech.isApproved) {
              handleAccountStatusChange(tech.id, !tech.accountStatus);
            }
          }} // Corrected here
          style={{ cursor: tech.isApproved || tech.accountStatus ? 'pointer' : 'not-allowed' }}
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


        <td className='font-sm'>
          <Link
            href={tech.accountStatus === true && tech.isApproved === true ? '/jobs/create-job/create' : '#'}
            className={`flex gap-1 items-center border border-[#383d71] rounded p-2 pl-4 pr-4 text-[#383d71] w-[fit-content] justify-center ${tech.accountStatus === true && tech.isApproved === true
              ? 'cursor-pointer bg-white hover:bg-[#383d71] hover:text-[#fff] '  // Active styles
              : 'cursor-not-allowed bg-gray-200' // Disabled styles
              }`}
            onClick={(e) => {
              if (tech.accountStatus === false || tech.isApproved === false) {
                e.preventDefault(); // Prevent navigation when disabled
              }
            }}
          >
            Create Order
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 25"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 22.5C17.5228 22.5 22 18.0228 22 12.5C22 6.97715 17.5228 2.5 12 2.5C6.47715 2.5 2 6.97715 2 12.5C2 18.0228 6.47715 22.5 12 22.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 8.5V16.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8 12.5H16"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>

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
            editRoute={`/technicians/create-technician?technicianId=${tech.id}`}
            viewRoute={`/technicians/view?technicianId=${tech.id}`}
            deleteRoute={`${apiUrl}/deleteTechnician`}  // Pass the correct endpoint
            itemId={tech.id}  // Pass the technician ID
            idKey="technicianId"
            userRole='Technician'
            onDeleteSuccess={() => handleDeleteSuccess(tech.id)}
          />
        </td>
      </tr>
    );
  }


  const downloadCSV = () => {
    const csvOptions = {
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalSeparator: '.',
      showLabels: true,
      showTitle: true,
      title: 'Technicians Data',
      useTextFile: false,
      useBom: true,
      useKeysAsHeaders: true, // Use object keys as headers
    };

    const csvExporter = new ExportToCsv(csvOptions);

    const formattedData = technicians.map((tech) => ({
      Id: tech.id,
      Name: `${tech.firstName} ${tech.lastName}`,
      Email: tech.email,
      Phone: tech.phoneNumber,
      Address: tech.address,
      Country: tech.country,
      City: tech.city,
      State: tech.state,
      SimpleFlatRate: tech.simpleFlatRate,
      PayRate: tech.payRate,
      Status: tech.isApproved ? 'true' : 'false',
      'account status': tech.accountStatus ? 'true' : 'false',
    }));

    csvExporter.generateCsv(formattedData);
  };

 

const handleImportCSV = (file: File) => {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const reader = new FileReader();

  reader.onload = async (e) => {
    let text = (e.target?.result as string)
      .replace(/^\uFEFF/, '') // remove BOM
      .trimStart();

    let lines = text.split(/\r?\n/);

    // ✅ Safe filter: remove blank or garbage lines
    lines = lines.filter((line) => line.trim() !== '');

    // ✅ Detect if first line is garbage (e.g., "Technicians Data")
    if (lines[0].toLowerCase().includes('technician')) {
      lines.shift(); // remove garbage line
    }

    text = lines.join('\n'); // rebuild cleaned CSV text

    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: async (result) => {
        const parsedData = (result.data as any[]);

        // ✅ Very Important: If still only "Technicians Data" field, fix manually
        const correctedData = parsedData.map((row) => {
          if (row['Technicians Data']) {
            // Manual split fix
            const values = (row['Technicians Data'] as string).split(',');
            return {
              id: values[0]?.trim() || '',
              name: values[1]?.trim() || '',
              email: values[2]?.trim() || '',
              phone: values[3]?.trim() || '',
              address: values[4]?.trim() || '',
              country: values[5]?.trim() || '',
              city: values[6]?.trim() || '',
              state: values[7]?.trim() || '',
              simpleFlatRate: values[8]?.trim() || '',
              payRate: values[9]?.trim() || '',
              // 👆 jitne fields hain utne daal lena
            };
          }
          return row; // otherwise normal row
        });

        try {
          const response = await axios.post(
            `${apiUrl}/importTechnician`,
            { data: correctedData },
            { headers }
          );
          toast.success('CSV Import Successful!');
          fetchTechnicians(currentPage, searchTerm, pageSize);
        } catch (error) {
          console.error('❌ Import failed:', error);
          toast.error('Import failed. Check console for details.');
        }
      },
      error: (err: any) => {
        console.error('❌ CSV Parse error:', err);
        alert('❌ Error parsing CSV file.');
      },
    });
  };

  reader.readAsText(file);
};

  

  return (
    <div className={` mx-auto mt-4 transition-all duration-300 ${isCollapsed ? 'w-full pl-[5rem]' : 'container'}`}>
      <Breadcrumb
        items={[
          { label: 'IFS Technicians', href: '/technicians/listing' }
        ]}
      />
      <CommonHeader heading="IFS Technicians" onPageSizeChange={handlePageSizeChange} onSearch={(term) => setSearchTerm(term)} onExport={downloadCSV} onImport={handleImportCSV} userRole='Technician' buttonLabel="Create Technician" buttonLink="/technicians/create-technician" />
      <SortableTable
        headers={['ID', 'Name', 'Email', 'Phone Number', 'Status', 'Create Work Order', 'Account Status', 'Action']}
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
