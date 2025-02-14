"use client";
import Role from './role'
import React, { useState } from 'react';
import Sidebar from '@/app/component/sidebar/page';
import AuthCheck from '@/app/component/AuthCheck'; 

export default function Technicians() { 
  
  return (
    <AuthCheck>
    <div className='main-container'>
        <Sidebar />
        <div className="right_section w-[85%] pl-6 pr-8 ml-auto mt-[7rem]">
            <Role />
        </div>
    </div>
    </AuthCheck>
  );
}
