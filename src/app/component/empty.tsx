import React from 'react'; 
import Emptyimg from '../../../public/emptystate-files.avif'
import Image from 'next/image';
 
export default function Empty() { 
  return (
    <div className='text-center'>
            <Image alt='empty' src={Emptyimg} width='100' height='100' className='m-auto w-[200px]' />
            <h2 className='font-bold'>No data available</h2>
    </div>
  );
};
 
