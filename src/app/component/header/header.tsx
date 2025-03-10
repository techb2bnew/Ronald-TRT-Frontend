"use client";
import Link from 'next/link'; 
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Loading from '@/app/component/loader'; 

export default function Home() {
      const router = useRouter(); 
    
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [notificationOpen, setnotificationOpen] = useState(false);

    const toggleDropdown = () => setDropdownOpen(!dropdownOpen);
    const toggleNotification = () => setnotificationOpen(!notificationOpen);
     const [technician, setTechnician] = useState<any>(null);  // Using `any` type for flexibility
      const [isEdit, setIsEdit] = useState<boolean>(false);
    
      const fetchTechnicianData = async (technicianId: string) => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    
        try {
          const token = localStorage.getItem('token');
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };
    
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
    
          const response = await fetch(`${apiUrl}/fetchTechnicianProfile?technicianId=${technicianId}`, {
            method: 'GET',
            headers,
          });
    
          const data = await response.json();
    
          if (response.ok) {  
            setTechnician(data.technician);  // Set the technician data
          } else {
            toast.error(data.error || 'Error fetching technician data');
          }
        } catch (error) {
          toast.error('An error occurred while fetching technician data');
        }
      };
 useEffect(() => {
    const userID = localStorage.getItem('userID'); 
    if (userID) {
      setIsEdit(true);  // Set to true if `technicianId` exists in the URL
      fetchTechnicianData(userID);
    } else {
      setIsEdit(false);
    }
  }, []);

    const logOut = async () => {
        localStorage.removeItem('token');
        router.push('/'); 
    }
    return (
        <>
            <header className="bg-white shadow-md py-4 px-6 flex justify-between items-center">
                <div className='w-100 ml-auto flex items-center'>
                    {/* <div className="flex-grow relative">
                        <div style={{position:'absolute', left:'10px', top:'15px'}}>
                    <svg width="14" height="14" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M10.5413 2.52081C6.11156 2.52081 2.52051 6.11186 2.52051 10.5416C2.52051 14.9714 6.11156 18.5625 10.5413 18.5625C14.9711 18.5625 18.5622 14.9714 18.5622 10.5416C18.5622 6.11186 14.9711 2.52081 10.5413 2.52081ZM1.14551 10.5416C1.14551 5.35247 5.35217 1.14581 10.5413 1.14581C15.7305 1.14581 19.9372 5.35247 19.9372 10.5416C19.9372 15.7308 15.7305 19.9375 10.5413 19.9375C5.35217 19.9375 1.14551 15.7308 1.14551 10.5416Z" fill="#060606"/>
                    <path fillRule="evenodd" clipRule="evenodd" d="M17.8469 17.8472C18.1154 17.5787 18.5507 17.5787 18.8191 17.8472L20.6525 19.6805C20.921 19.949 20.921 20.3843 20.6525 20.6528C20.384 20.9213 19.9487 20.9213 19.6802 20.6528L17.8469 18.8194C17.5784 18.551 17.5784 18.1157 17.8469 17.8472Z" fill="#060606"/>
                    </svg>
                    </div>

                        <input
                            className="text-sm form-input w-full px-4 py-3 pl-8 bg-[#F7F7FD] border border-gray-300 rounded-md focus:outline-none focus:shadow-outline"
                            type="search"
                            placeholder="Search for anything..."
                        />
                    </div> */}
                    <div className="flex items-center gap-3">
                        {/* <div className="relative">
                            <button onClick={toggleNotification} className="ml-4 bg-[#F7F7FD] hover:bg-gray-200 focus:outline-none focus:bg-gray-200 rounded-md border border-gray-300 p-3">
                            <svg width="20" height="20" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" clipRule="evenodd" d="M4.83066 8.16748C4.83066 4.75362 7.60429 1.97998 11.0182 1.97998C14.4229 1.97998 17.2057 4.76278 17.2057 8.16748V10.8166C17.2057 11.0136 17.2502 11.3019 17.3347 11.6099C17.4182 11.9142 17.526 12.1847 17.6241 12.3564L18.6752 14.1021C19.5053 15.4856 18.8417 17.2878 17.3125 17.7941C13.2205 19.161 8.80552 19.1608 4.71363 17.7937L4.71108 17.7929C3.93887 17.5315 3.35976 16.9911 3.10083 16.2918C2.8416 15.5917 2.92979 14.8037 3.3524 14.1014L4.40513 12.3529C4.40536 12.3525 4.40559 12.3522 4.40583 12.3518C4.50621 12.183 4.61616 11.9135 4.70102 11.6079C4.78613 11.3013 4.83066 11.0134 4.83066 10.8166V8.16748ZM11.0182 3.35498C8.36369 3.35498 6.20566 5.51301 6.20566 8.16748V10.8166C6.20566 11.1791 6.13102 11.597 6.02592 11.9756C5.92076 12.3545 5.76978 12.7491 5.58618 13.057L5.58464 13.0596L4.53057 14.8103C4.53054 14.8103 4.53061 14.8102 4.53057 14.8103C4.30246 15.1895 4.28973 15.5428 4.39027 15.8144C4.49104 16.0865 4.73197 16.348 5.15068 16.49C8.95974 17.7623 13.0688 17.7622 16.8778 16.4896L16.8799 16.4889C17.5681 16.2614 17.8757 15.4428 17.4964 14.81C17.4963 14.8099 17.4965 14.8102 17.4964 14.81L16.4359 13.0486C16.2598 12.7434 16.1123 12.3515 16.0087 11.9736C15.9052 11.5964 15.8307 11.1789 15.8307 10.8166V8.16748C15.8307 5.52218 13.6635 3.35498 11.0182 3.35498Z" fill="#1A1818"/>
                            <path fillRule="evenodd" clipRule="evenodd" d="M8.68218 2.68247C9.04834 1.74813 9.9574 1.09082 11.0181 1.09082C12.0788 1.09082 12.9879 1.74813 13.354 2.68247C13.4496 2.92637 13.3983 3.20339 13.2217 3.39686C13.0451 3.59032 12.7738 3.6666 12.5223 3.59356C12.268 3.51973 12.0113 3.46402 11.7512 3.43249L11.7487 3.43218C10.9563 3.33313 10.2076 3.39192 9.51419 3.59349C9.2626 3.66663 8.99131 3.59041 8.81463 3.39694C8.63794 3.20348 8.58658 2.92641 8.68218 2.68247Z" fill="#1A1818"/>
                            <path fillRule="evenodd" clipRule="evenodd" d="M8.95605 17.4717C8.95605 18.0332 9.18963 18.5571 9.56136 18.9289C9.93309 19.3006 10.4571 19.5342 11.0186 19.5342C12.1514 19.5342 13.0811 18.6045 13.0811 17.4717H14.4561C14.4561 19.3639 12.9108 20.9092 11.0186 20.9092C10.0767 20.9092 9.20735 20.5194 8.58908 19.9011C7.97082 19.2829 7.58105 18.4135 7.58105 17.4717H8.95605Z" fill="#1A1818"/>
                            </svg> 
                            </button>
                            {notificationOpen && (
                                <div className="absolute right-0 mt-2 py-2 w-48 bg-white rounded-md shadow-xl z-20"> 
                                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Show Notifications</a> 
                                </div>
                            )}
                        </div> */}

                        <div className="relative">
                            <button onClick={toggleDropdown} className="flex gap-2 items-center bg-[#F7F7FD] hover:bg-gray-200 focus:outline-none focus:bg-gray-200 rounded-md border border-gray-300 text-sm pl-2 pr-2 pt-1 pb-1">
                                <img width='30' height='30' src={technician?.image || 'https://i.postimg.cc/BvNYhMHS/user-img.jpg'} alt='user' className='rounded-full h-[30px]' />
                                <div className='text-left'>
                                <span className='text-sm'>{technician ? `${technician.firstName} ${technician.lastName}` : 'User'}</span>
                                <p className='text-xs text-gray-500'>{technician?.types}</p>
                                </div>
                            </button>
                            {dropdownOpen && (
                                <div className="absolute right-0 mt-2 py-2 w-48 bg-white rounded-md shadow-xl z-20">
                                    <Link href="/" className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#EF502E] hover:text-white">Settings</Link> 
                                    <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#EF502E] hover:text-white">Profile</Link> 
                                    <p  onClick={logOut}   className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#EF502E] hover:text-white">Log out</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>
        </>
    );
}
