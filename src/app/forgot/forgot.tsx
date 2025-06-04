import Image from "next/image";
import Banner from "../../../public/forgot.png";
import Logo from "../../../public/trt-logo.png";
import { useState, FormEvent } from "react";
import toast from 'react-hot-toast';
import TextField from '@mui/material/TextField';
import Swal from "sweetalert2";
import { useRouter } from 'next/navigation';
import Link from "next/link";

interface ForgotForm {
  emailOrPhone: string;
}
export default function Forgot() {
  const router = useRouter()
  const [input, setInput] = useState<ForgotForm>({ emailOrPhone: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ emailOrPhone: '', form: '' });

  const validateInput = (value: string): boolean => {
    // Check if it's an email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Check if it's a phone number (simple check for digits)
    const phoneRegex = /^[\d\s+-]+$/;

    return emailRegex.test(value) || (phoneRegex.test(value) && value.replace(/\D/g, '').length >= 10);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setInput({ ...input, emailOrPhone: value });

    // Clear error when user types
    if (errors.emailOrPhone) {
      setErrors(prev => ({ ...prev, emailOrPhone: '' }));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!input.emailOrPhone.trim()) {
      setErrors({
        emailOrPhone: 'Email is required',
        form: ''
      });
      setLoading(false);
      return;
    }

    if (!validateInput(input.emailOrPhone)) {
      setErrors({
        emailOrPhone: 'Please enter a valid email',
        form: ''
      });
      setLoading(false);
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

    try {
      const response = await fetch(`api/forgot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.error) {
          if (data.error.includes('email') || data.error.includes('account') || data.error.includes('User not found')) {
            // Email related errors
            setErrors(prev => ({ ...prev, emailOrPhone: data.error }));
          } else {
            // Other general errors
            setErrors(prev => ({ ...prev, general: data.error }));
            toast.error(data.error);
          }
        }
      } else {
        await Swal.fire({
          title: 'Success',
          text: 'Password reset link has been sent to your email.',
          icon: 'success',
          confirmButtonText: 'OK'
        }).then(() => {
          router.push('/login'); // Redirect to login page after confirmation
        });
      }
    } catch (error) {
      toast.error('Please try again.');
    }
  }

  return (
    <div className="items-center justify-items-center">

      <section className="min-h-screen w-full">
        <div className="bg-white flex items-center gap-8 w-full ">
          <div className="w-1/2 md:block hidden  ">
            <Image src={Banner} className="" width='1000' style={{ width: '100%', height: '100vh', objectFit: 'cover' }} height='800' alt="page img" />
          </div>
          <div className="md:w-1/2" style={{ padding: '0px 5rem' }}>
            <div className="text-center mb-5 w-full">
              <Image src={Logo} className="m-auto pb-8" width='100' height='50' alt="page img" />
              <h2 className="text-2xl font-bold text-[#161616] mt-8">Forgot Your Password</h2>
              <p className="text-[#161616] mt-3">Enter your registered email address and we'll send you a link to reset your password.</p>
            </div>
            <form onSubmit={handleSubmit} className="mt-6">
              <div className="relative">
                <svg width="16" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon__tech">
                  <rect x="2" y="4" width="12" height="8" rx="1.5" stroke="#5B5B99" strokeWidth="1.2" />
                  <path d="M2.5 4.5L8 8.5L13.5 4.5" stroke="#5B5B99" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <TextField fullWidth name="email" id="outlined-basic" color="warning" label="Enter your email *" size="small" onChange={handleChange} />
                 {errors.emailOrPhone && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                  {errors.emailOrPhone}
                </div>
              )}
              </div>
              <button type="submit" className="w-full block  hover:bg-black focus:bg-black text-white font-semibold rounded-lg primary-bg
                px-4 py-3 mt-6">Forgot Password</button>
              <Link href="/" className="flex items-center justify-center mt-5 hover:underline">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back to Login
              </Link>
            </form>

          </div>


        </div>
      </section>
    </div>
  );
}
