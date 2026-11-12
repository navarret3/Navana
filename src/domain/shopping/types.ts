import type { CategoryId } from './categories';

export type ShoppingItem = {
  id: string;
  name: string;
  /** Clave del producto (ver `productKey`), para no duplicar y enlazar con el catálogo. */
  key: string;
  categoryId: CategoryId;
  /** Tachado: ya está en el carro. */
  checked: boolean;
  addedBy: string;
  checkedBy: string | null;
};

/** Lo que el hogar sabe de un producto: su categoría y cuánto se compra. */
export type CatalogEntry = {
  key: string;
  name: string;
  categoryId: CategoryId;
  timesBought: number;
  /** Última vez que se compró, en milisegundos; `null` si solo se ha corregido su categoría. */
  lastBoughtAt: number | null;
};
