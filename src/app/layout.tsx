"use client";
import { Geist, Geist_Mono } from "next/font/google";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import "./globals.css";
import Sidebar from "@/app/component/sidebar/page";
import Loading from "@/app/component/loader";
import { TechnicianProvider } from "@/app/techheaderprofile/headerprofile"; 

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
                <div className="flex">
                  <Sidebar /> {/* ✅ Sidebar bhi TechnicianProvider ke andar hai */}
                  <div className="flex-1">{children}</div>
                </div>
              </TechnicianProvider>
            ) : (
              children
            )}
          </main> 
        </div>
      </body>
    </html>
  );
}
