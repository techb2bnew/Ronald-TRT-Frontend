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
import Link from 'next/link';
import Image from 'next/image';
import Eye from '../../../../public/eye.svg';
import { ExportToCsv } from 'export-to-csv-file';
import Breadcrumb from '@/app/component/breadcrumb';


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

 
const handleDeleteSuccess = (deletedId: string) => {
    // toast.success('Technician deleted successfully');

    // ✅ Remove the deleted technician from the table
    setCustomer((prev) => prev.filter((cust) => cust.id !== deletedId));
  };
 
    
    const fetchCustomer = async (page = 1, query = '') => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userID');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
  
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
  
        // Determine correct endpoint
        const endpoint = query.trim()
          ? `${apiUrl}/searchCustomers?searchQuery=${encodeURIComponent(query)}`
          : `${apiUrl}/fetchAllCustomer?page=${page}`;
  
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
        fetchCustomer(currentPage, searchTerm);
      }, 500);
      return () => clearTimeout(timeoutId);
    }, [currentPage, searchTerm]);

 

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
    const csvOptions = {
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalSeparator: '.',
      showLabels: true,
      showTitle: true,
      title: 'All TRT Customers Data',
      useTextFile: false,
      useBom: true,
      useKeysAsHeaders: true, // Use object keys as headers
    };
  
    const csvExporter = new ExportToCsv(csvOptions);
  
    const formattedData = customer.map((customerData) => ({
      ID: customerData.id,
      Name: `${customerData.firstName} ${customerData.lastName}`,
      Email: customerData.email,
      Phone: customerData.phoneNumber,
      Address: customerData.address,
      Country: customerData.country,
      City: customerData.city,
      State: customerData.state,
      ZipCode: customerData.zipCode, 
    }));
  
    csvExporter.generateCsv(formattedData);
  };

  const renderRow = (cust: any) => (
    <tr key={cust.id}>
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

<Link className="p-1" href={`/client/view?customerId=${cust.id}&allTrtCustomer`}>
         <Image alt='eye' src={Eye} className='w-[16px]' /> 
         </Link>
      </td>
    </tr>
  );

  return (
    <div className="container mx-auto mt-4">
       <Breadcrumb
                    items={[
                      { label: 'All Customer', href: '/all-customer/listing' }
                    ]}
                  />
      <CommonHeader heading='All Customer' onSearch={(term) => setSearchTerm(term)}  onExport={downloadCSV} userRole='' buttonLabel="" buttonLink="" />

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
