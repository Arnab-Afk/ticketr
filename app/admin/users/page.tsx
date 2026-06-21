"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ReceiptPaper } from "@/components/receipt/receipt-paper";
import { LoadingBlock, LoadingOverlay } from "@/components/ui/loading-block";
import { apiClient } from "@/lib/api-client";
import type { ManagedUser, UserRole } from "@/lib/types/user";
import { cn } from "@/lib/utils";

const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  agent: "Agent",
  user: "User",
};

const roleBadgeClass: Record<UserRole, string> = {
  admin: "border-primary bg-primary/10 text-primary",
  agent: "border-amber-400 bg-amber-50 text-amber-900",
  user: "border-border bg-muted text-muted-foreground",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type UserFormState = {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
};

const emptyForm: UserFormState = {
  fullName: "",
  email: "",
  password: "",
  role: "user",
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [createForm, setCreateForm] = useState<UserFormState>(emptyForm);
  const [editUser, setEditUser] = useState<ManagedUser | null>(null);
  const [editForm, setEditForm] = useState<UserFormState>(emptyForm);
  const [deleteUser, setDeleteUser] = useState<ManagedUser | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    const response = await apiClient.get<ManagedUser[]>("/api/users");
    if (response.success && response.data) {
      setUsers(response.data);
    } else {
      setError(response.error ?? "Failed to load users");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status === "authenticated" && session?.user?.role !== "admin") {
      router.replace("/admin");
      return;
    }
    if (status === "authenticated") {
      void loadUsers();
    }
  }, [status, session, router, loadUsers]);

  const openEdit = (user: ManagedUser) => {
    setEditUser(user);
    setEditForm({
      fullName: user.fullName,
      email: user.email,
      password: "",
      role: user.role,
    });
    setSuccess("");
    setError("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const response = await apiClient.post<ManagedUser>("/api/users", createForm);
    setSaving(false);

    if (response.success && response.data) {
      setCreateForm(emptyForm);
      setSuccess(`Created ${response.data.email}`);
      await loadUsers();
      return;
    }

    setError(response.error ?? "Failed to create user");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;

    setSaving(true);
    setError("");
    setSuccess("");

    const payload: Record<string, string> = {
      fullName: editForm.fullName,
      email: editForm.email,
      role: editForm.role,
    };
    if (editForm.password.trim()) {
      payload.password = editForm.password;
    }

    const response = await apiClient.patch<ManagedUser>(
      `/api/users/${editUser.id}`,
      payload
    );
    setSaving(false);

    if (response.success) {
      setEditUser(null);
      setSuccess(`Updated ${editForm.email}`);
      await loadUsers();
      return;
    }

    setError(response.error ?? "Failed to update user");
  };

  const handleDelete = async () => {
    if (!deleteUser) return;

    setSaving(true);
    setError("");
    setSuccess("");

    const response = await apiClient.delete<{ id: string }>(
      `/api/users/${deleteUser.id}`
    );
    setSaving(false);

    if (response.success) {
      setDeleteUser(null);
      setSuccess(`Deleted ${deleteUser.email}`);
      await loadUsers();
      return;
    }

    setError(response.error ?? "Failed to delete user");
  };

  if (status === "loading" || (status === "authenticated" && loading && users.length === 0)) {
    return <LoadingBlock message="Loading users..." className="py-24" />;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="page-title">User management</h1>
        <p className="page-subtitle mt-1">
          Create accounts, set roles, reset passwords, and remove users.
        </p>
      </div>

      {error ? (
        <div className="mb-4 border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="mb-4 border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">
          {success}
        </div>
      ) : null}

      <ReceiptPaper width="full" className="relative mb-8 p-6">
        {saving && !editUser && !deleteUser ? (
          <LoadingOverlay message="Saving user..." />
        ) : null}
        <h2 className="receipt-label mb-4 text-[10px]">Create user</h2>
        <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="create-name">Full name</Label>
            <Input
              id="create-name"
              value={createForm.fullName}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, fullName: e.target.value }))
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-email">Email</Label>
            <Input
              id="create-email"
              type="email"
              value={createForm.email}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, email: e.target.value }))
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-password">Password</Label>
            <Input
              id="create-password"
              type="password"
              minLength={6}
              value={createForm.password}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, password: e.target.value }))
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={createForm.role}
              onValueChange={(value) =>
                setCreateForm((prev) => ({ ...prev, role: value as UserRole }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Creating..." : "Create user"}
            </Button>
          </div>
        </form>
      </ReceiptPaper>

      <ReceiptPaper width="full" className="overflow-hidden">
        {loading ? (
          <LoadingBlock message="Refreshing users..." />
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No users found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="receipt-label text-[10px]">Name</TableHead>
                <TableHead className="receipt-label text-[10px]">Email</TableHead>
                <TableHead className="receipt-label text-[10px]">Role</TableHead>
                <TableHead className="receipt-label text-[10px]">Tickets</TableHead>
                <TableHead className="receipt-label text-[10px]">Joined</TableHead>
                <TableHead className="receipt-label text-[10px] text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const isSelf = user.id === session?.user?.id;
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-none text-[10px] font-bold uppercase tracking-wide",
                          roleBadgeClass[user.role]
                        )}
                      >
                        {roleLabels[user.role]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user._count?.ticketsCreated ?? 0}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(user)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isSelf}
                          onClick={() => {
                            setDeleteUser(user);
                            setError("");
                            setSuccess("");
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </ReceiptPaper>

      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="rounded-none sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
            <DialogDescription>
              Update profile details, role, or set a new password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full name</Label>
              <Input
                id="edit-name"
                value={editForm.fullName}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, fullName: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, email: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">New password</Label>
              <Input
                id="edit-password"
                type="password"
                minLength={6}
                placeholder="Leave blank to keep current password"
                value={editForm.password}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, password: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={editForm.role}
                onValueChange={(value) =>
                  setEditForm((prev) => ({ ...prev, role: value as UserRole }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="agent">Agent (support staff)</SelectItem>
                  <SelectItem value="admin">Admin (full access)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditUser(null)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteUser}
        onOpenChange={(open) => !open && setDeleteUser(null)}
      >
        <DialogContent className="rounded-none sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete user</DialogTitle>
            <DialogDescription>
              Permanently remove{" "}
              <strong>{deleteUser?.fullName}</strong> ({deleteUser?.email})?
              Users with ticket history cannot be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteUser(null)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={saving}
            >
              {saving ? "Deleting..." : "Delete user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
