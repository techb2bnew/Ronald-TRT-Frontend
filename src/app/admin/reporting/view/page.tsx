"use client";
import View from '../../vehicle/view/page'
import React, { useState } from 'react'; 
import AuthCheck from '@/app/component/AuthCheck';
import { useSidebar } from "@/app/component/SidebarContext"; 
export default function ViewJob() { 
  const { isCollapsed } = useSidebar(); 
  return (
    <> 
            <View />
          
    </>

  );
}
