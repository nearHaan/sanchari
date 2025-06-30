import { getUsernameFromCookie } from "@/lib/auth";
import EditMapPageClient from "./EditMapPageClient";

export default async function EditMapPage() {
    const username = await getUsernameFromCookie();
    return <EditMapPageClient username={username} />;
}