"use client";
import React, { useState } from "react";
import Discription from "../Uiux/Discription";
import PopupForm from "../Uiux/PopupForm";
import Link from "next/link";

const BookDemobar = ({ onscroll }) => {
  const [isContactOpen, setIsContactOpen] = useState(false);
  return (
    <div className="bg-white py-10 md:py-12">
      <div className="inn_container grid md:grid-cols-[2fr_1fr] gap-y-6">
        <div className="text-center md:text-start">
          <h2 className="text-[28px] md:text-[32px] lg:text-[40px] leading-9 md:leading-[42px] lg:leading-[50px] font-semibold gradient-text ">
            Take a Demo and Experience Prorevv in Action
          </h2>

          <div className="pt-2 md:pt-6 space-y-2 pb-5">
            <Discription
              discription={`Discover how Prorevv simplifies business management for both individual users and organizations. Explore features like task tracking, invoicing, work order management, and real-time updates through an interactive demo. Whether you're managing your own workflow or leading a team, Prorevv adapts to your needs. `}
              Class={"text-[#1B1B1B]"}
            />
          </div>

          <p className="text-base xl:text-lg 2xl:text-xl font-semibold text-[#2B2B2B]">
            Start your journey today
          </p>
          <br />
          <span className="text-base xl:text-lg 2xl:text-xl font-semibold text-[#2B2B2B]">
            See how efficiently you can run your operations.
          </span>
        </div>

        <div className="flex items-center justify-center">
          <div className="flex flex-col items-center gap-y-3">

            <button
              className="text-base md:text-lg lg:text-[22px] px-12 py-4 gradient-primary rounded-lg cursor-pointer min-w-[230px] xl:min-w-[300px] text-white transition-all duration-300 ease-out hover:scale-105 hover:shadow-[0_0_25px_rgba(255,0,0,0.35)] active:scale-95 relative overflow-hidden group"
              onClick={() => setIsContactOpen(true)}
            >
              <span className="absolute top-0 left-[-120%] w-[40%] h-full bg-white/20 skew-x-[25deg] group-hover:left-[140%] transition-all duration-700"></span>

              <span className="relative z-10 transition-all duration-300 group-hover:tracking-wide">
                Book a Demo
              </span>
            </button>

            {onscroll ? (
              <button
                className="text-base md:text-lg lg:text-[22px] px-12 py-4 gradient-ternary rounded-lg cursor-pointer min-w-[230px] xl:min-w-[300px] text-white transition-all duration-300 ease-out hover:scale-105 hover:shadow-[0_0_25px_rgba(255,255,255,0.18)] active:scale-95 relative overflow-hidden group"
                onClick={onscroll}
              >
                <span className="absolute top-0 left-[-120%] w-[40%] h-full bg-white/20 skew-x-[25deg] group-hover:left-[140%] transition-all duration-700"></span>

                <span className="relative z-10 transition-all duration-300 group-hover:tracking-wide">
                  Get Started
                </span>
              </button>
            ) : (
              <Link href={"/contact-us"}>
                <button className="text-base md:text-lg lg:text-[22px] px-12 py-4 gradient-ternary rounded-lg cursor-pointer min-w-[230px] xl:min-w-[300px] text-white transition-all duration-300 ease-out hover:scale-105 hover:shadow-[0_0_25px_rgba(255,255,255,0.18)] active:scale-95 relative overflow-hidden group">

                  <span className="absolute top-0 left-[-120%] w-[40%] h-full bg-white/20 skew-x-[25deg] group-hover:left-[140%] transition-all duration-700"></span>

                  <span className="relative z-10 transition-all duration-300 group-hover:tracking-wide">
                    Get Started
                  </span>
                </button>
              </Link>
            )}

            <span className="text-base xl:text-lg 2xl:text-xl font-semibold text-[#2B2B2B]">
              Simple. Powerful. Built for performance.
            </span>
          </div>
        </div>
      </div>
      <PopupForm
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </div>
  );
};

export default BookDemobar;
