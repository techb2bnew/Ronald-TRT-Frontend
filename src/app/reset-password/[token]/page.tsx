
"use client";
import Image from "next/image";
import { useState, FormEvent, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Banner from "../../../../public/forgot.png";
import Logo from "../../../../public/logo.svg";
import { NextResponse, NextRequest } from "next/server";

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
                router.push('/login'); // Redirect to login page or wherever appropriate
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
                <div className="bg-[#F7F7FD] flex items-center gap-8 w-full">
                    <div className="w-1/2 md:block hidden">
                        <Image src={Banner} width='1000' style={{ width: '100%', height: '100vh', objectFit: 'cover' }} height='800' alt="reset password page image" />
                    </div>
                    <div className="md:w-1/2" style={{ padding: '0px 5rem' }}>
                        <div className="text-center mb-5 w-full">
                            <Image src={Logo} className="m-auto pb-8" width='200' height='50' alt="logo" />
                            <h2 className="text-2xl font-bold text-[#161616] mt-8">Reset Your Password</h2>
                            <p className="text-[#161616] mt-3">Please enter your new password below.</p>
                        </div>
                        <form onSubmit={handleSubmit} className="mt-6">
                            <div>
                                <label className="block text-[#161616]">New Password</label>
                                <input type="password" name="password" onChange={handleChange} placeholder="Enter new password" className="w-full px-4 py-2 rounded-lg bg-white mt-2 border border-gray-400 focus:border-black-500 focus:bg-white focus:outline-none" required />
                            </div>
                            <div>
                                <label className="block text-[#161616]">Confirm New Password</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={input.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Confirm new password"
                                    className={`w-full px-4 py-2 rounded-lg bg-white mt-2 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-400'} focus:border-black-500 focus:bg-white focus:outline-none`}
                                    required
                                />
                                {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword}</p>}
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