import React from "react";
import Title from "../Uiux/Title";
import { LuTarget } from "react-icons/lu";
import { PiLightningBold } from "react-icons/pi";
import { IoMdTrendingUp } from "react-icons/io";
import { TbBrandSpeedtest } from "react-icons/tb";
import Discription from "../Uiux/Discription";
export const featuresData = [
  {
    icon: LuTarget,
    title: "Industry-Specific Focus",
    description:
      "Designed exclusively for hail repair professionals – not generic auto shop software.",
  },
  {
    icon: PiLightningBold,
    title: "All-in-One Platform",
    description:
      "Jobs, technicians, invoices, vehicle tracking, and reporting – unified in one powerful dashboard.",
  },
  {
    icon: IoMdTrendingUp,
    title: "Built for Scale",
    description:
      "From independent technicians to multi-team repair operations, Prorevv grows with your business.",
  },
  {
    icon: TbBrandSpeedtest,
    title: "Performance-Driven Design",
    description:
      "Fast, clean, and built around real-world repair workflows.",
  },
];
const WhyProrevv = () => {
  return (
    <div className="bg-black py-12 md:py-18">
      <div className="inn_container">
        <div className="text-center">
          <Title
            title={"Purpose-Built for Hail <br/> Repair Operations"}
            Class={"text-white"}
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-5 pt-8 md:pt-12 md:max-w-[90%] mx-auto gap-y-7">
          {
            featuresData.map((data, index)=>{
             const Icon = data.icon
             return (
               <div className="grid grid-cols-[70px_2fr] lg:grid-cols-[80px_2fr] px-4 md:px-6 py-6 md:py-8 border-2 border-white/20 rounded-2xl bg-[linear-gradient(90deg,rgba(52,52,52,1)_35%,rgba(76,70,70,1)_100%)]" key={index}>
                 <div className="bg-black w-fit h-fit p-4 rounded-2xl">
                   <Icon 
                     className="text-3xl text-primary"
                   />
                 </div>

                 <div>
                    <h3 className="text-white text-xl md:text-2xl font-semibold">
                        {data.title}
                    </h3>

                    <Discription
                     discription={data.description}
                     Class={'text-[#99A1AF]'}
                     />
                 </div>
               </div>
             )
            })
          }
        </div>
      </div>
    </div>
  );
};

export default WhyProrevv;
