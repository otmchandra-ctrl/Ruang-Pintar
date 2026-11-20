/**
 * Ruang Pintar — Route /cbt/[attemptId] (Backward Compatibility Redirector)
 *
 * Mengalihkan ke rute canonical /cbt/attempt/[attemptId]
 */

import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ attemptId: string }>;
}

export default async function LegacyCbtPlayerRedirectPage({ params }: PageProps) {
  const { attemptId } = await params;
  redirect(`/cbt/attempt/${attemptId}`);
}
