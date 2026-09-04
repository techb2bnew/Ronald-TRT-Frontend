
import React from "react";
import Banner from ".././Components/Pagecomponents/Banner";
import Purpose from ".././Components/Pagecomponents/Purpose";
import ChooseProrevv from ".././Components/Pagecomponents/ChooseProrevv";
import HighVolume from ".././Components/Pagecomponents/HighVolume";
import ProrevvStats from ".././Components/Pagecomponents/ProrevvStats";
// import Awards from ".././Components/Pagecomponents/Awards";
import ManageTab from ".././Components/Pagecomponents/ManageTab";
import BookDemobar from ".././Components/Pagecomponents/BookDemobar";
import Testimonial from ".././Components/Pagecomponents/Testimonial";
import Faqs from ".././Components/Uiux/Faqs";


const testinomialData = [
  {
    id: 1,
    start: 4,
    discription:
      "Prorevv CRM makes invoice creation and record keeping extremely easy. I can generate invoices quickly and keep everything well organized without confusion. It also helps me track payments, avoid delays, and maintain accurate financial records for better control.",
    name: "John Miller – New York",
    company_name: "Freelance  Consultant"
  },
  {
    id: 2,
    start: 5,
    discription:
      "We use Prorevv daily to manage job assignments and track work progress. It keeps our entire workflow smooth and well-coordinated. The system improves team communication, reduces errors, and ensures every task is completed on time without confusion.",
    name: "Emma Davis – Los Angeles",
    company_name: " Service Agency Owner"
  },
  {
    id: 3,
    start: 4,
    discription:
      "This CRM helps me manage invoices and track ongoing work efficiently. It has reduced manual effort and keeps all records in one place. I can easily monitor updates, stay organized, and ensure nothing important gets missed during daily operations.",
    name: "William Scott – Chicago",
    company_name: "Independent Advisor"
  },
  {
    id: 4,
    start: 5,
    discription:
      "Prorevv makes it easy to track service orders and manage daily jobs. I can monitor progress and handle everything without delays. It keeps my schedule organized, improves service efficiency, and helps me deliver a better experience to customers.",
    name: "Olivia Harris – Houston",
    company_name: "Car Detailing Service Owner"
  },
  {
    id: 5,
    start: 5,
    discription:
      " Managing multiple jobs and tracking their status is now simple. Prorevv keeps everything organized and easy to access anytime. I can assign work, monitor progress, and ensure all tasks are completed smoothly without unnecessary follow-ups.",
    name: "James Anderson – San Francisco",
    company_name: "Field Service Provider"
  },
  {
    id: 6,
    start: 5,
    discription:
      "I use Prorevv to manage invoices, orders, and daily operations. It keeps my work structured and saves a lot of time. The platform is simple to use, reliable, and helps me stay organized while handling multiple responsibilities efficiently.",
    name: "Sophia Johnson – Miami",
    company_name: "Small Business Owner"
  }
];

const page = () => {
  return (
    <div className="md:py-5">
      <Banner />
      <Purpose />
      <ChooseProrevv />
      <HighVolume />
      <ProrevvStats/>
      <ManageTab />
      <BookDemobar />
      <Testimonial testinomialData={testinomialData} title={'What People Say about <br/> Prorevv CRM?'} />
      <Faqs />
    </div>
  );
};

export default page;
