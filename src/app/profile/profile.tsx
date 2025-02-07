import Image from 'next/image';

const ProfileCard = () => {
  return (
    <div className=" rounded-lg p-6  mx-auto">
      <div className="flex items-center space-x-4 bg-white shadow-lg p-6">
        <div className="relative h-[50px] w-[50px]">
          <Image src="/path/to/your/profile.jpg" alt="Profile image" layout="fill" className="rounded-full" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">John Smith</h2>
          <p className="text-gray-700">Admin</p>
          <p className="text-gray-700">Leeds, United Kingdom</p>
        </div>
      </div>
      <div className="mt-8 bg-white shadow-lg p-6 rounded-lg">
        <h3 className="font-semibold text-lg">Personal Information</h3>
        <div className="mt-4">
          <div className="grid grid-cols-6 gap-4">
            <div><p className='text-gray-600'>First Name:</p> <p>John</p></div>
            <div><p className='text-gray-600'>Last Name:</p> <p>Smith</p></div>
            <div><p className='text-gray-600'>Date of Birth:</p> <p>12-10-1991</p></div>
            <div><p className='text-gray-600'>Email Address:</p> <p>info@johnsmith@gmail.com</p></div>
            <div><p className='text-gray-600'>Phone Number:</p> <p>+61 7 1234 1234</p></div>
            <div><p className='text-gray-600'>User Role:</p> <p>Admin</p></div>
          </div>
        </div>
        </div>
        <div className="mt-4 bg-white shadow-lg p-6 rounded-lg">
          <h3 className="font-semibold text-lg">Address</h3>
          <div className="grid grid-cols-6 gap-4">
            <div><p className='text-gray-600'>Country:</p> <p>United Kingdom</p></div>
            <div><p className='text-gray-600'>City:</p> <p>Leeds, East London</p></div>
            <div><p className='text-gray-600'>Postal Code:</p> <p>1254</p></div>
          </div>
        </div> 
    </div>
  );
};

export default ProfileCard;
