"use client";
import Sidebar from './sidebar';
import Header from '../header/page';
export default function Home() {
  return (
    <div className='combine__sidebar__with__header'>
        <div className='main-sidebar z-10 relative'>
        <Sidebar />
        </div>
        <div className='main-header fixed top-[0] w-full z-[9]'>
            <Header />
        </div>
    </div>
  );
}
