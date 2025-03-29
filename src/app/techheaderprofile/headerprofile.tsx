"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface Technician {
  firstName: string;
  lastName: string;
  types: string;
  image?: string;
}

interface TechnicianContextType {
  technician: Technician | null;
  setTechnician: (tech: Technician | null) => void;
  isLoading: boolean;
  updateProfileImage: (image: string) => void;
}

const TechnicianContext = createContext<TechnicianContextType | undefined>(undefined);

export const TechnicianProvider = ({ children }: { children: ReactNode }) => {
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api";

  // ✅ Fetch profile from API if local data is missing or incomplete
  const fetchTechnicianProfile = async (technicianId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const response = await fetch(`${apiUrl}/fetchTechnicianProfile?technicianId=${technicianId}`, {
        method: "GET",
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        setTechnician(data.technician);
        localStorage.setItem("technicianData", JSON.stringify(data.technician));
      }
    } catch (error) {
      console.error("Error fetching technician profile:", error);
    }
  };

  useEffect(() => {
    const cachedData = localStorage.getItem("technicianData");
    const userID = localStorage.getItem("userID");
    console.log("UserID after login:", userID); // ✅ Check if userID is stored after login
  
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      setTechnician(parsedData);
  
      if (!parsedData.image && userID) {
        console.log("Image missing, fetching profile...");
        fetchTechnicianProfile(userID);
      } else {
        setIsLoading(false);
      }
    } else if (userID) {
      console.log("No cached data, fetching profile...");
      fetchTechnicianProfile(userID);
    } else {
      setIsLoading(false);
    }
  }, []);
  
  

  useEffect(() => {
    const handleStorageChange = () => {
      const cachedData = localStorage.getItem("technicianData");
      if (cachedData) {
        setTechnician(JSON.parse(cachedData));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // ✅ Update profile image & sync with localStorage
  const updateProfileImage = (image: string) => {
    if (technician) {
      const updatedTechnician = { ...technician, image };
      setTechnician(updatedTechnician);
      localStorage.setItem("technicianData", JSON.stringify(updatedTechnician));
    }
  };

  return (
    <TechnicianContext.Provider
      value={{
        technician,
        setTechnician,
        isLoading,
        updateProfileImage,
      }}
    >
      {children}
    </TechnicianContext.Provider>
  );
};

export const useTechnician = () => {
  const context = useContext(TechnicianContext);
  if (!context) {
    throw new Error("useTechnician must be used within a TechnicianProvider");
  }
  return context;
};
