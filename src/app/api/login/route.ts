import { NextResponse } from "next/server";

const VALID_EMAIL = "ronaldomartin@yopmail.com";
const VALID_PASSWORD = "12345678";

// Handle POST requests
export async function POST(req: Request) {
  try {
    const { emailAddress, password } = await req.json();

    // Check if email and password are provided
    if (!emailAddress || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    // Simulate login logic
    if (emailAddress === VALID_EMAIL && password === VALID_PASSWORD) {
      // Generate a mock JWT token
      const token = "mock-jwt-token";
      localStorage.setItem('token', token);
      return NextResponse.json({ message: "Login successful!", token });
    } else {
      // Invalid credentials
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }
  } catch (error) {
    console.error("Error in login handler:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
