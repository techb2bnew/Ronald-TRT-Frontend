// components/JobTable.tsx
"use client";
import React, { useState, useEffect, useCallback } from 'react'; 
import TableActions from '../../component/action';
import CommonHeader from '../../component/commonHeader';
import { useRouter } from "next/navigation";
import { toast } from 'react-toastify';
import Pagination from '../../component/pagination';
import axios from 'axios';
import Swal from 'sweetalert2'; 
import Empty from '@/app/component/empty';
import Loader from '@/app/component/loader';
import { ExportToCsv } from 'export-to-csv-file';
import Breadcrumb from '@/app/component/breadcrumb';


const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';  // ✅ Get the base URL here

interface VehcileInfo {
  id: string;
  name: string;
  email: string;
  deletedStatus?: boolean;
  Role: { name: string };
}

const VehicleTable: React.FC = () => {
  const [activeJob, setActiveJob] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<string>('id'); // Manage sorting column state
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc'); // Sorting direction state
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);  
  const [loading, setLoading] = useState<boolean>(true); 
  const [searchTerm, setSearchTerm] = useState(''); 

  
  const handleDeleteSuccess = (deletedId: string) => {
      // toast.success('Technician deleted successfully');
  
      // ✅ Remove the deleted technician from the table
      setActiveJob((prev) => prev.filter((cust) => cust.id !== deletedId));
    };
    const fetchJobs = async (page = 1, query = '') => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const roleType = localStorage.getItem('types') || ""; 
        const userId = localStorage.getItem('userID');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
  
        
        const endpoint = query.trim()
        ? roleType === 'superadmin'
        ? `${apiUrl}/searchVehicalInfo?searchQuery=${encodeURIComponent(query)}&roleType=${encodeURIComponent(roleType)}`
        : `${apiUrl}/searchVehicalInfo?userId=${userId}&searchQuery=${encodeURIComponent(query)}&roleType=${encodeURIComponent(roleType)}`
        : roleType === 'superadmin'
          ? `${apiUrl}/fetchVehicalInfo?page=${page}&roleType=${encodeURIComponent(roleType)}`
          : `${apiUrl}/fetchVehicalInfo?userId=${userId}&page=${page}&roleType=${encodeURIComponent(roleType)}`;

      const response = await fetch(endpoint, { method: 'GET', headers });  
        const data = await response.json();
        if (response.ok) {
          const fetchedTechnicians: VehcileInfo[] = query.trim()
          ? data.VehicalInfo || []
          : data.vehicles || [];

          setActiveJob(fetchedTechnicians); 
          setTotalPages(data.totalPages);
        } else {
          if (data.error === 'Invalid Token') {
            router.push('/');
          } else {
            console.error('Error fetching job data:', data.error);
          }
        }
      } catch (error) {
        console.error('Error fetching job data:', error);
      } finally {
        setLoading(false);
      }
    };
 
  
 
  useEffect(() => {
        const timeoutId = setTimeout(() => {
          fetchJobs(currentPage, searchTerm);
        }, 500);
        return () => clearTimeout(timeoutId);
      }, [currentPage, searchTerm]);

  // Function to handle sorting logic
  const handleSort = (column: string) => {
    const direction = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(direction);
    setSortBy(column);

    const sortedJobs = [...activeJob].sort((a, b) => {
      if (column === 'customerName') {
        const nameA = `${a?.customer?.firstName} ${a?.customer?.lastName}`;
        const nameB = `${b?.customer?.firstName} ${b?.customer?.lastName}`;
        return direction === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      if (column === 'technicianName') {
        const nameF = `${a?.technician?.firstName} ${a?.technician?.lastName}`;
        const nameL = `${b?.technician?.firstName} ${b?.technician?.lastName}`;
        return direction === 'asc' ? nameF.localeCompare(nameL) : nameL.localeCompare(nameF);
      }

      if (a[column] < b[column]) return direction === 'asc' ? -1 : 1;
      if (a[column] > b[column]) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    setActiveJob(sortedJobs);
  };

 

  const handlePageChange = (data: { selected: number }) => {
    console.log(`Going to page number ${data.selected + 1}`);  // react-paginate uses zero-based index
    setCurrentPage(data.selected + 1);
  };

  // CSV Export Functions
const downloadCSV = () => {
    const csvOptions = {
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalSeparator: '.',
      showLabels: true,
      showTitle: true,
      title: 'Vehicle List Data',
      useTextFile: false,
      useBom: true,
      useKeysAsHeaders: true, // Use object keys as headers
    };
  
    const csvExporter = new ExportToCsv(csvOptions);
  
    const formattedData = activeJob.map((jobData) => ({
      ID: jobData.id,
      Customer: `${jobData?.customer?.firstName} ${jobData?.customer?.lastName}`,
      BodyClass: jobData.bodyClass,
      Color: jobData.color,
      Make: jobData.make,
      Model: jobData.model,
      'Model Year': jobData.modelYear,
      'Manufacturer Name': jobData.manufacturerName,
      'Plant Company Name': jobData.plantCompanyName,
      'Plant Country': jobData.plantCountry,
      'Plant State': jobData.plantState, 
      'Account Status': jobData.accountStatus ? 'Approved' : 'Accept',
      Notes: jobData.notes,
      CreatedAt: new Date(jobData.createdAt).toLocaleDateString(),  
      JobStatus: jobData.jobStatus ? 'Completed' : 'Pending',
      Technicians: jobData.technicians
        .map((tech:any) => `${tech.firstName} ${tech.lastName}`)
        .join(', '), // Multiple technicians in one column
    }));
  
    csvExporter.generateCsv(formattedData);
  };

  const renderRow = (job: any) => (
    <tr key={job.id}>
      <td>{job?.id}</td> 
      <td>{job?.customer?.firstName} {job?.customer?.lastName}</td> 
      <td>  {job?.technicians?.map((tech: any) => (
        <div key={tech.id}>
      {tech.firstName} {tech.lastName}
    </div>
  ))}</td>
      <td>{job.make} </td>
       <td>{job.model}</td>
       <td>{job.modelYear}</td>
       <td>{job.color}</td> 
       <td> {new Date(job.createdAt).toLocaleDateString('en-GB')}</td>
       <td> {new Date(job.updatedAt).toLocaleDateString('en-GB')}</td>
       <td> <span
          className={`badge ${job.jobStatus ? 'badge-success bg-[#E6F9DD] text-[#1A932E] p-2 pl-4 pr-4 rounded shadow' : 'badge-error bg-[#FFE4E1] text-[#FF0000] p-2 pl-4 pr-4 rounded shadow'}`}
        >
          {job.jobStatus ? 'Completed' : 'In Progress'}
        </span></td>
      
    </tr>
  );

  return (
    <div className="container mx-auto mt-4">
      <Breadcrumb
              items={[
                { label: 'Vehicles List', href: '/reporting/vehicle-list' }
              ]}
            />
      <CommonHeader heading="Vehicles List" onSearch={(term) => setSearchTerm(term)}   onExport={downloadCSV} userRole='' buttonLabel="" buttonLink="" />

      <div className="overflow-auto rounded-md">
        <table className="table w-full table-fixed">
          <thead>
            <tr>
              <th className="w-[100px]" onClick={() => handleSort('id')}>
              Job ID
                {sortBy === 'id' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white-500' : 'text-white'}`}>
                      {sortDirection === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </th> 
              <th className="w-[120px]" onClick={() => handleSort('customerName')}>
              Customer Name
                {sortBy === 'customerName' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white-500' : 'text-white'}`}>
                      {sortDirection === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </th>
              <th className="w-[160px]">Assigned Technician</th>
              
             
              <th className="w-[120px]" >
              Make
              </th> 
              <th className="w-[100px]">Model</th> 
              <th className="w-[60px]">Year</th> 
              <th className="w-[50px]">Color</th> 
              <th className="w-[100px]">Start Date</th> 
              <th className="w-[100px]">Completion Date</th> 
              <th className="w-[100px]">Status</th>
            </tr>
          </thead>
          <tbody>
              {loading ? (
                          <tr>
                            <td colSpan={10} className="text-center py-10">
                              <Loader />
                            </td>
                          </tr>
                        ) : activeJob.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="text-center py-10">
                              <Empty />
                            </td>
                          </tr>
                        ) : (
                          activeJob.map((job) => renderRow(job))
                        )}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
    </div>
  );
};

export default VehicleTable;
