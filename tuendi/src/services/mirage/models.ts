// src/services/mirage/models.ts
import { Model, belongsTo, hasMany } from "miragejs";

export const userModel = Model.extend({
  motoqueiro: hasMany("motoqueiro"),
  pedidosComoCliente: hasMany("pedido", { inverse: "cliente" }),
  carteira: belongsTo("carteira"),
  uploads: hasMany("upload"),
  notificacoes: hasMany("notificacao"),
  suportes: hasMany("suporte"),
});

export const motoqueiroModel = Model.extend({
  user: belongsTo("user"),
  veiculo: belongsTo("veiculo"),
  uploads: hasMany("upload"),
  pedidos: hasMany("pedido"),
});

export const veiculoModel = Model.extend({
  motoqueiro: belongsTo("motoqueiro"),
});

export const uploadModel = Model.extend({
  user: belongsTo("user"),
});

export const pedidoModel = Model.extend({
  cliente: belongsTo("user"),
  motoqueiro: belongsTo("motoqueiro"),
  avaliacao: belongsTo("avaliacao"),
  transacoes: hasMany("transacao"),
});

export const avaliacaoModel = Model.extend({
  pedido: belongsTo("pedido"),
});

export const carteiraModel = Model.extend({
  user: belongsTo("user"),
  transacoes: hasMany("transacao"),
});

export const transacaoModel = Model.extend({
  carteira: belongsTo("carteira"),
  pedido: belongsTo("pedido"),
});

export const notificacaoModel = Model.extend({
  user: belongsTo("user"),
});

export const suporteModel = Model.extend({
  user: belongsTo("user"),
});

export const subscricaoModel = Model.extend({
  motoqueiro: belongsTo("motoqueiro"),
});

export const actividadeModel = Model.extend({});