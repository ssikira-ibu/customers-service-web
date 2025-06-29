import { NextResponse } from "next/server";

// CORS configuration
export function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin":
      process.env.NODE_ENV === "production"
        ? process.env.ALLOWED_ORIGINS || "*"
        : "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, Accept, X-Requested-With",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400", // 24 hours
  };
}

// Handle preflight requests
export function handleCorsOptions() {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(),
  });
}

// Create a JSON response with CORS headers
export function corsResponse(data: unknown, status: number = 200) {
  return NextResponse.json(data, {
    status,
    headers: getCorsHeaders(),
  });
}

// Create an error response with CORS headers
export function corsErrorResponse(error: string, status: number = 500) {
  return NextResponse.json(
    { error },
    {
      status,
      headers: getCorsHeaders(),
    }
  );
}
