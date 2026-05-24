"use client";
import {
  Box, Tag, TagLeftIcon, TagLabel, IconButton,
  Flex, Stack, Select, Input, InputGroup,
  InputLeftElement, Avatar, Text, HStack,
  useDisclosure, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalBody, ModalFooter, Button,
  Divider, SimpleGrid,
  Center,
  Spinner,
} from "@chakra-ui/react";
import { TableComponent } from "@/components/UI/Table/Table";
import { TableHeader } from "@/components/UI/Table/TableHeader";
import { Pagination } from "@/components/UI/Table/Pagination";
import { BsThreeDots } from "react-icons/bs";
import { RiCircleFill, RiSearchLine } from "react-icons/ri";
import { useContext, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IUser, Role, UserStatus } from "@/services/mirage/types";
import { UsersContext } from "@/contexts/UsersContext";

const statusColor: Record<UserStatus, string> = {
  active: "cyan",
  pending: "yellow",
  suspended: "red",
  eliminado: "gray",
};

const statusLabel: Record<UserStatus, string> = {
  active: "Activo",
  pending: "Pendente",
  suspended: "Suspenso",
  eliminado: "Eliminado",
};

const roleLabel: Record<Role, string> = {
  client: "Cliente",
  deliver: "Motoqueiro",
  admin: "Admin",
};

const roleColor: Record<Role, string> = {
  client: "blue",
  deliver: "purple",
  admin: "orange",
};

