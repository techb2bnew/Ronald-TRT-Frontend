"use client"
import Image from "next/image";
import Banner from "../../../public/login.png";
import Logo from "../../../public/trt-logo.png";
import Facebook from "../../../public/facebook.svg";
import Google from "../../../public/google.svg";
import Apple from "../../../public/apple.svg";
import Eye from "../../../public/eye.svg";
import EyeOff from '../../../public/eye-off.svg'
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import 'react-toastify/dist/ReactToastify.css';
import TextField from '@mui/material/TextField';
import Swal from 'sweetalert2';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '', form: '' });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  // const [rememberMe, setRememberMe] = useState(false);

  // Check if user is already logged in and redirect to dashboard
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userID = localStorage.getItem("userID");
    
    if (token && userID) {
      // User is already logged in, redirect to dashboard
      router.replace("/dashboard");
    } else {
      setIsCheckingAuth(false);
    }
  }, [router]);

  // Don't render the login form while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin h-8 w-8 border-4 border-[#383d71] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const validateForm = () => {
    const newErrors = { email: '', password: '', form: '' };
    let isValid = true;

    // Email validation
    if (!email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) {
      return;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';


    try {
      setSubmitting(true); 

      const response = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Clear previous errors
        setErrors({ email: '', password: '', form: '' });

        // Handle specific error cases
        if (data.error) {
          if (data.error.includes('email') || data.error.includes('account')) {
            // Email related errors
            setErrors(prev => ({ ...prev, email: data.error }));
          } else if (data.error.includes('password') || data.error.includes('Invalid')) {
            // Password related errors
            setErrors(prev => ({ ...prev, password: data.error }));
          } else {
            // General errors
            toast.error(data.error);
          }
        }
      } else {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userID', data.user.id);
        localStorage.setItem('types', data.user.types);
        localStorage.setItem('roleId', data?.user?.roleId)
        if (data.user.permissions) {
          localStorage.setItem('permissions', JSON.stringify(data.user.permissions));
        }
        // if (rememberMe) {
        //   localStorage.setItem('rememberedEmail', email);
        //   localStorage.setItem('rememberedPassword', password);
        // } else {
        //   localStorage.removeItem('rememberedEmail');
        //   localStorage.removeItem('rememberedPassword');
        // }
            if (data.user.types === 'ifs' || data.user.types === 'single-technician') {
        // If the role is 'ifs', show SweetAlert instead of redirecting
        if (data.user.types === 'ifs' || data.user.types === 'single-technician') {
          Swal.fire({
            icon: 'info',
            title: 'Access Restricted',
            text: 'You do not have access to admin.',
            confirmButtonText: 'OK',
          }).then(() => {
            // You can handle any additional logic here if needed
          });
        }
      } else {
          router.push('/dashboard');
        }  
      }
    } catch (error) {
      console.error('Login failed:', error);
      toast.error('Login failed. Please try again.');
    }
    setSubmitting(false);

  }

  // useEffect(() => {
  //   const rememberedEmail = localStorage.getItem('rememberedEmail');
  //   const rememberedPassword = localStorage.getItem('rememberedPassword');

  //   if (rememberedEmail && rememberedPassword) {
  //     setemailAddress(rememberedEmail);
  //     setPassword(rememberedPassword);
  //     setRememberMe(true); // ✅ Auto-check "Remember Me"
  //   }
  // }, []);


  return (
    <div className="items-center justify-items-center">
      <section className="min-h-screen w-full">
        <div className="bg-white flex items-center gap-8 w-full ">

          <div className="w-1/2 md:block hidden  ">
            <img src='https://jdp.nyc3.cdn.digitaloceanspaces.com/logo/image+(27).avif' className="" width='1000' style={{ width: '100%', height: '100vh', objectFit: 'cover' }} height='800' alt="page img" />
          </div>
          <div className="md:w-1/2" style={{ padding: '0px 5rem' }}>
            <div className="text-center mb-5 w-full">
              <Image src={Logo} className="m-auto rounded object-cover" width='100' height='50' alt="page img" />
              <h2 className="text-2xl font-bold text-[#161616] mt-5">Welcome back to Prorevv!</h2>
              <p className="text-[#161616] mt-3">Please enter your login details to securely access your repair tracker.</p>
            </div>
            <form className="mt-6" onSubmit={handleSubmit}>
              <div className='mb-4 relative'>
                <svg width="16" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon__tech">
                  <rect x="2" y="4" width="12" height="8" rx="1.5" stroke="#5B5B99" strokeWidth="1.2" />
                  <path d="M2.5 4.5L8 8.5L13.5 4.5" stroke="#5B5B99" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <TextField
                  fullWidth
                  size="small"
                  className="text-xs"
                  id="email"
                  color="warning"
                  label="Email Address"
                  value={email}
                  variant="outlined"
                  onChange={(e) => {
                    setEmail(e.target.value.toLowerCase().replace(/\s/g, ""));
                    if (errors.email) {
                      setErrors(prev => ({ ...prev, email: '' }));
                    }
                  }}
                />
                {errors.email && (
                  <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                    {errors.email}
                  </div>
                )}
              </div>

              <div className="mt-5 relative">

                <TextField
                  fullWidth
                  size="small"
                  type={showPassword ? "text" : "password"}
                  id="password"
                  color="warning"
                  label="Password"
                  value={password}
                  variant="outlined"
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) {
                      setErrors(prev => ({ ...prev, password: '' }));
                    }
                  }}
                />
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

              {/* <div className="flex justify-between items-center mt-4">
                <div className="inline-flex items-center">
                  <label className="flex items-center cursor-pointer relative">
                    <input type="checkbox"   checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} className="peer h-5 w-5 cursor-pointer transition-all appearance-none rounded shadow bg-white hover:shadow-md border border-slate-300 checked:bg-[#383d71] checked:border-[#383d71]" id="check" />
                    <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                      </svg>
                    </span>
                  </label>
                  <label className="cursor-pointer ml-2 text-slate-600 text-sm" htmlFor="check">
                    Remember Me
                  </label>
                </div>
                </div> */}
              <div className="pt-4 text-right">
                <Link href="/forgot" className="text-sm primary-text underline">Forgot Password?</Link>
              </div>
              <button type="submit" className="w-[40%] m-auto block flex items-center justify-center gap-2 focus:bg-black text-white font-semibold rounded-lg primary-bg
                px-4 py-3 mt-6"
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
                  'Log In'
                )}
              </button>

            </form>
            {/* <div className="text-sm text-center mt-5">
              <p>Don&apos;t have an account?
                <Link href='/signup' className="primary-text font-bold underline"> Sign Up</Link> </p>
            </div> */}
            {/* <div className="mt-7 grid grid-cols-3 items-center text-gray-500">
              <hr className="border-black" />
              <p className="text-center text-black text-sm">OR</p>
              <hr className="border-black" />
            </div>

            <div className="flex gap-8 justify-center mt-8 items-center">
              <Link href='#' className="border-r-2 border-gray-400 pr-8">
                <Image src={Google} alt="" width='80' height='100' />
              </Link>
              <Link href='#' className="border-r-2 border-gray-400 pr-8">
                <Image src={Facebook} alt="" width='100' height='100' />
              </Link>
              <Link href='#'>
                <Image src={Apple} alt="" width='70' height='100' />
              </Link>
            </div> */}


          </div>


        </div>
      </section>
    </div>
  );
}
