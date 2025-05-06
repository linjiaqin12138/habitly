import { createClient } from "@/lib/supabase/client";
import { UserProfile, UserNotifications } from "@/types/settings";
import { toCamelCase } from "@/lib/utils";

export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("users").select("*").single();
  if (error) throw error;
  return data ? toCamelCase(data) : null;
}

export async function updateUserProfile(profile: Partial<UserProfile>) {
  const supabase = createClient();
  const { error } = await supabase
    .from("users")
    .update({
      display_name: profile.displayName,
      avatar_url: profile.avatarUrl,
      phone: profile.phone,
      updated_at: new Date().toISOString()
    })
    .eq("id", profile.id);
  if (error) throw error;
}

export async function getUserNotifications(): Promise<UserNotifications | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("user_notifications").select("*").single();
  if (error) throw error;
  return data ? toCamelCase(data) : null;
}

export async function updateUserNotifications(settings: Partial<UserNotifications>) {
  const supabase = createClient();
  const { error } = await supabase
    .from("user_notifications")
    .update({
      email_notifications: settings.emailNotifications,
      push_notifications: settings.pushNotifications,
      push_token: settings.pushToken,
      updated_at: new Date().toISOString()
    })
    .eq("id", settings.id);
  if (error) throw error;
}

export async function uploadAvatar(file: File) {
  const supabase = createClient();
  const fileExt = file.name.split(".").pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(fileName, file);
  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from("avatars")
    .getPublicUrl(fileName);

  return publicUrl;
}