"use client";
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useRouter, usePathname, useSearchParams } from "next/navigation";
// import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
// import FormControl from '@mui/material/FormControl';
// import Select, { SelectChangeEvent } from '@mui/material/Select';
import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, Checkbox, ListItemText, OutlinedInput, InputAdornment, FormHelperText } from '@mui/material';
// import MenuItem from '@mui/material/MenuItem';
import Loader from '@/app/component/loader';
import Swal from 'sweetalert2';
import Delete from '../../../../../public/delete.svg'
import Image from 'next/image';
import Link from 'next/link';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import { BrowserMultiFormatReader } from '@zxing/browser';
import Breadcrumb from '@/app/component/breadcrumb';
import Scanner from './scanner'
// import { CKEditor } from '@ckeditor/ckeditor5-react';
// import type { Editor } from '@ckeditor/ckeditor5-core';
// import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
// import type { EditorConfig } from '@ckeditor/ckeditor5-core';
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
  payRate: string;
  amountPercentage: string;
  simpleFlatRate: string;
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
  simpleFlatRate: string;
  payRate: string;
  amountPercentage: string;
  payVehicleType: string;

}

interface UserVehicleData {
  payVehicleType: string;
  simpleFlatRate: string;
  amountPercentage: string;
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
  const [jobId, setJobId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);  // ✅ Track form submission state
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [userType, setUserType] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const hasVehicleInfo = searchParams?.has('vehicleInfo') ?? false;

  const [selectedTechnician, setSelectedTechnician] = useState<Technicians | null>(null);
  const [userVehicleData, setUserVehicleData] = useState<{ payVehicleType: string; simpleFlatRate: string } | null>(null);
  const userId = localStorage.getItem('userID');

