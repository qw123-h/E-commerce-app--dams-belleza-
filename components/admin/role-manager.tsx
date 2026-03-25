"use client";

import {useMemo, useState, useTransition} from "react";

type Permission = {
  id: string;
  key: string;
  label: string;
  module: string;
};

type Role = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  scope: "SYSTEM" | "CUSTOM";
  isActive: boolean;
  rolePermissions: Array<{
    permission: Permission;
  }>;
};

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  userRoles: Array<{
    role: {
      id: string;
      slug: string;
      name: string;
    };
  }>;
};

type Props = {
  roles: Role[];
  permissions: Permission[];
  users: User[];
  labels: {
    createRole: string;
    roleName: string;
    roleSlug: string;
    roleDescription: string;
    create: string;
    save: string;
    saving: string;
    permissions: string;
    assignUserRole: string;
    user: string;
    role: string;
    assign: string;
    templates: string;
    templateOwner: string;
    templateHelper: string;
    systemRoleLocked: string;
  };
};

const OWNER_TEMPLATE = [
  "products.read",
  "products.write",
  "orders.read",
  "orders.write",
  "payments.review",
  "reports.read",
];

const HELPER_TEMPLATE = ["orders.read", "orders.write", "payments.review"];

export function RoleManager({roles, permissions, users, labels}: Props) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState(roles[0]?.id ?? "");
  const [editingPermissionKeys, setEditingPermissionKeys] = useState<string[]>(
    roles[0]?.rolePermissions.map((entry) => entry.permission.key) ?? []
  );
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id ?? "");
  const [selectedAssignRoleId, setSelectedAssignRoleId] = useState(roles[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();

  const selectedRole = useMemo(() => roles.find((role) => role.id === selectedRoleId) ?? null, [roles, selectedRoleId]);

  function toggleCreatePermission(key: string) {
    setRolePermissions((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]));
  }

  function toggleEditPermission(key: string) {
    setEditingPermissionKeys((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]));
  }

  function applyTemplate(template: "owner" | "helper") {
    setRolePermissions(template === "owner" ? OWNER_TEMPLATE : HELPER_TEMPLATE);
  }

  function createRoleAction() {
    if (!name.trim() || !slug.trim()) {
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/roles", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({name, slug, description, permissionKeys: rolePermissions}),
      });

      if (response.ok) {
        window.location.reload();
      }
    });
  }

  function saveRolePermissions() {
    if (!selectedRole) {
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/roles/${selectedRole.id}/permissions`, {
        method: "PATCH",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({permissionKeys: editingPermissionKeys}),
      });

      if (response.ok) {
        window.location.reload();
      }
    });
  }

  function assignRoleAction() {
    if (!selectedUserId || !selectedAssignRoleId) {
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/users/${selectedUserId}/roles`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({roleId: selectedAssignRoleId}),
      });

      if (response.ok) {
        window.location.reload();
      }
    });
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <article className="space-y-4 rounded-3xl border border-charcoal-900/10 bg-cream-50 p-5">
          <h2 className="font-display text-2xl text-charcoal-900">{labels.createRole}</h2>
          <div className="grid gap-3">
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder={labels.roleName} className="rounded-xl border border-charcoal-900/20 bg-white px-3 py-2 text-sm" />
            <input value={slug} onChange={(event) => setSlug(event.target.value.toLowerCase())} placeholder={labels.roleSlug} className="rounded-xl border border-charcoal-900/20 bg-white px-3 py-2 text-sm" />
            <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder={labels.roleDescription} className="rounded-xl border border-charcoal-900/20 bg-white px-3 py-2 text-sm" />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-charcoal-700">{labels.templates}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => applyTemplate("owner")} className="rounded-lg border border-charcoal-900/20 bg-white px-3 py-1 text-xs font-semibold">
                {labels.templateOwner}
              </button>
              <button type="button" onClick={() => applyTemplate("helper")} className="rounded-lg border border-charcoal-900/20 bg-white px-3 py-1 text-xs font-semibold">
                {labels.templateHelper}
              </button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-charcoal-700">{labels.permissions}</p>
            <div className="grid max-h-56 gap-2 overflow-auto rounded-xl border border-charcoal-900/10 bg-white p-3 sm:grid-cols-2">
              {permissions.map((permission) => (
                <label key={permission.id} className="inline-flex items-center gap-2 text-xs text-charcoal-800">
                  <input
                    type="checkbox"
                    checked={rolePermissions.includes(permission.key)}
                    onChange={() => toggleCreatePermission(permission.key)}
                  />
                  {permission.key}
                </label>
              ))}
            </div>
          </div>

          <button onClick={createRoleAction} className="rounded-xl bg-charcoal-900 px-4 py-2 text-sm font-semibold text-cream-50">
            {isPending ? labels.saving : labels.create}
          </button>
        </article>

        <article className="space-y-4 rounded-3xl border border-charcoal-900/10 bg-cream-50 p-5">
          <h2 className="font-display text-2xl text-charcoal-900">{labels.permissions}</h2>
          <select
            value={selectedRoleId}
            onChange={(event) => {
              const nextRole = roles.find((role) => role.id === event.target.value);
              setSelectedRoleId(event.target.value);
              setEditingPermissionKeys(nextRole?.rolePermissions.map((entry) => entry.permission.key) ?? []);
            }}
            className="w-full rounded-xl border border-charcoal-900/20 bg-white px-3 py-2 text-sm"
          >
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name} ({role.scope})
              </option>
            ))}
          </select>

          {selectedRole?.scope === "SYSTEM" ? (
            <p className="rounded-xl border border-dashed border-charcoal-900/20 bg-white px-3 py-2 text-xs text-charcoal-700">
              {labels.systemRoleLocked}
            </p>
          ) : (
            <>
              <div className="grid max-h-56 gap-2 overflow-auto rounded-xl border border-charcoal-900/10 bg-white p-3 sm:grid-cols-2">
                {permissions.map((permission) => (
                  <label key={permission.id} className="inline-flex items-center gap-2 text-xs text-charcoal-800">
                    <input
                      type="checkbox"
                      checked={editingPermissionKeys.includes(permission.key)}
                      onChange={() => toggleEditPermission(permission.key)}
                    />
                    {permission.key}
                  </label>
                ))}
              </div>
              <button onClick={saveRolePermissions} className="rounded-xl border border-charcoal-900/20 bg-white px-4 py-2 text-sm font-semibold text-charcoal-900">
                {isPending ? labels.saving : labels.save}
              </button>
            </>
          )}
        </article>
      </div>

      <article className="space-y-4 rounded-3xl border border-charcoal-900/10 bg-cream-50 p-5">
        <h2 className="font-display text-2xl text-charcoal-900">{labels.assignUserRole}</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} className="rounded-xl border border-charcoal-900/20 bg-white px-3 py-2 text-sm">
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.firstName} {user.lastName} ({user.email})
              </option>
            ))}
          </select>
          <select value={selectedAssignRoleId} onChange={(event) => setSelectedAssignRoleId(event.target.value)} className="rounded-xl border border-charcoal-900/20 bg-white px-3 py-2 text-sm">
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          <button onClick={assignRoleAction} className="rounded-xl bg-charcoal-900 px-4 py-2 text-sm font-semibold text-cream-50">
            {isPending ? labels.saving : labels.assign}
          </button>
        </div>

        <ul className="space-y-2">
          {users.map((user) => (
            <li key={user.id} className="rounded-xl border border-charcoal-900/10 bg-white px-3 py-2 text-sm text-charcoal-800">
              <p className="font-semibold text-charcoal-900">
                {user.firstName} {user.lastName} ({user.status})
              </p>
              <p className="mt-1 text-xs">
                {user.userRoles.length
                  ? user.userRoles.map((entry) => entry.role.name).join(", ")
                  : "No assigned role"}
              </p>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
