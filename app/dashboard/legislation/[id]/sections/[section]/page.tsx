import { LegislationDetail } from "@/components/Legislation";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; section: string }>;
}) {
  const { id, section } = await params;
  return <LegislationDetail statuteId={id} sectionNumber={decodeURIComponent(section)} />;
}
