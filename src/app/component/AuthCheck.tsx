// components/AuthCheck.tsx

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Loading from "./loader"; 
import Swal from 'sweetalert2';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const AuthCheck = ({ children }: { children: React.ReactNode }) => {
  // Block UI only when user is clearly unauthenticated.
  // If token exists, render immediately to avoid double loaders on navigation,
  // and validate in background (redirect if invalid).
  const [isBlocking, setIsBlocking] = useState(() => {
    if (typeof window === "undefined") return true;
    const token = localStorage.getItem("token");
    const technicianId = localStorage.getItem("userID");
    return !(token && technicianId);
  });
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndStatus = async () => {
      const token = localStorage.getItem("token");
      const technicianId = localStorage.getItem("userID");
  
      if (!token || !technicianId) {
        localStorage.clear();
        setIsBlocking(true);
        router.replace("/login");
        return;
      }
  
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        };
        
        // const response = await fetch(`/api/viewTechnician?technicianId=${userId}`, {
        //   method: 'POST',
        //   headers,
        // });
        const response = await fetch(`/api/viewTechnician`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ technicianId }),
            });
        if (response.status === 400 || response.status === 401) {
          localStorage.clear();
          router.replace("/login");
          return;
        }
  
        const data = await response.json();
        const currentUser = data.technician; 
        
        // 🛑 Check account restrictions
        if (currentUser?.isApproved === 'cancel' || currentUser?.isApproved === 'reject') {
          await Swal.fire({
            icon: 'error',
            title: 'Access Revoked',
            text: ' Access revoked. Logging out...',
            customClass: {
              container: 'z-[999999]'
            }
          });
          localStorage.clear();
          router.replace("/login");
          return;
        }   
        if (!currentUser?.accountStatus) {
          await Swal.fire({
            icon: 'warning',
            title: 'Account Inactive',
            text: 'Your account is inactive. Please contact support.',
            customClass: {
              container: 'z-[999999]'
            }
          });
          localStorage.clear();
          router.replace("/login");
          return;
        }
        if (currentUser?.deletedStatus) {
          await Swal.fire({
            icon: 'warning',
            title: 'Account Deleted',
            text: 'Your account has been deleted. Please contact support.',
            customClass: {
              container: 'z-[999999]'
            }
          });
          localStorage.clear();
          router.replace("/login");
          return;
        }
  
        // ✅ Passed all checks
        setIsBlocking(false);
  
      } catch (error) {
        console.error("Error in AuthCheck:", error);
        localStorage.clear();
        setIsBlocking(true);
        router.replace("/login");
      }
    };
  
    checkAuthAndStatus();
  }, [router]);
  
  

  if (isBlocking) {
    return (
      <div className="fixed inset-0 flex justify-center items-center bg-white z-99999">
        <Loading />
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthCheck;
