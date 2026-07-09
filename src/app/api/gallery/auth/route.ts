import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash } from "crypto";

const PASSWORD = process.env.GALLERY_ADMIN_PASSWORD || "admin123";

// Simple helper to get a secure session token based on password
function getSessionToken(password: string) {
  return createHash("sha256").update(password + "salt-for-gallery-secret").digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    
    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }
    
    if (password !== PASSWORD) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }
    
    const token = getSessionToken(PASSWORD);
    const cookieStore = await cookies();
    cookieStore.set("gallery_admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Authentication error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("gallery_admin_session");
    const expectedToken = getSessionToken(PASSWORD);
    
    if (session && session.value === expectedToken) {
      return NextResponse.json({ authenticated: true });
    }
    
    return NextResponse.json({ authenticated: false }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ authenticated: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.set("gallery_admin_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: new Date(0),
      path: "/",
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
