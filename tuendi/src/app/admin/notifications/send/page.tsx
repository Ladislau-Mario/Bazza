import { ResponsiveLayout } from "@/components/UI/ResponsiveLayout";
import { Metadata } from "next";
import { MainSendNotification } from ".";

export const metadata: Metadata = { title: "Baza | Enviar Notificação" }

export default function SendNotificationPage(){
    return(
        <ResponsiveLayout>
            <MainSendNotification />
        </ResponsiveLayout>
    );
}
