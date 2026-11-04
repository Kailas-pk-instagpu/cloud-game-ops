import { describe, it, expect } from "vitest";
import { getScopedCafes, getCafesForUser } from "@/shared/lib/cafeScope";
import { MOCK_CAFES, MOCK_USERS } from "@/shared/lib/mock-data";

const user = (id: string) => MOCK_USERS.find(u => u.id === id)!;
const names = (ids: string[]) => ids.map(id => MOCK_CAFES.find(b => b.id === id)!.name);

describe("cafe list scoped to the clicked user", () => {
  it("shows a manager only the cafe they run", () => {
    const scoped = getScopedCafes(MOCK_CAFES, user('1')); // super admin
    const result = getCafesForUser(scoped, user('7')); // Morgan Tran
    expect(result.map(b => b.id)).toEqual(['cafe-2']);
    expect(names(result.map(b => b.id))).toEqual(['Uptown Arena']);
  });

  it("shows a cafe owner every cafe they own", () => {
    const scoped = getScopedCafes(MOCK_CAFES, user('2')); // sales manager Jordan Lee
    const result = getCafesForUser(scoped, user('4')); // Sam Rivera
    expect(result.map(b => b.id)).toEqual(['cafe-1', 'cafe-2']);
  });

  it("shows a sales manager only the cafes assigned to them", () => {
    const scoped = getScopedCafes(MOCK_CAFES, user('1'));
    const result = getCafesForUser(scoped, user('3')); // Taylor Kim
    expect(result.map(b => b.id)).toEqual(['cafe-4']);
  });

  it("hides cafes the clicked person does not belong to", () => {
    const scoped = getScopedCafes(MOCK_CAFES, user('5')); // Casey Park owns cafe-2
    const result = getCafesForUser(scoped, user('6')); // Riley Chen runs cafe-1
    expect(result).toEqual([]);
  });

  it("keeps the full scoped list when nobody was clicked", () => {
    const scoped = getScopedCafes(MOCK_CAFES, user('4')); // Sam Rivera
    expect(getCafesForUser(scoped)).toEqual(scoped);
    expect(scoped.map(b => b.id)).toEqual(['cafe-1', 'cafe-2']);
  });
});
