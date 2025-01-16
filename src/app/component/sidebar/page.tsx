"use client";
import Sidebar from './sidebar';
import Header from '../header/page';
export default function Home() {
  return (
    <div className='combine__sidebar__with__header'>
        <div className='main-sidebar'>
        <Sidebar />
        </div>
        <div className='main-header'>
            <Header />
        </div>
    </div>
  );
}
