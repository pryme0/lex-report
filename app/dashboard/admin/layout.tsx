"use client";

import { EditorGate } from "@/components/admin/EditorGate";
import { AdminNav } from "@/components/admin/AdminNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <EditorGate>
      <div className="page admin-page">
        <div className="page-header">
          <div>
            <p className="label">Editorial</p>
            <h2>Content management</h2>
          </div>
        </div>
        <AdminNav />
        {children}
      </div>
    </EditorGate>
  );
}
