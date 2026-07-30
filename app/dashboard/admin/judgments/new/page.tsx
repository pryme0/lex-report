import { JudgmentForm, EMPTY_JUDGMENT_DRAFT } from "@/components/admin/JudgmentForm";

export default function NewJudgmentPage() {
  return (
    <div>
      <div className="admin-page-head">
        <h3 className="admin-page-title">New judgment</h3>
      </div>
      <JudgmentForm mode="create" initial={EMPTY_JUDGMENT_DRAFT} />
    </div>
  );
}
