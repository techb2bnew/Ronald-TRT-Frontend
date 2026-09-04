import Header from "../Components/Uiux/Header";
import Footer from "../Components/Uiux/Footer";

export const metadata = {
  title: 'Prorevv CRM | Smart Business Management Software',
  description: 'Prorevv CRM helps manage customers, invoices, orders, and workflows in one place to improve efficiency and productivity.'
};

export default function MarketingLayout({ children }) {
  return (
    <>
      <div className="absolute w-full">
        <Header />
      </div>
      {children}
      <Footer />
    </>
  );
}
