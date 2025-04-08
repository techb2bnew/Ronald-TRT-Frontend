"use client"; 
import React, { useState, useEffect } from 'react';
import { Country, State } from 'country-state-city';
import { ICountry, IState } from 'country-state-city';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useRouter } from "next/navigation";
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Loader from '@/app/component/loader';
import Image from 'next/image'; 

interface TechnicianForm {
  id?: string; 
  firstName: string;
  lastName: string;
  phoneNumber: string;
  secondaryContactName:string;
  email: string;
  address: string;
  country: string;
  state: string;
  city: string;
  zipCode: string;
  secondaryEmail?: string;
  password: string;
  confirmPassword:string;
  payRate: string;
  taxForms: File | null;
  amountPercentage: string;
  role:string;
  agreeTerms:string;
}
export default function Technicians() {
    const router = useRouter(); 
    const [submitting, setSubmitting] = useState<boolean>(false);  // ✅ Track form submission state
    const [errors, setErrors] = useState<{ [key: string]: string }>({}); 
    const [isEdit, setIsEdit] = useState<boolean>(false); // To differentiate between create and edit 
  

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
    secondaryContactName:'',
    secondaryEmail: '',
    password: '',
    confirmPassword:'',
    payRate: '',
    taxForms: null,
    amountPercentage: '',
    role:'enterprice',
    agreeTerms:'true',
  });

 
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
const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files ? e.target.files[0] : null; // Get the first file
  setFormData(prev => ({ ...prev, taxForms: file }));
};

