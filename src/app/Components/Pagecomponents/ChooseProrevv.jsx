"use client";
import React, { useEffect, useState } from "react";
import { RxCross1 } from "react-icons/rx";
const cardData = [
  {
    id: 1,
    lable: "User-Friendly Interface",
    classadd: "lg:left-[20%] ",
    description: 'Prorevv mobile app is designed with simplicity in mind, offering a clean layout and smooth navigation for a hassle-free user experience.'
  },
  {
    id: 2,
    lable: "Smart Dashboard Overview",
    classadd: "lg:left-[10%]",
    description: 'Get a complete snapshot of your business with an easy-to-understand dashboard that highlights key activities, updates, and performance insights in real time.'
  },
  {
    id: 3,
    lable: "Effortless Navigation",
    classadd: " ",
    description: 'Quickly access customers, jobs, invoices, and reports with a well-structured interface that reduces complexity and saves time on daily operations.'
  },
  {
    id: 4,
    lable: "Powerful Admin Control",
    classadd: " lg:right-[20%]",
    description: 'Manage users, assign roles, monitor activities, and control operations efficiently with a robust yet easy-to-use mobile admin panel.'
  },
  {
    id: 5,
    lable: "Real-Time Updates & Sync",
    classadd: "lg:right-[10%] ",
    description: 'Stay updated with instant notifications and live data synchronization, ensuring you always have the latest information at your fingertips.'
  },
  {
    id: 6,
    lable: "Smooth Performance & Accessibility",
    classadd: " ",
    description: 'Enjoy fast loading, responsive design, and reliable performance across devices, making business management effortless anytime, anywhere.'
  }
];
export const ArrowIcon = () =>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={34}
    height={34}
    viewBox="0 0 34 34"
    fill="none"
  >
    <path
      d="M10.1066 16.9706C10.1066 16.5564 10.4424 16.2206 10.8566 16.2206L22.8774 16.2206C23.2917 16.2206 23.6274 16.5564 23.6274 16.9706C23.6274 17.3848 23.2916 17.7206 22.8774 17.7206L10.8566 17.7206C10.4424 17.7206 10.1066 17.3849 10.1066 16.9706Z"
      fill="#FFEBEB"
    />
    <path
      d="M15.9831 10.0763C16.276 9.78338 16.7509 9.78336 17.0438 10.0763L23.4078 16.4403C23.7007 16.7331 23.7007 17.208 23.4078 17.5009L17.0438 23.8649C16.7509 24.1578 16.276 24.1578 15.9831 23.8649C15.6902 23.5719 15.6902 23.0971 15.9831 22.8042L21.8168 16.9706L15.9831 11.1369C15.6902 10.844 15.6902 10.3692 15.9831 10.0763Z"
      fill="#FFEBEB"
    />
  </svg>;
