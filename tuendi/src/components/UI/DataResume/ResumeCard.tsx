import { gradients } from "@/styles/gradients";
import { Flex, HStack, Icon, IconButton, ResponsiveValue, Stack, Tag, Text } from "@chakra-ui/react";
import { BsThreeDots } from "react-icons/bs";
import { FaChevronDown } from "react-icons/fa";
import { RiRectangleLine } from "react-icons/ri";

const bgVariants = {
    primary: "linear(bg.card, bg.card)", 
    // gradient: "linear(155deg, #4FABFF, #4318FF)"
    gradient: "linear-gradient(135deg, #1A1D35 0%, #12152B 100%)"
}

interface ResumeCardProps {
    title: string,
    value?: number | string,
    bgVariant?: keyof typeof bgVariants,
    icon?: React.ReactNode,
    percentage?: number,
    pathColor?: string,
}

export function ResumeCard({title, value="0", bgVariant = "primary", icon, percentage, pathColor}: ResumeCardProps){
    return(
        <Flex w={"100%"} h={"auto"} minH={"80px"} gap={4} rounded={"lg"} px={4} py={3} backgroundImage={bgVariants[bgVariant]} justify={"space-between"} align={"center"} borderColor={"border.default"} borderWidth={"1px"} boxShadow={"0 4px 12px rgba(0, 0, 0, 0.1)"}>

            <Stack align={"flex-start"} spacing={2} w={"100%"}>

                <Flex direction={"row"} justify={"space-between"} w={"100%"} align={"center"}>
                    <HStack gap={1} align={"center"}>
                        <Icon>{icon}</Icon>

                        <Text as={"h4"} color={bgVariant == "primary" ? "text.secondary" : "text.primary"} letterSpacing={"wide"} fontSize={"sm"} fontWeight={"normal"} >{title}</Text>
                    </HStack>

                    <IconButton aria-label={"date filters"} variant={"ghost"} size={"xs"} icon={<BsThreeDots/>} />
                </Flex>
                
                <Flex direction={"row"} gap={4} w={"100%"} align={"center"}>
                    <Text as={"span"} letterSpacing={"wide"} fontFamily={"heading"} fontWeight={"bold"} fontSize={"2xl"}>{value}</Text>
                    {percentage !== undefined && (
                        <Tag variant={"subtle"} size={"sm"} colorScheme={percentage >= 0 ? "green" : "red"} rounded={"sm"}>
                            {percentage.toFixed(1)}%
                        </Tag>
                    )}
                </Flex>
            </Stack>
            {/* {icon} */}
            {/* <svg viewBox="0 0 300 200">
                <path d="M0, 150 C50, 100 100, 200 150, 150 C200, 100 250, 180 300, 120" fill="none" stroke="#4facfe" strokeWidth={10} />
            </svg> */}
        </Flex>
    );
}