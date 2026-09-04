'use client'
import React, { useState } from "react";
import Image from "next/image";
import Title from "../Uiux/Title";
import Discription from "../Uiux/Discription";
import Button from "../Uiux/Button";

const tabs = [
  {
    id: 1,
    tabs: "Invoice"
  },
  // {
  //   id: 2,
  //   tabs: "Workflow"
  // },
  {
    id: 3,
    tabs: "Customer "
  },
  {
    id: 4,
    tabs: "Admin "
  }
];

const tabdata = [
  {
    id: 1,
    image: "/images/add_customerscreen.webp",
    title: "Invoice Generation & Work Order  Made Simple",
    discription: [
      "Create professional invoices in seconds with Prorevv and manage your billing effortlessly. Customize details, track payment status, and maintain accurate financial records without manual work.",
      "Stay on top of every work order with real-time tracking, status updates, and complete visibility from start to completion. Prorevv ensures nothing gets missed, helping you deliver faster and operate more efficiently."
    ],
    button_nrl: "/"
  },
  {
    id: 2,
    image: "/images/add_customerscreen.webp",
    title: "Task Management Made Effortless",
    discription: [
      " Assign, organize, and track daily tasks with Prorevv in a simple and structured way. Stay updated with progress, deadlines, and priorities without confusion or missed work.",
      "Keep your workflow smooth with real-time updates and clear task visibility across teams. Prorevv helps you manage operations efficiently, ensuring better productivity and faster execution of every project."
    ],
    button_nrl: "/"
  },
  {
    id: 3,
    image: "/images/add_customerscreen.webp",
    title: "Smart Customer Management System",
    discription: [
      " Store and manage all customer details in one secure place with Prorevv. Access contact information, interaction history, and service records instantly whenever needed.",
      "Build stronger relationships with better organization and faster response times. Prorevv ensures every customer is managed professionally, improving satisfaction and long-term business trust."
    ],
    button_nrl: "/"
  },
  {
    id: 4,
    image: "/images/add_customerscreen.webp",
    title: "Powerful Team & Admin Control",
    discription: [
      "Manage your entire team from a single dashboard with complete control over roles, access, and performance. Assign responsibilities and monitor activity in real time.",
      "Ensure smooth coordination between team members with transparent communication and structured workflows. Prorevv helps administrators maintain full control while improving efficiency across the organization."
    ],
    button_nrl: "/"
  }
];
const ManageTab = () => {
  const [activeTab, setactiveTab] = useState(1);

  const activedata = tabdata.find(t => t.id === activeTab);

  return (
    <div
      className="py-12 lg:py-16 bg-center bg-cover"
      style={{ backgroundImage: `url(/images/statsbg.webp)` }}
    >
      <div className="inn_container grid  lg:grid-cols-2">
        <div />
        <div className="flex gap-3 flex-wrap">
          {tabs.map(tab =>
            <button
              key={tab.id}
              onClick={() => setactiveTab(tab.id)}
              className={`relative px-3 md:px-5 xl:px-7 py-2 md:py-2.5 text-[10px] md:text-sm 2xl:text-base rounded-xl transition-all duration-300  ${activeTab ===
                tab.id
                ? "gradient-primary text-white border border-white/20"
                : "bg-black text-white border border-white/20 hover:border-white/40"}`}
            >
              {tab.tabs}
            </button>
          )}
        </div>
      </div>
      <div className="inn_container grid grid-cols-1 lg:grid-cols-2 pt-4 lg:pt-4 gap-y-6 md:gap-y-12">
        <div className="order-2 lg:order-1">
          <Image
            src={activedata.image}
            alt={activedata.title}
            width={1000}
            height={500}
            className="md:max-w-[90%] mx-auto"
          />
        </div>
        <div className="flex items-center order-1 lg:order-2">
          <div className="lg:max-w-[90%] mx-auto text-center md:text-start">
            <Title title={activedata.title} Class={"text-white"} />
            <div className="pt-3 md:pt-6 space-y-4">
              {activedata.discription.map((data, index) =>
                <p
                  key={index}
                  className={"text-[#E8E8E8] text-sm md:text-base"}
                >
                  {data}
                </p>
              )}
            </div>

            {/* <div className="pt-8 md:pt-12">
              <Button button_name={"Read More"} xxl={true} />
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageTab;
