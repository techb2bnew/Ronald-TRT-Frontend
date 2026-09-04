'use client'
import React, { useState } from "react";
import Title from "./Title";
import Discription from "./Discription";
import Button from "./Button";
import PopupForm from "./PopupForm";

const BannerCenter = ({ title, description, btn_name, bg_poster,onscroll,top_bar }) => {
   const [isContactOpen, setIsContactOpen] = useState(false);
  return (
    <div
     style={{backgroundImage : `url(${bg_poster})`}}
      className={`pt-[140px] md:pt-[130px] lg:pt-[140px] xl:pt-[170px] 2xl:pt-[186px] pb-12 md:pb-20 bg-center bg-cover bg-no-repeat`}
    >
      <div className="inn_container  gap-y-12">
        <div className="flex items-center max-w-5xl mx-auto justify-center">
          <div className="text-center">
            <div className="border-[3px] border-primary rounded-full px-5 py-2 w-fit mx-auto gradient-primary text-white mt-4 mb-4">
             {top_bar}
            </div>
            <Title ish1={true} title={title} Class={"text-white"} />

            <Discription
              discription={description}
              Class={"text-white pt-3 xl:pt-6"}
            />

            <div className="flex items-center justify-center  gap-3 pt-8 md:pt-4 xl:pt-8 2xl:pt-12">
              <Button
                button_name={btn_name}
                button_secondary={true}
                xxl={true}
                arrowicon={true}
                onClick={onscroll ? onscroll : ()=>setIsContactOpen(!isContactOpen)}
              />
            </div>
          </div>
        </div>
      </div>
      <PopupForm isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </div>
  );0
};

export default BannerCenter;
