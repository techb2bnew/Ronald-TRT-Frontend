
"use client";
import ProfileCard from './profile';
import React, { useState } from 'react';
import Sidebar from '../component/sidebar/page';
import AuthCheck from '@/app/component/AuthCheck';
import { useSidebar } from "@/app/component/SidebarContext";
export default function Profile() {
const { isCollapsed } = useSidebar();
  
  return (
    <AuthCheck>
    <div className='container m-auto'>
        {/* <Sidebar /> */}
        <div  className={`right_section ${
          isCollapsed ? "w-full" : "w-[85%]"
        } pl-6 pr-8 ml-auto mt-[7rem] transition-all duration-300`}>
            <ProfileCard />
       
        </div>
    </div>
    </AuthCheck>
  );
}
