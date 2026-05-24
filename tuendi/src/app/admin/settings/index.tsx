"use client";

import {
  Box, Flex, Text, Stack, Switch, Select,
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  SimpleGrid, FormControl, FormLabel, Button, Divider,
  useToast, Spinner, Center,
} from "@chakra-ui/react";
import { useState } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import { RiSaveLine } from "react-icons/ri";
import { MdOutlineKeyboardDoubleArrowRight } from "react-icons/md";

export function MainSettings() {
  const toast = useToast();
  const { t, setLocale } = useI18n();
  const { preferencias, loaded, updatePreferencias, setField } = usePreferences();
  const [saving, setSaving] = useState(false);
  const [moeda, setMoeda] = useState("AOA");

  // Aplicar idioma em tempo real
  function handleIdiomaChange(novoIdioma: string) {
    setField("idioma", novoIdioma);
    setLocale(novoIdioma);
  }

  // Guardar todas as preferências
  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePreferencias(preferencias);
      toast({
        title: t("common.guardado"),
        description: t("common.guardadoDesc"),
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch {
      toast({
        title: t("common.erro"),
        description: t("common.erroDesc"),
        status: "error",
        duration: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box as="main" w="100%" display="flex" flexDirection="column" gap={6}>

      <Stack alignSelf={"flex-start"}>
        <Text lineHeight={1} fontSize={"3xl"} fontWeight={"thin"} color={"text.primary"} letterSpacing={"normal"}>{t("definicoes.titulo")}</Text>
        <Breadcrumb spacing='8px' separator={<MdOutlineKeyboardDoubleArrowRight color='gray.500' />}>
          <BreadcrumbItem>
            <BreadcrumbLink fontSize={"xs"} fontWeight={"hairline"} color={"text.primary"} letterSpacing={"wide"} textTransform={"uppercase"} href='#'>{t("common.mainAdmin")}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink fontWeight={"normal"} letterSpacing={"spaced"} textAlign={"end"} href='/admin/settings'>{t("definicoes.titulo")}</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
      </Stack>

      {!loaded ? (
        <Center py={8}><Spinner /></Center>
      ) : (
      <>
      {/* Notificações */}
      <Box bg="bg.card" border="1px solid" borderColor="border.default" rounded="lg" p={6}>
        <Text fontWeight="bold" fontSize="lg" mb={6}>{t("definicoes.notificacoes")}</Text>
        <Stack gap={4}>
          <Flex justify="space-between" align="center">
            <Box>
              <Text fontWeight="medium">{t("definicoes.notificacoesPush")}</Text>
              <Text fontSize="sm" color="text.secondary">{t("definicoes.notificacoesPushDesc")}</Text>
            </Box>
            <Switch colorScheme="purple" isChecked={preferencias.notificacoesPush} onChange={(e) => setField("notificacoesPush", e.target.checked)} />
          </Flex>
          <Divider borderColor="border.default" />
          <Flex justify="space-between" align="center">
            <Box>
              <Text fontWeight="medium">{t("definicoes.somNotificacao")}</Text>
              <Text fontSize="sm" color="text.secondary">{t("definicoes.somNotificacaoDesc")}</Text>
            </Box>
            <Switch colorScheme="purple" isChecked={preferencias.som} onChange={(e) => setField("som", e.target.checked)} />
          </Flex>
        </Stack>
      </Box>

      {/* Aparência */}
      <Box bg="bg.card" border="1px solid" borderColor="border.default" rounded="lg" p={6}>
        <Text fontWeight="bold" fontSize="lg" mb={6}>{t("definicoes.aparencia")}</Text>
        <SimpleGrid columns={2} gap={6}>
          <FormControl>
            <FormLabel fontSize="sm" color="text.secondary">{t("definicoes.idioma")}</FormLabel>
            <Select bg="bg.hover" value={preferencias.idioma} onChange={(e) => handleIdiomaChange(e.target.value)} size="sm" rounded="md">
              <option value="pt">{t("definicoes.portugues")}</option>
              <option value="en">{t("definicoes.english")}</option>
              <option value="fr">{t("definicoes.francais")}</option>
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm" color="text.secondary">{t("definicoes.tema")}</FormLabel>
            <Select bg="bg.hover" value={preferencias.tema} onChange={(e) => setField("tema", e.target.value)} size="sm" rounded="md">
              <option value="dark">{t("definicoes.escuro")}</option>
              <option value="light">{t("definicoes.claro")}</option>
            </Select>
          </FormControl>
        </SimpleGrid>
      </Box>

      {/* Configurações da Plataforma */}
      <Box bg="bg.card" border="1px solid" borderColor="border.default" rounded="lg" p={6}>
        <Text fontWeight="bold" fontSize="lg" mb={6}>{t("definicoes.plataforma")}</Text>
        <Stack gap={4}>
          <Flex justify="space-between" align="center">
            <Box>
              <Text fontWeight="medium">{t("definicoes.autoAprovacao")}</Text>
              <Text fontSize="sm" color="text.secondary">{t("definicoes.autoAprovacaoDesc")}</Text>
            </Box>
            <Switch colorScheme="purple" isChecked={preferencias.autoAprovacao} onChange={(e) => setField("autoAprovacao", e.target.checked)} />
          </Flex>
          <Divider borderColor="border.default" />
          <FormControl maxW="300px">
            <FormLabel fontSize="sm" color="text.secondary">{t("definicoes.moeda")}</FormLabel>
            <Select bg="bg.hover" value={moeda} onChange={(e) => setMoeda(e.target.value)} size="sm" rounded="md">
              <option value="AOA">{t("definicoes.kwanza")}</option>
              <option value="USD">{t("definicoes.dolar")}</option>
              <option value="EUR">{t("definicoes.euro")}</option>
            </Select>
          </FormControl>
        </Stack>
      </Box>

      {/* Botão guardar */}
      <Flex justify="flex-end">
        <Button
          leftIcon={<RiSaveLine />}
          colorScheme="purple"
          size="sm"
          onClick={handleSave}
          isLoading={saving}
        >
          {t("common.guardar")}
        </Button>
      </Flex>
      </>
      )}
    </Box>
  );
}
