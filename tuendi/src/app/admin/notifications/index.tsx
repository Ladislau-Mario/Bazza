"use client";

import {
  Box, Flex, Text, Stack, Tag, TagLeftIcon, TagLabel,
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  Button, HStack, IconButton, Badge,
  Spinner, Center,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { usePreferences } from "@/contexts/PreferencesContext";
import { RiCircleFill, RiDeleteBinLine, RiCheckLine, RiNotification3Line, RiSendPlaneFill } from "react-icons/ri";
import { MdOutlineKeyboardDoubleArrowRight } from "react-icons/md";

// ── Helpers de tempo ──────────────────────────────────────────────
function formatarTempo(iso: string): string {
  const agora = new Date();
  const data = new Date(iso);
  const diff = Math.floor((agora.getTime() - data.getTime()) / 1000);

  if (diff < 60)    return "Agora mesmo";
  if (diff < 3600)  return `Há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Há ${Math.floor(diff / 3600)}h`;
  if (diff < 172800) return "Ontem";
  return data.toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric" });
}

// ── Config por tipo ──────────────────────────────────────────────
const tipoConfig: Record<string, { bg: string; label: string }> = {
  pedido:    { bg: "blue.500",   label: "Pedido" },
  entregador:{ bg: "purple.500", label: "Entregador" },
  sistema:   { bg: "gray.500",   label: "Sistema" },
  suporte:   { bg: "orange.500", label: "Suporte" },
  info:      { bg: "blue.500",   label: "Informação" },
  promo:     { bg: "green.500",  label: "Promoção" },
  alert:     { bg: "red.500",    label: "Alerta" },
};

// ── Interface real do backend ──────────────────────────────────────
interface Notificacao {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  dados?: Record<string, any> | null;
  lida: boolean;
  criadoEm: string;
}

export function MainNotifications() {
  const [lidas, setLidas] = useState<Set<string>>(new Set());
  const [eliminadas, setEliminadas] = useState<Set<string>>(new Set());
  const { preferencias } = usePreferences();
  const prevCountRef = useRef(0);

  // Pedir permissão para browser notifications
  useEffect(() => {
    if (preferencias.notificacoesPush && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [preferencias.notificacoesPush]);

  // Buscar notificações reais do backend
  const { data: notificacoes, isLoading } = useQuery({
    queryKey: ['notificacoes'],
    queryFn: async () => {
      const res = await api.get('/notificacoes');
      return res.data as Notificacao[];
    },
    refetchInterval: 15_000,
  });

  // Notificar browser quando chegam novas
  useEffect(() => {
    if (!notificacoes) return;
    if (notificacoes.length > prevCountRef.current && prevCountRef.current > 0) {
      const novas = notificacoes.length - prevCountRef.current;
      if (preferencias.notificacoesPush && 'Notification' in window && Notification.permission === 'granted') {
        new Notification("Baza Admin", {
          body: `${novas} nova(s) notificação(ões)`,
          icon: "/images/Logo2.png",
        });
      }
    }
    prevCountRef.current = notificacoes.length;
  }, [notificacoes, preferencias.notificacoesPush]);

  // Marcar como lida (chama o endpoint real)
  const marcarComoLida = useCallback(async (id: string) => {
    setLidas((prev) => { const n = new Set(prev); n.add(id); return n; });
    try { await api.patch(`/notificacoes/${id}/lida`); } catch { /* silencioso */ }
  }, []);

  // Eliminar (apenas local)
  const eliminar = useCallback((id: string) => {
    setEliminadas((prev) => { const n = new Set(prev); n.add(id); return n; });
  }, []);

  // Filtrar eliminadas
  const visiveis = useMemo(() => {
    if (!notificacoes) return [];
    return notificacoes.filter((n) => !eliminadas.has(n.id));
  }, [notificacoes, eliminadas]);

  // Contar não lidas
  const naoLidas = useMemo(
    () => visiveis.filter((n) => !n.lida && !lidas.has(n.id)).length,
    [visiveis, lidas]
  );

  if (isLoading) {
    return (
      <Box as="main" w="100%" display="flex" flexDirection="column" gap={6}>
        <Center py={12}><Spinner size="xl" color="brand.500" /></Center>
      </Box>
    );
  }

  return (
    <Box as="main" w="100%" display="flex" flexDirection="column" gap={6}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <Flex justify="space-between" align="flex-start" wrap="wrap" gap={4}>
        <Stack alignSelf="flex-start">
          <Text lineHeight={1} fontSize="3xl" fontWeight="thin" color="text.primary" letterSpacing="normal">
            Notificações
          </Text>
          <Breadcrumb spacing="8px" separator={<MdOutlineKeyboardDoubleArrowRight color="gray.500" />}>
            <BreadcrumbItem>
              <BreadcrumbLink fontSize="xs" fontWeight="hairline" color="text.muted" href="/admin/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink fontSize="xs" fontWeight="hairline" color="text.muted" href="/admin/notifications">Notificações</BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>
        </Stack>

        <HStack spacing={3}>
          {naoLidas > 0 && (
            <Badge colorScheme="red" borderRadius="full" px={3} py={1} fontSize="sm">
              {naoLidas} não lida(s)
            </Badge>
          )}
          <Button as={NextLink} href="/admin/notifications/send" leftIcon={<RiSendPlaneFill />} colorScheme="brand" size="sm" rounded="lg">
            Enviar Notificação
          </Button>
        </HStack>
      </Flex>

      {/* ── Separador ──────────────────────────────────────────── */}
      <Flex w="100%" justifyContent="space-between" alignItems="center">
        <Text fontSize="sm" color="text.secondary" fontWeight="light" letterSpacing="wide">
          Todas as notificações
        </Text>
      </Flex>

      {/* ── Sem notificações ───────────────────────────────────── */}
      {visiveis.length === 0 && (
        <Center py={12} flexDirection="column" gap={3}>
          <RiNotification3Line fontSize="48px" color="#718096" />
          <Text color="text.muted" fontSize="sm">Nenhuma notificação</Text>
        </Center>
      )}

      {/* ── Lista de notificações ──────────────────────────────── */}
      {visiveis.map((noti) => {
        const config = tipoConfig[noti.tipo] || tipoConfig.sistema;
        const estaLida = noti.lida || lidas.has(noti.id);

        return (
          <Flex
            key={noti.id}
            direction="column"
            justifyContent="flex-start"
            alignItems="flex-start"
            p={4}
            rounded="xl"
            borderWidth="1px"
            borderColor="border.default"
            bg={estaLida ? "transparent" : "brand.900"}
            opacity={estaLida ? 0.6 : 1}
            gap={3}
            _hover={{ opacity: 1 }}
            transition="opacity 0.2s"
          >
            <Flex w="100%" gap={4} alignItems="flex-start">
              <Flex rounded="full" p={3} bg={config.bg} alignItems="center" justifyContent="center" flexShrink={0}>
                <RiNotification3Line fontSize="18px" color="white" />
              </Flex>

              <Stack spacing={1} flex={1} minW={0}>
                <Flex w="100%" justifyContent="space-between" alignItems="center" gap={2}>
                  <HStack spacing={2}>
                    <Text fontWeight="semibold" fontSize="sm" fontFamily="body" letterSpacing="wide" color="text.primary" noOfLines={1}>
                      {noti.titulo}
                    </Text>
                    <Tag size="sm" variant="subtle" colorScheme={config.bg.replace('.500', '')}>
                      <TagLeftIcon as={RiCircleFill} boxSize="6px" />
                      <TagLabel fontSize="10px">{config.label}</TagLabel>
                    </Tag>
                  </HStack>

                  <HStack spacing={1} flexShrink={0}>
                    {!estaLida && (
                      <IconButton icon={<RiCheckLine />} aria-label="Marcar como lida" size="xs" variant="ghost" colorScheme="green" onClick={() => marcarComoLida(noti.id)} />
                    )}
                    <IconButton icon={<RiDeleteBinLine />} aria-label="Eliminar" size="xs" variant="ghost" colorScheme="red" onClick={() => eliminar(noti.id)} />
                  </HStack>
                </Flex>

                <Text fontWeight="hairline" fontFamily="body" fontSize="sm" letterSpacing="wide" color="text.secondary" noOfLines={2}>
                  {noti.mensagem}
                </Text>

                <Text fontSize="xs" color="text.muted">
                  {formatarTempo(noti.criadoEm)}
                </Text>
              </Stack>
            </Flex>
          </Flex>
        );
      })}
    </Box>
  );
}
