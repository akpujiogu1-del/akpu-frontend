"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

export default function UmunnaAdminPage() {
  const router = useRouter();
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [groupName, setGroupName] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Get this admin's umunna group name for display
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roleRows } = await supabase
          .from("user_roles").select("role, scope_id").eq("user_id", user.id);
        const umunnaRole = roleRows?.find(r => r.role === "group_admin" && r.scope_id);
        if (umunnaRole) {
          const { data: group } = await supabase
            .from("groups").select("name").eq("id", umunnaRole.scope_id).single();
          if (group) setGroupName(group.name);
        } else {
          setGroupName("All Villages");
        }
      }

      const res = await fetch("/api/admin/umunna");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPending(data.pendingUsers ?? []);
    } catch (err: any) {
      toast.error(err.message);
    }
    setLoading(false);
  }

  async function userAction(userId: string, status: string) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_user_status",
          id: userId,
          data: { status },
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(status === "approved" ? "User approved!" : "User rejected");
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
    setSaving(false);
  }

  const CARD: React.CSSProperties = {
    background: "white", border: "1px solid #e5e7eb",
    borderRadius: 12, padding: 16, marginBottom: 12,
  };
  const BG: React.CSSProperties = {
    background: "#2d6a2d", color: "white", border: "none",
    padding: "8px 16px", borderRadius: 8, fontSize: 13,
    fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  };
  const BR: React.CSSProperties = {
    background: "#dc2626", color: "white", border: "none",
    padding: "8px 16px", borderRadius: 8, fontSize: 13,
    fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", fontFamily: "Outfit, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#2d6a2d", color: "white", padding: "16px 20px" }}>
        <button onClick={() => router.push("/dashboard")}
          style={{ background: "rgba(255,255,255,0.2)", color: "white", border: "none", padding: "5px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontWeight: 600, marginBottom: 8, display: "block" }}>
          ← Back to Dashboard
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 2px" }}>
          🤝 Umunna Admin — {groupName}
        </h1>
        <p style={{ fontSize: 12, opacity: 0.8, margin: 0 }}>
          Review and approve KYC submissions from your Umunna
        </p>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: 16 }}>
        {/* Stats */}
        <div style={{ background: "white", borderRadius: 12, padding: 16, marginBottom: 20, display: "flex", gap: 20, flexWrap: "wrap" }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 28, fontWeight: 800, color: "#2d6a2d", margin: 0 }}>{pending.length}</p>
            <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>Pending Approvals</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 28, fontWeight: 800, color: "#6b3a1f", margin: 0 }}>
              {pending.filter(u => u.village).length}
            </p>
            <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>KYC Submitted</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 28, fontWeight: 800, color: "#9ca3af", margin: 0 }}>
              {pending.filter(u => !u.village).length}
            </p>
            <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>Awaiting KYC</p>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#2d6a2d", margin: 0 }}>
            Pending KYC Approvals ({pending.length})
          </h2>
          <button onClick={loadData}
            style={{ ...BG, padding: "6px 14px", fontSize: 12 }}>
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ ...CARD, textAlign: "center", padding: 40 }}>
            <p style={{ color: "#6b7280" }}>Loading...</p>
          </div>
        ) : pending.length === 0 ? (
          <div style={{ ...CARD, textAlign: "center", padding: 40 }}>
            <p style={{ fontSize: 36, margin: "0 0 8px" }}>✅</p>
            <p style={{ fontWeight: 700, color: "#2d6a2d", margin: "0 0 4px" }}>
              No pending approvals
            </p>
            <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
              New registrations from {groupName} will appear here
            </p>
          </div>
        ) : (
          pending.map((u) => (
            <div key={u.id} style={CARD}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 800, fontSize: 15, color: "#2d6a2d", margin: "0 0 6px" }}>
                    {u.full_name || "⚠️ KYC not yet submitted"}
                  </p>
                  <p style={{ fontSize: 13, color: "#374151", margin: "0 0 2px" }}>
                    📧 {u.email}
                  </p>
                  <p style={{ fontSize: 13, color: "#374151", margin: "0 0 2px" }}>
                    📞 {u.phone || "Not provided"}
                  </p>
                  <p style={{ fontSize: 13, color: "#374151", margin: "0 0 2px" }}>
                    🏡 Village: {u.village || "Not submitted yet"}
                  </p>
                  <p style={{ fontSize: 13, color: "#374151", margin: "0 0 2px" }}>
                    👤 {u.sex || "—"} · 🎂 {u.date_of_birth || "—"}
                  </p>
                  <p style={{ fontSize: 11, color: "#9ca3af", margin: "6px 0 0" }}>
                    Registered: {new Date(u.created_at).toLocaleString()}
                  </p>
                  <div style={{ marginTop: 6 }}>
                    {!u.village ? (
                      <span style={{ fontSize: 11, background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: 8, fontWeight: 600 }}>
                        ⏳ Awaiting KYC submission
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: 8, fontWeight: 600 }}>
                        ✅ KYC submitted
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignSelf: "flex-start", flexWrap: "wrap" }}>
                  <button onClick={() => userAction(u.id, "approved")}
                    disabled={saving} style={BG}>
                    ✅ Approve
                  </button>
                  <button onClick={() => userAction(u.id, "rejected")}
                    disabled={saving} style={BR}>
                    ❌ Reject
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
