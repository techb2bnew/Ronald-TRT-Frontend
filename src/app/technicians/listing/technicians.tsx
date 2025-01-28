// components/TechnicianTable.tsx
import React from 'react';
import TableActions from '../../component/action';
import CommonHeader from '../../component/commonHeader';
const TechnicianTable: React.FC = () => {
  // Sample data
  const technicians = [
    { id: '#1234', name: 'John Smith', email: 'info@johnsmith.com', phone: '+61 7 1234 1234', payRate: 'Fixed', status: 'Active', active: true  },
    { id: '#1234', name: 'John Smith', email: 'info@johnsmith.com', phone: '+61 7 1234 1234', payRate: 'Flat Rate', status: 'Inactive', active: true  },
    // Add more sample technicians as needed
  ];
  const handleSearch = (searchTerm: string) => {
    console.log('Searching for:', searchTerm);
    // Implement search logic here
  };
  return (
    <div className="container mx-auto mt-4">
      <CommonHeader heading='IFS Technicians' title="Onboard clients effortlessly for seamless collaboration!" onSearch={handleSearch} buttonLabel="Create Technician" buttonLink="/technicians/create-technician"/>
       
      <div className="overflow-x-auto rounded-md">
        <table className="table w-full table-fixed">
          {/* Table header */}
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone Number</th>
              <th>Pay Rate</th>
              <th>Account Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {/* Table body */}
            {technicians.map((tech, index) => (
              <tr key={index}>
                <td>{tech.id}</td>
                <td>{tech.name}</td>
                <td>{tech.email}</td>
                <td>{tech.phone}</td>
                <td>{tech.payRate}</td>
                <td>
                  <span className={`badge ${tech.status === 'Active' ? 'badge-success bg-[#E6F9DD] text-[#1A932E] p-2 pl-4 pr-4 rounded shadow' : 'badge-error bg-[#FFE4E1] text-[#FF0000] p-2 pl-4 pr-4 rounded shadow'}`}>
                    {tech.status}
                  </span>
                </td>
                <td>
                <TableActions 
                editRoute="/technicians/create-technician"
              />
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
