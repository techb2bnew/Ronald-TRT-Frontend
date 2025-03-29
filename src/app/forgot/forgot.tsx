import Image from "next/image";
import Banner from "../../../public/forgot.png";
import Logo from "../../../public/trt-logo.png"; 
import { useState, FormEvent } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import TextField from '@mui/material/TextField';

interface ForgotForm {
    emailOrPhone: string;
  }
export default function Forgot() {
    const [input, setInput] = useState<ForgotForm>({ emailOrPhone: '' });
    const [loading, setLoading] = useState(false); 
    const [errors, setErrors] = useState({ emailOrPhone: '', });
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput({ ...input, emailOrPhone: e.target.value });
      };

     const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
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
                    toast.success('Password reset email sent successfully'); 
                    // Handle success (e.g., clearing form, redirecting)
                }
            } catch (error) { 
                toast.error('Please try again.');
            }
        }

  return (
    <div className="items-center justify-items-center">
            <ToastContainer position="top-center" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />

      <section className="min-h-screen w-full">
        <div className="bg-[#F7F7FD] flex items-center gap-8 w-full "> 
          <div className="w-1/2 md:block hidden  ">
            <Image src={Banner} className="" width='1000' style={{ width: '100%', height: '100vh', objectFit: 'cover' }} height='800' alt="page img" />
          </div>
          <div className="md:w-1/2" style={{ padding: '0px 5rem' }}>
            <div className="text-center mb-5 w-full">
              <Image src={Logo} className="m-auto pb-8" width='100' height='50' alt="page img" />
              <h2 className="text-2xl font-bold text-[#161616] mt-8">Forgot Your Password</h2>
              <p className="text-[#161616] mt-3">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque leo felis, volutpat in imperdiet id, vulputate ac odio.</p>
            </div> 
            <form onSubmit={handleSubmit} className="mt-6">
              <div>
                {/* <label className="block text-[#161616]">E-mail / Phone Number</label> */}
              <TextField fullWidth size="medium" name="email" id="outlined-basic" color="warning" label="Enter your email *"  variant="outlined"   onChange={handleChange} />
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
