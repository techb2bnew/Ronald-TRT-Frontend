// components/AuthCheck.tsx

import { useEffect } from "react";
import { useRouter } from "next/navigation"; // For Next.js routing

const AuthCheck = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token"); // Check token in localStorage

    if (!token) {
      // If no token, redirect to login page
      router.push("/login");
    }
  }, [router]);

  // If token is not found, you can optionally show a loading screen until redirect happens
  return <>{children}</>;
};

export default AuthCheck;
