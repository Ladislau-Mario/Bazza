"use client";
import { Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink, Flex, Stack, Text } from "@chakra-ui/react";
import { ResumeCard } from "@/components/UI/DataResume/ResumeCard";
import BarChart, { ClockIcon } from "@/components/Icons/icons";
import { gradients } from "@/styles/gradients";
import { DeliveriesTable } from "./Table";
import { useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import { IPedido } from "@/services/mirage/types";
import { DeliveriesContext } from "@/contexts/DeliveriesContext";
import { MdDeliveryDining, MdOutlineKeyboardDoubleArrowRight } from "react-icons/md";
import { FaRoad } from "react-icons/fa";
import { RiCloseCircleFill, RiProgress3Fill } from "react-icons/ri";
import { LuHandPlatter } from "react-icons/lu";

export function MainDelivery() {
  const { pedidos, total, emTransito, entregues, cancelados } = useContext(DeliveriesContext);

  const chartData = useMemo(
    () => [total, emTransito, entregues, cancelados],
    [total, emTransito, entregues, cancelados]
  );

  return (
    <Box as="main" w="100%" display="flex" flexDirection="column" gap={6}>

      <Stack alignSelf={"flex-start"}>
        <Text lineHeight={1} fontSize={"3xl"} fontWeight={"thin"} color={"text.primary"} letterSpacing={"normal"}>Entregas</Text>

        <Breadcrumb spacing='8px' separator={<MdOutlineKeyboardDoubleArrowRight color='gray.500' />}>
          <BreadcrumbItem>
            <BreadcrumbLink fontSize={"xs"} fontWeight={"hairline"} color={"text.primary"} letterSpacing={"wide"} textTransform={"uppercase"} href='#'>Main Admin</BreadcrumbLink>
          </BreadcrumbItem>

          <BreadcrumbItem>
            <BreadcrumbLink fontWeight={"normal"} letterSpacing={"spaced"} textAlign={"end"} href='/admin/deliveries'>Entregas</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
      </Stack>

      <Flex w="100%" justify="space-between" h="fit-content" gap={4}>
        <ResumeCard
          icon={<MdDeliveryDining size={"sm"} color="text.secondary"/>}
          title="Total de Pedidos"
          value={total}
        />
        <ResumeCard
          icon={<RiProgress3Fill size={"sm"} color="text.secondary"/>}
          title="Em andamento"
          value={emTransito}
        />
        <ResumeCard icon={<LuHandPlatter size={"sm"} color="text.secondary"/> } title="Entregues" value={entregues} />
        <ResumeCard icon={<RiCloseCircleFill size={"sm"} /> } title="Cancelados" value={cancelados} bgVariant="gradient" />
      </Flex>

      <DeliveriesTable />
    </Box>
  );
}