import { Box, Stack, Text } from "@chakra-ui/react";

interface NavSectionProps{
    title: string,
    children?: React.ReactNode,
}

export function NavSection({title, children}: NavSectionProps){
    return(
        <Box>
            <Text as={"h4"} fontSize={"xs"} fontWeight={"hairline"} color={"text.primary"} letterSpacing={"wide"} textTransform={"uppercase"}>{title}</Text>
            <Stack spacing={2} mt={6}>
                {children}
            </Stack>
        </Box>
    );
}