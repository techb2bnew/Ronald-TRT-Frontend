import Image from "next/image";
import React from "react";
import Title from "../Uiux/Title";
import Discription from "../Uiux/Discription";
import Button from "../Uiux/Button";
import Link from "next/link";


const barItems = [
  { id: 1, label: "Customer Management" },
  { id: 2, label: "Job Tracking" },
  { id: 3, label: "Field Technicians" },
  { id: 4, label: "Vehicle Orders" },
  { id: 5, label: "Staff Operations" }
];

export const BannerBar = () => {

  return (
    <div className="inn_container">
      <div className="py-4 xl:py-7 2xl:py-10 px-14 gradient-primary rounded-2xl flex flex-wrap justify-center gap-x-3 gap-y-2 md:justify-between inn_container">
        {barItems.map((data, index) => (
          <div className="text-sm md:text-lg lg:text-xl 2xl:text-[21px] text-white" key={index}>
            {data.label}
          </div>
        ))}
      </div>
    </div>
  )
}

const Purpose = () => {
  return (
    <div className="relative">
      <div className="absolute w-full -top-10 md:-top-8 xl:-top-12.75 2xl:-top-14 hidden md:block">
        <BannerBar />
      </div>
      <div className="pt-12 md:pt-16 lg:pt-20 pb-10 md:pb-12 bg-white">
        <div className="inn_container grid md:grid-cols-2">
          <div className="flex items-center">
            <div className="text-center md:text-start">
              <span className="text-[#2B2B2B] text-lg uppercase font-semibold">
                About Prorevv
              </span>
              <Title
                title={"One CRM, Endless <br/> Possibilities"}
                Class={"gradient-text"}
              />
              <Discription
                discription={
                  "Whether you're a solo professional or a growing organization, Prorevv adapts to your workflow. Manage tasks, monitor performance, track work orders, create invoices, export reports, and streamline communication—all from a single, easy-to-use system built to scale with your business, improve collaboration, automate processes, enhance visibility, and drive smarter, faster decision-making every day."
                }
                Class={"text-[#2B2B2B] pt-2 md:pt-6"}
              />

              <div className="pt-6 md:pt-9 2xl:pt-14">
                <Link
                  href={'/about-us'}
                >
                  <Button button_name={"Read More"} xxl={true} />
                </Link>
              </div>
            </div>
          </div>
          <div>
            <Image
              src={"/images/dashboardonmac.webp"}
              alt=""
              width={1000}
              height={500}
              className=""
            />
          </div>
        </div>
      </div>
    </div>

  );
};

export default Purpose;
