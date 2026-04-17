import { supabase } from "./supabase";

export function subscribeToDMs(userId: string, onMsg: (m: any) => void) {
  return supabase
    .channel(`dm-inbox-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `receiver_id=eq.${userId}`,
      },
      (payload) => onMsg(payload.new)
    )
    .subscribe();
}

export function subscribeToGroupChat(
  groupId: string,
  onMsg: (m: any) => void
) {
  return supabase
    .channel(`group-chat-${groupId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `group_id=eq.${groupId}`,
      },
      (payload) => onMsg(payload.new)
    )
    .subscribe();
}

export async function sendDM(
  senderId: string,
  receiverId: string,
  content: string
) {
  return supabase
    .from("messages")
    .insert({ sender_id: senderId, receiver_id: receiverId, content });
}

export async function sendGroupMsg(
  senderId: string,
  groupId: string,
  content: string
) {
  return supabase
    .from("messages")
    .insert({ sender_id: senderId, group_id: groupId, content });
}

export async function getDMHistory(userId: string, otherId: string) {
  return supabase
    .from("messages")
    .select("*, users!sender_id(full_name, avatar_url)")
    .or(
      `and(sender_id.eq.${userId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${userId})`
    )
    .is("deleted_at", null)
    .order("created_at");
}

export async function searchUsers(query: string) {
  return supabase
    .from("users")
    .select("id, full_name, phone, avatar_url")
    .eq("status", "approved")
    .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%`)
    .limit(10);
}