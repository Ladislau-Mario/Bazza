"use client";

import {
  Box, Flex, Avatar, Text, Stack, HStack, Tag, TagLabel,
  TagLeftIcon, Divider, Tabs, TabList, Tab, TabPanels, TabPanel,
  SimpleGrid, Button, Input, FormControl, FormLabel, Spinner,
  Center, Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  Badge, Icon,
} from "@chakra-ui/react";
import { ResponsiveLayout } from "@/components/UI/ResponsiveLayout";
import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { IActividade, IUser, ActividadeTipo } from "@/services/mirage/types";
import { RiCircleFill, RiEditLine, RiSaveLine } from "react-icons/ri";
import { MdOutlineKeyboardDoubleArrowRight } from "react-icons/md";

const actividadeLabel: Record<ActividadeTipo, string> = {
  aprovacao_motoqueiro:  "Aprovação de motoqueiro",
  rejeicao_motoqueiro:   "Rejeição de motoqueiro",
  suspensao_usuario:     "Suspensão de utilizador",
  reactivacao_usuario:   "Reactivação de utilizador",
  eliminacao_usuario:    "Eliminação de utilizador",
  resolucao_ticket:      "Resolução de ticket",
  cancelamento_pedido:   "Cancelamento de pedido",
};

const actividadeColor: Record<ActividadeTipo, string> = {
  aprovacao_motoqueiro:  "green",
  rejeicao_motoqueiro:   "red",
  suspensao_usuario:     "orange",
  reactivacao_usuario:   "cyan",
  eliminacao_usuario:    "red",
  resolucao_ticket:      "blue",
  cancelamento_pedido:   "yellow",
};

