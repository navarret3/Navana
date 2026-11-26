import type { ShoppingItem, ShoppingStore } from './types';

export const STORE_NAME_MAX = 40;

/** Los artículos antiguos o de una tienda eliminada siguen en la lista general. */
export function groupByStore(items: ShoppingItem[], stores: ShoppingStore[]) {
  const groups = new Map<string, ShoppingItem[]>(stores.map((store) => [store.id, []]));
  const unassigned: ShoppingItem[] = [];
  for (const item of items) {
    (groups.get(item.storeId ?? '') ?? unassigned).push(item);
  }
  return [
    { store: null, items: unassigned },
    ...stores.map((store) => ({ store, items: groups.get(store.id) ?? [] })),
  ].filter((group) => group.items.length > 0);
}