  const [descriptionCostFields, setDescriptionCostFields] = useState<DescriptionCostField[]>([
    { id: crypto.randomUUID(), jobDescription: '', cost: '' },
  ]);
  const vehicleTypes = ['SUV', 'Sedan', 'Truck', 'Van', 'Motorcycle'];
  const [formData, setFormData] = useState<JobPayload>({
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
    payRate: '',
    simpleFlatRate: '',
    amountPercentage: '',
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
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/fetchSingleJobs?jobid=${jobid}`, {
        method: 'POST',
        headers,
      });

      const data = await response.json();

      if (response.ok && data.jobs) {
        const jobData = data.jobs;

        // Helper function to properly handle null/undefined/"null" values
        const getValidValue = (value: any) => {
          if (value === null || value === undefined || value === "null" || value === "") {
            return '';
          }
          return value;
        };

        // Process jobDescription
        const jobDescriptionsArray = Array.isArray(jobData.jobDescription)
          ? jobData.jobDescription.map((item: any) => ({
            id: crypto.randomUUID(),
            jobDescription: getValidValue(item.jobDescription),
            cost: getValidValue(item.cost),
          }))
          : [{ id: crypto.randomUUID(), jobDescription: '', cost: '' }];

        // Get first technician or empty object
        const technician = jobData.technicians?.[0] || {};

        // Improved fallback logic with proper null handling
        const isSimpleFlatRateValid =
          jobData.simpleFlatRate !== null &&
          jobData.simpleFlatRate !== undefined &&
          jobData.simpleFlatRate !== "null" &&
          jobData.simpleFlatRate !== "";

        const isAmountPercentageValid =
          jobData.amountPercentage !== null &&
          jobData.amountPercentage !== undefined &&
          jobData.amountPercentage !== "null" &&
          jobData.amountPercentage !== "";

        const fallbackAmountPercentage = getValidValue(
          isAmountPercentageValid || isSimpleFlatRateValid
            ? jobData.amountPercentage
            : technician.amountPercentage
        );

        const fallbackSimpleFlatRate = getValidValue(
          isAmountPercentageValid || isSimpleFlatRateValid
            ? jobData.simpleFlatRate
            : technician.simpleFlatRate
        );

        const fallbackLabourRate = getValidValue(
          jobData.simpleFlatRate !== null &&
            jobData.simpleFlatRate !== undefined &&
            jobData.simpleFlatRate !== "null" &&
            jobData.simpleFlatRate !== ""
            ? jobData.labourCost
            : technician.simpleFlatRate
        );



        const fallbackPayRate = getValidValue(
          jobData.payRate !== null &&
            jobData.payRate !== undefined &&
            jobData.payRate !== "null" &&
            jobData.payRate !== ""
            ? jobData.payRate
            : technician.payRate
        );

        const fallbackPayVehicleType = getValidValue(
          jobData.payVehicleType !== null &&
            jobData.payVehicleType !== undefined &&
            jobData.payVehicleType !== "null" &&
            jobData.payVehicleType !== ""
            ? jobData.payVehicleType
            : (technician.payVehicleType !== null &&
              technician.payVehicleType !== undefined &&
              technician.payVehicleType !== "null" &&
              technician.payVehicleType !== ""
              ? technician.payVehicleType
              : jobData.vehicleType // fallback to vehicleType here
            )
        );


        // Set form data
        setDescriptionCostFields(jobDescriptionsArray);
        setFormData((prev) => ({
          ...prev,
          vin: getValidValue(jobData.vin),
          make: getValidValue(jobData.make),
          model: getValidValue(jobData.model),
          modelYear: getValidValue(jobData.modelYear),
          manufacturerName: getValidValue(jobData.manufacturerName),
          vehicleDescriptor: getValidValue(jobData.vehicleDescriptor),
          vehicleType: getValidValue(jobData.vehicleType),
          jobDescription: jobDescriptionsArray,
          notes: getValidValue(jobData.notes),
          color: getValidValue(jobData.color),
          labourCost: fallbackLabourRate,
          assignTechnicians: jobData.technicians?.map((tech: any) => String(tech.id)) || [],
          payRate: fallbackPayRate,
          simpleFlatRate: fallbackSimpleFlatRate,
          amountPercentage: fallbackAmountPercentage,
          payVehicleType: fallbackPayVehicleType,
          assignCustomer: getValidValue(jobData.assignCustomer),
          createdBy: getValidValue(jobData.createdBy),
          plantCountry: getValidValue(jobData.plantCountry),
          plantCompanyName: getValidValue(jobData.plantCompanyName),
          plantState: getValidValue(jobData.plantState),
          bodyClass: getValidValue(jobData.bodyClass),
          schedule: jobData.schedule || false,
          ip: getValidValue(jobData.ip),
          jobId: getValidValue(jobData.id),
          images: jobData.images || [],
        }));

      } else {
        toast.error(data.error || 'Error fetching job data');
      }
    } catch (error) {
      console.error('Error fetching job data:', error);
      toast.error('An error occurred while fetching job data');
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


  const handleScroll = (e: any) => {
    const bottom = e.target.scrollTop + e.target.clientHeight >= e.target.scrollHeight;
    if (bottom && hasMore) {
      setPage(prev => prev + 1);
    }
  };


useEffect(() => {
  const roleType = localStorage.getItem('types');
  const userId = localStorage.getItem('userID');

  if (roleType) {
    fetchData('/api/fetchJobCustomerTechnician', setTechnicians, {
      endpoint: 'fetchTechnicianJob',
      types: roleType,
    });
  } else {
    console.error("Role type is missing for fetching technicians!");
  }

  if (userId) {
    fetchData('/api/fetchJobCustomerTechnician', setCustomer, {
      endpoint: 'fetchCustomer',
      userId,
      page: page.toString(),
      limit: '10'
    }, page > 1);
  }
}, [page]);





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

  const fetchVehicleDetails = async (vin: string) => {
    if (!vin) {
      toast.error("Please enter a VIN to fetch vehicle details.");
      setFormData(prev => ({
        ...prev,
        vehicleDescriptor: "",
        manufacturerName: "",
        vin: "",
        make: "",
        model: "",
        modelYear: "",
        vehicleType: "",
      }));
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVIN/${vin}?format=json`);
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
          vin: vin  // Retain manually entered VIN
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
    if (field === 'cost') {
      // Regex to allow up to 2 decimal places
      const regex = /^\d+(\.\d{0,2})?$/;
      if (!regex.test(value)) return; // Reject invalid input
    }
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

    if (errors.jobDescription) {
      const allFieldsFilled = descriptionCostFields.every(
        field => field.jobDescription.trim() && field.cost.trim()
      );

      if (allFieldsFilled) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.jobDescription;
          return newErrors;
        });
      }
    }

  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};
    if (!formData.vin.trim()) newErrors.vin = 'VIN is required';
    if (!formData.vehicleDescriptor.trim()) newErrors.vehicleDescriptor = 'Vehicle Descriptor is required';
    if (!formData.color.trim()) newErrors.color = 'Color is required';
    if (!String(formData.assignCustomer).trim()) {
      newErrors.assignCustomer = 'Customer is required';
    }
    // if (!formData.payRate.trim()) newErrors.payRate = 'Pay Rate is required';



    // Additional validations for edit mode
    // if (isEdit) {
    //   if (!formData.labourCost.trim()) newErrors.labourCost = 'Labour Cost is required';
    //   if (!formData.payVehicleType.trim()) newErrors.payVehicleType = 'Pay Vehicle Type is required';
    //   if (!formData.simpleFlatRate.trim()) newErrors.simpleFlatRate = 'Simple Flat Rate is required';
    //   if (!formData.amountPercentage.trim()) newErrors.amountPercentage = 'Amount Percentage is required';
    //   if (!formData.payRate.trim()) newErrors.payRate = 'Pay Rate is required';
    // }

    // If any errors, update state and return
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    const token = localStorage.getItem('token');
    const formDataObj = new FormData();
    const roleType = localStorage.getItem('types');
    const userId = localStorage.getItem('userID');
    const technicianData = localStorage.getItem('technicianData');
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
    formDataObj.append('labourCost', formData.labourCost);
    formDataObj.append('payVehicleType', formData.payVehicleType);
    formDataObj.append('simpleFlatRate', formData.simpleFlatRate);
    formDataObj.append('amountPercentage', formData.amountPercentage);
    formDataObj.append('payRate', formData.payRate);
    let estimatedByName = '';
    if (technicianData) {
      try {
        const parsed = JSON.parse(technicianData);
        estimatedByName = `${parsed.firstName} ${parsed.lastName}`;
      } catch (err) {
        console.error('Failed to parse technicianData:', err);
      }
    }

    formDataObj.append('estimatedBy', estimatedByName);

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
    if (isEdit && jobId) {
      assignTechnicians.forEach((id) => {
        formDataObj.append('technicianId[]', id); // send technicianId as an array
      });


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
      const endpoint = isEdit ? `/api/jobCreateUpdate` : `/api/jobCreateUpdate`;
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
        if (searchParams!.has('completeOrder')) {
          router.push('/jobs/complete-job/listing');
        } else if (searchParams!.has('vehicleInfo')) {
          router.push('/reporting/vehicle-info')
        } else if (searchParams!.has('groupjob')) {
          router.push('/jobs/job-group/listing')
        } else {
          router.push('/jobs/active-job');
        }
      } else {
        if (result.error && result.error.includes("Duplicate VIN")) {
          setSubmitting(false);
          const result = await Swal.fire({
            title: 'Duplicate VIN found',
            text: 'Would you like to create new VIN details or re-enter?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#383d71',
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
          if (result.error) {
            if (result.error.toLowerCase().includes('technician')) {
              setErrors(prev => ({ ...prev, assignTechnicians: result.error }));
            } else {
              toast.error(result.error || 'Error fetching job data');
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
  };

  const handleChange = (event: any, key: any, target = 'formData') => {
    const value = event.target.value;

    // Regex validation for simpleFlatRate
    if (key === 'simpleFlatRate') {
      const regex = /^\d{0,5}(\.\d{0,2})?$/;
      if (value !== '' && !regex.test(value)) return;
    }

    let shouldUpdate = true;

    // Validation for amountPercentage
    if (key === 'amountPercentage') {
      const num = Number(value);
      if (isNaN(num) || num < 0 || num > 100) {
        shouldUpdate = false;
        setErrors((prev) => ({
          ...prev,
          amountPercentage: 'Value must be between 0 and 100',
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          amountPercentage: '',
        }));
      }
    }

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

    // Update state based on the target
    if (target === 'vehicleData') {
      setVehicleData((prev: VehicleData) => ({ ...prev, [key]: value }));
    } else {
      setFormData((prev) => ({ ...prev, [key]: value }));
    }
  };




  const handleSelectChange = (event: SelectChangeEvent<string>, field: string) => {
    const value = event.target.value;
    if (field === 'payRate') {
      // Reset related fields when payRate changes
      setFormData(prev => ({
        ...prev,
        payRate: value,
        vehicleType: '',
        payVehicleType: '',      // Also clear payVehicleType
        amountPercentage: value === 'Simple Percentage' ? prev.amountPercentage : '',
        simpleFlatRate: value === 'Simple Flat Rate' ? prev.simpleFlatRate : '',
      }));

      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.payRate;
        delete newErrors.amountPercentage;
        delete newErrors.simpleFlatRate;
        delete newErrors.vehicleType;
        delete newErrors.payVehicleType;
        return newErrors;
      });

      return;
    }

    if (field === 'payVehicleType' && selectedTechnician) {
      let flatRateObj: Record<string, number | string> = {};

      try {
        flatRateObj = JSON.parse(selectedTechnician.simpleFlatRate);
      } catch (error) {
        console.error("Error parsing simpleFlatRate JSON", error);
      }

      const newSimpleFlatRate = flatRateObj[value] || '';

      setFormData(prev => ({
        ...prev,
        payVehicleType: value,
        simpleFlatRate: newSimpleFlatRate.toString(),
      }));

      if (errors.payVehicleType) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.payVehicleType;
          return newErrors;
        });
      }

      return;
    }
    if (field === 'payVehicleType' && selectedTechnician) {
      // Parse simpleFlatRate JSON from selected technician
      let flatRateObj: Record<string, number | string> = {};

      try {
        flatRateObj = JSON.parse(selectedTechnician.simpleFlatRate);
      } catch (error) {
        console.error("Error parsing simpleFlatRate JSON", error);
      }

      const newSimpleFlatRate = flatRateObj[value] || ''; // get flat rate for selected vehicle type

      setFormData(prev => ({
        ...prev,
        payVehicleType: value,
        simpleFlatRate: newSimpleFlatRate.toString(),
      }));

      if (errors.payVehicleType) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.payVehicleType;
          return newErrors;
        });
      }

      return; // done, exit early
    }

    // For other fields, default behavior
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };




  const handleSelectColor = (event: SelectChangeEvent<string>, field: string) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Special handler for multiple select (technicians):
  const handleTechnicianChange = (event: SelectChangeEvent<string[]>) => {
    const {
      target: { value },
    } = event;

    const newTechnicians = typeof value === 'string' ? value.split(',') : value.map(String);
    setFormData(prev => ({
      ...prev,
      assignTechnicians: newTechnicians
    }));

    if (newTechnicians.length === 1) {
      const tech = technicians.find(t => String(t.id) === newTechnicians[0]) || null;
      setSelectedTechnician(tech);

      if (tech) {
        // Update payRate based on selected technician
        const payRate = tech.payRate || '';  // e.g. "Pay Per Vehicles", "Simple Flat Rate", etc.

        // For payVehicleType and simpleFlatRate, you already have code:
        let vehicleTypesArray = [];
        if (tech.payVehicleType) {
          vehicleTypesArray = tech.payVehicleType.split(',').map((v: string) => v.trim());
        }
        const firstVehicleType = vehicleTypesArray[0] || '';

        // Parse simpleFlatRate JSON safely
        let flatRateObj: Record<string, string> = {};
        try {
          flatRateObj = JSON.parse(tech.simpleFlatRate);
        } catch {
          flatRateObj = {};
        }
        const firstFlatRate = flatRateObj[firstVehicleType] || '';

        // Update formData with payRate, payVehicleType and simpleFlatRate from technician
        setFormData(prev => ({
          ...prev,
          payRate: payRate,
          payVehicleType: firstVehicleType,
          simpleFlatRate: firstFlatRate.toString(),
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          payRate: '',
          payVehicleType: '',
          simpleFlatRate: '',
        }));
      }
    } else {
      setSelectedTechnician(null);
      setFormData(prev => ({
        ...prev,
        payRate: '',
        payVehicleType: '',
        simpleFlatRate: '',
      }));
    }

    if (newTechnicians.length > 0 && errors.assignTechnicians) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.assignTechnicians;
        return newErrors;
      });
    }
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
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const files = e.target.files ? Array.from(e.target.files) : [];

    // Filter out unwanted file types
    const validImageFiles = files.filter(file => acceptedTypes.includes(file.type));

    if (validImageFiles.length === 0) {
      toast.error("Please upload only JPEG, PNG, or WEBP images.");
      return;
    }

    // Check total images won't exceed 5
    const currentImageCount = formData.images.length;
    const newImageCount = validImageFiles.length;

    if (currentImageCount + newImageCount > 5) {
      toast.error(`You can only upload up to 5 images. You already have ${currentImageCount} images.`);
      return;
    }

    const maxWidth = 800;
    const maxHeight = 600;
    const quality = 0.7;

    const compressions = validImageFiles.map(file =>
      compressImage(file, maxWidth, maxHeight, quality)
    );

    Promise.all(compressions)
      .then(compressedFiles => {
        setFormData((prev: any) => ({
          ...prev,
          images: [...prev.images, ...compressedFiles].slice(0, 5), // Ensure max 5 images
        }));
      })
      .catch(error => {
        console.error('Compression error:', error);
        toast.error('Failed to compress images.');
      });
  };



  // Remove a specific image
  const handleRemoveFile = async (index: number) => {
    try {
      const imageToRemove = formData.images[index];
      // Check if imageToRemove is a string (uploaded URL) or File instance
      if (typeof imageToRemove === 'string' && formData.jobId) {
        // Call API to delete the image from backend
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
        const token = localStorage.getItem('token');

        const payload = {
          jobId: formData.jobId,
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
          return; // stop removal on failure
        }

        toast.success('Image deleted successfully.');
      }

      // Remove image locally regardless of file or URL (if API call was not needed or succeeded)
      setFormData((prev) => {
        const newImages = prev.images.filter((_, i) => i !== index);
        return { ...prev, images: newImages };
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('An error occurred while deleting the image.');
    }
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
                const detectedVin = result.getText();
                console.log('Barcode Detected:', detectedVin); // ✅ Use getText()
                setFormData((prev) => ({
                  ...prev,
                  vin: detectedVin, // ✅ Corrected
                }));
                console.log(detectedVin, 'formData.vinformData.vin')
                setTimeout(() => {
                  fetchVehicleDetails(detectedVin);
                }, 100);
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


  const handleScan = (vin: string) => {
    setFormData((prev) => ({ ...prev, vin }));
    setTimeout(() => {
      fetchVehicleDetails(vin);
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
        // data.vehicleTypes is expected to have payVehicleType and simpleFlatRate
        setUserVehicleData({
          payVehicleType: data.technician.payVehicleType, // e.g. "Van,Truck"
          simpleFlatRate: data.technician.simpleFlatRate, // e.g. "{\"Van\":900}"
        });
      } else {
        toast.error('Failed to fetch vehicle data.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error fetching vehicle data.');
    }
  };

  // Split vehicle types string into array for options
  const vehicleTypeOptions = userVehicleData?.payVehicleType
    ? userVehicleData.payVehicleType.split(',').map(v => v.trim())
    : [];

  // On vehicle type select, update simpleFlatRate based on JSON
  const handleVehicleTypeChange = (event: SelectChangeEvent<string>) => {
    const selectedType = event.target.value;
    setFormData(prev => ({
      ...prev,
      payVehicleType: selectedType,
      simpleFlatRate: '', // reset before setting
    }));

    if (userVehicleData?.simpleFlatRate) {
      try {
        const flatRateObj = JSON.parse(userVehicleData.simpleFlatRate);
        const rate = flatRateObj[selectedType] || '';
        setFormData(prev => ({
          ...prev,
          simpleFlatRate: rate.toString(),
        }));
      } catch (e) {
        console.error('Failed to parse simpleFlatRate JSON:', e);
        setFormData(prev => ({ ...prev, simpleFlatRate: '' }));
      }
    }
  };


  // const editorConfiguration: EditorConfig = {
  //   toolbar: [
  //     'heading',     // h1, h2, h3 etc.
  //     '|',
  //     'bold',
  //     'italic',
  //     'bulletedList',  // ul
  //     'numberedList',  // ol
  //     'link',
  //     'undo',
  //     'redo'
  //   ],
  //   heading: {
  //     options: [
  //       {
  //         model: 'paragraph',
  //         title: 'Paragraph',
  //         class: 'ck-heading_paragraph',
  //       },
  //       {
  //         model: 'heading1',
  //         view: 'h1',
  //         title: 'Heading 1',
  //         class: 'ck-heading_heading1'
  //       },
  //       {
  //         model: 'heading2',
  //         view: 'h2',
  //         title: 'Heading 2',
  //         class: 'ck-heading_heading2'
  //       },
  //       {
  //         model: 'heading3',
  //         view: 'h3',
  //         title: 'Heading 3',
  //         class: 'ck-heading_heading3'
  //       }
  //     ]
  //   }
  // };


  return (
    <div className='w-[60%] m-auto mb-5'>
      <Breadcrumb
        items={[
          isEdit
            ? { label: 'Edit Work Order' }
            : { label: 'Create New Work Order', href: '/jobs/create-job/create' },
        ]}
      />
      <h1 className="text-lg leading-6 font-bold text-gray-900"> {isEdit ? 'Edit Work Order' : 'Create New Work Order'}</h1>
      {/* <p className='text-sm'>Onboard clients effortlessly for seamless collaboration!</p> */}
      <div className='bg-white p-4 mt-5 '>

        <form className="" onSubmit={handleSubmit}>
          <div className="grid grid-cols-3 gap-4 mb-4" style={{ display: 'none' }}>
            <FormControl fullWidth >
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
              <FormControl fullWidth >
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
              <FormControl fullWidth >
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

                    <TextField fullWidth name="vin" id="outlined-basic" color="warning" label="Enter vin number *" size="small" value={formData.vin} onChange={(e) => handleChange(e, 'vin')} inputProps={{ maxLength: 17 }} />
                    {errors.vin && (
                      <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                        {errors.vin}
                      </div>
                    )}
                  </div>
                  <button type="button" onClick={() => fetchVehicleDetails(formData.vin)} className="primary-bg pl-5 pr-5 p-2 text-sm  w-[200px] rounded">Fetch</button>
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
                  <Scanner onScan={handleScan} />
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
          <div>
            {formData && (
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
                      value={formData.vehicleDescriptor || ''}
                      onChange={(e) => handleChange(e, 'vehicleDescriptor')}

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
                      value={formData.make || ''}
                      onChange={(e) => handleChange(e, 'make')}

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
                      value={formData.manufacturerName || ''}
                      onChange={(e) => handleChange(e, 'manufacturerName')}

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
                      value={formData.model || ''}
                      onChange={(e) => handleChange(e, 'model')}

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
                      value={formData.modelYear || ''}
                      onChange={(e) => handleChange(e, 'modelYear')}

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
                      value={formData.vehicleType || ''}
                      onChange={(e) => handleChange(e, 'vehicleType')}

                    />
                  </div>
                </div>
              </div>

            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className='mb-4 relative'>


              <FormControl fullWidth size="small">
                <InputLabel id="color" color="warning">Select color *</InputLabel>
                <Select
                  labelId="color"
                  id="select-color"
                  value={formData.color}
                  label="Select color"
                  name="color"
                  color="warning"
                  onChange={(event) => handleSelectColor(event, 'color')}
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
            <div className='mb-4 flex items-start gap-3 relative' >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon__tech">
                <circle cx="10" cy="6" r="3" stroke="#5B5B99" strokeWidth="1.5" />
                <path d="M5 16C5 13.8 7 12 10 12C13 12 15 13.8 15 16" stroke="#5B5B99" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
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

                  onChange={(event) => handleSelectChange(event, 'assignCustomer')}

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
                    <MenuItem key={customer.id} value={customer.id}>{customer.firstName} {customer.lastName}</MenuItem>
                  ))}
                </Select>
                {errors.assignCustomer && (
                  <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                    {errors.assignCustomer}
                  </div>
                )}
              </FormControl>
              <Link href='/client/create' data-tooltip-id="create-customer"
                data-tooltip-content="Create Customer" className='primary-bg text-sm p-2 rounded'>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg">
                  <line x1="12" y1="5" x2="12" y2="19" stroke="white" strokeWidth="2" />
                  <line x1="5" y1="12" x2="19" y2="12" stroke="white" strokeWidth="2" />
                </svg>

              </Link>
              <Tooltip id="create-customer" place="top" />

            </div>
            {userType !== 'single-technician' && userType !== 'ifs' && (
              <div className='mb-4 flex items-start gap-3 relative'>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon__tech">
                  <circle cx="10" cy="6" r="3" stroke="#5B5B99" strokeWidth="1.5" />
                  <path d="M5 16C5 13.8 7 12 10 12C13 12 15 13.8 15 16" stroke="#5B5B99" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {/* <p className='text-sm mb-2'>Assign Technician <span className='text-[red]'>*</span></p> */}
                <FormControl fullWidth size="small" error={!!errors.assignTechnicians}>
                  <InputLabel id="assignTechnicians" color="warning">Select technicians *</InputLabel>

                  <Select
                    labelId="assignTechnicians"
                    id="select-assignTechnicians"
                    color="warning"
                    label="Select technicians"

                    value={formData.assignTechnicians}
                    onChange={handleTechnicianChange}
                    renderValue={(selected) => selected.map(id => {
                      const tech = technicians.find(tech => String(tech.id) === id);
                      return tech ? `${tech.firstName} ${tech.lastName}` : undefined;
                    }).filter(Boolean).join(', ')}
                  >
                    {technicians.map((tech) => (
                      <MenuItem key={tech.id} value={String(tech.id)}>
                        <ListItemText primary={`${tech.firstName} ${tech.lastName}`} />
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.assignTechnicians && (
                    <FormHelperText>{errors.assignTechnicians}</FormHelperText>
                  )}
                </FormControl>
                <Link href='/technicians/create-technician' data-tooltip-id="create-technician"
                  data-tooltip-content="Create Technician" className='primary-bg text-sm p-2 rounded'>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg">
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

                  placeholder='Enter Description' className="input text-[#3a3a3a] text-xs mt-1 input-bordered w-full p-3 rounded border" ></textarea>

              </div>
              <div className="mb-2 flex items-center gap-3 margin_remove">
                <FormControl fullWidth sx={{ m: 1 }} size="small" color="warning">
                  <InputLabel htmlFor={`cost-${index}`}>Cost</InputLabel>
                  <OutlinedInput
                    id={`cost-${index}`}
                    value={field.cost}
                    onChange={(e) => {
                      const value = e.target.value;

                      // Allow empty string for deletion
                      if (value === "") {
                        handleDescriptionCostChange(index, "cost", value);
                        return;
                      }

                      // Allow only numbers and decimal
                      if (!/^\d*\.?\d*$/.test(value)) return;

                      // Split integer and decimal parts
                      const [intPart, decPart] = value.split(".");

                      // Enforce the limit: 5 digits max before decimal and 2 digits max after decimal
                      if (intPart.length <= 5 && (!decPart || decPart.length <= 2)) {
                        handleDescriptionCostChange(index, "cost", value);
                      }
                    }}
                    startAdornment={<InputAdornment position="start">$</InputAdornment>}
                    label="Amount"
                    type="text"
                    inputProps={{
                      inputMode: "decimal", // shows numeric keyboard on mobile
                    }}

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
          {!hasVehicleInfo && userType !== 'single-technician' && (
            <div className="grid grid-cols-3 gap-4">

              <div className=' relative'>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon__tech">
                  <path d="M10 3V17" stroke="#5B5B99" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M13 5.5C13 4.1 11.6 3 10 3C8.4 3 7 4.1 7 5.5C7 6.9 8.4 8 10 8C11.6 8 13 9.1 13 10.5C13 11.9 11.6 13 10 13C8.4 13 7 11.9 7 10.5" stroke="#5B5B99" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="15" cy="15" r="3" stroke="#5B5B99" strokeWidth="1.5" />
                  <path d="M15 13V15L16.2 16" stroke="#5B5B99" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                <FormControl fullWidth size="small" >
                  <InputLabel id="payRate" color="warning">Select pay rate(R/1/R/R)</InputLabel>
                  <Select
                    labelId="payRate"
                    color="warning"
                    id="select-payRate"
                    value={formData.payRate}
                    label="Select pay rate(R/1/R/R)"
                    name="payRate"
                    onChange={(event) => handleSelectChange(event, 'payRate')}
                  >
                    <MenuItem value='Pay Per Vehicles'>Pay Per Vehicle</MenuItem>
                    <MenuItem value='Pay Per Job'>Pay Per Job</MenuItem>
                    <MenuItem value='Simple Flat Rate'>Simple Flat Rate</MenuItem>
                    <MenuItem value='Simple Percentage'>Simple Percentage</MenuItem>

                  </Select>
                </FormControl>
              </div>
              {(formData.payRate === 'Pay Per Vehicles') && (
                <div className='mb relative'>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon__tech">
                    <path d="M3 11V9L5.5 5H14.5L17 9V11H3Z" stroke="#5B5B99" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="6" cy="14" r="1.2" fill="#5B5B99" />
                    <circle cx="14" cy="14" r="1.2" fill="#5B5B99" />
                  </svg>
                  <FormControl fullWidth size="small" className="mt-4" error={!!errors.payVehicleType}>
                    <InputLabel id="payVehicleType" color="warning">Select Vehicle Type</InputLabel>
                    {userType !== 'ifs' && (
                      <Select
                        labelId="payVehicleType"
                        color="warning"
                        id="select-payVehicleType"
                        value={formData.payVehicleType}
                        label="payVehicleType"
                        name="payVehicleType"
                        onChange={(event) => handleSelectChange(event, 'payVehicleType')}
                      >
                        {vehicleTypes.map((type) => (
                          <MenuItem key={type} value={type}>{type}</MenuItem>
                        ))}
                      </Select>
                    )}
                    {userType === 'ifs' && (
                      <Select
                        labelId="payVehicleType"
                        color="warning"
                        id="select-payVehicleType"
                        value={formData.payVehicleType}
                        label="payVehicleType"
                        name="payVehicleType"
                        onChange={handleVehicleTypeChange}
                      >
                        {vehicleTypeOptions.map(type => (
                          <MenuItem key={type} value={type}>{type}</MenuItem>
                        ))}
                      </Select>
                    )}
                    {errors.payVehicleType && (
                      <FormHelperText>{errors.payVehicleType}</FormHelperText>
                    )}
                  </FormControl>
                </div>
              )}

              {(formData.payRate === 'Simple Percentage' || formData.payRate === 'Pay Per Job') && (
                <div className=' relative'>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon__tech">
                    <path d="M10 3V17" stroke="#5B5B99" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M13 5.5C13 4.1 11.6 3 10 3C8.4 3 7 4.1 7 5.5C7 6.9 8.4 8 10 8C11.6 8 13 9.1 13 10.5C13 11.9 11.6 13 10 13C8.4 13 7 11.9 7 10.5" stroke="#5B5B99" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="15" cy="15" r="3" stroke="#5B5B99" strokeWidth="1.5" />
                    <path d="M15 13V15L16.2 16" stroke="#5B5B99" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  <TextField fullWidth type='number' name="amountPercentage" id="outlined-basic" color="warning" label="Simple Percentage" size="small" value={formData.amountPercentage} inputProps={{ min: 0, max: 100 }} onChange={(e) => handleChange(e, 'amountPercentage')} disabled={!!formData.simpleFlatRate && (!isEdit || !formData.amountPercentage)} />
                </div>
              )}
              {formData.payRate !== 'Simple Percentage' && (formData.payRate === 'Pay Per Vehicles' || formData.payRate === 'Simple Flat Rate' || formData.payRate === 'Pay Per Job') && (
                <div className=' relative'>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon__tech">
                    <path d="M10 3V17" stroke="#5B5B99" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M13 5.5C13 4.1 11.6 3 10 3C8.4 3 7 4.1 7 5.5C7 6.9 8.4 8 10 8C11.6 8 13 9.1 13 10.5C13 11.9 11.6 13 10 13C8.4 13 7 11.9 7 10.5" stroke="#5B5B99" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="15" cy="15" r="3" stroke="#5B5B99" strokeWidth="1.5" />
                    <path d="M15 13V15L16.2 16" stroke="#5B5B99" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  <TextField fullWidth type='number' error={!!errors.simpleFlatRate} helperText={errors.simpleFlatRate || ''} name="simpleFlatRate" id="outlined-basic" color="warning" label="Simple Flat Rate" size="small" value={formData.simpleFlatRate} onChange={(e) => handleChange(e, 'simpleFlatRate')}
                    inputProps={{
                      step: "0.01",
                      min: 0
                    }} disabled={!!formData.amountPercentage && (!isEdit || !formData.simpleFlatRate)} />
                </div>
              )}
            </div>
          )}
          {!hasVehicleInfo && isEdit && userType !== 'ifs' && userType === 'single-technician' && (
            <div className="grid grid-cols-1 gap-4 mb-4 margin_remove relative">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon__tech">
                <path d="M10 3V17" stroke="#5B5B99" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M13 5.5C13 4.1 11.6 3 10 3C8.4 3 7 4.1 7 5.5C7 6.9 8.4 8 10 8C11.6 8 13 9.1 13 10.5C13 11.9 11.6 13 10 13C8.4 13 7 11.9 7 10.5" stroke="#5B5B99" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="15" cy="15" r="3" stroke="#5B5B99" strokeWidth="1.5" />
                <path d="M15 13V15L16.2 16" stroke="#5B5B99" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <TextField fullWidth type='number' error={!!errors.labourCost} helperText={errors.labourCost || ''} name="labourCost" id="outlined-basic" color="warning" label="Labour Cost" size="small" value={formData.labourCost} onChange={(e) => handleChange(e, 'labourCost')} required />
            </div>
          )}
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
              <input type="file" accept="image/jpeg, image/png, image/webp" multiple className="input input-bordered w-full opacity-0 absolute inset-0" onChange={handleFileChange} />
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
                  <button type='button' onClick={() => handleRemoveFile(index)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', position: 'absolute', right: '0', top: '0' }}>
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
                value={formData.notes}
                onChange={(e) => handleChange(e, 'notes')}
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

          <div className="text-right mt-4 mb-4">

            <button
              type="submit"
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
                'Submit'
              )}
            </button>
          </div>
        </form>


      </div>
    </div>
  );
}

