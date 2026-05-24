"use client";

import {
  Box, Stack, Text, HStack, Button, Tag, TagLabel,
  TagLeftIcon, Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  Avatar, Spinner, Center, Badge, Divider, Flex,
  Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalBody, ModalFooter, useDisclosure, Textarea,
  Input, InputGroup, InputLeftElement, Select,
  SimpleGrid, useToast, VStack,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import { PlanoStatus } from "@/contexts/EarningsContext";
import { MdOutlineKeyboardDoubleArrowRight } from "react-icons/md";
import { RiCircleFill, RiSearchLine, RiCheckLine, RiCloseLine, RiImageLine } from "react-icons/ri";
import { ResponsiveLayout } from "@/components/UI/ResponsiveLayout";

interface PlanoComprovativo {
  id: string;
  tipo: string;
  valor: number;
  status: PlanoStatus;
  ativoEm: string | null;
  expiraEm: string | null;
  criadoEm: string;
  comprovativoMime: string | null;
  motivoRejeicao: string | null;
  user?: {
    id: string;
    nome: string;
    sobrenome: string;
    email: string;
    telefone: string;
    fotoPerfil: string | null;
    fotoPerfilUrl: string | null;
  };
}

const statusColor: Record<string, string> = {
  pendente: "yellow",
  ativo: "green",
  rejeitado: "red",
  expirado: "gray",
};

const statusLabel: Record<string, string> = {
  pendente: "Pendente",
  ativo: "Aprovado",
  rejeitado: "Rejeitado",
  expirado: "Expirado",
};

const planoColor: Record<string, string> = {
  diario: "cyan",
  semanal: "purple",
  mensal: "blue",
};

export default function PayoutsPage() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [planos, setPlanos] = useState<PlanoComprovativo[]>([]);
  const [selected, setSelected] = useState<PlanoComprovativo | null>(null);
  const [loading, setLoading] = useState(true);
  const [motivoRejeicao, setMotivoRejeicao] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("TODOS");
  const [planoFilter, setPlanoFilter] = useState<string>("TODOS");
  const toast = useToast();

  useEffect(() => {
    api.get("/planos/admin/todos")
      .then((res) => setPlanos(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function openModal(s: PlanoComprovativo) {
    setSelected(s);
    setMotivoRejeicao("");
    onOpen();
  }

  async function aprovarComprovativo(id: string) {
    try {
      await api.patch(`/planos/${id}/aprovar`);
      setPlanos((prev) =>
        prev.map((p) => p.id === id ? { ...p, status: "ativo" as PlanoStatus, ativoEm: new Date().toISOString() } : p)
      );
      toast({ title: "Plano aprovado com sucesso!", status: "success", duration: 3000 });
      onClose();
    } catch (err: any) {
      toast({ title: "Erro ao aprovar", description: err.response?.data?.message, status: "error" });
    }
  }

  async function rejeitarComprovativo(id: string) {
    if (!motivoRejeicao.trim()) {
      toast({ title: "Indica o motivo da rejeicao", status: "warning" });
      return;
    }
    try {
      await api.patch(`/planos/${id}/rejeitar`, { motivo: motivoRejeicao });
      setPlanos((prev) =>
        prev.map((p) => p.id === id ? { ...p, status: "rejeitado" as PlanoStatus, motivoRejeicao } : p)
      );
      toast({ title: "Plano rejeitado", status: "info", duration: 3000 });
      onClose();
    } catch (err: any) {
      toast({ title: "Erro ao rejeitar", description: err.response?.data?.message, status: "error" });
    }
  }

  const comprovativosUrl = (planoId: string) => `${api.defaults.baseURL}/planos/${planoId}/comprovativo`;

  const pendentes = useMemo(() => planos.filter((s) => s.status === "pendente").length, [planos]);
  const aprovados = useMemo(() => planos.filter((s) => s.status === "ativo").length, [planos]);
  const rejeitados = useMemo(() => planos.filter((s) => s.status === "rejeitado").length, [planos]);

  const filtered = useMemo(() => {
    let result = [...planos];
    if (statusFilter !== "TODOS") result = result.filter((s) => s.status === statusFilter);
    if (planoFilter !== "TODOS") result = result.filter((s) => s.tipo === planoFilter);
    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter((s) => {
        const u = s.user;
        if (!u) return false;
        return `${u.nome} ${u.sobrenome}`.toLowerCase().includes(term) ||
          u.email?.toLowerCase().includes(term) ||
          u.telefone?.toLowerCase().includes(term);
      });
    }
    return result.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }, [planos, statusFilter, planoFilter, search]);

  if (loading) return <ResponsiveLayout><Center h="100vh"><Spinner size="xl" /></Center></ResponsiveLayout>;

  return (
    <ResponsiveLayout>
    <Box as="main" w="100%" display="flex" flexDirection="column" gap={6}>
      {/* Header */}
      <Stack alignSelf="flex-start">
        <Text lineHeight={1} fontSize={{ base: "2xl", md: "3xl" }} fontWeight="thin" color="text.primary">Comprovativos</Text>
        <Breadcrumb spacing="8px" separator={<MdOutlineKeyboardDoubleArrowRight color="gray.500" />}>
          <BreadcrumbItem>
            <BreadcrumbLink fontSize="xs" color="text.primary" textTransform="uppercase" href="#">Main Admin</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink fontSize="xs" href="/admin/earnings">Ganhos</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink fontSize="xs" href="/admin/earnings/payouts">Comprovativos</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
      </Stack>

      {/* Summary Cards */}
      <SimpleGrid columns={{ base: 1, sm: 3 }} gap={4}>
        <Box bg="bg.card" border="1px solid" borderColor="border.default" rounded="lg" p={4}>
          <HStack justify="space-between">
            <Text fontSize="sm" color="text.secondary">Pendentes</Text>
            <Box w={2} h={2} rounded="full" bg="yellow.400" />
          </HStack>
          <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" mt={1}>{pendentes}</Text>
        </Box>
        <Box bg="bg.card" border="1px solid" borderColor="border.default" rounded="lg" p={4}>
          <HStack justify="space-between">
            <Text fontSize="sm" color="text.secondary">Aprovados</Text>
            <Box w={2} h={2} rounded="full" bg="green.400" />
          </HStack>
          <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" mt={1}>{aprovados}</Text>
        </Box>
        <Box bg="bg.card" border="1px solid" borderColor="border.default" rounded="lg" p={4}>
          <HStack justify="space-between">
            <Text fontSize="sm" color="text.secondary">Rejeitados</Text>
            <Box w={2} h={2} rounded="full" bg="red.400" />
          </HStack>
          <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" mt={1}>{rejeitados}</Text>
        </Box>
      </SimpleGrid>

      {/* Main Card */}
      <Box bg="bg.card" border="1px solid" borderColor="border.default" rounded="lg" p={{ base: 4, md: 6 }}>
        <Stack gap={4}>
          <Text fontWeight="semibold" fontSize="lg">Comprovativos de Pagamento</Text>

          {/* Filters */}
          <Stack direction={{ base: "column", md: "row" }} gap={3} align={{ base: "stretch", md: "center" }}>
            <InputGroup maxW={{ base: "100%", md: "280px" }} size="sm">
              <InputLeftElement pointerEvents="none"><RiSearchLine color="gray" /></InputLeftElement>
              <Input placeholder="Pesquisar..." bg="bg.default" rounded="md" value={search} onChange={(e) => setSearch(e.target.value)} />
            </InputGroup>
            <HStack gap={3} flexWrap="wrap">
              <Select size="sm" rounded="md" bg="bg.default" w="fit-content" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="TODOS">Todos os status</option>
                <option value="pendente">Pendentes</option>
                <option value="ativo">Aprovados</option>
                <option value="rejeitado">Rejeitados</option>
              </Select>
              <Select size="sm" rounded="md" bg="bg.default" w="fit-content" value={planoFilter} onChange={(e) => setPlanoFilter(e.target.value)}>
                <option value="TODOS">Todos os planos</option>
                <option value="diario">Diario</option>
                <option value="semanal">Semanal</option>
                <option value="mensal">Mensal</option>
              </Select>
            </HStack>
          </Stack>
        </Stack>

        {/* List */}
        <VStack gap={3} mt={4} align="stretch">
          {filtered.length === 0 ? (
            <Center py={12}><Text fontSize="sm" color="text.muted">Nenhum comprovativo encontrado.</Text></Center>
          ) : (
            filtered.map((s) => {
              const u = s.user;
              return (
                <Box
                  key={s.id}
                  p={{ base: 3, md: 4 }}
                  bg="bg.hover" rounded="lg" border="1px solid" borderColor="border.default"
                  _hover={{ borderColor: "border.subtle" }} transition="all 0.15s" cursor="pointer"
                  onClick={() => openModal(s)}
                >
                  {/* Top row: avatar + status */}
                  <Flex justify="space-between" align="center" mb={3}>
                    <HStack gap={3} minW={0} flex={1}>
                      <Avatar size="sm" flexShrink={0} src={u?.fotoPerfilUrl ?? u?.fotoPerfil ?? undefined} name={u ? `${u.nome} ${u.sobrenome}` : "Utilizador"} />
                      <Box minW={0}>
                        <Text fontSize="sm" fontWeight="medium" noOfLines={1}>{u ? `${u.nome} ${u.sobrenome}` : "Utilizador desconhecido"}</Text>
                        <Text fontSize="xs" color="text.secondary" noOfLines={1}>{u?.email ?? ""}</Text>
                      </Box>
                    </HStack>
                    <Tag colorScheme={statusColor[s.status] || 'gray'} size="sm" flexShrink={0}>
                      <TagLeftIcon as={RiCircleFill} /><TagLabel>{statusLabel[s.status] || s.status}</TagLabel>
                    </Tag>
                  </Flex>
                  {/* Bottom row: plan + value */}
                  <Flex justify="space-between" align="center">
                    <Tag colorScheme={planoColor[s.tipo] || 'gray'} size="sm">
                      <TagLabel textTransform="capitalize">{s.tipo}</TagLabel>
                    </Tag>
                    <Text fontSize="sm" fontWeight="bold" color="cyan.400">{Number(s.valor).toLocaleString("pt-PT")} Kz</Text>
                  </Flex>
                </Box>
              );
            })
          )}
        </VStack>
      </Box>

      {/* Modal */}
      {selected && (
        <Modal isOpen={isOpen} onClose={onClose} size={{ base: "full", md: "xl" }}>
          <ModalOverlay />
          <ModalContent bg="bg.card" border={{ base: "none", md: "1px solid" }} borderColor="border.default" m={{ base: 0, md: 4 }}>
            <ModalHeader>
              <Flex justify="space-between" align="center" gap={2}>
                <Text fontSize={{ base: "md", md: "lg" }}>Comprovativo de Pagamento</Text>
                <Tag colorScheme={statusColor[selected.status] || 'gray'} size="sm" flexShrink={0}>
                  <TagLeftIcon as={RiCircleFill} /><TagLabel>{statusLabel[selected.status]}</TagLabel>
                </Tag>
              </Flex>
            </ModalHeader>
            <ModalBody display="flex" flexDirection="column" gap={4}>
              {/* User info */}
              <Box bg="bg.hover" rounded="lg" p={4} border="1px solid" borderColor="border.default">
                <Text fontSize="xs" color="text.muted" mb={3} textTransform="uppercase" letterSpacing="wide">Utilizador</Text>
                <Stack direction={{ base: "column", sm: "row" }} justify="space-between" align={{ base: "flex-start", sm: "center" }} gap={3}>
                  <HStack gap={3}>
                    <Avatar size="md" src={selected.user?.fotoPerfilUrl ?? selected.user?.fotoPerfil ?? undefined} name={selected.user ? `${selected.user.nome} ${selected.user.sobrenome}` : "Utilizador"} />
                    <Box>
                      <Text fontWeight="medium">{selected.user ? `${selected.user.nome} ${selected.user.sobrenome}` : "N/A"}</Text>
                      <Text fontSize="sm" color="text.secondary">{selected.user?.email ?? "N/A"}</Text>
                      <Text fontSize="sm" color="text.secondary">{selected.user?.telefone ?? "N/A"}</Text>
                    </Box>
                  </HStack>
                  <Box textAlign={{ base: "left", sm: "right" }}>
                    <Tag colorScheme={planoColor[selected.tipo] || 'gray'} size="sm" mb={2}><TagLabel textTransform="capitalize">Plano {selected.tipo}</TagLabel></Tag>
                    <Text fontSize="xl" fontWeight="bold" color="cyan.400">{Number(selected.valor).toLocaleString("pt-PT")} Kz</Text>
                  </Box>
                </Stack>
              </Box>

              <Divider borderColor="border.default" />

              {/* Comprovativo image */}
              <Box>
                <Text fontSize="xs" color="text.muted" mb={3} textTransform="uppercase" letterSpacing="wide">Comprovativo</Text>
                {selected.comprovativoMime ? (
                  <Box rounded="lg" overflow="hidden" border="1px solid" borderColor="border.default" bg="bg.hover">
                    <Box as="img" src={comprovativosUrl(selected.id)} alt="Comprovativo" w="100%" maxH={{ base: "250px", md: "350px" }} objectFit="contain" />
                  </Box>
                ) : (
                  <Center py={8} bg="bg.hover" rounded="lg" border="1px solid" borderColor="border.default">
                    <HStack><RiImageLine /><Text fontSize="sm" color="text.muted">Nenhum comprovativo submetido.</Text></HStack>
                  </Center>
                )}
              </Box>

              {/* Rejection reason (existing) */}
              {selected.motivoRejeicao && (
                <Box p={3} bg="red.900" rounded="lg" border="1px solid" borderColor="red.700">
                  <Text fontSize="xs" color="red.300" mb={1} fontWeight="bold">Motivo de rejeicao</Text>
                  <Text fontSize="sm" color="red.200">{selected.motivoRejeicao}</Text>
                </Box>
              )}

              {/* Rejection reason (input) */}
              {selected.status === "pendente" && (
                <Box>
                  <Text fontSize="xs" color="text.muted" mb={2} textTransform="uppercase" letterSpacing="wide">Motivo de rejeicao</Text>
                  <Textarea placeholder="Ex: Comprovativo ilegivel, valor incorrecto..." bg="bg.default" border="1px solid" borderColor="border.default" rounded="lg" size="sm" resize="none" rows={3} value={motivoRejeicao} onChange={(e) => setMotivoRejeicao(e.target.value)} />
                </Box>
              )}
            </ModalBody>
            <ModalFooter gap={3} flexWrap="wrap">
              <Button size="sm" variant="ghost" onClick={onClose}>Fechar</Button>
              {selected.status === "pendente" && selected.comprovativoMime && (
                <>
                  <Button size="sm" colorScheme="red" variant="outline" leftIcon={<RiCloseLine />} isDisabled={!motivoRejeicao.trim()} onClick={() => rejeitarComprovativo(selected.id)}>Rejeitar</Button>
                  <Button size="sm" colorScheme="green" leftIcon={<RiCheckLine />} onClick={() => aprovarComprovativo(selected.id)}>Aprovar</Button>
                </>
              )}
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Box>
    </ResponsiveLayout>
  );
}
