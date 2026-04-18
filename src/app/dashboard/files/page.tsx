"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { accessFile } from "@/lib/files";
import toast from "react-hot-toast";

export default function FilesPage() {
  const [userId, setUserId] = useState("");
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [files, setFiles] = useState<any[]>([]);
  const [passwords, setPasswords] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
        loadGroups(data.user.id);
      }
    });
  }, []);

  async function loadGroups(uid: string) {
    const { data: memberships } = await supabase
      .from("group_members").select("group_id, groups(id, name, type)")
      .eq("user_id", uid).eq("status", "approved");
    const grps = (memberships ?? []).map((m: any) => m.groups).filter(Boolean);
    setGroups(grps);
    if (grps.length > 0) { setSelectedGroup(grps[0].id); loadFiles(grps[0].id); }
  }

  async function loadFiles(groupId: string) {
    const { data } = await supabase.from("files").select("*")
      .eq("group_id", groupId).is("deleted_at", null).order("created_at", { ascending: false });
    setFiles(data ?? []);
  }

  async function handleAccess(fileId: string) {
    const password = passwords[fileId];
    if (!password) return toast.error("Enter the file password");
    setLoading(p => ({ ...p, [fileId]: true }));
    try {
      const url = await accessFile(fileId, password, userId);
      if (url) { window.open(url, "_blank"); toast.success("File opened!"); }
      else toast.error("Incorrect password");
    } catch (err: any) { toast.error(err.message); }
    setLoading(p => ({ ...p, [fileId]: false }));
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-6">Group Files</h1>
      {groups.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center">
          <p className="text-4xl mb-3">📁</p>
          <p className="text-gray-500 font-semibold">You are not a member of any group yet.</p>
          <p className="text-gray-400 text-sm mt-1">Join a group from the Umunna page to access files.</p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <select value={selectedGroup}
              onChange={e => { setSelectedGroup(e.target.value); loadFiles(e.target.value); }}
              className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary">
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          {files.length === 0 ? (
            <div className="bg-white rounded-xl border p-8 text-center">
              <p className="text-4xl mb-3">📄</p>
              <p className="text-gray-500">No files uploaded for this group yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {files.map(f => (
                <div key={f.id} className="bg-white rounded-xl border p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="font-semibold text-primary flex items-center gap-2">📄 {f.name}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(f.created_at).toLocaleString()}</p>
                    </div>
                    <span className="text-xs bg-secondary-50 text-secondary px-2 py-1 rounded-full border border-secondary-100 font-semibold">🔒 Password Protected</span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <input type="password"
                      value={passwords[f.id] ?? ""}
                      onChange={e => setPasswords(p => ({ ...p, [f.id]: e.target.value }))}
                      placeholder="Enter file password"
                      className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
                    <button onClick={() => handleAccess(f.id)} disabled={loading[f.id]}
                      className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark disabled:opacity-60">
                      {loading[f.id] ? "Opening..." : "Open File"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
