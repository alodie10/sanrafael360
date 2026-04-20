import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 });
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address + ", San Rafael, Mendoza")}&key=${apiKey}`
    );
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ 
      status: 'INTERNAL_ERROR', 
      error_message: 'Failed to connect to Google Maps API' 
    }, { status: 500 });
  }
}
