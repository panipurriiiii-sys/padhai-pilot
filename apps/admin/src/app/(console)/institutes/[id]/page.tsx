import { Suspense } from 'react';
import { InstituteDetail } from '../../../../components/InstituteDetail';

async function Inner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InstituteDetail id={id} />;
}

export default function InstituteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="skeleton h-40" aria-busy="true" />}>
      <Inner params={params} />
    </Suspense>
  );
}


export const instant = false;
