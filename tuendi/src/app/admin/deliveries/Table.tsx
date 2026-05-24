"use client";
import {
  Box, Tag, TagLeftIcon, TagLabel, IconButton,
  Flex, Stack, Select, Input, InputGroup,
  InputLeftElement, Avatar, Text, HStack,
  useDisclosure, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalBody, ModalFooter, Button,
  Divider, SimpleGrid, Badge,
  Spinner,
  Center,
} from "@chakra-ui/react";
import { TableComponent } from "@/components/UI/Table/Table";
import { TableHeader } from "@/components/UI/Table/TableHeader";
import { Pagination } from "@/components/UI/Table/Pagination";
import { BsThreeDots } from "react-icons/bs";
import { RiCircleFill, RiSearchLine } from "react-icons/ri";
import { useContext, useMemo, useState } from "react";
import { DeliveriesContext } from "@/contexts/DeliveriesContext";

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

export function DeliveriesTable() {
  const { cancelarPedido, pedidos, page, setPage, total, isFetching, isLoading } = useContext(DeliveriesContext);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selected, setSelected] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("TODOS");
  const [sortBy, setSortBy] = useState<"recentes" | "valor">("recentes");

  function openModal(pedido: any) { setSelected(pedido); onOpen(); }

  const filtered = useMemo(() => {
    let result = [...(pedidos || [])];
    if (statusFilter !== "TODOS") result = result.filter((p) => p.status === statusFilter);
    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter((p) => {
        const u = p.cliente;
        const cn = u ? `${u.nome || ""} ${u.sobrenome || ""}`.toLowerCase() : "";
        return (p.numeroPedido || "").toLowerCase().includes(term) || cn.includes(term) || (p.destinoEndereco || "").toLowerCase().includes(term);
      });
    }
    if (sortBy === "valor") result.sort((a, b) => (b.valorEntrega || 0) - (a.valorEntrega || 0));
    else result.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
    return result;
  }, [pedidos, statusFilter, search, sortBy]);

  function getMotoqueiroUser(p: any) { return p.motoqueiro?.user || p.userDataMotoqueiro || null; }

  const columns = [
    { header: "Nº Pedido", render: (p: any) => <Text fontFamily="mono" fontSize="sm">{p.numeroPedido}</Text> },
    {
      header: "Cliente",
      render: (p: any) => {
        const u = p.cliente;
        return (
          <Flex align="center" gap={2}>
            <Avatar size="sm" src={u?.fotoPerfil} name={u ? `${u.nome || ""} ${u.sobrenome || ""}` : "N/A"} />
            <Text>{u?.nome || "N/A"} {u?.sobrenome || ""}</Text>
          </Flex>
        );
      },
    },
    {
      header: "Entregador",
      render: (p: any) => {
        const mu = getMotoqueiroUser(p);
        if (!mu) return <Text color="gray.500" fontSize="sm">Não atribuído</Text>;
        return (
          <Flex align="center" gap={2}>
            <Avatar size="sm" src={mu.fotoPerfil} name={`${mu.nome || ""} ${mu.sobrenome || ""}`} />
            <Text>{mu.nome || "N/A"} {mu.sobrenome || ""}</Text>
          </Flex>
        );
      },
    },
    { header: "Destino", render: (p: any) => <Text fontSize="sm" noOfLines={1} maxW="180px">{p.destinoEndereco || "—"}</Text> },
    { header: "Valor", render: (p: any) => <Text>{Number(p.valorEntrega || 0).toLocaleString("pt-AO")} Kz</Text> },
    {
      header: "Status",
      render: (p: any) => (
        <Tag colorScheme={statusColor[p.status] || "gray"} size="sm">
          <TagLeftIcon as={RiCircleFill} />
          <TagLabel>{statusLabel[p.status] || p.status}</TagLabel>
        </Tag>
      ),
    },
    { header: "Data", render: (p: any) => <Text fontSize="sm">{new Date(p.criadoEm).toLocaleDateString("pt-PT")}</Text> },
    { header: "", render: (p: any) => <IconButton variant="ghost" aria-label="Ver detalhes" icon={<BsThreeDots />} onClick={() => openModal(p)} /> },
  ];

  return (
    <>
      <Box p={6} display="flex" gap={6} flexDirection="column" mb={8} overflowX="auto" bg="bg.card" border="2px" borderColor="border.default" rounded="lg">
        <Stack gap={4}>
          <TableHeader title="Pedidos" isLoad={isFetching} />
          <Flex justify="space-between" align="center" gap={4} wrap="wrap">
            <InputGroup maxW="280px" size="sm" bg="bg.default">
              <InputLeftElement pointerEvents="none"><RiSearchLine color="gray" /></InputLeftElement>
              <Input placeholder="Nº pedido, cliente ou destino..." bg="bg.default" rounded="md" value={search} onChange={(e) => setSearch(e.target.value)} />
            </InputGroup>
            <Flex gap={3} wrap="wrap">
              <Select bg="bg.default" w="fit-content" size="sm" rounded="md" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="TODOS">Todos os status</option>
                <option value="a_procurar_motoqueiro">A procurar</option>
                <option value="motoqueiro_atribuido">Atribuído</option>
                <option value="a_caminho_recolha">A caminho</option>
                <option value="em_pausa">Em pausa</option>
                <option value="recolhido">Recolhido</option>
                <option value="entregando">A entregar</option>
                <option value="entregue">Entregue</option>
                <option value="cancelado">Cancelado</option>
              </Select>
              <Select bg="bg.default" w="fit-content" size="sm" rounded="md" value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
                <option value="recentes">Mais recentes</option>
                <option value="valor">Maior valor</option>
              </Select>
            </Flex>
          </Flex>
        </Stack>
        {isLoading ? <Center><Spinner size="xl"/></Center> : <TableComponent data={filtered} columns={columns} onOpenModal={openModal} />}
        <Pagination totalCountRegister={total} currentPage={page} registersPerPage={10} onPageChange={setPage} />
      </Box>

      {selected && (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent bg="bg.secondary">
            <ModalHeader display="flex" justifyContent="space-between" alignItems="center">
              <HStack gap={3}>
                <Text fontFamily="mono">{selected.numeroPedido}</Text>
                <Tag colorScheme={statusColor[selected.status] || "gray"} size="sm">
                  <TagLeftIcon as={RiCircleFill} />
                  <TagLabel>{statusLabel[selected.status] || selected.status}</TagLabel>
                </Tag>
              </HStack>
            </ModalHeader>
            <ModalBody display="flex" flexDirection="column" gap={5}>
              <Box bg="bg.hover" rounded="lg" p={4}>
                <SimpleGrid columns={2} gap={4}>
                  <Box><Text fontSize="xs" color="gray.400" mb={1}>Origem</Text><Text fontSize="sm">{selected.origemEndereco}</Text></Box>
                  <Box><Text fontSize="xs" color="gray.400" mb={1}>Destino</Text><Text fontSize="sm">{selected.destinoEndereco}</Text></Box>
                  <Box><Text fontSize="xs" color="gray.400" mb={1}>Valor</Text><Text fontSize="sm" fontWeight="bold">{Number(selected.valorEntrega || 0).toLocaleString("pt-AO")} Kz</Text></Box>
                  <Box><Text fontSize="xs" color="gray.400" mb={1}>Criado em</Text><Text fontSize="sm">{new Date(selected.criadoEm).toLocaleDateString("pt-PT")}</Text></Box>
                </SimpleGrid>
              </Box>
              <Divider />
              <Box>
                <Text fontWeight="bold" mb={3}>Cliente</Text>
                <Flex align="center" gap={3}>
                  <Avatar size="md" src={selected.cliente?.fotoPerfil} name={selected.cliente ? `${selected.cliente.nome || ""} ${selected.cliente.sobrenome || ""}` : "N/A"} />
                  <Box>
                    <Text>{selected.cliente?.nome || "N/A"} {selected.cliente?.sobrenome || ""}</Text>
                    <Text fontSize="sm" color="gray.400">{selected.cliente?.email}</Text>
                    <Text fontSize="sm" color="gray.400">{selected.cliente?.telefone}</Text>
                  </Box>
                </Flex>
              </Box>
              <Divider />
              <Box>
                <Text fontWeight="bold" mb={3}>Motoqueiro</Text>
                {(() => {
                  const mu = getMotoqueiroUser(selected);
                  if (!mu) return <Text color="gray.500" fontSize="sm">Nenhum motoqueiro atribuído.</Text>;
                  return (
                    <Flex align="center" gap={3}>
                      <Avatar size="md" src={mu.fotoPerfil} name={`${mu.nome || ""} ${mu.sobrenome || ""}`} />
                      <Box>
                        <Text>{mu.nome || "N/A"} {mu.sobrenome || ""}</Text>
                        <Text fontSize="sm" color="gray.400">{mu.email}</Text>
                        <Text fontSize="sm" color="gray.400">{mu.telefone}</Text>
                      </Box>
                    </Flex>
                  );
                })()}
              </Box>
            </ModalBody>
            <ModalFooter gap={3}>
              {selected.status !== "cancelado" && selected.status !== "entregue" && (
                <Button colorScheme="red" variant="outline" size="sm" onClick={() => {onClose(); cancelarPedido(selected.id)}}>Cancelar pedido</Button>
              )}
              <Button size="sm" onClick={onClose}>Fechar</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </>
  );
}
