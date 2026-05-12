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
import { renumberSerialNo } from '@/lib/renumberSerialNo';
import Papa from 'papaparse';
import toast from 'react-hot-toast';
import { Country, State } from 'country-state-city';
import TechnicianApprovalActions from '@/app/component/technicianApprovalActions';
import RejectReasonModal from '@/app/component/rejectReasonModal';
import SortIcon from '@/app/component/sortIcon';



const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';  // ✅ Get the base URL here
const TECHNICIAN_IMPORT_ID_MAP_KEY = 'technicianImportSerialToIdMap';
interface Technicians {
  id: string;
  name: string;
  email: string;
  techType: string;
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
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null);
  const [originalTechnicians, setOriginalTechnicians] = useState<any[]>([]);
  const [accountStatusFilter, setAccountStatusFilter] = useState<string>('');

  // Fetch technicians on success
  const handleRejectionSuccess = () => {
    fetchTechnicians(currentPage, searchTerm, pageSize);
  };

  const handleAccountStatusChanges = async (techId: number, accountStatus: boolean) => {
    const newStatus = accountStatus ? 'Active' : 'Inactive';

    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: `Do you want to change this account ${newStatus}`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#383d71',
        cancelButtonColor: 'black',
        confirmButtonText: `Yes, ${newStatus}`,
      });

      if (!result.isConfirmed) return;

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
        fetchTechnicians(currentPage, searchTerm, pageSize);
      } else {
        throw new Error(response.data.message || 'Account status update failed');
      }
    } catch (error) {
      console.error('Error updating account status:', error);
      Swal.fire({
        title: 'Error!',
        text: error instanceof Error ? error.message : 'Error updating account status',
        icon: 'error',
        confirmButtonText: 'OK',
      });
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
        ? `/api/technician?searchQuery=${encodeURIComponent(query)}&roleType=${encodeURIComponent(roleType)}`
        : `/api/technician?page=${page}&limit=${limit}`;


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
        const filteredTechnicians = fetchedTechnicians
          .filter(technician => technician?.Role?.name !== "super admin")
          .map((technician: any, index: number) => ({
            ...technician,
            serialNo: (page - 1) * limit + index + 1,
          }));

        setOriginalTechnicians(filteredTechnicians);
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

  // Account status filter (client-side over current page) + serial renumber.
  useEffect(() => {
    const startSerial = (currentPage - 1) * pageSize + 1;
    let result = originalTechnicians;
    if (accountStatusFilter === 'active') {
      result = originalTechnicians.filter((t: any) => Boolean(t?.accountStatus));
    } else if (accountStatusFilter === 'inactive') {
      result = originalTechnicians.filter((t: any) => !t?.accountStatus);
    }
    setTechnicians(renumberSerialNo(result, startSerial));
  }, [accountStatusFilter, originalTechnicians, currentPage, pageSize]);


  const handleDeleteSuccess = (deletedId: string) => {
    const startSerial = (currentPage - 1) * pageSize + 1;
    setSelectedIds((ids) => ids.filter((id) => id !== deletedId));
    setOriginalTechnicians((prev) =>
      renumberSerialNo(
        prev.filter((tech: any) => tech.id !== deletedId),
        startSerial
      )
    );
    setTechnicians((prev) =>
      renumberSerialNo(
        prev.filter((tech) => tech.id !== deletedId),
        startSerial
      )
    );
  };

  // Function to handle sorting logic
   const handleSort = (column: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortBy === column) {
      direction = sortDirection === 'asc' ? 'desc' : 'asc';
    }
    setSortDirection(direction);
    setSortBy(column);

    const sortedData = [...technicians].sort((a, b) => {
      let valueA: string | number, valueB: string | number;

      // Handle different column types
      switch (column) {
        case 'serialno':
          valueA = Number(a.serialNo) || 0;
          valueB = Number(b.serialNo) || 0;
          break;
        case 'type':
          valueA = a.techType ? a.techType.toString().trim().toLowerCase() : '';
          valueB = b.techType ? b.techType.toString().trim().toLowerCase() : '';
          break;
        case 'name':
          valueA = `${a.firstName} ${a.lastName}`.toLowerCase();
          valueB = `${b.firstName} ${b.lastName}`.toLowerCase();
          break;
        case 'email':
          valueA = a.email?.toString().toLowerCase() || '';
          valueB = b.email?.toString().toLowerCase() || '';
          break;
        default:
          valueA = a[column]?.toString().toLowerCase() || '';
          valueB = b[column]?.toString().toLowerCase() || '';
      }

      // Perform comparison based on direction
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

  const renderRow = (tech: any, index?: number) => {
    const status = statuses[tech.id] || "Accept";
    const isChecked = selectedIds.includes(tech.id);
    const serialNo = tech.serialNo ?? ((currentPage - 1) * pageSize + (index ?? 0) + 1);

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
        <td>{serialNo}</td> 
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
            <Link href={`/technicians/view?technicianId=${tech.id}`} className='hover:underline capitalize'>
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
          <a href={`tel:${tech.phoneNumber}`} style={{ color: '#383d71' }} className='hover:underline'>
            {tech.phoneNumber}
          </a>
        </td>

        {/* <td>{tech.payRate}</td> */}

        <td
          onClick={() => {
            if (tech.isApproved === 'accept') {
              handleAccountStatusChanges(tech.id, !tech.accountStatus);
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
        <td className='capitalize'>{tech.techType === 'technician' ? 'Dent Tech' : tech.techType === 'R/I/R/R' ? 'R&I' : tech.techType}</td>

        {/* <td className='font-sm'>
          <Link
            href={tech.accountStatus === true && tech.isApproved === 'accept' ? '/jobs/create-job/create' : '#'}
            className={`flex gap-1 items-center border border-[#383d71] rounded p-2 pl-4 pr-4 text-[#383d71] w-[fit-content] justify-center ${tech.accountStatus === true && tech.isApproved === 'accept'
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
        <td>
          <TechnicianApprovalActions
            technician={tech}
            apiUrl={apiUrl}
            token={localStorage.getItem('token')}
            fetchTechnicians={() => fetchTechnicians(currentPage, searchTerm, pageSize)}
            onRejectClick={(id) => {
              setSelectedTechId(id.toString());
              setShowRejectModal(true);
            }}
          />

        </td> */}


        <td>
          <TableActions
            editRoute={`/technicians/create-technician?technicianId=${tech.id}&technician`}
            viewRoute={`/technicians/view?technicianId=${tech.id}`}
            deleteRoute={`/api/deleteTechnician`}  // Pass the correct endpoint
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

    const serialToIdMap: Record<string, string> = {};
    const formattedData = selectedTechnicians.map((tech, index) => {
      const serialNo = index + 1;
      serialToIdMap[String(serialNo)] = String(tech.id);
      return {
        'Serial No': serialNo,
        Name: `${tech.firstName} ${tech.lastName}`,
        Email: tech.email,
        Address: tech.address,
        Type: tech.techType,
      };
    });

    localStorage.setItem(TECHNICIAN_IMPORT_ID_MAP_KEY, JSON.stringify(serialToIdMap));

    // Ensure no headers are included in the data when downloading
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

      // Remove any garbage lines at the start (empty rows, or headers like 'technician')
      while (lines.length > 0 && (lines[0].toLowerCase().includes("technician") || lines[0].trim() === "")) {
        lines.shift();
      }

      text = lines.join('\n');

      const manualHeaders = ['Serial No', 'Name', 'Email', 'Address', 'Type'];
      const savedSerialToIdMap: Record<string, string> = (() => {
        try {
          const raw = localStorage.getItem(TECHNICIAN_IMPORT_ID_MAP_KEY);
          return raw ? JSON.parse(raw) : {};
        } catch {
          return {};
        }
      })();

      Papa.parse(text, {
        header: false,
        skipEmptyLines: true,
        complete: async (result) => {
          const rows = result.data as string[][];

          // Log raw data for debugging
          console.log("Raw CSV data:", rows);

          // Remove the first row explicitly (header row) to avoid it being imported as data
          const cleanedData = rows.slice(1) // Skip the first row
            .map((row, index) => {
              const obj: any = {};

              // Create an object for each row
              manualHeaders.forEach((key, idx) => {
                let value: any = row[idx] ?? null;
                if (key === 'IsApproved' && (value === null || value === undefined)) {
                  // default value if missing
                  value = false; // ya jo default chahiye wo
                }
                if (typeof value === 'string') {
                  value = value.trim();
                  if (value === '') value = null;
                  const lower = value?.toLowerCase();
                  if (lower === 'true') value = true;
                  else if (lower === 'false') value = false;
                  else if (lower === 'null') value = null;
                }

                if (key.toLowerCase() === 'id' && !isNaN(Number(value))) {
                  value = parseInt(value, 10);
                }
                obj[key] = value;
              });

              // Resolve Id from Serial No map for update
              const serialNoVal = obj['Serial No'];
              const mappedIdFromSerial =
                serialNoVal != null && serialNoVal !== ''
                  ? savedSerialToIdMap[String(serialNoVal).trim()]
                  : null;
              if (mappedIdFromSerial != null) {
                obj['Id'] = !isNaN(Number(mappedIdFromSerial))
                  ? parseInt(mappedIdFromSerial, 10)
                  : mappedIdFromSerial;
              }

              // Don't send Serial No to backend
              obj['Serial No'] = undefined;

              return obj;
            })
            .filter((row) => {
              // Skip rows where any value exactly matches the header name (e.g., Id: 'Id')
              const isHeaderRow = Object.entries(row).some(([key, value]) => value === key);
              if (isHeaderRow) return false;

              // Skip rows that are null (e.g., rows with empty data)
              if (!row) return false;

              // Skip rows where all values are null/empty
              const allEmpty = Object.values(row).every(
                val => val === null || val === '' || val === undefined
              );
              if (allEmpty) return false;

              // Only keep rows with actual data
              return true;
            });

          // Log cleaned data
          console.log("✅ Final Cleaned Data:", cleanedData);

          try {
            const response = await axios.post(
              `/api/importTechnician`,
              { data: cleanedData },
              { headers }
            );
            toast.success('CSV Import Successful!');
            fetchTechnicians(currentPage, searchTerm, pageSize);
          } catch (error: unknown) {
            console.error('❌ Import failed:', error);
            toast.error('We could not find records matching the IDs you provided for updating. To ensure successful updates, please export the current data, compare the IDs in the exported file with the IDs in your import file, and make any necessary corrections');
          }

          setLoading(false);
        },
        error: (err: any) => {
          console.error('❌ CSV Parse error:', err);
          setLoading(false);
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
    <div className={` mobile_listing mx-auto mt-4 transition-all duration-300 ${isCollapsed ? 'w-full pl-[5rem]' : 'container'}`}>
      <Breadcrumb
        items={[
          { label: 'IFS Dent Techs', href: '/technicians/listing' }
        ]}
      />
      <div className="shadow-lg p-4 bg-white rounded-lg">
      <CommonHeader heading="IFS Dent Techs" onPageSizeChange={handlePageSizeChange} onSearch={(term) => setSearchTerm(term)} onExport={downloadCSV} onImport={handleImportCSV} userRole='Technician' buttonLabel="Create Dent Tech" buttonLink="/technicians/create-technician?technician"  selectedRows={selectedIds} onAccountStatusChange={(status) => setAccountStatusFilter(status)} showClearFilters={true} onClearFilters={() => setAccountStatusFilter('')} />
      <SortableTable
        headers={['', 'Serial No',   'Name', 'Email', 'Phone Number', 'Account Status', 'Type', 'Action']}
        data={technicians}
        renderRow={renderRow}
        sortBy={sortBy}
        sortDirection={sortDirection}
        handleSort={handleSort}
        loading={loading}
        renderHeaderCell={(header, index) => {
          if (index === 0) {
            return (
              <th key={index} className='w-[50px]'>
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
          const sortableColumns = ['serialno', 'name', 'email', 'type'];

          return (
            <th
              key={index}
              className={`cursor-pointer ${index === 1 ? ' ' : ''}`}
              onClick={() => sortableColumns.includes(columnKey) && handleSort(columnKey)} // Ensure the column is passed correctly
            >
              {header}
              {sortableColumns.includes(columnKey) && (
                <SortIcon active={sortBy === columnKey} direction={sortDirection} />
              )}
            </th>

          );
        }}
      />


      {technicians.length > 0 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
      )}

</div>
      <RejectReasonModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        technicianId={selectedTechId}
        apiUrl={apiUrl}
        onSuccess={handleRejectionSuccess}
      />

    </div>


  );
};

export default TechnicianTable;
