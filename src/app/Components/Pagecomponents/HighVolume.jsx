import React from "react";
import Title from "../Uiux/Title";
import Discription from "../Uiux/Discription";
import Button from "../Uiux/Button";
import Image from "next/image";
import Link from "next/link";

const cardsData = [
  {
    id: 1,
    title: "Built for Every Business Need",
    description:
      "Designed with flexibility in mind, Prorevv supports both individuals and organizations with tools tailored to simplify daily operations and improve efficiency.",
    icon: "/icons/build.svg"
  },
  {
    id: 2,
    title: "Complete Customer & Work Order Management",
    description:
      "Easily manage customer data, track work orders, and maintain accurate records—all in one centralized platform for better control and organization.",
    icon: "/icons/Management.svg"
  },
  {
    id: 3,
    title: "Smart Job Tracking",
    description:
      "Assign, monitor, and manage jobs in real time, ensuring every task is completed efficiently with full visibility across your workflow.",
    icon: "/icons/dollar.svg"
  },
  {
    id: 4,
    title: "Invoice Creation & Reports Exporting",
    description:
      "Generate professional invoices instantly and export detailed reports to track performance, finances, and business growth with ease.",
    icon: "/icons/users.svg"
  },
  {
    id: 5,
    title: "Real-Time Workflow Visibility",
    description:
      "Stay updated with live insights into your operations, helping you make quick decisions and keep everything running smoothly.",
    icon: "/icons/Vehicle.svg"
  },
  {
    id: 6,
    title: "Team & Staff Management",
    description:
      "Create and manage your staff as managers, technicians, and their daily operations",
    icon: "/icons/graf.svg"
  }
];
export const ArrowIcon = () =>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={34}
    height={34}
    viewBox="0 0 34 34"
    fill="none"
  >
    <path
      d="M10.1066 16.9706C10.1066 16.5564 10.4424 16.2206 10.8566 16.2206L22.8774 16.2206C23.2917 16.2206 23.6274 16.5564 23.6274 16.9706C23.6274 17.3848 23.2916 17.7206 22.8774 17.7206L10.8566 17.7206C10.4424 17.7206 10.1066 17.3849 10.1066 16.9706Z"
      fill="#FFEBEB"
    />
    <path
      d="M15.9831 10.0763C16.276 9.78338 16.7509 9.78336 17.0438 10.0763L23.4078 16.4403C23.7007 16.7331 23.7007 17.208 23.4078 17.5009L17.0438 23.8649C16.7509 24.1578 16.276 24.1578 15.9831 23.8649C15.6902 23.5719 15.6902 23.0971 15.9831 22.8042L21.8168 16.9706L15.9831 11.1369C15.6902 10.844 15.6902 10.3692 15.9831 10.0763Z"
      fill="#FFEBEB"
    />
  </svg>;
const HighVolume = () => {
  return (
    <div className="pt-12 lg:pt-14 pb-12 lg:pb-14 bg-white">
      <div className="inn_container grid lg:grid-cols-2 gap-x-3 gap-y-12">
        <div className="flex items-start relative">
          <div className="lg:pt-[20%] sticky top-0 text-center lg:text-start">
            <span className="text-[#2B2B2B] text-lg uppercase font-semibold">
              About Prorevv CRM
            </span>
            <Title
              title={"Features That Drive Your Business Forward"}
              Class={"gradient-text"}
            />
            <Discription
              discription={
                "Prorevv is a specialized hail repair management CRM designed to help automotive repair businesses handle storm-driven operations with precision, speed, and complete visibility. Built by the industry experts at International Fleet Solution, Prorevv was created to solve the real challenges hail repair companies face every storm season."
              }
              Class={"text-[#2B2B2B] pt-3 lg:pt-6"}
            />

            <div className="pt-6 lg:pt-14">
              <Link
                href={'/about-us'}
              >
                <Button button_name={"Read More"} xxl={true} />
              </Link>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-3 lg:pt-12">
            {cardsData.slice(0, 3).map((data, index) =>
              <div
                className="px-5 py-4 2xl:py-8 rounded-4xl bg-[linear-gradient(0deg,rgba(28,0,1,1)_0%,rgba(64,0,3,1)_100%)] hovergradient-primary transition-all duration-300"
                key={index}
              >
                <div className="gradient-primary p-4.5 w-fit rounded-3xl">
                  <Image
                    src={data.icon}
                    alt=""
                    width={30}
                    height={30}
                    className="max-w-6 2xl:max-w-7.5"
                  />
                </div>
                <h4 className="text-xl pt-4 font-semibold text-white line-clamp-2">
                  {data.title}
                </h4>
                <p className={"text-white pt-4 text-[15px] "}>
                  {data.description}
                </p>

                {/* <div className="flex justify-end items-center pt-1">
                  <p className="text-white">Read More</p>
                  <ArrowIcon />
                </div> */}
              </div>
            )}
          </div>
          <div className="space-y-3">
            {cardsData.slice(3, cardsData.length).map((data, index) =>
              <div
                className="px-5 py-4 2xl:py-8 rounded-4xl bg-[linear-gradient(0deg,rgba(28,0,1,1)_0%,rgba(64,0,3,1)_100%)] hovergradient-primary transition-all duration-300"
                key={index}
              >
                <div className="gradient-primary p-4.5 w-fit rounded-3xl">
                  <Image
                    src={data.icon}
                    alt=""
                    width={30}
                    height={30}
                    className="max-w-6 2xl:max-w-7.5"
                  />
                </div>
                <h4 className="text-xl pt-4 font-semibold text-white line-clamp-2">
                  {data.title}
                </h4>
                <p className={"text-white pt-4 text-[15px]"}>
                  {data.description}
                </p>

                {/* <div className="flex justify-end items-center pt-1">
                  <p className="text-white">Read More</p>
                  <ArrowIcon />
                </div> */}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HighVolume;
