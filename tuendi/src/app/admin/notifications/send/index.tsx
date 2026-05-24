"use client";

import {
  Box, Flex, Text, Stack, Button, Input, Textarea, Select,
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  FormControl, FormLabel, RadioGroup, Radio, HStack,
  useToast, Spinner, Center, Checkbox, CheckboxGroup,
  SimpleGrid, Badge, Avatar,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { MdOutlineKeyboardDoubleArrowRight } from "react-icons/md";
import { RiSendPlaneFill } from "react-icons/ri";

interface UserOption {
  id: string;
  nome: string;
  sobrenome: string;
  telefone: string;
  role: string;
}

type Destinatario = "todos" | "clientes" | "motoqueiros" | "especifico";

const tipoOptions = [
  { value: "info", label: "Informação", color: "blue" },
  { value: "promo", label: "Promoção", color: "green" },
  { value: "alert", label: "Alerta", color: "red" },
];

export function MainSendNotification() {
  const toast = useToast();
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [tipo, setTipo] = useState("info");
  const [destinatario, setDestinatario] = useState<Destinatario>("todos");
  const [pesquisa, setPesquisa] = useState("");
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('baza_admin_token') : null;
    setHasToken(!!token);
  }, []);

  // Buscar todos os utilizadores (para seleção específica)
  const { data: users, isLoading } = useQuery({
    queryKey: ['notifUsers'],
    queryFn: async () => {
      const res = await api.get('/admin/utilizadores');
      return res.data as UserOption[];
    },
    enabled: hasToken,
  });

  // Filtrar utilizadores por pesquisa
  const usersFiltrados = useMemo(() => {
    if (!users) return [];
    if (!pesquisa.trim()) return users;
    const termo = pesquisa.toLowerCase();
    return users.filter((u: UserOption) =>
      `${u.nome || ''} ${u.sobrenome || ''}`.toLowerCase().includes(termo) ||
      (u.telefone || '').includes(termo)
    );
  }, [users, pesquisa]);

  // Contar destinatários
  const totalDestinatarios = useMemo(() => {
    if (destinatario === "todos") return users?.length || 0;
    if (destinatario === "clientes") return users?.filter((u: UserOption) => u.role === "client").length || 0;
    if (destinatario === "motoqueiros") return users?.filter((u: UserOption) => u.role === "deliver").length || 0;
    return selecionados.length;
  }, [destinatario, users, selecionados]);

  const handleEnviar = useCallback(async () => {
    if (!titulo.trim() || !mensagem.trim()) {
      toast({ title: "Preencha o título e a mensagem", status: "warning", duration: 3000 });
      return;
    }

    setEnviando(true);
    try {
      if (destinatario === "todos") {
        await api.post("/notificacoes/enviar-todos", { titulo, mensagem, tipo });
      } else if (destinatario === "clientes") {
        await api.post("/notificacoes/enviar-grupo", { role: "client", titulo, mensagem, tipo });
      } else if (destinatario === "motoqueiros") {
        await api.post("/notificacoes/enviar-grupo", { role: "deliver", titulo, mensagem, tipo });
      } else if (destinatario === "especifico") {
        if (selecionados.length === 0) {
          toast({ title: "Selecione pelo menos um utilizador", status: "warning", duration: 3000 });
          setEnviando(false);
          return;
        }
        await api.post("/notificacoes/enviar", { userIds: selecionados, titulo, mensagem, tipo });
      }

      toast({
        title: "Notificação enviada",
        description: `Enviada para ${totalDestinatarios} utilizador(es).`,
        status: "success",
        duration: 4000,
      });

      // Limpar formulário
      setTitulo("");
      setMensagem("");
      setTipo("info");
      setDestinatario("todos");
      setSelecionados([]);
      setPesquisa("");
    } catch (err: any) {
      toast({
        title: "Erro ao enviar",
        description: err.response?.data?.message || "Tente novamente.",
        status: "error",
        duration: 4000,
      });
    } finally {
      setEnviando(false);
    }
  }, [titulo, mensagem, tipo, destinatario, selecionados, totalDestinatarios, toast]);

  return (
    <Box as="main" w="100%" display="flex" flexDirection="column" gap={6}>

      <Stack alignSelf={"flex-start"}>
        <Text lineHeight={1} fontSize={"3xl"} fontWeight={"thin"} color={"text.primary"} letterSpacing={"normal"}>Enviar Notificação</Text>
        <Breadcrumb spacing='8px' separator={<MdOutlineKeyboardDoubleArrowRight color='gray.500' />}>
          <BreadcrumbItem>
            <BreadcrumbLink fontSize={"xs"} fontWeight={"hairline"} color={"text.primary"} letterSpacing={"wide"} textTransform={"uppercase"} href='#'>Main Admin</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink fontWeight={"normal"} letterSpacing={"spaced"} href='/admin/notifications'>Notificações</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink fontWeight={"normal"} letterSpacing={"spaced"} href='/admin/notifications/send'>Enviar</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
      </Stack>

      {/* Formulário */}
      <Box bg="bg.card" border="1px solid" borderColor="border.default" rounded="lg" p={6}>
        <Text fontWeight="bold" fontSize="lg" mb={6}>Nova Notificação</Text>
        <Stack gap={5}>

          {/* Título */}
          <FormControl isRequired>
            <FormLabel fontSize="sm" color="text.secondary">Título</FormLabel>
            <Input
              bg="bg.hover"
              placeholder="Título da notificação"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              size="sm"
              rounded="md"
            />
          </FormControl>

          {/* Mensagem */}
          <FormControl isRequired>
            <FormLabel fontSize="sm" color="text.secondary">Mensagem</FormLabel>
            <Textarea
              bg="bg.hover"
              placeholder="Conteúdo da notificação..."
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              size="sm"
              rounded="md"
              rows={4}
              resize="vertical"
            />
          </FormControl>

          {/* Tipo */}
          <FormControl>
            <FormLabel fontSize="sm" color="text.secondary">Tipo</FormLabel>
            <HStack gap={3}>
              {tipoOptions.map((opt) => (
                <Button
                  key={opt.value}
                  size="sm"
                  variant={tipo === opt.value ? "solid" : "outline"}
                  colorScheme={tipo === opt.value ? opt.color : "gray"}
                  onClick={() => setTipo(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </HStack>
          </FormControl>
        </Stack>
      </Box>

      {/* Destinatários */}
      <Box bg="bg.card" border="1px solid" borderColor="border.default" rounded="lg" p={6}>
        <Flex justify="space-between" align="center" mb={6}>
          <Text fontWeight="bold" fontSize="lg">Destinatários</Text>
          <Badge colorScheme="purple" fontSize="sm" px={3} py={1} rounded="full">
            {totalDestinatarios} selecionado(s)
          </Badge>
        </Flex>

        <RadioGroup value={destinatario} onChange={(v) => setDestinatario(v as Destinatario)}>
          <Stack gap={4}>
            <Radio value="todos">
              <Text fontSize="sm">Todos os utilizadores ({users?.length || 0})</Text>
            </Radio>
            <Radio value="clientes">
              <Text fontSize="sm">Clientes ({users?.filter((u: UserOption) => u.role === "client").length || 0})</Text>
            </Radio>
            <Radio value="motoqueiros">
              <Text fontSize="sm">Motoqueiros ({users?.filter((u: UserOption) => u.role === "deliver").length || 0})</Text>
            </Radio>
            <Radio value="especifico">
              <Text fontSize="sm">Utilizador(es) específico(s)</Text>
            </Radio>
          </Stack>
        </RadioGroup>

        {/* Lista de seleção específica */}
        {destinatario === "especifico" && (
          <Box mt={6}>
            <Input
              bg="bg.hover"
              placeholder="Pesquisar por nome ou telefone..."
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              size="sm"
              rounded="md"
              mb={4}
            />

            {isLoading ? (
              <Center py={6}><Spinner size="sm" /></Center>
            ) : (
              <Box maxH="300px" overflowY="auto" border="1px solid" borderColor="border.default" rounded="md">
                <CheckboxGroup value={selecionados} onChange={(v) => setSelecionados(v as string[])}>
                  <Stack gap={0}>
                    {usersFiltrados.length === 0 ? (
                      <Text fontSize="sm" color="text.secondary" textAlign="center" py={6}>
                        Nenhum utilizador encontrado.
                      </Text>
                    ) : (
                      usersFiltrados.map((u: UserOption) => (
                        <Flex
                          key={u.id}
                          align="center"
                          gap={3}
                          px={4}
                          py={3}
                          borderBottom="1px solid"
                          borderColor="border.default"
                          _last={{ borderBottom: "none" }}
                          _hover={{ bg: "bg.hover" }}
                        >
                          <Checkbox value={u.id} colorScheme="purple" />
                          <Avatar size="xs" name={`${u.nome || ''} ${u.sobrenome || ''}`} />
                          <Box flex={1}>
                            <Text fontSize="sm" fontWeight="medium">
                              {u.nome || 'Sem nome'} {u.sobrenome || ''}
                            </Text>
                            <Text fontSize="xs" color="text.secondary">
                              {u.telefone || 'Sem telefone'}
                            </Text>
                          </Box>
                          <Badge size="sm" colorScheme={u.role === 'client' ? 'blue' : u.role === 'deliver' ? 'purple' : 'gray'}>
                            {u.role === 'client' ? 'Cliente' : u.role === 'deliver' ? 'Motoqueiro' : u.role}
                          </Badge>
                        </Flex>
                      ))
                    )}
                  </Stack>
                </CheckboxGroup>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Botão enviar */}
      <Flex justify="flex-end">
        <Button
          leftIcon={<RiSendPlaneFill />}
          colorScheme="purple"
          size="sm"
          onClick={handleEnviar}
          isLoading={enviando}
          loadingText="A enviar..."
        >
          Enviar Notificação
        </Button>
      </Flex>

    </Box>
  );
}
