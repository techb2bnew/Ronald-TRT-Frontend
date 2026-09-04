import React from "react";
import Title from "../Uiux/Title";
import Discription from "../Uiux/Discription";
import Button from "../Uiux/Button";

const tabshow = [
  "Spreadsheets",
  "Whiteboards",
  "Missed invoices",
  // "Disconnected communication"
];
const ProblemSolver = () => {
  return (
    <div
      className="py-12 md:py-14 bg-cover"
      style={{ backgroundImage: "url(/images/icedashboard.webp)" }}
    >
      <div className="inn_container grid lg:grid-cols-2 gap-5">
        <div className="2xl:w-[85%] text-center md:text-start">
          <div>
            <h5 className="uppercase text-lg text-black font-semibold">
              Our Story
            </h5>

            <Title
              title={"The Problem We Saw in the <span class='gradient-text'> Industry </span>"}
              Class={"text-black md:pt-4"}
            />

            <Discription
              discription={
                "The hail repair industry runs on skill — but most shops still operate on outdated systems."
              }
              Class={"text-[#2B2B2B] pt-3"}
            />

            <div className="grid grid-cols-2 pt-4 md:pt-8 gap-5">
              {tabshow.map((data, index) =>
                <Button key={index} button_name={data} xxl={true} />
              )}
            </div>

            <Discription
              discription={
                "We saw talented repair professionals losing time, money, and control simply because they lacked the right management tools."
              }
              Class={"text-[#2B2B2B] pt-4 md:pt-7"}
            />
            <Discription
              discription={
                "So we built Prorevv — a platform designed specifically for hail damage repair operations."
              }
              Class={"text-[#2B2B2B] pt-2 md:pt-3"}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemSolver;
