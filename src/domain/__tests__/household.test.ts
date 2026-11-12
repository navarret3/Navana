import { MEMBER_COLORS, cleanName, firstName, pickMemberColor } from '@/domain/household';

describe('cleanName', () => {
  it('quita espacios sobrantes y recorta', () => {
    expect(cleanName('  Casa   de  Ana ', 40)).toBe('Casa de Ana');
    expect(cleanName('abcdefghij', 4)).toBe('abcd');
    expect(cleanName('   ', 40)).toBe('');
  });
});

describe('pickMemberColor', () => {
  it('da el primer color al primer miembro', () => {
    expect(pickMemberColor([])).toBe(MEMBER_COLORS[0]);
  });

  it('evita los colores ya cogidos, sin distinguir mayúsculas', () => {
    expect(pickMemberColor([MEMBER_COLORS[0].toLowerCase()])).toBe(MEMBER_COLORS[1]);
    expect(pickMemberColor([MEMBER_COLORS[1], MEMBER_COLORS[0]])).toBe(MEMBER_COLORS[2]);
  });

  it('vuelve al primero si están todos cogidos', () => {
    expect(pickMemberColor([...MEMBER_COLORS])).toBe(MEMBER_COLORS[0]);
  });
});

describe('firstName', () => {
  it.each([
    ['Ana García', 'Ana'],
    ['  Bruno  ', 'Bruno'],
    ['', ''],
    [null, ''],
    [undefined, ''],
  ])('de %p saca %p', (input, expected) => {
    expect(firstName(input)).toBe(expected);
  });
});
