"use client";
import View from '../view/view'
import React, { useState } from 'react'; 
import AuthCheck from '@/app/component/AuthCheck';
import Customer from '../../../app/all-customer/listing/listing'
export default function ViewTechnicians() { 
  
  return (
    <>
    <AuthCheck>
    <div className='main-container'> 
        <div className="right_section w-[85%] pl-6 pr-8 ml-auto mt-[7rem] lg:w-[85%] lg:ml-auto w-full pl-4 pr-4 ml-0">
            <View />
            <Customer />
        </div>
    </div>
    </AuthCheck>
    </>

  );
}
