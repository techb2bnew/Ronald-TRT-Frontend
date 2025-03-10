// components/TableActions.tsx
import React from 'react';
import Edit from '../../../public/edit.svg'
import Eye from '../../../public/eye.svg'
import Delete from '../../../public/delete.svg'
import Image from 'next/image';
import Link from 'next/link'; 
import Swal from 'sweetalert2';

interface TableActionsProps {
  editRoute: string;          // Route for the edit button
  deleteRoute: string;        // API endpoint for the DELETE request
  itemId: string;    
  idKey: string;    
  viewRoute: string;         // ID of the item to delete
  onDeleteSuccess?: () => void;  // Callback function after a successful delete (optional)
}
 

const TableActions: React.FC<TableActionsProps> = ({ viewRoute, editRoute, deleteRoute, idKey, itemId, onDeleteSuccess }) => {

   
   // ✅ Common Delete Handler
   const handleDelete = async () => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You won’t be able to undo this action!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    });

    if (!result.isConfirmed) {
      return;  // User canceled the action
    }

    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const body = JSON.stringify({ 
        [idKey]: itemId, 
        deletedStatus: false // ✅ Sending deletedStatus as true 
      });
      // ✅ Send the itemId in the body of the request
      const response = await fetch(deleteRoute, {
        method: 'POST',
        headers,
        body
      });

      const data = await response.json();

      if (response.ok) {
        await Swal.fire('Deleted!', 'Your item has been deleted.', 'success');
        if (onDeleteSuccess) {
          onDeleteSuccess();  // Execute callback after deletion 
        }
      } else {
        Swal.fire('Error!', data.message || 'Failed to delete the item.', 'error');
      }
    } catch (error) {
      Swal.fire('Error!', 'An error occurred while deleting the item.', 'error');
    }
  };

  return (
    <div className="flex items-center space-x-1">
      <Link className="p-1" href={viewRoute}>
      <Image alt='eye' src={Eye} className='w-[16px]' /> 
      </Link>
      <Link className="p-1" href={editRoute}>
        <Image alt='edit' src={Edit} className='w-[14px]'/>
      </Link>
      <button className="p-2" onClick={handleDelete}>
      <Image alt='delete' src={Delete} className='w-[14px]'/> 
      </button>
     
      
{/* <label className="inline-flex items-center cursor-pointer">
  <input type="checkbox" value="" className="sr-only peer" />
  <div className="relative w-11 h-6 bg-red-600 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-black-400 dark:peer-focus:ring-black-400 rounded-full peer dark:bg-red peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-red after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#21BA21]"></div>
</label> */}

    </div>
  );
};
 
export default TableActions;