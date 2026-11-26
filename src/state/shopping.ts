import { create } from 'zustand';

import { watchCatalog, watchShoppingItems, watchShoppingStores } from '@/data/shopping';
import type { CatalogEntry, ShoppingItem, ShoppingStore } from '@/domain/shopping/types';

type ShoppingState = {
  stores: ShoppingStore[];
  /** La lista de la compra: lo pendiente y lo ya tachado. */
  items: ShoppingItem[];
  /** Lo que el hogar ha ido comprando y las categorías que ha corregido. */
  catalog: CatalogEntry[];
};

export const useShopping = create<ShoppingState>()(() => ({
  stores: [],
  items: [],
  catalog: [],
}));

/** Empieza a escuchar la lista y el catálogo del hogar. Devuelve cómo parar. */
export function startShoppingSync(householdId: string): () => void {
  // Si se pierde el acceso al hogar, la sesión ya se encarga de sacar al usuario.
  const ignore = () => undefined;
  const stops = [
    watchShoppingStores(householdId, (stores) => useShopping.setState({ stores }), ignore),
    watchShoppingItems(householdId, (items) => useShopping.setState({ items }), ignore),
    watchCatalog(householdId, (catalog) => useShopping.setState({ catalog }), ignore),
  ];
  return () => {
    stops.forEach((stop) => stop());
    useShopping.setState({ items: [], catalog: [], stores: [] });
  };
}
