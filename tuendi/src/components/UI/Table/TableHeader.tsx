import { Flex, Heading, Spinner } from "@chakra-ui/react";
import { Ri24HoursLine } from "react-icons/ri";

interface TableHeaderProps {
    title: string;
    isLoad: boolean;
}

export function TableHeader({ title, isLoad }: TableHeaderProps) {
    return (
        <Flex justify={"space-between"}>
            <Heading size={"md"} fontWeight={"medium"} fontFamily={"heading"}>
                {!isLoad ? <>{title}</> : <>{title} <Spinner/></>}
            </Heading>
        </Flex>
    );
}