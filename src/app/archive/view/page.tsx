"use client";
import View from './view'
import React, { useState } from 'react';
import Sidebar from '../../component/sidebar/page';
import AuthCheck from '@/app/component/AuthCheck';
export default function ViewTechnicians() { 
  
  return (
    <>
    <AuthCheck>
    <div className='main-container'>
        {/* <Sidebar /> */}
        <div className="right_section w-[85%] pl-6 pr-8 ml-auto mt-[7rem]">
            <View />
        </div>
    </div>
    </AuthCheck>
    </>

  );
}
