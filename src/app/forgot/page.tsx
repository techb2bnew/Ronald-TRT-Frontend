import Image from "next/image";
import Banner from "../../../public/forgot.png";
import Logo from "../../../public/logo.svg"; 

export default function Forgot() {
  return (
    <div className="items-center justify-items-center">
      <section className="min-h-screen w-full">
        <div className="bg-[#F7F7FD] flex items-center gap-8 w-full "> 
          <div className="w-1/2 md:block hidden  ">
            <Image src={Banner} className="" width='1000' style={{ width: '100%', height: '100vh', objectFit: 'cover' }} height='800' alt="page img" />
          </div>
          <div className="md:w-1/2" style={{ padding: '0px 5rem' }}>
            <div className="text-center mb-5 w-full">
              <Image src={Logo} className="m-auto pb-8" width='200' height='50' alt="page img" />
              <h2 className="text-2xl font-bold text-[#161616] mt-8">Forgot Your Password</h2>
              <p className="text-[#161616] mt-3">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque leo felis, volutpat in imperdiet id, vulputate ac odio.</p>
            </div>
            <form className="mt-6" action="#" method="POST">
              <div>
                <label className="block text-[#161616]">E-mail / Phone Number</label>
                <input type="email" name="" id="" placeholder="Enter your email" className="w-full px-4 py-2 rounded-lg bg-white mt-2 border border-gray-400 focus:border-black-500 focus:bg-white focus:outline-none" autoFocus required />
              </div> 

              

              <button type="submit" className="w-full block  hover:bg-black focus:bg-black text-white font-semibold rounded-lg primary-bg
                px-4 py-3 mt-6">Reset Password</button>
            </form>
               
          </div>


        </div>
      </section>
    </div>
  );
}
