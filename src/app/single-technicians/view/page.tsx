"use client";
import View from '../view/view'
import React, { useState } from 'react'; 
import AuthCheck from '@/app/component/AuthCheck';
import Customer from '../customer/listing';
import { useSidebar } from "@/app/component/SidebarContext";
export default function ViewTechnicians() { 
   const { isCollapsed } = useSidebar();
  return (
    <>
    {/* <AuthCheck> */}
    <div className='container m-auto'> 
    <div  className={`right_section ${
          isCollapsed ? "w-full" : "w-[85%]"
        } pl-6 pr-8 ml-auto mt-[7rem] transition-all duration-300`}>
            <View />
            <Customer />
        </div>
    </div>
    {/* </AuthCheck> */}
    </>

  );
}
