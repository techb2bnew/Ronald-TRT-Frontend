"use client";
import CreateBanner from './upload'
import React, { useState } from 'react';  
import { useSidebar } from "@/app/component/SidebarContext"; 

export default function TechniciansCreate() { 
  const { isCollapsed } = useSidebar();
  return ( 
    <div className='container m-auto'> 
        <div  className={`right_section ${
          isCollapsed ? "w-full" : "w-[85%]"
        } pl-8 pr-8 ml-auto mt-[7rem] transition-all duration-300`}>
            <CreateBanner /> 
        </div>
    </div> 
  );
}
