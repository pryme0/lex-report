import { PracticeFormDetail } from "@/components/Practice";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PracticeFormDetail formId={id} />;
}
