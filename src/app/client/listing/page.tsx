"use client";
import Clientisting from './client'
import React, { useState } from 'react';
import Sidebar from '../../component/sidebar/page';
export default function Technicians() { 
  
  return (
    <div className='main-container'>
        <Sidebar />
        <div className="right_section w-[85%] pl-6 pr-8 ml-auto mt-[7rem]">
            <Clientisting />
        </div>
    </div>
  );
}
