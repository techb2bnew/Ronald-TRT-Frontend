// components/TechnicianTable.tsx
import React, { useState, useEffect, useRef } from 'react';
import TableActions from '../../component/action';
import CommonHeader from '../../component/commonHeader';
import { useRouter } from "next/navigation";
import SortableTable from '../../component/shorting'; // Import SortableTable
import Link from 'next/link';
import toast from 'react-hot-toast';
import axios from 'axios';
import Swal from 'sweetalert2';
import Pagination from '../../component/pagination';
import Empty from '@/app/component/empty';
import Loader from '@/app/component/loader';
import Eye from '../../../../public/eye.svg'
import Image from 'next/image';
import { ExportToCsv } from 'export-to-csv-file';
import Breadcrumb from '@/app/component/breadcrumb';
import { useSidebar } from "@/app/component/SidebarContext";
import { renumberSerialNo } from '@/lib/renumberSerialNo';
import Papa from 'papaparse';
import RejectReasonModal from '@/app/component/rejectReasonModal';
import SortIcon from '@/app/component/sortIcon';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';  // ✅ Get the base URL here
const SINGLE_TECHNICIAN_IMPORT_ID_MAP_KEY = 'singleTechnicianImportSerialToIdMap';

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
  const { isCollapsed } = useSidebar();
  const [pageSize, setPageSize] = useState(10);
  const [totalJobs, setTotalJobs] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);  
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null); 

  // Fetch technicians on success
  const handleRejectionSuccess = () => {
    fetchTechnicians(currentPage, searchTerm, pageSize);
  };

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
        `/api/updateTechnicianAccountStatus`,
        {
          technicianId: techId,
          accountStatus: accountStatus,
        },
        config
      );
      fetchTechnicians(currentPage, searchTerm, pageSize);

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
        `/api/updateTechnicianAccountStatus`,
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


  const handleApprovalChange = async (techId: number, isApproved: string, tech: any) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      };

      await axios.post(
        `/api/technicianActiveUnactiveAccount`,
        {
          technicianId: techId,
          isApproved: isApproved,
        },
        config
      );

      // Show success message
      // Swal.fire({
      //   title: 'Success!',
      //   text: `Technician status changed to ${isApproved === 'accept' ? 'Accepted' : 'Rejected'}`,
      //   icon: 'success',
      //   confirmButtonText: 'OK',
      // });

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
      // Determine the new status (toggle between 'accept' and 'reject')
      const newApprovalStatus = tech.isApproved === 'accept' ? 'cancel' : 'accept';
      const newAccountStatus = newApprovalStatus === 'accept'; // true for active, false for inactive
      const statusText = newApprovalStatus.toLowerCase() === 'cancel' ? 'Reject' : newApprovalStatus.charAt(0).toUpperCase() + newApprovalStatus.slice(1);

      const result = await Swal.fire({
        title: 'Are you sure?',
        text: `Do you want to change this account status to ${statusText}`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#383d71',
        cancelButtonColor: 'black',
        confirmButtonText: `Yes, ${statusText}`,

      });

      if (result.isConfirmed) {
        // Update account status first
        await handleAccountStatusChange(tech.id, newAccountStatus);

        // Then update approval status
        await handleApprovalChange(tech.id, newApprovalStatus, tech);

        // Refresh the list
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
        ? `/api/fetchIndividualTechnician?searchQuery=${encodeURIComponent(query)}&roleType=single-technician`
        : `/api/fetchIndividualTechnician?page=${page}&limit=${limit}`;

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
        const filteredSingleTechnician = fetchedTechnicians
          .filter(SingleTechnician => SingleTechnician?.Role?.name !== "super admin")
          .map((singleTechnician: any, index: number) => ({
            ...singleTechnician,
            serialNo: (page - 1) * limit + index + 1,
          }));
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
      fetchTechnicians(currentPage, searchTerm, pageSize);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [currentPage, searchTerm, pageSize]);

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
  const handleDeleteSuccess = (deletedId: string) => {
    const startSerial = (currentPage - 1) * pageSize + 1;
    setSelectedIds((ids) => ids.filter((id) => id !== deletedId));
    setTechnicians((prev) =>
      renumberSerialNo(
        prev.filter((tech) => tech.id !== deletedId),
        startSerial
      )
    );
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
      if (column === 'phoneNumber') {
        const normalizePhone = (val: any) => String(val ?? '').replace(/\D+/g, '');
        const phoneA = normalizePhone(a?.phoneNumber);
        const phoneB = normalizePhone(b?.phoneNumber);
        // If both are numeric-ish, compare as numbers; else string compare
        if (phoneA && phoneB) {
          if (phoneA.length === phoneB.length) {
            return direction === 'asc' ? phoneA.localeCompare(phoneB) : phoneB.localeCompare(phoneA);
          }
          return direction === 'asc' ? phoneA.length - phoneB.length : phoneB.length - phoneA.length;
        }
        return direction === 'asc'
          ? String(a?.phoneNumber ?? '').localeCompare(String(b?.phoneNumber ?? ''))
          : String(b?.phoneNumber ?? '').localeCompare(String(a?.phoneNumber ?? ''));
      }
      if (column === 'totalJobs') {
        const countA = a?.jobs?.length || 0;
        const countB = b?.jobs?.length || 0;
        return direction === 'asc' ? countA - countB : countB - countA;
      }
      if (column === 'totalWorkOrder') {
        const getTotalWorkOrders = (tech: any) =>
          tech?.jobs?.reduce((total: number, job: any) => total + (job?.vehicles?.length || 0), 0) || 0;
        const countA = getTotalWorkOrders(a);
        const countB = getTotalWorkOrders(b);
        return direction === 'asc' ? countA - countB : countB - countA;
      }
      if (column === 'serialno') {
        const serialA = Number(a.serialNo) || 0;
        const serialB = Number(b.serialNo) || 0;
        return direction === 'asc' ? serialA - serialB : serialB - serialA;
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
    const selectedTechnicians = technicians.filter(tech => selectedIds.includes(tech.id));

    if (selectedTechnicians.length === 0) {
      toast.error("Please select at least one job group to export.");
      return;
    }
    const csvOptions = {
      filename: 'Single Technicians',
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalSeparator: '.',
      showLabels: true,
      showTitle: true,
      title: 'Single Technicians Data',
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
        Phone: tech.phoneNumber,
        Address: tech.address,
        Status: tech.isApproved,
        AccountStatus: tech.accountStatus,
        DeletedStatus: tech.deletedStatus,
        IsApproved: tech.isApproved,
      };
    });

    localStorage.setItem(SINGLE_TECHNICIAN_IMPORT_ID_MAP_KEY, JSON.stringify(serialToIdMap));

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
        'Serial No', 'Name', 'Email', 'Phone', 'Address', 'Status',
        'AccountStatus', 'DeletedStatus', 'IsApproved'
      ];
      const savedSerialToIdMap: Record<string, string> = (() => {
        try {
          const raw = localStorage.getItem(SINGLE_TECHNICIAN_IMPORT_ID_MAP_KEY);
          return raw ? JSON.parse(raw) : {};
        } catch {
          return {};
        }
      })();

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

              // Resolve Id from Serial No map for update payload
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

              // Do not send Serial No to backend
              obj['Serial No'] = undefined;
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
              `/api/importTechnician`,
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
  // Render row function for SortableTable
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
        {/* <td> <Link href={`/single-technicians/view?technicianId=${tech.id}`} className='hover:underline'>{tech.id}</Link></td> */}

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
            <span><Link href={`/single-technicians/view?technicianId=${tech.id}`} className='hover:underline capitalize'>{tech?.firstName} {tech?.lastName}</Link> </span>
          </div>
        </td>
        <td><a className="hover:underline" href={`mailto:${tech?.email}`}> {tech.email}</a></td>
        <td><a className="hover:underline" href={`tel:${tech?.phoneNumber}`}>{tech.phoneNumber}</a></td>
        <td>{tech?.jobs?.length || 0}</td>
        <td> <div>{tech.jobs?.reduce((total:any, job:any) => total + (job?.vehicles?.length || 0), 0) || 0}</div></td>

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

        <td

        >
          <div className='flex gap-4 items-center'>
            {tech.isApproved === 'accept' ? (
              // Step 2: Show "Accepted", clicking sends 'cancel'
              <span
                onClick={() => handleChangeBothStatuses(tech)}
                className="badge bg-[#E6F9DD] text-[#1A932E] p-2 pl-4 pr-4 rounded shadow block text-center w-[100px] cursor-pointer"
              >
                Accepted
              </span>
            ) : tech.isApproved === 'cancel' ? (
              // Step 3: Show "Rejected", clicking sends 'accept'
              <span
                onClick={() => handleChangeBothStatuses(tech)}
                className="badge bg-[#FFE4E1] text-[#FF0000] p-2 pl-4 pr-4 rounded shadow block text-center w-[100px] cursor-pointer"
              >
                Rejected
              </span>
            ) : (
              // Step 1: First time — show Accept + Reject
              <>
                <span
                  onClick={() => handleChangeBothStatuses(tech)}
                  className="badge bg-[#E6F9DD] text-[#1A932E] p-2 pl-4 pr-4 rounded shadow block text-center w-[100px] cursor-pointer"
                >
                  Accept
                </span>
                <button
                  onClick={() => {
                    setSelectedTechId(tech.id);
                    setShowRejectModal(true);
                  }}
                  className="text-sm p-2 pl-4 pr-4 shadow badge-error bg-[#FFE4E1] text-[#FF0000] w-[100px]"
                >
                  Reject
                </button>
              </>
            )}
          </div>

        </td>

        <td>
          <TableActions
            editRoute={`/technicians/create-technician?technicianId=${tech.id}&singletechnician`}
            viewRoute={`/single-technicians/view?technicianId=${tech.id}`}
            deleteRoute={`/api/deleteTechnician`}   // Pass the correct endpoint
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
    <div className={` mobile_listing mx-auto mt-4 transition-all duration-300 ${isCollapsed ? 'w-full pl-[5rem]' : 'container'}`}>

      <Breadcrumb
        items={[
          { label: 'Single Technicians', href: '/single-technicians/listing' }
        ]}
      />
      <div className="shadow-lg p-4 bg-white rounded-lg">
      <CommonHeader heading="Single Technicians" onPageSizeChange={handlePageSizeChange} onSearch={(term) => setSearchTerm(term)} onExport={downloadCSV} onImport={handleImportCSV} userRole='SingleTechnician' buttonLabel="Create Technician" buttonLink="/technicians/create-technician?singletechnician"  selectedRows={selectedIds} />
      <SortableTable
        headers={['', 'Serial No', 'Name', 'Email', 'Phone Number', 'Total Jobs', 'Total Work Order', 'Account Status', 'Approval Status', 'Action']}
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

          const headerToSortKey: Record<string, string> = {
            'Serial No': 'serialno',
            'Name': 'name',
            'Email': 'email',
            'Phone Number': 'phoneNumber',
            'Total Jobs': 'totalJobs',
            'Total Work Order': 'totalWorkOrder', 
          };
          const sortKey = headerToSortKey[header];
          const isSortable = Boolean(sortKey);

          return (
            <th
              key={index}
              className={`cursor-pointer ${index === 1 ? 'w-[120px]' : ''} ${index === 2 ? 'w-[200px]' : ''} ${index === 4 ? 'w-[150px]' : ''}  ${index === 7 ? 'w-[120px]' : ''} ${index === 8 ? 'w-[230px]' : ''}`}
              onClick={() => isSortable && handleSort(sortKey)}
            >
              {header}
              {isSortable && (
                <SortIcon active={sortBy === sortKey} direction={sortDirection} />
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
