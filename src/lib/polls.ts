import { supabase } from "./supabase";

export async function createPoll(
  groupId: string,
  createdBy: string,
  question: string,
  description: string,
  options: string[],
  endsAt: Date
) {
  return supabase.from("polls").insert({
    group_id: groupId,
    created_by: createdBy,
    question,
    description,
    options: options.map((text, i) => ({ id: String(i), text })),
    ends_at: endsAt.toISOString(),
  });
}

export async function castVote(
  pollId: string,
  userId: string,
  optionId: string
) {
  const { error } = await supabase.from("votes").insert({
    poll_id: pollId,
    user_id: userId,
    option_id: optionId,
  });
  if (error?.code === "23505") {
    throw new Error("You have already voted in this poll.");
  }
  if (error) throw error;
}

export async function getPollResults(pollId: string) {
  const { data: poll } = await supabase
    .from("polls")
    .select("*")
    .eq("id", pollId)
    .single();

  const { data: votes } = await supabase
    .from("votes")
    .select("option_id")
    .eq("poll_id", pollId);

  const counts: Record<string, number> = {};
  (poll?.options ?? []).forEach((o: any) => {
    counts[o.id] = 0;
  });
  votes?.forEach((v) => {
    counts[v.option_id] = (counts[v.option_id] ?? 0) + 1;
  });

  return { poll, counts, total: votes?.length ?? 0 };
}