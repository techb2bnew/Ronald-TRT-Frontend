// components/TechnicianTable.tsx
import React from 'react';
import TableActions from '../../component/action';
import CommonHeader from '../../component/commonHeader';
const TechnicianTable: React.FC = () => {
  // Sample data
  const technicians = [
    { id: '#1234', name: 'John Smith', email: 'info@johnsmith.com', phone: '+61 7 1234 1234', payRate: 'Fixed', make: 'Honda', active: true },
    { id: '#1234', name: 'John Smith', email: 'info@johnsmith.com', phone: '+61 7 1234 1234', payRate: 'Flat Rate', make: 'Honda', active: true },
    // Add more sample technicians as needed
  ];
  const handleSearch = (searchTerm: string) => {
    console.log('Searching for:', searchTerm);
    // Implement search logic here
  };
  return (
    <div className="container mx-auto mt-4">
      <CommonHeader heading='IFS Clients' title="Onboard clients effortlessly for seamless collaboration!" onSearch={handleSearch} buttonLabel="Create IFS Client" buttonLink="/client/create" />

      <div className="overflow-x-auto rounded-md">
        <table className="table w-full table-fixed">
          {/* Table header */}
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone Number</th>
              <th>VIN</th>
              <th>Car Make</th>
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
                  {tech.make}
                </td>
                <td> 
                  <TableActions
                    editRoute="/create-technician"
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
