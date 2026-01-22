"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTechnician } from "../../techheaderprofile/headerprofile";
import user from "../../../../public/user.png";
import { useState, useRef, useEffect } from "react";
import { useSidebar } from "@/app/component/SidebarContext";
import Image from "next/image";
import Swal from "sweetalert2";

export default function Header() {
  const router = useRouter();
  const { technician, isLoading } = useTechnician();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isCollapsed } = useSidebar();

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  // const logOut = () => {
  //   Swal.fire({
  //     title: "Are you sure?",
  //     text: "You will be logged out!",
  //     icon: "warning",
  //     showCancelButton: true,
  //     confirmButtonColor: "#383d71",
  //     cancelButtonColor: "#d33",
  //     confirmButtonText: "Yes, logout",
  //   }).then((result) => {
  //     if (result.isConfirmed) {
  //       localStorage.clear();
  //       router.push("/");
  //     }
  //   });
  // };
 
 const logOut = async () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");
  const technicianData = localStorage.getItem("technicianData");

  if (!token || !technicianData) {
    localStorage.clear();
    router.push("/");
    return;
  }

  const parsedTechnician = JSON.parse(technicianData);
  const email = parsedTechnician.email;

  // Show confirmation and wait for user response
  const result = await Swal.fire({
    icon: "warning",
    title: "Are you sure?",
    text: "You will be logged out!",
    showCancelButton: true,
    confirmButtonColor: "#383d71",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, logout",
  });

  // If user cancels, do nothing
  if (!result.isConfirmed) return;

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const response = await fetch(`/api/logout`, {
      method: "POST",
      headers,
      body: JSON.stringify({ email }),
    });

    const data = await response.json(); // optional: check `data.success` or `response.ok`

    // Clear localStorage and redirect
    localStorage.clear();
    router.push("/");
  } catch (error) {
    console.error("Error in logOut:", error);
    localStorage.clear();
    router.push("/");
  }
};

 




  // 🟡 Detect outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white shadow-md py-4 px-6 flex justify-between items-center border-[#383d71] border-b-[2px]">
      {/* <h1 className={`text-xl font-bold transition-all duration-300 capitalize ${isCollapsed ? '' : ''}`}> <i>Hi, {technician?.firstName} {technician?.lastName} </i>
      </h1> */}
      <div className="w-100 ml-auto flex items-center">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={toggleDropdown}
            className="flex gap-2 items-center bg-[#fff] shadow-lg hover:bg-[#f2f2f2] focus:outline-none focus:bg-gray-200 rounded-md border border-[#383d71] text-sm pl-2 pr-2 pt-1 pb-1"
          >
            <Image
              width="30"
              height="30"
              src={technician?.image || user}
              alt="user"
              className="rounded-full h-[30px]"
            />
            <div className="text-left">
              <span className="text-sm capitalize">
                {technician
                  ? `${technician.firstName} ${technician.lastName}`
                  : "User"}
              </span>
              <p className="text-xs text-black-500">
                {
                  technician?.types === "superadmin" ? "Super Admin" :
                    technician?.types === "single-technician" ? "Single Technician" :
                      technician?.types === "ifs" ? "IFS" :
                        technician?.types
                }
              </p>
            </div>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 py-2 w-40 bg-white rounded-md shadow-xl border border-[#383d71] z-20">
              <Link
                href="/profile"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-[var(--foreground)] hover:text-white flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="24" height="24">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                </svg>
                Profile
              </Link>
              <p
                onClick={logOut}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-[var(--foreground)] hover:text-white flex gap-2 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor"
                  strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 18H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h2" />
                  <polyline points="13 15 17 10 13 5" />
                  <line x1="17" y1="10" x2="7" y2="10" />
                </svg>


                Log out
              </p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
