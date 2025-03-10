"use client";
import Dashboard from '../dashboard/listing'
import React, { useState } from 'react';
import Sidebar from '@/app/component/sidebar/page';
import AuthCheck from '@/app/component/AuthCheck';
export default function Dashbaord() { 
  
  return (
    <>
    <AuthCheck>
    <div className='main-container'>
        {/* <Sidebar /> */}
        <div className="right_section w-[85%] pl-6 pr-8 ml-auto mt-[7rem]">
            <Dashboard />
        </div>
    </div>
    </AuthCheck>
    </>

  );
}
