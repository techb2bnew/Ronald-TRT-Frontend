"use client";
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useRouter, usePathname, useSearchParams } from "next/navigation";
// import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
// import FormControl from '@mui/material/FormControl';
// import Select, { SelectChangeEvent } from '@mui/material/Select';
import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, Checkbox, ListItemText, OutlinedInput, InputAdornment, FormHelperText, FormLabel, Paper, List, ListItem } from '@mui/material';
// import MenuItem from '@mui/material/MenuItem';
import Loader from '@/app/component/loader';
import Swal from 'sweetalert2';
import Delete from '../../../../public/delete.svg'
import Image from 'next/image';
import Link from 'next/link';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import { BrowserMultiFormatReader } from '@zxing/browser';
import Breadcrumb from '@/app/component/breadcrumb';
import Scanner from '../../jobs/create-job/[create]/scanner'
import VehicleTable from '../../jobs/create-job/[create]/vehicleTable';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

// import { CKEditor } from '@ckeditor/ckeditor5-react';
// import type { Editor } from '@ckeditor/ckeditor5-core';
// import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
// import type { EditorConfig } from '@ckeditor/ckeditor5-core';
interface JobDescriptionItem {
  jobDescription: string;
}
interface JobPayload {
  id?: string;
  jobName: string;
  vin: string;
  make: string;
  model: string;
  modelYear: string;
  manufacturerName: string;
  vehicleDescriptor: string;
  vehicleType: string;
  payVehicleType: string;
  jobDescription: JobDescriptionItem[];
  labourCost: string;
  color: string;
  assignTechnicians: string[];
  technicianId: string[];
  notes: string;
  assignCustomer: string;
  createdBy: string;
  plantCountry: string;
  plantCompanyName: string;
  plantState: string;
  bodyClass: string;
  schedule: string;
  techFlatRate: string;
  rRate: string;
  startDate: string;
  endDate: string;
  ip: string;
  jobId?: string;
  images: File[];
  role: string;
  [key: string]: any;
}
type VehicleDetailsMap = {
  [key: string]: keyof JobPayload | undefined;
};

interface DescriptionCostField {
  id: string;
  jobDescription: string;
}
interface VehicleData {
  [key: string]: any; // Allows dynamic properties
}
interface Technician {
  id: string;
  firstName: string;
  lastName: string;
  techFlatRate?: string;
  UserJob?: {
    rRate?: string;
    techFlatRate?: string;
  };
  // other fields...
}
interface Job {
  id: string | number;
  jobName: string;
  technicians?: Technician[];  // Add this line to include technicians
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
  techFlatRate: string;
  rRate: string;

}


