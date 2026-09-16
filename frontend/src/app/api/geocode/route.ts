import { NextResponse } from "next/server";
import { clientIpFromHeaders } from "@/lib/client-ip";
import { consumeIpRateLimit } from "@/lib/asistente/rate-limit";

const GEOCODE_MAX = 30;
const GEOCODE_WINDOW_MS = 60_000;
const ADDRESS_MAX = 200;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address")?.trim() || "";

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 });
  }
  if (address.length > ADDRESS_MAX) {
    return NextResponse.json({ error: "Address too long" }, { status: 400 });
  }

  const ip = clientIpFromHeaders(request.headers);
  if (!consumeIpRateLimit(`geocode:${ip}`, Date.now(), GEOCODE_MAX, GEOCODE_WINDOW_MS).allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address + ", San Rafael, Mendoza")}&key=${apiKey}`
    );
    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      {
        status: "INTERNAL_ERROR",
        error_message: "Failed to connect to Google Maps API",
      },
      { status: 500 }
    );
  }
}
