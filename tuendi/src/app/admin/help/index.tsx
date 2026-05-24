"use client";

import {
  Box, Flex, Text, Tag, TagLeftIcon, TagLabel,
  Avatar, Button, Input, Spinner, Center, HStack,
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, Stack,
  IconButton, useToast, useDisclosure, Modal, ModalOverlay,
  ModalContent, ModalHeader, ModalBody, ModalFooter,
  InputGroup, InputLeftElement,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { RiCircleFill, RiDeleteBinLine, RiSendPlaneFill, RiSearchLine, RiCloseCircleLine } from "react-icons/ri";
import { MdOutlineKeyboardDoubleArrowRight } from "react-icons/md";

interface Ticket {
  id: string;
  userId: string;
  assunto: string;
  mensagem: string;
  status: string;
  criadoEm: string;
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

const statusColor: Record<string, string> = {
  aberto: "orange",
  em_analise: "blue",
  resolvido: "green",
  fechado: "gray",
  eliminado: "red",
};

const statusLabel: Record<string, string> = {
  aberto: "Aberto",
  em_analise: "Em Analise",
  resolvido: "Resolvido",
  fechado: "Fechado",
  eliminado: "Eliminado",
};

export function MainHelp() {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [search, setSearch] = useState("");
  const [enviando, setEnviando] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isCloseOpen, onOpen: onCloseOpen, onClose: onCloseClose } = useDisclosure();

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

  const filtered = useMemo(() => {
    // Filtrar tickets eliminados
    const visible = tickets.filter((t) => t.status !== 'eliminado');
    if (!search.trim()) return visible;
    const term = search.toLowerCase();
    return visible.filter((t) =>
      t.assunto?.toLowerCase().includes(term) ||
      t.user?.nome?.toLowerCase().includes(term) ||
      t.user?.sobrenome?.toLowerCase().includes(term)
    );
  }, [tickets, search]);

  const ticketsComPreview = useMemo(() => {
    return filtered.map((t) => {
      const u = t.user ?? {} as any;
      return { ...t, userName: `${u.nome || 'Utilizador'} ${u.sobrenome || ''}`, userFoto: u.fotoPerfil || u.fotoPerfilUrl };
    });
  }, [filtered]);

  return (
    <Box as="main" w="100%" display="flex" flexDirection="column" gap={6}>
      <Stack alignSelf="flex-start">
        <Text lineHeight={1} fontSize="3xl" fontWeight="thin" color="text.primary">Suporte</Text>
        <Breadcrumb spacing="8px" separator={<MdOutlineKeyboardDoubleArrowRight color="gray.500" />}>
          <BreadcrumbItem><BreadcrumbLink fontSize="xs" color="text.primary" textTransform="uppercase" href="#">Main Admin</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbItem><BreadcrumbLink fontSize="xs" href="/admin/help">Suporte</BreadcrumbLink></BreadcrumbItem>
        </Breadcrumb>
      </Stack>

      <Flex gap={4} h="calc(100vh - 220px)">
        {/* Lista de conversas */}
        <Box w="320px" bg="bg.card" border="1px solid" borderColor="border.default" rounded="lg" display="flex" flexDirection="column" flexShrink={0}>
          <Box p={3} borderBottom="1px solid" borderColor="border.default">
            <InputGroup size="sm">
              <InputLeftElement pointerEvents="none"><RiSearchLine color="gray" /></InputLeftElement>
              <Input placeholder="Pesquisar..." rounded="full" bg="bg.default" value={search} onChange={(e) => setSearch(e.target.value)} />
            </InputGroup>
          </Box>
          <Box flex={1} overflowY="auto">
            {isLoading ? (
              <Center py={8}><Spinner /></Center>
            ) : ticketsComPreview.length === 0 ? (
              <Center py={8}><Text fontSize="sm" color="text.secondary">Nenhuma conversa</Text></Center>
            ) : (
              ticketsComPreview.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <Flex key={t.id} p={3} gap={3} align="center" cursor="pointer"
                    bg={isSelected ? "rgba(59,130,246,0.08)" : "transparent"}
                    borderLeft={isSelected ? "3px solid" : "3px solid transparent"}
                    borderColor={isSelected ? "blue.400" : "transparent"}
                    _hover={{ bg: isSelected ? "rgba(59,130,246,0.08)" : "bg.hover" }}
                    onClick={() => setSelectedTicket(t)}
                    transition="all 0.15s"
                  >
                    <Avatar size="sm" name={t.userName} src={t.userFoto} />
                    <Box flex={1} minW={0}>
                      <Flex justify="space-between" align="center">
                        <Text fontSize="sm" fontWeight={isSelected ? "bold" : "medium"} noOfLines={1}>{t.userName}</Text>
                        <Text fontSize="xs" color="text.muted">{new Date(t.criadoEm).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}</Text>
                      </Flex>
                      <Flex justify="space-between" align="center" mt={1}>
                        <Text fontSize="xs" color="text.secondary" noOfLines={1} flex={1}>{t.assunto}</Text>
                        <Tag colorScheme={statusColor[t.status] || 'gray'} size="xs" ml={2} flexShrink={0}>
                          <TagLabel>{statusLabel[t.status] || t.status}</TagLabel>
                        </Tag>
                      </Flex>
                    </Box>
                  </Flex>
                );
              })
            )}
          </Box>
        </Box>

        {/* Chat */}
        <Box flex={1} bg="bg.card" border="1px solid" borderColor="border.default" rounded="lg" display="flex" flexDirection="column" overflow="hidden">
          {selectedTicket ? (
            <>
              {/* Header */}
              <Flex p={4} borderBottom="1px solid" borderColor="border.default" align="center" gap={3}>
                <Avatar size="sm" name={`${selectedTicket.user?.nome || ''} ${selectedTicket.user?.sobrenome || ''}`}
                  src={selectedTicket.user?.fotoPerfil || selectedTicket.user?.fotoPerfilUrl} />
                <Box flex={1}>
                  <Text fontWeight="bold" fontSize="sm">{selectedTicket.user?.nome || 'Utilizador'} {selectedTicket.user?.sobrenome || ''}</Text>
                  <Text fontSize="xs" color="text.secondary">{selectedTicket.assunto}</Text>
                </Box>
                <Tag colorScheme={statusColor[selectedTicket.status] || 'gray'} size="sm">
                  <TagLeftIcon as={RiCircleFill} /><TagLabel>{statusLabel[selectedTicket.status]}</TagLabel>
                </Tag>
                {selectedTicket.status !== 'fechado' && selectedTicket.status !== 'resolvido' && (
                  <IconButton aria-label="Fechar conversa" icon={<RiCloseCircleLine />} size="sm" variant="ghost" colorScheme="orange" onClick={onCloseOpen} />
                )}
                <IconButton aria-label="Eliminar conversa" icon={<RiDeleteBinLine />} size="sm" variant="ghost" colorScheme="red" onClick={onDeleteOpen} />
              </Flex>

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
            </>
          ) : (
            <Center flex={1}><Text color="text.secondary" fontSize="sm">Selecciona uma conversa</Text></Center>
          )}
        </Box>
      </Flex>

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
    </Box>
  );
}
