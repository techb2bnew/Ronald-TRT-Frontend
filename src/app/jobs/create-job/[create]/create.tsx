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

// interface UploadedImage {
//   id: number;
//   file: File;
//   previewUrl: string;
// }
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
  // const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  // const [imageCounter, setImageCounter] = useState(0); // To generate unique IDs

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

  // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (e.target.files) {
  //     const newFiles = Array.from(e.target.files).map((file) => ({
  //       id: imageCounter + Math.random(), // Unique ID for each image
  //       file,
  //       previewUrl: URL.createObjectURL(file),
  //     }));

  //     setUploadedImages((prev) => [...prev, ...newFiles]);
  //     setImageCounter((prev) => prev + newFiles.length);
  //   }
  // };
  // // Remove a specific image
  // const handleRemoveImage = (id: number) => {
  //   setUploadedImages((prev) => prev.filter((img) => img.id !== id));
  // };

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
          <div className="flex justify-between mb-4">
            <h2 className="text-lg leading-6 font-bold text-gray-900">Create New Job</h2>
            {/* <button className='bg-black p-2 text-sm text-white rounded'>Add Another Vehicle +</button> */}
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
                      <th className='text-xs text-left'>Vehicle Descriptor</th>
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
         
          <div className="grid grid-cols-3 gap-4">
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
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {/* Client Name and Business Name */}
            <div className='mb-2'>
              <p className='text-sm mb-2'>Job Description</p>
              <textarea name="jobDescription" id="" value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder='Enter Description' className="input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400"></textarea>
            </div>
          </div>
         

          <div className='mb-2'>
              <p className='text-sm mb-2'>Tax Forms <span className='text-red-500'>*</span></p>

              <div className="form-control w-full p-3 mt-1 rounded relative" style={{border:'2px dashed #ccc'}}>
                <label className="label text-center"> 
                <svg className='m-auto' width="34" height="34" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21.953 15.7599C22.3011 15.7599 22.5895 15.8644 22.9124 16.1544L29.2453 22.2609C29.5218 22.5367 29.6876 22.8314 29.6876 23.2368C29.6876 23.9911 29.1353 24.5254 28.3621 24.5254C27.9928 24.5254 27.607 24.3784 27.3485 24.0838L24.5506 21.1201L23.2982 19.8127L23.427 22.5564V36.7479C23.427 37.5219 22.7458 38.1662 21.9538 38.1662C21.1626 38.1662 20.4995 37.5219 20.4995 36.7479V22.5556L20.6095 19.8119L19.3578 21.1193L16.5764 24.0838C16.4507 24.2228 16.2974 24.3339 16.1262 24.4101C15.955 24.4863 15.7698 24.5258 15.5825 24.5262C14.8093 24.5262 14.2389 23.9919 14.2389 23.2368C14.2389 22.8314 14.3858 22.5375 14.6616 22.2609L20.886 16.2581C21.2545 15.8888 21.5853 15.7599 21.9546 15.7599M25.6765 2.96301C32.3606 2.96301 37.7789 8.3813 37.7789 15.0646C37.7789 15.4449 37.7608 15.8212 37.727 16.1921C41.108 16.9888 43.6246 20.0264 43.6246 23.6501C43.6246 27.8819 40.1942 31.3124 35.9623 31.3124H27.123V28.3659H35.9608C36.58 28.3659 37.1933 28.244 37.7654 28.007C38.3376 27.77 38.8575 27.4226 39.2954 26.9847C39.7333 26.5468 40.0806 26.0269 40.3176 25.4548C40.5546 24.8826 40.6766 24.2694 40.6766 23.6501C40.6764 22.5885 40.3182 21.5579 39.66 20.725C39.0017 19.8921 38.0818 19.3055 37.049 19.0599L34.5551 18.4722L34.7908 15.921C34.8175 15.6382 34.8301 15.3522 34.8301 15.0646C34.8301 10.0085 30.7318 5.90944 25.675 5.90944C24.148 5.90809 22.645 6.2892 21.3031 7.01798C19.9612 7.74676 18.8233 8.8 17.993 10.0816L16.7948 11.9233L14.6883 11.301C14.1166 11.1316 13.5137 11.0948 12.9255 11.1933C12.3374 11.2918 11.7794 11.5231 11.2941 11.8695C10.8087 12.216 10.4087 12.6685 10.1244 13.1927C9.84011 13.717 9.67906 14.2991 9.65347 14.8949L9.65033 15.1251L9.7234 17.6001L7.36861 18.143C6.22908 18.4081 5.21281 19.051 4.48522 19.9672C3.75763 20.8834 3.36156 22.0189 3.36147 23.1889C3.36147 24.5621 3.90699 25.8791 4.87803 26.8502C5.84906 27.8212 7.16607 28.3667 8.53933 28.3667H16.9088V31.3132H8.53933C4.0529 31.3132 0.415039 27.6753 0.415039 23.1889C0.415039 19.3326 3.10218 16.1033 6.70625 15.272L6.70311 15.0646C6.70282 13.9956 6.95199 12.9413 7.4308 11.9855C7.90961 11.0297 8.60484 10.1989 9.46119 9.55904C10.3176 8.91919 11.3114 8.48801 12.3637 8.29978C13.416 8.11156 14.4977 8.17148 15.5228 8.4748C17.6811 5.15673 21.4219 2.96301 25.675 2.96301" fill="#EF502E"/>
                </svg> 
                  <p className='text-sm mb-1 mt-1'>Upload File</p>
                  <span className="text-center m-auto text-xs block"> (Only 'jpeg, webp, and png' images will be accepted)</span>
                </label>
                <input type="file" multiple className="input input-bordered w-full opacity-0 absolute inset-0"     />
                {/* onChange={handleFileChange} */}
              </div>
               {/* Thumbnails of selected images */}
        {/* <div className="mt-4 grid grid-cols-3 gap-4">
          {uploadedImages.map((image) => (
            <div key={image.id} className="relative">
              <img
                src={image.previewUrl}
                alt="Preview"
                className="w-24 h-24 object-cover rounded-md"
              />
              <button
                type="button"
                className="absolute top-1 right-1 bg-white rounded-full p-1 shadow"
                onClick={() => handleRemoveImage(image.id)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-red-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div> */}
            </div>
            <div className="grid grid-cols-1 gap-4">
            {/* Client Name and Business Name */}
            <div className='mb-2'>
              <p className='text-sm mb-2'>Note</p>
              <textarea name="note" id=""  
                placeholder='Enter Note'  className="input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400"></textarea>
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
