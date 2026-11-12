import { addDays, startOfMonth, startOfWeek, type DateKey } from '@/domain/dates';

import type { Completion } from './types';

export type BalancePeriod = 'week' | 'month';

export type DateRange = { from: DateKey; to: DateKey };

/** Semana (de lunes a domingo) o mes natural que contiene `today`. */
export function periodRange(period: BalancePeriod, today: DateKey): DateRange {
  if (period === 'week') {
    const from = startOfWeek(today);
    return { from, to: addDays(from, 6) };
  }
  const from = startOfMonth(today);
  const [year, month] = from.split('-').map(Number);
  const nextMonth =
    month === 12 ? `${(year ?? 0) + 1}-01-01` : `${year}-${String((month ?? 0) + 1).padStart(2, '0')}-01`;
  return { from, to: addDays(nextMonth, -1) };
}

export type MemberBalance = {
  uid: string;
  /** Suma del esfuerzo de lo que ha hecho. */
  effort: number;
  /** Número de tareas hechas. */
  count: number;
  /** Parte del esfuerzo total, entre 0 y 1. */
  share: number;
};

export type ZoneBalance = {
  zoneId: string | null;
  effort: number;
  byMember: Record<string, number>;
};

export type Balance = {
  totalEffort: number;
  members: MemberBalance[];
  zones: ZoneBalance[];
};

/**
 * Reparto del esfuerzo en un periodo. Es un espejo, no un marcador: no hay puntos ni
 * ganadores, solo qué parte del trabajo ha caído en cada uno y en qué zonas.
 */
export function computeBalance(
  completions: readonly Completion[],
  memberIds: readonly string[],
  range: DateRange,
): Balance {
  const inRange = completions.filter(
    (completion) => completion.completedOn >= range.from && completion.completedOn <= range.to,
  );

  const perMember = new Map<string, { effort: number; count: number }>();
  for (const uid of memberIds) perMember.set(uid, { effort: 0, count: 0 });
  const perZone = new Map<string | null, ZoneBalance>();
  let totalEffort = 0;

  for (const completion of inRange) {
    totalEffort += completion.effort;

    const member = perMember.get(completion.completedBy) ?? { effort: 0, count: 0 };
    member.effort += completion.effort;
    member.count += 1;
    perMember.set(completion.completedBy, member);

    const zone = perZone.get(completion.zoneId) ?? {
      zoneId: completion.zoneId,
      effort: 0,
      byMember: {},
    };
    zone.effort += completion.effort;
    zone.byMember[completion.completedBy] =
      (zone.byMember[completion.completedBy] ?? 0) + completion.effort;
    perZone.set(completion.zoneId, zone);
  }

  return {
    totalEffort,
    members: [...perMember.entries()].map(([uid, { effort, count }]) => ({
      uid,
      effort,
      count,
      share: totalEffort === 0 ? 0 : effort / totalEffort,
    })),
    zones: [...perZone.values()].sort((a, b) => b.effort - a.effort),
  };
}
