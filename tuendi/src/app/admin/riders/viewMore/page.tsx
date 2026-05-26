"use client";

import { api } from "@/services/api";
import {
  Flex, Avatar, Box, Divider, Button, Text,
  HStack, Stack, Tag, TagLabel, TagLeftIcon,
  SimpleGrid, Spinner, Center, IconButton,
  Modal, ModalOverlay, ModalContent, ModalBody, ModalCloseButton,
  Tabs, TabList, Tab, TabPanels, TabPanel,
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { RiCircleFill } from "react-icons/ri";
import { ResponsiveLayout } from "@/components/UI/ResponsiveLayout";
import { AuthImage } from "@/components/UI/AuthImage";
import { MdOutlineKeyboardDoubleArrowRight } from "react-icons/md";

const statusColor: Record<string, string> = {
  pendente_aprovacao: "yellow",
  activo: "cyan",
  suspenso: "red",
};

const statusLabel: Record<string, string> = {
  pendente_aprovacao: "Pendente",
  activo: "Activo",
  suspenso: "Suspenso",
};

export default function ViewMorePage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [rider, setRider] = useState<any>(null);
  const [uploads, setUploads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [selectedDocLabel, setSelectedDocLabel] = useState<string>("");

  useEffect(() => {
    if (!id) return;
    api.get(`/admin/motoqueiros/${id}`)
      .then((res) => {
        const data = res.data;
        // A API pode retornar { motoqueiro, uploads, ... } ou o motoqueiro directamente
        if (data.motoqueiro) {
          setRider(data.motoqueiro);
          setUploads(data.uploads || []);
        } else {
          setRider(data);
          setUploads(data.uploads || []);
        }
      })
      .catch(() => setLoading(false))
      .finally(() => setLoading(false));
  }, [id]);

  async function updateStatus(action: "aprovar" | "rejeitar" | "suspender") {
    if (!rider) return;
    try {
      if (action === "aprovar") {
        await api.patch(`/admin/motoqueiros/${rider.id}/aprovar`);
        setRider((prev: any) => prev ? { ...prev, status: "activo" } : prev);
      } else if (action === "suspender") {
        await api.patch(`/admin/motoqueiros/${rider.id}/suspender`, { motivo: "Suspenso pelo admin" });
        setRider((prev: any) => prev ? { ...prev, status: "suspenso" } : prev);
      } else if (action === "rejeitar") {
        await api.patch(`/admin/motoqueiros/${rider.id}/rejeitar`, { motivo: "Rejeitado pelo admin" });
        setRider((prev: any) => prev ? { ...prev, status: "suspenso" } : prev);
      }
    } catch (err: any) {
      console.error("Erro ao actualizar status:", err.response?.data?.message || err.message);
    }
  }

  if (loading) return <Center h="100vh"><Spinner size="xl" /></Center>;
  if (!rider) return <Center h="100vh"><Text>Motoqueiro não encontrado.</Text></Center>;

  const getUploadUrl = (tipo: string) => {
    const upload = uploads.find((u: any) => u.tipo === tipo);
    if (!upload) return undefined;
    return `/admin/documentos/${upload.id}/imagem`;
  };

  const openDoc = (tipo: string, label: string) => {
    const url = getUploadUrl(tipo);
    if (url) {
      setSelectedDoc(url);
      setSelectedDocLabel(label);
    }
  };
  const veiculo = rider.veiculos?.[0] || rider.veiculo || null;

  return (
    <ResponsiveLayout>
      <Breadcrumb spacing='8px' separator={<MdOutlineKeyboardDoubleArrowRight color='gray.500' />}>
        <BreadcrumbItem>
          <BreadcrumbLink fontSize="xs" fontWeight="hairline" color="text.primary" letterSpacing="wide" textTransform="uppercase" href='/admin/riders'>Main Admin</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink fontWeight="normal" letterSpacing="spaced" href='/admin/riders'>Entregadores</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink fontWeight="normal" letterSpacing="spaced">Perfil</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <Flex justify="space-between" align="center" mb={8} wrap="wrap" gap={4}>
        <HStack gap={4}>
          <Avatar size="xl" src={rider.user?.fotoPerfil} name={`${rider.user?.nome || ""} ${rider.user?.sobrenome || ""}`} />
          <Box>
            <Text fontSize="2xl" fontWeight="bold">{rider.user?.nome} {rider.user?.sobrenome}</Text>
            <Text color="text.secondary">{rider.user?.email}</Text>
            <Text color="text.secondary" fontSize="sm">{rider.user?.telefone}</Text>
          </Box>
          <Tag colorScheme={statusColor[rider.status] || "gray"} size="md">
            <TagLeftIcon as={RiCircleFill} />
            <TagLabel>{statusLabel[rider.status] || rider.status}</TagLabel>
          </Tag>
        </HStack>
        <HStack gap={3}>
          {rider.status !== "suspenso" && (
            <Button colorScheme="red" variant="outline" size="sm" onClick={() => updateStatus("suspender")}>
              Suspender
            </Button>
          )}
          {rider.status === "pendente_aprovacao" && (
            <Button colorScheme="cyan" size="sm" onClick={() => updateStatus("aprovar")}>
              Aprovar
            </Button>
          )}
        </HStack>
      </Flex>

      <Tabs variant="line" colorScheme="cyan">
        <TabList mb={6} gap={2}>
          <Tab>Informações Gerais</Tab>
          <Tab>Documentos</Tab>
          <Tab>Veículo</Tab>
        </TabList>

        <TabPanels>
          <TabPanel px={0}>
            <Stack gap={6}>
              <Box bg="bg.card" border="2px" borderColor="border.default" rounded="xl" p={6}>
                <Text fontWeight="bold" fontSize="lg" mb={4}>Dados Pessoais</Text>
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                  <Box><Text fontSize="sm" color="text.secondary">Nome completo</Text><Text>{rider.user?.nome} {rider.user?.sobrenome}</Text></Box>
                  <Box><Text fontSize="sm" color="text.secondary">Data de nascimento</Text><Text>{rider.user?.dataNascimento ? new Date(rider.user.dataNascimento).toLocaleDateString("pt-PT", { timeZone: "UTC" }) : "—"}</Text></Box>
                  <Box><Text fontSize="sm" color="text.secondary">Telefone</Text><Text>{rider.user?.telefone}</Text></Box>
                  <Box><Text fontSize="sm" color="text.secondary">E-mail</Text><Text>{rider.user?.email}</Text></Box>
                  <Box><Text fontSize="sm" color="text.secondary">Morada</Text><Text>{rider.morada}</Text></Box>
                  <Box><Text fontSize="sm" color="text.secondary">Membro desde</Text><Text>{new Date(rider.criadoEm).toLocaleDateString("pt-PT", { timeZone: "UTC" })}</Text></Box>
                </SimpleGrid>
              </Box>
              <Box bg="bg.card" border="2px" borderColor="border.default" rounded="xl" p={6}>
                <Text fontWeight="bold" fontSize="lg" mb={4}>Estatísticas</Text>
                <SimpleGrid columns={3} gap={4}>
                  <Box><Text fontSize="sm" color="text.secondary">Classificação</Text><Text>{rider.classificacaoMedia || 0} ⭐</Text></Box>
                  <Box><Text fontSize="sm" color="text.secondary">Avaliações</Text><Text>{rider.totalAvaliacoes || 0}</Text></Box>
                  <Box><Text fontSize="sm" color="text.secondary">Disponibilidade</Text><Text textTransform="capitalize">{rider.statusDisponibilidade}</Text></Box>
                </SimpleGrid>
              </Box>
            </Stack>
          </TabPanel>

          <TabPanel px={0}>
            <Stack gap={6}>
              <Box bg="bg.card" border="2px" borderColor="border.default" rounded="xl" p={6}>
                <Text fontWeight="bold" fontSize="lg" mb={1}>Foto de Perfil</Text>
                <Text fontSize="sm" color="text.secondary" mb={4}>Imagem enviada pelo entregador</Text>
                <Box cursor="pointer" onClick={() => openDoc("foto_perfil", "Foto de Perfil")} _hover={{ opacity: 0.85 }} transition="opacity 0.2s">
                  <AuthImage url={getUploadUrl("foto_perfil")} alt="Foto Perfil" rounded="md" w="200px" h="200px" objectFit="cover" />
                </Box>
              </Box>
              <Box bg="bg.card" border="2px" borderColor="border.default" rounded="xl" p={6}>
                <Text fontWeight="bold" fontSize="lg" mb={1}>Bilhete de Identidade</Text>
                <Text fontSize="sm" color="text.secondary" mb={4}>Nº {rider.user?.numeroDocumento}</Text>
                <SimpleGrid columns={2} gap={4}>
                  <Box><Text fontSize="sm" color="text.secondary" mb={2}>Frente</Text><Box cursor="pointer" onClick={() => openDoc("documento_bi_frente", "BI - Frente")} _hover={{ opacity: 0.85 }} transition="opacity 0.2s"><AuthImage url={getUploadUrl("documento_bi_frente")} alt="BI Frente" rounded="md" w="100%" h="180px" objectFit="cover" /></Box></Box>
                  <Box><Text fontSize="sm" color="text.secondary" mb={2}>Verso</Text><Box cursor="pointer" onClick={() => openDoc("documento_bi_verso", "BI - Verso")} _hover={{ opacity: 0.85 }} transition="opacity 0.2s"><AuthImage url={getUploadUrl("documento_bi_verso")} alt="BI Verso" rounded="md" w="100%" h="180px" objectFit="cover" /></Box></Box>
                </SimpleGrid>
              </Box>
              <Box bg="bg.card" border="2px" borderColor="border.default" rounded="xl" p={6}>
                <Text fontWeight="bold" fontSize="lg" mb={4}>Carta de Condução</Text>
                <SimpleGrid columns={2} gap={4}>
                  <Box><Text fontSize="sm" color="text.secondary" mb={2}>Frente</Text><Box cursor="pointer" onClick={() => openDoc("documento_carta_frente", "Carta - Frente")} _hover={{ opacity: 0.85 }} transition="opacity 0.2s"><AuthImage url={getUploadUrl("documento_carta_frente")} alt="Carta Frente" rounded="md" w="100%" h="180px" objectFit="cover" /></Box></Box>
                  <Box><Text fontSize="sm" color="text.secondary" mb={2}>Verso</Text><Box cursor="pointer" onClick={() => openDoc("documento_carta_verso", "Carta - Verso")} _hover={{ opacity: 0.85 }} transition="opacity 0.2s"><AuthImage url={getUploadUrl("documento_carta_verso")} alt="Carta Verso" rounded="md" w="100%" h="180px" objectFit="cover" /></Box></Box>
                </SimpleGrid>
              </Box>
            </Stack>
          </TabPanel>

          <TabPanel px={0}>
            <Box bg="bg.card" border="2px" borderColor="border.default" rounded="xl" p={6}>
              <Text fontWeight="bold" fontSize="lg" mb={4}>Dados do Veículo</Text>
              {veiculo ? (
                <>
                  <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} mb={6}>
                    <Box><Text fontSize="sm" color="text.secondary">Marca / Modelo</Text><Text>{veiculo.marca} {veiculo.modelo}</Text></Box>
                    <Box><Text fontSize="sm" color="text.secondary">Ano</Text><Text>{veiculo.ano}</Text></Box>
                    <Box><Text fontSize="sm" color="text.secondary">Matrícula</Text><Text>{veiculo.matricula || veiculo.placa}</Text></Box>
                    <Box>
                      <Text fontSize="sm" color="text.secondary">Cor</Text>
                      <HStack gap={2}>
                        <Box w="16px" h="16px" rounded="full" bg={veiculo.cor || veiculo.corPrincipal} border="1px solid" borderColor="whiteAlpha.300" />
                        <Text textTransform="capitalize">{veiculo.cor || veiculo.corPrincipal}</Text>
                      </HStack>
                    </Box>
                  </SimpleGrid>
                  <Text fontSize="sm" color="text.secondary" mb={2}>Foto do veículo</Text>
                  <Box cursor="pointer" onClick={() => openDoc("foto_veiculo", "Foto do Veículo")} _hover={{ opacity: 0.85 }} transition="opacity 0.2s">
                    <AuthImage url={getUploadUrl("foto_veiculo")} alt="Veículo" rounded="md" w="100%" h="220px" objectFit="cover" />
                  </Box>
                  <Text fontSize="sm" color="text.secondary" mt={4} mb={2}>Foto da placa</Text>
                  <Box cursor="pointer" onClick={() => openDoc("foto_placa", "Foto da Placa")} _hover={{ opacity: 0.85 }} transition="opacity 0.2s">
                    <AuthImage url={getUploadUrl("foto_placa")} alt="Placa" rounded="md" w="100%" h="180px" objectFit="cover" />
                  </Box>
                </>
              ) : (
                <Text color="text.secondary">Sem informação de veículo.</Text>
              )}
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* ── Lightbox Modal ── */}
      <Modal isOpen={!!selectedDoc} onClose={() => setSelectedDoc(null)} size="4xl" isCentered>
        <ModalOverlay bg="blackAlpha.800" />
        <ModalContent bg="gray.900" maxW="900px" maxH="90vh">
          <ModalCloseButton color="white" zIndex={10} />
          <ModalBody p={0}>
            {selectedDoc && (
              <AuthImage
                url={selectedDoc}
                alt={selectedDocLabel}
                w="100%"
                maxH="85vh"
                objectFit="contain"
                rounded="md"
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </ResponsiveLayout>
  );
}
