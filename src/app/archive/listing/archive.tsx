"use client";
import React, { useState, useEffect } from 'react';
import TableActions from '@/app/component/action';
import CommonHeader from '@/app/component/commonHeader';
import { useRouter } from "next/navigation";
import { toast } from 'react-toastify';
import Pagination from '@/app/component/pagination';
import Empty from '@/app/component/empty';
import Loader from '@/app/component/loader';
import Swal from "sweetalert2";
import Eye from '../../../../public/eye.svg'
import Link from 'next/link';
import Image from 'next/image';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import Breadcrumb from '@/app/component/breadcrumb';
import { useSidebar } from "@/app/component/SidebarContext";
import { ExportToCsv } from 'export-to-csv-file';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

// Define archive types
const ARCHIVE_TYPES = {
  TECHNICIAN: 'Technician Archive',
  CUSTOMER: 'Customer Archive',
  JOB: 'Job Archive',
  SINGLE_TECHNICIAN: 'Single Technician Archive'
};

const ArchivePage = () => {
  const [archive, setArchive] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { isCollapsed } = useSidebar();
  const [pageSize, setPageSize] = useState(10);
  const [totalJobs, setTotalJobs] = useState(0);
  const [selectedArchiveType, setSelectedArchiveType] = useState<string>(ARCHIVE_TYPES.TECHNICIAN);
  const [singleTechnicianId, setSingleTechnicianId] = useState<string>('');


  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    // Get user role from localStorage when component mounts
    const role = localStorage.getItem('types') || '';
    setUserRole(role);

    // Set default archive type based on role
    if (role === 'single-technician') {
      setSelectedArchiveType(ARCHIVE_TYPES.CUSTOMER);
    } else {
      setSelectedArchiveType(ARCHIVE_TYPES.TECHNICIAN);
    }
  }, []);

  // Fetch data based on selected archive type
  const fetchArchive = async (page = 1, query = '', limit = pageSize) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const roleType = localStorage.getItem('types');
      const userID = localStorage.getItem('userID');

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      let endpoint = '';
      let params = `page=${page}&limit=${limit}&roleType=${roleType}`;
      let paramsTech = `page=${page}&limit=${limit}&types=${roleType}`;

      if (query.trim()) {
        params += `&searchQuery=${encodeURIComponent(query)}`;
      }
      if (roleType !== 'superadmin') {
        switch (selectedArchiveType) {
          case ARCHIVE_TYPES.CUSTOMER:
            endpoint = query.trim()
              ? `${apiUrl}/searchArchivedCustomer?searchQuery=${encodeURIComponent(query)}&roleType=${roleType}&userId=${userID}`
              : `${apiUrl}/fetchArchivedCustomer?${params}&userId=${userID}`;

            break;
          case ARCHIVE_TYPES.JOB:
            endpoint = query.trim()
              ? `${apiUrl}/searchfetchArchivedJob?searchQuery=${encodeURIComponent(query)}&roleType=${roleType}&userId=${userID}`
              : `${apiUrl}/fetchArchivedJob?${params}&userId=${userID}`;
            break;
          default:
            endpoint = query.trim()
              ? `${apiUrl}/searchArchivedCustomer?searchQuery=${encodeURIComponent(query)}&roleType=${roleType}&userId=${userID}`
              : `${apiUrl}/fetchArchivedCustomer?${params}&userId=${userID}`;
        }

      } else {
        switch (selectedArchiveType) {

          case ARCHIVE_TYPES.TECHNICIAN:
            endpoint = query.trim()
              ? `${apiUrl}/searchArchivedTechnician?searchQuery=${encodeURIComponent(query)}&types=${roleType}`
              : `${apiUrl}/fetchArchivedTechnician?${paramsTech}`;
            break;
          case ARCHIVE_TYPES.CUSTOMER:
            endpoint = query.trim()
              ? `${apiUrl}/searchArchivedCustomer?searchQuery=${encodeURIComponent(query)}&roleType=${roleType}`
              : `${apiUrl}/fetchArchivedCustomer?${params}`;
            break;
          case ARCHIVE_TYPES.JOB:
            endpoint = query.trim()
              ? `${apiUrl}/searchfetchArchivedJob?searchQuery=${encodeURIComponent(query)}&roleType=${roleType}`
              : `${apiUrl}/fetchArchivedJob?${params}`;
            break;
          default:
            // Default to all archives
            endpoint = query.trim()
              ? `${apiUrl}/searchArchivedTechnician?searchQuery=${encodeURIComponent(query)}&types=${roleType}`
              : `${apiUrl}/fetchArchivedTechnician?page=${page}&limit=${limit}&types=${roleType}`;
        }
      }

      const response = await fetch(endpoint, { method: 'GET', headers });

      if (response.status === 400) {
        localStorage.removeItem('token');
        router.push('/');
        return;
      }

      const data = await response.json();

      if (response.ok) {
        let fetchedArchive = [];

        if (selectedArchiveType === ARCHIVE_TYPES.TECHNICIAN) {
          // Handle all archives response
          const fetchedArchive = data.records?.map((record: any) => ({
            ...record,
            type: 'Technician',
            accountStatus: record.isApproved === 'reject' ? 'Rejected' :
              record.isApproved === 'pending' ? 'Pending' : 'Approved'
          })) || [];
          setArchive(fetchedArchive);
          setTotalPages(data?.totalPages || 1);
          setTotalJobs(data?.totalMatching || 0);
        } else {
          const fetchedArchive = data.records || [];
          setArchive(fetchedArchive);
          setTotalPages(data?.totalPages || 1);
          setTotalJobs(data?.totalMatching || 0);
        }
      } else {
        if (data.error === 'Invalid Token') {
          router.push('/');
        } else {
          console.error('Error fetching archive:', data.error);
          toast.error(data.error || 'Failed to fetch archive data');
        }
      }
    } catch (error) {
      console.error('Error fetching archive:', error);
      toast.error('Failed to fetch archive data');
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverRecord = async (id: number, type: string) => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "Do you want to recover this record?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, recover it!",
      });

      if (!result.isConfirmed) return;

      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      let payload: Record<string, any> = { deletedStatus: true };

      switch (type) {
        case "Customer":
          payload.customerId = id;
          break;
        case "User":
        case "Technician":
          payload.technicianId = id;
          break;
        case "Job":
          payload.jobId = id;
          break;
        case "admin":
          payload.adminId = id;
          break;
        default:
          console.error("Invalid type");
          return;
      }

      const response = await fetch(`${apiUrl}/recoverRecords`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire("Recovered!", "Record has been recovered successfully.", "success");
        fetchArchive(currentPage, searchTerm);
      } else {
        Swal.fire("Error!", data.error || "Failed to recover record.", "error");
      }
    } catch (error) {
      console.error("Error recovering record:", error);
      Swal.fire("Error!", "Something went wrong!", "error");
    }
  };

  const handleSort = (column: string) => {
    const direction = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(direction);
    setSortBy(column);

    const sortedArchive = [...archive].sort((a, b) => {
      const valA = a[column] || '';
      const valB = b[column] || '';

      if (typeof valA === 'string' && typeof valB === 'string') {
        return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return direction === 'asc' ? (valA < valB ? -1 : 1) : (valA > valB ? -1 : 1);
    });

    setArchive(sortedArchive);
  };

  const handlePageChange = (data: { selected: number }) => {
    setCurrentPage(data.selected + 1);
  };

  useEffect(() => { 
      fetchArchive(currentPage, searchTerm, pageSize); 
    return;
  }, [currentPage, searchTerm, pageSize, selectedArchiveType, singleTechnicianId]);

  const handlePageSizeChange = (size: number) => {
    const newTotalPages = Math.ceil(totalJobs / size);
    let newPage = currentPage;
    if (newPage > newTotalPages) {
      newPage = newTotalPages;
    }
    setPageSize(size);
    setCurrentPage(newPage);
  };

  const downloadCSV = () => {
    // Get current date for the filename
    const currentDate = new Date().toISOString().split('T')[0];

    // Create a more descriptive title based on archive type
    let exportTitle = '';
    switch (selectedArchiveType) {
      case ARCHIVE_TYPES.TECHNICIAN:
        exportTitle = `Technicians_Archive_${currentDate}`;
        break;
      case ARCHIVE_TYPES.CUSTOMER:
        exportTitle = `Customers_Archive_${currentDate}`;
        break;
      case ARCHIVE_TYPES.JOB:
        exportTitle = `Jobs_Archive_${currentDate}`;
        break;
      default:
        exportTitle = `Archive_Data_${currentDate}`;
    }

    const csvOptions = {
      fieldSeparator: ",",
      quoteStrings: '"',
      decimalSeparator: ".",
      showLabels: true,
      showTitle: true,
      title: exportTitle,  // Now using the dynamic title
      filename: exportTitle, // Also set as filename
      useTextFile: false,
      useBom: true,
      useKeysAsHeaders: true,
    };

    const csvExporter = new ExportToCsv(csvOptions);

    // ... rest of your CSV data formatting code remains the same ...
    const archiveRecords = archive ?? [];

    if (!Array.isArray(archiveRecords) || archiveRecords.length === 0) {
      alert("No archive data found to export.");
      return;
    }

    // Format data based on archive type
    const formattedData = archiveRecords.map((item) => {
      if (selectedArchiveType === ARCHIVE_TYPES.JOB) {
        // Format for Job data
        const technicians = item.technicians?.map((tech: any) =>
          `${tech.firstName} ${tech.lastName}`).join(', ') || '';

        return {
          'Job ID': item.jobId || item.id,
          'Customer': `${item.customer?.firstName || ''} ${item.customer?.lastName || ''}`,
          'Technician(s)': technicians,
          'VIN': item.vin || '',
          'Make': item.make || '',
          'Model': item.model || '',
          'Year': item.modelYear || '',
          'Status': item.jobStatus ? 'Completed' : 'In Progress',
          'Created At': item.createdAt || '',
        };
      } else if (selectedArchiveType === ARCHIVE_TYPES.TECHNICIAN) {
        // Format for Technician data
        return {
          'Tech ID': item.technicianId || item.id,
          'Name': `${item.firstName || ""} ${item.lastName || ""}`,
          'Email': item.email || "",
          'Phone': item.phoneNumber || "",
          'Address': item.address || "",
          'City': item.city || "",
          'State': item.state || "",
          'Country': item.country || "",
          'Status': item.accountStatus || "",
        };
      } else {
        // Default format for Customer data
        return {
          'Customer ID': item.customerId || item.id,
          'Name': `${item.firstName || ""} ${item.lastName || ""}`,
          'Email': item.email || "",
          'Phone': item.phoneNumber || "",
          'Address': item.address || "",
          'City': item.city || "",
          'State': item.state || "",
          'Country': item.country || "",
        };
      }
    });

    csvExporter.generateCsv(formattedData);
  };

  const renderArchiveTable = () => {
    if (archive.length === 0) {
      return (
        <div className="text-center py-10">
          <Empty />
        </div>
      );
    }

    return (
      <div className="overflow-x-auto mb-8 rounded-md">
        <h3 className="text-lg font-bold mb-4">{selectedArchiveType}</h3>
        <table className="table w-full table-fixed">
          <thead>
            <tr>
              {renderTableHeaders()}
            </tr>
          </thead>
          <tbody>
            {archive.map((item: any) => (
              <tr key={item.id}>
                {renderTableData(item)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderTableHeaders = () => {
    switch (selectedArchiveType) {
      case ARCHIVE_TYPES.JOB:
        return (
          <>
            <th>Job ID</th>
            <th>Customer</th>
            <th>Technician</th>
            <th>VIN</th>
            <th>Make</th>
            <th>Model</th>
            <th>Year</th>
            <th>Status</th>
            <th>Action</th>
          </>
        );
      case ARCHIVE_TYPES.TECHNICIAN:
      case ARCHIVE_TYPES.SINGLE_TECHNICIAN:
        return (
          <>
            <th>Tech ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Address</th>
            <th>Action</th>
          </>
        );
      case ARCHIVE_TYPES.CUSTOMER:
        return (
          <>
            <th>Customer ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Address</th>
            <th>Action</th>
          </>
        );
      default:
        return (
          <>
            <th>Tech ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Address</th>
            <th>Action</th>
          </>
        );
    }
  };

  const renderTableData = (item: any) => {
    switch (selectedArchiveType) {
      case ARCHIVE_TYPES.JOB:
        return (
          <>
            <td>{item.jobId || item.id}</td>
            <td>{item?.customer?.firstName} {item?.customer?.lastName}</td>
            <td>  {item?.technicians?.map((tech: any) => (
              <div key={tech.id}>
                {tech.firstName} {tech.lastName}
              </div>
            ))}</td>
            <td>{item.vin}</td>
            <td>{item.make}</td>
            <td>{item.model}</td>
            <td>{item.modelYear}</td>
            <td>
              <span
                className={`badge ${item.jobStatus ? 'badge-success bg-[#E6F9DD] text-[#1A932E] p-2 pl-4 pr-4 rounded shadow' : 'badge-error bg-[#FFE4E1] text-[#FF0000] p-2 pl-4 pr-4 rounded shadow'}`}
              >
                {item.jobStatus ? 'Completed' : 'In Progress'}
              </span>
            </td>
            <td>{renderActions(item)}</td>
          </>
        );
      case ARCHIVE_TYPES.TECHNICIAN:
      case ARCHIVE_TYPES.SINGLE_TECHNICIAN:
        return (
          <>
            <td>{item.technicianId || item.id}</td>
            <td>{item.firstName} {item.lastName}</td>
            <td>{item.email}</td>
            <td>{item.phoneNumber}</td>
            <td>{item.address ? `${item.address}, ${item.city}, ${item.state}` : 'N/A'}</td>
            <td>{renderActions(item)}</td>
          </>
        );
      case ARCHIVE_TYPES.CUSTOMER:
        return (
          <>
            <td>{item.customerId || item.id}</td>
            <td>{item.firstName} {item.lastName}</td>
            <td>{item.email}</td>
            <td>{item.phoneNumber}</td>
            <td>{item.address ? `${item.address}, ${item.city}, ${item.state}` : 'N/A'}</td>
            <td>{renderActions(item)}</td>
          </>
        );

    }
  };

  const renderActions = (item: any) => {
    return (
      <div className="flex gap-3">
        <button
          onClick={() => handleRecoverRecord(item.id, item.type || selectedArchiveType.replace(' Archive', ''))}
          data-tooltip-id="undo"
          data-tooltip-content="Undo"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M14.2519 9.2266C14.1894 9.2266 14.1308 9.21879 14.0683 9.20707C13.6347 9.10551 13.3652 8.67192 13.4667 8.23442L14.3573 4.42582C14.4823 3.89067 15.0214 3.55473 15.5566 3.67582L19.3691 4.5391C19.8027 4.63676 20.0761 5.07035 19.9784 5.50395C19.8808 5.93754 19.4472 6.21098 19.0136 6.11332L15.7909 5.38285L15.037 8.6016C14.9511 8.9766 14.6191 9.2266 14.2519 9.2266Z"
              fill="black"
            />
            <path
              d="M9.07031 19.0703C6.64844 19.0703 4.37109 18.1289 2.65625 16.4141C0.941406 14.6992 0 12.4219 0 10C0 7.57812 0.941406 5.30078 2.65625 3.58594C4.36719 1.875 6.64453 0.929688 9.07031 0.929688C9.97656 0.929688 10.8711 1.0625 11.7266 1.32422C12.1523 1.45313 12.3945 1.90625 12.2617 2.33203C12.1328 2.75781 11.6797 3 11.2539 2.86719C10.5508 2.65234 9.8125 2.54297 9.07031 2.54297C4.96094 2.54687 1.61719 5.89062 1.61719 10C1.61719 14.1094 4.96094 17.4531 9.07031 17.4531C13.1797 17.4531 16.5234 14.1094 16.5234 10C16.5234 8.16406 15.8516 6.40234 14.6289 5.03516C14.332 4.70312 14.3594 4.19141 14.6914 3.89453C15.0234 3.59766 15.5352 3.625 15.832 3.95703C17.3203 5.62109 18.1406 7.76562 18.1406 10C18.1406 12.4219 17.1992 14.6992 15.4844 16.4141C13.7695 18.125 11.4922 19.0703 9.07031 19.0703Z"
              fill="black"
            />
          </svg>
        </button>
        <Tooltip id="undo" place="top" />
        <Link
          data-tooltip-id="view"
          data-tooltip-content="View"
          className="p-1"
          href={
            selectedArchiveType === ARCHIVE_TYPES.JOB || item.type === "Job" || item.type === "JOB"
              ? `/jobs/view?jobId=${item.id}`
              : selectedArchiveType === ARCHIVE_TYPES.TECHNICIAN ||
                item.type === "Technician" ||
                item.type === "User"
                ? `/archive/view?technicianId=${item.id}`
                : `/client/view?customerId=${item.id}`
          }
        >
          <Image alt="eye" src={Eye} className="w-[16px]" />
        </Link>

        <Tooltip id="view" place="top" />
      </div>
    );
  };

  return (
    <div className={`mx-auto mt-4 transition-all duration-300 ${isCollapsed ? 'w-full pl-[5rem]' : 'container'}`}>
      {/* Breadcrumb Component */}
      <Breadcrumb
        items={[
          { label: 'Archive', href: '/archive/listing' }
        ]}
      />

      {/* CommonHeader with Archive Type Dropdown */}
      <CommonHeader
        heading="Archive"
        onSearch={(term) => setSearchTerm(term)}
        userRole=""
        buttonLabel=""
        buttonLink=""
        onExport={downloadCSV}
        onPageSizeChange={handlePageSizeChange}
        additionalComponents={
          <div className="flex items-center space-x-4">
            <select
              className="select select-bordered w-full max-w-xs p-3 text-[12px]"
              value={selectedArchiveType}
              onChange={(e) => {
                setSelectedArchiveType(e.target.value);
                setCurrentPage(1); // Reset to first page when changing archive type
              }}
            >
              {userRole === 'superadmin' && (
                <option value={ARCHIVE_TYPES.TECHNICIAN}>Technicians Archive</option>
              )}
              <option value={ARCHIVE_TYPES.CUSTOMER}>Customers Archive</option>
              <option value={ARCHIVE_TYPES.JOB}>Jobs Archive</option>
            </select>
          </div>
        }
      />

      {/* Main Content */}
      {loading ? (
        <Loader />
      ) : (
        <>
          {renderArchiveTable()}
          {archive.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ArchivePage;