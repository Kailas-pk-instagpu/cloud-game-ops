import { describe, it, expect } from "vitest";
import { getRoutesForUser } from "@/shared/lib/rbac";
import { DEFAULT_GRANTS, PERMISSIONS, type Permission } from "@/shared/lib/permissions";
import type { Role } from "@/shared/types/auth";

const can = (role: Role) => (p: Permission) => DEFAULT_GRANTS[role].includes(p);
const menu = (role: Role) => getRoutesForUser(role, can(role)).map(r => r.path);

describe("menu by permission, default matrix", () => {
  // The menus the signed-off frontend showed per role before permissions (rbac.ts roles lists), plus the new Permissions page.
  it("matches the old role menus exactly", () => {
    expect(menu("super_admin")).toEqual(["/dashboard", "/users", "/approvals", "/gpu-nodes", "/branches", "/billing", "/monitoring", "/issues", "/analytics", "/permissions", "/notifications", "/settings"]);
    expect(menu("admin")).toEqual(["/dashboard", "/users", "/billing", "/notifications", "/settings"]);
    expect(menu("cafe_owner")).toEqual(["/dashboard", "/users", "/branches", "/billing", "/issues", "/analytics", "/notifications", "/settings"]);
    expect(menu("manager")).toEqual(["/dashboard", "/seats", "/billing", "/notifications", "/settings"]);
  });

  it("keeps pre-booking hidden for everyone and labels the Sales Manager's users page Cafe Management", () => {
    for (const r of Object.keys(DEFAULT_GRANTS) as Role[]) expect(menu(r)).not.toContain("/bookings");
    expect(getRoutesForUser("admin", can("admin")).find(r => r.path === "/users")?.label).toBe("Cafe Management");
  });

  it("follows a changed matrix: a granted permission adds the page", () => {
    const withIssues = (p: Permission) => p === "issues.view" || can("manager")(p);
    expect(getRoutesForUser("manager", withIssues).map(r => r.path)).toContain("/issues");
  });
});

describe("default matrix", () => {
  it("never gives a locked (platform-only) permission to a cafe role", () => {
    for (const r of ["cafe_owner", "manager"] as const) {
      expect(DEFAULT_GRANTS[r].filter(p => PERMISSIONS[p].locked)).toEqual([]);
    }
  });
  it("only uses known keys and keeps permissions.manage on the super admin", () => {
    for (const keys of Object.values(DEFAULT_GRANTS)) for (const k of keys) expect(PERMISSIONS).toHaveProperty([k]);
    expect(DEFAULT_GRANTS.super_admin).toContain("permissions.manage");
  });
});
