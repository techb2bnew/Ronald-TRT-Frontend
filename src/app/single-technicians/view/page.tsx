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
        <div className="right_section w-[85%] pl-6 pr-8 ml-auto mt-[7rem]">
            <View />
            <Customer />
        </div>
    </div>
    </AuthCheck>
    </>

  );
}
