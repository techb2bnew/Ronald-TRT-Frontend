// import { useState } from 'react';
// import Image from "next/image";
// import Banner from "../../../public/signup.png";
// import Logo from "../../../public/logo.svg";
// import Facebook from "../../../public/facebook.svg";
// import Google from "../../../public/google.svg";
// import Apple from "../../../public/apple.svg";
// import Eye from "../../../public/eye.svg";
// import EyeOff from '../../../public/eye-off.svg'
// import Link from "next/link";
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// export default function Signup() {

//     const [fullName, setFullName] = useState('');
//     const [phoneNumber, setPhoneNumber] = useState('');
//     const [emailAddress, setEmailAddress] = useState('');
//     const [password, setPassword] = useState('');
//     const [showPassword, setShowPassword] = useState(false);
//     const [agreeTerms, setAgreeTerms] = useState(false);
//     const [errors, setErrors] = useState({ fullName: '', phoneNumber: '', emailAddress: '', password: '', agreeTerms: '', general: '' });

//     const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
//         event.preventDefault();
//         const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

//         try {
//             const response = await fetch(`${apiUrl}/register`, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ fullName, phoneNumber, emailAddress, password, agreeTerms }),
//             });
//             const data = await response.json();

//             if (!response.ok) {
//                 if (data.errors) {
//                     setErrors(prev => ({ ...prev, ...data.errors }));
//                     Object.values(data.errors).forEach(error => {
//                         toast.error(data.error);
//                     });
//                 } else if (data.error) {
//                     setErrors(prev => ({ ...prev, general: data.error }));
//                     toast.error(data.error);
//                 }
//             } else {
//                 console.log('Registration successful:', data);
//                 toast.success("Registration successful!");
//                 // Handle success (e.g., clearing form, redirecting)
//             }
//         } catch (error) {
//             console.error('Registration failed:', error);
//             toast.error('Registration failed. Please try again.');
//         }
//     }


//     return (
//         <div className="items-center justify-items-center">
//             <ToastContainer position="top-center" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />

//             <section className="min-h-screen w-full">
//                 <div className="bg-[#F7F7FD] flex items-center gap-8 w-full ">

//                     <div className="w-1/2 md:block hidden  ">
//                         <Image src={Banner} className="" width='1000' style={{ width: '100%', height: '100vh', objectFit: 'cover' }} height='800' alt="page img" />
//                     </div>
//                     <div className="md:w-1/2" style={{ padding: '0px 5rem' }}>
//                         <div className="text-center mb-5 w-full">
//                             <Image src={Logo} className="m-auto" width='200' height='50' alt="page img" />
//                             <h2 className="text-2xl font-bold text-[#161616] mt-5">Create Account</h2>
//                             <p className="text-[#161616] mt-3">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque leo felis, volutpat in imperdiet id, vulputate ac odio.</p>
//                         </div>
//                         <form className="mt-3" onSubmit={handleSubmit}>
//                             <div className="mb-3">
//                                 <label className="block text-[#161616]">Full Name</label>
//                                 <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full Name" className="w-full px-4 py-2 rounded-lg bg-white mt-2 border border-gray-400 focus:border-black-500 focus:bg-white focus:outline-none" autoFocus required />

//                             </div>

//                             <div className="mb-3">
//                                 <label className="block text-[#161616]">Phone Number</label>
//                                 <input type="text" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="Enter your Phone Number" className="w-full px-4 py-2 rounded-lg bg-white mt-2 border border-gray-400 focus:border-black-500 focus:bg-white focus:outline-none" required />

//                             </div>

//                             <div className="mb-3">
//                                 <label className="block text-[#161616]">Email Address</label>
//                                 <input type="email" value={emailAddress} onChange={e => setEmailAddress(e.target.value)} placeholder="Enter your email address" className="w-full px-4 py-2 rounded-lg bg-white mt-2 border border-gray-400 focus:border-black-500 focus:bg-white focus:outline-none" required />

//                             </div>

//                             <div className="mt-3 relative">
//                                 <label className="block text-[#161616]">Password</label>
//                                 <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your Password" className="w-full px-4 py-2 rounded-lg bg-white mt-2 border border-gray-400 focus:border-black-500 focus:bg-white focus:outline-none" required />
//                                 <button type="button" style={{ position: 'absolute', right: '10px', top: '44px' }} onClick={() => setShowPassword(!showPassword)}>
//                                     {showPassword ? <Image src={EyeOff} width='18' height='18' alt="eye" /> : <Image src={Eye} width='18' height='18' alt="eye" />
//                                     }
//                                 </button>

