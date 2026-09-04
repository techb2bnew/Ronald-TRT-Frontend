'use client'
import React, { useState } from "react";
import Title from "../Uiux/Title";
import Discription from "../Uiux/Discription";
import Button from "../Uiux/Button";
import Image from "next/image";
import PopupForm from "../Uiux/PopupForm";
import Link from "next/link";

const Banner = () => {
  const [isContactOpen, setIsContactOpen] = useState(false);

  return (
    <div className="pt-[140px] md:pt-[110px] lg:pt-[120px] xl:pt-[150px] 2xl:pt-[166px] pb-12 md:pb-20 bg-[url(/images/mainbannerbg.webp)] bg-center bg-cover bg-no-repeat">
      <div className="inn_container grid md:grid-cols-2 gap-y-12">
        <div className="flex items-center">
          <div className="text-center md:text-start">
            <Title
              ish1={true}
              title={"Smarter CRM for Smarter Business Decisions"}
              Class={"text-white"}
            />

            <Discription
              discription={
                "Prorevv is a powerful CRM software and mobile app designed for businesses and individuals to manage invoices, work orders, workflows, and operations efficiently in one place."
              }
              Class={"text-white pt-3 xl:pt-6"}
            />

            <div className="flex items-center justify-center md:justify-start gap-3 pt-8 md:pt-4 xl:pt-8 2xl:pt-12">
              <Link
                href={'/contact-us'}
              >
                <Button
                  button_name={"Contact Us"}
                  xxl={true}
                />
              </Link>
              <Button
                button_name={"Get a Demo"}
                button_secondary={true}
                xxl={true}
                arrowicon={true}
                onClick={() => setIsContactOpen(true)}
              />
            </div>
            <div className="pt-8 md:pt-6 xl:pt-12 flex flex-col md:flex-row items-center gap-2 xl:gap-6">
              <div className="relative w-fit">
                <Image
                  src={"/images/bannerstatsstart.webp"}
                  alt=""
                  width={200}
                  height={36}
                  className=""
                />
                <span className="absolute right-[13%] bottom-0 md:-bottom-3 lg:bottom-0 text-[10px] lg:text-[12px] text-white">
                  10K+ Already Joined
                </span>
              </div>
              <p className="text-sm xl:text-[15px] text-white">
                4.7 out of 5 stars based on 1500+ client reviews
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <Image
            src={"/gifs/final-prorev-gif.gif"}
            alt="poster"
            width={1000}
            height={500}
            className="md:max-w-[90%] mx-auto 2xl:max-w-[100%]"
          />
          {/* <video
               src="/videos/pro-rev-vid.mp4"
               autoPlay
               loop
               muted
               playsInline
               className="md:max-w-[90%] mx-auto 2xl:max-w-[100%]"
             /> */}
        </div>
      </div>

      <PopupForm isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </div>
  );
};

export default Banner;
