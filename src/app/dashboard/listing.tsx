
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from "next/navigation"; 
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
        <main className="p-6 sm:p-10 space-y-6">
            <div className="flex flex-col space-y-6 md:space-y-0 md:flex-row justify-between">
                <div className="mr-0 sm:mr-6">
                    <h1 className="text-4xl font-semibold mb-2">Dashboard</h1>
                </div>

            </div>
            <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                <div className="flex items-center p-8 bg-white shadow rounded-lg">
                    <div className="inline-flex flex-shrink-0 items-center justify-center h-16 w-16 text-purple-600 bg-purple-100 rounded-full mr-0 sm:mr-6">
                        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <div>
                        <span className="block text-2xl font-bold">{count.Customersuperadmin}</span>
                        <span className="block text-gray-500">Customer</span>
                    </div>
                </div>
                <div className="flex items-center p-8 bg-white shadow rounded-lg">
                    <div className="inline-flex flex-shrink-0 items-center justify-center h-16 w-16 text-green-600 bg-green-100 rounded-full mr-0 sm:mr-6">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 7V6C6 4.89543 6.89543 4 8 4H16C17.1046 4 18 4.89543 18 6V7H20C21.1046 7 22 7.89543 22 9V18C22 19.1046 21.1046 20 20 20H4C2.89543 20 2 19.1046 2 18V9C2 7.89543 2.89543 7 4 7H6ZM8 6H16V7H8V6ZM4 9V18H20V9H4Z" fill="currentColor" />
                        </svg>

                    </div>
                    <div>
                        <span className="block text-2xl font-bold">{count.jobsuperadmin}</span>
                        <span className="block text-gray-500">Jobs</span>
                    </div>
                </div>
                <div className="flex items-center p-8 bg-white shadow rounded-lg">
                    <div className="inline-flex flex-shrink-0 items-center justify-center h-16 w-16 text-red-600 bg-red-100 rounded-full mr-0 sm:mr-6">
                        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <div>
                        <span className="inline-block text-2xl font-bold">{count.technician}</span>
                        <span className="block text-gray-500">Technician</span>
                    </div>
                </div>

            </section>
            <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <div className="flex items-center p-8 bg-white shadow rounded-lg">
                    <div className="inline-flex flex-shrink-0 items-center justify-center h-16 w-16 text-blue-600 bg-blue-100 rounded-full mr-0 sm:mr-6">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 11L5 6H19L21 11V17C21 17.5523 20.5523 18 20 18H19C18.4477 18 18 17.5523 18 17V16H6V17C6 17.5523 5.55228 18 5 18H4C3.44772 18 3 17.5523 3 17V11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M7 13H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="6.5" cy="17.5" r="1.5" fill="currentColor" />
                            <circle cx="17.5" cy="17.5" r="1.5" fill="currentColor" />
                        </svg>

                    </div>
                    <div>
                        <span className="block text-2xl font-bold">{count.Vehiclesuperadmin}</span>
                        <span className="block text-gray-500">Vehicle / Work Order</span>
                    </div>
                </div>
                <div className="flex items-center p-8 bg-white shadow rounded-lg">
                    <div className="inline-flex flex-shrink-0 items-center justify-center h-16 w-16 text-yellow-600 bg-yellow-100 rounded-full mr-0 sm:mr-6">
                        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <div>
                        <span className="block text-2xl font-bold">{count.manager}</span>
                        <span className="block text-gray-500">Staff Management</span>
                    </div>
                </div>
                <div className="flex items-center p-8 bg-white shadow rounded-lg">
                    <div className="inline-flex flex-shrink-0 items-center justify-center h-16 w-16 text-teal-600 bg-teal-100 rounded-full mr-0 sm:mr-6">
                        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <div>
                        <span className="block text-2xl font-bold">{count.SingleTech}</span>
                        <span className="block text-gray-500">Single Technician</span>
                    </div>
                </div>
                <div className="flex items-center p-8 bg-white shadow rounded-lg">
                    <div className="inline-flex flex-shrink-0 items-center justify-center h-16 w-16 text-orange-600 bg-orange-100 rounded-full mr-0 sm:mr-6">
                        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <div>
                        <span className="block text-2xl font-bold">{count.CustomerSingleTech}</span>
                        <span className="block text-gray-500">Single Technician Customer</span>
                    </div>
                </div>
                <div className="flex items-center p-8 bg-white shadow rounded-lg">
                    <div className="inline-flex flex-shrink-0 items-center justify-center h-16 w-16 text-red-600 bg-red-100 rounded-full mr-0 sm:mr-6">
                        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <div>
                        <span className="block text-2xl font-bold">{count.jobSingleTech}</span>
                        <span className="block text-gray-500">Single Technician Jobs</span>
                    </div>
                </div>
                 <div className="flex items-center p-8 bg-white shadow rounded-lg">
                    <div className="inline-flex flex-shrink-0 items-center justify-center h-16 w-16 text-blue-600 bg-blue-100 rounded-full mr-0 sm:mr-6">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 11L5 6H19L21 11V17C21 17.5523 20.5523 18 20 18H19C18.4477 18 18 17.5523 18 17V16H6V17C6 17.5523 5.55228 18 5 18H4C3.44772 18 3 17.5523 3 17V11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M7 13H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="6.5" cy="17.5" r="1.5" fill="currentColor" />
                            <circle cx="17.5" cy="17.5" r="1.5" fill="currentColor" />
                        </svg>

                    </div>
                    <div>
                        <span className="block text-2xl font-bold">{count.VehicleSingleTech}</span>
                        <span className="block text-gray-500">Single Technician Vehicle / Work Order</span>
                    </div>
                </div>
            </section>
        </main>
    );
}