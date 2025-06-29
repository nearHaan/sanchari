import { cookies } from "next/headers";

export function setSession(token) {
  cookies().set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: '/',
    maxAge: 3600
  });
}

export function getSession() {
  const cookieStore = cookies();
  return cookieStore.get("token")?.value || null;
}

export function clearSession() {
  cookies().delete("token");
}
