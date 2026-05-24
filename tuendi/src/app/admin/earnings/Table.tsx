"use client";
import {
  Box, Tag, TagLeftIcon, TagLabel, IconButton,
  Flex, Stack, Select, Input, InputGroup,
  InputLeftElement, Avatar, Text, HStack,
  useDisclosure, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalBody, ModalFooter, Button,
  SimpleGrid, Badge, useToast,
  Center, Spinner, Textarea,
} from "@chakra-ui/react";
import { TableComponent } from "@/components/UI/Table/Table";
import { TableHeader } from "@/components/UI/Table/TableHeader";
import { Pagination } from "@/components/UI/Table/Pagination";
import { BsThreeDots } from "react-icons/bs";
import { RiCircleFill, RiSearchLine } from "react-icons/ri";
import { useContext, useState } from "react";
import { EarningsContext } from "@/contexts/EarningsContext";
import { api } from "@/services/api";
import type { Plano, PlanoStatus, PlanoTipo } from "@/contexts/EarningsContext";

const statusColor: Record<PlanoStatus, string> = {
  pendente: "yellow",
  ativo: "green",
  rejeitado: "red",
  expirado: "gray",
};

const statusLabel: Record<PlanoStatus, string> = {
  pendente: "Pendente",
  ativo: "Activo",
  rejeitado: "Rejeitado",
  expirado: "Expirado",
};

const planoColor: Record<string, string> = {
  diario: "cyan",
  semanal: "purple",
  mensal: "blue",
};

