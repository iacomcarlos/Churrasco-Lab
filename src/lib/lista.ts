"use client";
import { useSyncExternalStore } from "react";
import { aulas } from "@/config/evento";

/**
 * "Minha lista": as aulas-show que a pessoa marcou. Fica só no navegador dela
 * (localStorage), sem cadastro e sem servidor. A mesma lista alimenta a inscrição.
 */
const CHAVE = "churrascolab:lista:v1";
const validos = new Set(aulas.map((a) => a.id));
const VAZIA: string[] = [];
let atual: string[] = VAZIA;
let carregou = false;
const ouvintes = new Set<() => void>();

function carregar() {
  if (carregou || typeof window === "undefined") return;
  carregou = true;
  try {
    const bruto = JSON.parse(window.localStorage.getItem(CHAVE) || "[]");
    if (Array.isArray(bruto)) atual = bruto.filter((x) => typeof x === "string" && validos.has(x));
  } catch {
    /* navegação privada: a lista vale só para esta visita */
  }
}

function gravar(nova: string[]) {
  atual = aulas.map((a) => a.id).filter((id) => nova.includes(id));
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(atual));
  } catch {
    /* sem armazenamento: segue em memória */
  }
  ouvintes.forEach((f) => f());
}

export const lista = {
  ler: () => {
    carregar();
    return atual;
  },
  alternar: (id: string) => {
    carregar();
    gravar(atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]);
  },
  definir: (ids: string[]) => gravar(ids),
};

const assinar = (f: () => void) => {
  ouvintes.add(f);
  return () => {
    ouvintes.delete(f);
  };
};

export function useLista() {
  return useSyncExternalStore(assinar, lista.ler, () => VAZIA);
}
