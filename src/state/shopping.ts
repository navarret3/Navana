import { create } from 'zustand';

import { watchCatalog, watchShoppingItems } from '@/data/shopping';
import type { CatalogEntry, ShoppingItem } from '@/domain/shopping/types';

type ShoppingState = {
  /** La lista de la compra: lo pendiente y lo ya tachado. */
  items: ShoppingItem[];
  /** Lo que el hogar ha ido comprando y las categorías que ha corregido. */
  catalog: CatalogEntry[];
};

export const useShopping = create<ShoppingState>()(() => ({
  items: [],
  catalog: [],
}));

/** Empieza a escuchar la lista y el catálogo del hogar. Devuelve cómo parar. */
export function startShoppingSync(householdId: string): () => void {
  // Si se pierde el acceso al hogar, la sesión ya se encarga de sacar al usuario.
  const ignore = () => undefined;
  const stops = [
    watchShoppingItems(householdId, (items) => useShopping.setState({ items }), ignore),
    watchCatalog(householdId, (catalog) => useShopping.setState({ catalog }), ignore),
  ];
  return () => {
    stops.forEach((stop) => stop());
    useShopping.setState({ items: [], catalog: [] });
  };
}
