"use client";
import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useRouter } from 'next/navigation';
// import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
// import FormControl from '@mui/material/FormControl';
// import Select, { SelectChangeEvent } from '@mui/material/Select';
import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, Checkbox, ListItemText, OutlinedInput, InputAdornment } from '@mui/material';
// import MenuItem from '@mui/material/MenuItem';
import Loader from '@/app/component/loader';
import Swal from 'sweetalert2';
import Delete from '../../../../../public/delete.svg'
import Image from 'next/image';
import Link from 'next/link';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import { BrowserMultiFormatReader } from '@zxing/browser';

interface JobDescriptionItem {
  jobDescription: string;
  cost: string;
}
interface JobPayload {
  id?: string;
  vin: string;
  make: string;
  model: string;
  modelYear: string;
  manufacturerName: string;
  vehicleDescriptor: string;
  vehicleType: string;
  jobDescription: JobDescriptionItem[];
  color: string;
  assignTechnicians: string[];
  notes: string;
  assignCustomer: string;
  createdBy: string;
  plantCountry: string;
  plantCompanyName: string;
  plantState: string;
  bodyClass: string;
  schedule: string;
  ip: string;
  jobId?: string;
  images: File[];
  role: string;
  enterprise: string;
  workshop: string;
}
type VehicleDetailsMap = {
  [key: string]: keyof JobPayload | undefined;
};

interface DescriptionCostField {
  id: string;
  jobDescription: string;
  cost: string;
}
interface VehicleData {
  [key: string]: any; // Allows dynamic properties
}
// Define the actual map based on your fields
const vehicleDetailsMap: { [key: string]: keyof JobPayload | undefined } = {
  vehicledescriptor: 'vehicleDescriptor',
  make: 'make',
  manufacturername: 'manufacturerName',
  model: 'model',
  modelyear: 'modelYear',
  vehicletype: 'vehicleType',
  plantcountry: 'plantCountry',
  plantcompanyname: 'plantCompanyName',
  plantstate: 'plantState',
  bodyclass: 'bodyClass'
};

interface Technicians {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export default function Technicians() {
  const [vin, setVin] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [vehicleData, setVehicleData] = useState<VehicleData>({});
  const [color, setColor] = useState("");
  const [assignTechnicians, setAssignTechnicians] = useState<string[]>([]);
  const [assignCustomer, setAssignCustomer] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [notes, setNotesDescription] = useState("");
  const [ip, setIpAddress] = useState('');
  const [createdBy, setRole] = useState('admin');
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [customer, setCustomer] = useState<any[]>([]);
  const router = useRouter();
  const [isEdit, setIsEdit] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);  // ✅ Track form submission state
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [userType, setUserType] = useState<string | null>(null);
  const [descriptionCostFields, setDescriptionCostFields] = useState<DescriptionCostField[]>([
    { id: crypto.randomUUID(), jobDescription: '', cost: '' },
  ]);
  const [formData, setFormData] = useState<JobPayload>({
    vin: '',
    make: '',
    model: '',
    modelYear: '',
    manufacturerName: '',
    vehicleDescriptor: '',
    vehicleType: '',
    jobDescription: [],
    notes: '',
    color: '',
    assignTechnicians: [],
    assignCustomer: '',
    createdBy: 'admin',
    plantCountry: '',
    plantCompanyName: '',
    plantState: '',
    bodyClass: '',
    schedule: '',
    ip: '',
    jobId: '',
    images: [],
    role: '',
    enterprise: '',
    workshop: '',
  });

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
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Make GET request with technicianId as query parameter
      const response = await fetch(`${apiUrl}/fetchSingleJobs?jobid=${jobid}`, {
        method: 'POST',
        headers,
      });

      const data = await response.json();

