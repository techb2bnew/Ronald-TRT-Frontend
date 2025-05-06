"use client";
// components/TechnicianTable.tsx
import React, { useState, useEffect, useRef } from 'react';
import TableActions from '../../component/action';
import CommonHeader from '../../component/commonHeader';
import { useRouter } from "next/navigation";
import SortableTable from '../../component/shorting'; // Import SortableTable
import Link from 'next/link';
import axios from 'axios';
import Swal from 'sweetalert2';
import Pagination from '../../component/pagination';
import Empty from '@/app/component/empty';
import Loader from '@/app/component/loader';
import { ExportToCsv } from 'export-to-csv-file';
import Breadcrumb from '@/app/component/breadcrumb';
import { useSidebar } from "@/app/component/SidebarContext";
import Papa from 'papaparse';
import toast from 'react-hot-toast';



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

    
      try {
        const token = localStorage.getItem('token');

        const config = {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        };

        const response = await axios.post(
          `${apiUrl}/updateTechnicianAccountStatus`,
          {
            technicianId: techId,
            accountStatus: accountStatus,
          },
          config
        );

        if (response.data.status) {
          await Swal.fire({
            title: 'Success!',
            text: `Account status changed to ${newStatus}.`,
            icon: 'success',
            confirmButtonColor: '#383d71',
          }); 
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
  };


  const handleApprovalChange = async (techId: number, isApproved: boolean, tech: any) => {


    const newStatus = isApproved ? 'Approved' : 'Accept';

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


    } catch (error) {
      console.error('Error updating approval status:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Error updating approval status.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    }
  };

  const handleChangeBothStatuses = async (tech: any) => {
    try {
      // Step 1: Check if payment info is missing (amountPercentage or simpleFlatRate or payRate)
      if ((!tech.amountPercentage && !tech.simpleFlatRate) || !tech.payRate || tech.payRate === "") {
        // Show SweetAlert for missing payment info and stop further execution
        await Swal.fire({
          title: 'Missing Payment Info',
          text: 'Please enter payrate for this technician.',
          icon: 'info',
          confirmButtonColor: '#383d71',
          confirmButtonText: 'OK',
        });
        return; // Stop execution if payment info is missing
      }

      // Step 2: Confirm both account status change and approval status change
      const newAccountStatus = tech.accountStatus ? 'Active' : 'Inactive';
      const newApprovalStatus = tech.isApproved ? 'Approved' : 'Accept';

      const result = await Swal.fire({
        title: 'Are you sure?',
        text: `Do you want to change the account status to ${newAccountStatus} and the technician status to ${newApprovalStatus}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#383d71',
        cancelButtonColor: 'black',
        confirmButtonText: 'Yes, change them!',
      });

      // Step 3: If user confirms, update both account status and approval status
      if (result.isConfirmed) {
        // Step 4: Handle account status change
        await handleAccountStatusChange(tech.id, !tech.accountStatus);

        // Step 5: Handle approval change
        await handleApprovalChange(tech.id, true, tech);
      fetchTechnicians(currentPage, searchTerm, pageSize);
        
      }

    } catch (error) {
      console.error('Error updating both statuses:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Error updating technician statuses.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    }
  };


  const technicianRejectedAccount = async (techId: number, isApproved: boolean) => {


    const newStatus = isApproved ? 'Approved' : 'Accept';

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      };

      const response = await axios.post(
        `${apiUrl}/technicianRejectedAccount`, // Correct API
        {
          technicianId: techId,
          isApproved: isApproved, // Corrected here
        },
        config
      );

      fetchTechnicians(currentPage, searchTerm, pageSize);

    } catch (error) {
      console.error('Error updating approval status:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Error updating approval status.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    }
  };

  // JSX Button to trigger both API calls



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
    const isChecked = selectedIds.includes(tech.id);

    return (
      <tr key={tech.id}>
        <td key="checkbox">
          <label className="flex items-center cursor-pointer relative">
            <input
              type="checkbox"
              className="peer h-5 w-5 cursor-pointer transition-all appearance-none rounded shadow bg-white hover:shadow-md border border-slate-300 checked:bg-[var(--foreground)] checked:border-[var(--foreground)]"
              checked={isChecked}
              onChange={() => handleCheckboxChange(tech.id)}
            />
            <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-[10px] transform -translate-x-1/2 -translate-y-1/2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
              </svg>
            </span>
          </label>
        </td>
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
            <Link href={`/technicians/view?technicianId=${tech.id}`} className='hover:underline'>
              {tech?.firstName} {tech?.lastName}
            </Link>

          </div>
        </td>

        <td>
          <a href={`mailto:${tech.email}`} style={{ color: '#383d71' }} className='hover:underline'>
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
            if (tech.isApproved) {
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

        >
          <div className='flex gap-4'>
            <div
              onClick={() => {
                if (!tech.isApproved) {
                  handleChangeBothStatuses(tech);
                }
              }}
              style={{ cursor: 'pointer' }}>
              <span
                className={`badge ${tech.isApproved
                  ? 'badge-success bg-[#E6F9DD] text-[#1A932E] p-2 pl-2 pr-2 rounded shadow block text-center w-[80px]'
                  : 'badge-error bg-[#FFE4E1] text-[#FF0000] p-2 pl-2 pr-2 rounded shadow block text-center w-[80px]'
                  }`}
              >
                {tech.isApproved ? 'Approved' : 'Accept'}
              </span>
            </div>
            {/* {!tech.isApproved && (

          <div onClick={() => technicianRejectedAccount(tech.id, false)}
          style={{ cursor: 'pointer' }}>
          <span
            className={`badge ${tech.isApproved
              ? 'badge-success bg-[#E6F9DD] text-[#1A932E] p-2 pl-3 pr-3 rounded shadow block text-center w-[80px]'
              : 'badge-error bg-[#FFE4E1] text-[#FF0000] p-2 pl-3 pr-3 rounded shadow block text-center w-[80px]'
              }`}
          >
            {tech.isApproved ? 'Approved' : 'Reject'}
          </span>
          </div>
           )} */}

          </div>
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
    const selectedTechnicians = technicians.filter(tech => selectedIds.includes(tech.id));
    if (selectedTechnicians.length === 0) {
      toast.error("Please select at least one technician to export.");
      return;
    }
    const csvOptions = {
      filename: 'IFS Technicians',
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

    const formattedData = selectedTechnicians.map((tech) => ({
      Id: tech.id,
      Name: `${tech.firstName} ${tech.lastName}`,
      Email: tech.email,
      Phone: tech.phoneNumber,
      Address: tech.address,
      Country: tech.country,
      City: tech.city,
      State: tech.state,
      SimpleFlatRate: tech.simpleFlatRate,
      AmountPercentage: tech.simpleFlatRate,
      PayVehicleType: tech.payVehicleType,
      PayRate: tech.payRate,
      AccountStatus: tech.accountStatus,
      DeletedStatus: tech.deletedStatus,
      IsApproved: tech.isApproved,
    }));

    csvExporter.generateCsv(formattedData);
  };


  const handleImportCSV = (file: File) => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const reader = new FileReader();

    reader.onload = async (e) => {
      let text = (e.target?.result as string)
        .replace(/^\uFEFF/, '') // Remove BOM
        .trimStart();

      const lines = text.split(/\r?\n/);

      // ✅ Remove garbage line like "Technicians,Data"
      if (lines[0].toLowerCase().includes("technician")) {
        lines.shift();
      }

      text = lines.join('\n');

      const manualHeaders = [
        'Id', 'Name', 'Email', 'Phone', 'Address', 'Country',
        'City', 'State', 'SimpleFlatRate', 'AmountPercentage',
        'PayVehicleType', 'PayRate', 'Status',
        'AccountStatus', 'DeletedStatus', 'IsApproved'
      ];

      Papa.parse(text, {
        header: false, // Don't use auto headers
        skipEmptyLines: true,
        complete: async (result) => {
          const rows = result.data as string[][];

          const cleanedData = rows
            .slice(1) // Skip CSV's own header row
            .map((row) => {
              const obj: any = {};
              manualHeaders.forEach((key, idx) => {
                let value: any = row[idx];
                if (typeof value === 'string') {
                  value = value.trim();
                  const lower = value.toLowerCase();
                  if (lower === 'true') value = true;
                  else if (lower === 'false') value = false;
                  else if (lower === 'null' || lower === '') value = null;
                }
                obj[key] = value;
              });
              return obj;
            })
            .filter((row) => {
              // ✅ Skip row if all keys === values like { Id: "id", Name: "name", ... }
              const isHeaderRow = Object.entries(row).every(
                ([key, val]) =>
                  typeof val === 'string' &&
                  val.trim().toLowerCase() === key.trim().toLowerCase()
              );

              const hasRealData = Object.values(row).some(
                (val) =>
                  (typeof val === 'string' && val.trim() !== '') ||
                  (typeof val === 'number' && !isNaN(val)) ||
                  typeof val === 'boolean'
              );

              return !isHeaderRow && hasRealData;
            });

          console.log("✅ Final Cleaned Data:", cleanedData);

          try {
            const response = await axios.post(
              `${apiUrl}/importTechnician`,
              { data: cleanedData },
              { headers }
            );
            toast.success('CSV Import Successful!');
            fetchTechnicians(currentPage, searchTerm, pageSize);
          } catch (error: unknown) {
            console.error('❌ Import failed:', error);
          
            // Check if it's an Axios error with a response
            if (
              typeof error === 'object' &&
              error !== null &&
              'response' in error &&
              typeof (error as any).response?.data?.error === 'string'
            ) {
              toast.error((error as any).response.data.error);
            } else if (error instanceof Error) {
              toast.error(error.message);
            } else {
              toast.error(String(error));
            }
          }
          
          
          setLoading(false);

        },
        error: (err: any) => {
          console.error('❌ CSV Parse error:', err);
          alert('❌ Error parsing CSV file.');
        },
      });
    };

    reader.readAsText(file);
  };










  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Select All
  const isAllSelected = technicians.length > 0 && selectedIds.length === technicians.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      const allIds = technicians.map(t => t.id); // Assuming each technician has an `id` field
      setSelectedIds(allIds);
    }
  };

  // Individual Row Checkbox
  const handleCheckboxChange = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
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
        headers={['', 'ID', 'Name', 'Email', 'Phone Number', 'Account Status', 'Create Work Order', 'Approval Status', 'Action']}
        data={technicians}
        renderRow={renderRow}
        sortBy={sortBy}
        sortDirection={sortDirection}
        handleSort={handleSort}
        loading={loading}
        renderHeaderCell={(header, index) => {
          if (index === 0) {
            return (
              <th key={index} className='w-[40px]'>
                <label className="flex items-center cursor-pointer relative">
                  <input
                    type="checkbox"
                    className="peer h-5 w-5 cursor-pointer transition-all appearance-none rounded shadow bg-white hover:shadow-md border border-slate-300 checked:bg-[var(--foreground)] checked:border-[#fff]"

                    checked={isAllSelected}
                    onChange={handleSelectAll}
                  />
                  <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-[10px] transform -translate-x-1/2 -translate-y-1/2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                  </span>
                </label>
              </th>
            );
          }
          const columnKey = header.toLowerCase().replace(' ', '');
          const sortableColumns = ['id', 'name', 'email', 'phone number', 'status', 'create new job', 'account status', 'action'];

          return (
            <th
              key={index}
              className={`cursor-pointer ${index === 1 ? 'w-[50px]' : ''} ${index === 7 ? 'w-[200px]' : ''} ${index === 5 ? 'w-[130px]' : ''}${index === 8 ? 'w-[100px]' : ''}`}
              onClick={() => sortableColumns.includes(columnKey) && handleSort(columnKey)}
            >
              {header}
              {sortableColumns.includes(columnKey) && sortBy === columnKey && (
                <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white' : 'text-white'}`}>
                  {sortDirection === 'asc' ? '▲' : '▼'}
                </span>
              )}
            </th>
          );
        }}
      />


      {technicians.length > 0 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
      )}
    </div>
  );
};

export default TechnicianTable;
