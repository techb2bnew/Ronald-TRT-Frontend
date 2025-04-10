
"use client";
import Image from "next/image";
import { useState, FormEvent, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Banner from "../../../../public/forgot.png";
import Logo from "../../../../public/trt-logo.png";
import { NextResponse, NextRequest } from "next/server";
import TextField from '@mui/material/TextField';

interface ResetForm {
    password: string;
    confirmPassword: string;
}

export default function Reset() {
    const router = useRouter();
    const pathname = usePathname();
    const [input, setInput] = useState<ResetForm>({ password: '', confirmPassword: '' });
    const [token, setToken] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({ password: '', confirmPassword: '' });

    useEffect(() => {
        const parts = pathname.split('/');
        const tokenFromUrl = parts.pop() || '';
        setToken(tokenFromUrl);  // Set token from URL to state
    }, [pathname])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput({ ...input, [e.target.name]: e.target.value });
    };


    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (input.password !== input.confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

        try {
            const response = await fetch(`${apiUrl}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    password: input.password,
                    token
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                toast.error(data.error || 'Error resetting password.');
            } else {
                toast.success('Password reset successfully!');
                router.push('/'); // Redirect to login page or wherever appropriate
                return NextResponse.json(data);
            }
        } catch (error) {
            toast.error('An error occurred. Please try again.');
        }
    };

    return (
        <div className="items-center justify-items-center">
            <ToastContainer position="top-center" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
            <section className="min-h-screen w-full">
                <div className="bg-white flex items-center gap-8 w-full">
                    <div className="w-1/2 md:block hidden">
                        <Image src={Banner} width='1000' style={{ width: '100%', height: '100vh', objectFit: 'cover' }} height='800' alt="reset password page image" />
                    </div>
                    <div className="md:w-1/2" style={{ padding: '0px 5rem' }}>
                        <div className="text-center mb-5 w-full">
                            <Image src={Logo} className="m-auto pb-8" width='100' height='50' alt="logo" />
                            <h2 className="text-2xl font-bold text-[#161616] mt-8">Reset Your Password</h2>
                            <p className="text-[#161616] mt-3">Please enter your new password below.</p>
                        </div>
                        <form onSubmit={handleSubmit} className="mt-6">
                            <div className="relative">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon__tech">
                                    <path d="M5 8H15C15.55 8 16 8.45 16 9V16C16 16.55 15.55 17 15 17H5C4.45 17 4 16.55 4 16V9C4 8.45 4.45 8 5 8Z" stroke="#5B5B99" strokeWidth="1.5" />
                                    <path d="M7 8V6C7 4.34 8.34 3 10 3C11.66 3 13 4.34 13 6V8" stroke="#5B5B99" strokeWidth="1.5" />
                                    <circle cx="10" cy="12" r="1" fill="#5B5B99" />
                                </svg>
                                <TextField fullWidth size="small" name="password" id="outlined-basic" color="warning" label="Enter new password *" variant="filled" onChange={handleChange} />

                            </div>
                            <div className="mt-4 relative">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon__tech">
                                    <path d="M5 8H15C15.55 8 16 8.45 16 9V16C16 16.55 15.55 17 15 17H5C4.45 17 4 16.55 4 16V9C4 8.45 4.45 8 5 8Z" stroke="#5B5B99" strokeWidth="1.5" />
                                    <path d="M7 8V6C7 4.34 8.34 3 10 3C11.66 3 13 4.34 13 6V8" stroke="#5B5B99" strokeWidth="1.5" />
                                    <circle cx="10" cy="12" r="1" fill="#5B5B99" />
                                </svg>
                                <TextField fullWidth size="small" name="confirmPassword" id="outlined-basic" color="warning" label="Confirm new password *" variant="filled" value={input.confirmPassword} onChange={handleChange} />


                            </div>
                            <button type="submit" className="w-full block hover:bg-black focus:bg-black text-white font-semibold rounded-lg primary-bg px-4 py-3 mt-6">
                                Reset Password
                            </button>
                        </form>
                    </div>
                </div>
            </section>
        </div>
    );
}