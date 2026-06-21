import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { fetchFromStrapi } from '@/lib/strapi';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || !(session as any).jwt) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const response = await fetchFromStrapi('negocios/favoritos/me', {
      headers: {
        Authorization: `Bearer ${(session as any).jwt}`
      }
    });

    console.log('[GET /api/favoritos] raw data[0]:', JSON.stringify(response?.data?.[0]));

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !(session as any).jwt) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { documentId } = await request.json();
    
    if (!documentId) {
      return NextResponse.json({ error: 'Missing documentId' }, { status: 400 });
    }

    const response = await fetchFromStrapi(`negocios/${documentId}/toggle-favorite`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${(session as any).jwt}`
      }
    });

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
