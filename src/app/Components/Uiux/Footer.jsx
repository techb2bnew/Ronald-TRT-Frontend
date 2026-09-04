"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { IoCall } from "react-icons/io5";
import { MdOutlineWhatsapp } from "react-icons/md";
import { CiMail } from "react-icons/ci";
import NewletterForm from "./NewletterForm";
const emailicon = (
  <svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M19.7284 3.94629H3.94552C2.85594 3.94629 1.97266 4.82957 1.97266 5.91915V17.7563C1.97266 18.8459 2.85594 19.7292 3.94552 19.7292H19.7284C20.818 19.7292 21.7013 18.8459 21.7013 17.7563V5.91915C21.7013 4.82957 20.818 3.94629 19.7284 3.94629Z"
      stroke="white"
      strokeOpacity="0.6"
      strokeWidth="1.97286"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M21.7013 6.90527L12.853 12.5279C12.5484 12.7187 12.1963 12.8199 11.837 12.8199C11.4776 12.8199 11.1255 12.7187 10.8209 12.5279L1.97266 6.90527"
      stroke="white"
      strokeOpacity="0.6"
      strokeWidth="1.97286"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const instagram = (
  <svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M16.7691 1.97266H6.90481C4.18086 1.97266 1.97266 4.18086 1.97266 6.90481V16.7691C1.97266 19.4931 4.18086 21.7013 6.90481 21.7013H16.7691C19.4931 21.7013 21.7013 19.4931 21.7013 16.7691V6.90481C21.7013 4.18086 19.4931 1.97266 16.7691 1.97266Z"
      stroke="white"
      strokeOpacity="0.6"
      strokeWidth="1.97286"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15.7837 11.2158C15.9055 12.0367 15.7652 12.8752 15.383 13.6119C15.0007 14.3486 14.3959 14.946 13.6545 15.3192C12.9132 15.6923 12.073 15.8222 11.2536 15.6903C10.4342 15.5585 9.67718 15.1716 9.09031 14.5847C8.50343 13.9979 8.11655 13.2409 7.98469 12.4214C7.85283 11.602 7.98271 10.7619 8.35586 10.0205C8.72901 9.27915 9.32642 8.67433 10.0631 8.29207C10.7998 7.90981 11.6383 7.76958 12.4593 7.89132C13.2967 8.0155 14.072 8.40573 14.6707 9.00437C15.2693 9.60301 15.6595 10.3783 15.7837 11.2158Z"
      stroke="white"
      strokeOpacity="0.6"
      strokeWidth="1.97286"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M17.2627 6.41211H17.2721"
      stroke="white"
      strokeOpacity="0.6"
      strokeWidth="1.97286"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const linkedine = (
  <svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M15.7824 7.8916C17.352 7.8916 18.8573 8.51512 19.9672 9.62499C21.0771 10.7349 21.7006 12.2402 21.7006 13.8098V20.7143H17.7551V13.8098C17.7551 13.2866 17.5473 12.7848 17.1773 12.4148C16.8074 12.0449 16.3056 11.837 15.7824 11.837C15.2592 11.837 14.7575 12.0449 14.3875 12.4148C14.0175 12.7848 13.8097 13.2866 13.8097 13.8098V20.7143H9.86426V13.8098C9.86426 12.2402 10.4878 10.7349 11.5976 9.62499C12.7075 8.51512 14.2128 7.8916 15.7824 7.8916Z"
      stroke="white"
      strokeOpacity="0.6"
      strokeWidth="1.97286"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5.9181 8.87793H1.97266V20.7143H5.9181V8.87793Z"
      stroke="white"
      strokeOpacity="0.6"
      strokeWidth="1.97286"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3.94536 5.91807C5.03486 5.91807 5.91807 5.03486 5.91807 3.94536C5.91807 2.85587 5.03486 1.97266 3.94536 1.97266C2.85587 1.97266 1.97266 2.85587 1.97266 3.94536C1.97266 5.03486 2.85587 5.91807 3.94536 5.91807Z"
      stroke="white"
      strokeOpacity="0.6"
      strokeWidth="1.97286"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const FooterData = [
  {
    id: 1,
    title: "Our Menu",
    listing: [
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
      },
    ]
  },
  {
    id: 2,
    title: "Other Links",
    listing: [
      {
        pagename: "Privacy Policy",
        pagelink: "/privacy-policy"
      },
      {
        pagename: "Terms and Conditions",
        pagelink: "/terms-and-conditions"
      },

    ]
  }
];
const Footer = () => {

  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = index => {
    setOpenIndex(openIndex === index ? null : index);
  };
  return (
    <footer className="bg-black md:pt-14 pb-8 md:pb-14 border-t-2 gradient-border pt-10">
      <div className="inn_container">
        <div className="flex flex-col md:flex-row justify-between gap-y-2 items-center">
          <Link
            href="/"
            title="Logo"
            aria-label="Logo"
            className="flex items-center"
          >
            <Image
              src="/images/logo.webp"
              alt="logo"
              width={250}
              height={80}
              priority
              className="w-[220px] md:w-[300] h-auto"
            />
          </Link>

          <div className="links-social flex gap-4">
            <Link
              href=""
              className="rounded-full border border-[#E7000B33] bg-[#FFFFFF0D] p-2.5"
              title="instagram"
              aria-label="instagram"
            >
              {instagram}
            </Link>
            <Link
              href=""
              className="rounded-full border border-[#E7000B33] bg-[#FFFFFF0D] p-2.5"
              title="linkedine"
              aria-label="linkedine"
            >
              {linkedine}
            </Link>
            <Link
              href=""
              className="rounded-full border border-[#E7000B33] bg-[#FFFFFF0D] p-2.5"
              title="email"
              aria-label="email"
            >
              {emailicon}
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 pt-3 md:pt-12 lg:pt-14 gap-6 lg:gap-10">
          <div>
            <div className="md:ps-6 text-center md:text-start">
              <p className=" text-white text-base  xl:text-lg">
                Prorevv is a smart CRM platform designed to simplify business management. It helps users track leads, manage customers, generate invoices, and streamline daily operations.
              </p>
              <p className="mt-3 md:mt-5 text-white text-base  xl:text-lg hidden md:block">
                Built for individuals and businesses, it improves productivity, organization, and decision-making with an easy-to-use interface.
              </p>
            </div>
          </div>
          <div>
            <div className="grid md:grid-cols-2 gap-y-6 px-4">
              {FooterData.map((data, index) =>
                <div
                  key={index}
                  className="border-b border-white/20 md:border-none md:pb-3"
                >
                  <h5
                    className="text-lg md:text-xl font-medium text-white cursor-pointer flex justify-between items-center"
                    onClick={() => toggleAccordion(index)}
                  >
                    {data.title}

                    <span className="md:hidden">
                      {openIndex === index ? "−" : "+"}
                    </span>
                  </h5>

                  <div
                    className={`overflow-hidden transition-all duration-300 ${openIndex ===
                      index
                      ? "max-h-96 mt-2"
                      : "max-h-0"} md:max-h-full md:mt-3`}
                  >
                    {data.listing.map((item, inde) =>
                      <p className="w-fit pt-3" key={inde}>
                        <Link className="text-white ahover hover:underline underline-offset-4 transition-all duration-500" href={item.pagelink}>
                          {item.pagename}
                        </Link>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div>
            <NewletterForm />
            <div className="app-stores flex justify-center md:justify-start lg:justify-end md:pe-10 gap-4.5 py-[28px]">
              <Link href="/" title="app store" aria-label="app store">
                <Image
                  src="/images/app-store.png"
                  alt="app store"
                  width={150}
                  height={75}
                  priority
                />
              </Link>
              <Link href="/" title="Google play" aria-label="Google play">
                <Image
                  src="/images/google-play.png"
                  alt="Google play"
                  width={150}
                  height={75}
                  priority
                />
              </Link>
            </div>
          </div>
        </div>

        <div className="md:mt-8 lg:mt-20 flex justify-center">
          <div className="flex flex-col lg:flex-row gap-5 justify-center items-center bg-white/20 rounded-2xl w-full py-8 md:py-10 ">
            <h3 className="text-xl text-white">Need Help ?</h3>
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="flex gap-3">
                <div className="flex items-center gap-1 md:gap-3 gradient-primary px-2 md:px-7 py-2.5 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-xl">
                  <IoCall className="text-xl md:text-3xl text-white animate-pulse" />

                  <a
                    href="tel:+12399197963"
                    className="text-sm md:text-base lg:text-xl text-white relative group"
                  >
                    +1-239-919-7963

                    <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-white transition-all duration-300 group-hover:w-full"></span>
                  </a>
                </div>
                {/* <div className="flex items-center gap-1 md:gap-3 gradient-primary px-2 md:px-7 py-2.5 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-xl">
                  <MdOutlineWhatsapp className="text-xl md:text-3xl text-white animate-bounce" />

                  <a
                    href="https://wa.me/12399197963"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm md:text-base lg:text-xl text-white relative group"
                  >
                    +1-239-919-7963

                    <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-white transition-all duration-300 group-hover:w-full"></span>
                  </a>
                </div> */}
              </div>

              <div className="flex items-center gap-3 gradient-primary px-7 py-2.5 rounded-full">
                <CiMail className="text-2xl md:text-3xl text-white" />
                <a
                  href="mailto:info@ifshail.com"
                  className="hover:underline text-sm md:text-base lg:text-xl text-white"
                >
                  info@ifshail.com
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 text-center text-white text-base">
          © {new Date().getFullYear()} All rights reserved. Design By{" "}
          <a
            href="https://www.base2brand.com/"
            target="_blank"
            className="underline"
          >
            Base2brand
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
