"use client";

import {
  Box, Flex, Text, Avatar, Button, Input, Spinner, Center,
  IconButton, useToast, useDisclosure, Modal, ModalOverlay,
  ModalContent, ModalHeader, ModalBody, ModalFooter,
  InputGroup, InputLeftElement, Badge, SimpleGrid,
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, Stack,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { RiSendPlaneFill, RiSearchLine, RiDeleteBinLine, RiCheckDoubleLine, RiTimeLine, RiLoader4Line } from "react-icons/ri";
import { MdOutlineKeyboardDoubleArrowRight } from "react-icons/md";

interface Ticket {
  id: string;
  userId: string;
  assunto: string;
  mensagem: string;
  status: string;
  criadoEm: string;
  mensagensNaoLidas?: number;
  user?: { id: string; nome: string; sobrenome: string; fotoPerfil?: string; fotoPerfilUrl?: string };
}

interface Mensagem {
  id: string;
  ticketId: string;
  remetenteId: string;
  remetenteTipo: string;
  texto: string;
  lida: boolean;
  criadoEm: string;
  remetente?: { id: string; nome: string; sobrenome: string; fotoPerfil?: string; fotoPerfilUrl?: string };
}

type FilterTab = "todas" | "pendentes" | "em_resolucao" | "resolvidas" | "eliminar";

const filterTabs: { key: FilterTab; label: string; statuses: string[] }[] = [
  { key: "todas", label: "Todas", statuses: ["aberto", "em_analise", "resolvido", "fechado"] },
  { key: "pendentes", label: "Pendentes", statuses: ["aberto"] },
  { key: "em_resolucao", label: "Em Resolução", statuses: ["em_analise"] },
  { key: "resolvidas", label: "Resolvidas", statuses: ["resolvido", "fechado"] },
  { key: "eliminar", label: "Eliminar", statuses: [] },
];

const statusLabelMap: Record<string, string> = {
  aberto: "Pendente",
  em_analise: "Em Resolução",
  resolvido: "Resolvida",
  fechado: "Resolvida",
};

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function MainHelp() {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("todas");
  const [enviando, setEnviando] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isCloseOpen, onOpen: onCloseOpen, onClose: onCloseClose } = useDisclosure();
  const { isOpen: isResolveOpen, onOpen: onResolveOpen, onClose: onResolveClose } = useDisclosure();

  const { data: tickets = [], isLoading, refetch } = useQuery<Ticket[]>({
    queryKey: ['suporteQuery'],
    queryFn: async () => {
      const res = await api.get("/admin/suporte");
      return res.data;
    },
    refetchInterval: 10000,
    retry: false,
  });

  const carregarMensagens = useCallback(async (ticketId: string) => {
    try {
      const res = await api.get(`/admin/suporte/${ticketId}/mensagens`);
      setMensagens(res.data);
    } catch {
      setMensagens([]);
    }
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      carregarMensagens(selectedTicket.id);
      const interval = setInterval(() => carregarMensagens(selectedTicket.id), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedTicket, carregarMensagens]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [mensagens]);

  async function enviarMensagem() {
    if (!selectedTicket || !novaMensagem.trim() || enviando) return;
    setEnviando(true);
    const texto = novaMensagem.trim();
    setNovaMensagem("");
    try {
      await api.post(`/admin/suporte/${selectedTicket.id}/mensagens`, { texto });
      await carregarMensagens(selectedTicket.id);
      refetch();
    } catch {
      toast({ title: "Erro ao enviar", status: "error", duration: 2000 });
    } finally {
      setEnviando(false);
    }
  }

  async function eliminarConversa() {
    if (!selectedTicket) return;
    try {
      await api.delete(`/admin/suporte/${selectedTicket.id}`);
      toast({ title: "Conversa eliminada", status: "success", duration: 2000 });
      setSelectedTicket(null);
      setMensagens([]);
      refetch();
    } catch (err: any) {
      toast({ title: "Erro", description: err.response?.data?.message, status: "error" });
    }
    onDeleteClose();
  }

  async function fecharConversa() {
    if (!selectedTicket) return;
    try {
      await api.patch(`/admin/suporte/${selectedTicket.id}/fechar`);
      toast({ title: "Conversa fechada", status: "success", duration: 2000 });
      setSelectedTicket(null);
      setMensagens([]);
      refetch();
    } catch (err: any) {
      toast({ title: "Erro", description: err.response?.data?.message, status: "error" });
    }
    onCloseClose();
  }

  async function resolverConversa() {
    if (!selectedTicket) return;
    try {
      await api.patch(`/admin/suporte/${selectedTicket.id}/status`, { status: 'resolvido' });
      toast({ title: "Conversa resolvida", status: "success", duration: 2000 });
      setSelectedTicket(null);
      setMensagens([]);
      refetch();
    } catch (err: any) {
      toast({ title: "Erro", description: err.response?.data?.message, status: "error" });
    }
    onResolveClose();
  }

  // ── Visible tickets ────────────────────────────────────────────────
  const visibleTickets = useMemo(() => {
    if (activeTab === "eliminar") return tickets.filter((t) => t.status === 'eliminado');
    return tickets.filter((t) => t.status !== 'eliminado');
  }, [tickets, activeTab]);

  // ── Counts per filter tab ──────────────────────────────────────────
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const nonEliminado = tickets.filter((t) => t.status !== 'eliminado');
    const eliminado = tickets.filter((t) => t.status === 'eliminado');
    for (const tab of filterTabs) {
      if (tab.key === "todas") {
        counts[tab.key] = nonEliminado.length;
      } else if (tab.key === "eliminar") {
        counts[tab.key] = eliminado.length;
      } else {
        counts[tab.key] = nonEliminado.filter((t) => tab.statuses.includes(t.status)).length;
      }
    }
    return counts;
  }, [tickets]);

  // ── Filtered by tab + search ───────────────────────────────────────
  const filtered = useMemo(() => {
    let result = visibleTickets;
    // Apply tab filter for non-todas/eliminar tabs
    const tab = filterTabs.find((f) => f.key === activeTab);
    if (tab && tab.key !== "todas" && tab.key !== "eliminar") {
      result = result.filter((t) => tab.statuses.includes(t.status));
    }
    // Apply search
    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter((t) =>
        t.assunto?.toLowerCase().includes(term) ||
        t.user?.nome?.toLowerCase().includes(term) ||
        t.user?.sobrenome?.toLowerCase().includes(term)
      );
    }
    return result;
  }, [visibleTickets, activeTab, search]);

  const ticketsComPreview = useMemo(() => {
    return filtered.map((t) => {
      const u = t.user ?? {} as any;
      return {
        ...t,
        userName: `${u.nome || 'Utilizador'} ${u.sobrenome || ''}`,
        userFoto: u.fotoPerfil || u.fotoPerfilUrl,
      };
    });
  }, [filtered]);

  // ── Chat view (when a ticket is selected) ──────────────────────────
  if (selectedTicket) {
    return (
      <Box as="main" w="100%" display="flex" flexDirection="column" gap={4}>
        <Flex align="center" gap={3}>
          <Button size="sm" variant="ghost" onClick={() => { setSelectedTicket(null); setMensagens([]); }}>
            ← Voltar
          </Button>
          <Avatar size="sm" name={`${selectedTicket.user?.nome || ''} ${selectedTicket.user?.sobrenome || ''}`}
            src={selectedTicket.user?.fotoPerfil || selectedTicket.user?.fotoPerfilUrl} />
          <Box flex={1}>
            <Text fontWeight="bold" fontSize="sm">
              {selectedTicket.user?.nome || 'Utilizador'} {selectedTicket.user?.sobrenome || ''}
            </Text>
            <Text fontSize="xs" color="text.secondary">{selectedTicket.assunto}</Text>
          </Box>
          {selectedTicket.status !== 'fechado' && selectedTicket.status !== 'resolvido' && (
            <Button size="sm" colorScheme="green" variant="outline" onClick={onResolveOpen}>
              Resolver
            </Button>
          )}
          {selectedTicket.status !== 'fechado' && selectedTicket.status !== 'resolvido' && (
            <Button size="sm" colorScheme="orange" variant="outline" onClick={onCloseOpen}>
              Fechar conversa
            </Button>
          )}
          <Button size="sm" colorScheme="red" variant="outline" onClick={onDeleteOpen}>
            Eliminar
          </Button>
        </Flex>

        <Box bg="bg.card" border="1px solid" borderColor="border.default" rounded="lg" display="flex" flexDirection="column"
          h="calc(100vh - 200px)" overflow="hidden">
          {/* Mensagens */}
          <Box ref={chatRef} flex={1} overflowY="auto" p={4} display="flex" flexDirection="column" gap={2}
            sx={{ "&::-webkit-scrollbar": { width: "4px" }, "&::-webkit-scrollbar-thumb": { bg: "whiteAlpha.200", borderRadius: "full" } }}>
            {mensagens.length === 0 ? (
              <Center flex={1}><Text fontSize="sm" color="text.secondary">Nenhuma mensagem</Text></Center>
            ) : (
              mensagens.map((msg) => {
                const isAdmin = msg.remetenteTipo === 'admin';
                return (
                  <Flex key={msg.id} justify={isAdmin ? 'flex-end' : 'flex-start'} maxW="80%" alignSelf={isAdmin ? 'flex-end' : 'flex-start'}>
                    {!isAdmin && (
                      <Avatar size="xs" name={msg.remetente?.nome} src={msg.remetente?.fotoPerfil || msg.remetente?.fotoPerfilUrl}
                        mt={1} mr={2} flexShrink={0} />
                    )}
                    <Box
                      bg={isAdmin ? "#3B7BFF" : "whiteAlpha.100"}
                      px={4} py={2} maxW="100%"
                      rounded="2xl"
                      borderBottomRightRadius={isAdmin ? "4px" : "2xl"}
                      borderBottomLeftRadius={isAdmin ? "2xl" : "4px"}
                    >
                      {!isAdmin && (
                        <Text fontSize="xs" color="blue.300" mb={0.5} fontWeight="medium">
                          {msg.remetente?.nome || 'Cliente'}
                        </Text>
                      )}
                      <Text fontSize="sm" color="white" lineHeight="1.5">{msg.texto}</Text>
                      <Text fontSize="xs" color={isAdmin ? "whiteAlpha.600" : "whiteAlpha.400"} textAlign="right" mt={1}>
                        {new Date(msg.criadoEm).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                      </Text>
                    </Box>
                  </Flex>
                );
              })
            )}
          </Box>

          {/* Input */}
          <Flex p={3} borderTop="1px solid" borderColor="border.default" gap={3} align="center">
            <Input flex={1} placeholder="Escrever mensagem..." bg="whiteAlpha.50" size="md" rounded="full"
              border="1px solid" borderColor="whiteAlpha.100" _focus={{ borderColor: "blue.400" }}
              value={novaMensagem} onChange={(e) => setNovaMensagem(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensagem(); } }} />
            <IconButton aria-label="Enviar" icon={<RiSendPlaneFill />} size="md" rounded="full"
              colorScheme="blue" onClick={enviarMensagem} isLoading={enviando}
              isDisabled={!novaMensagem.trim()} />
          </Flex>
        </Box>

        {/* Modal de confirmação de eliminação */}
        <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} size="sm" isCentered>
          <ModalOverlay />
          <ModalContent bg="bg.card" border="1px solid" borderColor="border.default">
            <ModalHeader fontSize="md">Eliminar conversa?</ModalHeader>
            <ModalBody>
              <Text fontSize="sm" color="text.secondary">Esta conversa e todas as mensagens serão permanentemente eliminadas.</Text>
            </ModalBody>
            <ModalFooter gap={3}>
              <Button size="sm" variant="ghost" onClick={onDeleteClose}>Cancelar</Button>
              <Button size="sm" colorScheme="red" onClick={eliminarConversa}>Eliminar</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Modal de confirmação de fecho */}
        <Modal isOpen={isCloseOpen} onClose={onCloseClose} size="sm" isCentered>
          <ModalOverlay />
          <ModalContent bg="bg.card" border="1px solid" borderColor="border.default">
            <ModalHeader fontSize="md">Fechar conversa?</ModalHeader>
            <ModalBody>
              <Text fontSize="sm" color="text.secondary">A conversa será marcada como fechada. O cliente não poderá enviar novas mensagens.</Text>
            </ModalBody>
            <ModalFooter gap={3}>
              <Button size="sm" variant="ghost" onClick={onCloseClose}>Cancelar</Button>
              <Button size="sm" colorScheme="orange" onClick={fecharConversa}>Fechar</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Modal de confirmação de resolução */}
        <Modal isOpen={isResolveOpen} onClose={onResolveClose} size="sm" isCentered>
          <ModalOverlay />
          <ModalContent bg="bg.card" border="1px solid" borderColor="border.default">
            <ModalHeader fontSize="md">Resolver conversa?</ModalHeader>
            <ModalBody>
              <Text fontSize="sm" color="text.secondary">A conversa será marcada como resolvida.</Text>
            </ModalBody>
            <ModalFooter gap={3}>
              <Button size="sm" variant="ghost" onClick={onResolveClose}>Cancelar</Button>
              <Button size="sm" colorScheme="green" onClick={resolverConversa}>Resolver</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    );
  }

  // ── Grid view (default) ────────────────────────────────────────────
  return (
    <Box as="main" w="100%" display="flex" flexDirection="column" gap={6}>
      {/* Header */}
      <Flex justify="space-between" align="center">
        <Stack>
          <Text lineHeight={1} fontSize="3xl" fontWeight="thin" color="text.primary">Suporte</Text>
          <Breadcrumb spacing="8px" separator={<MdOutlineKeyboardDoubleArrowRight color="gray.500" />}>
            <BreadcrumbItem><BreadcrumbLink fontSize="xs" color="text.primary" textTransform="uppercase" href="#">Main Admin</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbItem><BreadcrumbLink fontSize="xs" href="/admin/help">Suporte</BreadcrumbLink></BreadcrumbItem>
          </Breadcrumb>
        </Stack>
        <InputGroup maxW="320px" size="sm">
          <InputLeftElement pointerEvents="none"><RiSearchLine color="gray" /></InputLeftElement>
          <Input placeholder="Pesquisar..." rounded="full" bg="bg.card" value={search} onChange={(e) => setSearch(e.target.value)} />
        </InputGroup>
      </Flex>

      {/* Filter Tabs */}
      <Flex gap={2} align="center">
        {filterTabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = tabCounts[tab.key] || 0;
          return (
            <Button
              key={tab.key}
              size="sm"
              variant={isActive ? "solid" : "outline"}
              colorScheme={isActive ? "blue" : "gray"}
              rounded="full"
              onClick={() => setActiveTab(tab.key)}
              fontWeight={isActive ? "bold" : "normal"}
              fontSize="xs"
              px={4}
              _hover={{ bg: isActive ? "blue.500" : "whiteAlpha.100" }}
            >
              {tab.label}
              {count > 0 && (
                <Badge
                  ml={2}
                  borderRadius="full"
                  px={1.5}
                  fontSize="2xs"
                  bg={isActive ? "whiteAlpha.300" : "whiteAlpha.100"}
                  color="white"
                >
                  {count}
                </Badge>
              )}
            </Button>
          );
        })}
      </Flex>

      {/* Ticket Grid */}
      {isLoading ? (
        <Center py={16}><Spinner /></Center>
      ) : ticketsComPreview.length === 0 ? (
        <Center py={16}><Text fontSize="sm" color="text.secondary">Nenhuma conversa</Text></Center>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {ticketsComPreview.map((t) => {
            const statusLabel = statusLabelMap[t.status] || t.status;
            return (
              <Box
                key={t.id}
                bg="bg.card"
                border="1px solid"
                borderColor="border.default"
                rounded="xl"
                p={4}
                cursor="pointer"
                transition="all 0.15s"
                _hover={{ borderColor: "blue.400", transform: "translateY(-2px)", shadow: "lg" }}
                onClick={() => setSelectedTicket(t)}
              >
                <Flex align="center" gap={3}>
                  <Avatar size="md" name={t.userName} src={t.userFoto} />
                  <Box flex={1} minW={0}>
                    <Text fontSize="sm" fontWeight="bold" noOfLines={1}>{t.userName}</Text>
                    <Text fontSize="xs" color="green.400" fontWeight="medium">
                      {statusLabel}
                    </Text>
                    {t.assunto && (
                      <Text fontSize="2xs" color="text.muted" noOfLines={2} mt={0.5}>
                        {t.assunto}
                      </Text>
                    )}
                  </Box>
                  <Flex
                    align="center"
                    gap={1}
                    bg="green.500"
                    px={2.5}
                    py={1}
                    rounded="full"
                    flexShrink={0}
                  >
                    <RiCheckDoubleLine size={10} />
                    <Text fontSize="2xs" fontWeight="bold" color="white">{statusLabel}</Text>
                  </Flex>
                </Flex>
              </Box>
            );
          })}
        </SimpleGrid>
      )}
    </Box>
  );
}
