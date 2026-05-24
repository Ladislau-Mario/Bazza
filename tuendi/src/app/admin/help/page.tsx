import { ResponsiveLayout } from "@/components/UI/ResponsiveLayout";
import { Metadata } from "next";
import { MainHelp } from ".";

export const metadata: Metadata = { title: "Baza | Suporte" }

export default function HelpPage(){
    return(
        <ResponsiveLayout>
            <MainHelp />
        </ResponsiveLayout>
    );
}
