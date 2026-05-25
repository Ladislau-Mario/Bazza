"use client";

import { Box, Flex, IconButton, useDisclosure, Drawer, DrawerOverlay, DrawerContent, DrawerBody, useBreakpointValue, Spinner, Center } from "@chakra-ui/react";
import { ReactNode, useEffect, useState } from "react";
import { RiMenuLine } from "react-icons/ri";
import { Header } from "@/components/UI/Header";
import { Sidebar } from "@/components/UI/Sidebar";
import { useRouter } from "next/navigation";

interface ResponsiveLayoutProps {
  children: ReactNode;
}

export function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, md: false }) ?? false;
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("baza_admin_token");
    if (!token) {
      router.replace("/");
    } else {
      setAuthorized(true);
    }
  }, [router]);

  if (!authorized) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="purple.500" />
      </Center>
    );
  }

  return (
    <Flex direction="column" h="100vh">
      <Header />

      <Flex w="100%" maxW="1440px" my={6} mx="auto" px={{ base: 4, md: 8 }}>
        {/* Sidebar desktop */}
        {!isMobile && <Sidebar />}

        {/* Botão menu mobile */}
        {isMobile && (
          <IconButton
            aria-label="Menu"
            icon={<RiMenuLine />}
            position="fixed"
            bottom={4}
            right={4}
            zIndex={1200}
            colorScheme="purple"
            rounded="full"
            size="lg"
            onClick={onOpen}
            boxShadow="lg"
          />
        )}

        {/* Drawer mobile */}
        <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="xs">
          <DrawerOverlay bg="blackAlpha.600" backdropFilter="blur(4px)">
            <DrawerContent bg="bg.default" pt={20}>
              <DrawerBody p={0}>
                <Sidebar />
              </DrawerBody>
            </DrawerContent>
          </DrawerOverlay>
        </Drawer>

        {/* Conteúdo principal */}
        <Box
          as="main"
          w="100%"
          display="flex"
          flexDirection="column"
          gap={6}
          ml={{ base: 0, md: 52 }}
          mt={20}
        >
          {children}
        </Box>
      </Flex>
    </Flex>
  );
}
