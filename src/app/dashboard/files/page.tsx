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
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        loadGroups(user.id);
      }
    };
    init();
  }, []);

  async function loadGroups(uid: string) {
    const { data: memberships } = await supabase
      .from("group_members")
      .select("group_id, groups(id, name, type)")
      .eq("user_id", uid)
      .eq("status", "approved");
      
    const grps = (memberships ?? []).map((m: any) => m.groups).filter(Boolean);
    setGroups(grps);
    
    if (grps.length > 0) { 
      setSelectedGroup(grps[0].id); 
      loadFiles(grps[0].id); 
    }
  }

  async function loadFiles(groupId: string) {
    const { data } = await supabase
      .from("files")
      .select("*")
      .eq("group_id", groupId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    
    setFiles(data ?? []);
    setPasswords({}); // Clear passwords when switching groups
  }

  async function handleAccess(fileId: string) {
    const password = passwords[fileId];
    if (!password) return toast.error("Please enter the file password");
    
    setLoading(p => ({ ...p, [fileId]: true }));
    try {
      const url = await accessFile(fileId, password, userId);
      if (url) { 
        window.open(url, "_blank"); 
        toast.success("Document decrypted successfully!"); 
      } else {
        toast.error("Invalid password for this file");
      }
    } catch (err: any) { 
      toast.error(err.message || "Failed to access file"); 
    } finally {
      setLoading(p => ({ ...p, [fileId]: false }));
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-2">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Secure Vault</h1>
          <p className="text-gray-500 text-xs mt-1 font-medium uppercase tracking-wider">
            Protected Community Documents
          </p>
        </div>
        <div className="bg-primary/10 p-2 rounded-2xl">
          <span className="text-2xl">📁</span>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-dashed border-gray-200 p-12 text-center">
          <p className="text-5xl mb-4 grayscale opacity-50">📂</p>
          <p className="text-gray-900 font-bold">No Groups Found</p>
          <p className="text-gray-400 text-sm mt-2 max-w-xs mx-auto">
            You must be an approved member of a group to access its shared documents.
          </p>
        </div>
      ) : (
        <>
          {/* Group Tab Switcher */}
          <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => { setSelectedGroup(g.id); loadFiles(g.id); }}
                className={`whitespace-nowrap px-6 py-3 rounded-2xl text-xs font-bold transition-all ${
                  selectedGroup === g.id 
                    ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" 
                    : "bg-white text-gray-400 hover:text-gray-600 border border-gray-100"
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>

          {files.length === 0 ? (
            <div className="bg-white rounded-[2rem] border border-gray-100 p-12 text-center mt-4">
              <p className="text-4xl mb-3 opacity-20">📄</p>
              <p className="text-gray-400 font-medium">No files available for this group.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 mt-6">
              {files.map(f => (
                <div key={f.id} className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-xl shadow-inner">
                        📄
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{f.name}</p>
                        <p className="text-[10px] font-black text-secondary uppercase tracking-widest mt-1">
                          Added: {new Date(f.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="hidden sm:block">
                      <span className="text-[9px] font-black bg-secondary/10 text-secondary px-3 py-1.5 rounded-full border border-secondary/20 uppercase tracking-tighter">
                        🔒 Encrypted
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-[1.5rem] p-2 flex gap-2">
                    <input 
                      type="password"
                      value={passwords[f.id] ?? ""}
                      onChange={e => setPasswords(p => ({ ...p, [f.id]: e.target.value }))}
                      placeholder="Security Password"
                      className="flex-1 bg-transparent border-none px-4 py-2 text-sm outline-none placeholder:text-gray-300" 
                    />
                    <button 
                      onClick={() => handleAccess(f.id)} 
                      disabled={loading[f.id]}
                      className="bg-primary text-white px-6 py-3 rounded-xl text-xs font-bold hover:bg-primary-dark transition-all disabled:opacity-50 shadow-lg shadow-primary/10"
                    >
                      {loading[f.id] ? "Decrypting..." : "Access File"}
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