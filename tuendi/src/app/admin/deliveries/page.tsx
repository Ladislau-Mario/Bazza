import { ResponsiveLayout } from "@/components/UI/ResponsiveLayout";
import { Metadata } from "next";
import { MainDelivery } from ".";
import { DeliveriesProvider } from "@/contexts/DeliveriesContext";

export const metadata: Metadata = { title: "Baza | Entregas" }

export default function DeliverPage(){
    return(
        <ResponsiveLayout>
            <DeliveriesProvider>
                <MainDelivery />
            </DeliveriesProvider>
        </ResponsiveLayout>
    );
}
