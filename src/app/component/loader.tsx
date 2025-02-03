import React from 'react'; 
import Loader from '../../../public/loader.gif'
import Image from 'next/image';
 
export default function Loading() { 
  return (
    <div className='flex justify-center items-center h-[20vh]'>
            <Image alt='empty' src={Loader} height='50' width='50' /> 
    </div>
  );
};
 
