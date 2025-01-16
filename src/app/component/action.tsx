// components/TableActions.tsx
import React from 'react';
import Edit from '../../../public/edit.svg'
import Eye from '../../../public/eye-off.svg'
import Delete from '../../../public/delete.svg'
import Image from 'next/image';

 

export default function TableActions() {
   
 

  return (
    <div className="flex items-center space-x-2">
      <button className="p-2" onClick={() => console.log('View')}>
      <Image alt='eye' src={Eye} /> 
      </button>
      <button className="p-2" onClick={() => console.log('Edit')}>
        <Image alt='edit' src={Edit} />
      </button>
      <button className="p-2" onClick={() => console.log('Delete')}>
      <Image alt='delete' src={Delete} /> 
      </button>
     
      
<label className="inline-flex items-center cursor-pointer">
  <input type="checkbox" value="" className="sr-only peer" />
  <div className="relative w-11 h-6 bg-red-600 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-black-400 dark:peer-focus:ring-black-400 rounded-full peer dark:bg-red peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-red after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#21BA21]"></div>
</label>

    </div>
  );
};
 
