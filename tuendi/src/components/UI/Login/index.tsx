"use client"

import { Button, Flex, Heading, Input, Stack, Text, Alert, AlertIcon } from "@chakra-ui/react"
import { useContext, useState } from "react"
import { useRouter } from "next/navigation"
import { LoginContext } from "@/contexts/LoginContext"

export function Login(){
    const { login } = useContext(LoginContext);
    const router = useRouter();
    const [telefone, setTelefone] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await login(telefone);
            router.push("/admin/dashboard");
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Erro ao fazer login. Verifica o número.";
            setError(Array.isArray(msg) ? msg[0] : msg);
        } finally {
            setLoading(false);
        }
    }

    return(
        <Flex
            as={'main'}
            w='100vw'
            h='100vh'
            align={"center"}
            justify={"center"}>

            <Flex
                as={"form"}
                onSubmit={handleSubmit}
                w={'100%'}
                maxW={'360px'}
                p={8}
                rounded={6}
                bg={"bg.card"}
                direction="column"
                align={"center"}
                gap={8}>

                <Heading size={"lg"}>Login Admin</Heading>

                {error && (
                    <Alert status="error" rounded="md" fontSize="sm">
                        <AlertIcon />
                        {error}
                    </Alert>
                )}

                <Stack gap={4} w={"100%"}>
                    <Input
                        variant={"filled"}
                        focusBorderColor={ "brand.500" }
                        bgColor={"grayDark.800"}
                        _hover={{bg: "grayDark.800"}}
                        _focus={{bg: "grayDark.800"}}
                        color={"text.secondary"}
                        value={telefone}
                        onChange={(e) => setTelefone(e.target.value)}
                        type="tel"
                        placeholder={"Telefone (ex: 923000000)"}
                        fontFamily={"mono"}
                    />
                </Stack>

                <Button
                    w={"100%"}
                    type="submit"
                    bg={"brand.500"}
                    color={"brand.50"}
                    _hover={{bg: "brand.600"}}
                    fontFamily={"mono"}
                    isLoading={loading}
                >Entrar</Button>
            </Flex>
        </Flex>
    );
}
