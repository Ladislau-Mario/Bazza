"use client";
import { Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink, Flex, Stack, Text } from "@chakra-ui/react";
import { ResumeCard } from "@/components/UI/DataResume/ResumeCard";
import BarChart, { ClockIcon } from "@/components/Icons/icons";
import { gradients } from "@/styles/gradients";
import { UsersTable } from "./Table";
import { useContext, useMemo } from "react";
import { UsersContext } from "@/contexts/UsersContext";
import { MdOutlineKeyboardDoubleArrowRight } from "react-icons/md";
import { FaUser, FaUserFriends, FaUserSlash, FaUserTimes } from "react-icons/fa";
import { RiEBike2Fill } from "react-icons/ri";

export function MainUser() {
  const {total, clientes, motoqueiroCount, suspensos, eliminados} = useContext(UsersContext);

  const chartData = useMemo(
    () => [total, clientes, motoqueiroCount, suspensos, eliminados],
    [total, clientes, motoqueiroCount, suspensos, eliminados]
  );

  return (
    <Box as="main" w="100%" display="flex" flexDirection="column" gap={6}>

      <Stack alignSelf={"flex-start"}>
        <Text lineHeight={"1"} fontSize={"3xl"} fontWeight={"thin"} color={"text.primary"} letterSpacing={"normal"}>Usuários</Text>

        <Breadcrumb spacing='8px' separator={<MdOutlineKeyboardDoubleArrowRight color='gray.500' />}>
          <BreadcrumbItem>
            <BreadcrumbLink fontSize={"xs"} fontWeight={"hairline"} color={"text.primary"} letterSpacing={"wide"} textTransform={"uppercase"} href='#'>Main Admin</BreadcrumbLink>
          </BreadcrumbItem>

          <BreadcrumbItem>
            <BreadcrumbLink fontWeight={"normal"} letterSpacing={"spaced"} textAlign={"end"} href='/admin/users'>Usuários</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
      </Stack>

      <Flex w="100%" justify="space-between" h="fit-content" gap={4}>
        <ResumeCard
          icon={<FaUser size={"sm"} color="text.secondary"/> }
          title="Total de Usuários"
          value={total}
        />
        <ResumeCard
          icon={<FaUserFriends size={"sm"} color="text.secondary"/> }
          title="Clientes"
          value={clientes}
        />
        <ResumeCard icon={<RiEBike2Fill size={"sm"} color="text.secondary"/> } title="Motoqueiros" value={motoqueiroCount} />
        <ResumeCard icon={<FaUserSlash size={"sm"}/> } title="Suspensos" value={suspensos} bgVariant="gradient" />
        <ResumeCard icon={<FaUserTimes size={"sm"}/> } title="Eliminados" value={eliminados} />
      </Flex>

      <UsersTable />
    </Box>
  );
}