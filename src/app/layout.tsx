"use client";  // ✅ Client component

import { Geist, Geist_Mono } from "next/font/google";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react"; // ✅ State aur Effect import karo
import "./globals.css";
import Sidebar from "@/app/component/sidebar/page";
import Loading from "@/app/component/loader";
import { TechnicianProvider } from "@/app/techheaderprofile/headerprofile"; // ✅ Correct import

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  // ✅ Check exact match or start with "/reset-password/"
  const hideSidebarRoutes = ["/","/login", "/signup", "/forgot"];
  const shouldShowSidebar =
    !hideSidebarRoutes.includes(pathname) && !pathname.startsWith("/reset-password");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);  
    }, 100);

    return () => clearTimeout(timer); // ✅ Cleanup
  }, []);

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <TechnicianProvider>
        <div className="flex">
          {shouldShowSidebar && (  <Sidebar />)}
          <main className="flex-1">{children}</main>
        </div>
        </TechnicianProvider>
      </body>
    </html>
  );
}
