
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from "next/navigation";
import Link from "next/link"; 
import 'react-tooltip/dist/react-tooltip.css';
interface DashboardCounts {
  jobsuperadmin?: number;
  jobSingleTech?: number;
  CustomerSingleTech?: number;
  Customersuperadmin?: number;
  SingleTech?: number;
  VehicleSingleTech?: number;
  Vehiclesuperadmin?: number;
  manager?: number;
  technician?: number;
}

interface DashboardResponse {
  status: boolean;
  count?: DashboardCounts;
  error?: string;
}
export default function Dashboard() {
    const [count, setCount] = useState<DashboardCounts>({});
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(1); 
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(10); 

    const fetchDashboardData = async (page = 1, query = '', limit = pageSize) => {
  setLoading(true);
  try {
    const token = localStorage.getItem('token');
    const roleType = localStorage.getItem('types') || "";
    const userId = localStorage.getItem('userID');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    
    const headers: Record<string, string> = { 
      'Content-Type': 'application/json' 
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const endpoint = `${apiUrl}/deshboradCount?page=${page}&roleType=${encodeURIComponent(roleType)}&limit=${limit}`;
    const response = await fetch(endpoint, { 
      method: 'POST', 
      headers,
      body: JSON.stringify({ query }) // Send query in body for POST
    });

    const data: DashboardResponse = await response.json();
    console.log('API response data:', data);

    if (response.ok && data.status) {
      const counts = data.count || {};
      setCount(counts);  
      
      // Return the counts if you need to use them elsewhere
      return counts;
    } else {
      if (data.error === 'Invalid Token') {
        router.push('/');
      } else {
        console.error('Error fetching dashboard data:', data.error);
        throw new Error(data.error || 'Failed to fetch dashboard data');
      }
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    // Optionally show error to user
    throw error;
  } finally {
    setLoading(false);
  }
};
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchDashboardData(currentPage, searchTerm, pageSize);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [currentPage, searchTerm, pageSize]);

    return (
        <main className="p-6 pt-[0px] space-y-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
            {/* Header */}
            <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row justify-between items-start md:items-center">
                <div>
                    <h1 className="text-4xl font-bold text-black bg-clip-text">Dashboard</h1>
                    <p className="text-gray-500 mt-1">Welcome back! Here's your overview</p>
                </div>
            </div>

            {/* IFS Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-1.5 bg-gradient-to-b from-blue-500 to-blue-700 rounded-full"></div>
                    <h2 className="text-2xl font-bold text-gray-800">IFS</h2>
                </div>
                <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {/* Customer Card */}
                    <div className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="p-6 relative">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex-shrink-0 h-14 w-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                                        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-7 w-7 text-white">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Customer</p>
                                        <p className="text-3xl font-bold text-gray-800 mt-1">{count.Customersuperadmin || 0}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <Link href="/client/listing" className="flex items-center text-sm text-purple-600 hover:text-purple-800 transition-colors cursor-pointer">
                                    <span className="font-medium">View all customers</span>
                                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Jobs Card */}
                    <div className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="p-6 relative">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex-shrink-0 h-14 w-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                                            <path d="M6 7V6C6 4.89543 6.89543 4 8 4H16C17.1046 4 18 4.89543 18 6V7H20C21.1046 7 22 7.89543 22 9V18C22 19.1046 21.1046 20 20 20H4C2.89543 20 2 19.1046 2 18V9C2 7.89543 2.89543 7 4 7H6ZM8 6H16V7H8V6ZM4 9V18H20V9H4Z" fill="currentColor" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Jobs</p>
                                        <p className="text-3xl font-bold text-gray-800 mt-1">{count.jobsuperadmin || 0}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <Link href="/jobs/active-job" className="flex items-center text-sm text-emerald-600 hover:text-emerald-800 transition-colors cursor-pointer">
                                    <span className="font-medium">View all jobs</span>
                                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Technician Card */}
                    <div className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-rose-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="p-6 relative">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex-shrink-0 h-14 w-14 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/30">
                                        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-7 w-7 text-white">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Technician</p>
                                        <p className="text-3xl font-bold text-gray-800 mt-1">{count.technician || 0}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <Link href="/technicians/listing" className="flex items-center text-sm text-rose-600 hover:text-rose-800 transition-colors cursor-pointer">
                                    <span className="font-medium">View all technicians</span>
                                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Vehicle / Work Order Card */}
                    <div className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="p-6 relative">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex-shrink-0 h-14 w-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                                            <path d="M3 11L5 6H19L21 11V17C21 17.5523 20.5523 18 20 18H19C18.4477 18 18 17.5523 18 17V16H6V17C6 17.5523 5.55228 18 5 18H4C3.44772 18 3 17.5523 3 17V11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M7 13H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <circle cx="6.5" cy="17.5" r="1.5" fill="currentColor" />
                                            <circle cx="17.5" cy="17.5" r="1.5" fill="currentColor" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Vehicle / Work Order</p>
                                        <p className="text-3xl font-bold text-gray-800 mt-1">{count.Vehiclesuperadmin || 0}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <Link href="/vehicle/listing" className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors cursor-pointer">
                                    <span className="font-medium">View all vehicles</span>
                                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Staff Management Card */}
                    <div className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-amber-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="p-6 relative">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex-shrink-0 h-14 w-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                                        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-7 w-7 text-white">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Staff Management</p>
                                        <p className="text-3xl font-bold text-gray-800 mt-1">{count.manager || 0}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <Link href="/manager/listing" className="flex items-center text-sm text-amber-600 hover:text-amber-800 transition-colors cursor-pointer">
                                    <span className="font-medium">View all staff</span>
                                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* Single Technician Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-1.5 bg-gradient-to-b from-teal-500 to-teal-700 rounded-full"></div>
                    <h2 className="text-2xl font-bold text-gray-800">Single Technician</h2>
                </div>
                <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {/* Single Technician Card */}
                    <div className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-teal-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="p-6 relative">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex-shrink-0 h-14 w-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/30">
                                        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-7 w-7 text-white">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Technicians</p>
                                        <p className="text-3xl font-bold text-gray-800 mt-1">{count.SingleTech || 0}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <Link href="/single-technicians/listing" className="flex items-center text-sm text-teal-600 hover:text-teal-800 transition-colors cursor-pointer">
                                    <span className="font-medium">View details</span>
                                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Customer Card */}
                    <div className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="p-6 relative">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex-shrink-0 h-14 w-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                                        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-7 w-7 text-white">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Customer</p>
                                        <p className="text-3xl font-bold text-gray-800 mt-1">{count.CustomerSingleTech || 0}</p>
                                    </div>
                                </div>
                            </div>
                            {/* <div className="mt-4 pt-4 border-t border-gray-100">
                                <Link href="/single-technician/customer" className="flex items-center text-sm text-orange-600 hover:text-orange-800 transition-colors cursor-pointer">
                                    <span className="font-medium">View details</span>
                                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            </div> */}
                        </div>
                    </div>

                    {/* Jobs Card */}
                    <div className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="p-6 relative">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex-shrink-0 h-14 w-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/30">
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                                            <path d="M6 7V6C6 4.89543 6.89543 4 8 4H16C17.1046 4 18 4.89543 18 6V7H20C21.1046 7 22 7.89543 22 9V18C22 19.1046 21.1046 20 20 20H4C2.89543 20 2 19.1046 2 18V9C2 7.89543 2.89543 7 4 7H6ZM8 6H16V7H8V6ZM4 9V18H20V9H4Z" fill="currentColor" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Jobs</p>
                                        <p className="text-3xl font-bold text-gray-800 mt-1">{count.jobSingleTech || 0}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <Link href="/single-technicians/all-jobs" className="flex items-center text-sm text-pink-600 hover:text-pink-800 transition-colors cursor-pointer">
                                    <span className="font-medium">View details</span>
                                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Vehicle / Work Order Card */}
                    <div className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="p-6 relative">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex-shrink-0 h-14 w-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                                            <path d="M3 11L5 6H19L21 11V17C21 17.5523 20.5523 18 20 18H19C18.4477 18 18 17.5523 18 17V16H6V17C6 17.5523 5.55228 18 5 18H4C3.44772 18 3 17.5523 3 17V11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M7 13H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <circle cx="6.5" cy="17.5" r="1.5" fill="currentColor" />
                                            <circle cx="17.5" cy="17.5" r="1.5" fill="currentColor" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Vehicle / Work Order</p>
                                        <p className="text-3xl font-bold text-gray-800 mt-1">{count.VehicleSingleTech || 0}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <Link href="/single-technicians/vehicle-info" className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer">
                                    <span className="font-medium">View details</span>
                                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}