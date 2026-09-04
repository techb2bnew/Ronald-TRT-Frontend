import React from "react";
import Title from "../Uiux/Title";
import { IoCheckmarkSharp } from "react-icons/io5";
const data = [
  {
    id: "generic",
    title: "Generic Software",
    features: [
      { status: "❌", text: "Built for general auto shops" },
      { status: "❌", text: "Overloaded with irrelevant features" },
      { status: "❌", text: "Poor technician workflow management" },
      { status: "❌", text: "Weak invoice tracking" },
      { status: "❌", text: "Limited operational visibility" }
    ]
  },
  {
    id: "prorevv",
    title: "Prorevv",
    features: [
      { status: "✅", text: "Built exclusively for hail repair" },
      { status: "✅", text: "Streamlined job & technician assignment" },
      { status: "✅", text: "Real-time invoice & payment tracking" },
      { status: "✅", text: "Clean operational dashboard" },
      { status: "✅", text: "Scalable for growing teams" }
    ]
  }
];
const Advantage = () => {
  return (
    <div className="bg-black py-12 md:py-14">
      <div className="inn_container">
        <div className="text-center">
          <Title title={"The Prorevv Advantage"} Class={"text-white"} />
        </div>

        <div className="pt-7 md:pt-10 grid md:grid-cols-2 gap-8 max-w-7xl mx-auto">
          <div>
            <div className="p-4 md:p-8 rounded-2xl border-2 border-white/30 h-full">
              <h4 className="text-[#99A1AF] text-2xl font-bold">
                Generic Software
              </h4>
              <div className="pt-6 space-y-4 md:space-y-8">
                {data[0].features.map((data, index) =>
                  <div
                    className="text-lg md:text-xl text-[#99A1AF] flex items-center gap-2"
                    key={index}
                  >
                    <div>❌</div>
                    {data.text}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div>
            <div className="p-4 md:p-8 rounded-2xl gradient-primary h-full w-fit">
              <h4 className="text-white text-3xl font-bold">Prorevv</h4>
              <div className="pt-6 space-y-4 md:space-y-8">
                {data[1].features.map((data, index) =>
                  <div
                    className="text-xl md:text-2xl text-white flex items-center gap-2"
                    key={index}
                  >
                    <div>
                      <IoCheckmarkSharp className="text-green-600 text-2xl md:text-3xl font-semibold" />
                    </div>
                    {data.text}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Advantage;
