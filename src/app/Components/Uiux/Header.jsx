"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import { BsTwitterX } from "react-icons/bs";
import { FaLinkedin } from "react-icons/fa";
import { FaFacebook } from "react-icons/fa6";
import { FaInstagram } from "react-icons/fa6";
import Button from "./Button";
import { HiOutlineMenu } from "react-icons/hi";
import { CgClose } from "react-icons/cg";
import PopupForm from "./PopupForm";
export const AppleIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 12 14"
      fill="none"
    >
      <path
        d="M8.28411 0C8.31624 0 8.34837 0 8.38232 0C8.46113 0.973611 8.08951 1.70109 7.63787 2.22791C7.19471 2.75109 6.58787 3.25851 5.60638 3.18151C5.54091 2.22185 5.91313 1.54832 6.36417 1.02272C6.78247 0.532879 7.54936 0.0969974 8.28411 0Z"
        fill="white"
      />
      <path
        d="M11.2553 10.1338C11.2553 10.1435 11.2553 10.152 11.2553 10.1611C10.9795 10.9965 10.586 11.7124 10.1059 12.3769C9.6676 12.9801 9.13048 13.7918 8.17142 13.7918C7.3427 13.7918 6.79224 13.2589 5.94291 13.2444C5.04447 13.2298 4.55039 13.69 3.72894 13.8058C3.63498 13.8058 3.54101 13.8058 3.44886 13.8058C2.84566 13.7185 2.35885 13.2407 2.00421 12.8103C0.958455 11.5384 0.150346 9.89555 0 7.79313C0 7.58701 0 7.3815 0 7.17538C0.0636545 5.67071 0.794772 4.44733 1.76656 3.85443C2.27944 3.53919 2.98449 3.27063 3.76956 3.39066C4.10602 3.4428 4.44975 3.55798 4.75105 3.67196C5.03659 3.78168 5.39366 3.97629 5.73194 3.96598C5.96109 3.95931 6.18904 3.83988 6.42001 3.75562C7.09657 3.5113 7.75979 3.23122 8.63398 3.36278C9.68458 3.52161 10.4302 3.98841 10.891 4.70862C10.0022 5.27423 9.29962 6.1266 9.41965 7.58216C9.52635 8.90436 10.2951 9.67791 11.2553 10.1338Z"
        fill="white"
      />
    </svg>
  );
};

const social_mediadata = [
  {
    icon: BsTwitterX,
    link: ""
  },
  {
    icon: FaLinkedin,
    link: ""
  },
  {
    icon: FaFacebook,
    link: ""
  },
  {
    icon: FaInstagram,
    link: ""
  }
];

const headerData = [
  {
    pagename: "Home",
    pagelink: "/"
  },
  {
    pagename: "About Us",
    pagelink: "/about-us"
  },
  {
    pagename: "Why Prorevv",
    pagelink: "/why-prorevv"
  },
  {
    pagename: "Contact Us",
    pagelink: "/contact-us"
  }
];

const Header = () => {
  const currentslug = usePathname();
  const [menuOpen, setmenuOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [menuOpen]);
  return (
    <header>
      <div className="gradient-primary">
        <div className="py-2 flex gap-3 justify-center md:justify-end items-center inn_container">
          <div className="flex gap-2 pe-3 border-r-2 text-white text-base">
            Get the app:
            <div className="flex items-center gap-2">
              <span className="pb-0.5">
                <AppleIcon />
              </span>
              <Image
                src={"/icons/playstore.svg"}
                alt=""
                width={20}
                height={20}
                className=""
              />
            </div>
          </div>

          <div className="flex gap-4">
            {social_mediadata.map((data, index) => {
              const Icon = data.icon;
              return (
                <Link href={data.link} target="_blank" key={index}>
                  <Icon className="text-lg text-white" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="inn_container py-4 2xl:py-6 flex items-center justify-between border-b-2 border-[#555]">
        <Link href={"/"}>
          <Image
            src={"/images/logo.webp"}
            alt=""
            width={300}
            height={70}
            className="max-w-[210px] md:max-w-[230px] 2xl:max-w-[300px]"
          />
        </Link>

        <div className="flex items-center gap-4 2xl:gap-8">
          <div className="hidden xl:flex gap-2 2xl:gap-6 bg-white/5 backdrop-blur-sm p-1 rounded-2xl relative">

            {headerData.map((data, index) => {
              const isActive = currentslug === data.pagelink;

              return (
                <div
                  key={index}
                  className="relative group"
                >
                  {/* Hover / Active Background */}
                  <span
                    className={`absolute inset-0 rounded-xl transition-all duration-300 ease-out ${isActive
                      ? "gradient-primary opacity-100 scale-100"
                      : "gradient-primary opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100"
                      }`}
                  ></span>

                  <Link
                    className="relative z-10 text-white px-4 py-2 block transition-all duration-300 group-hover:tracking-wide"
                    href={data.pagelink}
                  >
                    {data.pagename}
                  </Link>
                </div>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-4">
            {/* <Button button_name="Sign in" /> */}
            <Button button_name="Get a Demo" xxl={true} onClick={() => setIsContactOpen(true)} />
          </div>

          <div className="block lg:hidden" onClick={() => setmenuOpen(!menuOpen)}>
            {menuOpen
              ? <CgClose className="text-white text-[32px] md:text-4xl" />
              : <HiOutlineMenu className="text-white text-[32px] md:text-4xl" />}
          </div>
        </div>
      </div>

      <div className={`bg-black border-t-2 border-white absolute w-full h-[90vh] z-50 transition-all duration-500 ${menuOpen ? 'left-0' : 'left-[-100%]'}`}>
        <div className="flex flex-col gap-2 2xl:gap-6 pt-6">
          {headerData.map((data, index) =>
            <div
              className={`px-4 py-2  ${currentslug === data.pagelink
                ? "gradient-primary text-white"
                : ""}`}
              key={index}
            >
              <Link className="text-white" href={data.pagelink} onClick={() => setmenuOpen(!menuOpen)}>
                {data.pagename}
              </Link>
            </div>
          )}
        </div>
        <div className="flex md:hidden items-center gap-4 px-4 pt-5">
          {/* <Button button_name="Sign in" /> */}
          <Button button_secondary={true} button_name="Get a Demo" onClick={() => setIsContactOpen(true)} />
        </div>
      </div>
      <PopupForm isOpen={isContactOpen} onClose={() => {
        setmenuOpen(false)
        setIsContactOpen(false)
      }} />
    </header>
  );
};

export default Header;
