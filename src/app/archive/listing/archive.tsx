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

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';  // ✅ Get the base URL here

const ArchivePage = () => {
  const [archive, setArchive] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<string>('id'); // Default sorting column is 'id'
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc'); // Sorting direction state
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');

  const groupedRecords: Record<string, any[]> = archive.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = [];
    }
    acc[item.type].push(item);
    return acc;
  }, {});

  const fetchArchive = async (page = 1, query = '') => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const roleType = localStorage.getItem('types');
  
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
  
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
  
      // Determine correct endpoint
      const endpoint = query.trim()
        ? `${apiUrl}/searchRecoverRecord?searchQuery=${encodeURIComponent(query)}`
        : `${apiUrl}/recoverRecordsList?page=${page}`;
  
      const response = await fetch(endpoint, { method: 'GET', headers });
  
      if (response.status === 400) {
        localStorage.removeItem('token');
        router.push('/');
        return;
      }
  
      const data = await response.json();
  
      if (response.ok) {
        let fetchedArchive = [];
  
        if (query.trim()) {
          // Handle search API response (data is directly in `records`)
          fetchedArchive = data.records?.map((record: any) => ({
            ...record, // Spread the record directly
            type: 'Unknown' // Add a default type (or extract from record if available)
          })) || [];
        } else {
          // Handle recoverRecordsList API response (data is nested in `data` object)
          fetchedArchive = data.records?.map((record: any) => ({
            ...record.data, // Spread the `data` object
            type: record.type // Add `type` as a separate field
          })) || [];
        }
  
        setArchive(fetchedArchive);
        setTotalPages(data?.totalPages || 1);
      } else {
        if (data.error === 'Invalid Token') {
          router.push('/');
        } else {
          console.error('Error fetching archive:', data.error);
        }
      }
    } catch (error) {
      console.error('Error fetching archive:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverRecord = async (id: number, type: string) => {
    try {
      // Show SweetAlert confirmation
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "Do you want to recover this record?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, recover it!",
      });

      if (!result.isConfirmed) return; // If user cancels, stop execution

      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      // Generate the dynamic payload
      let payload: Record<string, any> = { deletedStatus: true };

      switch (type) {
        case "Customer":
          payload.customerId = id;
          break;
        case "User":
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
        fetchArchive(currentPage, searchTerm); // Refresh the list
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
    console.log(`Going to page number ${data.selected + 1}`);  // react-paginate uses zero-based index
    setCurrentPage(data.selected + 1);
  };

  // Unified useEffect to handle both search and pagination
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchArchive(currentPage, searchTerm);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [currentPage, searchTerm]);

  // CSV Export Functions
  const convertToCSV = (data: any[]) => {
    if (!data.length) return ''; // Handle empty data case

    const headers = Object.keys(data[0] || {}); // Extract headers from the first item
    const csvRows = [headers.join(',')];

    data.forEach((row) => {
      const values = headers.map(header => row[header] || ''); // Ensure values are extracted
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  };

  const downloadCSV = () => {
    const csvData = convertToCSV(archive);
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'archive.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
 
  const renderAllTables = () => {
    const recordKeys = Object.keys(groupedRecords);

    if (recordKeys.length === 0) {
      return (
        <div className="text-center py-10">
          <Empty />
        </div>
      );
    }
    return Object.keys(groupedRecords).map((type) => (
      <div key={type} className="overflow-x-auto mb-8 rounded-md">
        <h3 className="text-lg font-bold mb-4 capitalize">{type} Records</h3>
        <table className="table w-full table-fixed">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email / VIN</th>
              <th>Phone / Make</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {groupedRecords[type]?.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10">
                  <Empty />
                </td>
              </tr>
            ) : (
              groupedRecords[type].map((item: any) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>
                    {item.firstName || item.customer?.firstName}{" "}
                    {item.lastName || item.customer?.lastName}
                  </td>
                  <td>{item.email || item.vin || item.customer?.email}</td>
                  <td>
                    {item.phoneNumber || item.make || item.customer?.phoneNumber}
                  </td>
                  <td>
                    <div className="flex gap-3">
                      <button onClick={() => handleRecoverRecord(item.id, item.type)} data-tooltip-id="undo"
                      data-tooltip-content="Undo">
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
                        href={`/archive/view?${
                          item.type === "User"
                            ? "technicianId"
                            : item.type === "Job"
                            ? "jobId"
                            : "customerId"
                        }=${item.id}`}
                      >
                        <Image alt="eye" src={Eye} className="w-[16px]" />
                      </Link>

                      <Tooltip id="view" place="top" />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    ));
  };

  return (
    <div className="container mx-auto mt-4">
      <CommonHeader
        heading="Archive"
        onSearch={(term) => setSearchTerm(term)}
        userRole=""
        buttonLabel=""
        buttonLink=""
        onExport={downloadCSV}
      />
      {loading ? (
        <Loader />
      ) : (
        <>
          {renderAllTables()}
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
  //   <div className="container mx-auto mt-4">
  //     <CommonHeader heading='Archive' onSearch={(term) => setSearchTerm(term)} userRole='' buttonLabel='' buttonLink='' onExport={downloadCSV} />

  //     <div className="overflow-x-auto rounded-md">
  //       <table className="table w-full table-fixed">
  //         <thead>
  //           <tr>
  //             <th onClick={() => handleSort('id')}>
  //               ID
  //               {sortBy === 'id' && (
  //                 <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white' : 'text-white'}`}>
  //                   {sortDirection === 'asc' ? '↑' : '↓'}
  //                 </span>
  //               )}
  //             </th> 
  //             <th>Name</th>
  //             <th>Email</th>
  //             <th>Phone Number</th>
  //             <th>Action</th>
  //           </tr>
  //         </thead>
  //         <tbody>
  //           {loading ? (
  //             <tr>
  //               <td colSpan={5} className="text-center py-10">
  //                 <Loader />
  //               </td>
  //             </tr>
  //           ) : archive.length === 0 ? (
  //             <tr>
  //               <td colSpan={5} className="text-center py-10">
  //                 <Empty />
  //               </td>
  //             </tr>
  //           ) : (
  //             archive.map((item: any, index: number) => (
  //               <tr key={item.id || index}>
  //                 <td>{item.id}</td> 
  //                 <td>{item.firstName || item.customer?.firstName} {item.lastName || item.customer?.lastName}</td>
  //                 <td>{item.email || item.customer?.email}</td>
  //                 <td>{item.phoneNumber || item.customer?.phoneNumber}</td>
  //                 <td>
  //                   <div className="flex gap-3">
  //                   <button onClick={() => handleRecoverRecord(item.id, item.type)}>
  //                     <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  //                       <g clipPath="url(#clip0_1531_1840)">
  //                         <path d="M14.2519 9.2266C14.1894 9.2266 14.1308 9.21879 14.0683 9.20707C13.6347 9.10551 13.3652 8.67192 13.4667 8.23442L14.3573 4.42582C14.4823 3.89067 15.0214 3.55473 15.5566 3.67582L19.3691 4.5391C19.8027 4.63676 20.0761 5.07035 19.9784 5.50395C19.8808 5.93754 19.4472 6.21098 19.0136 6.11332L15.7909 5.38285L15.037 8.6016C14.9511 8.9766 14.6191 9.2266 14.2519 9.2266Z" fill="black" />
  //                         <path d="M9.07031 19.0703C6.64844 19.0703 4.37109 18.1289 2.65625 16.4141C0.941406 14.6992 0 12.4219 0 10C0 7.57812 0.941406 5.30078 2.65625 3.58594C4.36719 1.875 6.64453 0.929688 9.07031 0.929688C9.97656 0.929688 10.8711 1.0625 11.7266 1.32422C12.1523 1.45313 12.3945 1.90625 12.2617 2.33203C12.1328 2.75781 11.6797 3 11.2539 2.86719C10.5508 2.65234 9.8125 2.54297 9.07031 2.54297C4.96094 2.54687 1.61719 5.89062 1.61719 10C1.61719 14.1094 4.96094 17.4531 9.07031 17.4531C13.1797 17.4531 16.5234 14.1094 16.5234 10C16.5234 8.16406 15.8516 6.40234 14.6289 5.03516C14.332 4.70312 14.3594 4.19141 14.6914 3.89453C15.0234 3.59766 15.5352 3.625 15.832 3.95703C17.3203 5.62109 18.1406 7.76562 18.1406 10C18.1406 12.4219 17.1992 14.6992 15.4844 16.4141C13.7695 18.125 11.4922 19.0703 9.07031 19.0703Z" fill="black" />
  //                       </g>
  //                       <defs>
  //                         <clipPath id="clip0_1531_1840">
  //                           <rect width="20" height="20" fill="white" />
  //                         </clipPath>
  //                       </defs>
  //                     </svg>
  //                   </button>
  //                   <Link
  //                     className="p-1"
  //                     href={
  //                       item.type === "User"
  //                         ? `/archive/view?technicianId=${item.id}`
  //                         : item.type === "Job"
  //                         ? `/archive/view?jobId=${item.id}`
  //                         : item.type === "Customer"
  //                         ? `/archive/view?customerId=${item.id}`
  //                         : `/archive/view`  
                          
  //                     }
  //                   >
  //                     <Image alt='eye' src={Eye} className='w-[16px]' />
  //                   </Link>
  //                   </div>
  //                 </td>
  //               </tr>
  //             ))
  //           )}
  //         </tbody>
  //       </table>
  //     </div>
  //     <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
  //   </div>
  // );
 