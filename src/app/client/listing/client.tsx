// components/ClientListing.tsx
"use client";
import React, { useState, useEffect } from 'react';
import TableActions from '../../component/action';
import CommonHeader from '../../component/commonHeader';
import { useRouter } from "next/navigation";
import { toast } from 'react-toastify';
import Pagination from '../../component/pagination';
import Empty from '@/app/component/empty';
import Loader from '@/app/component/loader';
import { ExportToCsv } from 'export-to-csv-file';
import Breadcrumb from '@/app/component/breadcrumb';
import { useSidebar } from "@/app/component/SidebarContext";
import Link from 'next/link';
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

  const handleDeleteSuccess = (deletedId: string) => {
    // toast.success('Technician deleted successfully');

    // ✅ Remove the deleted technician from the table
    setCustomer((prev) => prev.filter((cust) => cust.id !== deletedId));
  };


  const fetchCustomer = async (page = 1, query = '', limit = pageSize) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userID');
      const roleType = localStorage.getItem('types') || "";
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Determine correct endpoint
      const endpoint = query.trim()
        ? `${apiUrl}/searchCustomers?userId=${userId}&searchQuery=${encodeURIComponent(query)}&roleType=${encodeURIComponent(roleType)}`
        : `${apiUrl}/fetchCustomer?userId=${userId}&page=${page}&limit=${limit}`;

      const response = await fetch(endpoint, { method: 'GET', headers });
      if (response.status == 400) {
        localStorage.removeItem('token');
        router.push('/');
      }
      const data = await response.json();
      if (response.ok) {
        // Handle customers array for both APIs correctly
        const fetchedCustomers: Customer[] = query.trim()
          ? data.customers || []
          : data.customers?.customers || [];
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


  // CSV Export Functions


  const downloadCSV = () => {
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

    const formattedData = customer.map((customerData) => ({
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
        .replace(/^\uFEFF/, '') // remove BOM
        .trimStart();

      let lines = text.split(/\r?\n/);

      // ✅ Safe filter: remove blank or garbage lines
      lines = lines.filter((line) => line.trim() !== '');

      // ✅ Detect if first line is garbage (e.g., "Technicians Data")
      if (lines[0].toLowerCase().includes('customer')) {
        lines.shift(); // remove garbage line
      }

      text = lines.join('\n'); // rebuild cleaned CSV text

      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: async (result) => {
          const parsedData = (result.data as any[]);

          // ✅ Very Important: If still only "Customer Data" field, fix manually
          const correctedData = parsedData.map((row) => {
            if (row['Customer Data']) {
              // Manual split fix
              const values = (row['Customer Data'] as string).split(',');
              return {
                id: values[0]?.trim() || '',
                name: values[1]?.trim() || '',
                email: values[2]?.trim() || '',
                phone: values[3]?.trim() || '',
                address: values[4]?.trim() || '',
                country: values[5]?.trim() || '',
                city: values[6]?.trim() || '',
                state: values[7]?.trim() || '',
                zipCode: values[8]?.trim() || '',
                deletedStatus: values[9]?.trim() || '',
              };
            }
            return row;
          });

          try {
            const response = await axios.post(
              `${apiUrl}/importCustomer`,
              { data: correctedData },
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
  const renderRow = (cust: any) => (
    <tr key={cust.id}>
      <td>{cust.id}</td>
      <td>
        <Link href={`/client/view?customerId=${cust.id}`}>
          {cust?.firstName} {cust?.lastName}
        </Link>
      </td>
      <td>
        <a href={`mailto:${cust.email}`} style={{ color: '#383d71' }}>
          {cust.email}
        </a>
      </td>
      <td>
        <a href={`tel:${cust.phoneNumber}`} style={{ color: '#383d71' }}>
          {cust.phoneNumber}
        </a>
      </td>
      <td>{cust.address}</td>
      <td>{cust.country}</td>
      <td>
        <TableActions
          editRoute={`/client/create?customerId=${cust.id}`}
          deleteRoute={`${apiUrl}/deleteCustomer`}
          viewRoute={`/client/view?customerId=${cust.id}`}
          idKey="customerId"
          userRole="Customer"
          itemId={cust.id}  // Pass the technician ID
          onDeleteSuccess={() => handleDeleteSuccess(cust.id)} />
      </td>
    </tr>
  );

  return (
    <div className={` mx-auto mt-4 transition-all duration-300 ${isCollapsed ? 'w-full pl-[5rem]' : 'container'}`}>
      <Breadcrumb
        items={[
          { label: 'Customers', href: '/client/listing' }
        ]}
      />

      <CommonHeader heading='Customers' onPageSizeChange={handlePageSizeChange} onSearch={(term) => setSearchTerm(term)} onExport={downloadCSV} onImport={handleImportCSV} userRole='Customer' buttonLabel="Create Customer" buttonLink="/client/create" />

      <div className="overflow-x-auto rounded-md">
        <table className="table w-full table-fixed">
          <thead>
            <tr>
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
