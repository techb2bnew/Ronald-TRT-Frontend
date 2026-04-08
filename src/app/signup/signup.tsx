"use client";
import React, { useState, useEffect } from 'react';
import { Country, State } from 'country-state-city';
import { ICountry, IState } from 'country-state-city';
import toast from 'react-hot-toast';
import { useRouter } from "next/navigation";
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Loader from '@/app/component/loader';
import Image from 'next/image';
import Banner from "../../../public/signup.png";
import Logo from "../../../public/trt-logo.png";
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css' // For basic styling
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import Link from 'next/link';
import Eye from "../../../public/eye.svg";
import EyeOff from '../../../public/eye-off.svg'
import Swal from "sweetalert2";
import { FormHelperText } from '@mui/material';
import GooglePlacesAutocomplete from 'react-google-places-autocomplete';
import { geocodeByAddress, getLatLng } from 'react-google-places-autocomplete';
import { SingleValue, ActionMeta } from 'react-select';

interface registerForm {
  id?: string;
  firstName: string;
  lastName: string;
  businessName: string;
  phoneNumber: string;
  secondaryContactName: string;
  email: string;
  address: string;
  // country: string;
  // state: string;
  // city: string;
  // zipCode: string;
  secondaryEmail?: string;
  password: string;
  confirmPassword: string;
  taxForms: File[];
  image: File | null;
  businessLogo: File | null;
  role: string;
  types: string;
  agreeTerms: string;
}

interface PlaceType {
  place_id: string;
  description: string;
  // Add other properties you might need from Google Places
}

interface AddressValue {
  label: string;
  value: PlaceType;
}

type GooglePlacesOption = {
  label: string;
  value: {
    place_id: string;
    description: string;
  };
};

