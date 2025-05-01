import Image from "next/image";
import Banner from "../../../public/forgot.png";
import Logo from "../../../public/trt-logo.png"; 
import { useState, FormEvent } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import TextField from '@mui/material/TextField';
import Swal from "sweetalert2";
import { useRouter } from 'next/navigation';

interface ForgotForm {
    emailOrPhone: string;
  }
export default function Forgot() {
  const router = useRouter()
    const [input, setInput] = useState<ForgotForm>({ emailOrPhone: '' });
    const [loading, setLoading] = useState(false); 
    const [errors, setErrors] = useState({ emailOrPhone: '', form:''});

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
                const response = await fetch(`${apiUrl}/forgot-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(input),
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
            <ToastContainer position="top-center" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />

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
              <TextField fullWidth  error={!!errors.emailOrPhone}
                  helperText={errors.emailOrPhone} name="email" id="outlined-basic" color="warning" label="Enter your email *"  size="small"   onChange={handleChange} />
                {/* <input type="email" name="" onChange={handleChange} id="" placeholder="Enter your email" className="w-full px-4 py-2 rounded-lg bg-white mt-2 border border-gray-400 focus:border-black-500 focus:bg-white focus:outline-none" autoFocus required /> */}
              </div>  
              <button type="submit" className="w-full block  hover:bg-black focus:bg-black text-white font-semibold rounded-lg primary-bg
                px-4 py-3 mt-6">Forgot Password</button>
            </form>
               
          </div>


        </div>
      </section>
    </div>
  );
}
