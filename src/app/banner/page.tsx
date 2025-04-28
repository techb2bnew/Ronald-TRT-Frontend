"use client";
import CreateBanner from './upload'
import React, { useState } from 'react';
import Sidebar from '@/app/component/sidebar/page';
import AuthCheck from '@/app/component/AuthCheck';
import { useSidebar } from "@/app/component/SidebarContext"; 

export default function TechniciansCreate() { 
  const { isCollapsed } = useSidebar();
  return (
    <AuthCheck>
    <div className='container m-auto'>
        {/* <Sidebar /> */}
        <div  className={`right_section ${
          isCollapsed ? "w-full" : "w-[85%]"
        } pl-6 pr-8 ml-auto mt-[7rem] transition-all duration-300`}>
            <CreateBanner /> 
        </div>
    </div>
    </AuthCheck>
  );
}
