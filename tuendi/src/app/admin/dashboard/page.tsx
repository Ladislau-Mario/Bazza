import { MainDashboard } from "@/app/admin/dashboard";
import { DashboardProvider } from "@/contexts/DashboardContext";
import { ResponsiveLayout } from "@/components/UI/ResponsiveLayout";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Baza | DashBoard" };

export default function Dashboard() {
  return (
    <ResponsiveLayout>
      <DashboardProvider>
        <MainDashboard />
      </DashboardProvider>
    </ResponsiveLayout>
  );
}