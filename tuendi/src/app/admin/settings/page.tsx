import { ResponsiveLayout } from "@/components/UI/ResponsiveLayout";
import { Metadata } from "next";
import { MainSettings } from ".";

export const metadata: Metadata = { title: "Baza | Definições" }

export default function SettingsPage(){
    return(
        <ResponsiveLayout>
            <MainSettings />
        </ResponsiveLayout>
    );
}
