"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PasswordInput } from "@/components/ui/password-input";
import {
  addStaff,
  listRoles,
  listStaff,
  removeStaff,
  updateStaffRole,
  updateStaffStatus,
} from "@/features/staff/api";
import { ApiError } from "@/lib/api/client";
import { useAppSelector } from "@/lib/store/hooks";

const fieldClassName =
  "mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2";

const staffFormSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.union([
    z.literal(""),
    z.string().min(8, "Password must be at least 8 characters").max(128),
  ]),
  role_key: z.string().min(1, "Role is required"),
});

type StaffFormValues = z.infer<typeof staffFormSchema>;

export function StaffScreen() {
  const queryClient = useQueryClient();
  const currentUserId = useAppSelector((state) => state.auth.user?.id);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const staffQuery = useQuery({
    queryKey: ["staff", "list"],
    queryFn: () => listStaff({ limit: 100 }),
  });
  const rolesQuery = useQuery({
    queryKey: ["staff", "roles"],
    queryFn: listRoles,
  });

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: { email: "", password: "", role_key: "cashier" },
  });

  const staff = staffQuery.data?.items ?? [];
  const roles = rolesQuery.data ?? [];

  async function invalidate() {
    await queryClient.invalidateQueries({ queryKey: ["staff"] });
  }

  async function onAdd(values: StaffFormValues) {
    setError(null);
    try {
      await addStaff({
        email: values.email,
        password: values.password?.trim() || null,
        role_key: values.role_key,
      });
      form.reset({ email: "", password: "", role_key: "cashier" });
      setShowForm(false);
      await invalidate();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add staff");
    }
  }

  async function onRoleChange(membershipId: string, roleKey: string) {
    setError(null);
    try {
      await updateStaffRole(membershipId, { role_key: roleKey });
      await invalidate();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update role");
    }
  }

  async function onStatusToggle(
    membershipId: string,
    status: string,
    userId: string,
  ) {
    if (userId === currentUserId) {
      setError("You cannot change your own account status.");
      return;
    }
    setError(null);
    try {
      await updateStaffStatus(membershipId, {
        status: status === "active" ? "inactive" : "active",
      });
      await invalidate();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not update status",
      );
    }
  }

  async function onRemove(membershipId: string, userId: string) {
    if (userId === currentUserId) {
      setError("You cannot remove your own membership.");
      return;
    }
    if (!window.confirm("Remove this staff member from the business?")) return;
    setError(null);
    try {
      await removeStaff(membershipId);
      await invalidate();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not remove staff");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage who can access this business and their roles.
          </p>
        </div>
        <Button type="button" onClick={() => setShowForm(true)}>
          Add staff
        </Button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>New staff member</DialogTitle>
            <DialogDescription>
              Invite someone to access this business with a role.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(onAdd)}
            className="grid gap-4 sm:grid-cols-2"
          >
            <div className="sm:col-span-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                className={fieldClassName}
                {...form.register("email")}
              />
              {form.formState.errors.email ? (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.email.message}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium">
                Temporary password
              </label>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                {...form.register("password")}
              />
              {form.formState.errors.password ? (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.password.message}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="role_key" className="text-sm font-medium">
                Role
              </label>
              <select
                id="role_key"
                className={fieldClassName}
                {...form.register("role_key")}
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.key}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Add
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {staffQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading staff…</p>
      ) : null}
      {staffQuery.isError ? (
        <p className="text-sm text-red-600">
          {(staffQuery.error as Error).message}
        </p>
      ) : null}

      {!staffQuery.isLoading && staff.length === 0 ? (
        <p className="glass-panel rounded-xl border-dashed p-6 text-sm text-muted-foreground">
          No staff listed.
        </p>
      ) : (
        <div className="glass-panel overflow-x-auto rounded-xl">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-muted/60 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Role</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => (
                <tr
                  key={member.membership.id}
                  className="border-t border-border"
                >
                  <td className="px-3 py-2 font-medium">{member.user.email}</td>
                  <td className="px-3 py-2">
                    <select
                      className="rounded-md border border-border bg-background px-2 py-1"
                      value={member.membership.role.key}
                      onChange={(event) =>
                        void onRoleChange(
                          member.membership.id,
                          event.target.value,
                        )
                      }
                    >
                      {roles.map((role) => (
                        <option key={role.id} value={role.key}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 capitalize">{member.user.status}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        className="text-brand-rich-teal hover:underline"
                        onClick={() =>
                          void onStatusToggle(
                            member.membership.id,
                            member.user.status,
                            member.user.id,
                          )
                        }
                      >
                        {member.user.status === "active"
                          ? "Deactivate"
                          : "Activate"}
                      </button>
                      <button
                        type="button"
                        className="text-red-600 hover:underline"
                        onClick={() =>
                          void onRemove(member.membership.id, member.user.id)
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