//                             </div>



//                             <div className="flex justify-between items-center mt-3">
//                                 <div className="inline-flex items-center">
//                                     <label className="flex items-center cursor-pointer relative">
//                                         <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} className="peer h-5 w-5 cursor-pointer transition-all appearance-none rounded shadow bg-white hover:shadow-md border border-slate-300 checked:bg-[#EF502E] checked:border-[#EF502E]" id="check" />
//                                         <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
//                                             <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
//                                                 <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
//                                             </svg>
//                                         </span>
//                                     </label>
//                                     <label className="cursor-pointer ml-2 text-slate-600 text-sm" htmlFor="check">
//                                         I agree to the <Link className="primary-text" href='#'>terms of service</Link> and <Link className="primary-text" href='#'>privacy policy</Link>
//                                     </label>
//                                 </div>
//                                 <Link href="/forgot" className="text-sm primary-text">Forgot Password?</Link>
//                             </div>
//                             <button type="submit" className="w-full block  hover:bg-black focus:bg-black text-white font-semibold rounded-lg primary-bg
//                 px-4 py-3 mt-4">Sign Up</button>
//                         </form>
//                         <div className="text-sm text-center mt-5">
//                             <p>Already have an account?
//                                 <Link href='/' className="primary-text"> Login</Link> </p>
//                         </div>
//                         <div className="mt-4 grid grid-cols-3 items-center text-gray-500">
//                             <hr className="border-black" />
//                             <p className="text-center text-black text-sm">OR</p>
//                             <hr className="border-black" />
//                         </div>

//                         <div className="flex gap-8 justify-center mt-4 items-center">
//                             <Link href='#' className="border-r-2 border-gray-400 pr-8">
//                                 <Image src={Google} alt="" width='80' height='100' />
//                             </Link>
//                             <Link href='#' className="border-r-2 border-gray-400 pr-8">
//                                 <Image src={Facebook} alt="" width='100' height='100' />
//                             </Link>
//                             <Link href='#'>
//                                 <Image src={Apple} alt="" width='70' height='100' />
//                             </Link>
//                         </div>


//                     </div>


//                 </div>
//             </section>
//         </div>
//     );
// }





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
import Banner from "../../../public/signup.png";
import Logo from "../../../public/logo.svg";

