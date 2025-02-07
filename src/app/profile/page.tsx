
"use client";
import ProfileCard from './profile';
import React, { useState } from 'react';
import Sidebar from '../component/sidebar/page';
import AuthCheck from '@/app/component/AuthCheck';

export default function Profile() {

  
  return (
    <AuthCheck>
    <div className='main-container'>
        <Sidebar />
        <div className="right_section w-[85%] pl-6 pr-8 ml-auto mt-[7rem]">
            <ProfileCard />
       
        </div>
    </div>
    </AuthCheck>
  );
}
