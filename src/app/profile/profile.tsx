"use client";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import user from "../../../public/user.png";
import Edit from "../../../public/upload.png";
import { useTechnician } from "@/app/techheaderprofile/headerprofile";

export default function ProfileCard() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [technician, setTechnician] = useState<any>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    address: "",
    city: "",
    country: "",
    zipCode: "",
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
  const { updateProfileImage } = useTechnician();
  const { updateTechnicianProfile } = useTechnician();

  // ✅ Fetch Technician Data
  const fetchTechnicianData = async (technicianId: string) => {
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${apiUrl}/fetchTechnicianProfile?technicianId=${technicianId}`,
        {
          method: "GET",
          headers,
        }
      );

      const data = await response.json();
      if (response.ok) {
        setTechnician(data.technician);
        setFormData({
          firstName: data.technician.firstName,
          lastName: data.technician.lastName,
          phoneNumber: data.technician.phoneNumber,
          address: data.technician.address || "",
          city: data.technician.city || "",
          country: data.technician.country || "",
          zipCode: data.technician.zipCode || "",
        });
      } else {
        toast.error(data.error || "Error fetching technician data");
      }
    } catch (error) {
      toast.error("An error occurred while fetching technician data");
    }
  };

  // ✅ Fetch Technician on Load
  useEffect(() => {
    const userID = localStorage.getItem("userID");
    if (userID) {
      fetchTechnicianData(userID);
    }
  }, []);

  // ✅ Handle Form Change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  // ✅ Handle Profile Update
  const handleProfileUpdate = async () => {
    const token = localStorage.getItem("token");
    const technicianId = localStorage.getItem("userID");
    if (!technicianId) {
      toast.error("Technician ID not found!");
      return;
    }
    const { firstName, lastName, phoneNumber, address, city, country, zipCode } = formData;
    if (!firstName || !lastName || !phoneNumber || !address || !city || !country || !zipCode) {
      toast.error("Please fill in all required fields.");
      return;
    }
    // ✅ Create FormData
    const formDataPayload = new FormData();
    formDataPayload.append("technicianId", technicianId);
    formDataPayload.append("firstName", formData.firstName);
    formDataPayload.append("lastName", formData.lastName);
    formDataPayload.append("phoneNumber", formData.phoneNumber);
    formDataPayload.append("address", formData.address);
    formDataPayload.append("city", formData.city);
    formDataPayload.append("country", formData.country);
    formDataPayload.append("zipCode", formData.zipCode);

    // ✅ Add image if selected
    if (selectedImage) {
      const response = await fetch(selectedImage);
      const blob = await response.blob();
      const fileName = `profile_${technicianId}.jpg`; // Custom file name
      const file = new File([blob], fileName, { type: "image/jpeg" });
      formDataPayload.append("image", file);
    }

    try {
      const response = await fetch(`${apiUrl}/updateTechnicianProfile`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataPayload, // ✅ Send FormData
      });

      const result = await response.json();
      updateTechnicianProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      
      if (!response.ok) throw new Error(result.error || "Failed to update profile");

      toast.success("Profile updated successfully!");
      fetchTechnicianData(technicianId);
      setIsEditing(false); // ✅ Edit ko band kar diya
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Error updating profile!");
    }
  };


  // ✅ Handle Image Change
  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const compressedFile = await compressImage(file, 800, 800, 0.7);
      setSelectedImage(URL.createObjectURL(compressedFile));
      setPreviewUrl(URL.createObjectURL(compressedFile));
      handleUpload(compressedFile);
    } catch (error) {
      console.error("Compression error:", error);
    }
  };

  // ✅ Image Compression
  const compressImage = (
    file: File,
    maxWidth: number,
    maxHeight: number,
    quality: number
  ) => {
    return new Promise<File>((resolve, reject) => {
      const image = new window.Image();
      image.src = URL.createObjectURL(file);

      image.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Canvas 2D context is not supported."));
          return;
        }

        let width = image.width;
        let height = image.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(image, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error("Compression failed"));
            }
          },
          "image/jpeg",
          quality
        );
      };

      image.onerror = () => reject(new Error("Image loading error"));
    });
  };

  // ✅ Handle Image Upload
  const handleUpload = async (file: File) => {
    if (!file) {
      alert("Please select an image first!");
      return;
    }

    if (!technician) {
      alert("Technician data is missing!");
      return;
    }

    const token = localStorage.getItem("token");
    const technicianId = localStorage.getItem("userID");
    if (!technicianId) {
      alert("Technician ID not found!");
      return;
    }

    // ✅ Create FormData object
    const formData = new FormData();
    formData.append("technicianId", technicianId);
    formData.append("image", file);
    formData.append("firstName", technician.firstName);
    formData.append("lastName", technician.lastName);
    formData.append("email", technician.email);
    formData.append("phoneNumber", technician.phoneNumber);
    formData.append("userRole", technician.types);
    formData.append("country", technician.country);
    formData.append("city", technician.city);
    formData.append("zipCode", technician.zipCode);

    try {
      const response = await fetch(`${apiUrl}/updateTechnicianProfile`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to update profile");

      toast.success("Profile updated successfully!");

      if (result.technician?.image) {
        updateProfileImage(result.technician.image); // ✅ Update header image dynamically
        localStorage.setItem("technicianData", JSON.stringify(result.technician));
        fetchTechnicianData(technicianId);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Error updating profile!");
    }
  };

  return (
    <div className="rounded-lg p-6 mx-auto">
      <ToastContainer position="top-center" autoClose={5000} hideProgressBar={false} />
      <div className="flex items-center space-x-4 bg-white shadow-lg p-6 profile__bg">
        <div className="relative h-[80px] w-[80px]">
          {technician && technician.image ? (
            <img
              src={technician.image}
              alt="Profile image"
              className="rounded-full object-cover h-[80px] w-[80px] border-[2px] border-white"
            />
          ) : (
            <Image
              src={user}
              alt="Default profile image"
              layout="fill"
              className="rounded-full"
            />
          )}

          <div
            className="edit_img absolute bottom-0 right-0 cursor-pointer"
            onClick={() => document.getElementById("fileInput")?.click()}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="fileInput"
            />
            <Image alt="edit" src={Edit} className="w-[14px]" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">
            {technician ? `${technician.firstName} ${technician.lastName}` : "User"}
          </h2>
          <p className="text-gray-700 text-white">{technician?.types}</p>
          <p className="text-gray-700 text-white">{technician?.address}</p>
        </div>
      </div>

      {/* ✅ Personal Info Section */}
      <div className="mt-8 bg-white shadow-lg p-6 rounded-lg">
        <div className="flex justify-between">
          <h3 className="font-semibold text-lg">Personal Information</h3>

          <button
            onClick={() => setIsEditing(true)}
            className=" primary-bg px-4 py-2 rounded-lg"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
            </svg>

          </button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <label className="text-gray-600">First Name *</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={`text-sm border rounded p-2 w-full ${!isEditing ? "bg-gray-200 cursor-not-allowed" : ""
                }`}
                required
            />
          </div>
          <div>
            <label className="text-gray-600">Last Name *</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={`text-sm border rounded p-2 w-full ${!isEditing ? "bg-gray-200 cursor-not-allowed" : ""
                }`}
                required
            />
          </div>
          <div>
            <label className="text-gray-600">Phone Number *</label>
            <input
              type="text"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={`text-sm border rounded p-2 w-full ${!isEditing ? "bg-gray-200 cursor-not-allowed" : ""
                }`}
                required
            />
          </div>

        </div>
      </div>
      <div className="mt-8 bg-white shadow-lg p-6 rounded-lg">
        <h3 className="font-semibold text-lg">Address</h3>
        <div className="mt-4 grid grid-cols-3 gap-4">
        <div>
            <label className="text-gray-600">Country *</label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={`text-sm border rounded p-2 w-full ${!isEditing ? "bg-gray-200 cursor-not-allowed" : ""
                }`}
                required
            />
          </div>
          <div>
            <label className="text-gray-600">City *</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={`text-sm border rounded p-2 w-full ${!isEditing ? "bg-gray-200 cursor-not-allowed" : ""
                }`}
                required
            />
          </div>
         
          <div>
            <label className="text-gray-600">Zip Code *</label>
            <input
              type="text"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={`text-sm border rounded p-2 w-full ${!isEditing ? "bg-gray-200 cursor-not-allowed" : ""
                }`}
                required
            />
          </div>
        </div>
      </div>
      {/* ✅ Edit & Save Button */}
      {isEditing && (
        <button
          onClick={handleProfileUpdate}
          className="mt-4 primary-bg px-4 py-2 rounded-lg"
        >
          Save Profile
        </button>
      )}
       
    </div>
  );
}