interface registerForm {
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
export default function Role() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState<boolean>(false);  // ✅ Track form submission state
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isEdit, setIsEdit] = useState<boolean>(false); // To differentiate between create and edit 
  const [loading, setLoading] = useState<boolean>(true);
  const [roles, setRoles] = useState<any[]>([]);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState<registerForm>({
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
    role: '',
    types: '',
    agreeTerms: 'true',
  });


  const handleSelectChange = (event: SelectChangeEvent<string>) => {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const maxWidth = 800; // Maximum image width
    const maxHeight = 600; // Maximum image height
    const quality = 0.7; // Compression quality

    const compressions = files.map(file => compressImage(file, maxWidth, maxHeight, quality));
    Promise.all(compressions)
      .then(compressedFiles => {
        setFormData((prev: any) => ({ ...prev, taxForms: compressedFiles }));
      })
      .catch(error => {
        console.error('Compression error:', error);
        toast.error('Failed to compress taxForms.');
      });
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

  const handleRemoveImage = () => {
    setFormData((prev: any) => ({ ...prev, image: null }));
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
      } else if (key !== 'image'){
        formDataObj.append(key, String(formData[key as keyof registerForm])); // Convert all values to string
      }
    });
    if (formData.image) {
      formDataObj.append('image', formData.image);
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
      const response = await fetch(`${apiUrl}/${'register'}`, {
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
        router.push('/login');
      }
    } catch (error: any) {
      toast.error(error.message || 'An unexpected error occurred');
    } finally {
      setSubmitting(false);  // ✅ Hide loader when done
    }
  };


  const fetchRoles = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';  // ✅ Get the base URL from env variable
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        localStorage.removeItem('token');
        router.push('/login');
        return;
      }

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
        router.push('/login');
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


  const countries = Country.getAllCountries();
  const states = formData.country ? State.getStatesOfCountry(formData.country) : [];


  return (
    <div className='main-container mb-5'>
      <ToastContainer position="top-center" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      {/* <h1 className="text-lg leading-6 font-bold text-gray-900">Create New Technician</h1> */}
      <div className="flex">
        <div className="w-1/2 md:block fixed">
          <Image src={Banner} className="" width='1000' style={{ width: '100%', height: '100vh', objectFit: 'cover' }} height='800' alt="page img" />
        </div>
        <div className="md:w-1/2 absolute right-[0] top-[3rem]" style={{ padding: '0px 5rem' }}>
          <div className="text-center mb-5 w-full">
            <Image src={Logo} className="m-auto" width='200' height='50' alt="page img" />
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
                        {roles.map((role, index) => (
                          <MenuItem key={index} value={role.name}>{role.name}</MenuItem> // Adjust role.name if the role object has a different structure
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

                <div className="grid grid-cols-2 gap-4">
                  {/* Client Name and Business Name */}
                  <div className='mb-4'>
                    {/* <p className='text-sm mb-2'>First Name <span className='text-red-500'>*</span></p> */}
                    <TextField fullWidth size="small" name="firstName" id="outlined-basic" color="warning" label="Enter your first name *" variant="outlined" value={formData.firstName} onChange={handleChange} />

                  </div>
                  <div className='mb-4'>
                    {/* <p className='text-sm mb-2'>Last Name <span className='text-red-500'>*</span></p> */}
                    <TextField fullWidth size="small" name="lastName" id="outlined-basic" color="warning" label="Enter your last name *" variant="outlined" value={formData.lastName} onChange={handleChange} />


                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {/* Client Name and Business Name */}
                  <div className='mb-4'>
                    {/* <p className='text-sm mb-2'>Phone <span className='text-red-500'>*</span></p> */}
                    <TextField fullWidth size="small" name="phoneNumber" id="outlined-basic" color="warning" label="Enter your phone number *" variant="outlined" value={formData.phoneNumber} onChange={handleChange} />

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


                </div>
                <div className="grid grid-cols-4 gap-4">
                  {/* Client Name and Business Name */}
                  <div className='mb-4'>
                    {/* <p className='text-sm mb-2'>Country <span className='text-[red]'>*</span></p> */}

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
                    </FormControl>


                  </div>
                  <div className='mb-4'>
                    {/* <p className='text-sm mb-2'>State <span className='text-[red]'>*</span></p> */}

                    <FormControl fullWidth size="small">
                      <InputLabel id="state" color="warning">Select state *</InputLabel>
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
                    <TextField fullWidth size="small" name="secondaryContactName" id="outlined-basic" color="warning" label="Enter your phone number" variant="outlined" value={formData.secondaryContactName} onChange={handleChange} />


                  </div>
                  <div className='mb-4'>
                    {/* <p className='text-sm mb-2'>Secondary Email</p> */}
                    <TextField fullWidth size="small" name="secondaryEmail" id="outlined-basic" color="warning" label="Enter your email address" variant="outlined" value={formData.secondaryEmail} onChange={handleChange} />


                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">

                  <div className='mb-4'>
                    {/* <p className='text-sm mb-2'>Password <span className='text-red-500'>*</span></p> */}
                    <TextField fullWidth size="small" name="password" id="outlined-basic" color="warning" label="Enter your password *" variant="outlined" value={formData.password} onChange={handleChange} />


                  </div>
                  <div className='mb-4'>
                    {/* <p className='text-sm mb-2'>Confirm Password <span className='text-red-500'>*</span></p> */}
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
                </div>
                <div className="grid grid-cols-2 gap-4">

                  <div className='mb-0'>
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
                    <div className='flex gap-4 items-center mt-5'>
                      {formData.taxForms && formData.taxForms.map((file, index) => (
                        <div key={index} className='shadow rounded p-2 relative'>
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

                  <div className='mb-0'>
                    <div className="form-control w-full p-3 mt-1 rounded relative" style={{ border: '2px dashed #ccc' }}>
                      <label className="label text-center">
                        <svg className='m-auto' width="34" height="34" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="..." fill="#EF502E" />
                        </svg>
                        <p className='text-sm mb-1 mt-1'>Upload Profile Image</p>
                        <span className="text-center m-auto text-xs block"> (Only 'jpeg, webp, and png' images will be accepted)</span>
                      </label>
                      <input type="file" className="input input-bordered w-full opacity-0 absolute inset-0" onChange={handleImageChange} />
                    </div>

                    {formData.image && (
                      <div className='flex items-center mt-5 shadow rounded p-2 relative'>
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
    </div>
  );
}
