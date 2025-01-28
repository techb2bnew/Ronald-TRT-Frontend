// components/TableActions.tsx
import React from 'react';
import Edit from '../../../public/edit.svg'
import Eye from '../../../public/eye-off.svg'
import Delete from '../../../public/delete.svg'
import Image from 'next/image';
import Link from 'next/link';

interface TableActionsProps {
  editRoute: string;  // Prop for the edit route
}

const TableActions: React.FC<TableActionsProps> = ({ editRoute }) => {
   
 

  return (
    <div className="flex items-center space-x-1">
      <Link className="p-1" href='#'>
      <Image alt='eye' src={Eye} className='w-[14px]' /> 
      </Link>
      <Link className="p-1" href={editRoute}>
        <Image alt='edit' src={Edit} className='w-[14px]'/>
      </Link>
      <button className="p-2" onClick={() => console.log('Delete')}>
      <Image alt='delete' src={Delete} className='w-[14px]'/> 
      </button>
     
      
<label className="inline-flex items-center cursor-pointer">
  <input type="checkbox" value="" className="sr-only peer" />
  <div className="relative w-11 h-6 bg-red-600 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-black-400 dark:peer-focus:ring-black-400 rounded-full peer dark:bg-red peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-red after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#21BA21]"></div>
</label>

    </div>
  );
};
 
export default TableActions;