import React from "react";
import { TbBrandSpeedtest } from "react-icons/tb";
import { HiOutlineLightningBolt } from "react-icons/hi";
import { LuTarget } from "react-icons/lu";
import { LuShieldCheck } from "react-icons/lu";
import { HiTrophy } from "react-icons/hi2";
import Title from "../Uiux/Title";
import Discription from "../Uiux/Discription";
const features = [
  {
    title: "Performance First",
    description: "We build tools that deliver measurable operational impact.",
    icon: TbBrandSpeedtest
  },
  {
    title: "Simplicity",
    description: "Powerful systems don't need to be complicated.",
    icon: HiOutlineLightningBolt
  },
  {
    title: "Industry Focus",
    description: "We stay committed to serving hail repair professionals only.",
    icon: LuTarget
  },
  {
    title: "Reliability",
    description: "Your business depends on stability — so does our platform.",
    icon: LuShieldCheck
  },
  {
    title: "Customer Success",
    description: "Your growth is our priority.",
    icon: HiTrophy
  }
];
const CoreValues = () => {
  return (
    <div className="inn_container py-12 md:py-14">
      <div className="text-center">
        <Title title={"What Drives Us"} Class={"text-white"} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 pt-5 md:pt-10 md:max-w-[85%] mx-auto">
        {features.map((data, index) => {
          const Icon = data.icon;
          return (
            <div key={index} className="px-5 py-4 2xl:py-8 rounded-4xl bg-[linear-gradient(0deg,rgba(28,0,1,1)_0%,rgba(64,0,3,1)_100%)]  transition-all duration-300">
              <div className="gradient-primary w-fit h-fit p-4 rounded-2xl">
                <Icon className=" text-3xl text-white" />
              </div>
              <h4 className="text-xl pt-6 font-semibold text-white">
                {data.title}
              </h4>
              <Discription
                discription={data.description}
                Class={"text-white max-w-100 pt-2"}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CoreValues;
