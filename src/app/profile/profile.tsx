"use client";
import Image from 'next/image'; 
import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Loading from '@/app/component/loader';
import user from '../../../public/user.png';
import Edit from '../../../public/edit.svg'

export default function ProfileCard() { 
        const [selectedImage, setSelectedImage] = useState<string | null>(null); 
        const [previewUrl, setPreviewUrl] = useState<string | null>(null);
       const [technician, setTechnician] = useState<any>(null);  // Using `any` type for flexibility
        const [isEdit, setIsEdit] = useState<boolean>(false);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
        const fetchTechnicianData = async (technicianId: string) => {
          try {
            const token = localStorage.getItem('token');
            const headers: Record<string, string> = {
              'Content-Type': 'application/json',
            };
      
            if (token) {
              headers['Authorization'] = `Bearer ${token}`;
            }
      
            const response = await fetch(`${apiUrl}/fetchTechnicianProfile?technicianId=${technicianId}`, {
              method: 'GET',
              headers,
            });
      
            const data = await response.json();
      
            if (response.ok) {  
              setTechnician(data.technician);  // Set the technician data
            } else {
              toast.error(data.error || 'Error fetching technician data');
            }
          } catch (error) {
            toast.error('An error occurred while fetching technician data');
          }
        };
        useEffect(() => {
            const userID = localStorage.getItem('userID'); 
            if (userID) {
              setIsEdit(true);  // Set to true if `technicianId` exists in the URL
              fetchTechnicianData(userID);
            } else {
              setIsEdit(false);
            }
          }, []);

        

          function compressImage(file: File, maxWidth: number, maxHeight: number, quality: number) {
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
          }
        
          const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (!file) return;
          
            try {
              const compressedFile = await compressImage(file, 800, 800, 0.7); // 🔹 Compress Image
              console.log("Original size:", file.size / 1024, "KB");
              console.log("Compressed size:", compressedFile.size / 1024, "KB");
          
              setSelectedImage(URL.createObjectURL(compressedFile)); // ✅ Convert File to URL
              setPreviewUrl(URL.createObjectURL(compressedFile)); // ✅ Fix Type Error
          
              handleUpload(compressedFile); // ✅ Send file, not base64
            } catch (error) {
              console.error("Compression error:", error);
            }
          };
          

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
            formData.append("image", file); // ✅ Send image as file, NOT base64
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
                body: formData, // ✅ Send as FormData
              });
          
              const result = await response.json();
              if (!response.ok) throw new Error(result.error || "Failed to update profile");
                const userID = localStorage.getItem('userID'); 
                if (userID) {
                  fetchTechnicianData(userID);
                }
              toast.success("Profile updated successfully!");
            } catch (error) {
              console.error("Error updating profile:", error);
              toast.error("Error updating profile!");
            }
          };
          
          
  return (
    <div className=" rounded-lg p-6  mx-auto">
      <div className="flex items-center space-x-4 bg-white shadow-lg p-6">
        <div className="relative h-[80px] w-[80px]"> 
          {technician && technician.image ? (
              <img src={technician.image} alt="Profile image"  className="rounded-full object-cover h-[80px]" />
            ) : (
              <Image src={user} alt="Default profile image" layout="fill" className="rounded-full" />
            )}

          <div className="edit_img" onClick={() => document.getElementById("fileInput")?.click()}>
          <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="fileInput" /> 
          <Image alt='edit' src={Edit} className='w-[14px]'/>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold">{technician ? `${technician.firstName} ${technician.lastName}` : 'User'}</h2>
          <p className="text-gray-700">{technician?.types}</p>
          <p className="text-gray-700">{technician?.address} {technician?.country}</p>
        </div>
      </div>
      <div className="mt-8 bg-white shadow-lg p-6 rounded-lg">
        <h3 className="font-semibold text-lg">Personal Information</h3>
        <div className="mt-4">
          <div className="grid grid-cols-6 gap-4">
            <div><p className='text-gray-600'>First Name:</p> <p>{technician?.firstName}</p></div>
            <div><p className='text-gray-600'>Last Name:</p> <p>{technician?.lastName}</p></div>
            <div><p className='text-gray-600'>Date of Birth:</p> <p>12-10-1991</p></div>
            <div><p className='text-gray-600'>Email Address:</p> <p>{technician?.email}</p></div>
            <div><p className='text-gray-600'>Phone Number:</p> <p>{technician?.phoneNumber}</p></div>
            <div><p className='text-gray-600'>User Role:</p> <p>{technician?.types}</p></div>
          </div>
        </div>
        </div>
        <div className="mt-4 bg-white shadow-lg p-6 rounded-lg">
          <h3 className="font-semibold text-lg">Address</h3>
          <div className="grid grid-cols-6 gap-4">
            <div><p className='text-gray-600'>Country:</p> <p>{technician?.country}</p></div>
            <div><p className='text-gray-600'>City:</p> <p>{technician?.city}</p></div>
            <div><p className='text-gray-600'>Zip Code:</p> <p>{technician?.zipCode}</p></div>
          </div>
        </div> 
    </div>
  );
};

 
