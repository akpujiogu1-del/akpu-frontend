import { supabase } from "./supabase";

export const VILLAGES = [
  "Umuihu",
  "Okparaebetere/Umuikpa",
  "Umueze",
  "Umuezeilo",
  "Umuezechukwu",
  "Chemmini",
  "Umuezeagu",
  "Umuezeakpu",
  "Umuanaga",
  "Upata",
  "Ihebuebu",
  "Umuokpara",
  "Mgboko",
  "Umudiana",
  "Uhuana",
  "Umunnukwuodu",
];

export const CONTACT_RECIPIENTS = [
  "PG",
  "Igwe",
  "Councilor",
  "Youth Leader",
  "Students Leader",
  "Ekerato (Women Leader)",
];

export async function registerUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;

  await supabase.from("users").insert({
    id: data.user!.id,
    email,
    status: "pending",
  });

  await supabase.from("user_roles").insert({
    user_id: data.user!.id,
    role: "member",
  });

  return data.user;
}

export async function submitKYC(
  userId: string,
  kyc: {
    full_name: string;
    date_of_birth: string;
    phone: string;
    sex: "Male" | "Female";
    village: string;
  }
) {
  const { error } = await supabase
    .from("users")
    .update({ ...kyc, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) throw error;
}

export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("*, user_roles(role, scope_id)")
    .eq("id", user.id)
    .single();

  return profile;
}