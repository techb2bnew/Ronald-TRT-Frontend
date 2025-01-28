import { useState } from 'react';
import Image from "next/image";
import Banner from "../../../public/signup.png";
import Logo from "../../../public/logo.svg";
import Facebook from "../../../public/facebook.svg";
import Google from "../../../public/google.svg";
import Apple from "../../../public/apple.svg";
import Eye from "../../../public/eye.svg";
import EyeOff from '../../../public/eye-off.svg'
import Link from "next/link";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
export default function Signup() {

    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [emailAddress, setEmailAddress] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [errors, setErrors] = useState({ fullName: '', phoneNumber: '', emailAddress: '', password: '', agreeTerms: '', general: '' });

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

        try {
            const response = await fetch(`${apiUrl}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, phoneNumber, emailAddress, password, agreeTerms }),
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
                console.log('Registration successful:', data);
                toast.success("Registration successful!");
                // Handle success (e.g., clearing form, redirecting)
            }
        } catch (error) {
            console.error('Registration failed:', error);
            toast.error('Registration failed. Please try again.');
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
                            <Image src={Logo} className="m-auto" width='200' height='50' alt="page img" />
                            <h2 className="text-2xl font-bold text-[#161616] mt-5">Create Account</h2>
                            <p className="text-[#161616] mt-3">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque leo felis, volutpat in imperdiet id, vulputate ac odio.</p>
                        </div>
                        <form className="mt-3" onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="block text-[#161616]">Full Name</label>
                                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full Name" className="w-full px-4 py-2 rounded-lg bg-white mt-2 border border-gray-400 focus:border-black-500 focus:bg-white focus:outline-none" autoFocus required />

                            </div>

                            <div className="mb-3">
                                <label className="block text-[#161616]">Phone Number</label>
                                <input type="text" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="Enter your Phone Number" className="w-full px-4 py-2 rounded-lg bg-white mt-2 border border-gray-400 focus:border-black-500 focus:bg-white focus:outline-none" required />

                            </div>

                            <div className="mb-3">
                                <label className="block text-[#161616]">Email Address</label>
                                <input type="email" value={emailAddress} onChange={e => setEmailAddress(e.target.value)} placeholder="Enter your email address" className="w-full px-4 py-2 rounded-lg bg-white mt-2 border border-gray-400 focus:border-black-500 focus:bg-white focus:outline-none" required />

                            </div>

                            <div className="mt-3 relative">
                                <label className="block text-[#161616]">Password</label>
                                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your Password" className="w-full px-4 py-2 rounded-lg bg-white mt-2 border border-gray-400 focus:border-black-500 focus:bg-white focus:outline-none" required />
                                <button type="button" style={{ position: 'absolute', right: '10px', top: '44px' }} onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <Image src={EyeOff} width='18' height='18' alt="eye" /> : <Image src={Eye} width='18' height='18' alt="eye" />
                                    }
                                </button>

                            </div>



                            <div className="flex justify-between items-center mt-3">
                                <div className="inline-flex items-center">
                                    <label className="flex items-center cursor-pointer relative">
                                        <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} className="peer h-5 w-5 cursor-pointer transition-all appearance-none rounded shadow bg-white hover:shadow-md border border-slate-300 checked:bg-[#EF502E] checked:border-[#EF502E]" id="check" />
                                        <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                            </svg>
                                        </span>
                                    </label>
                                    <label className="cursor-pointer ml-2 text-slate-600 text-sm" htmlFor="check">
                                        I agree to the <Link className="primary-text" href='#'>terms of service</Link> and <Link className="primary-text" href='#'>privacy policy</Link>
                                    </label>
                                </div>
                                <Link href="/forgot" className="text-sm primary-text">Forgot Password?</Link>
                            </div>
                            <button type="submit" className="w-full block  hover:bg-black focus:bg-black text-white font-semibold rounded-lg primary-bg
                px-4 py-3 mt-4">Sign Up</button>
                        </form>
                        <div className="text-sm text-center mt-5">
                            <p>Already have an account?
                                <Link href='/' className="primary-text"> Login</Link> </p>
                        </div>
                        <div className="mt-4 grid grid-cols-3 items-center text-gray-500">
                            <hr className="border-black" />
                            <p className="text-center text-black text-sm">OR</p>
                            <hr className="border-black" />
                        </div>

                        <div className="flex gap-8 justify-center mt-4 items-center">
                            <Link href='#' className="border-r-2 border-gray-400 pr-8">
                                <Image src={Google} alt="" width='80' height='100' />
                            </Link>
                            <Link href='#' className="border-r-2 border-gray-400 pr-8">
                                <Image src={Facebook} alt="" width='100' height='100' />
                            </Link>
                            <Link href='#'>
                                <Image src={Apple} alt="" width='70' height='100' />
                            </Link>
                        </div>


                    </div>


                </div>
            </section>
        </div>
    );
}
