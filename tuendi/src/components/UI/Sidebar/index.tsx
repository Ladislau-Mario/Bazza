"use client";
// src/components/UI/Sidebar/index.tsx
import { Box, Stack } from "@chakra-ui/react";
import { FaRoute } from "react-icons/fa";
import { RiDashboardLine } from "react-icons/ri";
import { NavSection } from "./NavSection";
import { NavLink } from "./NavLink";
import { NavDropdown } from "./NavDropdown";
import { ConfigurationIcon, DeliveryManIcon, HelpIcon, LineChartIcon, NotificationIcon, SupportIcon, UserIcon } from "@/components/Icons/icons";
import { useI18n } from "@/contexts/I18nContext";

export function Sidebar(){
    const { t } = useI18n();
    return(
        <Box as="aside" w={48} h={"100vh"} position={"fixed"} top={20} left={0} pl={6} pr={2} pt={6} zIndex={1000} bgColor={"bg.default"} borderRightWidth={1} borderColor={"border.default"} boxShadow={"0 8px 32px rgba(0, 0, 0, 0.3)"}>
            <Stack spacing={8} align={"flex-start"} w={"100%"}>

                <NavSection title={t("common.mainAdmin")}>
                    <NavLink href="/admin/dashboard" icon={<RiDashboardLine size={20}/>}>{t("nav.dashboard")}</NavLink>
                    <NavLink href="/admin/users" icon={<UserIcon strokeWidth={2} fontSize={20}/>}>{t("nav.utilizadores")}</NavLink>
                    <NavLink href="/admin/deliveries" icon={<FaRoute size={20}/>}>{t("nav.pedidos")}</NavLink>
                    <NavLink href="/admin/riders" icon={<DeliveryManIcon strokeWidth={3} fontSize={20}/>}>{t("nav.entregadores")}</NavLink>
                    <NavDropdown title={t("nav.ganhos")} icon={<LineChartIcon strokeWidth={2} fontSize={20}/>} activePrefix="/admin/earnings">
                        <NavLink href="/admin/earnings" icon={<LineChartIcon strokeWidth={2} fontSize={16}/>}>Geral</NavLink>
                        <NavLink href="/admin/earnings/payouts" icon={<LineChartIcon strokeWidth={2} fontSize={16}/>}>Comprovativos</NavLink>
                    </NavDropdown>
                </NavSection>

                <NavSection title="support admin">
                    <NavLink href="/admin/help" icon={<HelpIcon strokeWidth={2} fontSize={20}/>}>{t("nav.suporte")}</NavLink>
                    <NavLink href="/admin/notifications" icon={<NotificationIcon strokeWidth={2} fontSize={20}/>}>{t("nav.notificacoes")}</NavLink>
                    <NavLink href="/admin/settings" icon={<ConfigurationIcon strokeWidth={2} fontSize={20}/>}>{t("nav.definicoes")}</NavLink>
                </NavSection>

            </Stack>
        </Box>
    );
}