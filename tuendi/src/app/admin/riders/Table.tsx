"use client";
import {
  Box, IconButton, Tag, TagLeftIcon, TagLabel,
  useDisclosure, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalBody, ModalFooter, Button,
  Text, Flex, Avatar, Divider, Select, Stack,
  Input, InputGroup, InputLeftElement,
  HStack, SimpleGrid, AvatarBadge, Center, Spinner,
} from "@chakra-ui/react";
import { TableComponent } from "@/components/UI/Table/Table";
import { TableHeader } from "@/components/UI/Table/TableHeader";
import { Pagination } from "@/components/UI/Table/Pagination";
import { BsThreeDots } from "react-icons/bs";
import { RiCircleFill, RiSearchLine } from "react-icons/ri";
import { useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RidersContext } from "@/contexts/RidersContext";

const statusColor: Record<string, string> = {
  pendente_aprovacao: "yellow",
  activo: "cyan",
  suspenso: "red",
  eliminado: "gray",
};

const statusLabel: Record<string, string> = {
  pendente_aprovacao: "Pendente",
  activo: "Activo",
  suspenso: "Suspenso",
  eliminado: "Eliminado",
};

const disponibilidadeColor: Record<string, string> = {
  online: "green",
  offline: "gray",
  ocupado: "purple",
};

const disponibilidadeLabel: Record<string, string> = {
  online: "Online",
  offline: "Offline",
  ocupado: "Ocupado",
};

