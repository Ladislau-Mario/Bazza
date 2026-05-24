import { ResponsiveLayout } from "@/components/UI/ResponsiveLayout";
import { Metadata } from "next";
import { MainEarnings } from ".";
import { EarningsProvider } from "@/contexts/EarningsContext";

export const metadata: Metadata = { title: "Baza | Ganhos" }

export default function UserPage(){
    return(
        <ResponsiveLayout>
            <EarningsProvider>
                <MainEarnings />
            </EarningsProvider>
        </ResponsiveLayout>
    );
}
