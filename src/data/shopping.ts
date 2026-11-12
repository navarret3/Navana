import {
  collection,
  db,
  deleteDoc,
  doc,
  increment,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from '@/data/fb';
import { OTHER_CATEGORY, isCategoryId, type CategoryId } from '@/domain/shopping/categories';
import { canonicalName } from '@/domain/shopping/categorize';
import type { CatalogEntry, ShoppingItem } from '@/domain/shopping/types';

const itemsCol = (hid: string) => collection(db, 'households', hid, 'shoppingItems');
const itemRef = (hid: string, id: string) => doc(db, 'households', hid, 'shoppingItems', id);
const catalogRef = (hid: string, key: string) => doc(db, 'households', hid, 'catalog', key);

type Raw = Record<string, unknown>;
type OnError = (error: unknown) => void;

const text = (value: unknown) => (typeof value === 'string' ? value : '');
const categoryOf = (value: unknown): CategoryId => (isCategoryId(value) ? value : OTHER_CATEGORY);

function toItem(id: string, data: Raw): ShoppingItem {
  return {
    id,
    name: canonicalName(text(data.name)),
    key: text(data.key),
    categoryId: categoryOf(data.categoryId),
    checked: data.checked === true,
    addedBy: text(data.addedBy),
    checkedBy: typeof data.checkedBy === 'string' ? data.checkedBy : null,
  };
}

function toCatalogEntry(key: string, data: Raw): CatalogEntry {
  return {
    key,
    name: canonicalName(text(data.name)),
    categoryId: categoryOf(data.categoryId),
    timesBought: typeof data.timesBought === 'number' ? data.timesBought : 0,
    lastBoughtAt: typeof data.lastBoughtAt === 'number' ? data.lastBoughtAt : null,
  };
}

export function watchShoppingItems(
  hid: string,
  onChange: (items: ShoppingItem[]) => void,
  onError: OnError,
) {
  return onSnapshot(
    itemsCol(hid),
    (snapshot) => onChange(snapshot.docs.map((entry) => toItem(entry.id, entry.data()))),
    onError,
  );
}

export function watchCatalog(
  hid: string,
  onChange: (catalog: CatalogEntry[]) => void,
  onError: OnError,
) {
  return onSnapshot(
    collection(db, 'households', hid, 'catalog'),
    (snapshot) => onChange(snapshot.docs.map((entry) => toCatalogEntry(entry.id, entry.data()))),
    onError,
  );
}

export async function addShoppingItem(
  hid: string,
  item: Pick<ShoppingItem, 'name' | 'key' | 'categoryId' | 'addedBy'>,
): Promise<void> {
  await setDoc(doc(itemsCol(hid)), {
    ...item,
    checked: false,
    checkedBy: null,
    addedAt: serverTimestamp(),
  });
}

export async function setItemChecked(
  hid: string,
  id: string,
  checked: boolean,
  uid: string,
): Promise<void> {
  await updateDoc(itemRef(hid, id), { checked, checkedBy: checked ? uid : null });
}

export async function removeShoppingItem(hid: string, id: string): Promise<void> {
  await deleteDoc(itemRef(hid, id));
}

/**
 * Cambia la categoría de un producto de la lista y lo apunta en el catálogo del hogar,
 * para que la próxima vez que se añada ya vaya a su sitio.
 */
export async function setItemCategory(
  hid: string,
  item: ShoppingItem,
  categoryId: CategoryId,
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(itemRef(hid, item.id), { categoryId });
  batch.set(catalogRef(hid, item.key), { name: item.name, categoryId }, { merge: true });
  await batch.commit();
}

/**
 * "Terminar compra": quita de la lista lo tachado y lo suma al catálogo del hogar,
 * que es de donde salen los frecuentes y el autocompletar.
 */
export async function finishShopping(
  hid: string,
  checkedItems: readonly ShoppingItem[],
): Promise<void> {
  const boughtAt = Date.now();
  const batch = writeBatch(db);
  for (const item of checkedItems) {
    batch.delete(itemRef(hid, item.id));
    batch.set(
      catalogRef(hid, item.key),
      {
        name: item.name,
        categoryId: item.categoryId,
        timesBought: increment(1),
        lastBoughtAt: boughtAt,
      },
      { merge: true },
    );
  }
  await batch.commit();
}