export function RidersTable() {
  const router = useRouter();
  const { riders, updateStatus, page, setPage, total, isFetching, isLoading } = useContext(RidersContext);
  const [selected, setSelected] = useState<any>(null);
  const [filter, setFilter] = useState<string>("TODOS");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"recentes" | "avaliacao">("recentes");
  const [dispFilter, setDispFilter] = useState<"TODOS" | string>("TODOS");

  const filtered = useMemo(() => {
    let result = filter === "TODOS" ? riders : riders.filter((r: any) => r.status === filter);
    if (dispFilter !== "TODOS") {
      result = result.filter((r: any) => r.statusDisponibilidade === dispFilter);
    }
    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter((r: any) =>
        `${r.user?.nome || ""} ${r.user?.sobrenome || ""}`.toLowerCase().includes(term) ||
        (r.user?.email || "").toLowerCase().includes(term)
      );
    }
    if (sortBy === "avaliacao") {
      result = [...result].sort((a: any, b: any) => (b.classificacaoMedia || 0) - (a.classificacaoMedia || 0));
    } else {
      result = [...result].sort((a: any, b: any) =>
        new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
      );
    }
    return result;
  }, [riders, filter, dispFilter, search, sortBy]);

  function openModal(rider: any) { setSelected(rider); onOpen(); }

  // Helper para aceder ao veículo (backend retorna veiculos array)
  function getVeiculo(r: any) {
    return r.veiculos?.[0] || r.veiculo || null;
  }

  const columns = [
    {
      header: "Nome",
      render: (r: any) => (
        <Flex align="center" gap={2}>
          <Avatar size="sm" src={r.user?.fotoPerfil} name={`${r.user?.nome || ""} ${r.user?.sobrenome || ""}`}>
            <AvatarBadge boxSize="1em" bg={disponibilidadeColor[r.statusDisponibilidade] || "gray"} />
          </Avatar>
          <Text>{r.user?.nome} {r.user?.sobrenome}</Text>
        </Flex>
      ),
    },
    { header: "E-mail", render: (r: any) => <Text>{r.user?.email}</Text> },
    { header: "Matrícula", render: (r: any) => <Text>{getVeiculo(r)?.matricula || getVeiculo(r)?.placa || "—"}</Text> },
    {
      header: "Veículo",
      render: (r: any) => {
        const v = getVeiculo(r);
        return <Text>{v ? `${v.marca || ""} ${v.modelo || ""}` : "—"}</Text>;
      },
    },
    {
      header: "Data",
      render: (r: any) => (
        <Text>{new Date(r.criadoEm).toLocaleDateString("pt-PT", { timeZone: "UTC" })}</Text>
      ),
    },
    { header: "Avaliação", render: (r: any) => <Text>{r.classificacaoMedia || 0} ⭐</Text> },
    {
      header: "Status",
      render: (r: any) => (
        <Tag colorScheme={statusColor[r.status] || "gray"} size="sm">
          <TagLeftIcon as={RiCircleFill} />
          <TagLabel>{statusLabel[r.status] || r.status}</TagLabel>
        </Tag>
      ),
    },
    {
      header: "",
      render: (r: any) => (
        <IconButton variant="ghost" aria-label="Ver detalhes" icon={<BsThreeDots />} onClick={() => openModal(r)} />
      ),
    },
  ];

  return (
    <>
      <Box p={6} display="flex" gap={6} flexDirection="column" mb={8} overflowX="auto" bg="bg.card" border="2px" borderColor="border.default" rounded="lg">
        <Stack gap={4}>
          <TableHeader title="Entregadores" isLoad={isFetching} />
          <Flex justify="space-between" align="center" gap={4} wrap="wrap">
            <InputGroup maxW="280px" size="sm" bg="bg.default">
              <InputLeftElement pointerEvents="none"><RiSearchLine color="gray" /></InputLeftElement>
              <Input placeholder="Pesquisar por nome ou email..." rounded="md" bg="bg.default" value={search} onChange={(e) => setSearch(e.target.value)} />
            </InputGroup>
            <Flex gap={3} align="center" wrap="wrap">
              <Select bg="bg.default" w="fit-content" size="sm" rounded="md" value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="TODOS">Todos os status</option>
                <option value="pendente_aprovacao">Pendentes</option>
                <option value="activo">Activos</option>
                <option value="suspenso">Suspensos</option>
              </Select>
              <Select bg="bg.default" w="fit-content" size="sm" rounded="md" value={dispFilter} onChange={(e) => setDispFilter(e.target.value)}>
                <option value="TODOS">Disponibilidade</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="ocupado">Ocupado</option>
              </Select>
              <Select bg="bg.default" w="fit-content" size="sm" rounded="md" value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
                <option value="recentes">Mais recentes</option>
                <option value="avaliacao">Melhor avaliação</option>
              </Select>
            </Flex>
          </Flex>
        </Stack>
        {isLoading ? <Center><Spinner size="xl"/></Center> : <TableComponent data={filtered} columns={columns} onOpenModal={openModal} />}
        <Pagination totalCountRegister={total} currentPage={page} onPageChange={setPage} registersPerPage={10} />
      </Box>

      {selected && (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
          <ModalOverlay />
          <ModalContent bg="bg.secondary">
            <ModalHeader display="flex" justifyContent="space-between" alignItems="center">
              <HStack gap={3}>
                <Text>{selected.user?.nome} {selected.user?.sobrenome}</Text>
                <Tag colorScheme={statusColor[selected.status] || "gray"} size="sm">
                  <TagLeftIcon as={RiCircleFill} />
                  <TagLabel>{statusLabel[selected.status] || selected.status}</TagLabel>
                </Tag>
              </HStack>
              <Button size="sm" variant="outline" onClick={() => { onClose(); router.push(`/admin/riders/viewMore?id=${selected.id}`); }}>
                Ver mais
              </Button>
            </ModalHeader>

            <ModalBody display="flex" flexDirection="column" gap={4}>
              <Flex gap={4} align="center">
                <Avatar size="xl" src={selected.user?.fotoPerfil} name={`${selected.user?.nome || ""} ${selected.user?.sobrenome || ""}`} />
                <Box>
                  <Text fontSize="sm" color="text.secondary">E-mail</Text>
                  <Text>{selected.user?.email}</Text>
                  <Text fontSize="sm" color="text.secondary" mt={2}>Telefone</Text>
                  <Text>{selected.user?.telefone}</Text>
                  <Text fontSize="sm" color="text.secondary" mt={2}>Data de nascimento</Text>
                  <Text>{selected.user?.dataNascimento ? new Date(selected.user.dataNascimento).toLocaleDateString("pt-PT", { timeZone: "UTC" }) : "—"}</Text>
                </Box>
              </Flex>

              <Divider />

              <SimpleGrid columns={3} gap={3}>
                <Box bg="bg.hover" rounded="lg" p={3} textAlign="center">
                  <Text fontSize="xs" color="text.secondary" mb={1}>Avaliação</Text>
                  <Text fontWeight="bold" fontSize="lg">{selected.classificacaoMedia || 0} ⭐</Text>
                </Box>
                <Box bg="bg.hover" rounded="lg" p={3} textAlign="center">
                  <Text fontSize="xs" color="text.secondary" mb={1}>Avaliações</Text>
                  <Text fontWeight="bold" fontSize="lg">{selected.totalAvaliacoes || 0}</Text>
                </Box>
                <Box bg="bg.hover" rounded="lg" p={3} textAlign="center">
                  <Text fontSize="xs" color="text.secondary" mb={1}>Disponibilidade</Text>
                  <Tag colorScheme={disponibilidadeColor[selected.statusDisponibilidade] || "gray"} size="sm">
                    <TagLabel>{disponibilidadeLabel[selected.statusDisponibilidade] || selected.statusDisponibilidade}</TagLabel>
                  </Tag>
                </Box>
              </SimpleGrid>

              <Divider />

              <Box>
                <Text fontWeight="bold" mb={2}>Documento</Text>
                <Text fontSize="sm" color="text.secondary">
                  {selected.user?.tipoDocumento}: {selected.user?.numeroDocumento}
                </Text>
              </Box>

              {getVeiculo(selected) && (
                <Box>
                  <Text fontWeight="bold" mb={2}>Veículo</Text>
                  <Text fontSize="sm" color="text.secondary">
                    {getVeiculo(selected).marca} {getVeiculo(selected).modelo} — Ano {getVeiculo(selected).ano}
                  </Text>
                  <HStack gap={2} mt={1}>
                    <Text fontSize="sm" color="text.secondary">Cor:</Text>
                    <Box w="14px" h="14px" rounded="full" bg={getVeiculo(selected).cor || getVeiculo(selected).corPrincipal} border="1px solid" borderColor="whiteAlpha.300" />
                    <Text fontSize="sm" color="text.secondary" textTransform="capitalize">
                      {getVeiculo(selected).cor || getVeiculo(selected).corPrincipal}
                    </Text>
                  </HStack>
                  <Text fontSize="sm" color="text.secondary" mt={1}>
                    Matrícula: {getVeiculo(selected).matricula || getVeiculo(selected).placa}
                  </Text>
                </Box>
              )}
            </ModalBody>

            <ModalFooter gap={3}>
              {selected.user?.status !== "eliminado" && (
                <>
                  <Button colorScheme="red" variant="ghost" size="sm" onClick={() => { onClose(); updateStatus(selected.id, "eliminar"); }}>
                    Eliminar
                  </Button>
                  {selected.status === "pendente_aprovacao" && (
                    <>
                      <Button colorScheme="red" variant="outline" size="sm" onClick={() => { onClose(); updateStatus(selected.id, "rejeitar"); }}>
                        Rejeitar
                      </Button>
                      <Button colorScheme="cyan" size="sm" onClick={() => { onClose(); updateStatus(selected.id, "aprovar"); }}>
                        Aprovar
                      </Button>
                    </>
                  )}
                  {selected.status === "suspenso" && (
                    <Button colorScheme="cyan" variant="outline" size="sm" onClick={() => { onClose(); updateStatus(selected.id, "ativar"); }}>
                      Activar
                    </Button>
                  )}
                  {selected.status === "activo" && (
                    <Button colorScheme="red" variant="outline" size="sm" onClick={() => { onClose(); updateStatus(selected.id, "suspender"); }}>
                      Suspender
                    </Button>
                  )}
                </>
              )}
              <Button size="sm" onClick={onClose}>Fechar</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </>
  );
}
