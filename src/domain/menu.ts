import { addDays, startOfWeek, type DateKey } from '@/domain/dates';
import { displayName, productKey } from '@/domain/shopping/normalize';

/** Menú semanal: qué se come y se cena cada día, y qué hace falta comprar para ello. */

export const MEAL_SLOTS = ['lunch', 'dinner'] as const;

export type MealSlot = (typeof MEAL_SLOTS)[number];

export type Meal = {
  title: string;
  ingredients: string[];
};

export type DayMenu = {
  date: DateKey;
  lunch: Meal | null;
  dinner: Meal | null;
};

export const MEAL_TITLE_MAX = 80;
export const MEAL_INGREDIENTS_MAX = 30;

/** Los siete días, de lunes a domingo, de la semana que contiene `date`. */
export function weekDays(date: DateKey): DateKey[] {
  const monday = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

/**
 * Convierte lo escrito ("tomates, cebolla" o una cosa por línea) en una lista de
 * ingredientes sin repetidos.
 */
export function parseIngredients(text: string): string[] {
  const seen = new Set<string>();
  const ingredients: string[] = [];
  for (const piece of text.split(/[,\n;]/)) {
    const name = displayName(piece);
    const key = productKey(name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    ingredients.push(name);
    if (ingredients.length === MEAL_INGREDIENTS_MAX) break;
  }
  return ingredients;
}

export function mealOf(day: DayMenu | undefined, slot: MealSlot): Meal | null {
  return day?.[slot] ?? null;
}

/**
 * Ingredientes de los días indicados que todavía no están pendientes en la lista de
 * la compra, sin repetidos. `pendingKeys` son las claves de lo que ya está apuntado.
 */
export function ingredientsToBuy(
  menu: readonly DayMenu[],
  days: readonly DateKey[],
  pendingKeys: ReadonlySet<string>,
): string[] {
  const wanted = new Set(days);
  const seen = new Set(pendingKeys);
  const toBuy: string[] = [];
  for (const day of [...menu].sort((a, b) => a.date.localeCompare(b.date))) {
    if (!wanted.has(day.date)) continue;
    for (const slot of MEAL_SLOTS) {
      for (const ingredient of day[slot]?.ingredients ?? []) {
        const key = productKey(ingredient);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        toBuy.push(ingredient);
      }
    }
  }
  return toBuy;
}
