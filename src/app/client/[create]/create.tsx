"use client";
import React, { useState, useEffect } from 'react';
import { Country, State } from 'country-state-city';
import { ICountry, IState } from 'country-state-city';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Loader from '@/app/component/loader';
import Breadcrumb from '@/app/component/breadcrumb';
import { FormHelperText } from '@mui/material';
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import GooglePlacesAutocomplete from 'react-google-places-autocomplete';
import { geocodeByAddress, getLatLng } from 'react-google-places-autocomplete';
import { SingleValue, ActionMeta } from 'react-select';

interface CustomerForm {
  id?: string;  // Optional ID for editing
  fullName: string;
  phoneNumber: string;
  email: string;
  address: string;
  userId: string;
  roleType: string;
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

export default function Technicians() {
  const [formData, setFormData] = useState<CustomerForm>({
    fullName: '',
    phoneNumber: '',
    email: '',
    address: '',
    userId: '',
    roleType: ''
  });
  const [submitting, setSubmitting] = useState<boolean>(false);  // ✅ Track form submission state
  const router = useRouter();
  const [isEdit, setIsEdit] = useState<boolean>(false); // To differentiate between create and edit 
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [address, setAddressValue] = useState<NullableGooglePlacesOption>(null);

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
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleAddressSelect = async (selectedAddress: AddressValue) => {
    if (!selectedAddress) return;

    // Immediately update both states
    setAddressValue(selectedAddress);

    // Clean the selected address before updating the formData
    const cleanedAddress = selectedAddress.label.replace(/^,|\s*,\s*/g, '').trim();

    setFormData(prev => ({
      ...prev,
      address: cleanedAddress, // Use the cleaned address
    }));

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

      // Clean up the formatted address
      const fullAddress = `${street.trim()}, ${city}, ${state}, ${country}, ${zip}`.replace(/^,|\s*,\s*/g, '').trim();

      // Update formData with the cleaned full address
      setFormData(prev => ({
        ...prev,
        address: fullAddress,
      }));

    } catch (error) {
      console.error('Error fetching address details:', error);
      toast.error('Failed to process address details');
      // Fallback to the cleaned address if geocoding fails
      setFormData(prev => ({
        ...prev,
        address: cleanedAddress,
      }));
    }
  };