export function EarningsTable() {
  const { subscricoes, page, setPage, total, isFetching, isLoading, refetch, filtrarPlanos } = useContext(EarningsContext);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selected, setSelected] = useState<Plano | null>(null);
  const [search, setSearch] = useState("");
  const [planoFilter, setPlanoFilter] = useState<string>("TODOS");
  const [statusFilter, setStatusFilter] = useState<string>("TODOS");
  const [sortBy, setSortBy] = useState<"recentes" | "valor">("recentes");
  const [motivoRejeicao, setMotivoRejeicao] = useState("");
  const toast = useToast();

  function openModal(s: Plano) {
    setSelected(s);
    setMotivoRejeicao("");
    onOpen();
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    filtrarPlanos({
      tipo: planoFilter !== "TODOS" ? planoFilter : undefined,
      status: statusFilter !== "TODOS" ? statusFilter : undefined,
      search: value.trim() || undefined,
    });
  }

  function handlePlanoFilterChange(value: string) {
    setPlanoFilter(value);
    filtrarPlanos({
      tipo: value !== "TODOS" ? value : undefined,
      status: statusFilter !== "TODOS" ? statusFilter : undefined,
      search: search.trim() || undefined,
    });
  }

  function handleStatusFilterChange(value: string) {
    setStatusFilter(value);
    filtrarPlanos({
      tipo: planoFilter !== "TODOS" ? planoFilter : undefined,
      status: value !== "TODOS" ? value : undefined,
      search: search.trim() || undefined,
    });
  }

  const sorted = [...(subscricoes || [])].sort((a, b) => {
    if (sortBy === "valor") return Number(b.valor) - Number(a.valor);
    return new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime();
  });

  async function handleAprovar(id: string) {
    try {
      await api.patch(`/planos/${id}/aprovar`);
      toast({ title: "Plano aprovado!", status: "success", duration: 3000 });
      onClose();
      refetch();
    } catch (err: any) {
      toast({ title: "Erro", description: err.response?.data?.message, status: "error" });
    }
  }

  async function handleRejeitar(id: string) {
    if (!motivoRejeicao.trim()) {
      toast({ title: "Indica o motivo da rejeição", status: "warning" });
      return;
    }
    try {
      await api.patch(`/planos/${id}/rejeitar`, { motivo: motivoRejeicao });
      toast({ title: "Plano rejeitado", status: "info", duration: 3000 });
      onClose();
      refetch();
    } catch (err: any) {
      toast({ title: "Erro", description: err.response?.data?.message, status: "error" });
    }
  }

  const columns = [
    {
      header: "Utilizador",
      render: (s: any) => {
        const u = s.user ?? {} as any;
        return (
        <Flex align="center" gap={2}>
          <Avatar
            size="sm"
            src={u.fotoPerfil || u.fotoPerfilUrl}
            name={`${u.nome || ''} ${u.sobrenome || ''}`}
          />
          <Text noOfLines={1}>{u.nome || 'N/A'} {u.sobrenome || ''}</Text>
        </Flex>
      )},
    },
    {
      header: "Plano",
      render: (s: any) => (
        <Tag colorScheme={planoColor[s.tipo] || 'gray'} size="sm">
          <TagLabel textTransform="capitalize">{s.tipo}</TagLabel>
        </Tag>
      ),
    },
    {
      header: "Valor",
      render: (s: any) => (
        <Text fontWeight="bold" color="cyan.400">
          {Number(s.valor || 0).toLocaleString("pt-PT")} Kz
        </Text>
      ),
    },
    {
      header: "Status",
      render: (s: Plano) => (
        <Tag colorScheme={statusColor[s.status] || 'gray'} size="sm">
          <TagLeftIcon as={RiCircleFill} color={`${statusColor[s.status]}.500`} />
          <TagLabel>{statusLabel[s.status] || s.status}</TagLabel>
        </Tag>
      ),
    },
    {
      header: "Início",
      render: (s: Plano) => (
        <Text fontSize="sm">{s.ativoEm ? new Date(s.ativoEm).toLocaleDateString("pt-PT") : '-'}</Text>
      ),
    },
    {
      header: "Expira",
      render: (s: Plano) => (
        <Text fontSize="sm">{s.expiraEm ? new Date(s.expiraEm).toLocaleDateString("pt-PT") : '-'}</Text>
      ),
    },
    {
      header: "",
      render: (s: any) => (
        <IconButton
          variant="ghost"
          aria-label="Ver detalhes"
          icon={<BsThreeDots />}
          onClick={() => openModal(s)}
        />
      ),
    },
  ];

  return (
    <>
      <Box
        p={6} display="flex" gap={6} flexDirection="column" mb={8}
        bg="bg.card" border="2px" borderColor="border.default" rounded="lg"
        overflowX="auto"
      >
        <Stack gap={4}>
          <TableHeader title="Histórico de Subscrições" isLoad={isFetching} />

          <Flex justify="space-between" align="center" gap={4} wrap="wrap">
            <InputGroup maxW="280px" size="sm" bg={"bg.default"}>
              <InputLeftElement pointerEvents="none">
                <RiSearchLine color="gray" />
              </InputLeftElement>
              <Input
                placeholder="Pesquisar por nome ou email..."
                rounded="md"
                bg={"bg.default"}
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </InputGroup>

            <Flex gap={3} wrap="wrap">
              <Select
                bg={"bg.default"}
                w="fit-content" size="sm" rounded="md"
                value={planoFilter}
                onChange={(e) => handlePlanoFilterChange(e.target.value)}
              >
                <option value="TODOS">Todos os planos</option>
                <option value="diario">Diário</option>
                <option value="semanal">Semanal</option>
                <option value="mensal">Mensal</option>
              </Select>

              <Select
                bg={"bg.default"}
                w="fit-content" size="sm" rounded="md"
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
              >
                <option value="TODOS">Todos os status</option>
                <option value="pendente">Pendentes</option>
                <option value="ativo">Activos</option>
                <option value="rejeitado">Rejeitados</option>
                <option value="expirado">Expirados</option>
              </Select>

              <Select
                bg={"bg.default"}
                w="fit-content" size="sm" rounded="md"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              >
                <option value="recentes">Mais recentes</option>
                <option value="valor">Maior valor</option>
              </Select>
            </Flex>
          </Flex>
        </Stack>

        {isLoading ? <Center><Spinner size={"xl"}/></Center> : <TableComponent data={sorted} columns={columns} onOpenModal={openModal} />}
        <Pagination totalCountRegister={total} currentPage={page} registersPerPage={10} onPageChange={setPage} />
      </Box>

      {/* Modal */}
      {selected && (
        <Modal isOpen={isOpen} onClose={onClose} size="md">
          <ModalOverlay />
          <ModalContent bg="grayDark.700">
            <ModalHeader display="flex" justifyContent="space-between" alignItems="center">
              <Text>Detalhes da Subscrição</Text>
              <HStack>
                <Tag colorScheme={planoColor[selected.tipo] || 'gray'} size="sm">
                  <TagLabel textTransform="capitalize">{selected.tipo}</TagLabel>
                </Tag>
                <Tag colorScheme={statusColor[selected.status] || 'gray'} size="sm">
                  <TagLeftIcon as={RiCircleFill} />
                  <TagLabel>{statusLabel[selected.status] || selected.status}</TagLabel>
                </Tag>
              </HStack>
            </ModalHeader>

            <ModalBody display="flex" flexDirection="column" gap={4}>
              {(() => {
                const u = selected.user || {} as Record<string, any>;
                return (
              <Flex align="center" gap={3}>
                <Avatar
                  size="md"
                  src={u.fotoPerfil || u.fotoPerfilUrl}
                  name={`${u.nome || ''} ${u.sobrenome || ''}`}
                />
                <Box>
                  <Text fontWeight="bold">
                    {u.nome || 'N/A'} {u.sobrenome || ''}
                  </Text>
                  <Text fontSize="sm" color="gray.400">{u.email || 'N/A'}</Text>
                  <Text fontSize="sm" color="gray.400">{u.telefone || 'N/A'}</Text>
                </Box>
              </Flex>
                );
              })()}

              <SimpleGrid columns={2} gap={4}>
                <Box>
                  <Text fontSize="xs" color="gray.400">Valor</Text>
                  <Text fontWeight="bold" color="cyan.400" fontSize="lg">
                    {Number(selected.valor || 0).toLocaleString("pt-PT")} Kz
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.400">Plano</Text>
                  <Badge colorScheme={planoColor[selected.tipo] || 'gray'} textTransform="capitalize">
                    {selected.tipo}
                  </Badge>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.400">Início</Text>
                  <Text fontSize="sm">{selected.ativoEm ? new Date(selected.ativoEm).toLocaleDateString("pt-PT") : '-'}</Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.400">Expiração</Text>
                  <Text fontSize="sm">{selected.expiraEm ? new Date(selected.expiraEm).toLocaleDateString("pt-PT") : '-'}</Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.400">Registado em</Text>
                  <Text fontSize="sm">{new Date(selected.criadoEm).toLocaleDateString("pt-PT")}</Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.400">Status</Text>
                  <Badge colorScheme={statusColor[selected.status] || 'gray'}>
                    {statusLabel[selected.status] || selected.status}
                  </Badge>
                </Box>
              </SimpleGrid>

              {/* Botões de aprovar/rejeitar para planos pendentes */}
              {selected.status === 'pendente' && (
                <Box mt={2}>
                  <Text fontSize="sm" fontWeight="bold" mb={2}>Validar Pagamento</Text>
                  <HStack>
                    <Button
                      size="sm" colorScheme="green"
                      onClick={() => handleAprovar(selected.id)}
                    >
                      Aprovar
                    </Button>
                    <Button
                      size="sm" colorScheme="red" variant="outline"
                      onClick={() => handleRejeitar(selected.id)}
                    >
                      Rejeitar
                    </Button>
                  </HStack>
                  <Textarea
                    mt={2}
                    size="sm"
                    placeholder="Motivo da rejeição (se aplicável)..."
                    value={motivoRejeicao}
                    onChange={(e) => setMotivoRejeicao(e.target.value)}
                  />
                </Box>
              )}
            </ModalBody>

            <ModalFooter>
              <Button size="sm" onClick={onClose}>Fechar</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </>
  );
}
