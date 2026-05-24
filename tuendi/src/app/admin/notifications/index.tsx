"use client";

import {
  Box, Flex, Text, Stack, Tag, TagLeftIcon, TagLabel,
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  Button, HStack, IconButton, Badge,
  SimpleGrid, Spinner, Center,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { usePreferences } from "@/contexts/PreferencesContext";
import { RiCircleFill, RiDeleteBinLine, RiCheckLine, RiNotification3Line, RiSendPlaneFill } from "react-icons/ri";
import { MdOutlineKeyboardDoubleArrowRight } from "react-icons/md";

interface Notificacao {
  id: string;
  tipo: "pedido" | "entregador" | "sistema" | "suporte";
  titulo: string;
  descricao: string;
  lida: boolean;
  criadoEm: string;
}

const tipoColor: Record<string, string> = {
  pedido: "blue",
  entregador: "purple",
  sistema: "gray",
  suporte: "orange",
};

const tipoLabel: Record<string, string> = {
  pedido: "Pedido",
  entregador: "Entregador",
  sistema: "Sistema",
  suporte: "Suporte",
};

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

  // Buscar dados reais do dashboard para gerar notificações
  const { data: dashboard, isLoading, refetch } = useQuery({
    queryKey: ['notifDashboard'],
    queryFn: async () => {
      const [dashRes, suporteRes, motoRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/suporte'),
        api.get('/admin/motoqueiros/pendentes'),
      ]);
      return {
        dashboard: dashRes.data,
        suporte: suporteRes.data,
        motoqueiros: motoRes.data,
      };
    },
    refetchInterval: 15000,
    retry: false,
  });

  // Gerar notificações a partir dos dados reais
  const notificacoes: Notificacao[] = useMemo(() => {
    const items: Notificacao[] = [];

    if (dashboard?.motoqueiros) {
      dashboard.motoqueiros.forEach((m: any) => {
        items.push({
          id: `moto_${m.id}`,
          tipo: "entregador",
          titulo: `Entregador pendente: ${m.user?.nome || 'Desconhecido'}`,
          descricao: `${m.user?.nome || ''} ${m.user?.sobrenome || ''} aguarda aprovação.`,
          lida: false,
          criadoEm: m.criadoEm || new Date().toISOString(),
        });
      });
    }

    if (dashboard?.suporte) {
      const ticketsAbertos = dashboard.suporte.filter((t: any) => t.status === 'aberto' || t.status === 'em_analise');
      ticketsAbertos.forEach((t: any) => {
        items.push({
          id: `sup_${t.id}`,
          tipo: "suporte",
          titulo: `Ticket: ${t.titulo || t.assunto || 'Sem título'}`,
          descricao: `${t.user?.nome || 'Utilizador'} ${t.user?.sobrenome || ''} - ${t.status}`,
          lida: false,
          criadoEm: t.criadoEm || new Date().toISOString(),
        });
      });
    }

    if (dashboard?.dashboard) {
      const d = dashboard.dashboard;
      if (d.pendentes > 0) {
        items.push({
          id: 'dash_pendentes',
          tipo: "sistema",
          titulo: `${d.pendentes} entregador(es) pendente(s)`,
          descricao: `Existem entregadores aguardando aprovação.`,
          lida: false,
          criadoEm: new Date().toISOString(),
        });
      }
    }

    return items.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }, [dashboard]);

  // Tocar som e mostrar browser notification quando chegam novas notificações
  useEffect(() => {
    const currentCount = notificacoes.length;
    if (currentCount > prevCountRef.current && prevCountRef.current > 0) {
      const novas = currentCount - prevCountRef.current;
      // Tocar som
      if (preferencias.som) {
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          oscillator.frequency.value = 800;
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
          oscillator.start(audioCtx.currentTime);
          oscillator.stop(audioCtx.currentTime + 0.3);
        } catch {}
      }
      // Browser notification
      if (preferencias.notificacoesPush && Notification.permission === 'granted') {
        new Notification('Bazza Admin', {
          body: `${novas} nova(s) notificação(ões)`,
        });
      }
    }
    prevCountRef.current = currentCount;
  }, [notificacoes.length, preferencias.som, preferencias.notificacoesPush]);

  const visiveis = notificacoes.filter(n => !eliminadas.has(n.id));
  const naoLidas = visiveis.filter((n) => !lidas.has(n.id)).length;

  const marcarComoLida = (id: string) => {
    setLidas(prev => new Set([...prev, id]));
  };

  const marcarTodasComoLidas = () => {
    setLidas(new Set(visiveis.map(n => n.id)));
  };

  const eliminar = (id: string) => {
    setEliminadas(prev => new Set([...prev, id]));
  };

  return (
    <Box as="main" w="100%" display="flex" flexDirection="column" gap={6}>

      <Flex justify="space-between" align="flex-start">
        <Stack alignSelf={"flex-start"}>
          <Text lineHeight={1} fontSize={"3xl"} fontWeight={"thin"} color={"text.primary"} letterSpacing={"normal"}>Notificações</Text>
          <Breadcrumb spacing='8px' separator={<MdOutlineKeyboardDoubleArrowRight color='gray.500' />}>
            <BreadcrumbItem>
              <BreadcrumbLink fontSize={"xs"} fontWeight={"hairline"} color={"text.primary"} letterSpacing={"wide"} textTransform={"uppercase"} href='#'>Main Admin</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink fontWeight={"normal"} letterSpacing={"spaced"} textAlign={"end"} href='/admin/notifications'>Notificações</BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>
        </Stack>
        <Button
          as={NextLink}
          href="/admin/notifications/send"
          leftIcon={<RiSendPlaneFill />}
          colorScheme="purple"
          size="sm"
        >
          Enviar Notificação
        </Button>
      </Flex>

      {/* Resumo */}
      <SimpleGrid columns={4} gap={4}>
        {Object.entries(tipoLabel).map(([key, label]) => {
          const count = visiveis.filter((n) => n.tipo === key && !lidas.has(n.id)).length;
          return (
            <Box key={key} bg="bg.card" border="1px solid" borderColor="border.default" rounded="lg" p={4}>
              <HStack justify="space-between">
                <Text fontSize="sm" color="text.secondary">{label}</Text>
                <Tag colorScheme={tipoColor[key]} size="sm">
                  <TagLabel>{count} novas</TagLabel>
                </Tag>
              </HStack>
            </Box>
          );
        })}
      </SimpleGrid>

      {/* Lista */}
      <Box bg="bg.card" border="1px solid" borderColor="border.default" rounded="lg" p={6}>
        <HStack justify="space-between" mb={4}>
          <HStack gap={3}>
            <RiNotification3Line size={20} />
            <Text fontWeight="bold" fontSize="lg">Todas as Notificações</Text>
            {naoLidas > 0 && (
              <Badge colorScheme="red" rounded="full" px={2}>{naoLidas} não lidas</Badge>
            )}
          </HStack>

          {naoLidas > 0 && (
            <Button size="xs" variant="ghost" leftIcon={<RiCheckLine />} onClick={marcarTodasComoLidas}>
              Marcar todas como lidas
            </Button>
          )}
        </HStack>

        {isLoading ? (
          <Center py={8}><Spinner /></Center>
        ) : (
        <Stack gap={2}>
          {visiveis.length === 0 ? (
            <Text color="text.secondary" fontSize="sm" textAlign="center" py={8}>
              Nenhuma notificação.
            </Text>
          ) : (
            visiveis.map((n) => {
              const isLida = lidas.has(n.id);
              return (
              <Flex
                key={n.id}
                justify="space-between"
                align="center"
                p={4}
                bg={isLida ? "transparent" : "bg.hover"}
                rounded="md"
                border="1px solid"
                borderColor="border.default"
              >
                <HStack gap={3} flex={1}>
                  {!isLida && (
                    <Box w={2} h={2} rounded="full" bg={`${tipoColor[n.tipo]}.400`} flexShrink={0} />
                  )}
                  <Box flex={1}>
                    <HStack gap={2} mb={1}>
                      <Text fontSize="sm" fontWeight="medium">{n.titulo}</Text>
                      <Tag colorScheme={tipoColor[n.tipo]} size="sm">
                        <TagLabel>{tipoLabel[n.tipo]}</TagLabel>
                      </Tag>
                    </HStack>
                    <Text fontSize="xs" color="text.secondary">{n.descricao}</Text>
                  </Box>
                </HStack>

                <HStack gap={2} flexShrink={0}>
                  <Text fontSize="xs" color="text.muted">
                    {new Date(n.criadoEm).toLocaleDateString("pt-PT")}
                  </Text>
                  {!isLida && (
                    <IconButton
                      aria-label="Marcar como lida"
                      icon={<RiCheckLine />}
                      size="xs"
                      variant="ghost"
                      colorScheme="green"
                      onClick={() => marcarComoLida(n.id)}
                    />
                  )}
                  <IconButton
                    aria-label="Eliminar"
                    icon={<RiDeleteBinLine />}
                    size="xs"
                    variant="ghost"
                    colorScheme="red"
                    onClick={() => eliminar(n.id)}
                  />
                </HStack>
              </Flex>
              );
            })
          )}
        </Stack>
        )}
      </Box>

    </Box>
  );
}
