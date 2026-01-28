"use client";
import Jobgroup from './technicians'
import React, { useState } from 'react';  
import AuthCheck from '@/app/component/AuthCheck';
import { useSidebar } from "@/app/component/SidebarContext"; 
export default function Technicians() { 
 const { isCollapsed } = useSidebar(); 
  return (
    // <AuthCheck>
    <div className='main-container'> 
    <div  className={`right_section ${
          isCollapsed ? "w-full" : "w-[85%]"
        } pl-8 pr-8 ml-auto mt-[7rem] transition-all duration-300`}>
            <Jobgroup /> 
        </div>
    </div>
    // </AuthCheck>
  );
}