const ChooseProrevv = () => {
  const [activeTab, setactiveTab] = useState(1);
  const [currentbgimg, setcurrentbgimg] = useState("");
  const [showpopup, setshowpopup] = useState(false)
  const activedata = cardData.find((e) => e.id === activeTab)
  useEffect(
    () => {
      if (window.innerWidth > 768) {
        const img =
          activeTab === 1
            ? "/images/performanceposter1.webp"
            : activeTab === 2
              ? "/images/performanceposter2.webp"
              : activeTab === 3
                ? "/images/performanceposter3.webp"
                : activeTab === 4
                  ? "/images/performanceposter4.webp"
                  : activeTab === 5 ? "/images/performanceposter5.webp" : null;

        setcurrentbgimg(img);
      } else {
        setcurrentbgimg("");
      }
    },
    [activeTab]
  );
  useEffect(() => {
    if (showpopup) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showpopup]);
  return (
    <div className="bg-black relative">
      <h2 className="pt-12 md:pt-14 px-2 text-center gradient-text text-[28px] md:text-[38px] lg:text-[46px] xl:text-[60px] 2xl:text-[75px]   leading-9 md:leading-12 lg:leading-14 xl:leading-17.5 2xl:leading-21.25 font-semibold">
        Experience Seamless Business
        <br className="hidden md:block" />
        Management on Mobile App
      </h2>
      <div
        style={{ backgroundImage: `url(${currentbgimg})` }}
        className={`bg-center bg-contain relative bg-no-repeat pt-8 lg:pt-16 pb-14`}
      >
        <div className=" inn_container grid md:grid-cols-2">
          <div className="space-y-8 lg:space-y-20">
            {cardData.slice(0, 3).map((data, index) =>
              <div
                key={index}
                className={`relative p-5 flex flex-col justify-between md:min-h-[142px] md:max-w-[360px]  duration-300 rounded-[25px] border-2 border-[#ffffff7e] bg-[linear-gradient(90deg,rgba(52,52,52,1)_35%,rgba(76,70,70,1)_100%)] hovergradient-primary group ${data.classadd}`}
              >
                <div className="flex items-start justify-between">
                  <h5
                    className="text-lg text-white font-medium"
                    dangerouslySetInnerHTML={{ __html: data.lable }}
                  />

                  <div className="w-fit p-2 gradient-primary rounded-full rotate-330 group-hover:rotate-360 duration-300">
                    <ArrowIcon />
                  </div>
                </div>

                <p className="text-sm underline underline-offset-4 text-white w-fit cursor-pointer"
                  onClick={() => {
                    setshowpopup(true)
                    setactiveTab(data.id)
                  }}>
                  Read More
                </p>
              </div>
            )}
          </div>
          <div className="space-y-8 lg:space-y-20 flex flex-col items-end pt-8 md:pt-0">
            {cardData.slice(3, cardData.length).map((data, index) =>
              <div
                key={index}
                className={`relative p-5 w-full flex flex-col justify-between min-h-[142px] md:max-w-[360px]  duration-300 rounded-[25px] border-2 border-[#ffffff7e] bg-[linear-gradient(90deg,rgba(52,52,52,1)_35%,rgba(76,70,70,1)_100%)] hovergradient-primary group ${data.classadd}`}
              >
                <div className="flex items-start justify-between">
                  <h5
                    className="text-lg text-white font-medium"
                    dangerouslySetInnerHTML={{ __html: data.lable }}
                  />

                  <div className="w-fit p-2 gradient-primary rounded-full rotate-330 group-hover:rotate-360 duration-300">
                    <ArrowIcon />
                  </div>
                </div>

                <p className="text-sm underline underline-offset-4 text-white w-fit cursor-pointer"
                  onClick={() => {
                    setshowpopup(true)
                    setactiveTab(data.id)
                  }}
                >
                  Read More
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between max-w-[90%] mx-auto inn_container">
          <div className="mt-8 lg:mt-14">
            <h5 className="text-[22px] font-medium text-white">
              Smooth Performance & <br /> Accessibility
            </h5>
            <p className="text-base text-[#9F9FA9] family-primary font-light pt-3">
              Designed by experienced professionals who <br /> understand real
              business challenges, ensuring <br /> practical, efficient, and
              reliable workflow<br />
              management solutions.
            </p>
          </div>
          <div className="mt-8 lg:mt-14 text-end">
            <h5 className="text-[22px] font-medium text-white">
              For Individuals & <br /> Organizations
            </h5>
            <p className="text-base text-[#9F9FA9] family-primary font-light pt-3">
              Designed for freelancers, professionals, and <br /> businesses to manage
              tasks, teams, <br /> invoices, work orders, and operations <br /> efficiently from
              one platform.
            </p>
          </div>
        </div>
      </div>
      {
        showpopup &&
        <div className="w-screen h-screen fixed flex justify-center items-center top-0 bg-[#0000008a]">
          <div className="relative max-w-[90%] mx-auto md:max-w-full">
            <div className=" absolute -right-2 -top-2 bg-white p-2 rounded-full cursor-pointer" onClick={() => setshowpopup(false)}>
              <RxCross1 className="text-3xl text-black" />
            </div>
            <div className="text-white text-xl md:text-2xl max-w-150 text-center leading-7 md:leading-9 gradient-primary px-4 md:px-10 py-6 md:py-10 rounded-2xl">
              {activedata.description}
            </div>
          </div>
        </div>
      }


    </div>
  );
};

export default ChooseProrevv;
