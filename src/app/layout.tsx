"use client";
import { Geist, Geist_Mono } from "next/font/google";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import "./globals.css";
import Sidebar from "@/app/component/sidebar/page";
import Loading from "@/app/component/loader";
import { TechnicianProvider } from "@/app/techheaderprofile/headerprofile"; 
import { SidebarProvider } from "@/app/component/SidebarContext";
import ColorSettings from "@/app/component/colorsetting"; 
import { Toaster } from 'react-hot-toast';

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
  const hideSidebarRoutes = ["/", "/login", "/signup", "/forgot"];
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
      <head>
      <link rel="icon" href="/fav.ico" sizes="any" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex">
        
          <main className="flex-1"> 
            {shouldShowSidebar ? (
              <TechnicianProvider>
                <SidebarProvider>
                <div className="flex">
                  <Sidebar /> {/* ✅ Sidebar bhi TechnicianProvider ke andar hai */}
                  <div className="flex-1">{children}</div>
                </div>
                </SidebarProvider>
              </TechnicianProvider>
            ) : (
              children
            )}
             <ColorSettings /> 
          </main> 
        </div>
        <Toaster
        position="top-center"
        toastOptions={{
          // Default options for all toasts
          duration: 5000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          // Success-specific options
          success: {
            duration: 3000,
            style: {
              background: '#4BB543', // Green color for success
              color: '#fff',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#4BB543',
            },
          },
          // Error-specific options
          error: {
            duration: 5000,
            style: {
              background: '#FF3333', // Red color for error
              color: '#fff',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#FF3333',
            },
          },
          // Loading-specific options (optional)
          loading: {
            style: {
              background: '#363636',
              color: '#fff',
            },
          },
        }}
      />
      </body>
    </html>
  );
}
