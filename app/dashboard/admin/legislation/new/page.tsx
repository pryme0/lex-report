import { StatuteEditor } from "@/components/admin/StatuteEditor";

export default function NewStatutePage() {
  return (
    <div>
      <div className="admin-page-head">
        <h3 className="admin-page-title">New statute</h3>
      </div>
      <StatuteEditor mode="create" />
    </div>
  );
}
