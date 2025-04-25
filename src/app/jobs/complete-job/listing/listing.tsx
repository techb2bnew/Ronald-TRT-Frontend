// components/JobTable.tsx
"use client";
import React, { useState, useEffect, useRef } from 'react';
import TableActions from '../../../component/action';
import CommonHeader from '../../../component/commonHeader';
import { useRouter } from "next/navigation";
import { toast } from 'react-toastify';
import Pagination from '../../../component/pagination';
import axios from 'axios';
import Swal from 'sweetalert2';
import Empty from '@/app/component/empty';
import Loader from '@/app/component/loader';
import { ExportToCsv } from 'export-to-csv-file';
import Breadcrumb from '@/app/component/breadcrumb';
import { useSidebar } from "@/app/component/SidebarContext";


const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';  // ✅ Get the base URL here
interface Jobs {
  id: string;
  name: string;
  email: string;
  deletedStatus?: boolean;
}
const CompletedJobs: React.FC = () => {
  const [activeJob, setActiveJob] = useState<any[]>([]);
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

  const handleDeleteSuccess = (deletedId: string) => {
    toast.success('Technician deleted successfully');

    // ✅ Remove the deleted technician from the table
    setActiveJob((prev) => prev.filter((cust) => cust.id !== deletedId));
  };


  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
  const fetchCompleteJobs = async (page = 1, query = '', limit = pageSize) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const roleType = localStorage.getItem('types') || "";
      const userId = localStorage.getItem('userID');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

      if (token) headers['Authorization'] = `Bearer ${token}`;

      const endpoint = query.trim()
        ? roleType === 'superadmin'
          ? `${apiUrl}/searchTechnicianCompleteJob?searchQuery=${encodeURIComponent(query)}&roleType=${encodeURIComponent(roleType)}`
          : `${apiUrl}/searchTechnicianCompleteJob?userId=${userId}&searchQuery=${encodeURIComponent(query)}&roleType=${encodeURIComponent(roleType)}`
        : roleType === 'superadmin'
          ? `${apiUrl}/fetchCompleteJobStatus?page=${page}&roleType=${encodeURIComponent(roleType)}&limit=${limit}`
          : `${apiUrl}/fetchCompleteJobStatus?userId=${userId}&page=${page}&roleType=${encodeURIComponent(roleType)}&limit=${limit}`;


      const response = await fetch(endpoint, { method: 'GET', headers });
      const data = await response.json();
      if (response.ok) {


        const fetchedTechnicians: Jobs[] = query.trim()
          ? data.ActiveJob || []  // For search API response
          : data.jobs.jobs || [];  // For pagination API response 
        // const filteredJobs = fetchedTechnicians.filter(completeJob => !completeJob.deletedStatus);
        setTotalPages(data?.jobs?.totalPages);
        setActiveJob(fetchedTechnicians);
        // setTotalPages(data.jobs.totalPages); // Set the total pages from API response
        // setCurrentPage(data.jobs.currentPage); // Update current page from API
      } else {
        if (data.error && data.error === 'Invalid Token') {
          router.push('/');
        } else {
          console.error('Error fetching technician data:', data.error);
        }
      }
    } catch (error) {
      console.error('Error fetching technician data:', error);
    } finally {
      setLoading(false);  // Hide loader after fetching
    }
  };



  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCompleteJobs(currentPage, searchTerm, pageSize);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [currentPage, searchTerm, pageSize]);

  // Function to handle sorting logic
  const handleSort = (column: string) => {
    const direction = sortDirection === "asc" ? "desc" : "asc";
    setSortDirection(direction);
    setSortBy(column);

    const sortedJobs = [...activeJob].sort((a, b) => {
      if (column === "customerName") {
        const nameA = `${a?.customer?.firstName} ${a?.customer?.lastName}`;
        const nameB = `${b?.customer?.firstName} ${b?.customer?.lastName}`;
        return direction === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }

      if (column === "technicianName") {
        const nameA = a?.technicians
          ?.map((tech: any) => `${tech.firstName} ${tech.lastName}`)
          .join(", ");
        const nameB = b?.technicians
          ?.map((tech: any) => `${tech.firstName} ${tech.lastName}`)
          .join(", ");
        return direction === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }

      if (a[column] < b[column]) return direction === "asc" ? -1 : 1;
      if (a[column] > b[column]) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setActiveJob(sortedJobs);
  };



  const handlePageChange = (data: { selected: number }) => {
    console.log(`Going to page number ${data.selected + 1}`);  // react-paginate uses zero-based index
    setCurrentPage(data.selected + 1);
  };


  const downloadCSV = () => {
    const csvOptions = {
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalSeparator: '.',
      showLabels: true,
      showTitle: true,
      title: 'Completed Work Order Data',
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
        .map((tech: any) => `${tech.firstName} ${tech.lastName}`)
        .join(', '), // Multiple technicians in one column
    }));

    csvExporter.generateCsv(formattedData);
  };

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

  const renderRow = (completejob: any) => {

    const totalCost = completejob.jobDescription.reduce((sum: number, job: any) => {
      const parsedJob = JSON.parse(job);
      return sum + Number(parsedJob.cost); // Ensure cost is treated as a number
    }, 0);




    return (
      <React.Fragment key={completejob.id}>
        <tr key={completejob.id}>
          <td>{completejob.id}</td>
          {/* <td>{completejob.jobDescription}</td> */}
          <td>{completejob?.customer?.firstName} {completejob?.customer?.lastName}</td>
          <td>  {completejob?.technicians?.map((tech: any, index: number) => (
            <div key={`${tech.id}-${index}`}>
              {tech.firstName} {tech.lastName}
            </div>
          ))}</td>
          {/* <td>{completejob?.technician?.firstName} {completejob?.technician?.lastName}</td>  */}
          <td> ${totalCost}</td>
          <td>{completejob.vin}</td>
          <td>{completejob.make}</td>
          <td>{new Date(completejob.createdAt).toLocaleDateString('en-GB')}</td>
          <td>{new Date(completejob.updatedAt).toLocaleDateString('en-GB')}</td>
          <td>
            <span
              className={`badge ${completejob.jobStatus
                ? 'badge-success bg-[#E6F9DD] text-[#1A932E] p-2 pl-4 pr-4 rounded shadow'
                : 'badge-error bg-[#FFE4E1] text-[#FF0000] p-2 pl-4 pr-4 rounded shadow'
                }`}
            >
              {completejob.jobStatus ? 'Approved' : 'Inprogress'}
            </span>
          </td>
          <td>
            <TableActions
              editRoute={`/jobs/create-job/create?jobId=${completejob.id}&completeOrder`}
              deleteRoute={`${apiUrl}/deleteJobs`}  // Pass the correct endpoint 
              viewRoute={`/jobs/view?jobId=${completejob.id}&completedJob`}
              idKey="jobid"
              userRole='Completedjobs'
              itemId={completejob.id}  // Pass the technician ID
              onDeleteSuccess={() => handleDeleteSuccess(completejob.id)}
            />
          </td>
        </tr>
      </React.Fragment>
    );
  };

  return (
    <div className={` mx-auto mt-4 transition-all duration-300 ${isCollapsed ? 'w-full pl-[5rem]' : 'container'}`}>
      <Breadcrumb
        items={[
          { label: 'Completed Work Orders', href: '/jobs/complete-job/listing' }
        ]}
      />
      <CommonHeader heading="Completed Work Orders" onPageSizeChange={handlePageSizeChange} onSearch={(term) => setSearchTerm(term)} onExport={downloadCSV} userRole='' buttonLabel=" " buttonLink="" />

      <div className="overflow-auto rounded-md">
        <table className="table w-full table-fixed">
          <thead>
            <tr>
              <th className="w-[50px]" onClick={() => handleSort('id')}>
                ID
                {sortBy === 'id' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white-500' : 'text-white-500'}`}>
                    {sortDirection === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </th>
              {/* <th className="w-[150px]" onClick={() => handleSort('jobDescription')}>
                Job Description
                {sortBy === 'jobDescription' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-green-500' : 'text-red-500'}`}>
                   {sortDirection === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </th> */}
              <th className="w-[160px]" onClick={() => handleSort('customerName')}>
                Customer Name
                {sortBy === 'customerName' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white-500' : 'text-white-500'}`}>
                    {sortDirection === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </th>
              <th className="w-[160px]" onClick={() => handleSort('technicianName')}>
                Technician Name
                {sortBy === 'technicianName' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white-500' : 'text-white-500'}`}>
                    {sortDirection === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </th>

              <th className="w-[100px]">Total Cost</th>
              <th className="w-[160px]">VIN</th>
              <th className="w-[100px]">Vehicle Make</th>
              <th className="w-[100px]">Start Date</th>
              <th className="w-[120px]">Completion Date</th>
              <th className="w-[120px]">Order Status</th>
              <th className="w-[120px]">Action</th>
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
              activeJob.map((completejob) => renderRow(completejob))
            )}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
    </div>
  );
};

export default CompletedJobs;
