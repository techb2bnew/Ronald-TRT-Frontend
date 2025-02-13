"use client";
import Register from "./signup";

export default function Signup() {
  console.log('API URLsssssssssss:', process.env.NEXT_PUBLIC_API_URL);
  return (
     <>
     <Register />
     </>
  );
}