export default function AdminProfilePage() {
  const [admin, setAdmin] = useState<IUser | null>(null);
  const [actividades, setActividades] = useState<IActividade[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ nome: "", sobrenome: "", telefone: "" });

  useEffect(() => {
    api.get("/users")
      .then((res) => {
        const admins: IUser[] = res.data.filter((u: IUser) => u.role === "admin");
        const found = admins[0] ?? null;
        setAdmin(found);
        setForm({
          nome: found?.nome ?? "",
          sobrenome: found?.sobrenome ?? "",
          telefone: found?.telefone ?? "",
        });
        if (found) {
          return api.get(`/actividades?adminId=${found.id}`);
        }
      })
      .then((res) => {
        if (res) setActividades(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function saveProfile() {
    if (!admin) return;
    await api.patch(`/users/${admin.id}`, form);
    setAdmin((prev) => prev ? { ...prev, ...form } : prev);
    setEditing(false);
  }

  if (loading) return (
    <Center h="100vh"><Spinner size="xl" /></Center>
  );

  if (!admin) return (
    <Center h="100vh"><Text>Perfil não encontrado.</Text></Center>
  );

  return (
    <ResponsiveLayout>

      {/* Breadcrumb */}
      <Stack alignSelf="flex-start">
        <Text lineHeight="1" fontSize="3xl" fontWeight="thin" color="text.primary">
          Perfil
        </Text>
        <Breadcrumb spacing="8px" separator={<MdOutlineKeyboardDoubleArrowRight color="gray.500" />}>
          <BreadcrumbItem>
            <BreadcrumbLink fontSize="xs" color="text.primary" textTransform="uppercase" href="/admin/dashboard">
              Main Admin
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink fontSize="xs" href="/admin/profile">Perfil</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
      </Stack>

      {/* Cabeçalho do perfil */}
      <Box bg="bg.card" border="1px solid" borderColor="border.default" rounded="lg" p={6}>
        <Flex justify="space-between" align="center">
          <HStack gap={5}>
            <Avatar
              size="xl"
              src={admin.fotoPerfil}
              name={`${admin.nome} ${admin.sobrenome}`}
              border="3px solid"
              borderColor="brand.500"
            />
            <Box>
              <Text fontSize="2xl" fontWeight="bold">
                {admin.nome} {admin.sobrenome}
              </Text>
              <Text color="text.secondary" fontSize="sm">{admin.email}</Text>
              <Text color="text.secondary" fontSize="sm">{admin.telefone}</Text>
              <HStack mt={2} gap={2}>
                <Tag colorScheme="purple" size="sm">
                  <TagLabel>Administrador</TagLabel>
                </Tag>
                <Tag colorScheme="cyan" size="sm">
                  <TagLeftIcon as={RiCircleFill} />
                  <TagLabel>Activo</TagLabel>
                </Tag>
              </HStack>
            </Box>
          </HStack>

          <Button
            leftIcon={editing ? <RiSaveLine /> : <RiEditLine />}
            colorScheme={editing ? "green" : "purple"}
            variant="outline"
            size="sm"
            onClick={editing ? saveProfile : () => setEditing(true)}
          >
            {editing ? "Guardar" : "Editar perfil"}
          </Button>
        </Flex>
      </Box>

      {/* Tabs */}
      <Tabs variant="soft-rounded" colorScheme="purple">
        <TabList mb={4} gap={2}>
          <Tab>Perfil</Tab>
          <Tab>Segurança</Tab>
          <Tab>Actividade</Tab>
        </TabList>

        <TabPanels>

          {/* Tab 1 — Perfil */}
          <TabPanel px={0}>
            <Box bg="bg.card" border="1px solid" borderColor="border.default" rounded="lg" p={6}>
              <Text fontWeight="bold" fontSize="lg" mb={6}>Informações Pessoais</Text>
              <SimpleGrid columns={2} gap={6}>
                <FormControl>
                  <FormLabel fontSize="sm" color="text.secondary">Nome</FormLabel>
                  <Input
                    value={form.nome}
                    isReadOnly={!editing}
                    onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                    bg={editing ? "bg.hover" : "transparent"}
                    border={editing ? "1px solid" : "none"}
                    borderColor="border.default"
                    px={editing ? 3 : 0}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="sm" color="text.secondary">Sobrenome</FormLabel>
                  <Input
                    value={form.sobrenome}
                    isReadOnly={!editing}
                    onChange={(e) => setForm((p) => ({ ...p, sobrenome: e.target.value }))}
                    bg={editing ? "bg.hover" : "transparent"}
                    border={editing ? "1px solid" : "none"}
                    borderColor="border.default"
                    px={editing ? 3 : 0}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="sm" color="text.secondary">E-mail</FormLabel>
                  <Input
                    value={admin.email}
                    isReadOnly
                    bg="transparent"
                    border="none"
                    px={0}
                    color="text.muted"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="sm" color="text.secondary">Telefone</FormLabel>
                  <Input
                    value={form.telefone}
                    isReadOnly={!editing}
                    onChange={(e) => setForm((p) => ({ ...p, telefone: e.target.value }))}
                    bg={editing ? "bg.hover" : "transparent"}
                    border={editing ? "1px solid" : "none"}
                    borderColor="border.default"
                    px={editing ? 3 : 0}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="sm" color="text.secondary">Membro desde</FormLabel>
                  <Input
                    value={new Date(admin.criadoEm).toLocaleDateString("pt-AO")}
                    isReadOnly
                    bg="transparent"
                    border="none"
                    px={0}
                    color="text.muted"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="sm" color="text.secondary">Telefone verificado</FormLabel>
                  <Input
                    value={admin.telefoneVerificado ? "Sim" : "Não"}
                    isReadOnly
                    bg="transparent"
                    border="none"
                    px={0}
                    color="text.muted"
                  />
                </FormControl>
              </SimpleGrid>
            </Box>
          </TabPanel>

          {/* Tab 2 — Segurança */}
          <TabPanel px={0}>
            <Stack gap={4}>
              <Box bg="bg.card" border="1px solid" borderColor="border.default" rounded="lg" p={6}>
                <Text fontWeight="bold" fontSize="lg" mb={2}>Autenticação</Text>
                <Text fontSize="sm" color="text.secondary" mb={4}>
                  A autenticação é gerida pelo Firebase. Para alterar a palavra-passe
                  ou o método de login, acede às definições da tua conta Google.
                </Text>
                <HStack gap={3}>
                  <Badge colorScheme="green" px={3} py={1} rounded="full">
                    Firebase Auth activo
                  </Badge>
                  <Badge colorScheme="blue" px={3} py={1} rounded="full">
                    Login via Google
                  </Badge>
                </HStack>
              </Box>

              <Box bg="bg.card" border="1px solid" borderColor="border.default" rounded="lg" p={6}>
                <Text fontWeight="bold" fontSize="lg" mb={2}>Sessões activas</Text>
                <Text fontSize="sm" color="text.secondary" mb={4}>
                  Estás a aceder a partir do browser actual. A gestão de sessões
                  múltiplas será disponibilizada numa versão futura.
                </Text>
                <HStack gap={3}>
                  <Box w={2} h={2} rounded="full" bg="green.400" />
                  <Text fontSize="sm">Sessão actual — {new Date().toLocaleDateString("pt-AO")}</Text>
                </HStack>
              </Box>
            </Stack>
          </TabPanel>

          {/* Tab 3 — Actividade */}
          <TabPanel px={0}>
            <Box bg="bg.card" border="1px solid" borderColor="border.default" rounded="lg" p={6}>
              <Text fontWeight="bold" fontSize="lg" mb={6}>Histórico de Actividade</Text>
              <Stack gap={3}>
                {actividades.length === 0 ? (
                  <Text color="text.secondary" fontSize="sm" textAlign="center" py={8}>
                    Nenhuma actividade registada.
                  </Text>
                ) : (
                  actividades
                    .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())
                    .map((a) => (
                      <Flex
                        key={a.id}
                        justify="space-between"
                        align="center"
                        p={4}
                        bg="bg.hover"
                        rounded="md"
                        border="1px solid"
                        borderColor="border.default"
                      >
                        <HStack gap={3}>
                          <Box
                            w={2} h={2} rounded="full"
                            bg={`${actividadeColor[a.tipo]}.400`}
                            flexShrink={0}
                          />
                          <Box>
                            <Text fontSize="sm" fontWeight="medium">
                              {actividadeLabel[a.tipo]}
                            </Text>
                            <Text fontSize="xs" color="text.secondary">
                              {a.descricao}
                            </Text>
                          </Box>
                        </HStack>
                        <Text fontSize="xs" color="text.muted" flexShrink={0}>
                          {new Date(a.criadoEm).toLocaleDateString("pt-AO")}
                        </Text>
                      </Flex>
                    ))
                )}
              </Stack>
            </Box>
          </TabPanel>

        </TabPanels>
      </Tabs>

    </ResponsiveLayout>
  );
}
