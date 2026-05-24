import { IUser } from "@/services/mirage/types";
import { Table, Thead, Th, Tbody, Tr, Td, IconButton, Tag, TagLabel, TagLeftIcon, LinkBox } from "@chakra-ui/react";
import { BsThreeDots } from "react-icons/bs";
import { RiCircleFill } from "react-icons/ri";

type Column<T> = {
  header: string;
  accessor?: string;
  render?: (row: T) => React.ReactNode;
};

type TableComponentProps<T> = {
  data: T[];
  columns: Column<T>[];
  onOpenModal?: (u: T) => void;
};

export function TableComponent<T>({ data, columns, onOpenModal }: TableComponentProps<T>) {
  // console.log(data)
  return (
    <Table fontFamily={"heading"} fontSize={"xs"} fontWeight={"light"} color={"text.secondary"}>
      <Thead>
        <Tr>
          {columns.map((col, i) => (
            <Th key={i} px={3} textTransform={"capitalize"}>{col.header}</Th>
          ))}
        </Tr>
      </Thead>

      <Tbody>
        {data.map((row, i) => (
          <Tr key={i} onClick={() => onOpenModal?.(row)} cursor={"pointer"} >
            {columns.map((col, j) => (
              <Td key={j} px={3} py={2}>
                { col.render ? col.render(row) : col.accessor ? (row as any)[col.accessor] : null }
              </Td>
            ))}
          </Tr>
))}
      </Tbody>
    </Table>
  );
}