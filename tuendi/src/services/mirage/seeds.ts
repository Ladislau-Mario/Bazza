// src/services/mirage/seeds.ts
import { Server } from "miragejs";
import { faker } from "@faker-js/faker";

export function seeds(server: Server) {
  // Criar clientes
  const clientes = server.createList("user", 15, { role: "client"} as any);

  // Criar users que serão motoqueiros
  const usersMoto = server.createList("user", 10, { role: "deliver"} as any);

  // Criar motoqueiros com user, veiculo e uploads associados
  const motoqueiros = usersMoto.map((user) => {
    const motoqueiro = server.create("motoqueiro", { user } as any);

    server.create("veiculo", { motoqueiro } as any);

    const tiposUpload = [
      "documento_bi_frente",
      "documento_bi_verso",
      "documento_carta_frente",
      "documento_carta_verso",
      "foto_veiculo",
    ] as const;

    tiposUpload.forEach((tipo) => {
      server.create("upload", { user, tipo } as any);
    });

    return motoqueiro;
  });

  // Criar carteiras para todos os users
  [...clientes, ...usersMoto].forEach((user) => {
    const carteira = server.create("carteira", { user } as any);

    server.createList("transacao", 10, { carteira } as any);
  });

  // Criar pedidos
// para — cada cliente cria 3 pedidos
  clientes.forEach((cliente) => {
    Array.from({ length: 5 }).forEach(() => {
      const motoqueiro = motoqueiros[Math.floor(Math.random() * motoqueiros.length)];
      const pedido = server.create("pedido", { cliente, motoqueiro } as any);
      server.create("avaliacao", { pedido } as any);
    });
  });

  // Criar notificações
  [...clientes, ...usersMoto].forEach((user) => {
    server.createList("notificacao", 3, { user } as any);
  });

  // Criar suportes
  clientes.slice(0, 5).forEach((user) => {
    server.create("suporte", { user } as any);
  });

  motoqueiros.forEach((motoqueiro) => {
  const plano = faker.helpers.arrayElement(["semanal", "mensal"] as const);
  server.create("subscricao", {
    motoqueiro,
    plano,
    valor: plano === "semanal" ? 6000 : 30000,
  } as any);
});
// Criar admin
const admin = server.create("user", { role: "admin" as const } as any);
server.createList("actividade", 10, { adminId: admin.id } as any);
}