import { Flex, HStack, VStack, Text, Avatar, Tag, TagLabel } from "@chakra-ui/react";

export interface User {
    id: number,
    name: string,
    role: string,
    avatar?: string,
    score: number,
}

interface TopRatedListProps {
    data: User[],
}

export function TopRatedList({data}:TopRatedListProps){
    return(
        <VStack spacing={4} align={"stretch"}>
            {data.map((user, index) => {
                const isPositive = user.score >= 0;

                return(
                    <Flex w={"100%"} key={user.id} gap={16} align={"center"} justify={"space-between"}>
                        <HStack spacing={3}>
                            <Text fontSize={"xl"} lineHeight={1} color={"text.primary"} fontWeight={"semibold"} w="12px">
                                {index + 1}
                            </Text>

                            <Avatar size={"sm"} name={user.name} src={user.avatar}/>

                            <VStack spacing={0} align={"flex-start"}>
                                <Text fontSize={"sm"} fontWeight={"medium"} color={"text.primary"} isTruncated maxW={"110px"}>
                                    {user.name}
                                </Text>

                                <Text fontSize={"xs"} color={"text.secondary"}>{user.role}</Text>
                            </VStack>
                        </HStack>
                        <Tag colorScheme={isPositive ? "green" : "red"} size={"md"}>
                            <TagLabel>{isPositive ? "+" : ""}{user.score}</TagLabel>
                        </Tag>
                    </Flex>
                );
            })}
            
        </VStack>
    );
}