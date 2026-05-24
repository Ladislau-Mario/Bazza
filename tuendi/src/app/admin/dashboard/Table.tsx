"use client";
import { Box, Flex, Avatar, Text, Tag, TagLeftIcon, TagLabel, IconButton } from "@chakra-ui/react";
import { TableComponent } from "@/components/UI/Table/Table";
import { TableHeader } from "@/components/UI/Table/TableHeader";
import { Pagination } from "@/components/UI/Table/Pagination";
import { BsThreeDots } from "react-icons/bs";
import { RiCircleFill } from "react-icons/ri";
import { useContext } from "react";
import { DashboardContext } from "@/contexts/DashboardContext";

const statusColor: Record<string, string> = {
  a_procurar_motoqueiro: "yellow",
  motoqueiro_atribuido:  "blue",
  a_caminho_recolha:     "orange",
  em_pausa:              "gray",
  recolhido:             "purple",
  entregando:            "cyan",
  entregue:              "green",
  cancelado:             "red",
};

const statusLabel: Record<string, string> = {
  a_procurar_motoqueiro: "A procurar",
  motoqueiro_atribuido:  "Atribuído",
  a_caminho_recolha:     "A caminho",
  em_pausa:              "Em pausa",
  recolhido:             "Recolhido",
  entregando:            "A entregar",
  entregue:              "Entregue",
  cancelado:             "Cancelado",
};

export function DashboardTable() {
  const { pedidos, isFetching } = useContext(DashboardContext);

  const columns = [
    {
      header: "Nº Pedido",
      render: (p: any) => (
        <Text fontFamily="mono" fontSize="sm">{p.numeroPedido}</Text>
      ),
    },
    {
      header: "Cliente",
      render: (p: any) => {
        const user = p.cliente;
        return (
          <Flex align="center" gap={2}>
            <Avatar size="sm" src={user?.fotoPerfil} name={user ? `${user.nome} ${user.sobrenome}` : "???"} />
            <Text>{user?.nome || "N/A"} {user?.sobrenome || ""}</Text>
          </Flex>
        );
      },
    },
    {
      header: "Destino",
      render: (p: any) => (
        <Text fontSize="sm" noOfLines={1} maxW="180px">{p.destinoEndereco || "—"}</Text>
      ),
    },
    {
      header: "Valor",
      render: (p: any) => (
        <Text>{Number(p.valorEntrega || 0).toLocaleString("pt-PT")} Kz</Text>
      ),
    },
    {
      header: "Entregador",
      render: (p: any) => {
        // Backend: p.motoqueiro.user (com relações)
        // Fallback: p.userDataMotoqueiro (formato Mirage)
        const motoqueiroUser = p.motoqueiro?.user || p.userDataMotoqueiro;
        if (!motoqueiroUser) {
          return <Text color="gray.500" fontSize="sm">Não atribuído</Text>;
        }
        return (
          <Flex align="center" gap={2}>
            <Avatar size="sm" src={motoqueiroUser.fotoPerfil} name={`${motoqueiroUser.nome || ""} ${motoqueiroUser.sobrenome || ""}`} />
            <Text>{motoqueiroUser.nome || "N/A"} {motoqueiroUser.sobrenome || ""}</Text>
          </Flex>
        );
      },
    },
    {
      header: "Status",
      render: (p: any) => (
        <Tag colorScheme={statusColor[p.status] || "gray"} size="sm">
          <TagLeftIcon as={RiCircleFill} />
          <TagLabel>{statusLabel[p.status] || p.status}</TagLabel>
        </Tag>
      ),
    },
    {
      header: "",
      render: () => (
        <IconButton variant="ghost" aria-label="Ver detalhes" icon={<BsThreeDots />} />
      ),
    },
  ];

  return (
    <Box
      p={6} display="flex" gap={6} flexDirection="column" mb={8}
      bg="bg.card" border="2px" borderColor="border.default" rounded="lg"
    >
      <TableHeader title="Últimas Entregas" isLoad={isFetching} />
      <TableComponent data={pedidos || []} columns={columns} />
      <Pagination />
    </Box>
  );
}
