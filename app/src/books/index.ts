import { FCDN } from './fcdn';
import type { BookConfig, BookEntry } from './types';

export const BOOKS: BookEntry[] = [
  FCDN,
  { id: 'CDSI', tome: 2, title: "La Corne des Sables d'Ivoire", available: false },
  { id: 'T3', tome: 3, title: 'Tome 3', available: false },
];

export function getBook(id: string): BookConfig {
  const book = BOOKS.find(b => b.id === id);
  if (!book || !book.available) throw new Error(`Livre inconnu ou indisponible : ${id}`);
  return book;
}

export * from './types';
