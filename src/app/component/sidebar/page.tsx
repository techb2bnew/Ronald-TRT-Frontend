"use client";
import Sidebar from './sidebar';
import Header from '../header/page';
import AuthCheck from '@/app/component/AuthCheck';

export default function Home() {
  return (
    <AuthCheck>
    <div className='combine__sidebar__with__header'>
        <div className='main-sidebar z-10 relative'>
        <Sidebar />
        </div>
        <div className='main-header fixed top-[0] w-full z-[9]'>
            <Header />
        </div>
    </div>
    </AuthCheck>
  );
}
