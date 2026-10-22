import { describe, it, expect } from "vitest";
import { getScopedBranches, getBranchesForUser } from "@/shared/lib/branchScope";
import { MOCK_BRANCHES, MOCK_USERS } from "@/shared/lib/mock-data";

const user = (id: string) => MOCK_USERS.find(u => u.id === id)!;
const names = (ids: string[]) => ids.map(id => MOCK_BRANCHES.find(b => b.id === id)!.name);

describe("branch list scoped to the clicked user", () => {
  it("shows a manager only the branch they run", () => {
    const scoped = getScopedBranches(MOCK_BRANCHES, user('1')); // super admin
    const result = getBranchesForUser(scoped, user('7')); // Morgan Tran
    expect(result.map(b => b.id)).toEqual(['branch-2']);
    expect(names(result.map(b => b.id))).toEqual(['Uptown Arena']);
  });

  it("shows a cafe owner every branch they own", () => {
    const scoped = getScopedBranches(MOCK_BRANCHES, user('2')); // sales manager Jordan Lee
    const result = getBranchesForUser(scoped, user('4')); // Sam Rivera
    expect(result.map(b => b.id)).toEqual(['branch-1', 'branch-2']);
  });

  it("shows a sales manager only the branches assigned to them", () => {
    const scoped = getScopedBranches(MOCK_BRANCHES, user('1'));
    const result = getBranchesForUser(scoped, user('3')); // Taylor Kim
    expect(result.map(b => b.id)).toEqual(['branch-4']);
  });

  it("hides branches the clicked person does not belong to", () => {
    const scoped = getScopedBranches(MOCK_BRANCHES, user('5')); // Casey Park owns cafe-2
    const result = getBranchesForUser(scoped, user('6')); // Riley Chen runs branch-1
    expect(result).toEqual([]);
  });

  it("keeps the full scoped list when nobody was clicked", () => {
    const scoped = getScopedBranches(MOCK_BRANCHES, user('4')); // Sam Rivera
    expect(getBranchesForUser(scoped)).toEqual(scoped);
    expect(scoped.map(b => b.id)).toEqual(['branch-1', 'branch-2']);
  });
});
