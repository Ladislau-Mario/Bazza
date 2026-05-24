"use client";
import { Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink, Flex, Grid, GridItem, Stack, Text, HStack, Avatar, Tag, TagLabel, TagLeftIcon, Button } from "@chakra-ui/react";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { DashboardTable } from "./Table";
import { ResumeCard } from "@/components/UI/DataResume/ResumeCard";
import BarChart from "@/components/Icons/icons";
import { DashboardCard } from "./DashboardCard";
import { TopRatedList, User } from "./TopRatedList";
import { useContext, useMemo } from "react";
import { IPedido, IUser } from "@/services/mirage/types";
import type { ApexOptions } from "apexcharts";
import { getBarOptions, getAreaOptions, getRadialBarOptions } from "../../../styles/chartsConfig";
import { DashboardContext } from "@/contexts/DashboardContext";
import { MdOutlineKeyboardDoubleArrowRight } from "react-icons/md";
import { BsBox, BsBoxFill } from "react-icons/bs";
import { FaFileInvoice, FaFileInvoiceDollar } from "react-icons/fa";
import { RiProgress3Fill, RiMoneyDollarCircleFill, RiCircleFill, RiMotorbikeLine } from "react-icons/ri";
import { useRouter } from "next/navigation";

export function MainDashboard() {
  const router = useRouter();
  const { receitaPorMes, entregasPorMes, pedidos, motoqueiros, clientes, motoqueirosPendentes, ticketsAbertos } = useContext(DashboardContext);

  // Cards
  const totalPedidos   = useMemo(() => pedidos.filter((p) => p.status === "entregue").length, [pedidos]);
  const EM_ANDAMENTO = ["a_procurar_motoqueiro", "entregando", "a_caminho_recolha", "recolhido", "motoqueiro_atribuido", "em_pausa"];
  const emAndamento     = useMemo(() => pedidos.filter((p) =>
    EM_ANDAMENTO.includes(p.status)
  ).length, [pedidos]);
  const receita         = useMemo(() => pedidos.filter((p) => p.status === "entregue").reduce((acc, p) => acc + Number(p.valorEntrega || 0), 0), [pedidos]);
  const fatura          = useMemo(() => pedidos.reduce((acc, p) => acc + Number(p.valorEntrega || 0), 0), [pedidos]);

  // Gráficos
  const dadosReceita   = useMemo(() => receitaPorMes(pedidos), [pedidos]);
  const dadosEntregas  = useMemo(() => entregasPorMes(pedidos), [pedidos]);

  // TopRated — motoqueiros ordenados por classificação
  const topMotoqueiros = useMemo(() =>
    [...motoqueiros]
      .filter((m) => m.user)
      .sort((a, b) => (b.classificacaoMedia || 0) - (a.classificacaoMedia || 0))
      .slice(0, 5)
      .map((m, i) => ({
        id: Number(m.id) || i,
        name: `${m.user.nome || ""} ${m.user.sobrenome || ""}`,
        role: `${m.totalAvaliacoes || 0} avaliações`,
        avatar: m.user.fotoPerfil,
        score: m.classificacaoMedia || 0,
      })),
    [motoqueiros]
  );

  // TopRated — clientes com mais pedidos
  const topClientes = useMemo(() => {
    const contagem: Record<string, { user: any; total: number }> = {};
    pedidos.forEach((p) => {
      if (!p.cliente) return;
      if (!contagem[p.clienteId]) {
        contagem[p.clienteId] = { user: p.cliente, total: 0 };
      }
      contagem[p.clienteId].total += 1;
    });

    return Object.values(contagem)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map((c, i) => ({
        id: Number(c.user.id) || i,
        name: `${c.user.nome} ${c.user.sobrenome}`,
        role: `${c.total} pedidos`,
        avatar: c.user.fotoPerfil,
        score: c.total,
      }));
  }, [pedidos]);

  // Últimas entregas — 5 mais recentes
  const ultimasEntregas = useMemo(() =>
    [...pedidos]
      .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())
      .slice(0, 5),
    [pedidos]
  );

  return (
    <Box as="main" w="100%" display="flex" flexDirection="column" gap={6}>

      <Stack alignSelf={"flex-start"}>
        <Text lineHeight={1} fontSize={"3xl"} fontWeight={"thin"} color={"text.primary"} letterSpacing={"normal"}>Dashboard</Text>

        <Breadcrumb spacing='8px' separator={<MdOutlineKeyboardDoubleArrowRight color='gray.500' />}>
          <BreadcrumbItem>
            <BreadcrumbLink fontSize={"xs"} fontWeight={"hairline"} color={"text.primary"} letterSpacing={"wide"} textTransform={"uppercase"} href='#'>Main Admin</BreadcrumbLink>
          </BreadcrumbItem>

          <BreadcrumbItem>
            <BreadcrumbLink fontWeight={"normal"} letterSpacing={"spaced"} textAlign={"end"} href='/admin/dashboard'>Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
      </Stack>

      {/* Cards de resumo */}
      <Flex w="100%" justify="space-between" h="fit-content" gap={4}>
        <ResumeCard
          icon={<BsBoxFill size={"sm"} color="text.secondary"/>}
          title="Entregas hoje"
          value={totalPedidos}
          percentage={10}
        />
        <ResumeCard
          icon={<RiProgress3Fill size={"sm"} color="text.secondary"/>}
          title="Em andamento"
          value={emAndamento}
          percentage={-5}
        />
        <ResumeCard
          icon={<RiMoneyDollarCircleFill size={"sm"} color="text.secondary"/>}
          title="Receita"
          value={`${Number(receita).toLocaleString("pt-PT")} Kz`}
        />
        <ResumeCard
          icon={<FaFileInvoiceDollar size={"sm"} />}
          title="Fatura"
          value={`${Number(fatura).toLocaleString("pt-PT")} Kz`}
          bgVariant="gradient"
        />
      </Flex>

      {/* Grid de cards */}
      <Grid
        templateColumns="repeat(3, 1fr)"
        gap={6}
        templateRows="repeat(2, minmax(300px, 360px))"
      >
        
        {/* Gráfico de barras — Fatura anual */}
        <GridItem colSpan={2}>
          <DashboardCard title="Total de Fatura" value={fatura}>
            <Chart
              options={getBarOptions()}
              series={[{ name: "Receita", data: dadosReceita }]}
              type="bar"
              width="100%"
              height={240}
            />
          </DashboardCard>
        </GridItem>

        {/* Semicírculo — estados das entregas */}
        <GridItem>
        <DashboardCard title="Estados das Entregas">
            <Chart
            options={getRadialBarOptions()}
            series={[
                Math.round((pedidos.filter((p) => p.status === "entregue").length / Math.max(pedidos.length, 1)) * 100),
                Math.round((pedidos.filter((p) => EM_ANDAMENTO.includes(p.status)).length / Math.max(pedidos.length, 1)) * 100),
                Math.round((pedidos.filter((p) => p.status === "cancelado").length / Math.max(pedidos.length, 1)) * 100),
            ]}
            type="radialBar"
            width="100%"
            height="260px"
            />
        </DashboardCard>
        </GridItem>

        {/* Gráfico de area — segunda linha */}
        <GridItem>
          <DashboardCard title="Entregas" value={totalPedidos} isBalance={false} >
            <Chart
              options={getAreaOptions()}
              series={[{ name: "Entregas", data: dadosEntregas }]}
              type="area"
              width="100%"
              height="140px"
            />
          </DashboardCard>
        </GridItem>

        {/* Top motoqueiros */}
        <GridItem>
          <DashboardCard title="Melhores Avaliados">
            <TopRatedList data={topMotoqueiros} />
          </DashboardCard>
        </GridItem>

        {/* Top clientes */}
        <GridItem>
          <DashboardCard title="Parceiros Activos">
            <TopRatedList data={topClientes} />
          </DashboardCard>
        </GridItem>
      </Grid>

      {/* Alertas e ações rápidas */}
      <Grid templateColumns="repeat(2, 1fr)" gap={4}>
        {/* Motoqueiros pendentes */}
        <Box bg="bg.card" border="1px solid" borderColor="border.default" rounded="lg" p={5}>
          <Flex justify="space-between" align="center" mb={4}>
            <HStack gap={2}>
              <Text fontWeight="semibold" fontSize="sm">Motoqueiros pendentes</Text>
              {motoqueirosPendentes.length > 0 && (
                <Tag colorScheme="yellow" size="sm">
                  <TagLabel>{motoqueirosPendentes.length}</TagLabel>
                </Tag>
              )}
            </HStack>
            <Button size="xs" variant="ghost" colorScheme="purple" onClick={() => router.push("/admin/riders")}>
              Ver todos
            </Button>
          </Flex>
          <Stack gap={3}>
            {motoqueirosPendentes.length === 0 ? (
              <Text fontSize="sm" color="text.muted" textAlign="center" py={4}>
                Nenhum motoqueiro pendente.
              </Text>
            ) : (
              motoqueirosPendentes.slice(0, 5).map((m) => (
                <Flex key={m.id} justify="space-between" align="center">
                  <HStack gap={3}>
                    <Avatar size="sm" src={m.user.fotoPerfil} name={`${m.user.nome} ${m.user.sobrenome}`} />
                    <Box>
                      <Text fontSize="sm" fontWeight="medium">{m.user.nome} {m.user.sobrenome}</Text>
                      <Text fontSize="xs" color="text.secondary">{m.user.email}</Text>
                    </Box>
                  </HStack>
                  <Button size="xs" colorScheme="purple" variant="outline" onClick={() => router.push(`/admin/riders/viewMore?id=${m.id}`)}>
                    Rever
                  </Button>
                </Flex>
              ))
            )}
          </Stack>
        </Box>

        {/* Tickets abertos */}
        <Box bg="bg.card" border="1px solid" borderColor="border.default" rounded="lg" p={5}>
          <Flex justify="space-between" align="center" mb={4}>
            <HStack gap={2}>
              <Text fontWeight="semibold" fontSize="sm">Tickets de suporte abertos</Text>
              {ticketsAbertos.length > 0 && (
                <Tag colorScheme="red" size="sm">
                  <TagLabel>{ticketsAbertos.length}</TagLabel>
                </Tag>
              )}
            </HStack>
            <Button size="xs" variant="ghost" colorScheme="purple" onClick={() => router.push("/admin/help")}>
              Ver todos
            </Button>
          </Flex>
          <Stack gap={3}>
            {ticketsAbertos.length === 0 ? (
              <Text fontSize="sm" color="text.muted" textAlign="center" py={4}>
                Nenhum ticket aberto.
              </Text>
            ) : (
              ticketsAbertos.slice(0, 5).map((t) => (
                <Flex key={t.id} justify="space-between" align="center">
                  <Box flex={1} mr={3}>
                    <Text fontSize="sm" fontWeight="medium" noOfLines={1}>{t.titulo}</Text>
                    <Text fontSize="xs" color="text.secondary" noOfLines={1}>{t.descricao}</Text>
                  </Box>
                  <Tag colorScheme="red" size="sm" flexShrink={0}>
                    <TagLeftIcon as={RiCircleFill} />
                    <TagLabel>Aberto</TagLabel>
                  </Tag>
                </Flex>
              ))
            )}
          </Stack>
        </Box>
      </Grid>

      {/* Últimas entregas */}
      <DashboardTable />

    </Box>
  );
}