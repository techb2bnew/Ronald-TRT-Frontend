"use client";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import user from "../../../public/user.png";
import Edit from "../../../public/upload.png";
import { useTechnician } from "@/app/techheaderprofile/headerprofile";
import { FormControl, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import { Country, State } from 'country-state-city';
import { ICountry, IState } from 'country-state-city';
import { SelectChangeEvent } from '@mui/material/Select';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import GooglePlacesAutocomplete from 'react-google-places-autocomplete';
import { geocodeByAddress, getLatLng } from 'react-google-places-autocomplete';
import { SingleValue, ActionMeta } from 'react-select';

interface FormData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
}

interface PlaceType {
  place_id: string;
  description: string;
  // Add other properties you might need from Google Places
}

interface AddressValue {
  label: string;
  value: PlaceType;
}

type GooglePlacesOption = {
  label: string;
  value: {
    place_id: string;
    description: string;
  };
};

type NullableGooglePlacesOption = SingleValue<GooglePlacesOption>;

export default function ProfileCard() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [technician, setTechnician] = useState<any>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [address, setAddressValue] = useState<NullableGooglePlacesOption>(null);


  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    address: "",
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
  const { updateProfileImage } = useTechnician();
  const { updateTechnicianProfile } = useTechnician();

  const handleAddressSelect = async (selectedAddress: GooglePlacesOption | AddressValue) => {
    if (!selectedAddress) return;

    setAddressValue(selectedAddress as AddressValue);

    try {
      const results = await geocodeByAddress(selectedAddress.label);
      const addressComponents = results[0].address_components;

      let street = '', city = '', state = '', country = '', zip = '';

      addressComponents.forEach(component => {
        if (component.types.includes('street_number') || component.types.includes('route')) {
          street += component.long_name + ' ';
        }
        if (component.types.includes('locality')) {
          city = component.long_name;
        }
        if (component.types.includes('administrative_area_level_1')) {
          state = component.long_name;
        }
        if (component.types.includes('country')) {
          country = component.long_name;
        }
        if (component.types.includes('postal_code')) {
          zip = component.long_name;
        }
      });

      const fullAddress = `${street.trim()}, ${city}, ${state}, ${country}, ${zip}`;
      // Update form data with the full address
      setFormData(prev => ({
        ...prev,
        address: fullAddress,  // Store combined address here
      }));

      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.address;
        delete newErrors.city;
        delete newErrors.state;
        delete newErrors.zipCode;
        return newErrors;
      });

    } catch (error) {
      console.error('Error fetching address details:', error);
      toast.error('Failed to process address details');
    }
  };

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

      const response = await fetch(`/api/fetchTechnicianProfile`, {
        method: "POST", // Change to POST
        headers,
        body: JSON.stringify({ technicianId }), // Send technicianId in the body
      });

      const data = await response.json();
      let addressParts = [];
      if (data.technician.address) {
        // Split the address string and filter out empty parts
        addressParts = data.technician.address.split(',').map((part: any) => part.trim()).filter((part: any) => part !== '');
      }

      // Construct the full address for display
      const fullAddress = addressParts.join(', ');

      if (response.ok) {
        if (fullAddress) {
          const addressValue: AddressValue = {
            label: fullAddress,
            value: {
              place_id: `existing-address-${Date.now()}`,
              description: fullAddress
            }
          };
          setAddressValue(addressValue);
        }

        setTechnician(data.technician);
        setFormData({
          firstName: data.technician.firstName,
          lastName: data.technician.lastName,
          phoneNumber: data.technician.phoneNumber,
          address: fullAddress || data.technician.address || '',
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
  // const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const { name, value } = e.target;
  //   setFormData({ ...formData, [name]: value });
  // };
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "", // Remove error for the specific field
      });
    }
  };


  const handleSelectChange = (event: SelectChangeEvent) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  // ✅ Handle Profile Update
  const handleProfileUpdate = async () => {
    const token = localStorage.getItem("token");
    const technicianId = localStorage.getItem("userID");
    if (!technicianId) {
      toast.error("Technician ID not found!");
      return;
    }
    
    // Ensure address is synced from GooglePlacesAutocomplete if formData.address is empty but address state has value
    let finalAddress = formData.address;
    if (!finalAddress?.trim() && address?.label) {
      finalAddress = address.label;
      setFormData(prev => ({ ...prev, address: address.label }));
    }
    
    const newErrors: { [key: string]: string } = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName?.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.phoneNumber?.trim()) newErrors.phoneNumber = 'Phone Number is required';
    if (!finalAddress?.trim()) newErrors.address = 'Address is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    // ✅ Create FormData
    const formDataPayload = new FormData();
    formDataPayload.append("technicianId", technicianId);
    formDataPayload.append("firstName", formData.firstName);
    formDataPayload.append("lastName", formData.lastName);
    formDataPayload.append("phoneNumber", formData.phoneNumber);
    formDataPayload.append("address", formData.address);

    // ✅ Add image if selected
    if (selectedImage) {
      const response = await fetch(selectedImage);
      const blob = await response.blob();
      const fileName = `profile_${technicianId}.jpg`; // Custom file name
      const file = new File([blob], fileName, { type: "image/jpeg" });
      formDataPayload.append("image", file);
    }

    try {
      const response = await fetch(`/api/updateTechnicianProfile`, {
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
  const getNationalNumber = (digitsOnly: string, fullNumber: string): string => {
    try {
      const parsed = parsePhoneNumberFromString(fullNumber);
      if (parsed) {
        return digitsOnly.startsWith(parsed.countryCallingCode)
          ? digitsOnly.slice(parsed.countryCallingCode.length)
          : digitsOnly;
      }
      return digitsOnly;
    } catch {
      return digitsOnly;
    }
  };
  const handlePhoneChange = (value: string | undefined) => {
    if (!value) {
      setFormData(prev => ({
        ...prev,
        phoneNumber: ''
      }));
      setErrors(prev => ({ ...prev, phoneNumber: 'Phone number is required' }));
      return;
    }

    const digitsOnly = value.replace(/\D/g, '');
    const nationalNumber = getNationalNumber(digitsOnly, value);

    // Stop if national number exceeds 10 digits
    if (nationalNumber.length > 10) {
      return;
    }

    // Set error if not exactly 10 digits
    if (nationalNumber.length !== 10) {
      setErrors(prev => ({
        ...prev,
        phoneNumber: 'Phone number must be exactly 10 digits'
      }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.phoneNumber;
        return newErrors;
      });
    }

    // Update form data
    setFormData(prev => ({
      ...prev,
      phoneNumber: value
    }));
  };



  return (
    <div className="rounded-lg p-6 mx-auto">
      <div className="flex items-center space-x-4 bg-white shadow-lg p-6 profile__bg">
        <div className="relative h-[88px] w-[88px]">
          {technician && technician.image ? (
            <img
              src={technician.image}
              alt="Profile image"
              className="rounded-full object-cover h-[85px] w-[85px] border-[2px] border-white"
            />
          ) : (
            <p className="font-[600] text-[34px] bg-[#fff] rounded-full p-[10px] w-[85px] h-[85px] text-center uppercase flex items-center justify-center">
              {technician?.firstName ? technician?.firstName[0] : 'N/A'}
            </p>
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
          <h2 className="text-xl font-semibold text-white first-letter:uppercase">
            {technician ? `${technician.firstName} ${technician.lastName}` : "User"}
          </h2>
          <p className="text-gray-700 text-white first-letter:uppercase">
            {
              technician?.types === "superadmin" ? "Super Admin" :
                technician?.types === "single-technician" ? "Single Technician" :
                  technician?.types === "ifs" ? "IFS" :
                    technician?.types
            }
          </p>
          <p className="text-gray-700 text-white">{technician?.address}</p>
        </div>
      </div>

      {/* ✅ Personal Info Section */}
      <div className="mt-8 bg-white shadow-lg p-6 rounded-lg">
        <div className="flex justify-between">
          <h3 className="font-semibold text-lg">Personal Information</h3>
          {!isEditing && (
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
          )}

        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className='mb-4 relative'>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon__tech">
              <circle cx="10" cy="6" r="3" stroke="#5B5B99" strokeWidth="1.5" />
              <path d="M5 16C5 13.8 7 12 10 12C13 12 15 13.8 15 16" stroke="#5B5B99" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <TextField fullWidth size='small' className='form__input' name="firstName" id="outlined-basic" color="warning" label="First Name" variant="outlined" value={formData.firstName} onChange={handleInputChange} disabled={!isEditing} required />
            {errors.firstName && (
              <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                {errors.firstName}
              </div>
            )}
          </div>

          <div className='mb-4 relative'>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon__tech">
              <circle cx="10" cy="6" r="3" stroke="#5B5B99" strokeWidth="1.5" />
              <path d="M5 16C5 13.8 7 12 10 12C13 12 15 13.8 15 16" stroke="#5B5B99" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <TextField fullWidth size='small' name="lastName" id="outlined-basic" color="warning" label="Last Name" variant="outlined" value={formData.lastName} onChange={handleInputChange} disabled={!isEditing} required />
            {errors.lastName && (
              <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                {errors.lastName}
              </div>
            )}
          </div>



        </div>
      </div>
      <div className="mt-8 bg-white shadow-lg p-6 rounded-lg">
        <h3 className="font-semibold text-lg">Address</h3>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className='mb-4 relative z-10'>
            <GooglePlacesAutocomplete
              apiKey="AIzaSyBtb6hSmwJ9_OznDC5e8BcZM90ms4WD_DE"
              selectProps={{
                placeholder: 'Search for an address...',
                value: address,
                onChange: (newValue: SingleValue<GooglePlacesOption>, actionMeta: ActionMeta<GooglePlacesOption>) => {
                  if (newValue) {
                    handleAddressSelect(newValue);
                  }  else if (actionMeta.action === 'clear') {
                      // Handle clear action
                      setAddressValue(null); // Make sure you have this state setter
                      setFormData(prev => ({
                        ...prev,
                        address: '',
                      }));
                    }
                },
                isDisabled: !isEditing,
                  isClearable: true,
                styles: {
                  input: (provided) => ({
                    ...provided,
                    borderRadius: '4px',
                    width: '100%'
                  }),
                  control: (provided) => ({
                    ...provided,
                    borderColor: errors.address ? 'red' : '#ccc', // Red border if error exists
                    '&:hover': {
                      borderColor: errors.address ? 'orange' : 'orange',
                    },
                    '&:focus': {
                      borderColor: errors.address ? 'orange' : 'orange',
                    },
                  }),
                }
              }}
              autocompletionRequest={{
                componentRestrictions: {
                  country: 'us' // Restrict to US addresses only
                }
              }}
             />
            {errors.address && (
              <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                {errors.address}
              </div>
            )}
          </div>
          <div className='mb-4'>
            <PhoneInput
              international
              defaultCountry="US"
              value={formData.phoneNumber}
              onChange={handlePhoneChange}
              disabled={!isEditing}
              onKeyDown={(e: any) => {
                // Prevent typing if already 10 digits in national number
                const digitsOnly = formData.phoneNumber.replace(/\D/g, '');
                const nationalNumber = getNationalNumber(digitsOnly, formData.phoneNumber);
                if (nationalNumber.length >= 10 && e.key !== 'Backspace' && e.key !== 'Delete' && !e.metaKey) {
                  e.preventDefault();
                }
              }}
              onPaste={(e: any) => {
                const pasted = e.clipboardData.getData('Text').replace(/\D/g, '');
                if (pasted.length > 10) e.preventDefault();
              }}
              className="input text-xs input-bordered w-full p-2 rounded"
            />
            {errors.phoneNumber && (
              <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                {errors.phoneNumber}
              </div>
            )}
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