interface Jobs {
  id: string;
  name: string;
  email: string;
  jobName: string;
  deletedStatus?: boolean;
}
interface Job {
  id: string | number;
  jobName: string;
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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();
  const [isEdit, setIsEdit] = useState(false);
  const [submitting, setSubmitting] = useState<boolean>(false);  // ✅ Track form submission state
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [userType, setUserType] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const hasVehicleInfo = searchParams?.has('vehicleInfo') ?? false;
  const [selectedTechnician, setSelectedTechnician] = useState<Technicians | null>(null);
  const [userVehicleData, setUserVehicleData] = useState<{ rRate: string; techFlatRate: string } | null>(null);
  const userId = localStorage.getItem('userID');
  const [vehiclesData, setVehiclesData] = useState<any[]>([]);
  const [activeTechnicianId, setActiveTechnicianId] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [totalJobs, setTotalJobs] = useState(10);
  const [activeJob, setActiveJob] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isVisible, setIsVisible] = useState(false);
  const [jobNames, setJobNames] = useState<Job[]>([]);
  const [jobIds, setJobIds] = useState<string | number | null>(null);
  const [jobId, setJobId] = useState<string | number | null>(null);
  const [selectedJobName, setSelectedJobName] = useState<string>("");
  const [confirmChange, setConfirmChange] = useState<{ [techId: string]: boolean }>({});
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [activeInput, setActiveInput] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [allTechnicians, setAllTechnicians] = useState<Technicians[]>([]);

  const [technicianPayRates, setTechnicianPayRates] = useState<{
    [techId: string]: { rRate?: string; techFlatRate?: string };
  }>({});
  const [buttonVisible, setButtonVisible] = useState<{ [techId: string]: boolean }>({});

  // Function to toggle visibility
  const [CustomerData, setCustomerData] = useState<any>(null);
  const toggleVisibility = () => setIsVisible(prevState => !prevState);

  const [descriptionCostFields, setDescriptionCostFields] = useState<DescriptionCostField[]>([
    { id: crypto.randomUUID(), jobDescription: '' },
  ]);
  const vehicleTypes = ['SUV', 'Sedan', 'Truck', 'Van', 'Motorcycle'];
  const [formData, setFormData] = useState<JobPayload>({
    jobName: '',
    id: '',
    vin: '',
    make: '',
    model: '',
    modelYear: '',
    manufacturerName: '',
    vehicleDescriptor: '',
    vehicleType: '',
    payVehicleType: '',
    jobDescription: [],
    labourCost: '',
    notes: '',
    color: '',
    assignTechnicians: [],
    technicianId: [],
    assignCustomer: '',
    createdBy: 'admin',
    plantCountry: '',
    plantCompanyName: '',
    plantState: '',
    bodyClass: '',
    schedule: '',
    techFlatRate: '',
    rRate: '',
    startDate: '',
    endDate: '',
    ip: '',
    jobId: '',
    images: [],
    role: '',
  });
  // Replace your current state with this:
  const [jobForms, setJobForms] = useState<JobPayload[]>([
    {
      jobName: '',
      vin: '',
      make: '',
      model: '',
      modelYear: '',
      manufacturerName: '',
      vehicleDescriptor: '',
      vehicleType: '',
      payVehicleType: '',
      jobDescription: [],
      labourCost: '',
      notes: '',
      color: '',
      assignTechnicians: [],
      technicianId: [],
      assignCustomer: '',
      createdBy: 'admin',
      plantCountry: '',
      plantCompanyName: '',
      plantState: '',
      bodyClass: '',
      schedule: '',
      techFlatRate: '',
      rRate: '',
      startDate: '',
      endDate: '',
      ip: '',
      jobId: '',
      vehicleId: '',
      images: [],
      role: '',
    }
  ]);


  // Function to handle adding a new vehicle form
  // Add new vehicle form


  const handleAddVehicle = async (submit: boolean = false) => {
    const newErrors: { [key: string]: string } = {};
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    jobForms.forEach((form, index) => {
      if (!form.vin?.trim()) newErrors[`vin`] = 'VIN is required';
      // if (!form.jobName?.trim()) newErrors[`jobName`] = 'Job Name is required';
      if (!form.vehicleDescriptor?.trim()) newErrors[`vehicleDescriptor`] = 'Vehicle Descriptor is required';
      if (!form.color?.trim()) newErrors[`color`] = 'Color is required';
      if (!form.assignCustomer) newErrors[`assignCustomer`] = 'Customer is required';
    });


    // Validate form data if needed
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const token = localStorage.getItem('token');
    const formDataObj = new FormData();
    const roleType = localStorage.getItem('types');
    const technicianData = localStorage.getItem('technicianData');
    const jobIdFromStorage = localStorage.getItem('jobId');
    let estimatedByName = '';
    if (technicianData) {
      try {
        const parsed = JSON.parse(technicianData);
        estimatedByName = `${parsed.firstName} ${parsed.lastName}`;
      } catch (err) {
        console.error('Failed to parse technicianData:', err);
      }
    }

    // Append basic job details
    formDataObj.append('jobName', selectedJobName || jobForms[0]?.jobName || '');
    // formDataObj.append('jobId', jobForms[0]?.jobId || ''); 

    formDataObj.append('jobId', jobIdFromStorage || jobForms[0]?.jobId || '');
    // Append vehicle-related fields - use jobForms[0] instead of formData
    const vehicleFields = [
      'vin', 'vehicleDescriptor', 'make', 'manufacturerName', 'model', 'modelYear',
      'vehicleType', 'plantCountry', 'plantCompanyName', 'plantState', 'bodyClass', 'color', 'createdBy', 'notes'
    ];

    vehicleFields.forEach((field) => {
      const value = jobForms[0][field] || ''; // Changed from formData to jobForms[0]
      console.log(`${field}: ${value}`);
      if (value) {
        formDataObj.append(field, value);
      } else {
        console.log(`${field} not provided`);
      }
    });

    // Append customer and schedule - use jobForms[0] instead of formData
    formDataObj.append('customerId', jobForms[0].assignCustomer || '');
    formDataObj.append('schedule', jobForms[0].schedule ? 'true' : 'false');
    formDataObj.append('roleType', roleType || '');
    formDataObj.append('labourCost', jobForms[0].labourCost || '');
    formDataObj.append('estimatedBy', estimatedByName);
    if (startDate) formDataObj.append('startDate', startDate.toISOString());
    if (endDate) formDataObj.append('endDate', endDate.toISOString());


    // After appending userId
    // In your handleAddVehicle function:
    // In your form submission handler:
    if (roleType === 'single-technician' && technicianData) {
      try {
        const technician = JSON.parse(technicianData);
        formDataObj.append(`technicians[${0}][id]`, String(technician.id));
        formDataObj.append(`technicians[${0}][firstName]`, technician.firstName);
        formDataObj.append(`technicians[${0}][lastName]`, technician.lastName);
        formDataObj.append(`technicians[${0}][labourCost]`, technician.labourCost || '');
        formDataObj.append(`userId[${0}]`, technician.id);
      } catch (err) {
        console.error('Failed to parse technician data:', err);
      }
    }
    if (roleType !== 'single-technician') {
      jobForms.forEach((form, formIndex) => {
        if (Array.isArray(form.technicianDetails)) {
          form.technicianDetails.forEach((techDetail, techIndex) => {
            formDataObj.append(`technicians[${techIndex}][id]`, String(techDetail.id));
            formDataObj.append(`technicians[${techIndex}][techType]`, techDetail.techType || '');

            // Get rates from technicianPayRates first, then fall back to techDetail
            const rates = technicianPayRates[techDetail.id] || {};
            const rRateValue = rates.rRate || techDetail.rRate || '';
            const techFlatRateValue = rates.techFlatRate || techDetail.techFlatRate || '';

            // Append both rates (if available)
            if (techFlatRateValue && techFlatRateValue !== '{}' && techFlatRateValue !== '') {
              formDataObj.append(`technicians[${techIndex}][techFlatRate]`, techFlatRateValue);
            }

            if (rRateValue && rRateValue !== '{}' && rRateValue !== '') {
              formDataObj.append(`technicians[${techIndex}][rRate]`, rRateValue);
            }
          });
        }
      });
    }

    // Append job descriptions (if any)
    const jobDescriptionsArray = descriptionCostFields
      .filter(item => item.jobDescription.trim() !== '') // Filter out empty job descriptions
      .map((item) => ({
        description: item.jobDescription,
      }));

    jobDescriptionsArray.forEach((desc) => {
      formDataObj.append('jobDescription[]', desc.description);
    });

    // Append technicians if available - use jobForms[0] instead of formData
    if (Array.isArray(jobForms[0].assignTechnicians)) {
      jobForms[0].assignTechnicians.forEach((techId, tIndex) => {
        formDataObj.append(`userId[${tIndex}]`, techId);
      });
    }

    // Append images (if any) - use jobForms[0] instead of formData
    if (Array.isArray(jobForms[0].images)) {
      jobForms[0].images.forEach((file) => {
        if (file instanceof File) {
          formDataObj.append('images[]', file);
        } else {
          formDataObj.append('images[]', file);  // In case images are URLs, include them as well
        }
      });
    }
    // In your handleAddVehicle function
    console.log(jobIds, 'jobIdsjobIds');

    if (isEdit && jobForms[0]?.id) {
      formDataObj.append('vehicleId', jobForms[0].id);
    }

    formDataObj.append('ip', ip);
    const endpoint = isEdit ? `/api/addVehicleInfo` : `/api/addVehicleInfo`;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataObj,
      });

      const result = await response.json();
      if (response.ok) {
        toast.success('Vehicle added successfully.');
        if (submit) {
          router.push('/vehicle/vehicle');
        }
        if (isEdit) {
          router.push('/vehicle/vehicle');
        }
        setJobForms([{
          jobName: jobForms[0].jobName, // Keep the existing jobName
          vin: '', // Reset the VIN field
          make: '', // Reset make
          model: '', // Reset model
          modelYear: '', // Reset model year
          manufacturerName: '', // Reset manufacturer
          vehicleDescriptor: '', // Reset vehicle descriptor
          vehicleType: '', // Reset vehicle type
          payVehicleType: jobForms[0].payVehicleType, // Keep pay vehicle type
          jobDescription: [], // Reset job description
          labourCost: '', // Reset labour cost
          notes: '', // Reset notes
          color: '', // Reset color
          assignTechnicians: [], // Keep assigned technicians
          technicianId: [], // Reset technician IDs
          assignCustomer: jobForms[0].assignCustomer, // Keep assignCustomer
          createdBy: 'admin',
          plantCountry: '', // Reset plant country
          plantCompanyName: '', // Reset plant company name
          plantState: '', // Reset plant state
          bodyClass: '', // Reset body class
          schedule: '', // Reset schedule 
          techFlatRate: '', // Keep techFlatRate
          rRate: '',
          startDate: '',
          endDate: '',
          ip: '', // Reset IP
          jobId: '',
          images: [], // Reset images
          role: '', // Reset role
        }]);
        setDescriptionCostFields([
          { id: crypto.randomUUID(), jobDescription: '' }
        ]);

      }
      else {
        if (result.error) {

          const swalResult = await Swal.fire({
            title: 'Are you sure you want to proceed and add this vehicle with the same VIN to the job?',
            text: result.details.error,  // Show the message from the API response
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#383d71',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes',
            cancelButtonText: 'Re-enter',
            customClass: {
              title: 'swal-title',  // Custom class for title
              popup: 'swal-text'    // Custom class for content
            }
          });

          // Check if the user clicked "Yes"
          if (swalResult.isConfirmed) {
            const vinDetailsEndpoint = `${apiUrl}/createVinDetails`;
            // Call the createVinDetails API
            try {
              const response = await fetch(vinDetailsEndpoint, {
                method: 'POST',
                headers: {
                  "Authorization": `Bearer ${token}`,
                },
                body: formDataObj,
              });
              const data = await response.json();

              if (response.ok) {
                toast.success('VIN details created successfully.');
                router.push('/vehicle/vehicle');
              } else {
                toast.error('Failed to create VIN details.');
              }
            } catch (error) {
              console.error('Error creating VIN details:', error);
              toast.error('Failed to create VIN details.');
            }
          }
        }
      }
    } catch (error) {
      console.error('Error creating job:', error);
      toast.error('An error occurred while creating the job.');
    } finally {
      setSubmitting(false);
    }
  }



  const handleDeleteForm = (index: number) => {
    setJobForms((prev) => prev.filter((_, i) => i !== index)); // Remove the form at the given index
  };


  const fetchJobData = async (vehicleId: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/fetchSingleVehicleInfo?vehicleId=${vehicleId}`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      if (response.ok && data.vehicle.vehicle) {
        const vehicleData = data.vehicle.vehicle;

        const getValidValue = (value: any) => {
          if (value === null || value === undefined || value === "null" || value === "") {
            return '';
          }
          return value;
        };
        const validDate = (date: any) => {
          return date && date !== 'null' && date !== '';
        };
        setStartDate(validDate(vehicleData.startDate) ? dayjs(new Date(vehicleData.startDate)) : null);
        setEndDate(validDate(vehicleData.endDate) ? dayjs(new Date(vehicleData.endDate)) : null);

        // Process job descriptions
        const jobDescriptionsArray = vehicleData.jobDescription?.map((job: any) => ({
          id: crypto.randomUUID(),
          jobDescription: getValidValue(job),
        })) || [];

        // Process technician details with proper rates
        const technicianDetails = vehicleData.assignedTechnicians?.map((tech: any) => ({
          id: tech.id,
          firstName: tech.firstName,
          lastName: tech.lastName,
          techType: tech.techType,
          techFlatRate: tech.VehicleTechnician?.techFlatRate || '',
          rRate: tech.VehicleTechnician?.rRate || '',
        })) || [];

        // Set technicianPayRates
        const initialPayRates: { [key: string]: { rRate?: string; techFlatRate?: string; } } = {};
        technicianDetails.forEach((tech: any) => {
          initialPayRates[tech.id] = {
            rRate: tech.rRate,
            techFlatRate: tech.techFlatRate
          };
        });

        setTechnicianPayRates(initialPayRates);

        const formData: JobPayload = {
          jobName: getValidValue(vehicleData.jobName),
          jobId: getValidValue(vehicleData.jobId),
          id: getValidValue(vehicleData.id),
          vin: getValidValue(vehicleData.vin),
          make: getValidValue(vehicleData.make),
          model: getValidValue(vehicleData.model),
          modelYear: getValidValue(vehicleData.modelYear),
          manufacturerName: getValidValue(vehicleData.manufacturerName),
          vehicleDescriptor: getValidValue(vehicleData.vehicleDescriptor),
          vehicleType: getValidValue(vehicleData.vehicleType),
          payVehicleType: getValidValue(vehicleData.payVehicleType) || '',
          jobDescription: jobDescriptionsArray,
          labourCost: getValidValue(vehicleData.labourCost),
          notes: getValidValue(vehicleData.notes),
          color: getValidValue(vehicleData.color),
          assignTechnicians: technicianDetails.map((tech: any) => String(tech.id)),
          technicianDetails: technicianDetails,
          technicianId: technicianDetails.map((tech: any) => String(tech.id)),
          assignCustomer: getValidValue(vehicleData.customerId),
          createdBy: getValidValue(vehicleData.createdBy) || 'admin',
          plantCountry: getValidValue(vehicleData.plantCountry),
          plantCompanyName: getValidValue(vehicleData.plantCompanyName),
          plantState: getValidValue(vehicleData.plantState),
          bodyClass: getValidValue(vehicleData.bodyClass),
          schedule: vehicleData.schedule ? 'true' : 'false',
          rRate: technicianDetails.map((tech: any) => (tech.rRate)),
          techFlatRate: technicianDetails.map((tech: any) => (tech.techFlatRate)),
          techType: technicianDetails.map((tech: any) => (tech.techType)),
          startDate: startDate?.format('YYYY-MM-DD') || '',
          endDate: endDate?.format('YYYY-MM-DD') || '',
          ip: '',
          images: vehicleData.images || [],
          role: getValidValue(vehicleData.role) || '',
        };

        const jobId = formData.jobId;
        if (jobId) {
          localStorage.setItem('jobId', jobId);  // Save jobId to localStorage
        }

        setJobForms([formData]);
        setDescriptionCostFields(jobDescriptionsArray.length > 0
          ? jobDescriptionsArray
          : [{ id: crypto.randomUUID(), jobDescription: '' }]
        );
        setTechnicians(vehicleData.assignedTechnicians || []);
        if (vehicleData.jobName) {
          setSelectedJobName(vehicleData.jobName);
        }
      } else {
        toast.error(data.error || 'Error fetching vehicle data');
      }
    } catch (error) {
      console.error('Error fetching vehicle data:', error);
      toast.error('An error occurred while fetching vehicle data');
    }
  };





  React.useEffect(() => {
    const type = localStorage.getItem('types');
    setUserType(type);
  });

  // Fetch Customers api
  const fetchData = async (
    apiPath: string,
    setState: React.Dispatch<React.SetStateAction<any[]>>,
    params: Record<string, string> = {},
    append: boolean = false
  ) => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userID');
      const roleType = localStorage.getItem('types');

      if (apiPath === '/api/fetchJobCustomerTechnician' && (!userId || !roleType)) {
        console.error("User ID or role type missing in localStorage!");
        return;
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const queryParams = new URLSearchParams(params).toString();
      const url = `${apiPath}${queryParams ? `?${queryParams}` : ''}`;

      const response = await fetch(url, { method: 'GET', headers });
      if (response.status === 400) {
        localStorage.removeItem('token');
        router.push('/');
        return;
      }

      const data = await response.json();

      const customers = data.customers?.customers || [];
      const technicians = data.technician?.technicians || [];

      // Use the `endpoint` param from query string to decide
      const endpoint = params.endpoint;

      setState(prev => {
        if (endpoint === 'fetchCustomer' && append) {
          return [...prev, ...customers];
        } else {
          return endpoint === 'fetchTechnicianJob' ? technicians : customers;
        }
      });
    } catch (error) {
      console.error(`Error fetching data from ${apiPath}:`, error);
    }
  };

  const fetchTechniciansOnClick = () => {
    const roleType = localStorage.getItem('types') || ''; // Get roleType from localStorage
    if (roleType) {
      // Call fetchData for technicians on button click
      fetchData('/api/fetchJobCustomerTechnician', setTechnicians, {
        endpoint: 'fetchTechnicianJob',
        types: roleType,
      });
    } else {
      console.error("Role type is missing for fetching technicians!");
    }
  };

  useEffect(() => {
    const roleType = localStorage.getItem('types') || ''; // Provide an empty string if null
    const userId = localStorage.getItem('userID');

    if (userId && roleType) {
      fetchData('/api/fetchJobCustomerTechnician', setCustomer, {
        endpoint: 'fetchCustomer',
        userId,
        page: page.toString(),
        limit: '10',
        roleType: roleType, // Pass roleType (which is now guaranteed to be a string)
      }, page > 1); // Append data if page > 1
    } else {
      console.error("Role type or User ID is missing for fetching customers!");
    }
  }, [page]);

  const handleScroll = (e: any) => {
    const bottom = e.target.scrollTop + e.target.clientHeight >= e.target.scrollHeight;
    if (bottom && hasMore) {
      setPage(prev => prev + 1);
    }
  };






  useEffect(() => {
    const fetchIpAddress = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        setIpAddress(data.ip);
        // setFormData(prev => ({ ...prev, ip: data.ip }));
        setVehiclesData(prev =>
          prev.map(form => ({
            ...form,
            ip: data.ip, // Ensure the IP address is set here
          }))
        );
        console.log(vehiclesData, 'setVehiclesData00....')
      } catch (error) {
        console.error('Error fetching IP address:', error);
      }
    };
    fetchIpAddress();
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const vahicleId = searchParams.get('vahicleId') || '';
    console.log(vahicleId, 'vahicleId')
    if (vahicleId) {
      setJobIds(vahicleId);
      setIsEdit(true);
      fetchJobData(vahicleId);
    } else {
      setIsEdit(false); // Set to false if `customerId` is missing
    }
  }, []);

  // Add this to your component to initialize pay rates
  useEffect(() => {
    if (technicians.length > 0) {
      const initialPayRates: { [key: string]: { rRate?: string; techFlatRate?: string } } = {};
      technicians.forEach(tech => {
        const payRateKey = tech.UserJob?.rRate !== undefined ? 'rRate' : 'techFlatRate';
        initialPayRates[tech.id] = {
          [payRateKey]: tech.UserJob?.[payRateKey] || tech.techFlatRate || ''
        };
      });
      setTechnicianPayRates(initialPayRates);
    }
  }, [technicians]);

  // Assuming vehicleDetailsMap and JobPayload are aligned correctly

  const fetchVehicleDetails = async (vin: string, index: number) => {
    if (!vin) {
      toast.error("Please enter a VIN to fetch vehicle details.");
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

    // Validate customerId and jobName
    const customerId = jobForms[index]?.assignCustomer;
    const jobName = jobForms[index]?.jobName;
    const token = localStorage.getItem('token');

    // Check for customerId and jobName
    if (!customerId || !jobName) {
      toast.error("Customer and Job Title are required.");
      return;
    }

    setSubmitting(true);

    try {
      // Fetch the vehicle details from NHTSA API first
      const vehicleDetailsResponse = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVIN/${vin}?format=json`);
      const vehicleDetailsData = await vehicleDetailsResponse.json();

      if (vehicleDetailsResponse.ok && vehicleDetailsData.Results) {
        let vehicleDetails: Record<string, any> = {};
        vehicleDetailsData.Results.forEach((item: any) => {
          const key = vehicleDetailsMap[item.Variable.toLowerCase().replace(/ /g, '')];
          if (key && item.Value && item.Value !== "N/A") {
            vehicleDetails[key] = item.Value;
          }
        });

        // Update formData with vehicle details
        setJobForms(prev => {
          const updatedForms = [...prev];
          updatedForms[index] = {
            ...updatedForms[index],
            vin: vin,  // Retain the manually entered VIN
            ...vehicleDetails,
          };
          return updatedForms;
        });
        setIsVisible(true);
        // Now check for VIN duplication in the system
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        // Add the token to the headers if it exists
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // Check if the VIN, customerId, and jobName already exist in the system
        const checkVehicleResponse = await fetch(`${apiUrl}/checkVehicle`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            vin,
            customerId,
            jobName,
          }),
        });

        const checkVehicleData = await checkVehicleResponse.json();

        if (checkVehicleResponse) {
          if (!checkVehicleData.status) {
            // If VIN is a duplicate, show SweetAlert
            Swal.fire({
              title: 'Duplicate VIN found',
              text: checkVehicleData.message, // Show the message from the API response
              icon: 'warning',
              confirmButtonText: 'OK',
            });
          }
        } else {
          toast.error(checkVehicleData.error || "Error checking vehicle details.");
        }
      } else {
        toast.error("Failed to fetch vehicle details from NHTSA.");
      }
    } catch (error) {
      console.error("Error fetching vehicle details:", error);
      toast.error("An error occurred while fetching vehicle details.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayRateInput = (
    techId: string,
    value: string,
    rateType: 'rRate' | 'techFlatRate'
  ) => {
    // Remove leading/trailing spaces from value
    const newValue = value.trim() === "" ? "" : value;

    // Log the update
    console.log('Updating technician pay rate:', techId, rateType, newValue);

    // Update technicianPayRates state directly to reflect changes
    setTechnicianPayRates((prevRates) => ({
      ...prevRates,
      [techId]: {
        ...prevRates[techId],
        [rateType]: newValue,  // Ensure the field is updated with the new value
      }
    }));

    // Optionally update the formData to reflect changes (if needed)
    setJobForms((prevForms) => {
      const updatedForms = [...prevForms];
      updatedForms[0] = {
        ...updatedForms[0],
        technicianDetails: updatedForms[0].technicianDetails?.map((tech: any) => {
          if (tech.id === techId) {
            return {
              ...tech,
              [rateType]: newValue, // Update the rate value in technician details
            };
          }
          return tech;
        }),
      };
      return updatedForms;
    });
  };





  const handlePayRateCheckbox = (techId: string) => {
    // Get the current value from state
    const currentValue = technicianPayRates[techId];
    const currentPayRate = currentValue?.rRate || currentValue?.techFlatRate || '';

    // Get the original value from the technician data (from your loop)
    const technician = technicians.find(t => String(t.id) === techId);
    const originalRRate = technician?.UserJob?.rRate;
    const originalFlatRate = technician?.UserJob?.techFlatRate;
    const originalPayRate = originalRRate ?? originalFlatRate ?? '';

    if (!currentPayRate.trim()) {
      toast.error("Please enter a pay rate before confirming.");
      return;
    }

    Swal.fire({
      title: 'Are you sure?',
      text: "Do you want to change this technician's amount?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#383d71',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, change it!',
      cancelButtonText: 'No',
    }).then((result) => {
      if (result.isConfirmed) {
        toast.success("Pay rate confirmed");
        setButtonVisible(prev => ({ ...prev, [techId]: false }));
        // 🔁 Call backend or update state if needed
      } else {
        // If "No", reset to the original pay rate from UserJob
        setTechnicianPayRates((prev) => {
          const technicianData = prev[techId] || {};

          // Determine which rate type to reset based on what exists in UserJob
          const hasOriginalRRate = originalRRate !== undefined && originalRRate !== null;
          const resetToRRate = hasOriginalRRate;

          return {
            ...prev,
            [techId]: {
              ...technicianData,
              rRate: resetToRRate ? originalPayRate : technicianData.rRate,
              techFlatRate: !resetToRRate ? originalPayRate : technicianData.techFlatRate
            },
          };
        });
        setButtonVisible(prev => ({ ...prev, [techId]: false }));
        toast("No changes made");
      }
    });
  };



  const handleDescriptionCostChange = (index: number, field: keyof JobDescriptionItem, value: string) => {
    // Update the descriptionCostFields state (map through the fields and modify the relevant one)
    setDescriptionCostFields((prevFields) =>
      prevFields.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );

    // Ensure jobDescription is always an array and sync the changes to formData
    setFormData((prev) => ({
      ...prev,
      jobDescription: descriptionCostFields.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ).filter(item => item.jobDescription.trim() !== '') // Remove empty descriptions
    }));

    // Handle errors if jobDescription fields are empty
    if (errors.jobDescription) {
      const allFieldsFilled = descriptionCostFields.every(
        field => field.jobDescription.trim()
      );

      if (allFieldsFilled) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.jobDescription; // Clear error if all descriptions are filled
          return newErrors;
        });
      }
    }
  };




  const handleChange = (
    event: any,
    key: string,
    index: number,
    target: 'formData' | 'vehicleData' = 'formData',
    techIndex?: number
  ) => {
    const value = event.target.value;

    // Regex validation for techFlatRate
    if (key === 'techFlatRate') {
      const regex = /^\d{0,5}(\.\d{0,2})?$/;
      if (value !== '' && !regex.test(value)) return;
    }

    let shouldUpdate = true;
    // If value is invalid, skip updating
    if (!shouldUpdate) return;

    // Clear errors for non-empty inputs
    if (errors[key] && String(value).trim()) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }

    // Update the specific job form based on the index
    setJobForms((prev) => {
      const updatedForms = [...prev];
      const currentForm = { ...updatedForms[index] };

      if (typeof techIndex === 'number') {
        const updatedTechs = [...(currentForm.technicianDetails || [])];

        updatedTechs[techIndex] = {
          ...updatedTechs[techIndex],
          [key]: value,
        };
        currentForm.technicianDetails = updatedTechs;
      } else {
        currentForm[key] = value;
      }

      updatedForms[index] = currentForm;
      return updatedForms;
    });

    if (typeof techIndex === 'number') return;

    // update vehicleData or formData
    if (target === 'vehicleData') {
      setVehicleData((prev: VehicleData) => ({ ...prev, [key]: value }));
    } else {
      setFormData((prev) => ({ ...prev, [key]: value }));
    }
  };


  const handleSelectChange = async (
    event: SelectChangeEvent<string>,
    field: string,
    index: number,  // This is passed to the function
    techIndex?: number
  ) => {
    const value = event.target.value;

    // Update the specific form in jobForms
    setJobForms(prevForms => {
      const updatedForms = [...prevForms];
      updatedForms[index] = {  // Use index here instead of formIndex
        ...updatedForms[index],
        [field]: value,
      };
      return updatedForms;
    });

    // If this is a customer selection change
    if (field === 'assignCustomer') {
      await handleCustomerSelect(value); // Call handleCustomerSelect when a customer is selected

      // You can now safely fetch jobs and technicians for the selected customer.
      setSelectedCustomerId(value); // Store the selected customer ID
    }

    // Update formData if needed (only if not a technician field)
    if (typeof techIndex !== 'number') {
      setFormData(prev => ({ ...prev, [field]: value }));
    }

    // Clear any existing error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };





  const handleSelectColor = (event: SelectChangeEvent<string>, field: string, index: number) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    const updatedForms = [...jobForms];
    updatedForms[index] = {
      ...updatedForms[index],
      [field]: value,
    };
    setJobForms(updatedForms);
  };

  // Special handler for multiple select (technicians):
  const handleTechnicianChange = (techId: string, formIndex: number) => {
    setJobForms(prevForms => {
      const updatedForms = [...prevForms];
      const form = updatedForms[formIndex];

      // Initialize arrays properly
      const currentAssignTechs = Array.isArray(form.assignTechnicians)
        ? [...form.assignTechnicians]
        : [];
      const currentTechDetails = Array.isArray(form.technicianDetails)
        ? [...form.technicianDetails]
        : [];

      // Check if technician is already selected
      const techIndex = currentAssignTechs.indexOf(techId);
      const isAlreadyAssigned = techIndex !== -1;

      // Find technician data
      const tech = technicians.find(t => String(t.id) === techId);
      if (!tech) return prevForms;

      if (isAlreadyAssigned) {
        // Remove technician from both arrays
        currentAssignTechs.splice(techIndex, 1);

        // Find and remove from technicianDetails
        const detailIndex = currentTechDetails.findIndex(td => String(td.id) === techId);
        if (detailIndex !== -1) {
          currentTechDetails.splice(detailIndex, 1);
        }

        // Remove from technicianPayRates
        setTechnicianPayRates(prev => {
          const newRates = { ...prev };
          delete newRates[techId];
          return newRates;
        });
      } else {
        // Add new technician with complete details
        currentAssignTechs.push(techId);

        // Get the correct rate based on technician type
        const rateType = tech.techType === 'FlatRate' ? 'techFlatRate' : 'rRate';
        const rateValue = tech[rateType] || '';

        currentTechDetails.push({
          id: tech.id,
          firstName: tech.firstName,
          lastName: tech.lastName,
          email: tech.email || '',
          phoneNumber: tech.phoneNumber || '',
          techType: tech.techType,
          techFlatRate: tech.techType === 'FlatRate' ? rateValue : '',
          rRate: tech.techType !== 'FlatRate' ? rateValue : '',
        });

        // Update technicianPayRates
        setTechnicianPayRates(prev => ({
          ...prev,
          [tech.id]: {
            rRate: tech.techType !== 'FlatRate' ? rateValue : '',
            techFlatRate: tech.techType === 'FlatRate' ? rateValue : ''
          }
        }));
      }

      // Update the form with both arrays
      updatedForms[formIndex] = {
        ...form,
        assignTechnicians: currentAssignTechs,
        technicianDetails: currentTechDetails
      };

      return updatedForms;
    });
  };





  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const files = e.target.files ? Array.from(e.target.files) : [];

    // Filter out unwanted file types
    const validImageFiles = files.filter(file => acceptedTypes.includes(file.type));

    if (validImageFiles.length === 0) {
      toast.error("Please upload only JPEG, PNG, or WEBP images.");
      return;
    }

    // Check total images won't exceed 5
    const currentImageCount = jobForms[index]?.images?.length || 0;
    const newImageCount = validImageFiles.length;

    if (currentImageCount + newImageCount > 5) {
      toast.error(`You can only upload up to 5 images. You already have ${currentImageCount} images.`);
      return;
    }

    const maxWidth = 800;
    const maxHeight = 600;
    const quality = 0.7;

    // Compress each valid image and ensure the result is typed as File
    const compressions: Promise<File>[] = validImageFiles.map(file =>
      compressImage(file, maxWidth, maxHeight, quality)
    );

    Promise.all(compressions)
      .then((compressedFiles) => {
        setJobForms(prev => {
          const updatedForms = [...prev];
          updatedForms[index] = {
            ...updatedForms[index],
            images: [
              ...(updatedForms[index].images || []),
              ...compressedFiles
            ].slice(0, 5) // Ensure max 5 images
          };
          return updatedForms;
        });
      })
      .catch(error => {
        console.error('Compression error:', error);
        toast.error('Failed to compress images.');
      });
  };


  // Compress function ensures it returns a File object
  function compressImage(file: any, maxWidth: number, maxHeight: number, quality: number): Promise<File> {
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



  // Remove a specific image
  const handleRemoveFile = async (formIndex: number, imageIndex: number) => {
    try {
      const imageToRemove = jobForms[formIndex].images[imageIndex];

      // Check if the image to remove is a URL (string) and if jobId is available
      if (typeof imageToRemove === 'string' && jobForms[formIndex].jobId) {
        // Call API to delete the image from the backend
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
        const token = localStorage.getItem('token');
        const payload = {
          jobId: jobForms[formIndex].jobId,
          imagesToDelete: [imageToRemove],
        };

        const response = await fetch(`${apiUrl}/deleteSelectedJobImages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          toast.error(data.error || 'Failed to delete image.');
          return; // Stop removal if the API call failed
        }

        toast.success('Image deleted successfully.');
      }

      // Remove the image locally
      setJobForms(prev => {
        const updatedForms = [...prev];
        updatedForms[formIndex] = {
          ...updatedForms[formIndex],
          images: updatedForms[formIndex].images.filter((_, i) => i !== imageIndex)
        };
        return updatedForms;
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('An error occurred while deleting the image.');
    }
  };


  const handleAddMore = () => {
    // Check if there are any non-empty job descriptions
    const hasNonEmptyDescription = descriptionCostFields.some(field => field.jobDescription.trim() !== '');

    if (hasNonEmptyDescription) {
      // If there are non-empty descriptions, add a new field
      setDescriptionCostFields([...descriptionCostFields, { id: crypto.randomUUID(), jobDescription: '' }]);
    } else {
      // Show a message or prevent adding more fields if all descriptions are empty
      toast.error("Please enter a description before adding more.");
    }
  };


  // Delete the Correct Field by ID
  const handleDeleteField = (id: string) => {
    setDescriptionCostFields((prev) => prev.filter((item) => item.id !== id));
  };




  const handleScan = (vin: string, index: number) => {
    setFormData((prev) => ({ ...prev, vin }));
    setTimeout(() => {
      fetchVehicleDetails(vin, index);
    }, 100);
  };


  // Inside your component, after selectedTechnician is set:
  useEffect(() => {
    if (userType === 'ifs' && userId) {
      fetchUserVehicleData(userId);
    }
  }, [userType, userId]);

  const fetchUserVehicleData = async (userId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/fetchSingleTechnician?technicianId=${userId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.technician) {
        // data.vehicleTypes is expected to have payVehicleType and techFlatRate

      } else {
        toast.error('Failed to fetch vehicle data.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error fetching vehicle data.');
    }
  };



  const fetchJobs = async (page = 1, limit = pageSize) => {
    try {
      const token = localStorage.getItem('token');
      const roleType = localStorage.getItem('types') || "";
      const userId = localStorage.getItem('userID');

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Build the endpoint based on the roleType and userId
      let endpoint = "";
      if (roleType === 'superadmin') {
        endpoint = `/api/jobListing?page=${page}&roleType=${encodeURIComponent(roleType)}&limit=${limit}`;
      } else {
        endpoint = `/api/jobListing?userId=${userId}&page=${page}&roleType=${encodeURIComponent(roleType)}&limit=${limit}`;
      }

      console.log('Fetching API with endpoint:', endpoint); // Debugging endpoint

      const response = await fetch(endpoint, { method: 'GET', headers });
      const data = await response.json();

      console.log('API response data:', data); // Debugging API response

      if (response.ok) {
        const fetchedJobs: Jobs[] = data.jobs?.jobs || [];
        setActiveJob(fetchedJobs);
        setTotalPages(data.jobs?.totalPages || 1);
        setTotalJobs(data.jobs?.totalJobs || 0);
        const jobObjects: Job[] = fetchedJobs.map(job => ({
          id: job.id,           // Correct id mapping
          jobName: job.jobName  // Correct jobName mapping
        }));
        setJobNames(jobObjects);
      } else {
        if (data.error === 'Invalid Token') {
          router.push('/'); // Redirect if the token is invalid
        } else {
          console.error('Error fetching job data:', data.error);
        }
      }
    } catch (error) {
      console.error('Error fetching job data:', error);
    } finally {
      // Any cleanup or actions when fetching is done (if necessary)
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchJobs(currentPage, pageSize); // Make sure currentPage and pageSize are used
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [currentPage, pageSize]); // Run fetchJobs when either currentPage or pageSize changes




  const fetchCustomerData = async (customerId: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
 
      const response = await fetch(
        `/api/customerJobNamefetch?customerId=${encodeURIComponent(customerId)}`,
        {
          method: 'GET',
          headers,
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Return both jobs and all technicians (we'll filter later when job is selected)
        return {
          jobs: data.jobs || [],
          allTechnicians: data.jobs?.flatMap((job: any) => job.technicians) || []
        };
      } else {
        toast.error(data.error || 'Error fetching customer data');
        return { jobs: [], allTechnicians: [] };
      }
    } catch (error) {
      toast.error('An error occurred while fetching customer data');
      return { jobs: [], allTechnicians: [] };
    }
  };
  const handleCustomerSelect = async (customerId: string) => {
    setSelectedCustomerId(customerId);

    // Fetch customer data (jobs and technicians)
    const { jobs, allTechnicians } = await fetchCustomerData(customerId);

    setJobNames(jobs); // Update available jobs for the customer
    setTechnicians([]); // Clear previous technician list

    // Optionally, store all technicians in state for later filtering
    setAllTechnicians(allTechnicians);  // Store all technicians globally
  };


  const handleJobNameSelect = async (selectedName: string) => {
    setSelectedJobName(selectedName);
    setTechnicians([]); // Clear technicians first to avoid showing old ones

    const selectedJob = jobNames.find(job => job.jobName === selectedName);
    console.log('selectedJob:', selectedJob);

    if (selectedJob) {
      setJobId(selectedJob.id);
      localStorage.setItem('jobId', selectedJob.id.toString());

      // Safely handle the technicians array and ensure no duplicates
      const jobTechnicians = selectedJob.technicians
        ? allTechnicians.filter((tech) =>
          selectedJob.technicians?.some((selectedTech: any) => selectedTech.id === tech.id)
        )
        : [];

      // Remove duplicates based on technician id
      const uniqueTechnicians = Array.from(
        new Map(jobTechnicians.map((tech: any) => [tech.id, tech])).values()
      );

      console.log('jobTechnicians:', uniqueTechnicians);

      setTechnicians(uniqueTechnicians); // Set the new unique technicians

      setJobForms(prev => {
        const updatedForms = [...prev];
        updatedForms[0] = {
          ...updatedForms[0],
          jobId: selectedJob.id.toString(),
          jobName: selectedName,
          assignTechnicians: uniqueTechnicians.map((tech: any) => String(tech.id)),
          technicianDetails: uniqueTechnicians.map((tech: any) => ({
            id: tech.id,
            firstName: tech.firstName,
            lastName: tech.lastName,
            email: tech.email,
            phoneNumber: tech.phoneNumber,
            techFlatRate: tech.UserJob?.techFlatRate || '',
            rRate: tech.UserJob?.rRate || '',
            techType: tech.techType || 'technician',
          })),
        };
        return updatedForms;
      });
    } else {
      // If no job selected, clear everything
      setTechnicians([]);
      setJobForms(prev => {
        const updatedForms = [...prev];
        updatedForms[0] = {
          ...updatedForms[0],
          jobId: '',
          jobName: '',
          assignTechnicians: [],
          technicianDetails: [],
        };
        return updatedForms;
      });
    }
  };










  const handleDateChange = (newValue: [Dayjs | null, Dayjs | null]) => {
    // Do something with the selected dates
    console.log('Start:', newValue[0]?.toISOString(), 'End:', newValue[1]?.toISOString());
  };

  return (
    <div className='w-[60%] m-auto mb-5'>
      <Breadcrumb
        items={[
          isEdit
            ? { label: 'Edit Vehicle / Work Order' }
            : { label: 'Add New Vehicle / Work Order', href: '/jobs/create-job/create' },
        ]}
      />
      <h1 className="text-lg leading-6 font-bold text-gray-900"> {isEdit ? 'Edit Vehicle / Work Order' : 'Add New Vehicle / Work Order'}</h1>
      {/* <p className='text-sm'>Onboard clients effortlessly for seamless collaboration!</p> */}
      <div className='bg-white p-4 mt-5 '>
        <form className=""  >

          {Array.isArray(jobForms) && jobForms.map((form, index) => (
            <div key={index}>

              <div className="grid grid-cols-2 gap-4 mb-2">

                <div className='mb-2 flex items-start gap-3 relative' >
                  <FormControl fullWidth size="small">
                    <InputLabel id="assignCustomer" color="warning">Select customer *</InputLabel>
                    <Select
                      labelId="assignCustomer"
                      id="select-assignCustomer"
                      color="warning"
                      value={form.assignCustomer}
                      label="Select customer"
                      name="assignCustomer"

                      onChange={(event) => handleSelectChange(event, 'assignCustomer', index)}

                      MenuProps={{
                        disablePortal: true,
                        PaperProps: {
                          onScroll: handleScroll,
                          style: {
                            maxHeight: 200,
                            overflowY: 'auto',
                          },
                        },
                      }}
                    >
                      {customer.map((customer: any) => (
                        <MenuItem key={customer.id} value={customer.id}>{customer.fullName}</MenuItem>
                      ))}
                    </Select>
                    {errors.assignCustomer && (
                      <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                        {errors.assignCustomer}
                      </div>
                    )}
                  </FormControl>
                </div>
                <div className='relative w-[100%]'>


                  <TextField
                    key={jobNames.length}
                    fullWidth
                    name="jobName"
                    id="outlined-basic"
                    color="warning"
                    label="Select Job Title *"
                    size="small"
                    value={selectedJobName || jobForms[0]?.jobName || ''}
                    onChange={(e) => handleJobNameSelect(e.target.value)}
                    select
                  >
                    {jobNames.length > 0 ? (
                      jobNames.map((job) => (
                        <MenuItem key={job.id} value={job.jobName}>
                          {job.jobName}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>No jobs available for this customer</MenuItem>
                    )}
                  </TextField>



                  {errors.jobName && (
                    <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                      {errors.jobName}
                    </div>
                  )}
                </div>



                {errors.jobName && (
                  <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                    {errors.jobName}
                  </div>
                )}

              </div>
              {/* {form.assignCustomer && <VehicleTable vehicles={vehiclesData} />} */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-md font-bold">Add Vehicle Details</h2>
                {/* Toggle Switch */}
                <label htmlFor="toggle" className="flex items-center cursor-pointer">
                  <span className="mr-2 text-sm">
                    {isVisible ? 'View Detail' : 'Enter Manually'}
                  </span>

                  <div className={`relative ${isVisible ? 'bg-[#383d71]' : 'bg-gray-200'} w-12 h-6 rounded-full transition-colors`}>
                    <input
                      id="toggle"
                      type="checkbox"
                      checked={isVisible}
                      onChange={toggleVisibility}
                      className="sr-only"
                    />
                    <div
                      className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${isVisible ? 'translate-x-6' : ''}`}
                    ></div>
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Client Name and Business Name */}
                <div className='mb-2'>
                  {/* <p className='text-sm mb-2'>ViN <span className='text-[red]'>*</span> </p> */}
                  <div className='flex gap-3 items-start'>
                    <div className="flex gap-3 items-start w-[70%]">
                      <div className='relative w-[100%]'>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon__tech">
                          <path d="M4 12V10L6 6H14L16 10V12" stroke="#5B5B99" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                          <circle cx="6" cy="14" r="1" fill="#5B5B99" />
                          <circle cx="14" cy="14" r="1" fill="#5B5B99" />
                          <rect x="3" y="16" width="1" height="3" fill="#5B5B99" />
                          <rect x="5" y="16" width="0.5" height="3" fill="#5B5B99" />
                          <rect x="6.5" y="16" width="1" height="3" fill="#5B5B99" />
                          <rect x="8.5" y="16" width="0.5" height="3" fill="#5B5B99" />
                          <rect x="10" y="16" width="1" height="3" fill="#5B5B99" />
                          <rect x="12" y="16" width="0.5" height="3" fill="#5B5B99" />
                          <rect x="13.5" y="16" width="1" height="3" fill="#5B5B99" />
                        </svg>

                        <TextField fullWidth name="vin" id="outlined-basic" color="warning" label="Enter vin number *" size="small" value={form.vin} onChange={(e) => handleChange(e, 'vin', index)} inputProps={{ maxLength: 17 }} />
                        {errors.vin && (
                          <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                            {errors.vin}
                          </div>
                        )}
                      </div>
                      <button type="button" onClick={() => fetchVehicleDetails(form.vin, index)} className="primary-bg pl-5 pr-5 p-2 text-sm  w-[200px] rounded">Fetch</button>
                    </div>

                    <div className="relative flex gap-2 items-start">
                      <label data-tooltip-id="VIN"
                        data-tooltip-content="Upload VIN Image"
                        htmlFor="fileInput"
                        className="cursor-pointer flex  gap-2 p-[7px] bg-gray-100 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-200"
                      >
                        <div className='text-center'>
                          <svg className='m-auto' width="22" height="22" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21.953 15.7599C22.3011 15.7599 22.5895 15.8644 22.9124 16.1544L29.2453 22.2609C29.5218 22.5367 29.6876 22.8314 29.6876 23.2368C29.6876 23.9911 29.1353 24.5254 28.3621 24.5254C27.9928 24.5254 27.607 24.3784 27.3485 24.0838L24.5506 21.1201L23.2982 19.8127L23.427 22.5564V36.7479C23.427 37.5219 22.7458 38.1662 21.9538 38.1662C21.1626 38.1662 20.4995 37.5219 20.4995 36.7479V22.5556L20.6095 19.8119L19.3578 21.1193L16.5764 24.0838C16.4507 24.2228 16.2974 24.3339 16.1262 24.4101C15.955 24.4863 15.7698 24.5258 15.5825 24.5262C14.8093 24.5262 14.2389 23.9919 14.2389 23.2368C14.2389 22.8314 14.3858 22.5375 14.6616 22.2609L20.886 16.2581C21.2545 15.8888 21.5853 15.7599 21.9546 15.7599M25.6765 2.96301C32.3606 2.96301 37.7789 8.3813 37.7789 15.0646C37.7789 15.4449 37.7608 15.8212 37.727 16.1921C41.108 16.9888 43.6246 20.0264 43.6246 23.6501C43.6246 27.8819 40.1942 31.3124 35.9623 31.3124H27.123V28.3659H35.9608C36.58 28.3659 37.1933 28.244 37.7654 28.007C38.3376 27.77 38.8575 27.4226 39.2954 26.9847C39.7333 26.5468 40.0806 26.0269 40.3176 25.4548C40.5546 24.8826 40.6766 24.2694 40.6766 23.6501C40.6764 22.5885 40.3182 21.5579 39.66 20.725C39.0017 19.8921 38.0818 19.3055 37.049 19.0599L34.5551 18.4722L34.7908 15.921C34.8175 15.6382 34.8301 15.3522 34.8301 15.0646C34.8301 10.0085 30.7318 5.90944 25.675 5.90944C24.148 5.90809 22.645 6.2892 21.3031 7.01798C19.9612 7.74676 18.8233 8.8 17.993 10.0816L16.7948 11.9233L14.6883 11.301C14.1166 11.1316 13.5137 11.0948 12.9255 11.1933C12.3374 11.2918 11.7794 11.5231 11.2941 11.8695C10.8087 12.216 10.4087 12.6685 10.1244 13.1927C9.84011 13.717 9.67906 14.2991 9.65347 14.8949L9.65033 15.1251L9.7234 17.6001L7.36861 18.143C6.22908 18.4081 5.21281 19.051 4.48522 19.9672C3.75763 20.8834 3.36156 22.0189 3.36147 23.1889C3.36147 24.5621 3.90699 25.8791 4.87803 26.8502C5.84906 27.8212 7.16607 28.3667 8.53933 28.3667H16.9088V31.3132H8.53933C4.0529 31.3132 0.415039 27.6753 0.415039 23.1889C0.415039 19.3326 3.10218 16.1033 6.70625 15.272L6.70311 15.0646C6.70282 13.9956 6.95199 12.9413 7.4308 11.9855C7.90961 11.0297 8.60484 10.1989 9.46119 9.55904C10.3176 8.91919 11.3114 8.48801 12.3637 8.29978C13.416 8.11156 14.4977 8.17148 15.5228 8.4748C17.6811 5.15673 21.4219 2.96301 25.675 2.96301" fill="#383d71" />
                          </svg>
                        </div>
                      </label>
                      <Scanner onScan={(vin) => handleScan(vin, index)} />
                      {/* <input
                    id="fileInput"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  /> */}
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
              {isVisible && (
                <div>
                  {form && (
                    <div className="overflow-x-auto rounded-md pt-4 mb-5">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-xs mb-2 relative">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon__tech">
                            <path d="M4 11V9L6 5H14L16 9V11" stroke="#5B5B99" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="6" cy="14" r="1" fill="#5B5B99" />
                            <circle cx="14" cy="14" r="1" fill="#5B5B99" />
                            <rect x="3" y="15.5" width="2.5" height="0.8" rx="0.4" fill="#5B5B99" />
                            <rect x="6" y="15.5" width="3" height="0.8" rx="0.4" fill="#5B5B99" />
                            <rect x="10" y="15.5" width="2" height="0.8" rx="0.4" fill="#5B5B99" />
                            <rect x="13" y="15.5" width="3.5" height="0.8" rx="0.4" fill="#5B5B99" />
                          </svg>

                          <TextField
                            fullWidth
                            label="Vehicle Descriptor *"
                            size="small"
                            color="warning"
                            value={form.vehicleDescriptor || ''}
                            onChange={(e) => handleChange(e, 'vehicleDescriptor', index)}

                          />
                          {errors.vehicleDescriptor && (
                            <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                              {errors.vehicleDescriptor}
                            </div>
                          )}
                        </div>
                        <div className="text-xs mb-2 relative">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon__tech">
                            <path d="M4 11V9L6 5H14L16 9V11" stroke="#5B5B99" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="6" cy="14" r="1" fill="#5B5B99" />
                            <circle cx="14" cy="14" r="1" fill="#5B5B99" />
                            <rect x="9" y="6" width="2" height="2" rx="0.3" fill="#5B5B99" />
                          </svg>

                          <TextField
                            fullWidth
                            label="Make"
                            size="small"
                            color="warning"
                            value={form.make || ''}
                            onChange={(e) => handleChange(e, 'make', index)}

                          />
                        </div>
                        <div className="text-xs  mb-2 relative">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon__tech">
                            <rect x="3" y="8" width="14" height="9" rx="1" stroke="#5B5B99" strokeWidth="1.2" />
                            <rect x="5" y="4" width="2" height="4" fill="#5B5B99" />
                            <rect x="9" y="10.5" width="6" height="2" rx="0.5" fill="#5B5B99" />
                          </svg>

                          <TextField
                            fullWidth
                            label="Manufacturer Name"
                            size="small"
                            color="warning"
                            value={form.manufacturerName || ''}
                            onChange={(e) => handleChange(e, 'manufacturerName', index)}

                          />
                        </div>
                        <div className="text-xs relative">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon__tech">
                            <path d="M4 11V9L6 5H14L16 9V11" stroke="#5B5B99" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="6" cy="14" r="1" fill="#5B5B99" />
                            <circle cx="14" cy="14" r="1" fill="#5B5B99" />
                            <rect x="7" y="2.5" width="6" height="2" rx="0.5" fill="#5B5B99" />
                          </svg>

                          <TextField
                            fullWidth
                            label="Model"
                            size="small"
                            color="warning"
                            value={form.model || ''}
                            onChange={(e) => handleChange(e, 'model', index)}

                          />
                        </div>
                        <div className="text-xs relative">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon__tech">
                            <rect x="3" y="3" width="14" height="14" rx="2" stroke="#5B5B99" strokeWidth="1.2" />
                            <path d="M3 6.5H17" stroke="#5B5B99" strokeWidth="1.2" />
                            <rect x="6" y="9" width="2.5" height="1" rx="0.5" fill="#5B5B99" />
                            <rect x="9.5" y="9" width="4" height="1" rx="0.5" fill="#5B5B99" />
                          </svg>

                          <TextField
                            fullWidth
                            label="Model Year"
                            type='number'
                            size="small"
                            color="warning"
                            value={form.modelYear || ''}
                            onChange={(e) => handleChange(e, 'modelYear', index)}

                          />
                        </div>
                        <div className="text-xs relative">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon__tech">
                            <path d="M3 11V9L5.5 5H14.5L17 9V11H3Z" stroke="#5B5B99" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="6" cy="14" r="1.2" fill="#5B5B99" />
                            <circle cx="14" cy="14" r="1.2" fill="#5B5B99" />
                          </svg>

                          <TextField
                            fullWidth
                            label="Vehicle Type"
                            size="small"
                            color="warning"
                            value={form.vehicleType || ''}
                            onChange={(e) => handleChange(e, 'vehicleType', index)}

                          />
                        </div>
                      </div>
                    </div>

                  )}
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className='mb-4 relative'>


                  <FormControl fullWidth size="small">
                    <InputLabel id="color" color="warning">Select color *</InputLabel>
                    <Select
                      labelId="color"
                      id="select-color"
                      value={form.color}
                      label="Select color"
                      name="color"
                      color="warning"
                      onChange={(event) => handleSelectColor(event, 'color', index)}
                      renderValue={(selected) => (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              backgroundColor: selected,
                              marginRight: '8px',
                              border: selected === 'white' ? '1px solid #ccc' : 'none'
                            }}
                          />
                          {selected.charAt(0).toUpperCase() + selected.slice(1)}
                        </div>
                      )}
                    >
                      {[
                        { value: 'black', label: 'Black' },
                        { value: 'gray', label: 'Gray' },
                        { value: 'blue', label: 'Blue' },
                        { value: 'silver', label: 'Silver' },
                        { value: 'red', label: 'Red' },
                        { value: 'maroon', label: 'Maroon' },
                        { value: 'yellow', label: 'Yellow' },
                        { value: 'white', label: 'White' },
                        { value: 'brown', label: 'Brown' },
                        { value: 'tan', label: 'Tan' },
                        { value: 'gold', label: 'Gold' },
                        { value: 'green', label: 'Green' },
                        { value: 'orange', label: 'Orange' }
                      ].map((color) => (
                        <MenuItem key={color.value} value={color.value}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                backgroundColor: color.value,
                                marginRight: '8px',
                                border: color.value === 'white' ? '1px solid #ccc' : 'none'
                              }}
                            />
                            {color.label}
                          </div>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {errors.color && (
                    <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                      {errors.color}
                    </div>
                  )}
                </div>
                {/* Client Name and Business Name */}


              </div>

              <h2 className='text-md font-bold'>Work Description</h2>
              {descriptionCostFields.map((field, index) => (
                <div key={field.id} id={field.id} className="grid grid-cols-1 gap-4">
                  <div className='mb-2'>
                    <textarea name="jobDescription" rows={3} id="" value={field.jobDescription}
                      onChange={(e) =>
                        handleDescriptionCostChange(index, "jobDescription", e.target.value)
                      }

                      placeholder='Enter Description' className="input text-[#3a3a3a] text-xs mt-1 input-bordered w-full p-3 rounded border" ></textarea>

                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddMore}
                className="primary-bg pl-5 pr-5 text-sm p-2 rounded mb-4">Add More + </button>


              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <div className="grid grid-cols-2 gap-4">
                  <DateTimePicker
                    label="Start Date"
                    value={startDate}
                    onChange={(newValue) => {
                      setStartDate(newValue);
                    }}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                        color: 'warning',

                      },
                    }}
                  />
                  <DateTimePicker
                    label="End Date"
                    value={endDate}
                    onChange={(newValue) => {
                      setEndDate(newValue);
                    }}
                    minDate={startDate || undefined}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                        color: 'warning',
                      },
                    }}
                  />
                </div>
              </LocalizationProvider>

              <div className='mb-4 mt-4'>
                {/* <p className='text-sm mb-2'>Tax Forms <span className='text-red-500'>*</span></p> */}

                <div className="form-control w-full p-3 mt-1 rounded relative" style={{ border: '2px dashed #ccc' }}>
                  <label className="label text-center">
                    <svg className='m-auto' width="34" height="34" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21.953 15.7599C22.3011 15.7599 22.5895 15.8644 22.9124 16.1544L29.2453 22.2609C29.5218 22.5367 29.6876 22.8314 29.6876 23.2368C29.6876 23.9911 29.1353 24.5254 28.3621 24.5254C27.9928 24.5254 27.607 24.3784 27.3485 24.0838L24.5506 21.1201L23.2982 19.8127L23.427 22.5564V36.7479C23.427 37.5219 22.7458 38.1662 21.9538 38.1662C21.1626 38.1662 20.4995 37.5219 20.4995 36.7479V22.5556L20.6095 19.8119L19.3578 21.1193L16.5764 24.0838C16.4507 24.2228 16.2974 24.3339 16.1262 24.4101C15.955 24.4863 15.7698 24.5258 15.5825 24.5262C14.8093 24.5262 14.2389 23.9919 14.2389 23.2368C14.2389 22.8314 14.3858 22.5375 14.6616 22.2609L20.886 16.2581C21.2545 15.8888 21.5853 15.7599 21.9546 15.7599M25.6765 2.96301C32.3606 2.96301 37.7789 8.3813 37.7789 15.0646C37.7789 15.4449 37.7608 15.8212 37.727 16.1921C41.108 16.9888 43.6246 20.0264 43.6246 23.6501C43.6246 27.8819 40.1942 31.3124 35.9623 31.3124H27.123V28.3659H35.9608C36.58 28.3659 37.1933 28.244 37.7654 28.007C38.3376 27.77 38.8575 27.4226 39.2954 26.9847C39.7333 26.5468 40.0806 26.0269 40.3176 25.4548C40.5546 24.8826 40.6766 24.2694 40.6766 23.6501C40.6764 22.5885 40.3182 21.5579 39.66 20.725C39.0017 19.8921 38.0818 19.3055 37.049 19.0599L34.5551 18.4722L34.7908 15.921C34.8175 15.6382 34.8301 15.3522 34.8301 15.0646C34.8301 10.0085 30.7318 5.90944 25.675 5.90944C24.148 5.90809 22.645 6.2892 21.3031 7.01798C19.9612 7.74676 18.8233 8.8 17.993 10.0816L16.7948 11.9233L14.6883 11.301C14.1166 11.1316 13.5137 11.0948 12.9255 11.1933C12.3374 11.2918 11.7794 11.5231 11.2941 11.8695C10.8087 12.216 10.4087 12.6685 10.1244 13.1927C9.84011 13.717 9.67906 14.2991 9.65347 14.8949L9.65033 15.1251L9.7234 17.6001L7.36861 18.143C6.22908 18.4081 5.21281 19.051 4.48522 19.9672C3.75763 20.8834 3.36156 22.0189 3.36147 23.1889C3.36147 24.5621 3.90699 25.8791 4.87803 26.8502C5.84906 27.8212 7.16607 28.3667 8.53933 28.3667H16.9088V31.3132H8.53933C4.0529 31.3132 0.415039 27.6753 0.415039 23.1889C0.415039 19.3326 3.10218 16.1033 6.70625 15.272L6.70311 15.0646C6.70282 13.9956 6.95199 12.9413 7.4308 11.9855C7.90961 11.0297 8.60484 10.1989 9.46119 9.55904C10.3176 8.91919 11.3114 8.48801 12.3637 8.29978C13.416 8.11156 14.4977 8.17148 15.5228 8.4748C17.6811 5.15673 21.4219 2.96301 25.675 2.96301" fill="#383d71" />
                    </svg>
                    <p className='text-sm mb-1 mt-1'>Upload File</p>
                    <span className="text-center m-auto text-xs block"> (Only 'JPEG, WEBP, PNG and GIF' images will be accepted)</span>
                  </label>
                  <input type="file" accept="image/jpeg, image/png, image/webp" multiple className="input input-bordered w-full opacity-0 absolute inset-0" onChange={(e) => handleFileChange(e, index)} />
                  {/* onChange={handleFileChange} */}
                </div>
                {/* Thumbnails of selected images */}
                <div className='flex flex-wrap gap-4 items-center mt-5'>
                  {form.images.map((file, imgIndex) => (
                    <div key={index} className='shadow rounded p-2 relative'>
                      {/* Check if the file is an instance of File to create a URL */}
                      {file instanceof File ? (
                        <img src={URL.createObjectURL(file)} alt={`Uploaded file ${index}`} style={{ width: 50, height: 50, objectFit: 'cover' }} />
                      ) : (
                        <img src={file} alt={`Uploaded image ${index}`} style={{ width: 50, height: 50, objectFit: 'cover' }} />
                      )}
                      <button type='button' onClick={() => handleRemoveFile(index, imgIndex)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', position: 'absolute', right: '0', top: '0' }}>
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
                  <textarea
                    name="notes"
                    id="notes"
                    placeholder='Notes'
                    value={form.notes}
                    onChange={(e) => handleChange(e, 'notes', index)}
                    className="w-full p-3 border border-gray-300 rounded-md resize-y min-h-[100px] focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                  />

                  {/* <CKEditor
                editor={ClassicEditor as unknown as any}
                config={editorConfiguration}
                data={formData.notes}
                onChange={(event, editor) => {
                  const data = editor.getData();
                  handleChange({ target: { name: 'notes', value: data } }, 'notes');
                }}
              /> */}

                </div>
              </div>



              <div className="text-right">
                <button
                  type="button"
                  onClick={() => handleDeleteForm(index)}  // Call handleDeleteForm on button click
                  className={`text-red-500 shadow-lg rounded p-2 bg-red-100 ${jobForms.length > 1 ? '' : 'hidden'}`} // Add condition to hide the button when there's only 1 form
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M18 6L6 18M6 6L18 18" stroke="red" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              {userType !== 'single-technician' && (
                <>
                  <button
                    type="button"
                    onClick={fetchTechniciansOnClick}
                    className="primary-bg pl-5 pr-5 p-2 rounded block text-sm  ml-auto gap-2 min-w-[100px]"
                  >
                    Add More Technician?
                  </button>


                  <div className='mb-4 flex items-start gap-3 relative mt-3'>
                    <FormControl fullWidth size="small">
                      <FormLabel color="warning" className="mb-1">Assign Technicians(s) to this vehicle*</FormLabel>
                      <Paper variant="outlined" style={{ maxHeight: 200, overflowY: "auto" }}>
                        <List dense>
                          {technicians.map((tech) => {
                            const value = String(tech.id);
                            const isChecked = jobForms[index]?.assignTechnicians?.includes(value) || false;
                            const techDetails = jobForms[index]?.technicianDetails?.find((t: any) => String(t.id) === value) || tech;

                            // Determine which rate type to use based on technician type
                            const rateType = tech.techType === 'technician' ? 'techFlatRate' : 'rRate';
                            const rateValue = technicianPayRates[tech.id]?.[rateType] ||
                              techDetails[rateType] || '';

                            return (
                              <ListItem component="div" key={tech.id} className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-3 w-full">
                                  <Checkbox
                                    edge="start"
                                    color="warning"
                                    checked={isChecked}
                                    onChange={() => handleTechnicianChange(String(tech.id), index)}
                                    tabIndex={-1}
                                    disableRipple
                                  />
                                  <ListItemText primary={`${tech.firstName} ${tech.lastName} (${tech.techType})`} />
                                </div>
                                {tech.techType === 'technician' ? (
                                  <TextField
                                    size="small"
                                    type="number"
                                    name="techFlatRate"
                                    label="Flat Rate ($)"
                                    color="warning"
                                    value={rateValue}
                                    onChange={(e) => handlePayRateInput(tech.id, e.target.value, 'techFlatRate')}
                                    onClick={() => setActiveInput(tech.id)}
                                    style={{ maxWidth: '200px' }}
                                  />
                                ) : (
                                  <TextField
                                    size="small"
                                    type="number"
                                    label="R Rate ($)"
                                    name="rRate"
                                    color="warning"
                                    value={rateValue}
                                    onChange={(e) => handlePayRateInput(tech.id, e.target.value, 'rRate')}
                                    onClick={() => setActiveInput(tech.id)}
                                    style={{ maxWidth: '200px' }}
                                  />
                                )}
                                {activeInput === tech.id && buttonVisible[tech.id] !== false && (
                                  <div
                                    onClick={() => handlePayRateCheckbox(tech.id)}
                                    className='index-2 bg-blue p-2 text-xs rounded text-white cursor-pointer'
                                  >
                                    Save
                                  </div>
                                )}
                              </ListItem>
                            );
                          })}
                        </List>
                      </Paper>
                    </FormControl>
                  </div>
                </>
              )}






              {!hasVehicleInfo && userType !== 'ifs' && userType === 'single-technician' && (
                <div className="grid grid-cols-1 gap-4 mb-4 margin_remove relative">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon__tech">
                    <path d="M10 3V17" stroke="#5B5B99" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M13 5.5C13 4.1 11.6 3 10 3C8.4 3 7 4.1 7 5.5C7 6.9 8.4 8 10 8C11.6 8 13 9.1 13 10.5C13 11.9 11.6 13 10 13C8.4 13 7 11.9 7 10.5" stroke="#5B5B99" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="15" cy="15" r="3" stroke="#5B5B99" strokeWidth="1.5" />
                    <path d="M15 13V15L16.2 16" stroke="#5B5B99" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  <TextField fullWidth type='number' error={!!errors.labourCost} helperText={errors.labourCost || ''} name="labourCost" id="outlined-basic" color="warning" label="Labour Cost" size="small" value={form.labourCost} onChange={(e) => handleChange(e, 'labourCost', index)} required />
                </div>
              )}

            </div>


          ))}
          <div className="flex gap-4 justify-end mt-4 mb-4">
            {!isEdit && (
              <button type='button' onClick={() => handleAddVehicle(false)} className="primary-bg pl-5 pr-5 p-2 rounded">
                Add More Vehicle
              </button>
            )}
            <button
              type="button"
              onClick={() => handleAddVehicle(true)}
              className="primary-bg pl-5 pr-5 p-2 rounded flex items-center justify-center gap-2 min-w-[100px]"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    ></path>
                  </svg>
                  <span>Submitting...</span>
                </>
              ) : (
                isEdit ? 'Update & Submit' : 'Add & Submit'
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

