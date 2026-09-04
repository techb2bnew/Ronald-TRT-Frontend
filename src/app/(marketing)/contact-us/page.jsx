'use client'
import React, { useRef } from 'react';
import BannerCenter from '../../Components/Uiux/BannerCenter';
import WeHelp from '../../Components/Pagecomponents/WeHelp';
import ConatctFrom from '../../Components/Pagecomponents/ConatctFrom';
import Testimonial from '../../Components/Pagecomponents/Testimonial';
import BookDemobar from '../../Components/Pagecomponents/BookDemobar';

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
function page() {
  const scrollRef = useRef(null);

  const handleScroll = () => {
    scrollRef?.current?.scrollIntoView({
      behavior: "smooth",
      top: 0,
    });
  };
  return (
    <div>
      <BannerCenter
        top_bar={' Get in Touch '}
        title={'Let’s Talk About Your Repair Operations'}
        description={'Whether you’re exploring Prorevv, booking a demo, or need support — our team is here to help.'}
        btn_name={'Get a Demo'}
        bg_poster={'/images/carbgposter.webp'}
        onscroll={handleScroll}
      />
      <WeHelp />
      <div ref={scrollRef}>
        <ConatctFrom />
      </div>
      <Testimonial testinomialData={testinomialData} title={'What People Say about <br/> Prorevv CRM?'} />
      <BookDemobar onscroll={handleScroll}/>

    </div>
  )
}

export default page
