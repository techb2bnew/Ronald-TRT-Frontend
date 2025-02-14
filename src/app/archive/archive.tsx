// components/ClientListing.tsx
"use client";
import React, { useState, useEffect } from 'react';
import TableActions from '@/app/component/action';
import CommonHeader from '@/app/component/commonHeader';
import { useRouter } from "next/navigation";
import { toast } from 'react-toastify';
import Pagination from '@/app/component/pagination';
import Empty from '@/app/component/empty';
import Loader from '@/app/component/loader';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';  // ✅ Get the base URL here

export default function ClientListing() {
  const [customer, setCustomer] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<string>('id'); // Default sorting column is 'id'
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc'); // Sorting direction state
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);  
  const [loading, setLoading] = useState<boolean>(true); 
  const [searchTerm, setSearchTerm] = useState('');
 
    
    const fetchCustomer = async (page = 1, query = '') => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
  
        if (token) {
          headers['Authorization'] = `Token ${token}`;
        }
  
        // Determine correct endpoint
        const endpoint = query.trim()
          ? `${apiUrl}/searchCustomers?searchQuery=${encodeURIComponent(query)}`
          : `${apiUrl}/fetchCustomer?page=${page}`;
  
        const response = await fetch(endpoint, { method: 'GET', headers });
        if (response.status == 400) {
          localStorage.removeItem('token');
          router.push('/login');
        }
        const data = await response.json();
        if (response.ok) {
           // Handle customers array for both APIs correctly
           const fetchedCustomers = query.trim()
           ? data.customers || []  // For search API response
           : data.customers?.customers || [];  // For pagination API response
  
           setCustomer(fetchedCustomers);
          setTotalPages(data.customers?.totalPages || 1);
        } else {
          if (data.error === 'Invalid Token') {
            router.push('/login');
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

 
 
// CSV Export Functions
const convertToCSV = (data:any) => {
  const csvRows = [];
  // Get headers
  csvRows.push(Object.keys(data[0]).join(','));
  // Convert data to csv
  for (const row of data) {
    csvRows.push(Object.values(row).join(','));
  }
  return csvRows.join('\n');
};

const downloadCSV = () => {
  const csvData = convertToCSV(customer);
  const blob = new Blob([csvData], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', 'customers.csv');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

  const renderRow = (cust: any) => (
    <tr key={cust.id}>
      <td>{cust.id}</td>
      <td>{cust.firstName} {cust.lastName}</td>
      <td>{cust.email}</td>
      <td>{cust.phoneNumber}</td> 
      <td>
      	  <span
          className='badge-success bg-[#E6F9DD] text-[#1A932E] p-2 pl-4 pr-4 rounded shadow'>
          Approved
        </span>
      </td>
      <td>
      <a>
      	<svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
			<g clipPath="url(#clip0_1531_1840)">
			<path d="M14.2519 9.2266C14.1894 9.2266 14.1308 9.21879 14.0683 9.20707C13.6347 9.10551 13.3652 8.67192 13.4667 8.23442L14.3573 4.42582C14.4823 3.89067 15.0214 3.55473 15.5566 3.67582L19.3691 4.5391C19.8027 4.63676 20.0761 5.07035 19.9784 5.50395C19.8808 5.93754 19.4472 6.21098 19.0136 6.11332L15.7909 5.38285L15.037 8.6016C14.9511 8.9766 14.6191 9.2266 14.2519 9.2266Z" fill="black"/>
			<path d="M9.07031 19.0703C6.64844 19.0703 4.37109 18.1289 2.65625 16.4141C0.941406 14.6992 0 12.4219 0 10C0 7.57812 0.941406 5.30078 2.65625 3.58594C4.36719 1.875 6.64453 0.929688 9.07031 0.929688C9.97656 0.929688 10.8711 1.0625 11.7266 1.32422C12.1523 1.45313 12.3945 1.90625 12.2617 2.33203C12.1328 2.75781 11.6797 3 11.2539 2.86719C10.5508 2.65234 9.8125 2.54297 9.07031 2.54297C4.96094 2.54687 1.61719 5.89062 1.61719 10C1.61719 14.1094 4.96094 17.4531 9.07031 17.4531C13.1797 17.4531 16.5234 14.1094 16.5234 10C16.5234 8.16406 15.8516 6.40234 14.6289 5.03516C14.332 4.70312 14.3594 4.19141 14.6914 3.89453C15.0234 3.59766 15.5352 3.625 15.832 3.95703C17.3203 5.62109 18.1406 7.76562 18.1406 10C18.1406 12.4219 17.1992 14.6992 15.4844 16.4141C13.7695 18.125 11.4922 19.0703 9.07031 19.0703Z" fill="black"/>
			</g>
			<defs>
			<clipPath id="clip0_1531_1840">
			<rect width="20" height="20" fill="white"/>
			</clipPath>
			</defs>
		</svg>
      </a>
      </td>
    </tr>
  );

  return (
    <div className="container mx-auto mt-4">
      <CommonHeader heading='Archive' onSearch={(term) => setSearchTerm(term)} buttonLabel='' buttonLink='' onExport={downloadCSV}   />

      <div className="overflow-x-auto rounded-md">
        <table className="table w-full table-fixed">
          <thead>
            <tr>
              <th   onClick={() => handleSort('id')}>
                ID
                {sortBy === 'id' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white' : 'text-white'}`}>
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th   onClick={() => handleSort('name')}>
                Name
                {sortBy === 'name' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white' : 'text-white'}`}>
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th  className="w-[260px]" onClick={() => handleSort('email')}>
                Email
                {sortBy === 'email' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white' : 'text-white'}`}>
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th   onClick={() => handleSort('phoneNumber')}>
                Phone Number
                {sortBy === 'phoneNumber' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white' : 'text-white'}`}>
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
               <th>Account Status</th>
              <th >Action</th>
            </tr>
          </thead>
          <tbody>
          {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-10">
                  <Loader />
                </td>
              </tr>
            ) : customer.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10">
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