  // Handle form field change
  const handleChange: React.ChangeEventHandler<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement> = (e) => {
    const { name, value } = e.target as HTMLInputElement | HTMLSelectElement;;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (name === 'phoneNumber') {
      const numericValue = value.replace(/\D/g, '');
      if (numericValue.length > 10) return;
    }

    if (name === "email") {
      // Only validate if email is not empty
      if (value && !emailPattern.test(value)) {
        setErrors((prev) => ({
          ...prev,
          email: 'Please enter a valid email address',
        }));
      } else {
        // Clear error if email is valid or empty
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.email;
          return newErrors;
        });
      }
      setFormData((prevData) => ({
        ...prevData,
        [name]: value
      }));
      return;
    }

    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const fetchCustomerData = async (customerId: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    try {
      const token = localStorage.getItem('token');

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/fetchSingleCustomer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ customerId }),
      });
      const data = await response.json();


      // Construct the full address for display

      if (data.customers && data.customers.customer) {
        const customerData = data.customers.customer;

        if (customerData.address) {
          const addressValue = {
            label: customerData.address,
            value: {
              place_id: `existing-${customerData.id}`,
              description: customerData.address
            }
          };
          setAddressValue(addressValue);
        }


        if (response.ok) {
          setFormData({
            fullName: customerData.fullName || '',
            phoneNumber: customerData.phoneNumber || '',
            email: customerData.email || '',
            address: customerData.address || '',
            userId: customerData.userId || '',
            roleType: customerData.roleType || '',
            id: customerData.id
          });
        } else {
          toast.error(data.error || 'Error fetching technician data');
        }
      } else {
        toast.error('Customer data not found');
      }
    } catch (error) {
      toast.error('An error occurred while fetching technician data');
    }
  };




  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const customerId = searchParams.get('customerId') || '';
    console.log(customerId, 'customerIdcustomerId')
    if (customerId) {
      setIsEdit(true);  // Set to true if `customerId` exists in the URL
      setFormData(prev => ({ ...prev, id: customerId }));
      fetchCustomerData(customerId);
    } else {
      setIsEdit(false); // Set to false if `customerId` is missing
    }
  }, []);
  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalAddress = formData.address || (address?.label || '');
    const newErrors: { [key: string]: string } = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (formData.email && !emailPattern.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (formData.phoneNumber) {
      const digitsOnly = formData.phoneNumber.replace(/\D/g, '');
      if (digitsOnly.length !== 11) {
        newErrors.phoneNumber = 'Phone number must be 10 digits';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userID');
    const roleType = localStorage.getItem('types');

    if (!userId && !roleType) {
      toast.error("User ID not found!");
      return;
    }

    try {
      setSubmitting(true);

      const requestBody = {
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        address: finalAddress,
        userId: userId || '',
        roleType: roleType || '',
        ...(isEdit && formData.id && { customerId: formData.id }),
      };

      const response = await fetch(`${isEdit ? '/api/customerCreate' : '/api/customerCreate'}`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
        setFormData({
          fullName: '',
          phoneNumber: '',
          email: '',
          address: '',
          userId: '',
          roleType: ''
        });

        router.push('/client/listing');
      } else {
        const apiErrors: { [key: string]: string } = {};

        if (data.error) {
          if (data.error.toLowerCase().includes('email')) {
            apiErrors.email = data.error;
          } else if (data.error.toLowerCase().includes('phone')) {
            apiErrors.phoneNumber = data.error;
          } else {
            toast.error(data.error);
          }
        }

        if (data.errors && typeof data.errors === 'object') {
          Object.entries(data.errors).forEach(([key, value]) => {
            if (key === 'phoneNumber' || key === 'email') {
              apiErrors[key] = String(value);
            }
          });
        }

        if (Object.keys(apiErrors).length > 0) {
          setErrors(prev => ({ ...prev, ...apiErrors }));
        } else if (data.error && Object.keys(apiErrors).length === 0) {
          toast.error(data.error);
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
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
  // const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0]; // Sirf ek file lene ke liye
  //   if (!file) return;

  //   const maxWidth = 800; // Maximum image width
  //   const maxHeight = 600; // Maximum image height
  //   const quality = 0.7; // Compression quality

  //   try {
  //     const compressedFile = await compressImage(file, maxWidth, maxHeight, quality);
  //     setFormData((prev: any) => ({ ...prev, image: compressedFile }));
  //   } catch (error) {
  //     console.error('Compression error:', error);
  //     toast.error('Failed to compress image.');
  //   }
  // };
  const handleRemoveImage = () => {
    setFormData((prev: any) => ({ ...prev, image: null }));
  };
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
      return;
    }

    const digitsOnly = value.replace(/\D/g, '');
    const nationalNumber = getNationalNumber(digitsOnly, value);

    // Stop if national number exceeds 10 digits
    // if (nationalNumber.length > 10) {
    //   return;
    // }

    // Set error if not exactly 10 digits
    // if (nationalNumber.length !== 10) {
    //   setErrors(prev => ({
    //     ...prev,
    //     phoneNumber: 'Phone number must be exactly 10 digits'
    //   }));
    // } else {
    //   setErrors(prev => {
    //     const newErrors = { ...prev };
    //     delete newErrors.phoneNumber;
    //     return newErrors;
    //   });
    // }

    // Update form data
    setFormData(prev => ({
      ...prev,
      phoneNumber: value
    }));
  };

  return (
    <div className='w-[60%] m-auto mb-5 max-md:w-full'>
      <Breadcrumb
        items={[
          { label: 'Customers', href: '/client/listing' },
          isEdit
            ? { label: 'Edit Customer' }
            : { label: 'Create Customer', href: '/client/create' },

        ]}
      />
      {/* <h1 className="text-lg leading-6 font-bold text-gray-900 mb-[2px] sm:mb-0">Create IFS Customer</h1> */}
      <h1 className="text-lg leading-6 font-bold text-gray-900 mb-[2px] sm:mb-0">{isEdit ? 'Edit Customer' : 'Create New Customer'}</h1>
      {/* <p className='text-sm'>Onboard clients effortlessly for seamless collaboration!</p> */}
      <div className='bg-white p-4 mt-5 '>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            {/* Client Name and Business Name */}
            <div className='mb-4 relative'>

              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon__tech">
                <circle cx="10" cy="6" r="3" stroke="#5B5B99" strokeWidth="1.5" />
                <path d="M5 16C5 13.8 7 12 10 12C13 12 15 13.8 15 16" stroke="#5B5B99" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <TextField fullWidth name="fullName" id="outlined-basic" color="warning" label="Full name" size="small" value={formData.fullName} onChange={handleChange} />
              {errors.fullName && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                  {errors.fullName}
                </div>
              )}
            </div>
            <div className='mb-4 relative'>
              <svg width="16" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon__tech">
                <rect x="2" y="4" width="12" height="8" rx="1.5" stroke="#5B5B99" strokeWidth="1.2" />
                <path d="M2.5 4.5L8 8.5L13.5 4.5" stroke="#5B5B99" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <TextField fullWidth name="email" id="outlined-basic" color="warning" label="Email" size="small" value={formData.email} onChange={handleChange} />
              {errors.email && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                  {errors.email}
                </div>
              )}

            </div>
            {/* <div className='mb-4 relative'>

              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon__tech">
                <circle cx="10" cy="6" r="3" stroke="#5B5B99" strokeWidth="1.5" />
                <path d="M5 16C5 13.8 7 12 10 12C13 12 15 13.8 15 16" stroke="#5B5B99" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <TextField fullWidth name="lastName" id="outlined-basic" color="warning" label="Last name" size="small" value={formData.lastName} onChange={handleChange} />
              {errors.lastName && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                  {errors.lastName}
                </div>
              )}

            </div> */}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Client Phone and Email */}
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

              {/* <TextField fullWidth type='number' name="phoneNumber" id="outlined-basic" color="warning" label="Phone number" size="small" value={formData.phoneNumber} onChange={handleChange} inputProps={{
                maxLength: 10,
              }}/> */}
              {errors.phoneNumber && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                  {errors.phoneNumber}
                </div>
              )}

            </div>

            {/* Address */}
            <div className='mb-4 relative'>
              <GooglePlacesAutocomplete
                apiKey="AIzaSyBXNyT9zcGdvhAUCUEYTm6e_qPw26AOPgI"
                selectProps={{
                  placeholder: 'Search for an address...',
                  value: address,
                  onChange: (newValue: SingleValue<GooglePlacesOption>, actionMeta: ActionMeta<GooglePlacesOption>) => {
                    if (newValue) {
                      handleAddressSelect(newValue);
                    } else if (actionMeta.action === 'clear') {
                      // Handle clear action
                      setAddressValue(null); // Make sure you have this state setter
                      setFormData(prev => ({
                        ...prev,
                        address: '',
                      }));
                    }
                  },
                  isClearable: true,
                  styles: {
                    input: (provided) => ({
                      ...provided,
                      borderRadius: '4px',
                      width: '100%'
                    }),
                    control: (provided) => ({
                      ...provided,
                      borderColor: errors.address ? 'ccc' : '#ccc', // Red border if error exists
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
            </div>
            {/* <div className='mb-4 relative'>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="#5B5B99" className="icon__tech"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <TextField fullWidth name="address" id="outlined-basic" color="warning" label="Address" size="small" value={formData.address} onChange={handleChange} />
            {errors.address && (
              <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                {errors.address}
              </div>
            )}

          </div> */}
          </div>


          {/* <div className="grid grid-cols-4 gap-4"> 
            <div className='mb-4 relative'>
              

              <FormControl fullWidth size="small">
                <InputLabel id="country" color="warning">Select country *</InputLabel>
                <Select
                  labelId="country"
                  id="country"
                  color="warning"
                  value={formData.country}
                  label="Select country"
                  name="country"

                  onChange={handleSelectChange}
                >
                  {countries.map((country: ICountry) => (
                    <MenuItem key={country.isoCode} value={country.isoCode}> {country.name} </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {errors.country && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                  {errors.country}
                </div>
              )}

            </div>
            <div className='mb-4 relative'>
             
              <FormControl fullWidth size="small">
                <InputLabel id="demo-simple-select-label" color="warning">Select state *</InputLabel>
                <Select
                  labelId="demo-simple-select-label"
                  id="demo-simple-select"
                  value={formData.state}
                  label="State state"
                  color="warning"
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
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="#5B5B99" className="icon__tech"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <TextField fullWidth name="city" id="outlined-basic" color="warning" label="City" size="small" value={formData.city} onChange={handleChange} />


            </div>
            <div className='mb-4 relative'>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon__tech">
                <path d="M7 5L2 10L7 15" stroke="#5B5B99" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13 5L18 10L13 15" stroke="#5B5B99" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <TextField fullWidth name="zipCode" id="outlined-basic" color="warning" label="Zip code" size="small" value={formData.zipCode} onChange={handleChange} />
              {errors.zipCode && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                  {errors.zipCode}
                </div>
              )}

            </div>
          </div> */}
          {/* <div className="grid grid-cols-2 gap-4">

            <div className='mb-0'>
              <div className="form-control w-full p-3 mt-1 rounded relative" style={{ border: '2px dashed #ccc' }}>
                <label className="label text-center">
                  <svg className='m-auto' width="34" height="34" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21.953 15.7599C22.3011 15.7599 22.5895 15.8644 22.9124 16.1544L29.2453 22.2609C29.5218 22.5367 29.6876 22.8314 29.6876 23.2368C29.6876 23.9911 29.1353 24.5254 28.3621 24.5254C27.9928 24.5254 27.607 24.3784 27.3485 24.0838L24.5506 21.1201L23.2982 19.8127L23.427 22.5564V36.7479C23.427 37.5219 22.7458 38.1662 21.9538 38.1662C21.1626 38.1662 20.4995 37.5219 20.4995 36.7479V22.5556L20.6095 19.8119L19.3578 21.1193L16.5764 24.0838C16.4507 24.2228 16.2974 24.3339 16.1262 24.4101C15.955 24.4863 15.7698 24.5258 15.5825 24.5262C14.8093 24.5262 14.2389 23.9919 14.2389 23.2368C14.2389 22.8314 14.3858 22.5375 14.6616 22.2609L20.886 16.2581C21.2545 15.8888 21.5853 15.7599 21.9546 15.7599M25.6765 2.96301C32.3606 2.96301 37.7789 8.3813 37.7789 15.0646C37.7789 15.4449 37.7608 15.8212 37.727 16.1921C41.108 16.9888 43.6246 20.0264 43.6246 23.6501C43.6246 27.8819 40.1942 31.3124 35.9623 31.3124H27.123V28.3659H35.9608C36.58 28.3659 37.1933 28.244 37.7654 28.007C38.3376 27.77 38.8575 27.4226 39.2954 26.9847C39.7333 26.5468 40.0806 26.0269 40.3176 25.4548C40.5546 24.8826 40.6766 24.2694 40.6766 23.6501C40.6764 22.5885 40.3182 21.5579 39.66 20.725C39.0017 19.8921 38.0818 19.3055 37.049 19.0599L34.5551 18.4722L34.7908 15.921C34.8175 15.6382 34.8301 15.3522 34.8301 15.0646C34.8301 10.0085 30.7318 5.90944 25.675 5.90944C24.148 5.90809 22.645 6.2892 21.3031 7.01798C19.9612 7.74676 18.8233 8.8 17.993 10.0816L16.7948 11.9233L14.6883 11.301C14.1166 11.1316 13.5137 11.0948 12.9255 11.1933C12.3374 11.2918 11.7794 11.5231 11.2941 11.8695C10.8087 12.216 10.4087 12.6685 10.1244 13.1927C9.84011 13.717 9.67906 14.2991 9.65347 14.8949L9.65033 15.1251L9.7234 17.6001L7.36861 18.143C6.22908 18.4081 5.21281 19.051 4.48522 19.9672C3.75763 20.8834 3.36156 22.0189 3.36147 23.1889C3.36147 24.5621 3.90699 25.8791 4.87803 26.8502C5.84906 27.8212 7.16607 28.3667 8.53933 28.3667H16.9088V31.3132H8.53933C4.0529 31.3132 0.415039 27.6753 0.415039 23.1889C0.415039 19.3326 3.10218 16.1033 6.70625 15.272L6.70311 15.0646C6.70282 13.9956 6.95199 12.9413 7.4308 11.9855C7.90961 11.0297 8.60484 10.1989 9.46119 9.55904C10.3176 8.91919 11.3114 8.48801 12.3637 8.29978C13.416 8.11156 14.4977 8.17148 15.5228 8.4748C17.6811 5.15673 21.4219 2.96301 25.675 2.96301" fill="#383d71" />
                  </svg>
                  <p className='text-sm mb-1 mt-1'>Upload Profile Image</p>
                  <span className="text-center m-auto text-xs block"> (Only 'JPEG, WEBP, GIF and PNG' images will be accepted)</span>
                </label>
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="input input-bordered w-full opacity-0 absolute inset-0" onChange={handleImageChange} />
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
          </div> */}
          {/* Submit Button */}
          <div className="text-left mt-5">
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
