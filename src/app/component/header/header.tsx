"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTechnician } from "../../techheaderprofile/headerprofile";
import user from "../../../../public/user.png";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";

export default function Header() {
  const router = useRouter();
  const { technician, isLoading } = useTechnician();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const logOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("technicianData");
    router.push("/");
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
    <header className="bg-white shadow-md py-4 px-6 flex justify-between items-center">
      <div className="w-100 ml-auto flex items-center">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={toggleDropdown}
            className="flex gap-2 items-center bg-[#F7F7FD] hover:bg-gray-200 focus:outline-none focus:bg-gray-200 rounded-md border border-gray-300 text-sm pl-2 pr-2 pt-1 pb-1"
          >
            <Image
              width="30"
              height="30"
              src={technician?.image || user}
              alt="user"
              className="rounded-full h-[30px]"
            />
            <div className="text-left">
              <span className="text-sm">
                {technician
                  ? `${technician.firstName} ${technician.lastName}`
                  : "User"}
              </span>
              <p className="text-xs text-gray-500">{technician?.types}</p>
            </div>
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 py-2 w-48 bg-white rounded-md shadow-xl border border-[#ccc] z-20">
              <Link
                href="/profile"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#383d71] hover:text-white flex gap-2"
              >
                Profile
              </Link>
              <p
                onClick={logOut}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#383d71] hover:text-white flex gap-2 cursor-pointer"
              >
                Log out
              </p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
