// components/AuthCheck.tsx

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // For Next.js routing
import Loading from "./loader";

const AuthCheck = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token"); // Check token in localStorage

    if (!token) {
      // If no token, redirect to login page and show loading
      setIsLoading(true);
      router.push("/");
    } else {
      // If token is found, stop loading
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    // Show a full-page loader
    return (
      <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-[#fff] z-50"> 
      <Loading />
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthCheck;
