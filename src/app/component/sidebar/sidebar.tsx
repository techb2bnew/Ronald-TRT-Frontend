"use client";
// components/Sidebar.tsx
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import logo from '../../../../public/logo-trt.png'
import Image from 'next/image';
const Sidebar = () => {
  const [userType, setUserType] = useState<string | null>(null);
  const [isUsersOpen, setIsUsersOpen] = useState(false);
  const [isUser1Open, setIsUser1Open] = useState(false);
  const [isUser2Open, setIsUser2Open] = useState(false);
  const [isUser3Open, setIsUser3Open] = useState(false);
  const [isUser4Open, setIsUser4Open] = useState(false);
  const [isUser5Open, setIsUser5Open] = useState(false);
  const [isUser6Open, setIsUser6Open] = useState(false);
  const [activeLink, setActiveLink] = useState('');
  useEffect(() => {
    const usersOpenState = localStorage.getItem('isUsersOpen');
    const user1OpenState = localStorage.getItem('isUser1Open');
    const user3OpenState = localStorage.getItem('isUser3Open');
    const user4OpenState = localStorage.getItem('isUser4Open');
    const user5OpenState = localStorage.getItem('isUser5Open');
    const user6OpenState = localStorage.getItem('isUser6Open');

    if (usersOpenState) setIsUsersOpen(JSON.parse(usersOpenState));
    if (user1OpenState) setIsUser1Open(JSON.parse(user1OpenState));
    if (user3OpenState) setIsUser3Open(JSON.parse(user3OpenState));
    if (user4OpenState) setIsUser4Open(JSON.parse(user4OpenState));
    if (user5OpenState) setIsUser5Open(JSON.parse(user5OpenState));
    if (user6OpenState) setIsUser5Open(JSON.parse(user6OpenState));

  }, []);

  // Save the state to localStorage whenever it changes
  const handleDropdownToggle = () => {
    setIsUsersOpen((prevState) => {
      const newState = !prevState;
      if (newState) {
        // setIsUser1Open(false);
        // setIsUser3Open(false);
      }
      localStorage.setItem('isUsersOpen', JSON.stringify(newState)); // Store in localStorage
      return newState;
    });
  };

  const handleDropdownToggles = () => {
    setIsUser1Open((prevState) => {
      const newState = !prevState;
      if (newState) {
        // setIsUser3Open(false);
      }
      localStorage.setItem('isUser1Open', JSON.stringify(newState)); // Store in localStorage
      return newState;
    });
  };
  const handleDropdownTogglesJobs = () => {
    setIsUser3Open((prevState) => {
      const newState = !prevState;
      if (newState) {
        // setIsUsersOpen(false);
        // setIsUser1Open(false);
      }
      localStorage.setItem('isUser3Open', JSON.stringify(newState)); // Store in localStorage
      return newState;
    });
  };

  const handleDropdownTogglesReporting = () => {
    setIsUser5Open((prevState) => {
      const newState = !prevState;
      if (newState) {
        // setIsUsersOpen(false);
        // setIsUser1Open(false);
      }
      localStorage.setItem('isUser5Open', JSON.stringify(newState)); // Store in localStorage
      return newState;
    });
  };
  const handleDropdownTogglesSingleTechnician = () => {
    setIsUser6Open((prevState) => {
      const newState = !prevState;
      if (newState) {
        // setIsUsersOpen(false);
        // setIsUser1Open(false);
      }
      localStorage.setItem('isUser6Open', JSON.stringify(newState)); // Store in localStorage
      return newState;
    });
  };

  const handleEnterpriceDropdown = () => {
    setIsUser4Open((prevState) => {
      const newState = !prevState;
      if (newState) {
        // setIsUsersOpen(false);
        // setIsUser1Open(false);
      }
      localStorage.setItem('isUser4Open', JSON.stringify(newState)); // Store in localStorage
      return newState;
    });
  };

  const pathname = usePathname();
  React.useEffect(() => {
    setActiveLink(pathname);
    const type = localStorage.getItem('types');
    setUserType(type);
  }, [pathname]);



  return (
    <div className="w-[15%] bg-black text-white fixed top-[0] overflowslidebar" style={{ height: '100vh', overflow: 'auto' }}>
      <div className="flex items-center justify-center h-16 border-b border-gray-700">
        <Image src={logo} alt="logo" className='w-[100px] invert_logo' />
      </div>

      <ul className="flex flex-col py-4" style={{ lineHeight: '1' }}>
        <li className='p-1'>
          <Link href="/dashboard" className={`flex items-center p-2 space-x-2 hover:text-[#EF502E] rounded ${activeLink === '/dashboard' ? 'active text-[#EF502E]' : ''}`}  >
            <svg width="18" height="18" viewBox="0 0 22 23" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M13.0349 2.53468C13.6676 1.90194 14.5609 1.64581 15.5835 1.64581H17.4168C18.4395 1.64581 19.3327 1.90194 19.9655 2.53468C20.5982 3.16742 20.8543 4.06067 20.8543 5.08331V6.91665C20.8543 7.93929 20.5982 8.83254 19.9655 9.46528C19.3327 10.098 18.4395 10.3541 17.4168 10.3541H15.5835C14.5609 10.3541 13.6676 10.098 13.0349 9.46528C12.4021 8.83254 12.146 7.93929 12.146 6.91665V5.08331C12.146 4.06067 12.4021 3.16742 13.0349 2.53468ZM14.0071 3.50695C13.7232 3.79088 13.521 4.27262 13.521 5.08331V6.91665C13.521 7.72734 13.7232 8.20908 14.0071 8.49301C14.2911 8.77694 14.7728 8.97915 15.5835 8.97915H17.4168C18.2275 8.97915 18.7093 8.77694 18.9932 8.49301C19.2771 8.20908 19.4793 7.72734 19.4793 6.91665V5.08331C19.4793 4.27262 19.2771 3.79088 18.9932 3.50695C18.7093 3.22302 18.2275 3.02081 17.4168 3.02081H15.5835C14.7728 3.02081 14.2911 3.22302 14.0071 3.50695Z" fill="currentColor" />
              <path fillRule="evenodd" clipRule="evenodd" d="M2.03486 13.5347C2.6676 12.9019 3.56085 12.6458 4.5835 12.6458H6.41683C7.43947 12.6458 8.33273 12.9019 8.96547 13.5347C9.5982 14.1674 9.85433 15.0607 9.85433 16.0833V17.9166C9.85433 18.9393 9.5982 19.8325 8.96547 20.4653C8.33273 21.098 7.43947 21.3541 6.41683 21.3541H4.5835C3.56085 21.3541 2.6676 21.098 2.03486 20.4653C1.40212 19.8325 1.146 18.9393 1.146 17.9166V16.0833C1.146 15.0607 1.40212 14.1674 2.03486 13.5347ZM3.00713 14.5069C2.7232 14.7909 2.521 15.2726 2.521 16.0833V17.9166C2.521 18.7273 2.7232 19.2091 3.00713 19.493C3.29106 19.7769 3.7728 19.9791 4.5835 19.9791H6.41683C7.22752 19.9791 7.70926 19.7769 7.99319 19.493C8.27712 19.2091 8.47933 18.7273 8.47933 17.9166V16.0833C8.47933 15.2726 8.27712 14.7909 7.99319 14.5069C7.70926 14.223 7.22752 14.0208 6.41683 14.0208H4.5835C3.7728 14.0208 3.29106 14.223 3.00713 14.5069Z" fill="currentColor" />
              <path fillRule="evenodd" clipRule="evenodd" d="M5.50016 3.02081C3.85481 3.02081 2.521 4.35463 2.521 5.99998C2.521 7.64533 3.85481 8.97915 5.50016 8.97915C7.14551 8.97915 8.47933 7.64533 8.47933 5.99998C8.47933 4.35463 7.14551 3.02081 5.50016 3.02081ZM1.146 5.99998C1.146 3.59524 3.09542 1.64581 5.50016 1.64581C7.9049 1.64581 9.85433 3.59524 9.85433 5.99998C9.85433 8.40472 7.9049 10.3541 5.50016 10.3541C3.09542 10.3541 1.146 8.40472 1.146 5.99998Z" fill="currentColor" />
              <path fillRule="evenodd" clipRule="evenodd" d="M16.5002 14.0208C14.8548 14.0208 13.521 15.3546 13.521 17C13.521 18.6453 14.8548 19.9791 16.5002 19.9791C18.1455 19.9791 19.4793 18.6453 19.4793 17C19.4793 15.3546 18.1455 14.0208 16.5002 14.0208ZM12.146 17C12.146 14.5952 14.0954 12.6458 16.5002 12.6458C18.9049 12.6458 20.8543 14.5952 20.8543 17C20.8543 19.4047 18.9049 21.3541 16.5002 21.3541C14.0954 21.3541 12.146 19.4047 12.146 17Z" fill="currentColor" />
            </svg>
            <span>Dashboard</span>
          </Link>
        </li>



        <li className='p-1'>
          <button onClick={handleDropdownToggle} className={`flex items-center justify-between p-2 space-x-2 hover:bg-white hover:text-[#EF502E] rounded w-full ${isUsersOpen ? 'active bg-white text-[#EF502E]' : ''}`}>
            <div className='flex items-center gap-2'>
              <svg width="18" height="18" viewBox="0 0 23 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M3.05877 6.24913C3.8704 5.28419 5.26191 4.8125 7.29969 4.8125H16.4664C18.5041 4.8125 19.8957 5.28419 20.7073 6.24913C21.511 7.20469 21.5875 8.46006 21.4587 9.63061L20.7708 16.9674C20.6699 17.9098 20.4333 18.943 19.5918 19.7117C18.7566 20.4748 17.4626 20.8542 15.5497 20.8542H8.21636C6.30341 20.8542 5.00943 20.4748 4.17421 19.7117C3.33277 18.943 3.09624 17.9098 2.99527 16.9674L2.9943 16.9583L2.30739 9.63063C2.17857 8.46008 2.25502 7.2047 3.05877 6.24913ZM4.11103 7.13421C3.67861 7.6483 3.5569 8.42076 3.67469 9.48522L3.67595 9.49665L4.36292 16.8254C4.45463 17.6773 4.64449 18.279 5.10163 18.6966C5.56579 19.1206 6.4443 19.4792 8.21636 19.4792H15.5497C17.3217 19.4792 18.2003 19.1206 18.6644 18.6966C19.1216 18.279 19.3114 17.6773 19.4031 16.8254L20.0913 9.48521C20.2091 8.42075 20.0874 7.6483 19.655 7.13421C19.2291 6.62789 18.3427 6.1875 16.4664 6.1875H7.29969C5.42331 6.1875 4.5369 6.62789 4.11103 7.13421Z" fill="currentColor" />
                <path fillRule="evenodd" clipRule="evenodd" d="M8.94386 3.71282C8.90492 4.0111 8.90381 4.35006 8.90381 4.76665V5.49998C8.90381 5.87968 8.59601 6.18748 8.21631 6.18748C7.83661 6.18748 7.52881 5.87968 7.52881 5.49998L7.52881 4.74282C7.52879 4.35459 7.52876 3.93054 7.58043 3.53482C7.63396 3.12479 7.74867 2.68949 8.01741 2.30065C8.58275 1.48268 9.61836 1.14581 11.1496 1.14581H12.6163C14.1476 1.14581 15.1832 1.48268 15.7485 2.30065C16.0173 2.68949 16.132 3.12479 16.1855 3.53482C16.2372 3.93054 16.2372 4.35459 16.2371 4.74283L16.2371 5.49998C16.2371 5.87968 15.9293 6.18748 15.5496 6.18748C15.1699 6.18748 14.8621 5.87968 14.8621 5.49998V4.76665C14.8621 4.35006 14.861 4.0111 14.8221 3.71282C14.784 3.42074 14.7153 3.22412 14.6174 3.08243C14.4494 2.83936 14.0184 2.52081 12.6163 2.52081H11.1496C9.74759 2.52081 9.31654 2.83936 9.14854 3.08243C9.05061 3.22412 8.98199 3.42074 8.94386 3.71282Z" fill="currentColor" />
                <path fillRule="evenodd" clipRule="evenodd" d="M10.738 11.6882C10.7373 11.7537 10.7373 11.8283 10.7373 11.9167V12.8608C10.7373 13.1189 10.7396 13.3087 10.762 13.4698C10.7835 13.6246 10.8177 13.7 10.8468 13.7409C10.8791 13.7865 11.0403 13.9792 11.8831 13.9792C12.7298 13.9792 12.8891 13.7847 12.9207 13.7395C12.9499 13.6978 12.9841 13.6213 13.0053 13.4646C13.0273 13.3017 13.029 13.111 13.029 12.8517V11.9167C13.029 11.8283 13.029 11.7537 13.0283 11.6882C12.9628 11.6875 12.8882 11.6875 12.7998 11.6875H10.9665C10.8781 11.6875 10.8035 11.6875 10.738 11.6882ZM10.9364 10.3125C10.9464 10.3125 10.9565 10.3125 10.9665 10.3125H12.7998C12.8098 10.3125 12.8199 10.3125 12.8299 10.3125C13.0326 10.3125 13.2381 10.3124 13.4057 10.331C13.5765 10.35 13.8604 10.4008 14.088 10.6285C14.3157 10.8561 14.3665 11.1399 14.3855 11.3108C14.4041 11.4784 14.404 11.6839 14.404 11.8866C14.404 11.8966 14.404 11.9066 14.404 11.9167V12.862C14.404 13.1 14.404 13.3817 14.3678 13.649C14.3303 13.9263 14.2481 14.241 14.047 14.5283C13.618 15.1407 12.8607 15.3542 11.8831 15.3542C10.911 15.3542 10.1555 15.1435 9.72495 14.536C9.5225 14.2504 9.43871 13.9367 9.4001 13.6593C9.36235 13.3881 9.36231 13.1024 9.36231 12.8608V11.9167C9.36231 11.9066 9.36231 11.8966 9.36231 11.8866C9.36226 11.6839 9.36222 11.4784 9.38084 11.3108C9.39983 11.1399 9.45059 10.8561 9.67826 10.6285C9.90593 10.4008 10.1897 10.35 10.3606 10.331C10.5282 10.3124 10.7337 10.3125 10.9364 10.3125Z" fill="currentColor" />
                <path fillRule="evenodd" clipRule="evenodd" d="M21.2849 9.67893C21.5082 9.98601 21.4403 10.416 21.1332 10.6393C18.9184 12.2501 16.388 13.2081 13.8023 13.5337C13.4256 13.5812 13.0817 13.3143 13.0343 12.9375C12.9868 12.5608 13.2538 12.217 13.6305 12.1695C15.9947 11.8718 18.3043 10.9965 20.3245 9.52729C20.6316 9.30397 21.0616 9.37186 21.2849 9.67893Z" fill="currentColor" />
                <path fillRule="evenodd" clipRule="evenodd" d="M2.7174 9.9425C2.93185 9.62917 3.35971 9.54902 3.67304 9.76348C5.64286 11.1117 7.86417 11.9243 10.1262 12.1776C10.5036 12.2198 10.7752 12.56 10.733 12.9373C10.6907 13.3147 10.3506 13.5863 9.97323 13.544C7.48697 13.2657 5.0516 12.3733 2.89642 10.8982C2.58309 10.6837 2.50294 10.2558 2.7174 9.9425Z" fill="currentColor" />
              </svg>
              <span>Users</span>
            </div>
            <svg className={`transform transition-transform ${isUsersOpen ? 'rotate-180' : 'rotate-0'}`} width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.5 7l4.5 4.5L13.5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

          </button>
          {isUsersOpen && (
            <ul className="ml-4">
              {userType == 'single-technician' && (
                <li className='mt-3'>
                  <Link href="/client/listing" className={`flex items-center p-2 space-x-2 hover:text-[#EF502E] rounded ${activeLink === '/client/listing' || activeLink === '/client/create' ? 'active text-[#EF502E]' : ''}`}   >
                    Customers
                  </Link>
                </li>
              )}
              {userType !== 'single-technician' && (
                <li className='p-1'>
                  <button onClick={handleDropdownToggles} className={`flex items-center justify-between p-2 space-x-2 hover:bg-white hover:text-[#EF502E] rounded w-full ${isUser1Open ? 'active text-[#EF502E]' : ''}`}>
                    <span>IFS</span>
                    <svg className={`transform transition-transform ${isUser1Open ? 'rotate-180' : 'rotate-0'}`} width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4.5 7l4.5 4.5L13.5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {isUser1Open && (
                    <ul className="ml-4">
                      <li >
                        <Link
                          href="/technicians/listing"
                          className={`flex items-center p-2 space-x-2 hover:text-[#EF502E] rounded ${activeLink === '/technicians/listing' || activeLink === '/technicians/create-technician' ? 'active text-[#EF502E]' : ''}`}
                        >
                          Technicians
                        </Link>
                      </li>

                      {/* <li  >
                        <Link href="/admin/listing"  className={`flex items-center p-2 space-x-2 hover:text-[#EF502E] rounded ${activeLink === '/admin/listing' || activeLink === '/admin/create' ? 'active text-[#EF502E]' : ''}`}  >
                          Admin 
                        </Link>
                      </li>  */}

                      <li >
                        <Link href="/client/listing" className={`flex items-center p-2 space-x-2 hover:text-[#EF502E] rounded ${activeLink === '/client/listing' || activeLink === '/client/create' ? 'active text-[#EF502E]' : ''}`}   >
                          Customers
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>
              )}
            </ul>
          )}
        </li>
        {/* {userType !== 'single-technician' && (
          <li className='p-1'>
          <button onClick={handleEnterpriceDropdown} className={`flex items-center justify-between p-2 space-x-2 hover:bg-white hover:text-[#EF502E] rounded w-full ${isUser4Open ? 'active bg-white text-[#EF502E]' : ''}`}>
            <div className='flex items-center gap-2'>  
              <svg fill="currentColor" width="18px" height="18px" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg"  ><path d="M8 2L8 6L4 6L4 48L46 48L46 14L30 14L30 6L26 6L26 2 Z M 10 4L24 4L24 8L28 8L28 46L19 46L19 39L15 39L15 46L6 46L6 8L10 8 Z M 10 10L10 12L12 12L12 10 Z M 14 10L14 12L16 12L16 10 Z M 18 10L18 12L20 12L20 10 Z M 22 10L22 12L24 12L24 10 Z M 10 15L10 19L12 19L12 15 Z M 14 15L14 19L16 19L16 15 Z M 18 15L18 19L20 19L20 15 Z M 22 15L22 19L24 19L24 15 Z M 30 16L44 16L44 46L30 46 Z M 32 18L32 20L34 20L34 18 Z M 36 18L36 20L38 20L38 18 Z M 40 18L40 20L42 20L42 18 Z M 10 21L10 25L12 25L12 21 Z M 14 21L14 25L16 25L16 21 Z M 18 21L18 25L20 25L20 21 Z M 22 21L22 25L24 25L24 21 Z M 32 22L32 24L34 24L34 22 Z M 36 22L36 24L38 24L38 22 Z M 40 22L40 24L42 24L42 22 Z M 32 26L32 28L34 28L34 26 Z M 36 26L36 28L38 28L38 26 Z M 40 26L40 28L42 28L42 26 Z M 10 27L10 31L12 31L12 27 Z M 14 27L14 31L16 31L16 27 Z M 18 27L18 31L20 31L20 27 Z M 22 27L22 31L24 31L24 27 Z M 32 30L32 32L34 32L34 30 Z M 36 30L36 32L38 32L38 30 Z M 40 30L40 32L42 32L42 30 Z M 10 33L10 37L12 37L12 33 Z M 14 33L14 37L16 37L16 33 Z M 18 33L18 37L20 37L20 33 Z M 22 33L22 37L24 37L24 33 Z M 32 34L32 36L34 36L34 34 Z M 36 34L36 36L38 36L38 34 Z M 40 34L40 36L42 36L42 34 Z M 32 38L32 40L34 40L34 38 Z M 36 38L36 40L38 40L38 38 Z M 40 38L40 40L42 40L42 38 Z M 10 39L10 44L12 44L12 39 Z M 22 39L22 44L24 44L24 39 Z M 32 42L32 44L34 44L34 42 Z M 36 42L36 44L38 44L38 42 Z M 40 42L40 44L42 44L42 42Z"/></svg>
              <span>Enterprises</span>
            </div>
            <svg className={`transform transition-transform ${isUser4Open ? 'rotate-180' : 'rotate-0'}`} width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.5 7l4.5 4.5L13.5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>



          </button>
          {isUser4Open && (
            <ul className="ml-4">
              <li >
                <Link href="/enterprice/technicians/listing" className={`flex items-center p-2 space-x-2 hover:text-[#EF502E] rounded ${activeLink === '/enterprice/technicians/listing' ? 'active text-[#EF502E]' : ''}`} >
                  <span>Technician</span>
                </Link>
              </li>
              <li >
                <Link href="/#" className={`flex items-center p-2 space-x-2 hover:text-[#EF502E] rounded ${activeLink === 'clients' ? 'active text-[#EF502E]' : ''}`}  >
                  <span>Customer</span>
                </Link>
              </li>
              <li >
                <Link href="/#" className={`flex items-center p-2 space-x-2 hover:text-[#EF502E] rounded ${activeLink === 'admin' ? 'active text-[#EF502E]' : ''}`}  >
                  <span>Admin</span>
                </Link>
              </li>
            </ul>
          )}
        </li>
        )}
        {userType !== 'single-technician' && (
        <li className='p-1'>
          <button onClick={() => setIsUser2Open(!isUser2Open)} className={`flex items-center justify-between p-2 space-x-2 hover:bg-white hover:text-[#EF502E] rounded w-full ${isUser2Open ? 'active bg-white text-[#EF502E]' : ''}`}>
            <div className='flex items-center gap-2'>
              <svg width="18" height="18" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_690_1656)">
                  <path d="M5.84375 22H18.7344C19.0903 22 19.3789 21.7114 19.3789 21.3555V3.26562C19.3789 2.90967 19.0903 2.62109 18.7344 2.62109H16.8008V0.644531C16.8008 0.288578 16.5122 0 16.1562 0H3.26562C2.90967 0 2.62109 0.288578 2.62109 0.644531V18.7773C2.62109 19.1333 2.90967 19.4219 3.26562 19.4219H5.19922V21.3555C5.19922 21.7114 5.4878 22 5.84375 22ZM16.8008 18.7773V3.91016H18.0898V20.7109H6.48828V19.4219H16.1562C16.5122 19.4219 16.8008 19.1333 16.8008 18.7773ZM3.91016 18.1328V1.28906H15.5117V18.1328H3.91016Z" fill="currentColor" />
                  <path d="M5.84375 5.19922H9.71094C10.0669 5.19922 10.3555 4.91064 10.3555 4.55469C10.3555 4.19873 10.0669 3.91016 9.71094 3.91016H5.84375C5.4878 3.91016 5.19922 4.19873 5.19922 4.55469C5.19922 4.91064 5.4878 5.19922 5.84375 5.19922Z" fill="currentColor" />
                  <path d="M13.5781 6.48828H5.84375C5.4878 6.48828 5.19922 6.77686 5.19922 7.13281C5.19922 7.48877 5.4878 7.77734 5.84375 7.77734H13.5781C13.9341 7.77734 14.2227 7.48877 14.2227 7.13281C14.2227 6.77686 13.9341 6.48828 13.5781 6.48828Z" fill="currentColor" />
                  <path d="M13.5781 9.06641H5.84375C5.4878 9.06641 5.19922 9.35498 5.19922 9.71094C5.19922 10.0669 5.4878 10.3555 5.84375 10.3555H13.5781C13.9341 10.3555 14.2227 10.0669 14.2227 9.71094C14.2227 9.35498 13.9341 9.06641 13.5781 9.06641Z" fill="currentColor" />
                  <path d="M13.5781 11.6445H5.84375C5.4878 11.6445 5.19922 11.9331 5.19922 12.2891C5.19922 12.645 5.4878 12.9336 5.84375 12.9336H13.5781C13.9341 12.9336 14.2227 12.645 14.2227 12.2891C14.2227 11.9331 13.9341 11.6445 13.5781 11.6445Z" fill="currentColor" />
                  <path d="M13.5781 14.2227H11C10.644 14.2227 10.3555 14.5112 10.3555 14.8672C10.3555 15.2231 10.644 15.5117 11 15.5117H13.5781C13.9341 15.5117 14.2227 15.2231 14.2227 14.8672C14.2227 14.5112 13.9341 14.2227 13.5781 14.2227Z" fill="currentColor" />
                </g>
                <defs>
                  <clipPath id="clip0_690_1656">
                    <rect width="22" height="22" fill="white" />
                  </clipPath>
                </defs>
              </svg>
              <span>Workshop</span>
            </div>
            <svg className={`transform transition-transform ${isUser2Open ? 'rotate-180' : 'rotate-0'}`} width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.5 7l4.5 4.5L13.5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>



          </button>
          {isUser2Open && (
            <ul className="ml-4">
              <li >
                <Link href="/#" className={`flex items-center p-2 space-x-2 hover:text-[#EF502E] rounded ${activeLink === 'technician' || activeLink === 'technicians/create-technician' ? 'active text-[#EF502E]' : ''}`} >
                  <span>Technician</span>
                </Link>
              </li>
              <li >
                <Link href="/#" className={`flex items-center p-2 space-x-2 hover:text-[#EF502E] rounded ${activeLink === 'clients' ? 'active text-[#EF502E]' : ''}`}  >
                  <span>Customer</span>
                </Link>
              </li>
              <li >
                <Link href="/#" className={`flex items-center p-2 space-x-2 hover:text-[#EF502E] rounded ${activeLink === 'admin' ? 'active text-[#EF502E]' : ''}`}  >
                  <span>Admin</span>
                </Link>
              </li>
            </ul>
          )}
        </li>
        )} */}
        <li className='p-1'>
          <button onClick={handleDropdownTogglesJobs} className={`flex items-center justify-between p-2 space-x-2 hover:bg-white hover:text-[#EF502E] rounded w-full ${isUser3Open ? 'active bg-white text-[#EF502E]' : ''}`}>
            <div className='flex items-center gap-2'>
              <svg width="18" height="18" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_690_1656)">
                  <path d="M5.84375 22H18.7344C19.0903 22 19.3789 21.7114 19.3789 21.3555V3.26562C19.3789 2.90967 19.0903 2.62109 18.7344 2.62109H16.8008V0.644531C16.8008 0.288578 16.5122 0 16.1562 0H3.26562C2.90967 0 2.62109 0.288578 2.62109 0.644531V18.7773C2.62109 19.1333 2.90967 19.4219 3.26562 19.4219H5.19922V21.3555C5.19922 21.7114 5.4878 22 5.84375 22ZM16.8008 18.7773V3.91016H18.0898V20.7109H6.48828V19.4219H16.1562C16.5122 19.4219 16.8008 19.1333 16.8008 18.7773ZM3.91016 18.1328V1.28906H15.5117V18.1328H3.91016Z" fill="currentColor" />
                  <path d="M5.84375 5.19922H9.71094C10.0669 5.19922 10.3555 4.91064 10.3555 4.55469C10.3555 4.19873 10.0669 3.91016 9.71094 3.91016H5.84375C5.4878 3.91016 5.19922 4.19873 5.19922 4.55469C5.19922 4.91064 5.4878 5.19922 5.84375 5.19922Z" fill="currentColor" />
                  <path d="M13.5781 6.48828H5.84375C5.4878 6.48828 5.19922 6.77686 5.19922 7.13281C5.19922 7.48877 5.4878 7.77734 5.84375 7.77734H13.5781C13.9341 7.77734 14.2227 7.48877 14.2227 7.13281C14.2227 6.77686 13.9341 6.48828 13.5781 6.48828Z" fill="currentColor" />
                  <path d="M13.5781 9.06641H5.84375C5.4878 9.06641 5.19922 9.35498 5.19922 9.71094C5.19922 10.0669 5.4878 10.3555 5.84375 10.3555H13.5781C13.9341 10.3555 14.2227 10.0669 14.2227 9.71094C14.2227 9.35498 13.9341 9.06641 13.5781 9.06641Z" fill="currentColor" />
                  <path d="M13.5781 11.6445H5.84375C5.4878 11.6445 5.19922 11.9331 5.19922 12.2891C5.19922 12.645 5.4878 12.9336 5.84375 12.9336H13.5781C13.9341 12.9336 14.2227 12.645 14.2227 12.2891C14.2227 11.9331 13.9341 11.6445 13.5781 11.6445Z" fill="currentColor" />
                  <path d="M13.5781 14.2227H11C10.644 14.2227 10.3555 14.5112 10.3555 14.8672C10.3555 15.2231 10.644 15.5117 11 15.5117H13.5781C13.9341 15.5117 14.2227 15.2231 14.2227 14.8672C14.2227 14.5112 13.9341 14.2227 13.5781 14.2227Z" fill="currentColor" />
                </g>
                <defs>
                  <clipPath id="clip0_690_1656">
                    <rect width="22" height="22" fill="white" />
                  </clipPath>
                </defs>
              </svg>
              <span>All Jobs</span>
            </div>
            <svg className={`transform transition-transform ${isUser3Open ? 'rotate-180' : 'rotate-0'}`} width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.5 7l4.5 4.5L13.5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>



          </button>
          {isUser3Open && (
            <ul className="ml-4">
              <li  >
                <Link href="/jobs/create-job/create" className={`flex items-center p-2 space-x-2 hover:text-[#EF502E] rounded ${activeLink === '/jobs/create-job/create' ? 'active text-[#EF502E]' : ''}`} >
                  <span>Create Job</span>
                </Link>
              </li>
              <li >
                <Link href="/jobs/active-job" className={`flex items-center p-2 space-x-2 hover:text-[#EF502E] rounded ${activeLink === '/jobs/active-job' ? 'active text-[#EF502E]' : ''}`} >
                  <span>Active Jobs</span>
                </Link>
              </li>
              <li >
                <Link href="/jobs/complete-job/listing" className={`flex items-center p-2 space-x-2 hover:text-[#EF502E] rounded ${activeLink === '/jobs/complete-job/listing' ? 'active text-[#EF502E]' : ''}`}>
                  <span>Completed Jobs</span>
                </Link>
              </li>
              <li >
                <Link href="/jobs/job-group/listing" className={`flex items-center p-2 space-x-2 hover:text-[#EF502E] rounded ${activeLink === '/jobs/job-group/listing' ? 'active text-[#EF502E]' : ''}`}  >
                  <span>Jobs by Group</span>
                </Link>
              </li>
            </ul>
          )}
        </li>


        <li className='p-1'>
          <button onClick={handleDropdownTogglesReporting} className={`flex items-center justify-between p-2 space-x-2 hover:bg-white hover:text-[#EF502E] rounded w-full ${isUser5Open ? 'active bg-white text-[#EF502E]' : ''}`}>
            <div className='flex items-center gap-2'>
              <svg width="18" height="18" viewBox="0 0 25 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.61623 7.10532H15.429C15.6986 7.10532 15.9173 6.88671 15.9173 6.61702C15.9173 6.34733 15.6986 6.12872 15.429 6.12872H7.61623C7.34654 6.12872 7.12793 6.34733 7.12793 6.61702C7.12793 6.88671 7.34654 7.10532 7.61623 7.10532Z" fill="currentColor" />
                <path d="M17.8705 9.05849C17.8705 8.7888 17.6518 8.57019 17.3822 8.57019H7.61623C7.34654 8.57019 7.12793 8.7888 7.12793 9.05849C7.12793 9.32818 7.34654 9.54679 7.61623 9.54679H17.3822C17.6518 9.54679 17.8705 9.32818 17.8705 9.05849Z" fill="currentColor" />
                <path d="M17.8704 11.5C17.8704 11.2303 17.6517 11.0117 17.3821 11.0117H10.0576C9.78795 11.0117 9.56934 11.2303 9.56934 11.5C9.56934 11.7696 9.78795 11.9883 10.0576 11.9883H17.3821C17.6517 11.9883 17.8704 11.7696 17.8704 11.5Z" fill="currentColor" />
                <path d="M20.3124 12.0316V5.0683C20.3124 4.67707 20.16 4.30924 19.8834 4.03247L16.5491 0.698221C16.2724 0.421502 15.9046 0.269104 15.5132 0.269104H6.15172C5.34398 0.269104 4.68683 0.926256 4.68683 1.734V8.17256L3.19044 6.67617C2.46156 5.94728 1.27558 5.94733 0.546644 6.67617C-0.182239 7.40505 -0.18219 8.59103 0.546644 9.31991L4.68678 13.46V19.3126C4.68678 20.1204 5.34393 20.7775 6.15168 20.7775H15.4884C16.4744 21.9698 17.9643 22.7307 19.6287 22.7307C22.5904 22.7307 25 20.3212 25 17.3595C25 14.6293 22.9525 12.3684 20.3124 12.0316ZM2.64296 10.0351L3.90555 8.77248L8.85006 13.7169L9.48138 15.6109L7.58742 14.9796L2.64296 10.0351ZM1.23724 7.36677C1.5854 7.01866 2.15178 7.01861 2.49989 7.36677L3.215 8.08188L1.95241 9.34447L1.23729 8.62936C0.889185 8.2813 0.889185 7.71487 1.23724 7.36677ZM6.15172 19.801C5.88248 19.801 5.66343 19.582 5.66343 19.3127V14.4367L6.97836 15.7517C7.03198 15.8053 7.09731 15.8457 7.16924 15.8697L10.099 16.8463C10.1496 16.8631 10.2017 16.8713 10.2534 16.8713C10.3809 16.8713 10.5057 16.8214 10.5988 16.7283C10.7295 16.5975 10.7752 16.4041 10.7167 16.2286L9.74013 13.2989C9.71616 13.2269 9.67577 13.1616 9.62216 13.108L5.66348 9.1493V1.734C5.66348 1.46475 5.88253 1.2457 6.15177 1.2457H15.4294V4.17549C15.4294 4.71487 15.8667 5.15209 16.406 5.15209H19.3358V11.9964C18.0267 12.0671 16.8408 12.6088 15.9448 13.4545C15.9358 13.454 15.9269 13.4532 15.9177 13.4532H11.5231C11.2534 13.4532 11.0348 13.6718 11.0348 13.9415C11.0348 14.2111 11.2534 14.4298 11.5231 14.4298H15.1291C14.8372 14.8766 14.6097 15.3693 14.4606 15.8947H12.0114C11.7417 15.8947 11.5231 16.1133 11.5231 16.383C11.5231 16.6526 11.7417 16.8713 12.0114 16.8713H14.2799C14.2654 17.0321 14.2575 17.1949 14.2575 17.3595C14.2575 18.2381 14.4696 19.0681 14.8452 19.801H6.15172ZM19.6288 21.7542C17.2055 21.7542 15.2341 19.7828 15.2341 17.3595C15.2341 14.9363 17.2055 12.9649 19.6288 12.9649C22.052 12.9649 24.0234 14.9363 24.0234 17.3595C24.0234 19.7828 22.052 21.7542 19.6288 21.7542Z" fill="currentColor" />
                <path d="M19.6289 14.1856C19.2244 14.1856 18.8965 14.5135 18.8965 14.9181V17.3595C18.8965 17.7641 19.2244 18.092 19.6289 18.092C20.0334 18.092 20.3614 17.7641 20.3614 17.3595V14.9181C20.3614 14.5135 20.0334 14.1856 19.6289 14.1856Z" fill="currentColor" />
                <path d="M19.6289 20.5335C20.0335 20.5335 20.3614 20.2056 20.3614 19.8011C20.3614 19.3965 20.0335 19.0686 19.6289 19.0686C19.2244 19.0686 18.8965 19.3965 18.8965 19.8011C18.8965 20.2056 19.2244 20.5335 19.6289 20.5335Z" fill="currentColor" />
              </svg>
              <span>All Reports</span>
            </div>
            <svg className={`transform transition-transform ${isUser5Open ? 'rotate-180' : 'rotate-0'}`} width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.5 7l4.5 4.5L13.5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>



          </button>
          {isUser5Open && (
            <ul className="ml-4">
              <li  >
                <Link href="/reporting/vehicle-info" className={`flex items-center p-2 space-x-2 hover:text-[#EF502E] rounded ${activeLink === '/reporting/vehicle-info' ? 'active text-[#EF502E]' : ''}`} >
                  <span>Vehicles Info</span>
                </Link>
              </li>
              <li >
                <Link href="/reporting/job-status" className={`flex items-center p-2 space-x-2 hover:text-[#EF502E] rounded ${activeLink === '/reporting/job-status' ? 'active text-[#EF502E]' : ''}`} >
                  <span>Jobs Status</span>
                </Link>
              </li> 
              <li >
                <Link href="/reporting/vehicle-list" className={`flex items-center p-2 space-x-2 hover:text-[#EF502E] rounded ${activeLink === '/reporting/vehicle-list' ? 'active text-[#EF502E]' : ''}`} >
                  <span>Vehicles List</span>
                </Link>
              </li> 
            </ul>
          )}
        </li>


        {/* <li className='p-1'>
<button onClick={handleDropdownTogglesSingleTechnician} className={`flex items-center justify-between p-2 space-x-2 hover:bg-white hover:text-[#EF502E] rounded w-full ${isUser6Open ? 'active bg-white text-[#EF502E]' : ''}`}>
  <div className='flex items-center gap-2'>
  <svg width="18" height="18" viewBox="0 0 25 23" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.61623 7.10532H15.429C15.6986 7.10532 15.9173 6.88671 15.9173 6.61702C15.9173 6.34733 15.6986 6.12872 15.429 6.12872H7.61623C7.34654 6.12872 7.12793 6.34733 7.12793 6.61702C7.12793 6.88671 7.34654 7.10532 7.61623 7.10532Z" fill="currentColor" />
    <path d="M17.8705 9.05849C17.8705 8.7888 17.6518 8.57019 17.3822 8.57019H7.61623C7.34654 8.57019 7.12793 8.7888 7.12793 9.05849C7.12793 9.32818 7.34654 9.54679 7.61623 9.54679H17.3822C17.6518 9.54679 17.8705 9.32818 17.8705 9.05849Z" fill="currentColor" />
    <path d="M17.8704 11.5C17.8704 11.2303 17.6517 11.0117 17.3821 11.0117H10.0576C9.78795 11.0117 9.56934 11.2303 9.56934 11.5C9.56934 11.7696 9.78795 11.9883 10.0576 11.9883H17.3821C17.6517 11.9883 17.8704 11.7696 17.8704 11.5Z" fill="currentColor" />
    <path d="M20.3124 12.0316V5.0683C20.3124 4.67707 20.16 4.30924 19.8834 4.03247L16.5491 0.698221C16.2724 0.421502 15.9046 0.269104 15.5132 0.269104H6.15172C5.34398 0.269104 4.68683 0.926256 4.68683 1.734V8.17256L3.19044 6.67617C2.46156 5.94728 1.27558 5.94733 0.546644 6.67617C-0.182239 7.40505 -0.18219 8.59103 0.546644 9.31991L4.68678 13.46V19.3126C4.68678 20.1204 5.34393 20.7775 6.15168 20.7775H15.4884C16.4744 21.9698 17.9643 22.7307 19.6287 22.7307C22.5904 22.7307 25 20.3212 25 17.3595C25 14.6293 22.9525 12.3684 20.3124 12.0316ZM2.64296 10.0351L3.90555 8.77248L8.85006 13.7169L9.48138 15.6109L7.58742 14.9796L2.64296 10.0351ZM1.23724 7.36677C1.5854 7.01866 2.15178 7.01861 2.49989 7.36677L3.215 8.08188L1.95241 9.34447L1.23729 8.62936C0.889185 8.2813 0.889185 7.71487 1.23724 7.36677ZM6.15172 19.801C5.88248 19.801 5.66343 19.582 5.66343 19.3127V14.4367L6.97836 15.7517C7.03198 15.8053 7.09731 15.8457 7.16924 15.8697L10.099 16.8463C10.1496 16.8631 10.2017 16.8713 10.2534 16.8713C10.3809 16.8713 10.5057 16.8214 10.5988 16.7283C10.7295 16.5975 10.7752 16.4041 10.7167 16.2286L9.74013 13.2989C9.71616 13.2269 9.67577 13.1616 9.62216 13.108L5.66348 9.1493V1.734C5.66348 1.46475 5.88253 1.2457 6.15177 1.2457H15.4294V4.17549C15.4294 4.71487 15.8667 5.15209 16.406 5.15209H19.3358V11.9964C18.0267 12.0671 16.8408 12.6088 15.9448 13.4545C15.9358 13.454 15.9269 13.4532 15.9177 13.4532H11.5231C11.2534 13.4532 11.0348 13.6718 11.0348 13.9415C11.0348 14.2111 11.2534 14.4298 11.5231 14.4298H15.1291C14.8372 14.8766 14.6097 15.3693 14.4606 15.8947H12.0114C11.7417 15.8947 11.5231 16.1133 11.5231 16.383C11.5231 16.6526 11.7417 16.8713 12.0114 16.8713H14.2799C14.2654 17.0321 14.2575 17.1949 14.2575 17.3595C14.2575 18.2381 14.4696 19.0681 14.8452 19.801H6.15172ZM19.6288 21.7542C17.2055 21.7542 15.2341 19.7828 15.2341 17.3595C15.2341 14.9363 17.2055 12.9649 19.6288 12.9649C22.052 12.9649 24.0234 14.9363 24.0234 17.3595C24.0234 19.7828 22.052 21.7542 19.6288 21.7542Z" fill="currentColor" />
    <path d="M19.6289 14.1856C19.2244 14.1856 18.8965 14.5135 18.8965 14.9181V17.3595C18.8965 17.7641 19.2244 18.092 19.6289 18.092C20.0334 18.092 20.3614 17.7641 20.3614 17.3595V14.9181C20.3614 14.5135 20.0334 14.1856 19.6289 14.1856Z" fill="currentColor" />
    <path d="M19.6289 20.5335C20.0335 20.5335 20.3614 20.2056 20.3614 19.8011C20.3614 19.3965 20.0335 19.0686 19.6289 19.0686C19.2244 19.0686 18.8965 19.3965 18.8965 19.8011C18.8965 20.2056 19.2244 20.5335 19.6289 20.5335Z" fill="currentColor" />
  </svg>
    <span>Single Technician</span>
  </div>
  <svg className={`transform transition-transform ${isUser6Open ? 'rotate-180' : 'rotate-0'}`} width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.5 7l4.5 4.5L13.5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>



</button>
{isUser6Open && (
  <ul className="ml-4">
    <li  >
      <Link href="/single-technicians/listing" className={`flex items-center p-2 space-x-2 hover:text-[#EF502E] rounded ${activeLink === '/single-technicians/listing' ? 'active text-[#EF502E]' : ''}`} >
        <span>Technician</span>
      </Link>
    </li>
    <li >
      <Link href="/single-technicians/customer" className={`flex items-center p-2 space-x-2 hover:text-[#EF502E] rounded ${activeLink === '/single-technicians/customer' ? 'active text-[#EF502E]' : ''}`} >
        <span>Customer</span>
      </Link>
    </li> 
     
  </ul>
)}
</li> */}


        {userType !== 'single-technician' && (
          <li className='p-1'>
            <Link href="/single-technicians/listing" className={`flex items-center p-2 space-x-2 hover:text-[#EF502E] hover:bg-white rounded ${activeLink === '/single-technicians/listing' || activeLink === '/single-technicians/create-technician' || activeLink === '/single-technicians/view' ? 'active text-[#EF502E]' : ''}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20C4 16.6863 7.13401 14 11 14H13C16.866 14 20 16.6863 20 20" />
            </svg>


              <span>Single Technicians</span>
            </Link>
          </li>
        )}
        {userType !== 'single-technician' && (
          <li className='p-1'>
            <Link href="/all-customer/listing" className={`flex items-center p-2 space-x-2 hover:text-[#EF502E] hover:bg-white rounded ${activeLink === '/all-customer/listing' || activeLink === '/all-customer/listing' ? 'active text-[#EF502E]' : ''}`} >

              <svg width="18" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.8125 6.5625H9.1875C8.8394 6.5625 8.50556 6.70078 8.25942 6.94692C8.01328 7.19306 7.875 7.5269 7.875 7.875V17.7188C7.875 18.0668 8.01328 18.4007 8.25942 18.6468C8.50556 18.893 8.8394 19.0312 9.1875 19.0312H11.8125C12.1606 19.0312 12.4944 18.893 12.7406 18.6468C12.9867 18.4007 13.125 18.0668 13.125 17.7188V7.875C13.125 7.5269 12.9867 7.19306 12.7406 6.94692C12.4944 6.70078 12.1606 6.5625 11.8125 6.5625ZM9.1875 17.7188V7.875H11.8125V17.7188H9.1875ZM18.375 1.96875H15.75C15.4019 1.96875 15.0681 2.10703 14.8219 2.35317C14.5758 2.59931 14.4375 2.93315 14.4375 3.28125V17.7188C14.4375 18.0668 14.5758 18.4007 14.8219 18.6468C15.0681 18.893 15.4019 19.0312 15.75 19.0312H18.375C18.7231 19.0312 19.0569 18.893 19.3031 18.6468C19.5492 18.4007 19.6875 18.0668 19.6875 17.7188V3.28125C19.6875 2.93315 19.5492 2.59931 19.3031 2.35317C19.0569 2.10703 18.7231 1.96875 18.375 1.96875ZM15.75 17.7188V3.28125H18.375V17.7188H15.75ZM5.25 11.1562H2.625C2.2769 11.1562 1.94306 11.2945 1.69692 11.5407C1.45078 11.7868 1.3125 12.1207 1.3125 12.4688V17.7188C1.3125 18.0668 1.45078 18.4007 1.69692 18.6468C1.94306 18.893 2.2769 19.0312 2.625 19.0312H5.25C5.5981 19.0312 5.93194 18.893 6.17808 18.6468C6.42422 18.4007 6.5625 18.0668 6.5625 17.7188V12.4688C6.5625 12.1207 6.42422 11.7868 6.17808 11.5407C5.93194 11.2945 5.5981 11.1562 5.25 11.1562ZM2.625 17.7188V12.4688H5.25V17.7188H2.625Z" fill="currentColor" />
              </svg>

              <span>All Customers</span>
            </Link>
          </li>
        )}
        {/* <li className='p-1'>
          <Link href="#" className="flex items-center p-2 space-x-2 hover:bg-white hover:text-[#EF502E] rounded">
            <svg width="18" height="18" viewBox="0 0 19 23" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.2256 18.9668L17.1984 6.02411C17.1344 5.19027 16.4292 4.53706 15.593 4.53706H13.5642V4.44587C13.5642 1.9944 11.5698 0 9.11828 0C6.66681 0 4.67241 1.9944 4.67241 4.44587V4.53706H2.64365C1.80734 4.53706 1.10211 5.19023 1.03832 6.02236L0.0108676 18.9686C-0.0686441 20.0051 0.290955 21.0371 0.997397 21.7998C1.70384 22.5625 2.70528 23 3.74491 23H14.4916C15.5312 23 16.5327 22.5625 17.2392 21.7998C17.9456 21.0371 18.3052 20.0051 18.2256 18.9668ZM6.01962 4.44587C6.01962 2.73727 7.40973 1.34721 9.11828 1.34721C10.8268 1.34721 12.217 2.73731 12.217 4.44587V4.53706H6.01962V4.44587ZM16.2508 20.8844C15.7917 21.3799 15.1671 21.6528 14.4916 21.6528H3.74495C3.06951 21.6528 2.44482 21.3799 1.98581 20.8844C1.52685 20.3889 1.30251 19.7451 1.35408 19.0734L2.38144 6.12712C2.39186 5.99092 2.50704 5.88427 2.64365 5.88427H4.67241V7.54346C4.67241 7.91546 4.97402 8.21706 5.34601 8.21706C5.71801 8.21706 6.01962 7.91546 6.01962 7.54346V5.88427H12.217V7.54346C12.217 7.91546 12.5186 8.21706 12.8906 8.21706C13.2626 8.21706 13.5642 7.91546 13.5642 7.54346V5.88427H15.593C15.7295 5.88427 15.8447 5.99096 15.8553 6.12892L16.8824 19.0716C16.9341 19.7451 16.7097 20.3888 16.2508 20.8844Z" fill="currentColor" />
              <path d="M12.1555 11.4228C11.8925 11.1598 11.4659 11.1598 11.2029 11.4228L8.19514 14.4306L7.03858 13.2741C6.77556 13.011 6.34903 13.011 6.08597 13.2741C5.82291 13.5371 5.82291 13.9636 6.08597 14.2267L7.71883 15.8595C7.85037 15.9911 8.02278 16.0569 8.1951 16.0569C8.36742 16.0569 8.53987 15.9911 8.67136 15.8595L12.1554 12.3755C12.4185 12.1124 12.4185 11.6859 12.1555 11.4228Z" fill="currentColor" />
            </svg>

            <span>Orders</span>
          </Link>
        </li>
        <li className='p-1'>
        <Link href="/#" className="flex items-center p-2 space-x-2 hover:bg-white hover:text-[#EF502E] rounded" >

            <svg width="18" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.8125 6.5625H9.1875C8.8394 6.5625 8.50556 6.70078 8.25942 6.94692C8.01328 7.19306 7.875 7.5269 7.875 7.875V17.7188C7.875 18.0668 8.01328 18.4007 8.25942 18.6468C8.50556 18.893 8.8394 19.0312 9.1875 19.0312H11.8125C12.1606 19.0312 12.4944 18.893 12.7406 18.6468C12.9867 18.4007 13.125 18.0668 13.125 17.7188V7.875C13.125 7.5269 12.9867 7.19306 12.7406 6.94692C12.4944 6.70078 12.1606 6.5625 11.8125 6.5625ZM9.1875 17.7188V7.875H11.8125V17.7188H9.1875ZM18.375 1.96875H15.75C15.4019 1.96875 15.0681 2.10703 14.8219 2.35317C14.5758 2.59931 14.4375 2.93315 14.4375 3.28125V17.7188C14.4375 18.0668 14.5758 18.4007 14.8219 18.6468C15.0681 18.893 15.4019 19.0312 15.75 19.0312H18.375C18.7231 19.0312 19.0569 18.893 19.3031 18.6468C19.5492 18.4007 19.6875 18.0668 19.6875 17.7188V3.28125C19.6875 2.93315 19.5492 2.59931 19.3031 2.35317C19.0569 2.10703 18.7231 1.96875 18.375 1.96875ZM15.75 17.7188V3.28125H18.375V17.7188H15.75ZM5.25 11.1562H2.625C2.2769 11.1562 1.94306 11.2945 1.69692 11.5407C1.45078 11.7868 1.3125 12.1207 1.3125 12.4688V17.7188C1.3125 18.0668 1.45078 18.4007 1.69692 18.6468C1.94306 18.893 2.2769 19.0312 2.625 19.0312H5.25C5.5981 19.0312 5.93194 18.893 6.17808 18.6468C6.42422 18.4007 6.5625 18.0668 6.5625 17.7188V12.4688C6.5625 12.1207 6.42422 11.7868 6.17808 11.5407C5.93194 11.2945 5.5981 11.1562 5.25 11.1562ZM2.625 17.7188V12.4688H5.25V17.7188H2.625Z" fill="currentColor" />
            </svg>

            <span>Subscribers</span>
          </Link>
        </li> */}
        {/* <li className='p-1'>
          <Link href="#" className="flex items-center p-2 space-x-2 hover:bg-white hover:text-[#EF502E] rounded">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_217_1077)">
                <path d="M16.325 18.4683H3.38379V19.9388H16.325V18.4683Z" fill="currentColor" />
                <path d="M12.1827 6.62988H7.6484C7.24227 6.62988 6.91309 6.95906 6.91309 7.3652C6.91309 7.77133 7.24227 8.10051 7.6484 8.10051H12.1827C12.5888 8.10051 12.918 7.77133 12.918 7.3652C12.918 6.95906 12.5888 6.62988 12.1827 6.62988Z" fill="currentColor" />
                <path d="M15.6141 10.0613H7.6484C7.24227 10.0613 6.91309 10.3905 6.91309 10.7966C6.91309 11.2027 7.24227 11.5319 7.6484 11.5319H15.6141C16.0202 11.5319 16.3494 11.2027 16.3494 10.7966C16.3494 10.3905 16.0202 10.0613 15.6141 10.0613Z" fill="currentColor" />
                <path d="M19.5667 0.15083C19.3027 0.0321973 18.9941 0.0790332 18.7775 0.270439L16.7184 2.092L14.6569 0.248604C14.3777 -0.00116212 13.9557 -0.00116212 13.6765 0.248604L11.6177 2.08978L9.55859 0.248604C9.27942 -0.00116212 8.85762 -0.00116212 8.57844 0.248604L6.51691 2.092L4.45785 0.270439C4.24145 0.0792676 3.93262 0.0324316 3.66863 0.15083C3.40492 0.269697 3.23531 0.531963 3.23531 0.821182V13.9094H0.735313C0.32918 13.9094 0 14.2386 0 14.6447V16.4339C0 18.3665 1.5723 19.9388 3.50488 19.9388V18.4682C2.38309 18.4682 1.47059 17.5555 1.47059 16.4339V15.38H12.9902V16.4339C12.9902 18.3665 14.5625 19.9388 16.4951 19.9388C18.4277 19.9388 20 18.3665 20 16.434V0.821143C20 0.531924 19.8304 0.269697 19.5667 0.15083ZM18.5294 16.4339C18.5294 17.5555 17.6167 18.4682 16.4951 18.4682C15.3736 18.4682 14.4608 17.5555 14.4608 16.4339V14.6447C14.4608 14.2386 14.1316 13.9094 13.7255 13.9094H4.7059V2.45325L6.03262 3.62704C6.31203 3.87411 6.73211 3.87286 7.00981 3.62435L9.06863 1.78317L11.1275 3.62411C11.4066 3.87388 11.8287 3.87388 12.1079 3.62411L14.1669 1.78294L16.2257 3.62411C16.5037 3.87263 16.9238 3.8736 17.2029 3.62681L18.5294 2.45329V16.4339Z" fill="currentColor" />
              </g>
              <defs>
                <clipPath id="clip0_217_1077">
                  <rect width="20" height="20" fill="currentColor" />
                </clipPath>
              </defs>
            </svg>

            <span>Invoice</span>
          </Link>
        </li>  */}
        {userType !== 'single-technician' && (
          <li className='p-1'>
            <Link href="/role/listing" className={`flex items-center p-2 space-x-2 hover:text-[#EF502E] hover:bg-white rounded ${activeLink === '/role/listing' || activeLink === '/role/create' ? 'active text-[#EF502E]' : ''}`}>

              <svg width="18" height="18" viewBox="0 0 23 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.4995 22.2891H3.02618C1.35745 22.2891 0 20.9317 0 19.2629V10.3862C0 8.71743 1.35745 7.35999 3.02618 7.35999H15.1309C16.7996 7.35999 18.1571 8.71743 18.1571 10.3862V13.2106C18.1571 13.5447 17.8862 13.8158 17.5518 13.8158C17.2175 13.8158 16.9466 13.5447 16.9466 13.2106V10.3862C16.9466 9.38492 16.1321 8.57046 15.1309 8.57046H3.02618C2.02494 8.57046 1.21047 9.38492 1.21047 10.3862V19.2629C1.21047 20.2642 2.02494 21.0786 3.02618 21.0786H11.4995C11.8338 21.0786 12.1047 21.3497 12.1047 21.6839C12.1047 22.018 11.8338 22.2891 11.4995 22.2891Z" fill="currentColor" />
                <path d="M6.25486 8.57029C5.92053 8.57029 5.64963 8.29919 5.64963 7.96505V6.14935C5.64963 4.3695 7.0977 2.92143 8.87755 2.92143C10.154 2.92143 11.3131 3.6756 11.8302 4.84313C11.9756 5.17175 12.3129 5.34985 12.6484 5.2746C12.8723 5.22534 13.0549 5.07679 13.1499 4.86795C13.2438 4.66069 13.2356 4.42782 13.1268 4.22923C12.2753 2.67595 10.647 1.71096 8.87755 1.71096C6.20777 1.71096 4.03567 3.88287 4.03567 6.55284V7.96506C4.03567 8.29919 3.76477 8.57029 3.43043 8.57029C3.09609 8.57029 2.8252 8.29919 2.8252 7.96506V6.55284C2.8252 3.21538 5.54028 0.500488 8.87755 0.500488C11.0893 0.500488 13.1242 1.70623 14.1883 3.64763C14.4819 4.18351 14.5051 4.81042 14.2522 5.36798C13.9984 5.92711 13.5092 6.3239 12.9105 6.45669C12.0186 6.65253 11.0991 6.18166 10.7234 5.3333C10.4001 4.60355 9.67546 4.1319 8.87754 4.1319C7.76519 4.1319 6.86009 5.03699 6.86009 6.14935V7.96505C6.86009 8.29919 6.5892 8.57029 6.25486 8.57029Z" fill="currentColor" />
                <path d="M9.079 15.6209C7.69141 15.6209 6.5625 14.492 6.5625 13.1046C6.5625 11.7168 7.6914 10.5879 9.079 10.5879C10.4666 10.5879 11.5955 11.7168 11.5955 13.1046C11.5955 14.492 10.4666 15.6209 9.079 15.6209ZM9.079 11.7984C8.3589 11.7984 7.77297 12.3843 7.77297 13.1046C7.77297 13.8245 8.3589 14.4104 9.079 14.4104C9.79909 14.4104 10.385 13.8245 10.385 13.1046C10.385 12.3843 9.79909 11.7984 9.079 11.7984Z" fill="currentColor" />
                <path d="M9.07887 19.0611C8.74453 19.0611 8.47363 18.79 8.47363 18.4558V15.0155C8.47363 14.6814 8.74453 14.4103 9.07887 14.4103C9.4132 14.4103 9.6841 14.6814 9.6841 15.0155V18.4558C9.6841 18.79 9.4132 19.0611 9.07887 19.0611Z" fill="currentColor" />
                <path d="M17.5536 23.4995C14.55 23.4995 12.1064 21.0561 12.1064 18.0523C12.1064 15.0486 14.55 12.6052 17.5536 12.6052C20.5571 12.6052 23.0007 15.0486 23.0007 18.0523C23.0007 21.0561 20.5571 23.4995 17.5536 23.4995ZM17.5536 13.8157C15.2175 13.8157 13.3169 15.7161 13.3169 18.0523C13.3169 20.3886 15.2175 22.289 17.5536 22.289C19.8896 22.289 21.7902 20.3886 21.7902 18.0523C21.7902 15.7161 19.8896 13.8157 17.5536 13.8157Z" fill="currentColor" />
                <path d="M16.8477 20.2715C16.6928 20.2715 16.538 20.2124 16.4198 20.0942L14.6041 18.2789C14.3677 18.0425 14.3677 17.6595 14.6041 17.4231C14.8401 17.1866 15.2235 17.1866 15.4599 17.4231L16.8477 18.8104L19.6477 16.0104C19.8841 15.774 20.2671 15.774 20.5035 16.0104C20.74 16.2469 20.74 16.6299 20.5035 16.8663L17.2756 20.0942C17.1574 20.2124 17.0026 20.2715 16.8477 20.2715Z" fill="currentColor" />
              </svg>

              <span>Roles & Permissions</span>
            </Link>
          </li>
        )}
        <li className='p-1'>
          <Link href="/archive/listing" className={`flex items-center p-2 space-x-2 hover:bg-white hover:text-[#EF502E] rounded ${activeLink === '/archive/listing' ? 'active text-[#EF502E]' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 20 23" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 5.58337H3H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M17 5.58337V19.5834C17 20.1138 16.7893 20.6225 16.4142 20.9976C16.0391 21.3727 15.5304 21.5834 15 21.5834H5C4.46957 21.5834 3.96086 21.3727 3.58579 20.9976C3.21071 20.6225 3 20.1138 3 19.5834V5.58337M6 5.58337V3.58337C6 3.05294 6.21071 2.54423 6.58579 2.16916C6.96086 1.79409 7.46957 1.58337 8 1.58337H12C12.5304 1.58337 13.0391 1.79409 13.4142 2.16916C13.7893 2.54423 14 3.05294 14 3.58337V5.58337" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" />
              <path d="M8 10.5834V16.5834" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 10.5834V16.5834" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

            <span>Archives</span>
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
