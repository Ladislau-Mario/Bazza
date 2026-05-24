// src/components/UI/Sidebar/NavDropdown.tsx
"use client"

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Box, Collapse, Flex, Text, Stack } from "@chakra-ui/react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

interface NavDropdownProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    activePrefix: string; // Ex: "/admin/earnings" para manter aberto se estiver numa subrota
}

export function NavDropdown({ title, icon, children, activePrefix }: NavDropdownProps) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    // Mantém o dropdown aberto se o utilizador estiver numa subrota dele
    useEffect(() => {
        if (pathname.startsWith(activePrefix)) {
            setIsOpen(true);
        }
    }, [pathname, activePrefix]);

    return (
        <Box w="100%">
            {/* Botão Principal do Dropdown */}
            <Flex
                as="button"
                w="100%"
                alignItems="center"
                justifyContent="space-between"
                py="0.5rem"
                px="1rem"
                rounded="4px"
                color="text.muted"
                fontSize="sm"
                _hover={{ bg: "rgba(155, 155, 155, 0.1)", color: "text.primary" }}
                onClick={() => setIsOpen(!isOpen)}
                transition="all 0.2s"
            >
                <Flex alignItems="center" gap={2}>
                    {icon}
                    <Text as="span" fontWeight="normal" letterSpacing="spaced">
                        {title}
                    </Text>
                </Flex>
                
                {isOpen ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
            </Flex>

            {/* Conteúdo do Dropdown (Sub-links) */}
            <Collapse in={isOpen} animateOpacity>
                <Stack spacing={1} mt={1} pl={4} borderLeft="1px solid" borderColor="border.default">
                    {children}
                </Stack>
            </Collapse>
        </Box>
    );
}