import { ResponsiveLayout } from "@/components/UI/ResponsiveLayout";
import { Metadata } from "next";
import { MainNotifications } from ".";

export const metadata: Metadata = { title: "Baza | Notificações" }

export default function NotificationsPage(){
    return(
        <ResponsiveLayout>
            <MainNotifications />
        </ResponsiveLayout>
    );
}
