'use client'
import Image from "next/image";
import React from "react";
import Title from "../Uiux/Title";
import Discription from "../Uiux/Discription";
import CountUp from "react-countup";
const stats = [
  { id: 1, value: 30, suffix: "%+", title: "Productivity Boost", subtitle: "Faster, streamlined daily workflows" },
  { id: 2, value: 100, suffix: "%", title: "Centralized Management", subtitle: "All operations in one place" },
  { id: 3, value: 50, suffix: "%", title: " Time Saving", subtitle: " Reduce manual work instantly" },
  { id: 4, value: 99, suffix: "%", title: " Data Accuracy", subtitle: " Reliable and error-free records" }
];
function ProrevvStats() {
  return (
    <div className="md:pb-14 pt-14 bg-black">
      <div
        className=" "
        style={{ backgroundImage: `url(/images/statsbg.webp)` }}
      >
        {/* <div>
          <Image
            src={"/images/PROREVV.webp"}
            alt=""
            width={2000}
            height={500}
            className="max-w-[90%] mx-auto hidden md:block"
          />
        </div> */}

        <div className="inn_container">
          <div className="text-center">
            <span className="text-white text-lg uppercase font-semibold">
              About Prorevv
            </span>
            <Title
              title={
                "Numbers That Define Prorevv’s  <br/> <span class='gradient-text'> Performance</span>"
              }
              Class={"text-white"}
            />
            <Discription
              discription={
                "Thousands of repair companies and technicians trust Prorevv to operate more efficiently and scale with confidence."
              }
              Class={"text-white pt-3 md:pt-6 max-w-3xl mx-auto"}
            />
          </div>

          <div className="grid grid-cols-2 gap-y-3 md:grid-cols-4 pt-6 md:pt-10">
            {stats.map((data, index) =>
              <div className="text-center" key={index}>
                <h2 className="text-[40px] md:text-[50px] xl:text-[65px] 2xl:text-[80px] font-semibold leading-8 md:leading-11 xl:leading-14 2xl:leading-18 gradient-text">
                  <CountUp end={data.value} duration={2} enableScrollSpy/>
                  {data.suffix}
                </h2>

                <h5 className="text-sm md:text-lg lg:text-xl xl:text-2xl  md:font-semibold pt-3 text-white">
                  {data.title}
                </h5>
                {/* <p className="text-base lg:text-lg xl:text-xl font-medium pt-2 text-white hidden md:block">
                  {data.subtitle}
                </p> */}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProrevvStats;
