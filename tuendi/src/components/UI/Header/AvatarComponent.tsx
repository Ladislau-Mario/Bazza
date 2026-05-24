"use client";
import { Flex, Avatar, AvatarBadge, HStack, IconButton, Text, MenuItem, Link as ChakraLink } from "@chakra-ui/react";
import { RiArrowDownSLine } from "react-icons/ri";
import { FloatingMenu } from "../FloatingMenu";
import Link from "next/link";
import { useContext } from "react";
import { LoginContext } from "@/contexts/LoginContext";

export function AvatarComponent(){
    const { user, logout } = useContext(LoginContext);

    const nome = user?.nome || "Admin";
    const sobrenome = user?.sobrenome || "";
    const fotoPerfil = user?.fotoPerfil || (user as any)?.fotoPerfilUrl || undefined;

    return(
        <Flex direction={"row"} align={"center"} gap={2} borderLeftWidth={2} borderColor={"border.default"} pl={3} py={0}>

            <Avatar
                bg={"brand.500"}
                name={`${nome} ${sobrenome}`}
                src={fotoPerfil}
                size={"sm"}
                fontWeight={"bold"}
                letterSpacing={"normal"}
                color={"text.primary"}
            >

                <AvatarBadge boxSize={"1em"} bg={"status.success"}/>

            </Avatar>

            <HStack spacing={1}>
                <Text as={"span"} isTruncated maxW={"110px"} color={"text.primary"} fontSize={"sm"} fontWeight={"medium"} letterSpacing={"normal"} fontFamily={"heading"}>
                    {nome} {sobrenome}
                </Text>

                <FloatingMenu placement="bottom" menuIcon={<RiArrowDownSLine/>}>
                    <MenuItem><ChakraLink href="/admin/profile">Perfil</ChakraLink></MenuItem>
                    <MenuItem><ChakraLink href="/admin/settings">Definições</ChakraLink></MenuItem>
                    <MenuItem onClick={logout}>Terminar Sessão</MenuItem>
                </FloatingMenu>

            </HStack>
        </Flex>
    );
}
