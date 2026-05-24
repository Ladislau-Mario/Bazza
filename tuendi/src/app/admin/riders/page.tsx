"use client"

import { ResponsiveLayout } from "@/components/UI/ResponsiveLayout";
import { MainRider } from ".";
import { RidersProvider } from "@/contexts/RidersContext";

export default function UserPage(){
    return(
        <ResponsiveLayout>
            <RidersProvider>
                <MainRider/>
            </RidersProvider>
        </ResponsiveLayout>
    );
}
