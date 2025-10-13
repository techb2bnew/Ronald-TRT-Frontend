"use client";
import React, { useState } from 'react'; 
export default function Technicians() {

  return (
    <div className='main-container mb-5'>
      <h1 className="text-lg leading-6 font-bold text-gray-900 mb-[2px] sm:mb-0">Create IFS Customer</h1>
      <p className='text-sm'>Onboard clients effortlessly for seamless collaboration!</p>
      <div className='bg-white p-4 mt-5 w-[60%] m-auto'>
        <form className="">
          <div className="grid grid-cols-2 gap-4">
            {/* Client Name and Business Name */}
            <div className='mb-2'>
              <label htmlFor="" className='text-sm'>First Name <span className='text-[red]'>*</span> </label>
              <input
                type="text"
                placeholder="Enter your client name"
                className="input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400"
              />
            </div>
            <div className='mb-2'>
              <label htmlFor="" className='text-sm'>Last Name <span className='text-[red]'>*</span></label>
              <input
                type="text"
                placeholder="Enter your business name"
                className="input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Client Name and Business Name */}
            <div className='mb-2'>
              <label htmlFor="" className='text-sm'>Phone <span className='text-[red]'>*</span></label>
              <input
                type="number"
                placeholder="Enter your phone number"
                className="input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400"
              />
            </div>
            <div className='mb-2'>
              <label htmlFor="" className='text-sm'>Email <span className='text-[red]'>*</span></label>
              <input
                type="email"
                placeholder="Enter your email"
                className="input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400"
              />
            </div>
          </div>

           

          {/* Address and Email */}
          <div className='mb-2'>
            <label htmlFor="" className='text-sm'>Address <span className='text-[red]'>*</span></label>
            <input
              type="text"
              placeholder="Enter your address"
              className="input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400"
            />
          </div>

          <div className="grid grid-cols-4 gap-4">
          <div className='mb-2'>
              <label htmlFor="" className='text-sm'>Country <span className='text-[red]'>*</span></label>
               <select name="" id=""  className="input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400">
                <option value="">Select</option>
               </select>
            </div>
            <div className='mb-2'>
              <label htmlFor="" className='text-sm'>State <span className='text-[red]'>*</span></label>
               <select name="" id=""  className="input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400">
                <option value="">Select</option>
               </select>
            </div>
            <div className='mb-2'>
              <label htmlFor="" className='text-sm'>City <span className='text-[red]'>*</span></label>
              <input
                type="number"
                placeholder="Enter your city"
                className="input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400"
              />
            </div>
            <div className='mb-2'>
              <label htmlFor="" className='text-sm'>Zip Code <span className='text-[red]'>*</span></label>
              <input
                type="email"
                placeholder="Enter zip code"
                className="input text-xs mt-1 input-bordered w-full p-3 rounded border border-gray-400"
              />
            </div>
          </div>  


          {/* Submit Button */}
          <div className="text-left mt-5">
          <button type="submit" className="primary-bg pl-5 pr-5 p-2 rounded">Submit</button>
          </div>
        </form>
      </div>
    </div>
  );
}
