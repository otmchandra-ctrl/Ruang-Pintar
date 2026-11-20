/**
 * Ruang Pintar — Route /cbt/start (Legacy Query Param Redirector)
 *
 * Mengalihkan ?ujianId=... ke rute canonical /cbt/start/[assessmentId]
 * atau ke /cbt jika parameter kosong.
 */

import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{ ujianId?: string; token?: string }>;
}

export default async function LegacyCbtStartRedirectPage({ searchParams }: PageProps) {
  const { ujianId } = await searchParams;

  if (ujianId) {
    redirect(`/cbt/start/${ujianId}`);
  }

  redirect("/cbt");
}
