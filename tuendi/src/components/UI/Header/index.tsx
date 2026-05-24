"use client";

import { Flex, HStack, useColorMode, Hide } from "@chakra-ui/react";
import Image from "next/image";
import logo from "../../../../public/Assets/icons/BazaLogo.svg"
import { InputSearch } from "./InputSearch";
import { AvatarComponent } from "./AvatarComponent";
import { HeaderIconsComponent } from "./HeaderIconsComponent";

export function Header(){
    const { colorMode } = useColorMode();
    return(

        <Flex
            as={"header"}
            w={"100%"}
            maxW={"1440px"}
            h={"fit-content"}
            mx={"auto"}
            px={{ base: 4, md: 8 }}
            py={4}
            align={"center"}
            justify={"space-between"}
            position={"fixed"}
            top={0}
            left={0}
            right={0}
            bg={"bg.default"}
            zIndex={"1001"}
        >
            <Image
                src={logo}
                alt="Baza Logo"
                style={{ maxHeight: 40, width: "auto", ...(colorMode === "light" ? { filter: "brightness(0) saturate(100%) invert(13%) sepia(95%) saturate(6000%) hue-rotate(265deg) brightness(85%) contrast(120%)" } : {}) }}
            />

            <HStack spacing={1} color={"text.secondary"} >
                <Hide below="md">
                    <InputSearch/>
                </Hide>

                <HeaderIconsComponent/>

                <AvatarComponent />

            </HStack>
        </Flex>
    );
}