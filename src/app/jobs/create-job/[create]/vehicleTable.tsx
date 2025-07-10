import TableActions from '@/app/component/action';
import React, { useEffect, useState } from 'react';
import Loader from '@/app/component/loader';

interface Vehicle {
  vin: string;
  make: string;
  model: string;
  id: string;
}

interface VehicleTableProps {
  vehicles: Vehicle[]; // Receive the vehicles data from the parent
}

const VehicleTable: React.FC<VehicleTableProps> = ({ vehicles }) => {
  return (
    <div className='mb-4'>
      <h3 className='font-bold text-lg'>Vehicle Details</h3>
      <div className="overflow-auto rounded-md">
        <table className="table w-full table-fixed">
          <thead>
            <tr>
              <th>VIN</th>
              <th>Make</th>
              <th>Model</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.length > 0 ? (
              vehicles.map((vehicle, index) => (
                <tr key={index}>
                  <td>{vehicle.vin}</td>
                  <td>{vehicle.make}</td>
                  <td>{vehicle.model}</td>
                  <td>
                    {/* Use your TableActions component here */}
                    <TableActions
                      editRoute={`/jobs/create-job/create?jobId=${vehicle.id}`}
                      deleteRoute={`/api/deleteJob`}  // Pass the correct endpoint
                      viewRoute={`/jobs/view?jobId=${vehicle.id}&ActiveWorkOrder`}
                      idKey="jobid"
                      userRole="Activejobs"
                      itemId={vehicle.id}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center' }}>No vehicles found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VehicleTable;