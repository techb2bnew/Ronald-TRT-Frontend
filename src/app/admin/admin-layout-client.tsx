"use client";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import "./globals.css";
import Sidebar from "@/app/component/sidebar/sidebar-shell";
import Loading from "@/app/component/loader";
import { TechnicianProvider } from "@/app/admin/techheaderprofile/headerprofile";
import { SidebarProvider } from "@/app/component/SidebarContext";
import ColorSettings from "@/app/component/colorsetting";
import { Toaster } from 'react-hot-toast';

export default function AdminLayoutClient({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname() ?? '';

  // ✅ Check exact match or start with "/admin/reset-password/"
  const hideSidebarRoutes = ["/admin", "/admin/login", "/admin/signup", "/admin/forgot"];
  const shouldShowSidebar =
    !hideSidebarRoutes.includes(pathname) && !pathname.startsWith("/admin/reset-password");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 100);

    return () => clearTimeout(timer); // ✅ Cleanup
  }, []);

  return (
    <div className=" ">
      <main className=" ">
        {shouldShowSidebar ? (
          <TechnicianProvider>
            <SidebarProvider>
              <div className=" ">
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
      <Toaster
        position="top-center"
        toastOptions={{
          // Default options for all toasts
          duration: 2000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          // Success-specific options
          success: {
            duration: 2000,
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
    </div>
  );
}
