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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const include = searchParams.get("include");

    const backendUrl = process.env.BACKEND_URL || "http://localhost:8080";
    let url = `${backendUrl}/reminders`;

    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (include) params.append("include", include);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
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
    console.error("Reminders API error:", error);
    return corsErrorResponse("Internal server error", 500);
  }
}
