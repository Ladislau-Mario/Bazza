"use client";
import { Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { ResumeCard } from "@/components/UI/DataResume/ResumeCard";
import { EarningsTable } from "./Table";
import { useContext, useMemo } from "react";
import dynamic from "next/dynamic";
const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { EarningsContext } from "@/contexts/EarningsContext";
import { MdOutlineKeyboardDoubleArrowRight } from "react-icons/md";
import { RiMoneyDollarCircleFill, RiProgress3Fill, RiProgress2Fill, RiCheckFill, RiTimeFill, RiCalendarCheckFill } from "react-icons/ri";
import { getEarningsBarChartOptions } from "@/styles/chartsConfig";

export function MainEarnings() {
  const { subscricoes, estatisticas } = useContext(EarningsContext);

  const receitaTotal = estatisticas?.totalGeral ?? 0;
  const receitaSemanal = estatisticas?.totalSemanal ?? 0;
  const receitaMensal = estatisticas?.totalMensal ?? 0;
  const receitaDiaria = estatisticas?.totalDiario ?? 0;
  const activasCount = estatisticas?.activos ?? 0;
  const pendentesCount = estatisticas?.pendentes ?? 0;

  const receitaPorMes = useMemo(() => {
    const meses = Array.from({ length: 12 }, () => 0);
    (subscricoes || []).forEach((s) => {
      const mes = new Date(s.criadoEm).getMonth();
      meses[mes] += Number(s.valor || 0);
    });
    return meses;
  }, [subscricoes]);

  return (
    <Box as="main" w="100%" display="flex" flexDirection="column" gap={6}>

      <Stack alignSelf={"flex-start"}>
        <Text lineHeight={1} fontSize={"3xl"} fontWeight={"thin"} color={"text.primary"} letterSpacing={"normal"}>Ganhos</Text>

        <Breadcrumb spacing='8px' separator={<MdOutlineKeyboardDoubleArrowRight color='gray.500' />}>
          <BreadcrumbItem>
            <BreadcrumbLink fontSize={"xs"} fontWeight={"hairline"} color={"text.primary"} letterSpacing={"wide"} textTransform={"uppercase"} href='#'>Main Admin</BreadcrumbLink>
          </BreadcrumbItem>

          <BreadcrumbItem>
            <BreadcrumbLink fontWeight={"normal"} letterSpacing={"spaced"} textAlign={"end"} href='/admin/earnings'>Ganhos</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
      </Stack>

      {/* Cards */}
      <SimpleGrid columns={{ base: 2, md: 3 }} w="100%" gap={4}>
        <ResumeCard
          icon={<RiMoneyDollarCircleFill size={"sm"} color="text.secondary"/> }
          title="Receita Total"
          value={`${receitaTotal.toLocaleString("pt-PT")} Kz`}
        />
        <ResumeCard
          icon={<RiProgress3Fill size={"sm"} color="text.secondary"/> }
          title="Planos Semanais"
          value={`${receitaSemanal.toLocaleString("pt-PT")} Kz`}
        />
        <ResumeCard
          icon={<RiProgress2Fill size={"sm"}/> }
          title="Planos Mensais"
          value={`${receitaMensal.toLocaleString("pt-PT")} Kz`}
        />
        <ResumeCard
          icon={<RiCalendarCheckFill size={"sm"}/> }
          title="Receita Diária"
          value={`${receitaDiaria.toLocaleString("pt-PT")} Kz`}
        />
        <ResumeCard
          icon={<RiCheckFill size={"sm"}/> }
          title="Subscrições Activas"
          value={activasCount}
          bgVariant="gradient"
        />
        <ResumeCard
          icon={<RiTimeFill size={"sm"}/> }
          title="Planos Pendentes"
          value={pendentesCount}
        />
      </SimpleGrid>

      {/* Gráfico */}
      <Box bg="bg.card" border="2px" borderColor="border.default" rounded="lg" p={6}>
        <Text fontWeight="bold" fontSize="lg" mb={6}>Receita por Mês</Text>
        <ReactApexChart
          type="bar"
          options={getEarningsBarChartOptions()}
          series={[{ name: "Receita", data: receitaPorMes }]}
          height={300}
        />
      </Box>

      {/* Tabela */}
      <EarningsTable />
    </Box>
  );
}