const handleRemoveFile = () => {
  // Set the taxForms to null to effectively remove the file
  setFormData({ ...formData, taxForms: null });
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
          formDataObj.append(key, formData[key]); // Ensure file is appended correctly
      } else {
          // formDataObj.append(key, formData[key as keyof TechnicianForm].toString()); // Convert all values to string
            formDataObj.append(key, String(formData[key as keyof TechnicianForm]));

      }
  }); 
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
    const response = await fetch(`${apiUrl}/${'register'}`, {
      method: isEdit ? 'POST' : 'POST',
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
      router.push('/');
    }
  } catch (error: any) {
    toast.error(error.message || 'An unexpected error occurred');
  }  finally {
    setSubmitting(false);  // ✅ Hide loader when done
  }
};

   
  

  const countries = Country.getAllCountries();
  const states = formData.country ? State.getStatesOfCountry(formData.country) : [];


  return (
    <div className='main-container mb-5'>
            <ToastContainer position="top-center" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
       
      <h1 className="text-lg leading-6 font-bold text-gray-900"> Create New Technician</h1>
   
     
         <div className="bg-white p-4 mt-5 w-[60%] m-auto"  > 
             
      <div className='p-4'>
      {submitting ? (
          <div className="flex justify-center items-center h-64">
            <Loader />  {/* ✅ Show loader during submission */}
          </div>
        ) : (
      <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4">
            {/* Client Name and Business Name */}
            <div className="mb-4">
              <TextField fullWidth size="small"  name="firstName" id="outlined-basic" color="warning" label="Enter your enterprise name *"  variant="outlined"  value={formData.firstName}  onChange={handleChange} />
               
            </div>
          
          </div>
          <div className="grid grid-cols-2 gap-4">
          	  <div className="mb-4">
              <TextField fullWidth size="small" name="ownerfirstName" id="outlined-basic" color="warning" label="Enter your owner first name *"  variant="outlined"  value={formData.lastName}  onChange={handleChange} />

            
            </div>
              <div className="mb-4">
              <TextField fullWidth size="small" name="ownerlastName" id="outlined-basic" color="warning" label="Enter your owner last name *"  variant="outlined"  value={formData.lastName}  onChange={handleChange} />

            
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Client Name and Business Name */}
          
              <div className="mb-4">
              <TextField fullWidth size="small" name="email" id="outlined-basic" color="warning" label="Enter your email *"  variant="outlined"  value={formData.email}  onChange={handleChange} />
 
            </div>
            <div className="mb-4">
              <TextField fullWidth size="small" name="email" id="outlined-basic" color="warning" label="Enter your business email *"  variant="outlined"  value={formData.email}  onChange={handleChange} />
 
            </div>
          </div>
         <div className="grid grid-cols-2 gap-4">

            <div className="mb-4">
              <TextField fullWidth size="small" name="phoneNumber" id="outlined-basic" color="warning" label="Enter your phone number *"  variant="outlined"  value={formData.phoneNumber}  onChange={handleChange} />
 
            </div>
                <div className="mb-4">
              <TextField fullWidth size="small" name="phoneNumber" id="outlined-basic" color="warning" label="Enter your business phone number *"  variant="outlined"  value={formData.phoneNumber}  onChange={handleChange} />
 
            </div>
            </div>

               <div className='mb-0'> 
             
          <div className="grid grid-cols-1 gap-4">
          	<div>
          		 <div className="form-control w-full p-3 mt-1 rounded relative" style={{border:'2px dashed #ccc'}}>
                <label className="label text-center"> 
                <svg className='m-auto' width="34" height="34" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21.953 15.7599C22.3011 15.7599 22.5895 15.8644 22.9124 16.1544L29.2453 22.2609C29.5218 22.5367 29.6876 22.8314 29.6876 23.2368C29.6876 23.9911 29.1353 24.5254 28.3621 24.5254C27.9928 24.5254 27.607 24.3784 27.3485 24.0838L24.5506 21.1201L23.2982 19.8127L23.427 22.5564V36.7479C23.427 37.5219 22.7458 38.1662 21.9538 38.1662C21.1626 38.1662 20.4995 37.5219 20.4995 36.7479V22.5556L20.6095 19.8119L19.3578 21.1193L16.5764 24.0838C16.4507 24.2228 16.2974 24.3339 16.1262 24.4101C15.955 24.4863 15.7698 24.5258 15.5825 24.5262C14.8093 24.5262 14.2389 23.9919 14.2389 23.2368C14.2389 22.8314 14.3858 22.5375 14.6616 22.2609L20.886 16.2581C21.2545 15.8888 21.5853 15.7599 21.9546 15.7599M25.6765 2.96301C32.3606 2.96301 37.7789 8.3813 37.7789 15.0646C37.7789 15.4449 37.7608 15.8212 37.727 16.1921C41.108 16.9888 43.6246 20.0264 43.6246 23.6501C43.6246 27.8819 40.1942 31.3124 35.9623 31.3124H27.123V28.3659H35.9608C36.58 28.3659 37.1933 28.244 37.7654 28.007C38.3376 27.77 38.8575 27.4226 39.2954 26.9847C39.7333 26.5468 40.0806 26.0269 40.3176 25.4548C40.5546 24.8826 40.6766 24.2694 40.6766 23.6501C40.6764 22.5885 40.3182 21.5579 39.66 20.725C39.0017 19.8921 38.0818 19.3055 37.049 19.0599L34.5551 18.4722L34.7908 15.921C34.8175 15.6382 34.8301 15.3522 34.8301 15.0646C34.8301 10.0085 30.7318 5.90944 25.675 5.90944C24.148 5.90809 22.645 6.2892 21.3031 7.01798C19.9612 7.74676 18.8233 8.8 17.993 10.0816L16.7948 11.9233L14.6883 11.301C14.1166 11.1316 13.5137 11.0948 12.9255 11.1933C12.3374 11.2918 11.7794 11.5231 11.2941 11.8695C10.8087 12.216 10.4087 12.6685 10.1244 13.1927C9.84011 13.717 9.67906 14.2991 9.65347 14.8949L9.65033 15.1251L9.7234 17.6001L7.36861 18.143C6.22908 18.4081 5.21281 19.051 4.48522 19.9672C3.75763 20.8834 3.36156 22.0189 3.36147 23.1889C3.36147 24.5621 3.90699 25.8791 4.87803 26.8502C5.84906 27.8212 7.16607 28.3667 8.53933 28.3667H16.9088V31.3132H8.53933C4.0529 31.3132 0.415039 27.6753 0.415039 23.1889C0.415039 19.3326 3.10218 16.1033 6.70625 15.272L6.70311 15.0646C6.70282 13.9956 6.95199 12.9413 7.4308 11.9855C7.90961 11.0297 8.60484 10.1989 9.46119 9.55904C10.3176 8.91919 11.3114 8.48801 12.3637 8.29978C13.416 8.11156 14.4977 8.17148 15.5228 8.4748C17.6811 5.15673 21.4219 2.96301 25.675 2.96301" fill="#383d71"/>
                </svg> 
                  <p className='text-sm mb-1 mt-1'>Upload File</p>
                  <span className="text-center m-auto text-xs block"> (Only 'jpeg, webp, and png' images will be accepted)</span>
                </label>
                <input type="file" multiple className="input input-bordered w-full opacity-0 absolute inset-0" onChange={handleFileChange}   />
                {/* onChange={handleFileChange} */}
              </div>
              <div className='flex gap-4 items-center mt-5'>
              {formData.taxForms && (
                            <div className='flex gap-1 items-center mt-5' style={{ display: 'flex', alignItems: 'start', marginBottom: '10px' }}>
                                {formData.taxForms.type.includes('image') ? (
                                    <img src={URL.createObjectURL(formData.taxForms)} alt="Uploaded file" className='shadow rounded' style={{ width: 50, height: 50, marginRight: '10px', objectFit: 'cover' }} />
                                ) : (
                                    <a href={URL.createObjectURL(formData.taxForms)} target="_blank" rel="noopener noreferrer" className='shadow rounded' style={{ marginRight: '10px', textDecoration: 'none' }}>{formData.taxForms.name}</a>
                                )}
                                <button onClick={handleRemoveFile} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" clipRule="evenodd" d="M18 6L6 18M6 6L18 18" stroke="red" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </button>
                            </div>
                        )}

            </div> 
          	</div>
       
          </div>
             <div className="mb-4"> 
            <TextField fullWidth size="small" name="address" id="outlined-basic" color="warning" label="Enter your address *"  variant="outlined"  value={formData.address}  onChange={handleChange} />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {/* Client Name and Business Name */}
            <div className="mb-4"> 

                      <FormControl fullWidth size="small">
                      <InputLabel id="country"  color="warning">Select country *</InputLabel>
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
                      <MenuItem  key={country.isoCode} value={country.isoCode}> {country.name} </MenuItem>
                        ))} 
                      </Select>
                      </FormControl>

              
            </div>
            <div className="mb-4">

              <FormControl fullWidth size="small">
              <InputLabel id="state"  color="warning">Select state *</InputLabel>
              <Select
              labelId="state"
              id="select-state"
              value={formData.state}
              label="Select State"
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
            <div className="mb-4">
            <TextField fullWidth size="small" name="city" id="outlined-basic" color="warning" label="Enter your city *"  variant="outlined"  value={formData.city}  onChange={handleChange} />
              
            </div>
            <div className="mb-4">
                <TextField fullWidth size="small" name="zipCode" id="outlined-basic" color="warning" label="Enter your zip code *"  variant="outlined"  value={formData.zipCode}  onChange={handleChange} />
            
            </div>
          </div>
       
          <div className="grid grid-cols-3 gap-4">

            <div className="mb-4">
              <TextField fullWidth size="small" name="password" id="outlined-basic" color="warning" label="Enter your password *"  variant="outlined"  value={formData.password}  onChange={handleChange} />

             
            </div>
            <div className="mb-4">
        <TextField 
          fullWidth 
          size="small" 
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
      </div>
            <div className="mb-4">

              <FormControl fullWidth size="small">
              <InputLabel id="select-plan"  color="warning">Select plan *</InputLabel>
              <Select
              labelId="select-plan"
              id="select-plan"
              value='plan'
              label="Select plan"
              color="warning"
              name="select-plan"
              onChange={handleSelectChange}
              > 
              <MenuItem value='basic'>Basic</MenuItem>
              <MenuItem value='premium'>Premium</MenuItem>
              <MenuItem value='standard'>Standard</MenuItem>
               
              </Select>
              </FormControl>
      		</div> 
            </div> 
          
              <div className="flex justify-between items-center mt-2">
                <div className="inline-flex items-center">
                  <label className="flex items-center cursor-pointer relative">
                    <input type="checkbox" className="peer h-5 w-5 cursor-pointer transition-all appearance-none rounded shadow bg-white hover:shadow-md border border-slate-300 checked:bg-[#383d71] checked:border-[#383d71]" id="check" />
                    <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                      </svg>
                    </span>
                  </label>
                  <label className="cursor-pointer ml-2 text-slate-600 text-sm" htmlFor="check">
                   User Authorizes to  View Data
                  </label>
                </div> 
              </div>
               <div className="flex justify-between items-center mt-4">
                <div className="inline-flex items-center">
                  <label className="flex items-center cursor-pointer relative">
                    <input type="checkbox" className="peer h-5 w-5 cursor-pointer transition-all appearance-none rounded shadow bg-white hover:shadow-md border border-slate-300 checked:bg-[#383d71] checked:border-[#383d71]" id="terms" />
                    <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                      </svg>
                    </span>
                  </label>
                  <label className="cursor-pointer ml-2 text-slate-600 text-sm" htmlFor="terms">
                   User Agrees to Terms & Conditions
                  </label>
                </div> 
              </div>
           <p className='mb-4 mt-5'><b>Role:</b> IFS Enterprises</p>
         
          </div>
        


          {/* Submit Button */}
          <div className="text-left">
          <button type="submit" className="primary-bg pl-5 pr-5 p-2 rounded">Register</button>
          </div>
        </form>
         )}
      </div>
    </div>
    </div> 
  );
}
