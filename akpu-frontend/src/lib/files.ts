import { supabase } from "./supabase";

export async function uploadGroupFile(
  file: File,
  password: string,
  groupId: string,
  uploadedBy: string
) {
  const storagePath = `${groupId}/${Date.now()}-${file.name}`;
  const { data: uploaded, error: uploadErr } = await supabase.storage
    .from("group-files")
    .upload(storagePath, file);
  if (uploadErr) throw uploadErr;

  const hashRes = await fetch("/api/hash-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  const { hash } = await hashRes.json();

  const { error } = await supabase.from("files").insert({
    group_id: groupId,
    uploaded_by: uploadedBy,
    name: file.name,
    storage_path: uploaded!.path,
    password_hash: hash,
  });
  if (error) throw error;
}

export async function accessFile(
  fileId: string,
  password: string,
  userId: string
) {
  const verifyRes = await fetch("/api/verify-file-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileId, password }),
  });
  const { valid, storagePath } = await verifyRes.json();
  if (!valid) throw new Error("Incorrect password");

  await supabase.from("file_access_logs").insert({
    file_id: fileId,
    user_id: userId,
  });

  const { data } = await supabase.storage
    .from("group-files")
    .createSignedUrl(storagePath, 60);

  return data?.signedUrl;
}s