      if (response.ok && data.jobs) {
        const jobData = data.jobs;
        // ✅ Ensure jobDescription is an array of objects
        const jobDescriptionsArray = Array.isArray(jobData.jobDescription)
          ? jobData.jobDescription.map((item: any) => ({
            id: crypto.randomUUID(), // Assign unique IDs
            jobDescription: item.jobDescription || '',
            cost: item.cost || '',
          }))
          : [{ id: crypto.randomUUID(), jobDescription: '', cost: '' }];

        // ✅ Update `descriptionCostFields` for UI display
        setDescriptionCostFields(jobDescriptionsArray);
        setFormData((prev) => ({
          ...prev,
          vin: jobData.vin || '',
          make: jobData.make || '',
          model: jobData.model || '',
          modelYear: jobData.modelYear || '',
          manufacturerName: jobData.manufacturerName || '',
          vehicleDescriptor: jobData.vehicleDescriptor || '',
          vehicleType: jobData.vehicleType || '',
          jobDescription: jobDescriptionsArray,
          notes: jobData.notes || '',
          color: jobData.color || '',
          // Assuming 'jobData.technicians' is an array of 'Technicians'
          assignTechnicians: jobData.technicians.map((tech: Technicians) => String(tech.id)),
          // Using Technician interface
          assignCustomer: jobData.assignCustomer || '',
          createdBy: jobData.createdBy || '',
          plantCountry: jobData.plantCountry || '',
          plantCompanyName: jobData.plantCompanyName || '',
          plantState: jobData.plantState || '',
          bodyClass: jobData.bodyClass || '',
          schedule: jobData.schedule || '',
          ip: jobData.ip || '',  // Assuming ip needs to be updated too
          jobId: jobData.id || '',  // jobId might be necessary for updates
          images: jobData.images || [],  // Assuming images are handled separately
        }));

      } else {
        toast.error(data.error || 'Error fetching technician data');
      }
    } catch (error) {
      toast.error('An error occurred while fetching technician data');
    }
  };

  React.useEffect(() => {
    const type = localStorage.getItem('types');
    setUserType(type);
  });

  // Fetch Customers api
  const fetchData = async (endpoint: string, setState: (data: any) => void, params: Record<string, string> = {}) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userID');
      const roleType = localStorage.getItem('types');

      if (endpoint === 'fetchCustomer' && !userId && !roleType) {
        console.error("User ID not found in localStorage!");
        return;
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Construct query params
      const queryParams = new URLSearchParams(params).toString();
      const url = `${apiUrl}/${endpoint}${queryParams ? `?${queryParams}` : ''}`;

      const response = await fetch(url, { method: 'GET', headers });

      if (response.status == 400) {
        localStorage.removeItem('token');
        router.push('/');
      }

      const data = await response.json();
      setState(endpoint === 'fetchTechnician' ? data.technician.technicians : data.customers.customers);
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
    }
  };

  useEffect(() => {
    const roleType = localStorage.getItem('types');
    const types = localStorage.getItem('types');

    if (types) {
      fetchData('fetchTechnician', setTechnicians, { types }); // Pass roleType to fetchTechnician
    } else {
      console.error("Role type is missing for fetching technicians!");
    }
    const userId = localStorage.getItem('userID');
    if (userId) {
      fetchData('fetchCustomer', setCustomer, { userId }); // ✅ Pass userId as query param
    }
  }, []);



  useEffect(() => {
    const fetchIpAddress = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        setIpAddress(data.ip);
        setFormData(prev => ({ ...prev, ip: data.ip }));
      } catch (error) {
        console.error('Error fetching IP address:', error);
      }
    };
    fetchIpAddress();
  }, []);

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




  // Assuming vehicleDetailsMap and JobPayload are aligned correctly

  const fetchVehicleDetails = async () => {
    if (!formData.vin) {
      toast.error("Please enter a VIN to fetch vehicle details.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVIN/${formData.vin}?format=json`);
      const data = await response.json();

      if (response.ok && data.Results) {
        let vehicleDetails: Record<string, any> = {};
        data.Results.forEach((item: any) => {
          const key = vehicleDetailsMap[item.Variable.toLowerCase().replace(/ /g, '')];
          if (key && item.Value && item.Value !== "N/A") {
            vehicleDetails[key] = item.Value;
          }
        });

        // Update formData with vehicle details
        setFormData(prev => ({
          ...prev,
          ...vehicleDetails,
          vin: formData.vin  // Retain manually entered VIN
        }));
      } else {
        toast.error("Failed to fetch vehicle details.");
      }
    } catch (error) {
      console.error("Error fetching vehicle details:", error);
      toast.error("An error occurred while fetching vehicle details.");
    } finally {
      setSubmitting(false);
    }
  };


  const handleDescriptionCostChange = (index: number, field: keyof JobDescriptionItem, value: string) => {
    setDescriptionCostFields((prevFields) =>
      prevFields.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );

    // ✅ Sync changes with formData
    setFormData((prev) => ({
      ...prev,
      jobDescription: descriptionCostFields.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };






  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    const token = localStorage.getItem('token');
    const formDataObj = new FormData();
    const roleType = localStorage.getItem('types');
    const userId = localStorage.getItem('userID');
    // Manually append necessary fields
    if (roleType !== null) {
      formDataObj.append('roleType', roleType);
    }
    formDataObj.append('vin', formData.vin);
    formDataObj.append('make', formData.make);
    formDataObj.append('model', formData.model);
    formDataObj.append('modelYear', formData.modelYear);
    formDataObj.append('manufacturerName', formData.manufacturerName);
    formDataObj.append('vehicleDescriptor', formData.vehicleDescriptor);
    formDataObj.append('vehicleType', formData.vehicleType);
    formDataObj.append('notes', formData.notes);
    formDataObj.append('color', formData.color);
    formDataObj.append('assignCustomer', formData.assignCustomer);
    formDataObj.append('createdBy', formData.createdBy);
    formDataObj.append('plantCountry', formData.plantCountry);
    formDataObj.append('plantCompanyName', formData.plantCompanyName);
    formDataObj.append('plantState', formData.plantState);
    formDataObj.append('bodyClass', formData.bodyClass);
    formDataObj.append('schedule', formData.schedule);
    formDataObj.append('ip', formData.ip);

    // Append all formData fields to formDataObj
    // Flatten the formData object and append each item

    //  Object.keys(formData).forEach(key => {
    //   if (Array.isArray(formData[key])) {
    //     formData[key].forEach(value => formDataObj.append(`${key}[]`, value));
    //   } else if (formData[key] instanceof File) {
    //     formDataObj.append('images', formData[key]);
    //   } else {
    //     formDataObj.append(key, formData[key]);
    //   }
    // });
    const jobDescriptionsArray = descriptionCostFields.map((item) => ({
      description: item.jobDescription,
      cost: item.cost,
    }));

    // ✅ Append `jobDescription` as an array
    jobDescriptionsArray.forEach((desc, index) => {
      formDataObj.append(`jobDescription[${index}][jobDescription]`, desc.description);
      formDataObj.append(`jobDescription[${index}][cost]`, desc.cost);
    });
    let assignTechnicians = [...(formData.assignTechnicians || [])];
    if (roleType === "single-technician" && userId || roleType === "ifs" && userId) {
      if (!assignTechnicians.includes(userId)) {
        assignTechnicians.push(userId); // Add the logged-in technician's ID
      }
    }
    assignTechnicians.forEach((techId) => {
      formDataObj.append('assignTechnicians[]', techId);
    });

    formData.images.forEach((file) => {
      formDataObj.append('images', file);
    });
    if (isEdit && jobId) {
      formDataObj.append('jobId', jobId); // Append the jobId if editing
    }
    try {
      setSubmitting(true);
      const endpoint = isEdit ? `${apiUrl}/updateJob` : `${apiUrl}/technicianCreateJob`;
      const method = isEdit ? "POST" : "POST"; // POST method, you can change to PUT for update if needed

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formDataObj, // Send the FormData object directly in the body
      });

      const result = await response.json();
      if (response.ok) {
        toast.success('Job created successfully.');
        router.push('/jobs/active-job');
      } else {
        if (result.error && result.error.includes("Duplicate VIN")) {
          setSubmitting(false);
          const result = await Swal.fire({
            title: 'Duplicate VIN found',
            text: 'Would you like to create new VIN details or re-enter?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef502e',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes',
            cancelButtonText: 'Re-enter'
          }).then((result) => {
            if (result.isConfirmed) {
              const vinDetailsEndpoint = `${apiUrl}/createVinDetails`;
              // Call the createVinDetails API
              fetch(vinDetailsEndpoint, {
                method: 'POST',
                headers: {
                  "Authorization": `Bearer ${token}`,
                },
                body: formDataObj
              })
                .then(response => response.json())
                .then(data => {
                  toast.success('VIN details created successfully.');
                  router.push('/jobs/active-job');
                })
                .catch(error => {
                  console.error('Error creating VIN details:', error);
                  toast.error('Failed to create VIN details.');
                });
            }
          });
        } else {
          toast.error(result.error || 'Failed to create job.');
        }
      }
    } catch (error) {
      console.error('Error creating job:', error);
      toast.error('An error occurred while creating the job.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (event: any, key: any, target = 'formData') => {
    const value = event.target.value;
    if (target === 'vehicleData') {
      setVehicleData((prev: VehicleData) => ({ ...prev, [key]: value }));
    } else {
      setFormData((prev) => ({ ...prev, [key]: value }));
    }
  };








  const handleSelectChange = (event: SelectChangeEvent<string>, field: string) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  const handleSelectColor = (event: SelectChangeEvent<string>, field: string) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Special handler for multiple select (technicians):
  const handleTechnicianChange = (event: SelectChangeEvent<string[]>) => {
    const {
      target: { value },
    } = event;

    // Ensure value is always an array of strings
    setFormData(prev => ({
      ...prev,
      assignTechnicians: typeof value === 'string' ? value.split(',') : value.map(String)
    }));
  };
  function compressImage(file: any, maxWidth: number, maxHeight: number, quality: number) {
    return new Promise((resolve, reject) => {
      const image = new window.Image();
      image.src = URL.createObjectURL(file);

      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error("Canvas 2D context is not supported."));
          return;
        }

        let width = image.width;
        let height = image.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(image, 0, 0, width, height);

        canvas.toBlob(blob => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Compression failed'));
          }
        }, 'image/jpeg', quality);
      };

      image.onerror = () => reject(new Error('Image loading error'));
    });
  }



  // To handle the image upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const maxWidth = 800; // Maximum image width
    const maxHeight = 600; // Maximum image height
    const quality = 0.7; // Compression quality

    const compressions = files.map(file => compressImage(file, maxWidth, maxHeight, quality));
    Promise.all(compressions)
      .then(compressedFiles => {
        setFormData((prev: any) => ({ ...prev, images: compressedFiles }));
      })
      .catch(error => {
        console.error('Compression error:', error);
        toast.error('Failed to compress images.');
      });
  };


  // Remove a specific image
  const handleRemoveFile = (index: any) => {
    const filteredImages = formData.images.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, images: filteredImages }));
  };


  const handleSelectRole = (event: SelectChangeEvent<string>) => {
    const role = event.target.value as string;
    setFormData({ ...formData, role, enterprise: '', workshop: '' });
  };

  const handleSelectEnterprise = (event: SelectChangeEvent<string>) => {
    const enterprise = event.target.value as string;
    setFormData({ ...formData, enterprise, workshop: '' });
  };

  const handleSelectWorkshop = (event: SelectChangeEvent<string>) => {
    const workshop = event.target.value as string;
    setFormData({ ...formData, workshop });
  };

  const handleAddMore = () => {
    setDescriptionCostFields([...descriptionCostFields, { id: crypto.randomUUID(), jobDescription: '', cost: '' }]);
  };

  // Delete the Correct Field by ID
  const handleDeleteField = (id: string) => {
    setDescriptionCostFields((prev) => prev.filter((item) => item.id !== id));
  };
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(URL.createObjectURL(file)); // ✅ Preview image
      extractVinFromBarcode(file); // ✅ Call barcode extraction
    }
  };

  // ✅ Extract VIN from Barcode/QR Code
  const extractVinFromBarcode = async (file: File) => {
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        if (reader.result) {
          const img = document.createElement('img'); // ✅ Create an HTML image
          img.src = reader.result.toString();

          img.onload = async () => {
            const codeReader = new BrowserMultiFormatReader();
            try {
              const result = await codeReader.decodeFromImageElement(img);

              if (result) {
                console.log('Barcode Detected:', result.getText()); // ✅ Use getText()
                setFormData((prev) => ({
                  ...prev,
                  vin: result.getText(), // ✅ Corrected
                }));
              } else {
                alert('VIN not found in the barcode. Try another image!');
              }
            } catch (error) {
              console.error('Error decoding barcode:', error);
              alert('Error decoding barcode/QR. Try again!');
            }
          };
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error reading barcode:', error);
    }
  };



  return (
    <div className='main-container mb-5'>
      <ToastContainer position="top-center" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <h1 className="text-lg leading-6 font-bold text-gray-900">Create New Work Order</h1>
      {/* <p className='text-sm'>Onboard clients effortlessly for seamless collaboration!</p> */}
      <div className='bg-white p-4 mt-5 w-[60%] m-auto'>
        {submitting ? (
          <div className="flex justify-center items-center h-64">
            <Loader />  {/* ✅ Show loader during submission */}
          </div>
        ) : (
          <form className="" onSubmit={handleSubmit}>
            <div className="grid grid-cols-3 gap-4 mb-4" style={{ display: 'none' }}>
              <FormControl fullWidth size="small">
                <InputLabel id="role-label" color="warning">Select role*</InputLabel>
                <Select
                  labelId="role-label"
                  id="select-role"
                  value={formData.role}
                  label="Select role"
                  name="role"
                  color="warning"
                  onChange={handleSelectRole}
                >
                  <MenuItem value="IFS">IFS</MenuItem>
                  <MenuItem value="Enterpriceses">Enterpriceses</MenuItem>
                  <MenuItem value="Workshop">Workshop</MenuItem>
                </Select>
              </FormControl>

              {formData.role === 'Enterpriceses' && (
                <FormControl fullWidth size="small">
                  <InputLabel id="enterprise-label" color="warning">Select Enterprise*</InputLabel>
                  <Select
                    labelId="enterprise-label"
                    id="select-enterprise"
                    value={formData.enterprise}
                    label="Select Enterprise"
                    name="enterprise"
                    color="warning"
                    onChange={handleSelectEnterprise}
                  >
                    <MenuItem value="Enterprise1">Enterprise 1</MenuItem>
                    <MenuItem value="Enterprise2">Enterprise 2</MenuItem>
                    <MenuItem value="Enterprise3">Enterprise 3</MenuItem>
                  </Select>
                </FormControl>
              )}

              {(formData.role === 'Workshop' || formData.enterprise) && (
                <FormControl fullWidth size="small">
                  <InputLabel id="workshop-label" color="warning">Select Workshop*</InputLabel>
                  <Select
                    labelId="workshop-label"
                    id="select-workshop"
                    value={formData.workshop}
                    label="Select Workshop"
                    name="workshop"
                    color="warning"
                    onChange={handleSelectWorkshop}
                  >
                    <MenuItem value="Workshop1">Workshop 1</MenuItem>
                    <MenuItem value="Workshop2">Workshop 2</MenuItem>
                    <MenuItem value="Workshop3">Workshop 3</MenuItem>
                  </Select>
                </FormControl>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4">
              {/* Client Name and Business Name */}
              <div className='mb-2'>
                {/* <p className='text-sm mb-2'>ViN <span className='text-[red]'>*</span> </p> */}
                <div className='flex gap-3 items-center'>
                 <div className="flex gap-3 items-center w-[70%]">
                  <TextField fullWidth size="small" name="vin" id="outlined-basic" color="warning" label="Enter vin number *" variant="outlined" value={formData.vin} onChange={(e) => handleChange(e, 'vin')} />
                  <button type="button" onClick={fetchVehicleDetails} className="primary-bg pl-5 pr-5 p-2 text-sm  w-[300px] rounded">Add New Vehicle</button>
                 </div>

                  <div className="relative">
                    <label data-tooltip-id="VIN"
                  data-tooltip-content="Upload VIN Image"
                      htmlFor="fileInput"
                      className="cursor-pointer flex  gap-2 p-2 bg-gray-100 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-200"
                    >
                      <div className='text-center'>
                       <svg className='m-auto' width="22" height="22" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21.953 15.7599C22.3011 15.7599 22.5895 15.8644 22.9124 16.1544L29.2453 22.2609C29.5218 22.5367 29.6876 22.8314 29.6876 23.2368C29.6876 23.9911 29.1353 24.5254 28.3621 24.5254C27.9928 24.5254 27.607 24.3784 27.3485 24.0838L24.5506 21.1201L23.2982 19.8127L23.427 22.5564V36.7479C23.427 37.5219 22.7458 38.1662 21.9538 38.1662C21.1626 38.1662 20.4995 37.5219 20.4995 36.7479V22.5556L20.6095 19.8119L19.3578 21.1193L16.5764 24.0838C16.4507 24.2228 16.2974 24.3339 16.1262 24.4101C15.955 24.4863 15.7698 24.5258 15.5825 24.5262C14.8093 24.5262 14.2389 23.9919 14.2389 23.2368C14.2389 22.8314 14.3858 22.5375 14.6616 22.2609L20.886 16.2581C21.2545 15.8888 21.5853 15.7599 21.9546 15.7599M25.6765 2.96301C32.3606 2.96301 37.7789 8.3813 37.7789 15.0646C37.7789 15.4449 37.7608 15.8212 37.727 16.1921C41.108 16.9888 43.6246 20.0264 43.6246 23.6501C43.6246 27.8819 40.1942 31.3124 35.9623 31.3124H27.123V28.3659H35.9608C36.58 28.3659 37.1933 28.244 37.7654 28.007C38.3376 27.77 38.8575 27.4226 39.2954 26.9847C39.7333 26.5468 40.0806 26.0269 40.3176 25.4548C40.5546 24.8826 40.6766 24.2694 40.6766 23.6501C40.6764 22.5885 40.3182 21.5579 39.66 20.725C39.0017 19.8921 38.0818 19.3055 37.049 19.0599L34.5551 18.4722L34.7908 15.921C34.8175 15.6382 34.8301 15.3522 34.8301 15.0646C34.8301 10.0085 30.7318 5.90944 25.675 5.90944C24.148 5.90809 22.645 6.2892 21.3031 7.01798C19.9612 7.74676 18.8233 8.8 17.993 10.0816L16.7948 11.9233L14.6883 11.301C14.1166 11.1316 13.5137 11.0948 12.9255 11.1933C12.3374 11.2918 11.7794 11.5231 11.2941 11.8695C10.8087 12.216 10.4087 12.6685 10.1244 13.1927C9.84011 13.717 9.67906 14.2991 9.65347 14.8949L9.65033 15.1251L9.7234 17.6001L7.36861 18.143C6.22908 18.4081 5.21281 19.051 4.48522 19.9672C3.75763 20.8834 3.36156 22.0189 3.36147 23.1889C3.36147 24.5621 3.90699 25.8791 4.87803 26.8502C5.84906 27.8212 7.16607 28.3667 8.53933 28.3667H16.9088V31.3132H8.53933C4.0529 31.3132 0.415039 27.6753 0.415039 23.1889C0.415039 19.3326 3.10218 16.1033 6.70625 15.272L6.70311 15.0646C6.70282 13.9956 6.95199 12.9413 7.4308 11.9855C7.90961 11.0297 8.60484 10.1989 9.46119 9.55904C10.3176 8.91919 11.3114 8.48801 12.3637 8.29978C13.416 8.11156 14.4977 8.17148 15.5228 8.4748C17.6811 5.15673 21.4219 2.96301 25.675 2.96301" fill="#EF502E" />
                      </svg> 
                      </div>
                    </label>
                    <input
                      id="fileInput"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Tooltip id="VIN" place="top" />
                  </div>

                  {/* Image Preview with Remove Button */}
                  {image && (
                    <div className="relative">
                      <img src={image} alt="VIN" width="200" className="border rounded-lg shadow" />
                      <button
                        type="button"
                        onClick={() => setImage(null)} // ✅ Remove Image
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div>
              {formData && (
                <div className="overflow-x-auto rounded-md pt-4 mb-5">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-xs mb-2">
                      <TextField
                        fullWidth
                        label="Vehicle Descriptor"
                        variant="outlined"
                        color="warning"
                        size="small"
                        value={formData.vehicleDescriptor || ''}
                        onChange={(e) => handleChange(e, 'vehicleDescriptor')}
                      />
                    </div>
                    <div className="text-xs mb-2">
                      <TextField
                        fullWidth
                        label="Make"
                        variant="outlined"
                        color="warning"
                        size="small"
                        value={formData.make || ''}
                        onChange={(e) => handleChange(e, 'make')}
                      />
                    </div>
                    <div className="text-xs  mb-2">
                      <TextField
                        fullWidth
                        label="Manufacturer Name"
                        variant="outlined"
                        color="warning"
                        size="small"
                        value={formData.manufacturerName || ''}
                        onChange={(e) => handleChange(e, 'manufacturerName')}
                      />
                    </div>
                    <div className="text-xs">
                      <TextField
                        fullWidth
                        label="Model"
                        variant="outlined"
                        color="warning"
                        size="small"
                        value={formData.model || ''}
                        onChange={(e) => handleChange(e, 'model')}
                      />
                    </div>
                    <div className="text-xs">
                      <TextField
                        fullWidth
                        label="Model Year"
                        type='number'
                        variant="outlined"
                        color="warning"
                        size="small"
                        value={formData.modelYear || ''}
                        onChange={(e) => handleChange(e, 'modelYear')}
                      />
                    </div>
                    <div className="text-xs">
                      <TextField
                        fullWidth
                        label="Vehicle Type"
                        variant="outlined"
                        color="warning"
                        size="small"
                        value={formData.vehicleType || ''}
                        onChange={(e) => handleChange(e, 'vehicleType')}
                      />
                    </div>
                  </div>
                </div>

              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className='mb-4'>
                {/* <p className='text-sm mb-2'>Color <span className='text-[red]'>*</span></p> */}

                <FormControl fullWidth size="small">
                  <InputLabel id="color" color="warning">Select color *</InputLabel>
                  <Select
                    labelId="color"
                    id="select-color"
                    value={formData.color}
                    label="Select color"
                    name="color"
                    color="warning"
                    required
                    onChange={(event) => handleSelectColor(event, 'color')}
                  >
                    <MenuItem value='black'>Black</MenuItem>
                    <MenuItem value='gray'>Gray</MenuItem>
                    <MenuItem value='blue'>Blue</MenuItem>
                    <MenuItem value='silver'>Silver</MenuItem>
                    <MenuItem value='red'>Red</MenuItem>
                    <MenuItem value='maroon'>Maroon</MenuItem>
                    <MenuItem value='yellow'>Yellow</MenuItem>
                    <MenuItem value='white'>White</MenuItem>
                    <MenuItem value='brown'>Brown</MenuItem>
                    <MenuItem value='tan'>Tan</MenuItem>
                    <MenuItem value='gold'>Gold</MenuItem>
                    <MenuItem value='green'>Green</MenuItem>
                    <MenuItem value='orange'>Orange</MenuItem>

                  </Select>
                </FormControl>
              </div>
              {/* Client Name and Business Name */}
              <div className='mb-4 flex gap-3'>
                {/* <p className='text-sm mb-2'>Assign Customer <span className='text-[red]'>*</span></p> */}
                <FormControl fullWidth size="small">
                  <InputLabel id="assignCustomer" color="warning">Select customer *</InputLabel>
                  <Select
                    labelId="assignCustomer"
                    id="select-assignCustomer"
                    color="warning"
                    value={formData.assignCustomer}
                    label="Select customer"
                    name="assignCustomer"
                    required
                    onChange={(event) => handleSelectChange(event, 'assignCustomer')}
                  >
                    {customer.map((customer: any) => (
                      <MenuItem key={customer.id} value={customer.id}>{customer.firstName} {customer.lastName}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Link href='/client/create' data-tooltip-id="create-customer"
                  data-tooltip-content="Create Customer" className='primary-bg text-sm p-1 rounded mb-4'>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg">
                    <line x1="12" y1="5" x2="12" y2="19" stroke="white" strokeWidth="2" />
                    <line x1="5" y1="12" x2="19" y2="12" stroke="white" strokeWidth="2" />
                  </svg>

                </Link>
                <Tooltip id="create-customer" place="top" />

              </div>
              {userType !== 'single-technician' && userType !== 'ifs' && (
                <div className='mb-4 flex gap-3'>
                  {/* <p className='text-sm mb-2'>Assign Technician <span className='text-[red]'>*</span></p> */}
                  <FormControl fullWidth size="small">
                    <InputLabel id="assignTechnicians" color="warning">Select technicians *</InputLabel>

                    <Select
                      labelId="assignTechnicians"
                      id="select-assignTechnicians"
                      color="warning"
                      label="Select technicians"
                      multiple
                      required
                      value={formData.assignTechnicians}
                      onChange={handleTechnicianChange}
                      renderValue={(selected) => selected.map(id => {
                        const tech = technicians.find(tech => String(tech.id) === id);
                        return tech ? `${tech.firstName} ${tech.lastName}` : undefined;
                      }).filter(Boolean).join(', ')}
                    >
                      {technicians.map((tech) => (
                        <MenuItem key={tech.id} value={String(tech.id)}>
                          <Checkbox checked={formData.assignTechnicians.includes(String(tech.id))} />
                          <ListItemText primary={`${tech.firstName} ${tech.lastName}`} />
                        </MenuItem>
                      ))}
                    </Select>

                  </FormControl>
                  <Link href='/technicians/create-technician' data-tooltip-id="create-technician"
                    data-tooltip-content="Create Technician" className='primary-bg text-sm p-1 rounded mb-4'>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg">
                      <line x1="12" y1="5" x2="12" y2="19" stroke="white" strokeWidth="2" />
                      <line x1="5" y1="12" x2="19" y2="12" stroke="white" strokeWidth="2" />
                    </svg>

                  </Link>
                  <Tooltip id="create-technician" place="top" />
                </div>
              )}
            </div>
            {descriptionCostFields.map((field, index) => (
              <div key={field.id} id={field.id} className="grid grid-cols-2 gap-4">
                <div className='mb-2'>
                  <textarea name="jobDescription" rows={1} id="" value={field.jobDescription}
                    onChange={(e) =>
                      handleDescriptionCostChange(index, "jobDescription", e.target.value)
                    }
                    placeholder='Enter Description *' className="input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400" required></textarea>
                </div>
                <div className="mb-2 flex items-center gap-3">
                  <FormControl fullWidth sx={{ m: 1 }} size="small" color="warning" >
                    <InputLabel htmlFor={`cost-${index}`}>Cost</InputLabel>
                    <OutlinedInput
                      id={`cost-${index}`}
                      value={field.cost}
                      onChange={(e) =>
                        handleDescriptionCostChange(index, "cost", e.target.value)
                      }
                      startAdornment={<InputAdornment position="start">$</InputAdornment>}
                      label="Amount"
                      required
                    />
                  </FormControl>
                  {descriptionCostFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteField(field.id)}
                      className="border border-red-500 text-sm p-2 rounded"
                    >
                      <Image alt='delete' src={Delete} className='w-[14px]' />
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddMore}
              className="primary-bg pl-5 pr-5 text-sm p-2 rounded mb-4">Add More + </button>


            <div className='mb-4'>
              {/* <p className='text-sm mb-2'>Tax Forms <span className='text-red-500'>*</span></p> */}

              <div className="form-control w-full p-3 mt-1 rounded relative" style={{ border: '2px dashed #ccc' }}>
                <label className="label text-center">
                  <svg className='m-auto' width="34" height="34" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21.953 15.7599C22.3011 15.7599 22.5895 15.8644 22.9124 16.1544L29.2453 22.2609C29.5218 22.5367 29.6876 22.8314 29.6876 23.2368C29.6876 23.9911 29.1353 24.5254 28.3621 24.5254C27.9928 24.5254 27.607 24.3784 27.3485 24.0838L24.5506 21.1201L23.2982 19.8127L23.427 22.5564V36.7479C23.427 37.5219 22.7458 38.1662 21.9538 38.1662C21.1626 38.1662 20.4995 37.5219 20.4995 36.7479V22.5556L20.6095 19.8119L19.3578 21.1193L16.5764 24.0838C16.4507 24.2228 16.2974 24.3339 16.1262 24.4101C15.955 24.4863 15.7698 24.5258 15.5825 24.5262C14.8093 24.5262 14.2389 23.9919 14.2389 23.2368C14.2389 22.8314 14.3858 22.5375 14.6616 22.2609L20.886 16.2581C21.2545 15.8888 21.5853 15.7599 21.9546 15.7599M25.6765 2.96301C32.3606 2.96301 37.7789 8.3813 37.7789 15.0646C37.7789 15.4449 37.7608 15.8212 37.727 16.1921C41.108 16.9888 43.6246 20.0264 43.6246 23.6501C43.6246 27.8819 40.1942 31.3124 35.9623 31.3124H27.123V28.3659H35.9608C36.58 28.3659 37.1933 28.244 37.7654 28.007C38.3376 27.77 38.8575 27.4226 39.2954 26.9847C39.7333 26.5468 40.0806 26.0269 40.3176 25.4548C40.5546 24.8826 40.6766 24.2694 40.6766 23.6501C40.6764 22.5885 40.3182 21.5579 39.66 20.725C39.0017 19.8921 38.0818 19.3055 37.049 19.0599L34.5551 18.4722L34.7908 15.921C34.8175 15.6382 34.8301 15.3522 34.8301 15.0646C34.8301 10.0085 30.7318 5.90944 25.675 5.90944C24.148 5.90809 22.645 6.2892 21.3031 7.01798C19.9612 7.74676 18.8233 8.8 17.993 10.0816L16.7948 11.9233L14.6883 11.301C14.1166 11.1316 13.5137 11.0948 12.9255 11.1933C12.3374 11.2918 11.7794 11.5231 11.2941 11.8695C10.8087 12.216 10.4087 12.6685 10.1244 13.1927C9.84011 13.717 9.67906 14.2991 9.65347 14.8949L9.65033 15.1251L9.7234 17.6001L7.36861 18.143C6.22908 18.4081 5.21281 19.051 4.48522 19.9672C3.75763 20.8834 3.36156 22.0189 3.36147 23.1889C3.36147 24.5621 3.90699 25.8791 4.87803 26.8502C5.84906 27.8212 7.16607 28.3667 8.53933 28.3667H16.9088V31.3132H8.53933C4.0529 31.3132 0.415039 27.6753 0.415039 23.1889C0.415039 19.3326 3.10218 16.1033 6.70625 15.272L6.70311 15.0646C6.70282 13.9956 6.95199 12.9413 7.4308 11.9855C7.90961 11.0297 8.60484 10.1989 9.46119 9.55904C10.3176 8.91919 11.3114 8.48801 12.3637 8.29978C13.416 8.11156 14.4977 8.17148 15.5228 8.4748C17.6811 5.15673 21.4219 2.96301 25.675 2.96301" fill="#EF502E" />
                  </svg>
                  <p className='text-sm mb-1 mt-1'>Upload File</p>
                  <span className="text-center m-auto text-xs block"> (Only 'jpeg, webp, and png' images will be accepted)</span>
                </label>
                <input type="file" multiple className="input input-bordered w-full opacity-0 absolute inset-0" onChange={handleFileChange} />
                {/* onChange={handleFileChange} */}
              </div>
              {/* Thumbnails of selected images */}
              <div className='flex flex-wrap gap-4 items-center mt-5'>
                {formData.images.map((file, index) => (
                  <div key={index} className='shadow rounded p-2 relative'>
                    {/* Check if the file is an instance of File to create a URL */}
                    {file instanceof File ? (
                      <img src={URL.createObjectURL(file)} alt={`Uploaded file ${index}`} style={{ width: 50, height: 50, objectFit: 'cover' }} />
                    ) : (
                      <img src={file} alt={`Uploaded image ${index}`} style={{ width: 50, height: 50, objectFit: 'cover' }} />
                    )}
                    <button onClick={() => handleRemoveFile(index)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', position: 'absolute', right: '0', top: '0' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M18 6L6 18M6 6L18 18" stroke="red" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>



            </div>
            <div className="grid grid-cols-1 gap-4">
              {/* Client Name and Business Name */}
              <div className='mb-4'>
                {/* <p className='text-sm mb-2'>Note</p> */}
                <textarea name="notes" id="" value={formData.notes}
                  onChange={(e) => handleChange(e, 'notes')}
                  placeholder='Enter Note *' className="input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400"></textarea>
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
