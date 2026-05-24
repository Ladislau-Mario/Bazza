"use client";

import { api } from "@/services/api";
import { IUser, UserStatus, Role } from "@/services/mirage/types";
import {
  Flex, Avatar, Box, Divider, Button, Text,
  HStack, Stack, Tag, TagLabel, TagLeftIcon,
  SimpleGrid, Spinner, Center,
  Tabs, TabList, Tab, TabPanels, TabPanel,
  Table, Thead, Tbody, Tr, Th, Td,
  Badge, Breadcrumb, BreadcrumbItem, BreadcrumbLink, Image,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { RiCircleFill } from "react-icons/ri";
import { ResponsiveLayout } from "@/components/UI/ResponsiveLayout";
import { MdOutlineKeyboardDoubleArrowRight } from "react-icons/md";
import { useQuery } from "@tanstack/react-query";

const statusColor: Record<UserStatus, string> = {
  active: "cyan",
  pending: "yellow",
  suspended: "red",
};

const statusLabel: Record<UserStatus, string> = {
  active: "Activo",
  pending: "Pendente",
  suspended: "Suspenso",
};

const roleLabel: Record<Role, string> = {
  client: "Cliente",
  deliver: "Motoqueiro",
  admin: "Admin",
};

const roleColor: Record<Role, string> = {
  client: "blue",
  deliver: "purple",
  admin: "orange",
};

export default function UserProfilePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    api.get(`/admin/utilizadores/${id}`)
      .then((res) => setUser(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const { data: pedidos = [] } = useQuery<any[]>({
    queryKey: ['userPedidos', id],
    queryFn: async () => {
      if (!id) return [];
      const res = await api.get("/admin/pedidos");
      return res.data.filter((p: any) => p.clienteId === id || p.userDataMotoqueiro?.id === id || p.motoqueiro?.userId === id);
    },
    enabled: !!id,
    retry: false,
  });

  const { data: suporteTickets = [] } = useQuery<any[]>({
    queryKey: ['userSuporte', id],
    queryFn: async () => {
      if (!id) return [];
      const res = await api.get("/admin/suporte");
      return res.data.filter((t: any) => t.userId === id);
    },
    enabled: !!id,
    retry: false,
  });

  async function updateStatus(status: UserStatus) {
    if (!user) return;
    await api.patch(`/admin/utilizadores/${user.id}/status`, { status });
    setUser((prev) => (prev ? { ...prev, status } : prev));
  }

  async function deleteUser() {
    if (!user) return;
    await api.delete(`/admin/utilizadores/${user.id}`);
    router.push("/admin/users");
  }

  const formatDate = (d: string | null | undefined) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("pt-PT");
  };

  if (loading) return <Center h="100vh"><Spinner size="xl" /></Center>;
  if (!user) return <Center h="100vh"><Text>Utilizador não encontrado.</Text></Center>;

  return (
    <ResponsiveLayout>
      <Breadcrumb spacing='8px' separator={<MdOutlineKeyboardDoubleArrowRight color='gray.500' />}>
        <BreadcrumbItem>
          <BreadcrumbLink fontSize={"xs"} fontWeight={"hairline"} color={"text.primary"} letterSpacing={"wide"} textTransform={"uppercase"} href='#'>Main Admin</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink fontWeight={"normal"} letterSpacing={"spaced"} textAlign={"end"} href='/admin/users'>Utilizadores</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink fontWeight={"normal"} letterSpacing={"spaced"} textAlign={"end"} href='#'>Perfil</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      {/* Header */}
      <Flex justify="space-between" align="center" mb={8} mt={4} flexWrap="wrap" gap={4}>
        <HStack gap={4}>
          <Avatar size="xl" src={user.fotoPerfil ?? undefined} name={`${user.nome} ${user.sobrenome}`} />
          <Box>
            <Text fontSize="2xl" fontWeight="bold">{user.nome} {user.sobrenome}</Text>
            <Text color="gray.400">{user.email}</Text>
            <Text color="gray.400" fontSize="sm">{user.telefone}</Text>
          </Box>
          <Stack gap={2}>
            <Tag colorScheme={statusColor[user.status]} size="md">
              <TagLeftIcon as={RiCircleFill} />
              <TagLabel>{statusLabel[user.status]}</TagLabel>
            </Tag>
            <Tag colorScheme={roleColor[user.role]} size="md">
              <TagLabel>{roleLabel[user.role]}</TagLabel>
            </Tag>
          </Stack>
        </HStack>
        <HStack gap={3}>
          <Button colorScheme="red" variant="ghost" size="sm" onClick={deleteUser}>Eliminar conta</Button>
          {user.status === "active" ? (
            <Button colorScheme="red" variant="outline" size="sm" onClick={() => updateStatus("suspended")}>Suspender</Button>
          ) : (
            <Button colorScheme="cyan" variant="outline" size="sm" onClick={() => updateStatus("active")}>Reactivar</Button>
          )}
        </HStack>
      </Flex>

      <Divider mb={8} />

      <Tabs variant="soft-rounded" colorScheme="cyan">
        <TabList mb={6} gap={2}>
          <Tab>Informacoes Gerais</Tab>
          <Tab>Pedidos</Tab>
          <Tab>Suporte</Tab>
        </TabList>
        <TabPanels>
          {/* Dados Pessoais */}
          <TabPanel px={0}>
            <Stack gap={6}>
              <Box bg="bg.card" border="1px solid" borderColor="border.default" rounded="xl" p={6}>
                <Text fontWeight="bold" fontSize="lg" mb={4}>Dados Pessoais</Text>
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.400">Nome completo</Text>
                    <Text>{user.nome} {user.sobrenome}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.400">Data de nascimento</Text>
                    <Text>{formatDate(user.dataNascimento)}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.400">E-mail</Text>
                    <Text>{user.email || "—"}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.400">Telefone</Text>
                    <HStack gap={2}>
                      <Text>{user.telefone || "—"}</Text>
                      <Badge colorScheme={user.telefoneVerificado ? "cyan" : "gray"} fontSize="xs">
                        {user.telefoneVerificado ? "Verificado" : "Nao verificado"}
                      </Badge>
                    </HStack>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.400">Documento</Text>
                    <Text>{user.tipoDocumento || "—"}: {user.numeroDocumento || "—"}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.400">Membro desde</Text>
                    <Text>{formatDate(user.criadoEm)}</Text>
                  </Box>
                </SimpleGrid>
              </Box>
            </Stack>
          </TabPanel>

          {/* Pedidos */}
          <TabPanel px={0}>
            <Box bg="bg.card" border="1px solid" borderColor="border.default" rounded="xl" p={6}>
              <Text fontWeight="bold" fontSize="lg" mb={4}>Historico de Pedidos</Text>
              {pedidos.length === 0 ? (
                <Text color="gray.400" textAlign="center" py={4}>Nenhum pedido encontrado.</Text>
              ) : (
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th color="gray.400">Nº Pedido</Th>
                      <Th color="gray.400">Origem</Th>
                      <Th color="gray.400">Destino</Th>
                      <Th color="gray.400">Valor</Th>
                      <Th color="gray.400">Status</Th>
                      <Th color="gray.400">Data</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {pedidos.map((p: any) => (
                      <Tr key={p.id}>
                        <Td fontSize="sm">{p.id?.substring(0, 8)}</Td>
                        <Td fontSize="sm" maxW="150px" noOfLines={1}>{p.origemEndereco}</Td>
                        <Td fontSize="sm" maxW="150px" noOfLines={1}>{p.destinoEndereco}</Td>
                        <Td fontSize="sm">{Number(p.valorEntrega || 0).toLocaleString("pt-PT")} Kz</Td>
                        <Td><Tag size="sm" colorScheme="cyan"><TagLabel fontSize="xs">{p.status}</TagLabel></Tag></Td>
                        <Td fontSize="sm">{formatDate(p.criadoEm)}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </Box>
          </TabPanel>

          {/* Suporte */}
          <TabPanel px={0}>
            <Box bg="bg.card" border="1px solid" borderColor="border.default" rounded="xl" p={6}>
              <Text fontWeight="bold" fontSize="lg" mb={4}>Tickets de Suporte</Text>
              {suporteTickets.length === 0 ? (
                <Text color="gray.400" textAlign="center" py={4}>Nenhum ticket encontrado.</Text>
              ) : (
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th color="gray.400">Assunto</Th>
                      <Th color="gray.400">Status</Th>
                      <Th color="gray.400">Data</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {suporteTickets.map((t: any) => (
                      <Tr key={t.id}>
                        <Td fontSize="sm">{t.assunto || t.titulo}</Td>
                        <Td><Tag size="sm" colorScheme={t.status === "aberto" ? "orange" : t.status === "resolvido" ? "green" : "blue"}><TagLabel fontSize="xs">{t.status}</TagLabel></Tag></Td>
                        <Td fontSize="sm">{formatDate(t.criadoEm)}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </ResponsiveLayout>
  );
}
