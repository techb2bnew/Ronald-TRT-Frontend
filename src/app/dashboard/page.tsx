"use client";
import Dashboard from '../dashboard/listing'
import React, { useState } from 'react';
import Sidebar from '@/app/component/sidebar/page';
import AuthCheck from '@/app/component/AuthCheck';
import { useSidebar } from "@/app/component/SidebarContext";
export default function Dashbaord() { 
const { isCollapsed } = useSidebar();
  
  return (
    <>
    <AuthCheck>
    <div className='main-container'>
        {/* <Sidebar /> */}
        <div  className={`right_section ${
          isCollapsed ? "w-full" : "w-[86%]"
        } pl-8 pr-8 ml-auto mt-[7rem] transition-all duration-300`}>
            <Dashboard />
        </div>
    </div>
    </AuthCheck>
    </>

  );
}
