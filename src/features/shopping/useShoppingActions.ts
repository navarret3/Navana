import {
  addShoppingItem,
  finishShopping,
  removeShoppingItem,
  setItemCategory,
  setItemChecked,
} from '@/data/shopping';
import type { CategoryId } from '@/domain/shopping/categories';
import { canonicalName, categorize } from '@/domain/shopping/categorize';
import { productKey } from '@/domain/shopping/normalize';
import { learnedCategories } from '@/domain/shopping/suggest';
import type { ShoppingItem } from '@/domain/shopping/types';
import { saveFailed } from '@/state/notices';
import { useSession } from '@/state/session';
import { useShopping } from '@/state/shopping';

export type AddOutcome = 'added' | 'restored' | 'alreadyThere' | 'empty';

/** Qué ha pasado al añadir y con qué nombre ha quedado el producto en la lista. */
export type AddResult = { outcome: AddOutcome; name: string };

/**
 * Acciones sobre la lista de la compra. Como con las tareas, ninguna espera al
 * servidor: se aplican en local y se sincronizan cuando hay red, que en el súper
 * no siempre la hay.
 */
export function useShoppingActions() {
  const householdId = useSession((state) => state.household?.id);
  const uid = useSession((state) => state.user?.uid);
  const items = useShopping((state) => state.items);
  const catalog = useShopping((state) => state.catalog);

  /** Añade un producto. Si ya estaba tachado lo recupera; si ya estaba pendiente, no hace nada. */
  const add = (rawName: string, knownCategory?: CategoryId): AddResult => {
    const name = canonicalName(rawName);
    const key = productKey(name);
    if (!householdId || !uid || !key) return { outcome: 'empty', name };

    const existing = items.find((item) => item.key === key);
    if (existing && !existing.checked) return { outcome: 'alreadyThere', name: existing.name };
    if (existing) {
      setItemChecked(householdId, existing.id, false, uid).catch(saveFailed('No se ha podido recuperar'));
      return { outcome: 'restored', name: existing.name };
    }

    const categoryId = knownCategory ?? categorize(name, learnedCategories(catalog));
    addShoppingItem(householdId, { name, key, categoryId, addedBy: uid }).catch(
      saveFailed('No se ha podido añadir a la lista'),
    );
    return { outcome: 'added', name };
  };

  const toggle = (item: ShoppingItem) => {
    if (!householdId || !uid) return;
    setItemChecked(householdId, item.id, !item.checked, uid).catch(
      saveFailed('No se ha podido tachar el producto'),
    );
  };

  const remove = (item: ShoppingItem) => {
    if (!householdId) return;
    removeShoppingItem(householdId, item.id).catch(saveFailed('No se ha podido quitar el producto'));
  };

  const changeCategory = (item: ShoppingItem, categoryId: CategoryId) => {
    if (!householdId) return;
    setItemCategory(householdId, item, categoryId).catch(
      saveFailed('No se ha podido cambiar la categoría'),
    );
  };

  const finish = () => {
    if (!householdId) return;
    const checked = items.filter((item) => item.checked);
    if (checked.length === 0) return;
    finishShopping(householdId, checked).catch(saveFailed('No se ha podido terminar la compra'));
  };

  return { add, toggle, remove, changeCategory, finish };
}