export function UsersTable() {

  const { users, updateStatus, deleteUser, setPage, total, page, isFetching, isLoading } = useContext(UsersContext);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selected, setSelected] = useState<IUser | null>(null);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [roleFilter, setRoleFilter] = useState<Role | "TODOS">("TODOS");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "TODOS">("TODOS");
  const [sortBy, setSortBy] = useState<"recentes" | "nome">("recentes");

  function openModal(user: IUser) {
    setSelected(user);
    onOpen();
  }

  const filtered = useMemo(() => {
    let result = [...users];

    if (roleFilter !== "TODOS")
      result = result.filter((u) => u.role === roleFilter);

    if (statusFilter !== "TODOS")
      result = result.filter((u) => u.status === statusFilter);

    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter((u) =>
        `${u.nome} ${u.sobrenome}`.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.telefone?.toLowerCase().includes(term)
      );
    }

    if (sortBy === "nome") {
      result.sort((a, b) => a.nome.localeCompare(b.nome));
    } else {
      result.sort((a, b) =>
        new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
      );
    }

    return result;
  }, [users, roleFilter, statusFilter, search, sortBy]);

  const columns = [
    {
      header: "Nome",
      render: (u: IUser) => (
        <Flex align="center" gap={2}>
          <Avatar size="sm" src={u.fotoPerfil} name={`${u.nome} ${u.sobrenome}`} />
          <Text>{u.nome} {u.sobrenome}</Text>
        </Flex>
      ),
    },
    { header: "E-mail", render: (u: IUser) => <Text>{u.email}</Text> },
    { header: "Telefone", render: (u: IUser) => <Text>{u.telefone}</Text> },
    {
      header: "Tipo",
      render: (u: IUser) => (
        <Tag colorScheme={roleColor[u.role]} size="sm">
          <TagLabel>{roleLabel[u.role]}</TagLabel>
        </Tag>
      ),
    },
    {
      header: "Membro desde",
      render: (u: IUser) => (
        <Text>{new Date(u.criadoEm).toLocaleDateString("pt-PT")}</Text>
      ),
    },
    {
      header: "Status",
      render: (u: IUser) => (
        <Tag colorScheme={statusColor[u.status]} size="sm">
          <TagLeftIcon as={RiCircleFill} color={`${statusColor[u.status]}.500`} />
          <TagLabel>{statusLabel[u.status]}</TagLabel>
        </Tag>
      ),
    },
    {
      header: "",
      render: (u: IUser) => (
        <IconButton
          variant="ghost"
          aria-label="Ver detalhes"
          icon={<BsThreeDots />}
          onClick={() => openModal(u)}
        />
      ),
    },
  ];

  return (
    <>
      <Box
        p={6} display="flex" gap={6} flexDirection="column" mb={8} overflowX="auto"
        bg="bg.card" border="2px" borderColor="border.default" rounded="lg"
      >
        <Stack gap={4}>
          <TableHeader title="Usuários" isLoad={isFetching} />

          <Flex justify="space-between" align="center" gap={4} wrap="wrap">
            <InputGroup maxW="280px" size="sm" bg={"bg.default"} >
              <InputLeftElement pointerEvents="none">
                <RiSearchLine color="gray" />
              </InputLeftElement>
              <Input
                placeholder="Pesquisar por nome, email ou telefone..."
                bg={"bg.default"}
                rounded="md"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>

            <Flex gap={3} wrap="wrap">
              <Select
                bg={"bg.default"}
                w="fit-content" size="sm" rounded="md"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as Role | "TODOS")}
              >
                <option value="TODOS">Todos os tipos</option>
                <option value="client">Clientes</option>
                <option value="deliver">Motoqueiros</option>
              </Select>

              <Select
                bg={"bg.default"}
                w="fit-content" size="sm" rounded="md"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as UserStatus | "TODOS")}
              >
                <option value="TODOS">Todos os status</option>
                <option value="active">Activos</option>
                <option value="pending">Pendentes</option>
                <option value="suspended">Suspensos</option>
                <option value="eliminado">Eliminados</option>
              </Select>

              <Select
                bg={"bg.default"}
                w="fit-content" size="sm" rounded="md"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              >
                <option value="recentes">Mais recentes</option>
                <option value="nome">Nome A-Z</option>
              </Select>
            </Flex>
          </Flex>
        </Stack>

        {isLoading ? <Center><Spinner size={"xl"}/></Center> : <TableComponent data={filtered} columns={columns} onOpenModal={openModal} />}
        <Pagination totalCountRegister={total} registersPerPage={10} currentPage={page} onPageChange={setPage} />
      </Box>

      {/* Modal */}
      {selected && (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent bg="bg.card" borderColor={"border.subtle"}>

            <ModalHeader display="flex" justifyContent="space-between" alignItems="center">
              <HStack gap={3}>
                <Text>{selected.nome} {selected.sobrenome}</Text>
                <Tag colorScheme={statusColor[selected.status]} size="sm">
                  <TagLeftIcon as={RiCircleFill} />
                  <TagLabel>{statusLabel[selected.status]}</TagLabel>
                </Tag>
              </HStack>
              <Button
                size="sm"
                variant="outline"
                bg={"bg.secondary"}
                onClick={() => {
                  onClose();
                  router.push(`/admin/users/profile?id=${selected.id}`);
                }}
              >
                Ver perfil
              </Button>
            </ModalHeader>

            <ModalBody display="flex" flexDirection="column" gap={4}>

              {/* Perfil */}
              <Flex gap={4} align="center">
                <Avatar
                  size="xl"
                  src={selected.fotoPerfil}
                  name={`${selected.nome} ${selected.sobrenome}`}
                />
                <Box>
                  <Tag colorScheme={roleColor[selected.role]} size="sm" mb={2}>
                    <TagLabel>{roleLabel[selected.role]}</TagLabel>
                  </Tag>
                  <Text fontSize="sm" color="gray.400">E-mail</Text>
                  <Text>{selected.email}</Text>
                  <Text fontSize="sm" color="gray.400" mt={2}>Telefone</Text>
                  <Text>{selected.telefone}</Text>
                </Box>
              </Flex>

              <Divider />

              {/* Informações */}
              <SimpleGrid columns={2} gap={4}>
                <Box>
                  <Text fontSize="sm" color="gray.400">Data de nascimento</Text>
                  <Text>{new Date(selected.dataNascimento).toLocaleDateString("pt-PT")}</Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.400">Membro desde</Text>
                  <Text>{new Date(selected.criadoEm).toLocaleDateString("pt-PT")}</Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.400">Documento</Text>
                  <Text>{selected.tipoDocumento}: {selected.numeroDocumento}</Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.400">Telefone verificado</Text>
                  <Text>{selected.telefoneVerificado ? "Sim" : "Não"}</Text>
                </Box>
              </SimpleGrid>

            </ModalBody>

            <ModalFooter gap={3}>
              {selected.status !== "eliminado" && (
                <>
                  <Button
                    colorScheme="red"
                    variant="ghost"
                    size="sm"
                    onClick={() => { onClose(); deleteUser(selected.id) }}
                  >
                    Eliminar conta
                  </Button>
                  {selected.status === "active" ? (
                    <Button
                      colorScheme="red"
                      variant="outline"
                      size="sm"
                      onClick={() => { onClose(); updateStatus({id: selected.id, status: "suspended"}) }}
                    >
                      Suspender
                    </Button>
                  ) : selected.status === "suspended" ? (
                    <Button
                      colorScheme="cyan"
                      variant="outline"
                      size="sm"
                      onClick={() => { onClose(); updateStatus({id: selected.id, status: "active"}) }}
                    >
                      Reactivar
                    </Button>
                  ) : null}
                </>
              )}
              <Button size="sm" onClick={onClose}>Fechar</Button>
            </ModalFooter>

          </ModalContent>
        </Modal>
      )}
    </>
  );
}