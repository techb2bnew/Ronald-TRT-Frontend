import React from "react";
import Title from "../Uiux/Title";
import Discription from "../Uiux/Discription";
import Image from "next/image";

const awarddata = [
  "/images/Awards1.webp",
  "/images/Awards2.webp",
  "/images/Awards3.webp",
  "/images/Awards4.webp",
  "/images/Awards5.webp",
  "/images/Awards6.webp",
  // "/images/Awards7.webp"
];
const Awards = () => {
  return (
    <div className="bg-white py-12 lg:py-14">
      <div className="inn_container">
        <div className="text-center">
          <Title title={"Trusted by Leading Businesses"} Class={"gradient-text"} />

          <Discription
            discription={
              "From growing startups to established enterprises, businesses trust Prorevv to streamline operations, improve efficiency, and manage workflows with complete confidence."
            }
            Class={"text-[#333333] max-w-4xl mx-auto pt-3"}
          />
        </div>

        <div className="pt-8 lg:pt-12 grid grid-cols-3 md:grid-cols-6 gap-y-6">
          {awarddata.map((data, index) =>
            <div key={index}>
              <Image
                src={data}
                alt=""
                width={200}
                height={146}
                className="w-auto mx-auto"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Awards;
