// ✅ Add `localStorage` sync logic in TechnicianProvider

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
  updateProfileImage: (image: string) => void; // ✅ Add function to update image
}

const TechnicianContext = createContext<TechnicianContextType | undefined>(
  undefined
);

export const TechnicianProvider = ({ children }: { children: ReactNode }) => {
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // ✅ Fetch Technician from API or localStorage
  useEffect(() => {
    const cachedData = localStorage.getItem("technicianData");
    if (cachedData) {
      setTechnician(JSON.parse(cachedData));
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
        updateProfileImage, // ✅ Pass the function
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
