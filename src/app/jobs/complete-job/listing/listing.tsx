// components/TechnicianTable.tsx
import React from 'react';
import TableActions from '../../../component/action';
import CommonHeader from '../../../component/commonHeader';
const TechnicianTable: React.FC = () => {
  // Sample data
  const technicians = [
    { id: '#1234', Description:'test', name: 'John Smith', email: 'info@johnsmith.com', clientPhone: '+61 7 1234 1234', techPh: '+61 7 1234 1234', techName: 'john', vin: '453', status:'In Progress', date:'25-12-2024', make: 'Honda', active: true },
    { id: '#1234', Description:'test', name: 'John Smith', email: 'info@johnsmith.com', clientPhone: '+61 7 1234 1234', techPh: '+61 7 1234 1234', techName: 'Alexa', vin: '64564', status:'In Progress', date:'25-12-2024', make: 'Honda', active: true },
    // Add more sample technicians as needed
  ];
  const handleSearch = (searchTerm: string) => {
    console.log('Searching for:', searchTerm);
    // Implement search logic here
  };
  return (
    <div className="container mx-auto mt-4">
      <CommonHeader heading='Completed Jobs'  onSearch={handleSearch} buttonLabel="Create job" buttonLink="/" />

      <div className="overflow-auto rounded-md">
        <table className="table w-full table-fixed">
          {/* Table header */}
          <thead>
            <tr>
              <th className='w-[50px]'>ID</th>
              <th className='w-[150px]'>Job Description</th>
              <th className='w-[120px]'>Client Name</th>
              <th className='w-[150px]'>Email</th>
              <th className='w-[120px]'>Client Ph. Number</th>
              <th className='w-[100px]'>Technician Name</th>
              <th className='w-[100px]'>Tech.  Ph. Number</th>
              <th className='w-[60px]'>VIN</th>
              <th className='w-[100px]'>Vehicle Make</th>
              <th className='w-[100px]'>Status</th>
              <th className='w-[100px]'>Date</th>
              <th className='w-[160px]'>Action</th>

            </tr>
          </thead>
          <tbody>
            {/* Table body */}
            {technicians.map((tech, index) => (
              <tr key={index}>
                <td>{tech.id}</td>
                <td>{tech.Description}</td>
                <td>{tech.name}</td>
                <td>{tech.email}</td>
                <td>{tech.clientPhone}</td>
                <td>{tech.techName}</td>
                <td>{tech.techPh}</td>
                <td>{tech.vin}</td>
                <td>{tech.make}</td>
                <td>{tech.status}</td>  
                <td>{tech.date}</td>  
                <td> 
                  {/* <TableActions
                    editRoute="/workshop/clients/create"
                  />  */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TechnicianTable;
