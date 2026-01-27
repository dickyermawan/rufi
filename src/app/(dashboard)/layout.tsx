import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { DashboardLayoutClient } from './DashboardLayoutClient';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Get user's accessible buckets
  let buckets;
  if (user.isRoot) {
    buckets = await prisma.bucket.findMany({
      select: { id: true, name: true },
    });
  } else {
    const access = await prisma.bucketAccess.findMany({
      where: { userId: user.id },
      include: { bucket: { select: { id: true, name: true } } },
    });
    buckets = access.map((a: { bucket: { id: string; name: string } }) => a.bucket);
  }

  return (
    <DashboardLayoutClient
      user={user}
      buckets={buckets}
    >
      {children}
    </DashboardLayoutClient>
  );
}
