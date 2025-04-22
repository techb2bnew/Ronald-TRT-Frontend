import React from 'react'; 
import Emptyimg from '../../../public/no-data.jpg'
import Image from 'next/image';
 
export default function Empty() { 
  return (
    <div className='text-center'>
            <Image alt='empty' src={Emptyimg} width='100' height='100' className='m-auto rounded-full' />
            <h2 className='font-bold text-lg text-[#2a2727]'>No Data Available</h2>
    </div>
  );
};
 
