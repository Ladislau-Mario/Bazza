"use client";
import { InputGroup, InputLeftElement, Input } from "@chakra-ui/react";
import { RiSearch2Line } from "react-icons/ri";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function InputSearch(){
    const [search, setSearch] = useState("");
    const router = useRouter();

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        if (search.trim()) {
            router.push(`/admin/users?search=${encodeURIComponent(search.trim())}`);
        }
    }

    return(
        <form onSubmit={handleSearch} style={{ display: 'flex' }}>
            <InputGroup>

                <InputLeftElement pointerEvents={'none'} h={"100%"} pl={2} color={"text.secondary"}>
                    <RiSearch2Line />
                </InputLeftElement>

                <Input
                    variant={"unstyled"}
                    w={"280px"}
                    bgColor={"bg.card"}
                    rounded={"lg"}
                    fontSize={"sm"}
                    fontFamily={"body"}
                    letterSpacing={"tight"}
                    _focus={{bg: "grayDark.500"}}
                    color={"text.secondary"}
                    name="search"
                    type="search"
                    placeholder={"Pesquisar utilizadores..."}
                    _placeholder={{color: "text.muted", fontSize: "sm"}}
                    px={6}
                    pl={10}
                    py={3}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

            </InputGroup>
        </form>
    );
}
