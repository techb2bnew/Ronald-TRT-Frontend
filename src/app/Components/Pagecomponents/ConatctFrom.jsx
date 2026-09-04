import React from "react";
import Title from "../Uiux/Title";
import From from "../Uiux/From";
import Image from "next/image";

function ConatctFrom() {
  return (
    <div className="inn_container pt-12 md:pt-14 md:pb-14 bg-black">
      <div className="text-center">
        <Title title={"Send Us a Message"} Class={"text-white"} />
      </div>
      <div className="grid lg:grid-cols-2 pt-6 md:pt-10">
        <div className="flex items-center justify-center">
          <From />
        </div>
        <div className="hidden lg:flex justify-center items-center">
          <Image
            src={"/images/laptopdashboardn.webp"}
            alt=""
            width={1000}
            height={500}
            className=""
          />
        </div>
      </div>
    </div>
  );
}

export default ConatctFrom;
