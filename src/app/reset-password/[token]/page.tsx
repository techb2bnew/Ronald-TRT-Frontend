"use client";
import Image from "next/image";
import { useState, FormEvent, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import toast from 'react-hot-toast';

import Banner from "../../../../public/forgot.png";
import Logo from "../../../../public/trt-logo.png";
import TextField from '@mui/material/TextField';

interface ResetForm {
  password: string;
  confirmPassword: string;
}

export default function Reset() {
  const router = useRouter();
  const pathname = usePathname();
  const [input, setInput] = useState<ResetForm>({
    password: '',
    confirmPassword: ''
  });
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    password: '',
    confirmPassword: '',
    form: ''
  });
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false
  });

  useEffect(() => {
    const parts = pathname.split('/');
    const tokenFromUrl = parts.pop() || '';
    setToken(tokenFromUrl);
  }, [pathname]);



  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInput(prev => ({ ...prev, [name]: value }));

    // Clear error when user types
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors = { password: '', confirmPassword: '', form: '' };
    let isValid = true;

    // Password validation
    if (!input.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (input.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
      isValid = false;
    }

    // Confirm password validation
    if (!input.confirmPassword) {
      newErrors.confirmPassword = 'Enter confirm password';
      isValid = false;
    } else if (input.password !== input.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
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
        setErrors(prev => ({ ...prev, form: data.error || 'Error resetting password' }));
        toast.error(data.error || 'Error resetting password.');
      } else {
        toast.success('Password reset successfully!');
        router.push('/login');
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, form: 'An error occurred. Please try again.' }));
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPassword) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="items-center justify-items-center">
      <section className="min-h-screen w-full">
        <div className="bg-white flex items-center gap-8 w-full">
          <div className="w-1/2 md:block hidden">
            <Image
              src={Banner}
              width={1000}
              height={800}
              style={{ width: '100%', height: '100vh', objectFit: 'cover' }}
              alt="reset password page image"
              priority
            />
          </div>
          <div className="md:w-1/2" style={{ padding: '0px 5rem' }}>
            <div className="text-center mb-5 w-full">
              <Image
                src={Logo}
                className="m-auto pb-8"
                width={100}
                height={50}
                alt="logo"
              />
              <h2 className="text-2xl font-bold text-[#161616] mt-8">Reset Your Password</h2>
              <p className="text-[#161616] mt-3">Please enter your new password below.</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-6">
              <div className="relative mb-4">
                {/* <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon__tech">
                  <path d="M5 8H15C15.55 8 16 8.45 16 9V16C16 16.55 15.55 17 15 17H5C4.45 17 4 16.55 4 16V9C4 8.45 4.45 8 5 8Z" stroke="#5B5B99" strokeWidth="1.5" />
                  <path d="M7 8V6C7 4.34 8.34 3 10 3C11.66 3 13 4.34 13 6V8" stroke="#5B5B99" strokeWidth="1.5" />
                  <circle cx="10" cy="12" r="1" fill="#5B5B99" />
                </svg> */}
                <TextField
                  fullWidth
                  name="password"
                  type={showPassword.password ? "text" : "password"}
                  color="warning"
                  label="Enter new password *"
                  variant="outlined"
                  value={input.password}
                  onChange={handleChange} 
                  size='small'
                />
                <button
                  type="button"
                  className="absolute right-3 top-[8px]"
                  onClick={() => togglePasswordVisibility('password')}
                >
                  {showPassword.password ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5B5B99">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="12" r="3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5B5B99">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="1" y1="1" x2="23" y2="23" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>

                {errors.password && (
                  <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                    {errors.password}
                  </div>
                )}
              </div>

              <div className="relative mb-4">
                {/* <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon__tech">
                  <path d="M5 8H15C15.55 8 16 8.45 16 9V16C16 16.55 15.55 17 15 17H5C4.45 17 4 16.55 4 16V9C4 8.45 4.45 8 5 8Z" stroke="#5B5B99" strokeWidth="1.5" />
                  <path d="M7 8V6C7 4.34 8.34 3 10 3C11.66 3 13 4.34 13 6V8" stroke="#5B5B99" strokeWidth="1.5" />
                  <circle cx="10" cy="12" r="1" fill="#5B5B99" />
                </svg> */}
                <TextField
                  fullWidth
                  name="confirmPassword"
                  type={showPassword.confirmPassword ? "text" : "password"}
                  color="warning"
                  label="Confirm new password *"
                  size='small'
                  value={input.confirmPassword}
                  onChange={handleChange} 
                />
                <button
                  type="button"
                  className="absolute right-3 top-[8px]"
                  onClick={() => togglePasswordVisibility('confirmPassword')}
                >
                  {showPassword.confirmPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5B5B99">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="12" r="3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5B5B99">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="1" y1="1" x2="23" y2="23" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>

                {errors.confirmPassword && (
                  <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                    {errors.confirmPassword}
                  </div>
                )}
              </div>

              {errors.form && (
                <div className="text-red-500 text-sm mb-4">{errors.form}</div>
              )}

              <button
                type="submit"
                className="w-full block hover:bg-black focus:bg-black text-white font-semibold rounded-lg primary-bg px-4 py-3 mt-6"
                disabled={loading}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}