import React from 'react';  
 
export default function Loading() { 
  return (
    <div className='flex justify-center items-center h-[20vh]'> 
            <div id="preloader">
    <div className="bar-container">
      <div className="bar"></div>
      <div className="bar"></div>
      <div className="bar"></div>
      <div className="bar"></div>
      <div className="bar"></div>
    </div>
    <h1>Loading...</h1>
  </div>
    </div>
  );
};
 
