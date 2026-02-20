import type { Metadata } from "next"
import { AdminSidebar } from "@/components/layout/admin-sidebar"

export const metadata: Metadata = {
  title: "Admin Dashboard",
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
