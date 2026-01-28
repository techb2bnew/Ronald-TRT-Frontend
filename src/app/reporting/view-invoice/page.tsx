"use client";
import View from '../view/view';
import dynamic from 'next/dynamic';
import React, { Suspense , useState } from 'react'; 
import AuthCheck from '@/app/component/AuthCheck';
import { useSidebar } from "@/app/component/SidebarContext"; 
export default function ViewJob() { 
    const { isCollapsed } = useSidebar();
const ViewDetails = dynamic(() => import('./view'), { ssr: false });

  return (
    <>
    <Suspense fallback={<div>Loading...</div>}>
    <div className='container m-auto'> 
        <div  className={`right_section ${
          isCollapsed ? "w-full" : "w-[85%]"
        } pl-8 pr-8 ml-auto mt-[7rem] transition-all duration-300`}>
            <ViewDetails />
        </div>
    </div> 
    </Suspense>
    </>

  );
}
