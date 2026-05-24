"use client";
import { Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink, Flex, Stack, Text } from "@chakra-ui/react";
import { ResumeCard } from "@/components/UI/DataResume/ResumeCard";
import BarChart, { ClockIcon } from "@/components/Icons/icons";
import { gradients } from "@/styles/gradients";
import { RidersTable } from "./Table";
import { RidersContext } from "@/contexts/RidersContext";
import { useContext, useMemo } from "react";
import { MdOutlineKeyboardDoubleArrowRight } from "react-icons/md";
import { FaUserTag, FaCheckSquare, FaUserTimes } from "react-icons/fa";
import { RiProgress3Fill, RiCloseCircleFill } from "react-icons/ri";

export function MainRider() {
  const {total, pendentes, ativos, suspensos, eliminados} = useContext(RidersContext);

  const chartData = useMemo(() => [total, ativos, suspensos, eliminados], [total, ativos, suspensos, eliminados]);

  return (
    <Box as="main" w="100%" display="flex" flexDirection="column" gap={6}>

      <Stack alignSelf={"flex-start"}>
        <Text lineHeight={1} fontSize={"3xl"} fontWeight={"thin"} color={"text.primary"} letterSpacing={"normal"}>Entregadores</Text>

        <Breadcrumb spacing='8px' separator={<MdOutlineKeyboardDoubleArrowRight color='gray.500' />}>
          <BreadcrumbItem>
            <BreadcrumbLink fontSize={"xs"} fontWeight={"hairline"} color={"text.primary"} letterSpacing={"wide"} textTransform={"uppercase"} href='#'>Main Admin</BreadcrumbLink>
          </BreadcrumbItem>

          <BreadcrumbItem>
            <BreadcrumbLink fontWeight={"normal"} letterSpacing={"spaced"} textAlign={"end"} href='/admin/riders'>Entregadores</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
      </Stack>




      <Flex w="100%" justify="space-between" h="fit-content" gap={4}>
        <ResumeCard
          icon={<FaUserTag size={"sm"} color="text.secondary"/> }
          title="Entregadores"
          value={total}
        />
        <ResumeCard
          icon={<RiProgress3Fill size={"sm"} color="text.secondary"/> }
          title="Pendentes"
          value={pendentes}
        />
        <ResumeCard icon={<FaCheckSquare size={"sm"} color="text.secondary"/> } title="Activos" value={ativos} />
        <ResumeCard icon={<RiCloseCircleFill size={"sm"}/> } title="Suspensos" value={suspensos} bgVariant="gradient" />
        <ResumeCard icon={<FaUserTimes size={"sm"}/> } title="Eliminados" value={eliminados} />
      </Flex>

      <RidersTable />
    </Box>
  );
}