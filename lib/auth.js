import { cookies } from "next/headers";

export function setSession(username) {
  cookies().set("session_user", username, { httpOnly: true });
}

export function getSession() {
  const cookieStore = cookies();
  return cookieStore.get("session_user")?.value || null;
}

export function clearSession() {
  cookies().delete("session_user");
}
