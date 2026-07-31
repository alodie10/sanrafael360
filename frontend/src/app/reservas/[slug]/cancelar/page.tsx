import ReservaCancelClient from './ReservaCancelClient';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function ReservaCancelPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { token } = await searchParams;
  return <ReservaCancelClient slug={slug} token={token || ''} />;
}
