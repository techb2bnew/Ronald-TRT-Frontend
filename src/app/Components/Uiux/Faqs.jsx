"use client";
import React, { useState } from "react";
import Title from "./Title";
import { IoIosArrowUp } from "react-icons/io";
import Image from "next/image";
const faq = [
  {
    id: 1,
    question: "What is Prorevv CRM used for?",
    description:
      "Prorevv CRM is used to manage customers, track leads, handle invoices, and streamline business operations in one platform."
  },
  {
    id: 2,
    question: "Who can use Prorevv CRM?",
    description:
      "It is designed for freelancers, service providers, startups, agencies, and growing businesses of all sizes."
  },
  {
    id: 3,
    question: "Can I manage invoices in Prorevv CRM?",
    description:
      "Yes, it allows you to create, send, and track invoices easily from a single dashboard."
  },
  // {
  //   id: 4,
  //   question: "Does Prorevv CRM help with lead tracking?",
  //   description:
  //     "Yes, it helps you capture, organize, and follow up with leads to improve conversions."
  // },
  {
    id: 5,
    question: "Is Prorevv CRM suitable for small businesses?",
    description:
      "Absolutely, it is simple, scalable, and ideal for small businesses and independent professionals."
  },
  {
    id: 6,
    question: "Can I track work orders and customers in Prorevv CRM?",
    description:
      "Yes, you can track customer details, work order status, and activity history in real time."
  },
  {
    id: 7,
    question: "Is Prorevv CRM easy to use for beginners?",
    description:
      "Yes, it has a user-friendly interface designed for easy navigation and quick setup."
  },
  {
    id: 8,
    question: "Can multiple users access Prorevv CRM?",
    description:
      "Yes, teams can collaborate by accessing shared data based on assigned roles and permissions."
  },
  {
    id: 9,
    question: "Is Prorevv CRM cloud-based?",
    description:
      "Yes, it is cloud-based, so you can access your data anytime and anywhere securely."
  }
];

const Faqs = () => {
  const [openId, setOpenId] = useState(null);

  const toggleFaq = id => {
    setOpenId(openId === id ? null : id);
  };
  return (
    <div
      className="bg-center bg-black bg-cover bg-fixed"
      // style={{ backgroundImage: `url(/images/faqposter.webp)` }}
    >
      <div className="inn_container py-12 md:py-14 grid lg:grid-cols-2">
        <div>
          <div>
            <h5 className="text-white text-2xl md:text-4xl font-semibold">(FAQs)</h5>
            <Title
              title={"Frequently Asked Questions "}
              Class={"text-white pt-3"}
            />
          </div>

          <div className="lg:mt-6 space-y-3 md:space-y-4 pt-3 md:pt-6">
            {faq.map(item =>
              <div
                key={item.id}
                className="border-b border-white/20 pb-4 cursor-pointer"
                onClick={() => toggleFaq(item.id)}
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-lg xl:text-[20px] md:font-semibold text-white">
                    {item.question}
                  </h3>

                  <span className="text-white text-xl">
                    <IoIosArrowUp className={`${openId === item.id ? 'rotate-360' : 'rotate-180'} duration-500 transition-all`}/>
                  </span>
                </div>

                <p
                  className={`text-[16px] ps-4 text-[#AEAEAE] mt-3 leading-relaxed duration-500  transition-all ${openId ===
                  item.id
                    ? "max-h-200"
                    : "max-h-0 overflow-hidden"}`}
                >
                  {item.description}
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="hidden md:flex items-center justify-center">
          <Image src="/images/faqposter.webp" alt="faqposter" width={1000} height={500} className="rounded-2xl"/>
        </div>
      </div>
    </div>
  );
};

export default Faqs;
