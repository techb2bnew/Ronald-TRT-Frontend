// components/ClientListing.tsx
"use client";
import React, { useState, useEffect } from 'react';
import TableActions from '../../component/action';
import CommonHeader from '../../component/commonHeader';
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from 'react-toastify';
import Pagination from '../../component/pagination';
import Empty from '@/app/component/empty';
import Loader from '@/app/component/loader';
import Link from 'next/link';
import Image from 'next/image';
import Eye from '../../../../public/eye.svg';
import { ExportToCsv } from 'export-to-csv-file';
import Breadcrumb from '@/app/component/breadcrumb';
import { useSidebar } from "@/app/component/SidebarContext";
import Papa from 'papaparse';
import axios from 'axios';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';  // ✅ Get the base URL here
interface Customer {
  id: string;
  name: string;
  email: string;
  deletedStatus?: boolean;
}
export default function ClientListing() {
  const [customer, setCustomer] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<string>('id'); // Default sorting column is 'id'
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc'); // Sorting direction state
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { isCollapsed } = useSidebar();
  const [pageSize, setPageSize] = useState(10);
  const [totalJobs, setTotalJobs] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleDeleteSuccess = (deletedId: string) => {
    // toast.success('Technician deleted successfully');

    // ✅ Remove the deleted technician from the table
    setCustomer((prev) => prev.filter((cust) => cust.id !== deletedId));
  };


  const fetchCustomer = async (page = 1, query = '', limit = pageSize) => {
    setLoading(true);
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const techId = searchParams.get('technicianId') || '';
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userID');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const finalUserId = techId || userId;
      // Determine correct endpoint
      const endpoint = query.trim()
        ? `${apiUrl}/searchIndividualTechnicianCustomers?searchQuery=${encodeURIComponent(query)}&roleType=single-technician&userId=${finalUserId}`
        : `${apiUrl}/fetchIndividualTechnicianCustomers?page=${page}&userId=${finalUserId}&limit=${limit}`;

      const response = await fetch(endpoint, { method: 'GET', headers });
      if (response.status == 400) {
        localStorage.removeItem('token');
        router.push('/');
      }
      const data = await response.json();
      if (response.ok) {
        // Handle customers array for both APIs correctly
        const fetchedCustomers: Customer[] = query.trim()
          ? data.IndividualTechnicianCustomers || []
          : data.IndividualTechnicianCustomers || [];
        //  const filteredCustomers = fetchedCustomers.filter(customer => !customer.deletedStatus);

        setCustomer(fetchedCustomers);
        setTotalPages(data.customers?.totalPages || 1);
      } else {
        if (data.error === 'Invalid Token') {
          router.push('/');
        } else {
          console.error('Error fetching customers:', data.error);
        }
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };



  const handleSort = (column: string) => {
    const direction = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(direction);
    setSortBy(column);

    const sortedCustomers = [...customer].sort((a, b) => {
      if (column === 'name') {
        const nameA = `${a.firstName} ${a.lastName}`;
        const nameB = `${b.firstName} ${b.lastName}`;
        return direction === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }

      if (a[column] < b[column]) return direction === 'asc' ? -1 : 1;
      if (a[column] > b[column]) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    setCustomer(sortedCustomers);
  };
  const handlePageChange = (data: { selected: number }) => {
    console.log(`Going to page number ${data.selected + 1}`);  // react-paginate uses zero-based index
    setCurrentPage(data.selected + 1);
  };

  // Unified useEffect to handle both search and pagination
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCustomer(currentPage, searchTerm, pageSize);
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

  // const handleSearch = async (query: string) => {
  //   try {
  //     const token = localStorage.getItem('token');

  //     const headers: Record<string, string> = {
  //       'Content-Type': 'application/json',
  //     };

  //     if (token) {
  //       headers['Authorization'] = `Token ${token}`;
  //     }

  //     // Determine API endpoint based on search term
  //     const response = await fetch(
  //       `${apiUrl}/searchCustomers?searchQuery=${encodeURIComponent(query)}`,
  //       {
  //         method: 'GET',
  //         headers,
  //       }
  //     );

  //     if (!response.ok) {
  //       throw new Error('Failed to fetch search results');
  //     }

  //     const data = await response.json();
  //     setCustomer(data.customers || []); // Set technicians or empty array if no data
  //   } catch (error) {
  //     console.error('Error fetching search results:', error);
  //     setCustomer([]); // Clear table on error
  //   }
  // };
  // CSV Export Functions
  const downloadCSV = () => {
    const selectedCustomers = customer.filter(c => selectedIds.includes(c.id));
    if (selectedCustomers.length === 0) {
      toast.warning("Please select at least job group to export.");
      return;
    }
    const csvOptions = {
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalSeparator: '.',
      showLabels: true,
      showTitle: true,
      title: 'Customer Data',
      useTextFile: false,
      useBom: true,
      useKeysAsHeaders: true, // Use object keys as headers
    };

    const csvExporter = new ExportToCsv(csvOptions);

    const formattedData = selectedCustomers.map((customerData) => ({
      Id: customerData.id,
      Name: `${customerData.firstName} ${customerData.lastName}`,
      Email: customerData.email,
      Phone: customerData.phoneNumber,
      Address: customerData.address,
      Country: customerData.country,
      City: customerData.city,
      State: customerData.state,
      ZipCode: customerData.zipCode,
      DeletedStatus: customerData.deletedStatus,
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
        'City', 'State', 'zipCode', 'DeletedStatus'
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
              `${apiUrl}/importCustomer`,
              { data: cleanedData },
              { headers }
            );
            toast.success('CSV Import Successful!');
            fetchCustomer(currentPage, searchTerm, pageSize);

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

  // Individual Row Checkbox
  const handleCheckboxChange = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const renderRow = (cust: any) => {
    const isChecked = selectedIds.includes(cust.id);
    return (
      <tr key={cust.id}>
        <td key="checkbox">
          <label className="flex items-center cursor-pointer relative">
            <input
              type="checkbox"
              className="peer h-5 w-5 cursor-pointer transition-all appearance-none rounded shadow bg-white hover:shadow-md border border-slate-300 checked:bg-[var(--foreground)] checked:border-[var(--foreground)]"
              checked={isChecked}
              onChange={() => handleCheckboxChange(cust.id)}
            />
            <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-[10px] transform -translate-x-1/2 -translate-y-1/2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
              </svg>
            </span>
          </label>
        </td>
        <td>{cust.id}</td>
        <td>{cust.firstName} {cust.lastName}</td>
        <td>{cust.email}</td>
        <td>{cust.phoneNumber}</td>
        <td>{cust.address}</td>
        <td>{cust.country}</td>
        <td>
          {/* <TableActions 
         editRoute={`/client/create?customerId=${cust.id}`}   
         deleteRoute={`${apiUrl}/deleteCustomer`} 
         viewRoute={`/client/view?customerId=${cust.id}`}
         idKey="customerId"
          itemId={cust.id}   
          onDeleteSuccess={() => handleDeleteSuccess(cust.id)} /> */}

          <Link href={`/client/view?customerId=${cust.id}&allTrtCustomer`}>
            <Image alt='eye' src={Eye} className='w-[16px]' />
          </Link>
        </td>
      </tr>
    );
  };

  return (
    <div className={` mx-auto mt-4 transition-all duration-300 ${isCollapsed ? 'w-full pl-[5rem]' : 'container'}`}>
      <Breadcrumb
        items={[
          { label: 'All Customer', href: '/all-customer/listing' }
        ]}
      />
      <CommonHeader heading='All Customer' onPageSizeChange={handlePageSizeChange} onSearch={(term) => setSearchTerm(term)} onExport={downloadCSV} onImport={handleImportCSV} userRole='' buttonLabel="" buttonLink="" />
      <ToastContainer position="top-center" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />

      <div className="overflow-x-auto rounded-md">
        <table className="table w-full table-fixed">
          <thead>
            <tr>
              <th className="w-[35px]">
                <label className="flex items-center cursor-pointer relative">
                  <input
                    type="checkbox"
                    className="peer h-5 w-5 cursor-pointer transition-all appearance-none rounded shadow bg-white hover:shadow-md border border-slate-300 checked:bg-[var(--foreground)] checked:border-[#fff]"
                    checked={selectedIds.length === customer.length}
                    onChange={() =>
                      setSelectedIds(
                        selectedIds.length === customer.length ? [] : customer.map((cust) => cust.id)
                      )
                    }
                  />
                  <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-[10px] transform -translate-x-1/2 -translate-y-1/2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                  </span>
                </label>
              </th>
              <th className="w-[50px]" onClick={() => handleSort('id')}>
                ID
                {sortBy === 'id' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white' : 'text-white'}`}>
                    {sortDirection === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </th>
              <th className="w-[150px]" onClick={() => handleSort('name')}>
                Name
                {sortBy === 'name' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white' : 'text-white'}`}>
                    {sortDirection === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </th>
              <th className="w-[200px]" onClick={() => handleSort('email')}>
                Email
                {sortBy === 'email' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white' : 'text-white'}`}>
                    {sortDirection === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </th>
              <th className="w-[150px]" onClick={() => handleSort('phoneNumber')}>
                Phone Number
                {sortBy === 'phoneNumber' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white' : 'text-white'}`}>
                    {sortDirection === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </th>
              <th className="w-[150px]" onClick={() => handleSort('address')}>
                Address
                {sortBy === 'address' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white' : 'text-white'}`}>
                    {sortDirection === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </th>
              <th className="w-[100px]" onClick={() => handleSort('country')}>
                Country
                {sortBy === 'country' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white' : 'text-white'}`}>
                    {sortDirection === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </th>
              <th className="w-[160px]">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-10">
                  <Loader />
                </td>
              </tr>
            ) : customer.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10">
                  <Empty />
                </td>
              </tr>
            ) : (
              customer.map((cust) => renderRow(cust))
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />

    </div>
  );
}
