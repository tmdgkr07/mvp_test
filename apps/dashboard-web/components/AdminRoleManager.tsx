"use client";

import { useState, useTransition } from "react";
import type { AdminUserSummary } from "@/lib/data-store";

type AdminRoleManagerProps = {
  currentUserId: string;
  initialAdmins: AdminUserSummary[];
};

type PrivilegedRole = "ADMIN" | "SUPER_ADMIN";

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function roleLabel(role: AdminUserSummary["role"]) {
  return role === "super_admin" ? "Super Admin" : "Admin";
}

function roleTone(role: AdminUserSummary["role"]) {
  return role === "super_admin"
    ? "bg-[#F3E8FF] text-[#6E3CBC]"
    : "bg-[#FFF3B3] text-[#6B5300]";
}

export default function AdminRoleManager({ currentUserId, initialAdmins }: AdminRoleManagerProps) {
  const [admins, setAdmins] = useState(initialAdmins);
  const [email, setEmail] = useState("");
  const [targetRole, setTargetRole] = useState<PrivilegedRole>("ADMIN");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const superAdminCount = admins.filter((admin) => admin.role === "super_admin").length;

  function submitRoleChange(nextEmail: string, nextRole: "CREATOR" | PrivilegedRole) {
    setError("");
    setMessage("");

    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/users/role", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: nextEmail,
            nextRole
          })
        });

        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
          admins?: AdminUserSummary[];
        };

        if (!response.ok || !payload.admins) {
          throw new Error(payload.error || "Unable to update the privileged role.");
        }

        setAdmins(payload.admins);
        setEmail("");
        setMessage(
          nextRole === "CREATOR"
            ? "권한이 해제되었습니다."
            : nextRole === "SUPER_ADMIN"
              ? "슈퍼관리자가 추가되었습니다."
              : "관리자가 추가되었습니다."
        );
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Unable to update the privileged role.");
      }
    });
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <div className="rounded-3xl border border-[#EBEBEB] bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8A63D2]">Privileged Access</p>
        <h2 className="mt-3 text-xl font-black text-gray-900">관리자 권한 추가</h2>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          로그인과 이메일 인증이 완료된 계정만 관리자 권한으로 승격할 수 있습니다.
        </p>

        <form
          className="mt-5 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            submitRoleChange(email, targetRole);
          }}
        >
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-gray-400">User Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="user@example.com"
              className="w-full rounded-2xl border border-[#E5E7EB] px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#C6A84B] focus:ring-2 focus:ring-[#FFE9A3]"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Target Role</span>
            <select
              value={targetRole}
              onChange={(event) => setTargetRole(event.target.value as PrivilegedRole)}
              className="w-full rounded-2xl border border-[#E5E7EB] px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#C6A84B] focus:ring-2 focus:ring-[#FFE9A3]"
            >
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </label>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex w-full items-center justify-center rounded-full bg-[#222222] px-4 py-3 text-sm font-black text-white transition hover:bg-[#111111] disabled:cursor-wait disabled:opacity-60"
          >
            {isPending ? "처리 중..." : "권한 적용"}
          </button>
        </form>

        {message ? <p className="mt-4 rounded-2xl bg-[#F3F9EC] px-4 py-3 text-sm font-semibold text-[#3E6A1B]">{message}</p> : null}
        {error ? <p className="mt-4 rounded-2xl bg-[#FFF1F1] px-4 py-3 text-sm font-semibold text-[#B42318]">{error}</p> : null}
      </div>

      <div className="rounded-3xl border border-[#EBEBEB] bg-white shadow-sm">
        <div className="border-b border-[#F3F4F6] px-6 py-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Current Privileged Users</p>
        </div>

        <div className="divide-y divide-[#F3F4F6]">
          {admins.length === 0 ? (
            <div className="px-6 py-8 text-sm text-gray-500">등록된 관리자 계정이 없습니다.</div>
          ) : (
            admins.map((admin) => {
              const isSelf = admin.id === currentUserId;
              const isLastSuperAdmin = admin.role === "super_admin" && superAdminCount <= 1;

              return (
                <div key={admin.id} className="flex flex-col gap-4 px-6 py-5 xl:flex-row xl:items-center xl:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-gray-900">{admin.name || admin.email}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-black ${roleTone(admin.role)}`}>{roleLabel(admin.role)}</span>
                      {isSelf ? (
                        <span className="rounded-full bg-[#EEF2FF] px-2 py-0.5 text-[11px] font-black text-[#3346B5]">You</span>
                      ) : null}
                    </div>
                    <p className="text-sm text-gray-500">{admin.email}</p>
                    <p className="text-xs text-gray-400">권한 부여 시각 {formatDateTime(admin.roleAssignedAt)}</p>
                    <p className="text-xs text-gray-400">
                      이메일 인증 {admin.emailVerified ? formatDateTime(admin.emailVerified) : "미확인"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {admin.role === "admin" ? (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => submitRoleChange(admin.email, "SUPER_ADMIN")}
                        className="inline-flex items-center justify-center rounded-full border border-[#E5D6FF] px-4 py-2 text-sm font-bold text-[#6E3CBC] transition hover:bg-[#FBF7FF] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        슈퍼관리자 승격
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isPending || isLastSuperAdmin}
                        onClick={() => submitRoleChange(admin.email, "ADMIN")}
                        className="inline-flex items-center justify-center rounded-full border border-[#E5D6FF] px-4 py-2 text-sm font-bold text-[#6E3CBC] transition hover:bg-[#FBF7FF] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        관리자 변경
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={isPending || isLastSuperAdmin}
                      onClick={() => submitRoleChange(admin.email, "CREATOR")}
                      className="inline-flex items-center justify-center rounded-full border border-[#F0D7D7] px-4 py-2 text-sm font-bold text-[#9C2F2F] transition hover:bg-[#FFF7F7] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      권한 해제
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
