'use client'
import React from "react";
import Title from "../Uiux/Title";
import Image from "next/image";
import Discription from "../Uiux/Discription";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";


const Testimonial = ({title, testinomialData }) => {
  return (
    <div
      className="py-12 md:py-16 bg-center bg-cover"
      style={{ backgroundImage: `url(/images/statsbg.webp)` }}
    >
      <div className="inn_container">
        <div className="text-center">
          <Title
            title={title}
            Class={"text-white"}
          />
        </div>

        <div className="pt-8 md:pt-14 max-w-6xl mx-auto">
          <Swiper
            modules={[Autoplay, Pagination]}
            slidesPerView={2}
            breakpoints={{
              0: {
                slidesPerView: 1,
              },
              768: {
                slidesPerView: 2,
              },
            }}
            loop={true}
            speed={1200}
            autoplay={{
              delay: 2500,
              disableOnInteraction: false
            }}
            spaceBetween={20}
            pagination={{
              clickable: true,
              el: ".custom-pagination",
              renderBullet: function (index, className) {
                return `<span class="${className} custom-bullet"></span>`;
              }
            }}
            className="w-full"
          >
            {testinomialData.map((data, index) =>
              <SwiperSlide key={index}>
                <div className="max-w-[560px] mx-auto border-2 border-[#E7000B] hover:bg-[#E7000B40] p-4 2xl:p-6 rounded-xl duration-300 cursor-pointer">
                  <Image
                    src={"/icons/cotss.svg"}
                    alt="&quot;"
                    width={40}
                    height={40}
                  />

                  <div className="flex items-center gap-1 pt-4">
                    {[...Array(data.start)].map((_, i) =>
                      <div key={i}>
                        <Image
                          src={"/icons/start-primary.svg"}
                          alt="start"
                          width={20}
                          height={20}
                        />
                      </div>
                    )}
                  </div>

                  <Discription
                    discription={data.discription}
                    Class={
                      "text-[#D4D4D8] pt-4 min-h-[126px] 2xl:min-h-[156px] line-clamp-5"
                    }
                  />

                  <div className="pt-4">
                    <p className="text-base font-bold text-white">
                      {data.name}
                    </p>
                    {/* <span className="text-[#9F9FA9] text-sm font-normal">
                      {data.company_name}
                    </span> */}
                  </div>
                </div>
              </SwiperSlide>
            )}
          </Swiper>

          {/* Custom Pagination */}
          <div className="custom-pagination flex justify-center gap-2 mt-6 md:mt-10"></div>
        </div>
      </div>
    </div>
  );
};

export default Testimonial;