type NullableGooglePlacesOption = SingleValue<GooglePlacesOption>;
export default function Role() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState<boolean>(false);  // ✅ Track form submission state
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isEdit, setIsEdit] = useState<boolean>(false); // To differentiate between create and edit 
  const [loading, setLoading] = useState<boolean>(true);
  const [roles, setRoles] = useState<any[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConformPassword, setShowConformPassword] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [address, setAddressValue] = useState<NullableGooglePlacesOption>(null);

  const [formData, setFormData] = useState<registerForm>({
    firstName: '',
    lastName: '',
    businessName: '',
    phoneNumber: '',
    email: '',
    address: '',
    // country: '',
    // state: '',
    // city: '',
    // zipCode: '',
    secondaryContactName: '',
    secondaryEmail: '',
    password: '',
    confirmPassword: '',
    taxForms: [],
    image: null,
    businessLogo: null,
    role: '',
    types: '',
    agreeTerms: 'true',
  });


  const handleAddressSelect = async (selectedAddress: AddressValue) => {
    if (!selectedAddress) return;

    setAddressValue(selectedAddress);

    try {
      const results = await geocodeByAddress(selectedAddress.label);
      const addressComponents = results[0].address_components;

      let street = '', city = '', state = '', country = '', zip = '';

      addressComponents.forEach(component => {
        if (component.types.includes('street_number') || component.types.includes('route')) {
          street += component.long_name + ' ';
        }
        if (component.types.includes('locality')) {
          city = component.long_name;
        }
        if (component.types.includes('administrative_area_level_1')) {
          state = component.long_name;
        }
        if (component.types.includes('country')) {
          country = component.long_name;
        }
        if (component.types.includes('postal_code')) {
          zip = component.long_name;
        }
      });

      const fullAddress = `${street.trim()}, ${city}, ${state}, ${country}, ${zip}`;
      // Update form data with the full address
      setFormData(prev => ({
        ...prev,
        address: fullAddress,  // Store combined address here
      }));

      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.address;
        delete newErrors.city;
        delete newErrors.state;
        delete newErrors.zipCode;
        return newErrors;
      });

    } catch (error) {
      console.error('Error fetching address details:', error);
      toast.error('Failed to process address details');
    }
  };

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const name = event.target.name; // The name of the select element if you set it
    const value = event.target.value;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    if (name === "role") {
      const selectedRole = roles.find((role) => role.name === value);
      setSelectedRole(selectedRole);
      setFormData((prev) => ({
        ...prev,
        role: value,
        types: selectedRole ? selectedRole.type : "", // Auto-fill role type
      }));
    }
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }


  };

  const handleChange: React.ChangeEventHandler<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement> = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    if (name === 'email' || name === 'secondaryEmail') {
      processedValue = value.toLowerCase();
    }
    const updatedFormData = {
      ...formData,
      [name]: processedValue,
    };
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (name === 'secondaryContactName') {
      const numericValue = value.replace(/\D/g, '');
      if (numericValue.length > 10) return;
    }

    if (name === "secondaryEmail") {
      const isValidEmail = emailPattern.test(value);
      setErrors((prev) => ({
        ...prev,
        emailError: isValidEmail ? '' : 'Please enter a valid email address',
      }));
    }

    setFormData({ ...formData, [name]: value });
    let shouldUpdate = true;

    if (shouldUpdate) {
      setFormData(updatedFormData);
    }
    if (name === 'password' || name === 'confirmPassword') {
      if (
        updatedFormData.confirmPassword &&
        updatedFormData.confirmPassword !== updatedFormData.password
      ) {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: 'Passwords do not match',
        }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.confirmPassword;
          return newErrors;
        });
      }
    }
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  const validateConfirmPassword = (confirmPassword: string) => {
    if (confirmPassword !== formData.password) {
      setErrors(prev => ({
        ...prev,
        confirmPassword: 'Enter confirm password'
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

  const handleRemoveFile = (index: number) => {
    const newFiles = formData.taxForms.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, taxForms: newFiles }));
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
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; // Sirf ek file lene ke liye
    if (!file) return;

    const maxWidth = 800; // Maximum image width
    const maxHeight = 600; // Maximum image height
    const quality = 0.7; // Compression quality

    try {
      const compressedFile = await compressImage(file, maxWidth, maxHeight, quality);
      setFormData((prev: any) => ({ ...prev, businessLogo: compressedFile }));
    } catch (error) {
      console.error('Compression error:', error);
      toast.error('Failed to compress image.');
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev: any) => ({ ...prev, image: null }));
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};
    if (!formData.role.trim()) newErrors.role = 'Role name is required';
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName?.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.phoneNumber?.trim()) newErrors.phoneNumber = 'Phone Number is required';
    if (!formData.email?.trim()) newErrors.email = 'Email is required';
    // if (!formData.country?.trim()) newErrors.country = 'Country is required';
    if (!formData.address?.trim()) newErrors.address = 'Address is required';
    // if (!formData.zipCode?.trim()) newErrors.zipCode = 'Zip Code is required';
    if (!formData.password?.trim()) newErrors.password = 'Password is required';

    if (formData.password && formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = 'Enter confirm password';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors); // Replace all errors with new ones
      return;
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
        formDataObj.append(key, String(formData[key as keyof registerForm])); // Convert all values to string
      }
    });
    if (formData.image) {
      formDataObj.append('image', formData.image);
    }
    if (formData.businessLogo) {
      formDataObj.append('businessLogo', formData.businessLogo);
    }
    // Create headers object
    const headers: Record<string, string> = {};
    // If token exists, add it to Authorization header
    if (isEdit) {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Token ${token}`;
      }
    }

    try {
      setSubmitting(true);
      const response = await fetch(`${apiUrl}/register`, {
        method: 'POST',
        body: formDataObj, // Send the FormData object without setting Content-Type header
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        const apiErrors: { [key: string]: string } = {};

        // Handle different error response formats
        if (data.error) {
          // Check if the error message indicates email or phone number issues
          if (data.error.toLowerCase().includes('email')) {
            apiErrors.email = data.error;
          } else if (data.error.toLowerCase().includes('phone')) {
            apiErrors.phoneNumber = data.error;
          } else if (data.error.toLowerCase().includes('password')) {
            apiErrors.password = data.error;
          } else {
            // For other general errors
            // toast.error(data.error);
          }
        }

        // Also check if there are field-specific errors in data.errors
        if (data.errors && typeof data.errors === 'object') {
          Object.entries(data.errors).forEach(([key, value]) => {
            if (key === 'phoneNumber' || key === 'email' || key === 'password') {
              apiErrors[key] = String(value);
            }
          });
        }

        // Update the errors state if we found field-specific errors
        if (Object.keys(apiErrors).length > 0) {
          setErrors(prev => ({ ...prev, ...apiErrors }));
        } else if (data.error && Object.keys(apiErrors).length === 0) {
          // Show general error toast if no field-specific errors were found
          toast.error(data.error);
        }
      } else {
        Swal.fire({
          title: "Registration Successful!",
          text: "Thank you for signing up! Your account request has been submitted successfully and is currently under review by our team. You will receive an email notification once your account is approved.",
          icon: "success",
          confirmButtonText: "OK",
        }).then((result) => {
          if (result.isConfirmed) {
            router.push("/login"); // ✅ Redirect to login page on button click
          }
        });
      }
    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred");
    } finally {
      setSubmitting(false); // ✅ Hide loader when done
    }
  };



  const fetchRoles = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';  // ✅ Get the base URL from env variable
    setLoading(true);

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
      } else {
        console.error('Error fetching roles:', response.statusText);
      }
    } catch (error) {
      // Handle any fetch or network error
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  // Call the fetchTechnicians function if needed
  useEffect(() => {
    fetchRoles();
  }, []);


  const getNationalNumber = (digitsOnly: string, fullNumber: string): string => {
    try {
      const parsed = parsePhoneNumberFromString(fullNumber);
      if (parsed) {
        return digitsOnly.startsWith(parsed.countryCallingCode)
          ? digitsOnly.slice(parsed.countryCallingCode.length)
          : digitsOnly;
      }
      return digitsOnly;
    } catch {
      return digitsOnly;
    }
  };

  const handlePhoneChange = (value: string | undefined) => {
    if (!value) {
      setFormData(prev => ({
        ...prev,
        phoneNumber: ''
      }));
      setErrors(prev => ({ ...prev, phoneNumber: 'Phone number is required' }));
      return;
    }

    const digitsOnly = value.replace(/\D/g, '');
    const nationalNumber = getNationalNumber(digitsOnly, value);

    // Stop if national number exceeds 10 digits
    if (nationalNumber.length > 10) {
      return;
    }

    // Set error if not exactly 10 digits
    if (nationalNumber.length !== 10) {
      setErrors(prev => ({
        ...prev,
        phoneNumber: 'Phone number must be exactly 10 digits'
      }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.phoneNumber;
        return newErrors;
      });
    }

    // Update form data
    setFormData(prev => ({
      ...prev,
      phoneNumber: value
    }));
  };



  // const countries = Country.getAllCountries();
  // const states = formData.country ? State.getStatesOfCountry(formData.country) : [];


  return (
    <div className='main-container mb-5 bg-white'>
      {/* <h1 className="text-lg leading-6 font-bold text-gray-900 mb-[2px] sm:mb-0">Create New Technician</h1> */}
      <div className="flex">
        <div className="w-1/2 md:block fixed">
          <Image src={Banner} className="" width='1000' style={{ width: '100%', height: '100vh', objectFit: 'cover' }} height='800' alt="page img" />
        </div>
        <div className="md:w-1/2 absolute right-[0] top-[0rem] bg-white" style={{ padding: '2rem 5rem' }}>
          <div className="text-center mb-5 w-full">
            <Image src={Logo} className="m-auto" width='100' height='50' alt="page img" />
            <h2 className="text-2xl font-bold text-[#161616] mt-5">Create Account</h2>
            <p className="text-[#161616] mt-3">Create your account to unlock exclusive features and start your journey with us today!</p>
          </div>
          <div className='p-4 mt-5'>
            {submitting ? (
              <div className="flex justify-center items-center h-64">
                <Loader />  {/* ✅ Show loader during submission */}
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-4">

                  <div className='mb-4 relative'>
                    <svg width="20" height="20" viewBox="0 0 20 20" className="icon__tech" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="10" cy="6" r="3" stroke="#5B5B99" strokeWidth="1.5" />
                      <path d="M5 16C5 13.8 7 12 10 12C13 12 15 13.8 15 16" stroke="#5B5B99" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M14.5 5L15.1 6.6L16.8 6.8L15.4 8L15.8 9.7L14.5 8.9L13.2 9.7L13.6 8L12.2 6.8L13.9 6.6L14.5 5Z" fill="#5B5B99" />
                    </svg>
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
                          .filter((role) => role.name !== "super admin" && role.name !== "technician" && role.name !== "manager")  // technician ko hata diya
                          .map((role, index) => (
                            <MenuItem key={index} value={role.name}>
                              {role.name === "singletechnician"
                                ? "Single Technician"
                                : role.name}
                            </MenuItem>
                          ))}
                      </Select>
                      {errors.role && (
                        <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                          {errors.role}
                        </div>
                      )}
                    </FormControl>


                  </div>
                  {/* <div className='mb-4 relative'>
                    <svg width="20" height="20" viewBox="0 0 20 20" className="icon__tech" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="10" cy="6" r="3" stroke="#5B5B99" strokeWidth="1.5" />
                      <path d="M5 16C5 13.8 7 12 10 12C13 12 15 13.8 15 16" stroke="#5B5B99" strokeWidth="1.5" stroke-linecap="round" />
                      <path d="M14.5 5L15.1 6.6L16.8 6.8L15.4 8L15.8 9.7L14.5 8.9L13.2 9.7L13.6 8L12.2 6.8L13.9 6.6L14.5 5Z" fill="#5B5B99" />
                    </svg>
                    <TextField fullWidth  name="firstName" id="outlined-basic" color="warning" label="Select role type *" size="small" value={formData.types} disabled />
 
                  </div> */}
                </div>

                <div className={`grid ${selectedRole?.type === 'single-technician' ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>

                  {/* Client Name and Business Name */}
                  <div className='mb-4 relative'>

                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon__tech">
                      <circle cx="10" cy="6" r="3" stroke="#5B5B99" strokeWidth="1.5" />
                      <path d="M5 16C5 13.8 7 12 10 12C13 12 15 13.8 15 16" stroke="#5B5B99" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    {/* <p className='text-sm mb-2'>First Name <span className='text-red-500'>*</span></p> */}
                    <TextField fullWidth size="small" name="firstName" id="outlined-basic" color="warning" label="First name *" value={formData.firstName} onChange={handleChange} />
                    {errors.firstName && (
                      <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                        {errors.firstName}
                      </div>
                    )}
                  </div>
                  <div className='mb-4 relative'>

                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon__tech">
                      <circle cx="10" cy="6" r="3" stroke="#5B5B99" strokeWidth="1.5" />
                      <path d="M5 16C5 13.8 7 12 10 12C13 12 15 13.8 15 16" stroke="#5B5B99" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    {/* <p className='text-sm mb-2'>Last Name <span className='text-red-500'>*</span></p> */}
                    <TextField fullWidth size="small" name="lastName" id="outlined-basic" color="warning" label="Last name *" value={formData.lastName} onChange={handleChange} />
                    {errors.lastName && (
                      <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                        {errors.lastName}
                      </div>
                    )}

                  </div>
                  {selectedRole?.type === 'single-technician' && (
                    <div className='mb-4 relative'>

                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon__tech">
                        <circle cx="10" cy="6" r="3" stroke="#5B5B99" strokeWidth="1.5" />
                        <path d="M5 16C5 13.8 7 12 10 12C13 12 15 13.8 15 16" stroke="#5B5B99" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      {/* <p className='text-sm mb-2'>Last Name <span className='text-red-500'>*</span></p> */}
                      <TextField fullWidth name="businessName" id="outlined-basic" color="warning" label="Business name *" size="small" value={formData.businessName} onChange={handleChange} />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {/* Client Name and Business Name */}
                  <div className='mb-4'>
                    {/* <p className='text-sm mb-2'>Phone <span className='text-red-500'>*</span></p> */}
                    {/* <TextField fullWidth  name="phoneNumber" id="outlined-basic" color="warning" label="Enter your phone number *" size="small" value={formData.phoneNumber} onChange={handleChange} /> */}
                    <PhoneInput
                      international
                      defaultCountry="US"
                      value={formData.phoneNumber}
                      onChange={handlePhoneChange}
                      onKeyDown={(e: any) => {
                        // Prevent typing if already 10 digits in national number
                        const digitsOnly = formData.phoneNumber.replace(/\D/g, '');
                        const nationalNumber = getNationalNumber(digitsOnly, formData.phoneNumber);
                        if (nationalNumber.length >= 10 && e.key !== 'Backspace' && e.key !== 'Delete' && !e.metaKey) {
                          e.preventDefault();
                        }
                      }}
                      onPaste={(e: any) => {
                        const pasted = e.clipboardData.getData('Text').replace(/\D/g, '');
                        if (pasted.length > 10) e.preventDefault();
                      }}
                      className={`input text-xs input-bordered w-full p-2 rounded`}
                    />
                    {errors.phoneNumber && (
                      <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                        {errors.phoneNumber}
                      </div>
                    )}
                  </div>
                  <div className='mb-4 relative'>
                    <svg width="16" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon__tech">
                      <rect x="2" y="4" width="12" height="8" rx="1.5" stroke="#5B5B99" strokeWidth="1.2" />
                      <path d="M2.5 4.5L8 8.5L13.5 4.5" stroke="#5B5B99" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {/* <p className='text-sm mb-2'>Email <span className='text-red-500'>*</span></p> */}
                    <TextField fullWidth name="email" id="outlined-basic" color="warning" label="Email *" size="small" value={formData.email} onChange={handleChange} inputProps={{
                      style: { textTransform: 'lowercase' }
                    }} />
                    {errors.email && (
                      <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                        {errors.email}
                      </div>
                    )}
                  </div>
                </div>
                {/* Address and Email */}

                {/* <div className="grid grid-cols-4 gap-4"> 
                  <div className='mb-4 relative'>
                  
                    <FormControl fullWidth size="small">
                      <InputLabel id="country" color="warning">Select country *</InputLabel>
                      <Select
                        labelId="country"
                        id="country"
                        value={formData.country}
                        label="Select country"
                        name="country"
                        color="warning"
                        onChange={handleSelectChange}
                      >
                        {countries.map((country: ICountry) => (
                          <MenuItem key={country.isoCode} value={country.isoCode}> {country.name} </MenuItem>
                        ))}
                      </Select>
                      {errors.country && (
                        <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                          {errors.country}
                        </div>
                      )}
                    </FormControl>


                  </div>
                  <div className='mb-4 relative'>
                    
                    <FormControl fullWidth size="small">
                      <InputLabel id="state" color="warning">Select state</InputLabel>
                      <Select
                        labelId="state"
                        id="select-state"
                        color="warning"
                        value={formData.state}
                        label="Select State"
                        name="state"
                        onChange={handleSelectChange}
                      >
                        {states.map((state: IState) => (
                          <MenuItem key={state.isoCode} value={state.isoCode}>{state.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>



                  </div>
                  <div className='mb-4 relative'>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" className="icon__tech"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                     <TextField fullWidth name="city" id="outlined-basic" color="warning" label="City" size="small" value={formData.city} onChange={handleChange} />

                  </div>
                  <div className='mb-4 relative'>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" className="icon__tech"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                     <TextField fullWidth name="zipCode" id="outlined-basic" color="warning" label="Zip code *" size="small" value={formData.zipCode} onChange={handleChange} />
                    {errors.zipCode && (
                      <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                        {errors.zipCode}
                      </div>
                    )}
                  </div>
                </div> */}
                <div className='mb-4 relative z-10'>
                  <GooglePlacesAutocomplete
                    apiKey="AIzaSyBgdQ0wlbTwbi5mBt7UwyT7qFHMtX50waI"
                    selectProps={{
                      placeholder: 'Search for an address...',
                      value: address,
                      onChange: (newValue: SingleValue<GooglePlacesOption>, actionMeta: ActionMeta<GooglePlacesOption>) => {
                        if (newValue) {
                          handleAddressSelect(newValue);
                        }
                      },
                      styles: {
                        input: (provided) => ({
                          ...provided,
                          borderRadius: '4px',
                          width: '100%'
                        }),
                        control: (provided) => ({
                          ...provided,
                          borderColor: errors.address ? 'red' : '#ccc', // Red border if error exists
                          '&:hover': {
                            borderColor: errors.address ? 'orange' : 'orange',
                          },
                          '&:focus': {
                            borderColor: errors.address ? 'orange' : 'orange',
                          },
                        }),
                      }
                    }}
                    autocompletionRequest={{
                      componentRestrictions: {
                        country: 'us' // Restrict to US addresses only
                      }
                    }}
                  />
                  {errors.address && (
                    <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                      {errors.address}
                    </div>
                  )}
                </div>

                {/* <div className='mb-4 relative'>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" className="icon__tech"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <TextField fullWidth name="address" id="outlined-basic" color="warning" label="Address *" size="small" value={formData.address} onChange={handleChange} />
                  {errors.address && (
                    <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                      {errors.address}
                    </div>
                  )}

                </div> */}
                <div className="grid grid-cols-2 gap-4">
                  <div className='mb-4 relative'>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="icon__tech" xmlns="http://www.w3.org/2000/svg">
                      <rect x="5" y="2" width="10" height="16" rx="2" stroke="#5B5B99" strokeWidth="1.5" />
                      <rect x="8" y="3.5" width="4" height="1" fill="#5B5B99" />
                      <circle cx="7" cy="7" r="0.8" fill="#5B5B99" />
                      <circle cx="10" cy="7" r="0.8" fill="#5B5B99" />
                      <circle cx="13" cy="7" r="0.8" fill="#5B5B99" />

                      <circle cx="7" cy="10" r="0.8" fill="#5B5B99" />
                      <circle cx="10" cy="10" r="0.8" fill="#5B5B99" />
                      <circle cx="13" cy="10" r="0.8" fill="#5B5B99" />

                      <circle cx="7" cy="13" r="0.8" fill="#5B5B99" />
                      <circle cx="10" cy="13" r="0.8" fill="#5B5B99" />
                      <circle cx="13" cy="13" r="0.8" fill="#5B5B99" />
                    </svg>
                    <TextField fullWidth type="number" name="secondaryContactName" id="outlined-basic" color="warning" label="Secondary phone number" size="small" value={formData.secondaryContactName} inputProps={{
                      maxLength: 10,
                    }} onChange={handleChange} />


                  </div>
                  <div className='mb-4 relative'>
                    <svg width="16" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon__tech">
                      <rect x="2" y="4" width="12" height="8" rx="1.5" stroke="#5B5B99" strokeWidth="1.2" />
                      <path d="M2.5 4.5L8 8.5L13.5 4.5" stroke="#5B5B99" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <TextField fullWidth name="secondaryEmail" id="outlined-basic" color="warning" label="Secondary email address" size="small" value={formData.secondaryEmail} onChange={handleChange} />
                    {errors.emailError && (
                      <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                        {errors.emailError}
                      </div>
                    )}

                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">

                  <div className='mb-4 relative'>

                    <TextField fullWidth type={showPassword ? "text" : "password"} name="password" id="outlined-basic" color="warning" label="Password *" size="small" value={formData.password} onChange={handleChange} />
                    <button
                      type="button"
                      style={{ position: 'absolute', right: '10px', top: '10px' }}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <Image src={Eye} width='14' height='14' alt="eye" /> : <Image src={EyeOff} width='14' height='14' alt="eye" />
                      }
                    </button>
                    {errors.password && (
                      <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                        {errors.password}
                      </div>
                    )}
                  </div>
                  <div className='mb-4 relative'>

                    <TextField
                      fullWidth

                      type={showConformPassword ? "text" : "password"}
                      name="confirmPassword"
                      id="confirmPassword"
                      color="warning"
                      label="Confirm password *"
                      size="small"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      style={{ position: 'absolute', right: '10px', top: '10px' }}
                      onClick={() => setShowConformPassword(!showConformPassword)}
                    >
                      {showConformPassword ? <Image src={Eye} width='14' height='14' alt="eye" /> : <Image src={EyeOff} width='14' height='14' alt="eye" />
                      }
                    </button>
                    {errors.confirmPassword && (
                      <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                        {errors.confirmPassword}
                      </div>
                    )}
                  </div>
                </div>
                <div className={`grid ${selectedRole?.type === 'single-technician' ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>


                  <div className='mb-0'>
                    {/* <p className='text-sm mb-2'>Tax Forms <span className='text-red-500'>*</span></p> */}

                    <div className="form-control w-full p-3 mt-1 rounded relative" style={{ border: '2px dashed #ccc' }}>
                      <label className="label text-center">
                        <svg className='m-auto' width="34" height="34" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M21.953 15.7599C22.3011 15.7599 22.5895 15.8644 22.9124 16.1544L29.2453 22.2609C29.5218 22.5367 29.6876 22.8314 29.6876 23.2368C29.6876 23.9911 29.1353 24.5254 28.3621 24.5254C27.9928 24.5254 27.607 24.3784 27.3485 24.0838L24.5506 21.1201L23.2982 19.8127L23.427 22.5564V36.7479C23.427 37.5219 22.7458 38.1662 21.9538 38.1662C21.1626 38.1662 20.4995 37.5219 20.4995 36.7479V22.5556L20.6095 19.8119L19.3578 21.1193L16.5764 24.0838C16.4507 24.2228 16.2974 24.3339 16.1262 24.4101C15.955 24.4863 15.7698 24.5258 15.5825 24.5262C14.8093 24.5262 14.2389 23.9919 14.2389 23.2368C14.2389 22.8314 14.3858 22.5375 14.6616 22.2609L20.886 16.2581C21.2545 15.8888 21.5853 15.7599 21.9546 15.7599M25.6765 2.96301C32.3606 2.96301 37.7789 8.3813 37.7789 15.0646C37.7789 15.4449 37.7608 15.8212 37.727 16.1921C41.108 16.9888 43.6246 20.0264 43.6246 23.6501C43.6246 27.8819 40.1942 31.3124 35.9623 31.3124H27.123V28.3659H35.9608C36.58 28.3659 37.1933 28.244 37.7654 28.007C38.3376 27.77 38.8575 27.4226 39.2954 26.9847C39.7333 26.5468 40.0806 26.0269 40.3176 25.4548C40.5546 24.8826 40.6766 24.2694 40.6766 23.6501C40.6764 22.5885 40.3182 21.5579 39.66 20.725C39.0017 19.8921 38.0818 19.3055 37.049 19.0599L34.5551 18.4722L34.7908 15.921C34.8175 15.6382 34.8301 15.3522 34.8301 15.0646C34.8301 10.0085 30.7318 5.90944 25.675 5.90944C24.148 5.90809 22.645 6.2892 21.3031 7.01798C19.9612 7.74676 18.8233 8.8 17.993 10.0816L16.7948 11.9233L14.6883 11.301C14.1166 11.1316 13.5137 11.0948 12.9255 11.1933C12.3374 11.2918 11.7794 11.5231 11.2941 11.8695C10.8087 12.216 10.4087 12.6685 10.1244 13.1927C9.84011 13.717 9.67906 14.2991 9.65347 14.8949L9.65033 15.1251L9.7234 17.6001L7.36861 18.143C6.22908 18.4081 5.21281 19.051 4.48522 19.9672C3.75763 20.8834 3.36156 22.0189 3.36147 23.1889C3.36147 24.5621 3.90699 25.8791 4.87803 26.8502C5.84906 27.8212 7.16607 28.3667 8.53933 28.3667H16.9088V31.3132H8.53933C4.0529 31.3132 0.415039 27.6753 0.415039 23.1889C0.415039 19.3326 3.10218 16.1033 6.70625 15.272L6.70311 15.0646C6.70282 13.9956 6.95199 12.9413 7.4308 11.9855C7.90961 11.0297 8.60484 10.1989 9.46119 9.55904C10.3176 8.91919 11.3114 8.48801 12.3637 8.29978C13.416 8.11156 14.4977 8.17148 15.5228 8.4748C17.6811 5.15673 21.4219 2.96301 25.675 2.96301" fill="#383d71" />
                        </svg>
                        <p className='text-sm mb-1 mt-1 laptop__font'>Upload Tax Form</p>
                        <span className="text-center m-auto text-xs block laptop__size"> (Only 'JPEG, WEBP, PNG and PDF' will be accepted)</span>
                      </label>
                      <input type="file" multiple accept=".jpeg,.jpg,.png,.webp,.pdf" className="input input-bordered w-full opacity-0 absolute inset-0" onChange={handleFileChange} />
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
                              <a href={fileSrc} target="_blank" className="text-sm text-blue-600 underline">
                                View PDF
                              </a>
                            ) : null}

                            <button onClick={() => handleRemoveFile(index)} className="absolute right-0 top-0">
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
                        <p className='text-sm mb-1 mt-1 laptop__font'>Upload Profile Image</p>
                        <span className="text-center m-auto text-xs block laptop__size"> (Only 'JPEG, WEBP, GIF and PNG' images will be accepted)</span>
                      </label>
                      <input type="file" className="input input-bordered w-full opacity-0 absolute inset-0" onChange={handleImageChange} />
                    </div>

                    {formData.image && (
                      <div className='flex items-center mt-5 shadow rounded p-2 relative w-[fit-content]'>
                        {formData.image instanceof File ? (
                          <img src={URL.createObjectURL(formData.image)} alt="Uploaded file" style={{ width: 50, height: 50, objectFit: 'cover' }} />
                        ) : (
                          <img src={formData.image} alt="Uploaded image" style={{ width: 50, height: 50, objectFit: 'cover' }} />
                        )}
                        <button type='button' onClick={handleRemoveImage} style={{ border: 'none', background: 'transparent', cursor: 'pointer', position: 'absolute', right: '0', top: '0' }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" clipRule="evenodd" d="M18 6L6 18M6 6L18 18" stroke="red" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  {selectedRole?.type === 'single-technician' && (
                    <div className='mb-0'>
                      <div className="form-control w-full p-3 mt-1 rounded relative" style={{ border: '2px dashed #ccc' }}>
                        <label className="label text-center">
                          <svg className='m-auto' width="34" height="34" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21.953 15.7599C22.3011 15.7599 22.5895 15.8644 22.9124 16.1544L29.2453 22.2609C29.5218 22.5367 29.6876 22.8314 29.6876 23.2368C29.6876 23.9911 29.1353 24.5254 28.3621 24.5254C27.9928 24.5254 27.607 24.3784 27.3485 24.0838L24.5506 21.1201L23.2982 19.8127L23.427 22.5564V36.7479C23.427 37.5219 22.7458 38.1662 21.9538 38.1662C21.1626 38.1662 20.4995 37.5219 20.4995 36.7479V22.5556L20.6095 19.8119L19.3578 21.1193L16.5764 24.0838C16.4507 24.2228 16.2974 24.3339 16.1262 24.4101C15.955 24.4863 15.7698 24.5258 15.5825 24.5262C14.8093 24.5262 14.2389 23.9919 14.2389 23.2368C14.2389 22.8314 14.3858 22.5375 14.6616 22.2609L20.886 16.2581C21.2545 15.8888 21.5853 15.7599 21.9546 15.7599M25.6765 2.96301C32.3606 2.96301 37.7789 8.3813 37.7789 15.0646C37.7789 15.4449 37.7608 15.8212 37.727 16.1921C41.108 16.9888 43.6246 20.0264 43.6246 23.6501C43.6246 27.8819 40.1942 31.3124 35.9623 31.3124H27.123V28.3659H35.9608C36.58 28.3659 37.1933 28.244 37.7654 28.007C38.3376 27.77 38.8575 27.4226 39.2954 26.9847C39.7333 26.5468 40.0806 26.0269 40.3176 25.4548C40.5546 24.8826 40.6766 24.2694 40.6766 23.6501C40.6764 22.5885 40.3182 21.5579 39.66 20.725C39.0017 19.8921 38.0818 19.3055 37.049 19.0599L34.5551 18.4722L34.7908 15.921C34.8175 15.6382 34.8301 15.3522 34.8301 15.0646C34.8301 10.0085 30.7318 5.90944 25.675 5.90944C24.148 5.90809 22.645 6.2892 21.3031 7.01798C19.9612 7.74676 18.8233 8.8 17.993 10.0816L16.7948 11.9233L14.6883 11.301C14.1166 11.1316 13.5137 11.0948 12.9255 11.1933C12.3374 11.2918 11.7794 11.5231 11.2941 11.8695C10.8087 12.216 10.4087 12.6685 10.1244 13.1927C9.84011 13.717 9.67906 14.2991 9.65347 14.8949L9.65033 15.1251L9.7234 17.6001L7.36861 18.143C6.22908 18.4081 5.21281 19.051 4.48522 19.9672C3.75763 20.8834 3.36156 22.0189 3.36147 23.1889C3.36147 24.5621 3.90699 25.8791 4.87803 26.8502C5.84906 27.8212 7.16607 28.3667 8.53933 28.3667H16.9088V31.3132H8.53933C4.0529 31.3132 0.415039 27.6753 0.415039 23.1889C0.415039 19.3326 3.10218 16.1033 6.70625 15.272L6.70311 15.0646C6.70282 13.9956 6.95199 12.9413 7.4308 11.9855C7.90961 11.0297 8.60484 10.1989 9.46119 9.55904C10.3176 8.91919 11.3114 8.48801 12.3637 8.29978C13.416 8.11156 14.4977 8.17148 15.5228 8.4748C17.6811 5.15673 21.4219 2.96301 25.675 2.96301" fill="#383d71" />
                          </svg>
                          <p className='text-sm mb-1 mt-1 laptop__font'>Upload Business Logo</p>
                          <span className="text-center m-auto text-xs block laptop__size"> (Only 'jpeg, webp, and png' images will be accepted)</span>
                        </label>
                        <input type="file" className="input input-bordered w-full opacity-0 absolute inset-0" onChange={handleLogoChange} />
                      </div>

                      {formData.businessLogo && (
                        <div className='flex items-center mt-5 shadow rounded p-2 relative w-[fit-content]'>
                          {formData.businessLogo instanceof File ? (
                            <img src={URL.createObjectURL(formData.businessLogo)} alt="Uploaded file" style={{ width: 50, height: 50, objectFit: 'cover' }} />
                          ) : (
                            <img src={formData.businessLogo} alt="Uploaded image" style={{ width: 50, height: 50, objectFit: 'cover' }} />
                          )}
                          <button type='button' onClick={handleRemoveImage} style={{ border: 'none', background: 'transparent', cursor: 'pointer', position: 'absolute', right: '0', top: '0' }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" clipRule="evenodd" d="M18 6L6 18M6 6L18 18" stroke="red" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  )}


                </div>



                {/* Submit Button */}
                <div className="text-left">
                  <button type="submit" className="primary-bg pl-5 pr-5 p-2 rounded">Register</button>
                </div>
                <div className="text-sm text-center mt-5">
                  <p>Already have an account?
                    <Link href='/' className="primary-text font-bold underline"> Login</Link> </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
