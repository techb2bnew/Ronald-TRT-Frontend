"use client";
import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import 'react-tooltip/dist/react-tooltip.css';
import Breadcrumb from '@/app/component/breadcrumb';


interface BannerPayload {
  bannerImages: File[];
  bannerId?: string;
}

export default function Technicians() {
  const [image, setImage] = useState<string | null>(null);
  const router = useRouter();
  const [isEdit, setIsEdit] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState<BannerPayload>({
    bannerImages: [],
  });

  const fetchBannerData = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    const token = localStorage.getItem('token');
    const userID = localStorage.getItem('userID');
    const roleType = localStorage.getItem('types');
  
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
  
      const response = await fetch(`${apiUrl}/bannerImages`, {
        method: 'GET',
        headers,
      });
  
      const data = await response.json();
  
      if (response.ok && Array.isArray(data.banners)) {
        // Filter all matching banners
        const matchedBanners = data.banners.filter(
          (banner: any) =>
            String(banner.userId) === String(userID) && banner.roleType === roleType
        );
  
        if (matchedBanners.length > 0) {
          // You can loop or display them as needed
          console.log('Matched Banners:', matchedBanners);
  
          // For example, using the first matched one to update formData
          const firstMatch = matchedBanners[0];
          setFormData((prev) => ({
            ...prev,
            bannerImages: firstMatch.bannerImages || [],
            bannerId: firstMatch.id || '',
          }));
          setJobId(firstMatch.id);
        } else {
          console.log('No matching banners found for this user.');
        }
      } else {
        toast.error(data.error || 'Error fetching banner data');
      }
    } catch (error) {
      console.error('Error fetching banner data:', error);
      toast.error('An error occurred while fetching banner data');
    }
  };
  
  




  useEffect(() => {
    fetchBannerData();
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    const token = localStorage.getItem('token');
    const userID = localStorage.getItem('userID');
    const roleType = localStorage.getItem('types');
    const formDataObj = new FormData();
    formData.bannerImages.forEach((file) => {
      formDataObj.append('bannerImages', file);
    });
    if (isEdit && formData.bannerId) {
      formDataObj.append('id', formData.bannerId); // Pass the bannerId for edit case
    }
    formDataObj.append('userId', userID || '');
    formDataObj.append('roleType', roleType || '');

    try {
      setSubmitting(true);
      const endpoint = isEdit ? `${apiUrl}/bannerImages` : `${apiUrl}/bannerImages`;
      const method = isEdit ? "POST" : "POST"; // POST method, you can change to PUT for update if needed

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formDataObj, // Send the FormData object directly in the body
      });

      const result = await response.json();
      if (response.ok) {
        toast.success('Banner Upload successfully.');
        fetchBannerData();
      } else {
        toast.error(result.error || 'Failed to create job.');
      }
    } catch (error) {
      console.error('Error creating job:', error);
      toast.error('An error occurred while creating the job.');
    } finally {
      setSubmitting(false);
    }
  };


  function compressImage(file: any, maxWidth: number, maxHeight: number, quality: number) {
    return new Promise((resolve, reject) => {
      const image = new window.Image();
      image.src = URL.createObjectURL(file);

      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

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

        canvas.toBlob(blob => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Compression failed'));
          }
        }, 'image/jpeg', quality);
      };

      image.onerror = () => reject(new Error('Image loading error'));
    });
  }

  // To handle the image upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const files = e.target.files ? Array.from(e.target.files) : [];

    // Filter out unwanted file types
    const validImageFiles = files.filter(file => acceptedTypes.includes(file.type));

    if (validImageFiles.length === 0) {
      toast.error("Please upload only JPEG, PNG, or WEBP images.");
      return;
    }

    const maxWidth = 800;
    const maxHeight = 600;
    const quality = 0.7;

    const compressions = validImageFiles.map(file =>
      compressImage(file, maxWidth, maxHeight, quality)
    );

    Promise.all(compressions)
      .then(compressedFiles => {
        setFormData((prev: any) => ({
          ...prev,
          bannerImages: [...prev.bannerImages, ...compressedFiles], // Append instead of replace
        }));
      })
      .catch(error => {
        console.error('Compression error:', error);
        toast.error('Failed to compress images.');
      });
  };

  // Remove a specific image
  // const handleRemoveFile = (index: any) => {
  //   const filteredImages = formData.bannerImages.filter((_, i) => i !== index);
  //   setFormData(prev => ({ ...prev, bannerImages: filteredImages }));
  // };

  const handleRemoveFile = async (bannerId: string | undefined, imageUrl: string | File) => {
    if (!bannerId || !imageUrl) {
      toast.error("Invalid data for removing image.");
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    const token = localStorage.getItem('token');

    try {
      // Check if it's a File or URL
      if (imageUrl instanceof File) {
        // Handle file removal logic
        const index = formData.bannerImages.indexOf(imageUrl);
        if (index !== -1) {
          const newBannerImages = formData.bannerImages.filter((_, i) => i !== index);
          setFormData(prev => ({ ...prev, bannerImages: newBannerImages }));
        }
      } else {
        // Handle URL removal logic (if the image is stored remotely)
        const response = await fetch(`${apiUrl}/bannerImages?bannerId=${encodeURIComponent(bannerId)}&imageUrl=${encodeURIComponent(imageUrl)}`, {
          method: 'DELETE',
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        if (response.ok) {
          toast.success('Image deleted successfully');
          fetchBannerData();  // Refresh the banner data
        } else {
          throw new Error('Failed to delete image');
        }
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('An error occurred while deleting the image');
    }
  };






  return (
    <div className='main-container mb-5'>
      <Breadcrumb
        items={[
          isEdit
            ? { label: 'Edit Banner' }
            : { label: 'Banner', href: '/banner' },
        ]}
      />
      <ToastContainer position="top-center" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <h1 className="text-lg leading-6 font-bold text-gray-900"> {isEdit ? 'Edit Work Order' : 'Upload Mobile Banner'}</h1>
      <div className='bg-white p-4 mt-5 w-[80%] m-auto'>

        <form className="" onSubmit={handleSubmit}>

          <div className='mb-4 mt-4'>
            {/* Conditional rendering of Edit button */}


            <div className={`form-control w-full p-8 mt-1 rounded relative ${!isEdit ? 'disabled' : ''}`} style={{ border: '2px dashed #ccc' }}>
              <label className="label text-center">
                <svg className='m-auto' width="34" height="34" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21.953 15.7599C22.3011 15.7599 22.5895 15.8644 22.9124 16.1544L29.2453 22.2609C29.5218 22.5367 29.6876 22.8314 29.6876 23.2368C29.6876 23.9911 29.1353 24.5254 28.3621 24.5254C27.9928 24.5254 27.607 24.3784 27.3485 24.0838L24.5506 21.1201L23.2982 19.8127L23.427 22.5564V36.7479C23.427 37.5219 22.7458 38.1662 21.9538 38.1662C21.1626 38.1662 20.4995 37.5219 20.4995 36.7479V22.5556L20.6095 19.8119L19.3578 21.1193L16.5764 24.0838C16.4507 24.2228 16.2974 24.3339 16.1262 24.4101C15.955 24.4863 15.7698 24.5258 15.5825 24.5262C14.8093 24.5262 14.2389 23.9919 14.2389 23.2368C14.2389 22.8314 14.3858 22.5375 14.6616 22.2609L20.886 16.2581C21.2545 15.8888 21.5853 15.7599 21.9546 15.7599M25.6765 2.96301C32.3606 2.96301 37.7789 8.3813 37.7789 15.0646C37.7789 15.4449 37.7608 15.8212 37.727 16.1921C41.108 16.9888 43.6246 20.0264 43.6246 23.6501C43.6246 27.8819 40.1942 31.3124 35.9623 31.3124H27.123V28.3659H35.9608C36.58 28.3659 37.1933 28.244 37.7654 28.007C38.3376 27.77 38.8575 27.4226 39.2954 26.9847C39.7333 26.5468 40.0806 26.0269 40.3176 25.4548C40.5546 24.8826 40.6766 24.2694 40.6766 23.6501C40.6764 22.5885 40.3182 21.5579 39.66 20.725C39.0017 19.8921 38.0818 19.3055 37.049 19.0599L34.5551 18.4722L34.7908 15.921C34.8175 15.6382 34.8301 15.3522 34.8301 15.0646C34.8301 10.0085 30.7318 5.90944 25.675 5.90944C24.148 5.90809 22.645 6.2892 21.3031 7.01798C19.9612 7.74676 18.8233 8.8 17.993 10.0816L16.7948 11.9233L14.6883 11.301C14.1166 11.1316 13.5137 11.0948 12.9255 11.1933C12.3374 11.2918 11.7794 11.5231 11.2941 11.8695C10.8087 12.216 10.4087 12.6685 10.1244 13.1927C9.84011 13.717 9.67906 14.2991 9.65347 14.8949L9.65033 15.1251L9.7234 17.6001L7.36861 18.143C6.22908 18.4081 5.21281 19.051 4.48522 19.9672C3.75763 20.8834 3.36156 22.0189 3.36147 23.1889C3.36147 24.5621 3.90699 25.8791 4.87803 26.8502C5.84906 27.8212 7.16607 28.3667 8.53933 28.3667H16.9088V31.3132H8.53933C4.0529 31.3132 0.415039 27.6753 0.415039 23.1889C0.415039 19.3326 3.10218 16.1033 6.70625 15.272L6.70311 15.0646C6.70282 13.9956 6.95199 12.9413 7.4308 11.9855C7.90961 11.0297 8.60484 10.1989 9.46119 9.55904C10.3176 8.91919 11.3114 8.48801 12.3637 8.29978C13.416 8.11156 14.4977 8.17148 15.5228 8.4748C17.6811 5.15673 21.4219 2.96301 25.675 2.96301" fill="#383d71" />
                </svg>
                <p className='text-sm mb-1 mt-1'>Upload File</p>
                <span className="text-center m-auto text-xs block"> (Only 'jpeg, webp, and png' images will be accepted)</span>
              </label>
              <input type="file" accept="image/jpeg, image/png, image/webp" multiple className={`input input-bordered w-full opacity-0 absolute inset-0${!isEdit ? 'disabled' : ''}`} onChange={handleFileChange} />
            </div>
            {/* Thumbnails of selected images */}
            <div className='flex flex-wrap gap-4 items-center mt-5'>
              {formData.bannerImages.length > 0 ? (
                formData.bannerImages.map((file, index) => (

                  <div key={index} className='shadow rounded p-2 relative'>
                    {/* Check if the file is an instance of File to create a URL */}
                    {file instanceof File ? (
                      <img src={URL.createObjectURL(file)} alt={`Uploaded file ${index}`} style={{ width: 50, height: 50, objectFit: 'cover' }} />
                    ) : (
                      <img src={file} alt={`Uploaded image ${index}`} style={{ width: 50, height: 50, objectFit: 'cover' }} />
                    )}
                    <button
                      type='button'
                      onClick={() => {

                        handleRemoveFile(formData.bannerId, file);

                      }}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        position: 'absolute',
                        right: '0',
                        top: '0',
                      }}
                      aria-label="Remove image"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M18 6L6 18M6 6L18 18" stroke="red" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                ))
              ) : (
                <p>No images uploaded yet.</p>
              )}
            </div>
          </div>
          {!isEdit && (
            <div className="text-right mt-4 mb-4">
              <button
                type="button"
                className="primary-bg pl-5 pr-5 p-2 rounded flex items-center justify-center gap-2 min-w-[100px] ml-[auto]"
                onClick={() => setIsEdit(true)} // Toggle the edit mode
              >
                Edit
              </button>
            </div>
          )}
          {isEdit && (

            <div className="text-right mt-4 mb-4">
              <button
                type="submit"
                className="primary-bg pl-5 pr-5 p-2 rounded flex items-center justify-center gap-2 min-w-[100px] ml-[auto]"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      ></path>
                    </svg>
                    <span>Submitting...</span>
                  </>
                ) : (
                  'Submit'
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
