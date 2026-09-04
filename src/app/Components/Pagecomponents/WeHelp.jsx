'use client'
import React, { useState } from "react";
import Title from "../Uiux/Title";
import { FiCalendar } from "react-icons/fi";
import { FiMessageSquare } from "react-icons/fi";
import { PiHeadphonesBold } from "react-icons/pi";
import { LuHandshake } from "react-icons/lu";
import Discription from "../Uiux/Discription";
import Button from "../Uiux/Button";
import PopupForm from "../Uiux/PopupForm";
const contactCards = [
  {
    icon: FiCalendar,
    title: "Book a Demo",
    description: "See Prorevv can streamline your repair operations.",
    btnname: "Book a Demo",
    link: "/contact-sales"
  },
  {
    icon: FiMessageSquare,
    title: "Sales Inquiry",
    description: "Questions about pricing, plans, or scaling your team?",
    btnname: "Contact Sales",
    link: "/contact-sales"
  },
  {
    icon: PiHeadphonesBold,
    title: "Customer Support",
    description: "Need help with your account or technical assistance?",
    btnname: "Get in Touch",
    link: "/support"
  },
  {
    icon: LuHandshake,
    title: "Partnerships",
    description: "Interested in collaborating with Prorevv?",
    btnname: "Inquiry",
    link: "/partnerships"
  }
];
const WeHelp = () => {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [subject, setsubject] = useState('')
  return (
    <div className="bg-white">
      <div className="inn_container py-12 md:py-14">
        <div className="text-center">
          <Title title={"How Can We Help?"} Class={"text-black"} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 md:pt-10  max-w-[650px] lg:max-w-full xl:max-w-[90%] mx-auto">
          {contactCards.map((data, index) => {
            const Icon = data.icon;
            return (
              <div
                className="md:max-w-[90%] w-full md:max-w-[315px] mx-auto p-4 xl:p-6 border-2 md:border-4 border-[#00000066] rounded-2xl"
                key={index}
              >
                <div className="gradient-primary w-fit p-3 rounded-lg">
                  <Icon className="text-[28px] text-white" />
                </div>
                <h4 className="text-xl xl:text-2xl text-black font-semibold pt-3">
                  {data.title}
                </h4>
                <Discription
                  discription={data.description}
                  Class={"text-[#2B2B2B] pt-2"}
                />

                <div className="pt-6">
                  <Button xxl={true} button_name={data.btnname} onClick={()=> {
                    setsubject(data.btnname)
                    setIsContactOpen(!isContactOpen)}   
                  } />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <PopupForm isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} setSubject={subject} />
    </div>
  );
};

export default WeHelp;
