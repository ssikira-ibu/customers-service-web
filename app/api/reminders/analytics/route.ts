import { NextRequest, NextResponse } from "next/server";
import {
  handleCorsOptions,
  corsResponse,
  corsErrorResponse,
} from "@/lib/utils/cors";

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions();
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return corsErrorResponse("Authorization header required", 401);
    }

    const backendUrl = process.env.BACKEND_URL || "http://localhost:8080";
    const response = await fetch(`${backendUrl}/reminders/analytics`, {
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      await response.text();
      return corsErrorResponse("Backend request failed", response.status);
    }

    const data = await response.json();
    return corsResponse(data);
  } catch (error) {
    console.error("Analytics API error:", error);
    return corsErrorResponse("Internal server error", 500);
  }
}
