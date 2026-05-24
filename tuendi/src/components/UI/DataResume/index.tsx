import { Flex } from "@chakra-ui/react";
import { ResumeCard } from "./ResumeCard";

export function ResumeComponent(){
    return(
        <Flex w={"100%"} justify={"space-between"} h={"fit-content"} gap={4}>

            <ResumeCard title="Entregas" value={682}/>
            <ResumeCard title="Bazando" value={682}/>
            <ResumeCard title="Receita" value={682}/>
            <ResumeCard title="Fatura" value={682}/>

        </Flex>
    );
}