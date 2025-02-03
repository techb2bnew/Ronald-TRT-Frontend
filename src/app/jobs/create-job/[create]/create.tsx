"use client";
import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useRouter } from 'next/navigation';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Loader from '@/app/component/loader';

interface JobPayload {
  vin: string;
  make: string;
  model: string;
  modelYear: string;
  manufactureName: string;
  vehicleDescription: string;
  vehicleType: string;
  jobDescription: string;
  color: string;
  assignTechnician: string;
  assignCustomer: string;
  createdBy: string;
  plantCountry: string;
  plantCompanyName: string;
  plantState: string;
  bodyClass: string;
  schedule: string;
  ip: string;
  jobId?: string;  // Optional property for jobId
}

export default function Technicians() {
  const [vin, setVin] = useState('');
  const [vehicleData, setVehicleData] = useState<any>(null);
  const [color, setColor] = useState("");
  const [assignTechnician, setAssignTechnician] = useState("");
  const [assignCustomer, setAssignCustomer] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [ip, setIpAddress] = useState('');
  const [createdBy, setRole] = useState('admin'); 
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [customer, setCustomer] = useState<any[]>([]);
  const router = useRouter();
  const [isEdit, setIsEdit] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null); 
  const [submitting, setSubmitting] = useState<boolean>(false);  // ✅ Track form submission state


     const fetchJobData = async (jobid: string) => {
       
       const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
       try {
          const token = localStorage.getItem('token');
    
          // Create headers object
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };
    
          // If token exists, add it to Authorization header
          if (token) {
            headers['Authorization'] = `Token ${token}`;
          }
    
          // Make GET request with technicianId as query parameter
          const response = await fetch(`${apiUrl}/fetchSingleJobs?jobid=${jobid}`, {
            method: 'POST',
            headers,
          });
    
          const data = await response.json();
    
          if (response.ok && data.jobs) {
            // Assuming you have state setters like setVin, setVehicleData, etc.
            setVin(data.jobs.vin);
            setJobDescription(data.jobs.jobDescription);
            setColor(data.jobs.color);
            setAssignTechnician(data.jobs.assignTechnician.toString()); // Assuming it needs to be a string
            setAssignCustomer(data.jobs.assignCustomer.toString());
            // You might want to set additional fields based on your form needs
           
          }else {
            toast.error(data.error || 'Error fetching technician data');
          }
        } catch (error) {
          toast.error('An error occurred while fetching technician data');
        }
      };
      useEffect(() => {
        if (vin) {  // Ensure that vin is not empty or undefined
          fetchVehicleDetails();
        }
      }, [vin]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const jobId = searchParams.get('jobId') || '';
    console.log(jobId, 'jobIdjobId')
    if (jobId) {
      setJobId(jobId);
      setIsEdit(true);  // Set to true if `customerId` exists in the URL
      fetchJobData(jobId);
    } else {
      setIsEdit(false); // Set to false if `customerId` is missing
    } 
  }, []);
  // Fetch Customers api
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

    const fetchCustomer = async () => {
      try {
        // Retrieve token from localStorage
        const token = localStorage.getItem('token');

        // Create headers object
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        // If the token exists, add the Authorization header
        if (token) {
          headers['Authorization'] = `Token ${token}`;
        }

        const response = await fetch(`${apiUrl}/fetchCustomer`, {
          method: 'GET', // Assuming you're using a GET request to fetch technicians
          headers, // Pass the headers object
        });

        const data = await response.json();

        // Assuming the response has an array called "technician"
        setCustomer(data.customers.customers);
      } catch (error) {
        console.error('Error fetching technician data:', error);
      }
    };

    fetchCustomer();
  }, []);


  // Fetch technicians API

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

    const fetchTechnicians = async () => {
      try {
        // Retrieve token from localStorage
        const token = localStorage.getItem('token');

        // Create headers object
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        // If the token exists, add the Authorization header
        if (token) {
          headers['Authorization'] = `Token ${token}`;
        }

        const response = await fetch(`${apiUrl}/fetchTechnician`, {
          method: 'GET', // Assuming you're using a GET request to fetch technicians
          headers, // Pass the headers object
        });

        const data = await response.json();

        // Assuming the response has an array called "technician"
        setTechnicians(data.technician.technicians);
      } catch (error) {
        console.error('Error fetching technician data:', error);
      }
    };

    fetchTechnicians();
  }, []);



  useEffect(() => {
    const fetchIpAddress = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        setIpAddress(data.ip);
      } catch (error) {
        console.error('Error fetching IP address:', error);
      }
    };
    fetchIpAddress();
  }, []);

  const fetchVehicleDetails = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVIN/${vin}?format=json`);
      const data = await response.json();
      if (response.ok && data.Results && Array.isArray(data.Results)) {
        const relevantData = data.Results.filter((item: any) =>
          ['Vehicle Descriptor', 'Make', 'Manufacturer Name', 'Model', 'Model Year', 'Vehicle Type'].includes(item.Variable) &&
          item.Value != null && item.Value !== 'N/A'
        );
        setVehicleData(relevantData);
      } else {
        console.error('Invalid data structure:', data);
        toast.error('Failed to fetch vehicle details due to unexpected data format.');
      }
    } catch (error) {
      console.error('Error fetching vehicle details:', error);
      toast.error('An error occurred while fetching vehicle details');
    } finally {
      setSubmitting(false);
    }
  };
  
  const renderValue = (value: any) => {
    if (value === null || value === '' || value === 'N/A') {
      return 'N/A';
    }
    return value;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    const token = localStorage.getItem('token');
    const payload: JobPayload = {
      vin,
      make: renderValue(vehicleData?.find((item: any) => item.Variable === "Make")?.Value) || "",
      model: renderValue(vehicleData?.find((item: any) => item.Variable === "Model")?.Value) || "",
      modelYear: renderValue(vehicleData?.find((item: any) => item.Variable === "Model Year")?.Value) || "",
      manufactureName: renderValue(vehicleData?.find((item: any) => item.Variable === "Manufacturer Name")?.Value) || "",
      vehicleDescription: renderValue(vehicleData?.find((item: any) => item.Variable === "Vehicle Descriptor")?.Value) || "",
      vehicleType: renderValue(vehicleData?.find((item: any) => item.Variable === "Vehicle Type")?.Value) || "",
      jobDescription,
      color,
      assignTechnician,
      assignCustomer,
      createdBy,
      plantCountry: '',
      plantCompanyName: '',
      plantState: '',
      bodyClass: '',
      schedule: '',
      ip
    };
    console.log('Is Edit:', isEdit, 'Job ID:', jobId);
    if (isEdit && jobId) {
      payload.jobId = jobId;  // Add jobId to the payload if editing
      console.log('Adding Job ID to payload:', payload);
    }
    try {
      setSubmitting(true);  
      const endpoint = isEdit ? `${apiUrl}/updateJob` : `${apiUrl}/technicianCreateJob`;
      const method = isEdit ? "POST" : "POST";
      const response = await fetch(endpoint, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
        // alert("Job created successfully!");
        // Reset form if needed
        setVin("");
        setVehicleData(null);
        setColor("");
        setAssignTechnician("");
        setAssignCustomer('');
        setJobDescription("");
        router.push('/jobs/active-job');
      } else {
        alert("Error creating job.");
      }
    } catch (error: any) {
      toast.success(error);

      // alert("Error creating job.");
    } finally {
      setSubmitting(false);  // ✅ Hide loader when done
    }
  };

  return (
    <div className='main-container mb-5'>
      <ToastContainer position="top-center" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <h1 className="text-lg leading-6 font-bold text-gray-900">Create New Job</h1>
      <p className='text-sm'>Onboard clients effortlessly for seamless collaboration!</p>
      <div className='bg-white p-4 mt-5 w-[60%] m-auto'>
        {submitting ? (
                          <div className="flex justify-center items-center h-64">
                            <Loader />  {/* ✅ Show loader during submission */}
                          </div>
                        ) : (
        <form className="" onSubmit={handleSubmit}>
          <div className="flex justify-between">
            <h2 className="text-lg leading-6 font-bold text-gray-900">Create New Job</h2>
            <button className='bg-black p-2 text-sm text-white rounded'>Add Another Vehicle +</button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {/* Client Name and Business Name */}
            <div className='mb-2'>
              <p className='text-sm mb-2'>ViN <span className='text-[red]'>*</span> </p>
              <div className='flex gap-3 items-center'>
         <TextField fullWidth size="medium" name="vin" id="outlined-basic" color="warning" label="Enter vin number"  variant="outlined"  value={vin}  onChange={(e) => setVin(e.target.value)} />
                
                {/* <input
                  type="text"
                  placeholder="5YJSA3DS*EF"
                  value={vin}
                  onChange={(e) => setVin(e.target.value)}
                  className="input text-xs mt-1 input-bordered w-[40%] p-3 rounded border border-gray-400"
                /> */}
                <button type="button" onClick={fetchVehicleDetails} className="primary-bg pl-5 pr-5 text-sm pt-[18px] pb-[18px] w-[300px] rounded">Add new vehicle</button>
              </div>
            </div>
          </div>
          <div>
            {vehicleData && (
              <div className="overflow-x-auto rounded-md mt-4 mb-5">
                <table className="table w-full ">
                  {/* Table header */}
                  <thead>
                    <tr>
                      <th className='text-xs text-left'>Vehicle Description</th>
                      <th className='text-xs text-left'>Make</th>
                      <th className='text-xs text-left'>Manufacture Name</th>
                      <th className='text-xs text-left'>Model</th>
                      <th className='text-xs text-left'>Model Year</th>
                      <th className='text-xs text-left'>Vehicle Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="text-xs">
                        {renderValue(vehicleData.find((item: any) => item.Variable === 'Vehicle Descriptor')?.Value)}
                      </td>
                      <td className="text-xs">
                        {renderValue(vehicleData.find((item: any) => item.Variable === 'Make')?.Value)}
                      </td>
                      <td className="text-xs">
                        {renderValue(vehicleData.find((item: any) => item.Variable === 'Manufacturer Name')?.Value)}
                      </td>
                      <td className="text-xs">
                        {renderValue(vehicleData.find((item: any) => item.Variable === 'Model')?.Value)}
                      </td>
                      <td className="text-xs">
                        {renderValue(vehicleData.find((item: any) => item.Variable === 'Model Year')?.Value)}
                      </td>
                      <td className="text-xs">
                        {renderValue(vehicleData.find((item: any) => item.Variable === 'Vehicle Type')?.Value)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Client Name and Business Name */}
            <div className='mb-2'>
              <p className='text-sm mb-2'>Color <span className='text-[red]'>*</span></p>
              <FormControl fullWidth>
              <InputLabel id="color">Select color</InputLabel>
              <Select 
              labelId="color"
              id="select-color"
              value={color}
              label="color"
              name="color"
              onChange={(e) => setColor(e.target.value)}
              >  
              <MenuItem value='red'>Red</MenuItem>
              <MenuItem value='black'>Black</MenuItem>
              <MenuItem value='white'>White</MenuItem>
              <MenuItem value='orange'>Orange</MenuItem>
              <MenuItem value='silver'>Silver</MenuItem>
              <MenuItem value='gray'>Gray</MenuItem>
              <MenuItem value='brown'>Brown</MenuItem>
               
              </Select>
              </FormControl>

              {/* <select name="color" id="" value={color}
                onChange={(e) => setColor(e.target.value)}
                className='input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400'>
                <option value="">Select color</option>
                <option value="red">Red</option>
                <option value="black">Black</option>
                <option value="white">White</option>
                <option value="orange">Orange</option>
                <option value="silver">Silver</option>
                <option value="gray">Gray</option>
                <option value="brown">Brown</option>
              </select> */}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Client Name and Business Name */}
            <div className='mb-2'>
              <p className='text-sm mb-2'>Job Descriptor</p>
              <textarea name="jobDescription" id="" value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder='Enter Description' className="input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400"></textarea>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Client Name and Business Name */}
            <div className='mb-2'>
              <p className='text-sm mb-2'>Assign Customer <span className='text-[red]'>*</span></p>
              <FormControl fullWidth>
              <InputLabel id="assignCustomer">Select customer</InputLabel>
              <Select
              labelId="assignCustomer"
              id="select-assignCustomer"
              value={assignCustomer}
              label="assignCustomer"
              name="assignCustomer"
              onChange={(e) => setAssignCustomer(e.target.value)}
              > 
              {customer.map((customer: any) => (
              <MenuItem  key={customer.id} value={customer.id}>{customer.firstName} {customer.lastName}</MenuItem>
                ))} 
              </Select>
              </FormControl>

              {/* <select
                name="assignTechnician"
                id=""
                value={assignCustomer}
                onChange={(e) => setAssignCustomer(e.target.value)}
                className="input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400"
              >
                <option value="">Select client</option>
                {customer.map((customer: any) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.firstName} {customer.lastName}
                  </option>
                ))}
              </select> */}

            </div>
            <div className='mb-2'>
              <p className='text-sm mb-2'>Assign Technician <span className='text-[red]'>*</span></p>
              <FormControl fullWidth>
              <InputLabel id="assignTechnician">Select technician</InputLabel>
              <Select
              labelId="assignTechnician"
              id="select-assignTechnician"
              value={assignTechnician}
              label="assignTechnician"
              name="assignTechnician"
              onChange={(e) => setAssignTechnician(e.target.value)}
              > 
             {technicians.map((technician: any) => (
              <MenuItem  key={technician.id} value={technician.id}>{technician.firstName} {technician.lastName}</MenuItem>
                ))} 
              </Select>
              </FormControl>

              {/* <select
                name="assignTechnician"
                id=""
                value={assignTechnician}
                onChange={(e) => setAssignTechnician(e.target.value)}
                className="input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400"
              >
                <option value="">Select technician</option>
                {technicians.map((technician: any) => (
                  <option key={technician.id} value={technician.id}>
                    {technician.firstName} {technician.lastName}
                  </option>
                ))}
              </select> */}
            </div>
          </div>
          <div className="text-right mt-4 mb-4">
            <button type="submit" className="primary-bg pl-5 pr-5 text-sm p-2 rounded">Submit</button>
          </div>
        </form>
         )}

      </div>
    </div>
  );
}
