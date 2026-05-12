// components/ClientListing.tsx
"use client";
import React, { useState, useEffect } from 'react';
import TableActions from '../../component/action';
import CommonHeader from '../../component/commonHeader';
import { useRouter } from "next/navigation";
import toast from 'react-hot-toast';
import Pagination from '../../component/pagination';
import Empty from '@/app/component/empty';
import Loader from '@/app/component/loader';
import { ExportToCsv } from 'export-to-csv-file';
import Breadcrumb from '@/app/component/breadcrumb';
import { useSidebar } from "@/app/component/SidebarContext";
import { renumberSerialNo } from '@/lib/renumberSerialNo';
import Link from 'next/link';
import Papa from 'papaparse';
import axios from 'axios';
import SortIcon from '@/app/component/sortIcon';



const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';  // ✅ Get the base URL here
const CUSTOMER_IMPORT_ID_MAP_KEY = 'customerImportSerialToIdMap';
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
    const startSerial = (currentPage - 1) * pageSize + 1;
    setSelectedIds((ids) => ids.filter((id) => id !== deletedId));
    setCustomer((prev) =>
      renumberSerialNo(
        prev.filter((cust) => cust.id !== deletedId),
        startSerial
      )
    );
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
        ? `/api/customer?userId=${userId}&searchQuery=${encodeURIComponent(query)}&roleType=${encodeURIComponent(roleType)}`
        : `/api/customer?userId=${userId}&page=${page}&limit=${limit}&roleType=${encodeURIComponent(roleType)}`;

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

        const customersWithSerialNo = fetchedCustomers.map((cust: any, index: number) => ({
          ...cust,
          serialNo: (page - 1) * limit + index + 1,
        }));
        setCustomer(customersWithSerialNo);
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
      if (column === 'serialNo') {
        const serialA = Number(a.serialNo) || 0;
        const serialB = Number(b.serialNo) || 0;
        return direction === 'asc' ? serialA - serialB : serialB - serialA;
      }

      if (column === 'fullName') {
        const nameA = `${a.firstName ?? ''} ${a.lastName ?? ''}`.trim();
        const nameB = `${b.firstName ?? ''} ${b.lastName ?? ''}`.trim();
        return direction === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }

      const valueA = a[column] ?? '';
      const valueB = b[column] ?? '';
      if (valueA < valueB) return direction === 'asc' ? -1 : 1;
      if (valueA > valueB) return direction === 'asc' ? 1 : -1;
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
    // Determine which customers to export
    const selectedCustomers = customer.filter(c => selectedIds.includes(c.id));

    if (selectedCustomers.length === 0) {
      toast.error("Please select at least one customer to export.");
      return;
    }

    const csvOptions = {
      filename: 'Customer',
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalSeparator: '.',
      showLabels: true,
      showTitle: true,
      title: 'Customer Data',
      useTextFile: false,
      useBom: true,
      useKeysAsHeaders: true,
    };

    const csvExporter = new ExportToCsv(csvOptions);
    if (!selectedCustomers || selectedCustomers.length === 0) {
      alert("Please select at least one customer to export.");
      return;
    }
    const serialToIdMap: Record<string, string> = {};
    const formattedData = selectedCustomers.map((customerData, index) => {
      const serialNo = index + 1;
      serialToIdMap[String(serialNo)] = String(customerData.id);
      return {
      'Serial No': serialNo,
      Name: `${customerData.fullName}`,
      Email: customerData.email || 'N/A',
      Address: customerData.address || 'N/A',
      };
    });

    localStorage.setItem(CUSTOMER_IMPORT_ID_MAP_KEY, JSON.stringify(serialToIdMap));

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

      // Expected exported columns:
      // Serial No, Name, Email, Address
      // Older format fallback:
      // Id, Name, Email, Address
      const manualHeaders = ['Serial No', 'Name', 'Email', 'Address'];
      const savedSerialToIdMap: Record<string, string> = (() => {
        try {
          const raw = localStorage.getItem(CUSTOMER_IMPORT_ID_MAP_KEY);
          return raw ? JSON.parse(raw) : {};
        } catch {
          return {};
        }
      })();

      Papa.parse(text, {
        header: false,
        skipEmptyLines: true,
        complete: async (result) => {
          const rawRows = (result.data as string[][]).filter((row) => Array.isArray(row) && row.length > 0);

          const cleanedData = rawRows
            .filter((row) => {
              const firstCell = String(row[0] ?? '').trim().toLowerCase();
              if (firstCell === 'id' || firstCell === 'serial no') return false;
              return true;
            })
            .map((row) => {
              const obj: any = {};
              manualHeaders.forEach((key, idx) => {
                let value: any = row[idx];
                if (value === undefined || value === null) {
                  value = null;
                } else if (typeof value === 'string') {
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
              const hasRealData = Object.values(row).some(
                (val) =>
                  (typeof val === 'string' && String(val).trim() !== '') ||
                  (typeof val === 'number' && !isNaN(val)) ||
                  typeof val === 'boolean'
              );
              return hasRealData;
            })
            .map((row) => {
              // Resolve customer id from saved Serial No -> Id map.
              // If import file is older and includes Id directly, keep fallback.
              const serialNoVal = row['Serial No'];
              const mappedIdFromSerial =
                serialNoVal != null && serialNoVal !== ''
                  ? savedSerialToIdMap[String(serialNoVal).trim()]
                  : null;
              const customerIdVal = mappedIdFromSerial ?? row['Customer Id'] ?? row['Id'];
              const numId = customerIdVal != null && customerIdVal !== '' && !isNaN(Number(customerIdVal))
                ? Number(customerIdVal)
                : null;

              const { ['Serial No']: _serialNo, ['Customer Id']: _customerId, Id: _legacyId, ...rest } = row;
              return numId !== null ? { ...rest, Id: numId } : rest;
            })
            .filter((row) => {
              if (Object.keys(row).length === 0) return false;
              const hasAnyValue = Object.values(row).some(
                (v) => v != null && v !== '' && (typeof v !== 'string' || String(v).trim() !== '')
              );
              return hasAnyValue;
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






  // Individual Row Checkbox
  const handleCheckboxChange = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };


  const renderRow = (cust: any, index: number) => {
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
        <td>{cust.serialNo}</td>
        {/* <td>{cust.id}</td> */}
        <td>
          <div className="flex items-center gap-2">

            <Link href={`/customer/view?customerId=${cust.id}`} className='hover:underline capitalize'>
              {cust?.fullName}
            </Link>
          </div>
        </td>
        <td>
          <a href={`mailto:${cust.email}`} style={{ color: '#383d71' }} className='hover:underline'>
            {cust.email || 'N/A'}
          </a>
        </td>
        <td>
          <a href={`tel:${cust.phoneNumber}`} style={{ color: '#383d71' }} className='hover:underline'>
            {cust.phoneNumber || 'N/A'}
          </a>
        </td>
       <td>{cust.address ? cust.address.replace(/^,\s*/g, '').replace(/\s*,\s*/g, ', ') : 'N/A'}</td>

        <td>
          <TableActions
            editRoute={`/customer/create?customerId=${cust.id}`}
            deleteRoute={`/api/deleteCustomer`}
            viewRoute={`/customer/view?customerId=${cust.id}`}
            idKey="customerId"
            userRole="Customer"
            itemId={cust.id}  // Pass the technician ID
            onDeleteSuccess={() => handleDeleteSuccess(cust.id)} />
        </td>
      </tr>
    );
  };

  return (
    <div className={`mobile_listing mobile_listing mx-auto mt-4 transition-all duration-300 ${isCollapsed ? 'w-full pl-[5rem]' : 'container'}`}>
      <Breadcrumb
        items={[
          { label: 'Customers', href: '/customer/listing' }
        ]}
      />
      
      <div className="shadow-lg p-4 bg-white rounded-lg">
      <CommonHeader heading='Customers' onPageSizeChange={handlePageSizeChange} onSearch={(term) => setSearchTerm(term)} onExport={downloadCSV} onImport={handleImportCSV} userRole='Customer' buttonLabel="Create Customer" buttonLink="/customer/create"  selectedRows={selectedIds}/>
      

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
              <th className="w-[80px]" onClick={() => handleSort('serialNo')}>
                Serial No
                <SortIcon active={sortBy === 'serialNo'} direction={sortDirection} />
              </th>
              {/* <th className="w-[50px]" onClick={() => handleSort('id')}>
                ID
                <SortIcon active={sortBy === 'id'} direction={sortDirection} />
              </th> */}
              <th className="w-[150px]" onClick={() => handleSort('fullName')}>
                Name
                <SortIcon active={sortBy === 'fullName'} direction={sortDirection} />
              </th>
              <th className="w-[200px]" onClick={() => handleSort('email')}>
                Email
                <SortIcon active={sortBy === 'email'} direction={sortDirection} />
              </th>
              <th className="w-[150px]" onClick={() => handleSort('phoneNumber')}>
                Phone Number
                <SortIcon active={sortBy === 'phoneNumber'} direction={sortDirection} />
              </th>
              <th className="w-[150px]" onClick={() => handleSort('address')}>
                Address
                <SortIcon active={sortBy === 'address'} direction={sortDirection} />
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
              customer.map((cust, index) => renderRow(cust, index))
            )}
          </tbody>
        </table>
      </div>
      {customer.length > 0 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
      )}
    </div>
    </div>
  );
}
