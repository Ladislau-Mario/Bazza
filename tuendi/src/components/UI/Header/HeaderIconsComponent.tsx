"use client";
import { NotificationIcon } from "@/components/Icons/icons";
import { IconButton, useColorMode } from "@chakra-ui/react";
import { RiSunLine, RiMoonLine } from "react-icons/ri";
import { useRouter } from "next/navigation";

export function HeaderIconsComponent(){
    const { colorMode, toggleColorMode } = useColorMode();
    const router = useRouter();

    return(
        <>
            <IconButton
                aria-label="Alternar modo claro/escuro"
                fontSize={"xl"}
                w={"auto"}
                icon={colorMode === "dark" ? <RiSunLine /> : <RiMoonLine />}
                variant={"ghost"}
                color={"text.secondary"}
                onClick={toggleColorMode}
            />

            <IconButton
                aria-label="Notificações"
                fontSize={"xl"}
                w={"auto"}
                icon={<NotificationIcon strokeWidth={2}/>}
                variant={"ghost"}
                color={"text.secondary"}
                onClick={() => router.push("/admin/notifications")}
            />
        </>
    );
}
