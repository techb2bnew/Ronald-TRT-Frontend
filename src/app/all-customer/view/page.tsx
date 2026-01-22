"use client";
import dynamic from 'next/dynamic';
import View from '../view/view';
import React, { Suspense, useState } from 'react'; 
import AuthCheck from '@/app/component/AuthCheck';
import { useSidebar } from "@/app/component/SidebarContext";
import CustomerJobs from '../customerJobs/listing'

const ViewDetails = dynamic(() => import('./view'), { ssr: false });

export default function ViewCustomer() { 
     const { isCollapsed } = useSidebar();
  return (
    <>
    <div className='container m-auto'> 
        <div  className={`right_section ${
          isCollapsed ? "w-full" : "w-[85%]"
        } pl-6 pr-8 ml-auto mt-[7rem] transition-all duration-300`}>
            <Suspense fallback={null}>
              <ViewDetails />
            </Suspense>
            <CustomerJobs />
        </div>
    </div>
    </>

  );
}
