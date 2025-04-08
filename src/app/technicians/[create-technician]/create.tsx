"use client";
import React, { useState, useEffect } from 'react';
import { Country, State } from 'country-state-city';
import { ICountry, IState } from 'country-state-city';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Loader from '@/app/component/loader';
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css' // For basic styling
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import Share from '../../../../public/share.png';
import Image from 'next/image';
import Eye from "../../../../public/eye.svg";
import EyeOff from '../../../../public/eye-off.svg';
import Breadcrumb from '@/app/component/breadcrumb';
interface TechnicianForm {
  id?: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  secondaryContactName: string;
  email: string;
  address: string;
  country: string;
  state: string;
  city: string;
  zipCode: string;
  secondaryEmail?: string;
  password: string;
  confirmPassword: string;
  payRate: string;
  taxForms: File[];
  image: File | null;
  amountPercentage: string;
  role: string;
  types: string;
  agreeTerms: string;

}
export default function Technicians() {
  const router = useRouter();
  const pathname = usePathname();
  // const { id } = router.query;
  // console.log(id,'dddddddddddddd')
  const [submitting, setSubmitting] = useState<boolean>(false);  // ✅ Track form submission state
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isEdit, setIsEdit] = useState<boolean>(false); // To differentiate between create and edit 
  const [copied, setCopied] = useState(false);
  const [domain, setDomain] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConformPassword, setShowConformPassword] = useState(false);
  const searchParams = useSearchParams();
  const [roles, setRoles] = useState<any[]>([]);
  const isSingleTechnician = searchParams.has('singletechnician');
 
  const [formData, setFormData] = useState<TechnicianForm>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    address: '',
    country: '',
    state: '',
    city: '',
    zipCode: '',
    secondaryContactName: '',
    secondaryEmail: '',
    password: '',
    confirmPassword: '',
    payRate: '',
    taxForms: [],
    image: null,
    amountPercentage: '',
    role: 'technician',
    types: 'superadmin',
    agreeTerms: 'true',
  });


  const fetchTechnicianData = async (technicianId: string) => {
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
      const response = await fetch(`${apiUrl}/fetchSingleTechnician?technicianId=${technicianId}`, {
        method: 'POST',
        headers,
      });
      if (response.status == 400) {
        localStorage.removeItem('token');
        router.push('/');
      }
      const data = await response.json();

      if (response.ok) {
        setFormData(prev => ({
          ...prev,
          ...data.technician,
          id: technicianId,
          password: '',
          taxForms: data.technician.taxForms || [],
        }));
        console.log(formData, 'formDataformData')
      } else {
        toast.error(data.error || 'Error fetching technician data');
      }
    } catch (error) {
      toast.error('An error occurred while fetching technician data');
    }
  };
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const techId = searchParams.get('technicianId') || '';
      if (techId) {
        setIsEdit(true);  // Set to true if `technicianId` exists in the URL
        fetchTechnicianData(techId);
      } else {
        setIsEdit(false); // Set to false if `technicianId` is missing
      }
    }
  }, []);
  const handleSelectChange = (
    event: SelectChangeEvent<string>,
    child: React.ReactNode // You might not actually need to use this parameter in your function
  ) => {
    const name = event.target.name; // The name of the select element if you set it
    const value = event.target.value;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    if (name === "role") {
      const selectedRole = roles.find((role) => role.name === value);
      setFormData((prev) => ({
        ...prev,
        role: value,
        types: selectedRole ? selectedRole.type : "", // Auto-fill role type
      }));
    }
  };

  const handleChange: React.ChangeEventHandler<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement> = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'confirmPassword') {
      validateConfirmPassword(value);
    }
  };
  const validateConfirmPassword = (confirmPassword: string) => {
    if (confirmPassword !== formData.password) {
      setErrors(prev => ({
        ...prev,
        confirmPassword: 'Passwords do not match'
      }));
    } else {
      setErrors(prev => ({
        ...prev,
        confirmPassword: ''
      }));
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
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    const maxWidth = 800; // Maximum image width
    const maxHeight = 600; // Maximum image height
    const quality = 0.7; // Compression quality

    const imageFiles = files.filter(file => file instanceof File && file.type.startsWith('image/'));
    const pdfFiles = files.filter(file => file instanceof File && file.type === 'application/pdf');


    try {
      // Compress image files
      const compressedImages = await Promise.all(
        imageFiles.map(async (file) => {
          const compressedBlob = await compressImage(file, maxWidth, maxHeight, quality);

          if (!(compressedBlob instanceof Blob)) {
            throw new Error("Compression failed: Not a Blob");
          }

          // Convert Blob back to File
          return new File([compressedBlob], file.name, { type: file.type });
        })
      );

      // Combine compressed images and PDFs into one array
      const allFiles = [...compressedImages, ...pdfFiles];

      // Update state with new files
      setFormData((prev: any) => ({ ...prev, taxForms: [...(prev.taxForms || []), ...allFiles] }));
    } catch (error) {
      console.error('Compression error:', error);
      toast.error('Failed to process files.');
    }
  };


  // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const files = e.target.files ? Array.from(e.target.files) : []; // Convert FileList to array
  //   setFormData(prev => ({ ...prev, taxForms: files }));
  // };

  const handleRemoveFile = (index: number) => {
    const newFiles = formData.taxForms.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, taxForms: newFiles }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.confirmPassword !== formData.password) {
      setErrors(prev => ({
        ...prev,
        confirmPassword: 'Passwords do not match'
      }));
      return; // Stop the function if passwords do not match
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    const formDataObj = new FormData();
    Object.keys(formData).forEach(key => {
      if (key === 'confirmPassword') {
        // Skip confirmPassword, do not append to FormData
        return;
      }
      if (key === 'taxForms' && formData[key]) {
        formData[key].forEach(file => {
          formDataObj.append('taxForms', file); // Append each file to FormData
        });
      } else if (key !== 'image') {
        formDataObj.append(key, String(formData[key as keyof TechnicianForm])); // Convert all values to string
      }
    });
    if (formData.image) {
      formDataObj.append('image', formData.image);
    }
    const types = localStorage.getItem('types');
    if (types) {
      formDataObj.set('types', formData.types || ''); // `set` replaces if exists, preventing duplicates
    } else {
      toast.error("User types not found!");
      return;
    }
    if (isEdit && formData.id) {
      formDataObj.append('technicianId', formData.id);  // Append the ID correctly
    }
    // Create headers object
    const headers: Record<string, string> = {};
    // If token exists, add it to Authorization header

    if (isEdit) {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    try {
      setSubmitting(true);
      const response = await fetch(`${apiUrl}/${isEdit ? 'updateTechnician' : 'register'}`, {
        method: 'POST',
        body: formDataObj, // Send the FormData object without setting Content-Type header
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setErrors(prev => ({ ...prev, ...data.errors }));
          Object.values(data.errors).forEach(error => {
            toast.error(data.error);
          });
        } else if (data.error) {
          setErrors(prev => ({ ...prev, general: data.error }));
          toast.error(data.error);
        }
      } else {
        toast.success(data.message);
        if (searchParams.has('singletechnician')) {
          router.push('/single-technicians/listing');
        } else {
          router.push('/technicians/listing');
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'An unexpected error occurred');
    } finally {
      setSubmitting(false);  // ✅ Hide loader when done
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; // Sirf ek file lene ke liye
    if (!file) return;

    const maxWidth = 800; // Maximum image width
    const maxHeight = 600; // Maximum image height
    const quality = 0.7; // Compression quality

    try {
      const compressedFile = await compressImage(file, maxWidth, maxHeight, quality);
      setFormData((prev: any) => ({ ...prev, image: compressedFile }));
    } catch (error) {
      console.error('Compression error:', error);
      toast.error('Failed to compress image.');
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev: any) => ({ ...prev, image: null }));
  };


  const handlePhoneChange = (value: string | undefined) => {
    if (!value) return;

    // Extracting country code and formatting phone number
    const parsedNumber = parsePhoneNumberFromString(value);
    if (parsedNumber) {
      const countryCode = parsedNumber.countryCallingCode; // Example: "91" for India
      const nationalNumber = parsedNumber.nationalNumber; // Example: "983274663"

      // Formatting as "+91-983274663"
      const formattedPhoneNumber = `+${countryCode}-${nationalNumber}`;

      setFormData((prev) => ({
        ...prev,
        phoneNumber: formattedPhoneNumber,
      }));
    }
  };
  useEffect(() => {
    // ✅ Get current domain dynamically
    if (typeof window !== "undefined") {
      setDomain(window.location.origin);
    }
  }, []);

  const handleCopy = () => {
    const link = `${domain}/signup`;  // Apna actual link dalen
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      toast.success('Link Copied!');
      setTimeout(() => setCopied(false), 2000); // 2 sec baad reset
    });
  };


  const countries = Country.getAllCountries();
  const states = formData.country ? State.getStatesOfCountry(formData.country) : [];

  const fetchRoles = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';  // ✅ Get the base URL from env variable


    try {
      const token = localStorage.getItem('token');
      // if (!token) {
      //   localStorage.removeItem('token');
      //   router.push('/');
      //   return;
      // }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${apiUrl}/getRoles`, {
        method: 'GET',
        headers,
      });

      if (response.status === 400) {
        localStorage.removeItem('token');
        router.push('/');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles || []);

        // ✅ Auto-select and disable role if 'singletechnician' is in URL
        if (searchParams.has('singletechnician')) {
          const singleTechnicianRole = data.roles.find((role: any) => role.name === 'singletechnician');
          if (singleTechnicianRole) {
            setFormData((prev) => ({
              ...prev,
              role: singleTechnicianRole.name,
              types: singleTechnicianRole.type || '',
            }));
          }
        }
      } else {
        console.error('Error fetching roles:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  // Call the fetchTechnicians function if needed
  useEffect(() => {
    fetchRoles();
  }, []);

  return (
    <div className='main-container mb-5'>
      <Breadcrumb
        items={[
          {
            label: isSingleTechnician ? 'Single Technician' : 'IFS Technicians',
            href: isSingleTechnician
              ? '/single-technicians/listing'
              : '/technicians/listing',
          },
          isEdit
            ? { label: 'Edit Technician' }
            : { label: 'Create Technician', href: '/technicians/create-technician' },
        ]}
      />

      <ToastContainer position="top-center" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      {/* <h1 className="text-lg leading-6 font-bold text-gray-900">Create New Technician</h1> */}
      <h1 className="text-lg leading-6 font-bold text-gray-900">{isEdit ? 'Edit Technician' : 'Create New Technician'}</h1>
      {/* <p className='text-sm'>Onboard clients effortlessly for seamless collaboration!</p> */}
      <div className='bg-white p-4 mt-5 w-[60%] m-auto'>
        <div onClick={handleCopy} className='text-right mb-4 text-md flex items-center gap-1 justify-end cursor-pointer'>Share Registration Link <Image src={Share} className='w-[14px]' alt='share' /> </div>

        <form onSubmit={handleSubmit}>
        {!searchParams.has('singletechnician') && (
            <div className="grid grid-cols-2 gap-4">

              <div className='mb-4'>
                <FormControl fullWidth size="small">
                  <InputLabel id="role" color="warning">Select role name *</InputLabel>
                  <Select
                    labelId="role"
                    id="select-role-name"
                    color="warning"
                    value={formData.role}
                    label="State role name"
                    name="role"
                    onChange={handleSelectChange} 
                  >
                    {roles 
                      .map((role, index) => (
                        <MenuItem key={index} value={role.name}>
                          {role.name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </div>
              <div className='mb-4'>
                <FormControl fullWidth size="small">
                  <InputLabel id="types" color="warning">Select role type *</InputLabel>
                  <Select
                    labelId="types"
                    id="select-role-type"
                    color="warning"
                    value={formData.types}
                    label="State role type"
                    name="types" 
                    onChange={handleSelectChange}
                  >
                    {roles 
                      .map((role, index) => (
                      <MenuItem key={index} value={role.type}>{role.type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
            </div>
          )}
          {searchParams.has('singletechnician') && (
            <div className="grid grid-cols-2 gap-4">

              <div className='mb-4'>
                <FormControl fullWidth size="small">
                  <InputLabel id="role" color="warning">Select role name *</InputLabel>
                  <Select
                    labelId="role"
                    id="select-role-name"
                    color="warning"
                    value={formData.role}
                    label="State role name"
                    name="role"
                    onChange={handleSelectChange}
                    disabled={searchParams.has('singletechnician')}
                  >
                    {roles
                      .filter((role) => role.name !== "super admin") // Filter out "super admin"
                      .map((role, index) => (
                        <MenuItem key={index} value={role.name}>
                          {role.name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </div>
              <div className='mb-4'>
                <FormControl fullWidth size="small">
                  <InputLabel id="types" color="warning">Select role type *</InputLabel>
                  <Select
                    labelId="types"
                    id="select-role-type"
                    color="warning"
                    value={formData.types}
                    label="State role type"
                    name="types"
                    disabled
                    onChange={handleSelectChange}
                  >
                    {formData.types ? (
                      <MenuItem value={formData.types}>{formData.types}</MenuItem>
                    ) : (
                      <MenuItem value="">Select a role first</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            {/* Client Name and Business Name */}
            <div className='mb-4'>
              {/* <p className='text-sm mb-2'>First Name <span className='text-red-500'>*</span></p> */}
              <TextField fullWidth size="small" name="firstName" id="outlined-basic" color="warning" label="Enter your first name *" variant="outlined" value={formData.firstName} onChange={handleChange} />

              {/* <input
                type="text"
                placeholder="Enter your first name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400"
              /> */}
            </div>
            <div className='mb-4'>
              {/* <p className='text-sm mb-2'>Last Name <span className='text-red-500'>*</span></p> */}
              <TextField fullWidth size="small" name="lastName" id="outlined-basic" color="warning" label="Enter your last name *" variant="outlined" value={formData.lastName} onChange={handleChange} />

              {/* <input
                type="text"
                name="lastName"
                placeholder="Enter your last name"
                value={formData.lastName}
                onChange={handleChange}
                className="input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400"
              /> */}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Client Name and Business Name */}
            <div className='mb-4'>
              {/* <p className='text-sm mb-2'>Phone <span className='text-red-500'>*</span></p> */}
              {/* <TextField fullWidth size="small" name="phoneNumber" id="outlined-basic" color="warning" label="Enter your phone number *" variant="outlined" value={formData.phoneNumber} onChange={handleChange} /> */}
              <PhoneInput
                international
                defaultCountry="IN"
                value={formData.phoneNumber}
                onChange={handlePhoneChange}
                className="input text-xs input-bordered w-full p-2 rounded border border-gray-400"
              />


            </div>
            <div className='mb-4'>
              {/* <p className='text-sm mb-2'>Email <span className='text-red-500'>*</span></p> */}
              <TextField fullWidth size="small" name="email" id="outlined-basic" color="warning" label="Enter your email *" variant="outlined" value={formData.email} onChange={handleChange} />


            </div>
          </div>
          {/* Address and Email */}
          <div className='mb-4'>
            {/* <p className='text-sm mb-2'>Address <span className='text-red-500'>*</span></p> */}
            <TextField fullWidth size="small" name="address" id="outlined-basic" color="warning" label="Enter your address *" variant="outlined" value={formData.address} onChange={handleChange} />

            {/* <input
              type="text"
               name="address"
              placeholder="Enter your address"
              value={formData.address}
              onChange={handleChange}
              className="input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400"
            /> */}
          </div>
          <div className="grid grid-cols-4 gap-4">
            {/* Client Name and Business Name */}
            <div className='mb-4'>
              {/* <p className='text-sm mb-2'>Country <span className='text-[red]'>*</span></p> */}

              <FormControl fullWidth size="small">
                <InputLabel id="country" color="warning">Select country *</InputLabel>
                <Select
                  labelId="country"
                  color="warning"
                  id="country"
                  value={formData.country}
                  label="country"
                  name="country"
                  onChange={handleSelectChange}
                >
                  {countries.map((country: ICountry) => (
                    <MenuItem key={country.isoCode} value={country.isoCode}> {country.name} </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* <select
                name="country"
                className="input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400"
                value={formData.country}
                onChange={handleChange}
              >
                <option value="">Select country</option>
                {countries.map((country: ICountry) => (
                  <option key={country.isoCode} value={country.isoCode}>{country.name}</option>
                ))}
              </select> */}
            </div>
            <div className='mb-4'>
              {/* <p className='text-sm mb-2'>State <span className='text-[red]'>*</span></p> */}

              <FormControl fullWidth size="small">
                <InputLabel id="state" color="warning"> Select state *</InputLabel>
                <Select
                  labelId="state"
                  color="warning"
                  id="select-state"
                  value={formData.state}
                  label="State"
                  name="state"
                  onChange={handleSelectChange}
                >
                  {states.map((state: IState) => (
                    <MenuItem key={state.isoCode} value={state.isoCode}>{state.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>


              {/* <label htmlFor="" className='text-sm'>State <span className='text-red-500'>*</span></label>
              <select
                name="state"
                className="input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400"
                value={formData.state}
                onChange={handleChange}
                disabled={!formData.country}
              >
                <option value="">Select state</option>
                {states.map((state: IState) => (
                  <option key={state.isoCode} value={state.isoCode}>{state.name}</option>
                ))}
              </select> */}
            </div>
            <div className='mb-4'>
              {/* <p className='text-sm mb-2'>City <span className='text-[red]'>*</span></p> */}
              <TextField fullWidth size="small" name="city" id="outlined-basic" color="warning" label="Enter your city *" variant="outlined" value={formData.city} onChange={handleChange} />

            </div>
            <div className='mb-4'>
              {/* <p className='text-sm mb-2'>Zip Code <span className='text-[red]'>*</span></p> */}
              <TextField fullWidth size="small" name="zipCode" id="outlined-basic" color="warning" label="Enter your zip code *" variant="outlined" value={formData.zipCode} onChange={handleChange} />

            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className='mb-4'>
              {/* <p   className='text-sm mb-2'>Secondary phone number</p> */}
              <TextField fullWidth size="small" name="secondaryContactName" id="outlined-basic" color="warning" label="Enter your secondary phone number" variant="outlined" value={formData.secondaryContactName} onChange={handleChange} />

              {/* <input
                type="number"
                name="secondaryContactName" 
                placeholder="Enter your phone number"
                value={formData.secondaryContactName}
                onChange={handleChange}
                className="input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400"
              /> */}
            </div>
            <div className='mb-4'>
              {/* <p className='text-sm mb-2'>Secondary Email</p> */}
              <TextField fullWidth size="small" name="secondaryEmail" id="outlined-basic" color="warning" label="Enter your secondary email address" variant="outlined" value={formData.secondaryEmail} onChange={handleChange} />

              {/* <input
                type="email"
                name="secondaryEmail" 
                placeholder="Enter secondary email address"
                value={formData.secondaryEmail}
                onChange={handleChange}
                className="input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400"
              /> */}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">

            <div className='mb-4 relative'>
              {/* <p className='text-sm mb-2'>Password <span className='text-red-500'>*</span></p> */}
              <TextField fullWidth type={showPassword ? "text" : "password"} size="small" name="password" id="outlined-basic" color="warning" label="Enter your password *" variant="outlined" value={formData.password} onChange={handleChange} />
              <button
                type="button"
                style={{ position: 'absolute', right: '10px', top: '10px' }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <Image src={EyeOff} width='18' height='18' alt="eye" /> : <Image src={Eye} width='18' height='18' alt="eye" />
                }
              </button>

            </div>
            <div className='mb-4 relative'>
              {/* <p className='text-sm mb-2'>Confirm Password <span className='text-red-500'>*</span></p> */}
              <TextField
                fullWidth
                size="small"
                type={showConformPassword ? "text" : "password"}
                name="confirmPassword"
                id="confirmPassword"
                color="warning"
                label="Confirm your password *"
                variant="outlined"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
              />
              <button
                type="button"
                style={{ position: 'absolute', right: '10px', top: '10px' }}
                onClick={() => setShowConformPassword(!showConformPassword)}
              >
                {showConformPassword ? <Image src={EyeOff} width='18' height='18' alt="eye" /> : <Image src={Eye} width='18' height='18' alt="eye" />
                }
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">

            <div className='mb-4'>
              {/* <p className='text-sm mb-2'>Pay Rate <span className='text-red-500'>*</span></p> */}
              <FormControl fullWidth size="small">
                <InputLabel id="payRate" color="warning">Select pay rate</InputLabel>
                <Select
                  labelId="payRate"
                  color="warning"
                  id="select-payRate"
                  value={formData.payRate}
                  label="payRate"
                  name="payRate"
                  onChange={handleSelectChange}
                >
                  <MenuItem value='Pay Per Vehicles'>Pay Per Vehicle</MenuItem>
                  <MenuItem value='per job'>Pay Per Job</MenuItem>
                  <MenuItem value='flat'>Flat Rate/Percentage</MenuItem>

                </Select>
              </FormControl>

              {/* <select defaultValue="" name='payRate' className="select input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400"  value={formData.payRate}
                onChange={handleChange}>
                <option value='' disabled>Select pay rate</option>
                <option value='Pay Per Vehicles'>Pay Per Vehicles</option>
                <option value='per job'>Pay Per Job</option>
                <option value='flat'>Flat Rate/Percentage</option>
              </select> */}
            </div>
            <div className="mb-4">
              {/* <p  className='text-sm mb-2'>Amount/Percentage <span className='text-red-500'>*</span></p> */}
              <TextField fullWidth size="small" name="amountPercentage" id="outlined-basic" color="warning" label="$50 per hour or 20% commission" variant="outlined" value={formData.amountPercentage} onChange={handleChange} />

              {/* <input
            type="text"
            name='amountPercentage'
            placeholder="$50/$20%"
            value={formData.amountPercentage}
                onChange={handleChange}
            className="input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400"
          /> */}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">

            <div className='mb-2'>
              {/* <p className='text-sm mb-2'>Tax Forms <span className='text-red-500'>*</span></p> */}

              <div className="form-control w-full p-3 mt-1 rounded relative" style={{ border: '2px dashed #ccc' }}>
                <label className="label text-center">
                  <svg className='m-auto' width="34" height="34" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21.953 15.7599C22.3011 15.7599 22.5895 15.8644 22.9124 16.1544L29.2453 22.2609C29.5218 22.5367 29.6876 22.8314 29.6876 23.2368C29.6876 23.9911 29.1353 24.5254 28.3621 24.5254C27.9928 24.5254 27.607 24.3784 27.3485 24.0838L24.5506 21.1201L23.2982 19.8127L23.427 22.5564V36.7479C23.427 37.5219 22.7458 38.1662 21.9538 38.1662C21.1626 38.1662 20.4995 37.5219 20.4995 36.7479V22.5556L20.6095 19.8119L19.3578 21.1193L16.5764 24.0838C16.4507 24.2228 16.2974 24.3339 16.1262 24.4101C15.955 24.4863 15.7698 24.5258 15.5825 24.5262C14.8093 24.5262 14.2389 23.9919 14.2389 23.2368C14.2389 22.8314 14.3858 22.5375 14.6616 22.2609L20.886 16.2581C21.2545 15.8888 21.5853 15.7599 21.9546 15.7599M25.6765 2.96301C32.3606 2.96301 37.7789 8.3813 37.7789 15.0646C37.7789 15.4449 37.7608 15.8212 37.727 16.1921C41.108 16.9888 43.6246 20.0264 43.6246 23.6501C43.6246 27.8819 40.1942 31.3124 35.9623 31.3124H27.123V28.3659H35.9608C36.58 28.3659 37.1933 28.244 37.7654 28.007C38.3376 27.77 38.8575 27.4226 39.2954 26.9847C39.7333 26.5468 40.0806 26.0269 40.3176 25.4548C40.5546 24.8826 40.6766 24.2694 40.6766 23.6501C40.6764 22.5885 40.3182 21.5579 39.66 20.725C39.0017 19.8921 38.0818 19.3055 37.049 19.0599L34.5551 18.4722L34.7908 15.921C34.8175 15.6382 34.8301 15.3522 34.8301 15.0646C34.8301 10.0085 30.7318 5.90944 25.675 5.90944C24.148 5.90809 22.645 6.2892 21.3031 7.01798C19.9612 7.74676 18.8233 8.8 17.993 10.0816L16.7948 11.9233L14.6883 11.301C14.1166 11.1316 13.5137 11.0948 12.9255 11.1933C12.3374 11.2918 11.7794 11.5231 11.2941 11.8695C10.8087 12.216 10.4087 12.6685 10.1244 13.1927C9.84011 13.717 9.67906 14.2991 9.65347 14.8949L9.65033 15.1251L9.7234 17.6001L7.36861 18.143C6.22908 18.4081 5.21281 19.051 4.48522 19.9672C3.75763 20.8834 3.36156 22.0189 3.36147 23.1889C3.36147 24.5621 3.90699 25.8791 4.87803 26.8502C5.84906 27.8212 7.16607 28.3667 8.53933 28.3667H16.9088V31.3132H8.53933C4.0529 31.3132 0.415039 27.6753 0.415039 23.1889C0.415039 19.3326 3.10218 16.1033 6.70625 15.272L6.70311 15.0646C6.70282 13.9956 6.95199 12.9413 7.4308 11.9855C7.90961 11.0297 8.60484 10.1989 9.46119 9.55904C10.3176 8.91919 11.3114 8.48801 12.3637 8.29978C13.416 8.11156 14.4977 8.17148 15.5228 8.4748C17.6811 5.15673 21.4219 2.96301 25.675 2.96301" fill="#383d71" />
                  </svg>
                  <p className='text-sm mb-1 mt-1'>Upload Tax Form</p>
                  <span className="text-center m-auto text-xs block"> (Only JPEG, Webp, PNG & PDF files are accepted.)</span>
                </label>
                <input type="file" multiple className="input input-bordered w-full opacity-0 absolute inset-0" onChange={handleFileChange} />
                {/* onChange={handleFileChange} */}
              </div>
              <div className="flex flex-wrap gap-5 items-center relative mt-5">
                {formData.taxForms?.map((file: string | File, index: number) => {
                  let fileSrc = "";
                  let fileType = "";

                  if (typeof file === "string") {
                    fileSrc = file;
                    fileType = /\.(png|jpe?g|webp)$/i.test(file) ? "image" : file.toLowerCase().endsWith(".pdf") ? "application/pdf" : "";
                  } else if (file instanceof File) {
                    fileSrc = URL.createObjectURL(file);
                    fileType = file.type;
                  }

                  return (
                    <div key={index} className="shadow rounded p-2 relative flex items-center gap-2">
                      {fileType === "image" || fileType.startsWith("image/") ? (
                        <img src={fileSrc} alt="Uploaded file" className="w-12 h-12 object-cover" />
                      ) : fileType === "application/pdf" ? (
                        <a href={fileSrc} target="_blank" className="text-sm text-black-600 flex gap-1">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="orange" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 2H14L20 8V22H6V2Z" stroke="orange" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M14 2V8H20" stroke="red" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg> View PDF
                        </a>
                      ) : null}

                      <button onClick={() => handleRemoveFile(index)} className="absolute right-[-10px] top-[-5px]">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" clipRule="evenodd" d="M18 6L6 18M6 6L18 18" stroke="red" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>






            </div>
            <div className='mb-0'>
              <div className="form-control w-full p-3 mt-1 rounded relative" style={{ border: '2px dashed #ccc' }}>
                <label className="label text-center">
                  <svg className='m-auto' width="34" height="34" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21.953 15.7599C22.3011 15.7599 22.5895 15.8644 22.9124 16.1544L29.2453 22.2609C29.5218 22.5367 29.6876 22.8314 29.6876 23.2368C29.6876 23.9911 29.1353 24.5254 28.3621 24.5254C27.9928 24.5254 27.607 24.3784 27.3485 24.0838L24.5506 21.1201L23.2982 19.8127L23.427 22.5564V36.7479C23.427 37.5219 22.7458 38.1662 21.9538 38.1662C21.1626 38.1662 20.4995 37.5219 20.4995 36.7479V22.5556L20.6095 19.8119L19.3578 21.1193L16.5764 24.0838C16.4507 24.2228 16.2974 24.3339 16.1262 24.4101C15.955 24.4863 15.7698 24.5258 15.5825 24.5262C14.8093 24.5262 14.2389 23.9919 14.2389 23.2368C14.2389 22.8314 14.3858 22.5375 14.6616 22.2609L20.886 16.2581C21.2545 15.8888 21.5853 15.7599 21.9546 15.7599M25.6765 2.96301C32.3606 2.96301 37.7789 8.3813 37.7789 15.0646C37.7789 15.4449 37.7608 15.8212 37.727 16.1921C41.108 16.9888 43.6246 20.0264 43.6246 23.6501C43.6246 27.8819 40.1942 31.3124 35.9623 31.3124H27.123V28.3659H35.9608C36.58 28.3659 37.1933 28.244 37.7654 28.007C38.3376 27.77 38.8575 27.4226 39.2954 26.9847C39.7333 26.5468 40.0806 26.0269 40.3176 25.4548C40.5546 24.8826 40.6766 24.2694 40.6766 23.6501C40.6764 22.5885 40.3182 21.5579 39.66 20.725C39.0017 19.8921 38.0818 19.3055 37.049 19.0599L34.5551 18.4722L34.7908 15.921C34.8175 15.6382 34.8301 15.3522 34.8301 15.0646C34.8301 10.0085 30.7318 5.90944 25.675 5.90944C24.148 5.90809 22.645 6.2892 21.3031 7.01798C19.9612 7.74676 18.8233 8.8 17.993 10.0816L16.7948 11.9233L14.6883 11.301C14.1166 11.1316 13.5137 11.0948 12.9255 11.1933C12.3374 11.2918 11.7794 11.5231 11.2941 11.8695C10.8087 12.216 10.4087 12.6685 10.1244 13.1927C9.84011 13.717 9.67906 14.2991 9.65347 14.8949L9.65033 15.1251L9.7234 17.6001L7.36861 18.143C6.22908 18.4081 5.21281 19.051 4.48522 19.9672C3.75763 20.8834 3.36156 22.0189 3.36147 23.1889C3.36147 24.5621 3.90699 25.8791 4.87803 26.8502C5.84906 27.8212 7.16607 28.3667 8.53933 28.3667H16.9088V31.3132H8.53933C4.0529 31.3132 0.415039 27.6753 0.415039 23.1889C0.415039 19.3326 3.10218 16.1033 6.70625 15.272L6.70311 15.0646C6.70282 13.9956 6.95199 12.9413 7.4308 11.9855C7.90961 11.0297 8.60484 10.1989 9.46119 9.55904C10.3176 8.91919 11.3114 8.48801 12.3637 8.29978C13.416 8.11156 14.4977 8.17148 15.5228 8.4748C17.6811 5.15673 21.4219 2.96301 25.675 2.96301" fill="#383d71" />
                  </svg>
                  <p className='text-sm mb-1 mt-1'>Upload Profile Image</p>
                  <span className="text-center m-auto text-xs block"> (Only 'jpeg, webp, and png' images will be accepted)</span>
                </label>
                <input type="file" className="input input-bordered w-full opacity-0 absolute inset-0" onChange={handleImageChange} />
              </div>

              {formData.image && (
                <div className='flex items-center mt-5 shadow w-[fit-content] rounded p-2 relative'>
                  {formData.image instanceof File ? (
                    <img src={URL.createObjectURL(formData.image)} alt="Uploaded file" style={{ width: 50, height: 50, objectFit: 'cover' }} />
                  ) : (
                    <img src={formData.image} alt="Uploaded image" style={{ width: 50, height: 50, objectFit: 'cover' }} />
                  )}
                  <button type='button' onClick={handleRemoveImage} style={{ border: 'none', background: 'transparent', cursor: 'pointer', position: 'absolute', right: '-10px', top: '0' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M18 6L6 18M6 6L18 18" stroke="red" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

          </div>



          {/* Submit Button */}
          <div className="text-left">
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
