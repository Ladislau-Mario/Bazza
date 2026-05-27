import { FloatingMenu } from "@/components/UI/FloatingMenu";
import { Box, Flex, Heading, MenuItem, Stack, Text } from "@chakra-ui/react";
import { FaChevronDown } from "react-icons/fa";

type FilterPeriod = "diario" | "semanal" | "mensal" | "anual";

interface DashboardCardProps {
    title: string,
    children: React.ReactNode,
    value?: number,
    isBalance?: boolean,
    activeFilter?: FilterPeriod,
    onFilter?: (period: FilterPeriod) => void,
}

export function DashboardCard( {title, children, value, isBalance = true, activeFilter, onFilter} : DashboardCardProps){
    return(
        <Flex h={"100%"} direction={"column"} gap={5} rounded={"xl"} p={6} bg={"bg.card"} borderWidth={"1px"} borderColor={"border.default"}>
            <Flex w={"100%"} h={"fit-content"} justify={"space-between"}>
                <Stack flex={1}>
                    <Heading size={"xs"} color={"text.secondary"} lineHeight={"relaxed"} letterSpacing={"wide"} fontWeight={"light"}>{title}</Heading>
                    <Text as={"span"} fontWeight={"semibold"} lineHeight={"1"} fontFamily={"body"} letterSpacing={"tight"} fontSize={"2xl"}>{ value == null ? "0" : isBalance ? value.toLocaleString("pt-AO").concat(" Kz") : value > 1 ? value.toLocaleString("pt-AO").concat(" Entregas") : value.toLocaleString("pt-AO").concat(" Entrega")}</Text>
                </Stack>
                <FloatingMenu placement="bottom" menuIcon={<FaChevronDown fontSize={"12px"}/>}>
                    <MenuItem onClick={() => onFilter?.("diario")} fontWeight={activeFilter === "diario" ? "bold" : "normal"}>Dia</MenuItem>
                    <MenuItem onClick={() => onFilter?.("semanal")} fontWeight={activeFilter === "semanal" ? "bold" : "normal"}>Semana</MenuItem>
                    <MenuItem onClick={() => onFilter?.("mensal")} fontWeight={activeFilter === "mensal" ? "bold" : "normal"}>Mês</MenuItem>
                </FloatingMenu>
            </Flex>
            <Box flex={1} minH={0} w="100%">
                {children}
            </Box>
        </Flex>
    );
}
