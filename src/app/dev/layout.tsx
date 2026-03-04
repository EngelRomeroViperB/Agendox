'use client'

import { DevSidebar } from '@/components/dev/sidebar'

export default function DevLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <DevSidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
