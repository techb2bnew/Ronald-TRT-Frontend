"use client";
import Customerlisting from './listing'
import React, { useState } from 'react';
import Sidebar from '../../component/sidebar/page';
import AuthCheck from '@/app/component/AuthCheck'; 

export default function Technicians() { 
  
  return (
    <AuthCheck>
    <div className='main-container'>
        <Sidebar />
        <div className="right_section w-[85%] pl-6 pr-8 ml-auto mt-[7rem]">
            <Customerlisting />
        </div>
    </div>
    </AuthCheck>
  );
}
