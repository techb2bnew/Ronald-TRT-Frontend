// components/AuthCheck.tsx

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Loading from "./loader"; 
import Swal from 'sweetalert2';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const AuthCheck = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndStatus = async () => {
      setIsLoading(true);
  
      const token = localStorage.getItem("token");
      const technicianId = localStorage.getItem("userID");
  
      if (!token || !technicianId) {
        localStorage.clear();
        router.push("/");
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
          router.push("/");
          return;
        }
  
        const data = await response.json();
        const currentUser = data.technician; 
        
        // 🛑 Check account restrictions
        if (currentUser?.isApproved === 'cancel' || currentUser?.isApproved === 'reject') {
          await Swal.fire({
            icon: 'error',
            title: 'Access Revoked',
            text: 'Technician access revoked. Logging out...',
            customClass: {
              container: 'z-[999999]'
            }
          });
          localStorage.clear();
          router.push("/");
          return;
        }   
        if (!currentUser?.accountStatus) {
          await Swal.fire({
            icon: 'warning',
            title: 'Account Inactive',
            text: 'Your technician account is inactive. Please contact support.',
            customClass: {
              container: 'z-[999999]'
            }
          });
          localStorage.clear();
          router.push("/");
          return;
        }   if (!currentUser?.deletedStatus) {
          await Swal.fire({
            icon: 'warning',
            title: 'Account Deleted',
            text: 'Your technician account has been deleted. Please contact support.',
            customClass: {
              container: 'z-[999999]'
            }
          });
          localStorage.clear();
          router.push("/");
          return;
        }
  
        // ✅ Passed all checks
        setIsLoading(false);
  
      } catch (error) {
        console.error("Error in AuthCheck:", error);
        localStorage.clear();
        router.push("/");
      }
    };
  
    checkAuthAndStatus();
  }, [router]);
  
  

  // if (isLoading) {
  //   return (
  //     <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-white z-[99999]"> 
  //       <Loading />
  //     </div>
  //   );
  // }

  return <>{children}</>;
};

export default AuthCheck;
