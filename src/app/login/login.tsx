"use client"
import Image from "next/image";
import Banner from "../../../public/login.png";
import Logo from "../../../public/logo.svg";
import Facebook from "../../../public/facebook.svg";
import Google from "../../../public/google.svg";
import Apple from "../../../public/apple.svg";
import Eye from "../../../public/eye.svg";
import EyeOff from '../../../public/eye-off.svg'
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { useState } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import TextField from '@mui/material/TextField';

export default function Login() {
    const router = useRouter();
    const [email, setemailAddress] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({ email: '', password: '' });
  
  
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
 

        try {
            const response = await fetch(`${apiUrl}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password}),
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
                console.log('Login successful:', data);
                toast.success("Login successful!");
                localStorage.setItem('token', data.token);
                localStorage.setItem('userID', data.user.id);
                localStorage.setItem('types', data.user.types);
                localStorage.setItem('roleId',data?.user?.roleId)
                if (data.user.types === 'single-technician') {
                  router.push('/client/listing');
              } else {
                  router.push('/technicians/listing');
              }
                // Handle success (e.g., clearing form, redirecting)
            }
        } catch (error) {
            console.error('Login failed:', error);
            toast.error('Login failed. Please try again.');
        }
    }


  return (
    <div className="items-center justify-items-center">
            <ToastContainer position="top-center" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <section className="min-h-screen w-full">
        <div className="bg-[#F7F7FD] flex items-center gap-8 w-full ">

          <div className="w-1/2 md:block hidden  ">
            <img src='https://ronaldo-trt.s3.ap-south-1.amazonaws.com/login.png' className="" width='1000' style={{ width: '100%', height: '100vh', objectFit: 'cover' }} height='800' alt="page img" />
          </div>
          <div className="md:w-1/2" style={{ padding: '0px 5rem' }}>
            <div className="text-center mb-5 w-full">
              <Image src={Logo} className="m-auto" width='200' height='50' alt="page img" />
              <h2 className="text-2xl font-bold text-[#161616] mt-5">Welcome back to Tech Repair Tracker</h2>
              <p className="text-[#161616] mt-3">Please enter your login details to securely access your repair tracker.</p>
            </div>
            <form className="mt-6" onSubmit={handleSubmit}>
              <div className="mb-4">
                {/* <label className="block text-[#161616] mb-2">E-mail / Phone Number</label> */}
                <TextField fullWidth className="text-xs"  id="outlined-basic" color="warning" label="Enter Email Address" value={email} variant="outlined"  onChange={(e) => setemailAddress(e.target.value)}  />
               
              </div>

              <div className="mt-5 relative">
                {/* <label className="block text-[#161616] mb-2">Password</label> */}
                <TextField fullWidth  type={showPassword ? "text" : "password"} id="outlined-basic" color="warning" label="Enter Email Password" value={password} variant="outlined"   onChange={(e) => setPassword(e.target.value)} />
                  <button 
                    type="button" 
                    style={{ position: 'absolute', right: '10px', top: '18px' }}
                    onClick={() => setShowPassword(!showPassword)}
                >
                    {showPassword ? <Image src={EyeOff} width='18' height='18'   alt="eye"/>  : <Image src={Eye} width='18' height='18'   alt="eye"/>
                }
                 </button> 
              </div>

              <div className="flex justify-between items-center mt-4">
                <div className="inline-flex items-center">
                  <label className="flex items-center cursor-pointer relative">
                    <input type="checkbox" className="peer h-5 w-5 cursor-pointer transition-all appearance-none rounded shadow bg-white hover:shadow-md border border-slate-300 checked:bg-[#EF502E] checked:border-[#EF502E]" id="check" required />
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
                <Link href="/forgot" className="text-sm primary-text">Forgot Password?</Link>
              </div>

              <button type="submit" className="w-[40%] m-auto block  hover:bg-black focus:bg-black text-white font-semibold rounded-lg primary-bg
                px-4 py-3 mt-6">Log In</button>
            </form>
            <div className="text-sm text-center mt-5">
              <p>Don&apos;t have account?
                <Link href='/signup' className="primary-text"> Sign Up</Link> </p>
            </div>
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
