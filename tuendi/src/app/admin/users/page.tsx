import { ResponsiveLayout } from "@/components/UI/ResponsiveLayout";
import { Metadata } from "next";
import { MainUser } from ".";
import { UsersProvider } from "@/contexts/UsersContext";

export const metadata: Metadata = { title: "Baza | Usuarios" }

export default function UserPage(){
    return(
        <ResponsiveLayout>
            <UsersProvider>
                <MainUser/>
            </UsersProvider>
        </ResponsiveLayout>
    );
}
