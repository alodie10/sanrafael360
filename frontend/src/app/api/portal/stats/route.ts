import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { fetchFromStrapi } from '@/lib/strapi';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !(session as { jwt?: string }).jwt) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let path = 'negocios/stats/summary';
    if (startDate && endDate) {
      path += `?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
    }

    const response = await fetchFromStrapi(path, {
      headers: {
        Authorization: `Bearer ${(session as { jwt: string }).jwt}`,
      },
      cache: 'no-store',
    });

    return NextResponse.json(response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al cargar estadísticas';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
