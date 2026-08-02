"use client";

import React, { useState, useCallback } from "react";
import {
  FileText, ChevronRight, Download, Plus, Trash2, Search, ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DOCUMENT_TEMPLATES,
  TEMPLATE_CATEGORIES,
  type DocumentTemplate,
  type TemplateField,
} from "@/lib/document-templates";
import { casesApi } from "@/lib/api";
import type { CaseSummary } from "@/lib/api";
import { AutoSizeTextarea } from "@/components/AutoSizeInput";

interface DocumentData {
  templateId: string;
  fields: Record<string, string>;
  listFields: Record<string, string[]>;
  authorities: Record<string, string[]>; // sectionId -> caseIds
}

const EMPTY_DOCUMENT: DocumentData = {
  templateId: "",
  fields: {},
  listFields: {},
  authorities: {},
};

// ─── Template Selector ────────────────────────────────────────────────────────

function TemplateSelector({
  onSelect,
}: {
  onSelect: (template: DocumentTemplate) => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const templates = selectedCategory
    ? DOCUMENT_TEMPLATES.filter((t) => t.category === selectedCategory)
    : DOCUMENT_TEMPLATES;

  return (
    <div className="doc-template-selector">
      <div className="doc-selector-header">
        <h2>Create New Document</h2>
        <p>Choose a template to get started</p>
      </div>

      <div className="doc-category-tabs">
        <button
          className={cn("doc-category-tab", !selectedCategory && "active")}
          onClick={() => setSelectedCategory(null)}
        >
          All
        </button>
        {TEMPLATE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={cn("doc-category-tab", selectedCategory === cat.id && "active")}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="doc-template-grid">
        {templates.map((template) => (
          <button
            key={template.id}
            className="doc-template-card"
            onClick={() => onSelect(template)}
          >
            <div className="doc-template-icon">
              <FileText size={24} />
            </div>
            <div className="doc-template-info">
              <div className="doc-template-name">{template.name}</div>
              <div className="doc-template-desc">{template.description}</div>
            </div>
            <ChevronRight size={16} className="doc-template-arrow" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Numbered List Field ──────────────────────────────────────────────────────

function NumberedListField({
  items,
  onChange,
  placeholder,
  disabled,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const handleItemChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    onChange(newItems);
  };

  const addItem = () => {
    onChange([...items, ""]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="numbered-list-field">
      {items.map((item, idx) => (
        <div key={idx} className="numbered-list-item">
          <span className="numbered-list-num">{idx + 1}.</span>
          <AutoSizeTextarea
            className="numbered-list-input"
            value={item}
            onChange={(v) => handleItemChange(idx, v)}
            placeholder={placeholder}
            disabled={disabled}
            minRows={1}
          />
          <button
            className="icon-btn danger"
            onClick={() => removeItem(idx)}
            disabled={disabled || items.length <= 1}
            title="Remove"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}
      <button
        className="btn btn-ghost btn-sm"
        onClick={addItem}
        disabled={disabled}
      >
        <Plus size={12} /> Add item
      </button>
    </div>
  );
}

// ─── Case Search Sidebar ──────────────────────────────────────────────────────

function CaseSearchSidebar({
  onAddAuthority,
  activeSection,
}: {
  onAddAuthority: (caseId: string, caseData: CaseSummary) => void;
  activeSection: string | null;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CaseSummary[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = useCallback(async (q: string) => {
    setSearchQuery(q);

    if (!q.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const result = await casesApi.search({ q, limit: 10 });
      setSearchResults(result.data);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  return (
    <aside className="doc-sidebar">
      <div className="doc-sidebar-header">
        <h3>Add Authorities</h3>
        {activeSection && (
          <span className="doc-sidebar-hint">Adding to current section</span>
        )}
      </div>

      <div className="doc-search-box">
        <Search size={14} className="doc-search-icon" />
        <input
          type="text"
          className="doc-search-input"
          placeholder="Search cases..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
        {searching && <span className="doc-search-spinner" />}
      </div>

      <div className="doc-case-list">
        {searchResults.length === 0 && searchQuery.trim() && !searching && (
          <div className="doc-sidebar-empty">No cases found</div>
        )}
        {searchResults.length === 0 && !searchQuery.trim() && (
          <div className="doc-sidebar-empty">
            Search for cases to add as authorities
          </div>
        )}
        {searchResults.map((c) => (
          <div key={c.id} className="doc-case-item">
            <div className="doc-case-info">
              <div className="doc-case-title">{c.title}</div>
              <div className="doc-case-cite">{c.citation}</div>
            </div>
            <button
              className="btn btn-xs"
              onClick={() => onAddAuthority(c.id, c)}
              disabled={!activeSection}
              title={activeSection ? "Add to section" : "Select a section first"}
            >
              + Add
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}

// ─── Document Editor ──────────────────────────────────────────────────────────

function DocumentEditor({
  template,
  data,
  onChange,
  onBack,
  onExport,
  casesCache,
  onCacheCase,
}: {
  template: DocumentTemplate;
  data: DocumentData;
  onChange: (data: DocumentData) => void;
  onBack: () => void;
  onExport: () => void;
  casesCache: Record<string, CaseSummary>;
  onCacheCase: (c: CaseSummary) => void;
}) {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const updateField = (fieldId: string, value: string) => {
    onChange({
      ...data,
      fields: { ...data.fields, [fieldId]: value },
    });
  };

  const updateListField = (fieldId: string, items: string[]) => {
    onChange({
      ...data,
      listFields: { ...data.listFields, [fieldId]: items },
    });
  };

  const addAuthority = (sectionId: string, caseId: string, caseData: CaseSummary) => {
    const existing = data.authorities[sectionId] || [];
    if (existing.includes(caseId)) return;
    onCacheCase(caseData);
    onChange({
      ...data,
      authorities: {
        ...data.authorities,
        [sectionId]: [...existing, caseId],
      },
    });
  };

  const removeAuthority = (sectionId: string, caseId: string) => {
    const existing = data.authorities[sectionId] || [];
    onChange({
      ...data,
      authorities: {
        ...data.authorities,
        [sectionId]: existing.filter((id) => id !== caseId),
      },
    });
  };

  const renderField = (field: TemplateField, _sectionId?: string) => {
    if (field.type === "numbered-list") {
      const items = data.listFields[field.id] || [""];
      return (
        <NumberedListField
          items={items}
          onChange={(items) => updateListField(field.id, items)}
          placeholder={field.placeholder}
        />
      );
    }

    if (field.type === "textarea") {
      return (
        <AutoSizeTextarea
          className="doc-field-textarea"
          value={data.fields[field.id] || ""}
          onChange={(v) => updateField(field.id, v)}
          placeholder={field.placeholder}
          minRows={field.rows || 3}
        />
      );
    }

    if (field.type === "date") {
      return (
        <input
          type="date"
          className="form-input"
          value={data.fields[field.id] || ""}
          onChange={(e) => updateField(field.id, e.target.value)}
        />
      );
    }

    return (
      <input
        type="text"
        className="form-input"
        value={data.fields[field.id] || ""}
        onChange={(e) => updateField(field.id, e.target.value)}
        placeholder={field.placeholder}
      />
    );
  };

  return (
    <div className="doc-editor-layout">
      <CaseSearchSidebar
        onAddAuthority={(caseId, caseData) => {
          if (activeSection) {
            addAuthority(activeSection, caseId, caseData);
          }
        }}
        activeSection={activeSection}
      />

      <div className="doc-editor-main">
        <div className="doc-editor-toolbar">
          <button className="btn btn-ghost btn-sm" onClick={onBack}>
            <ArrowLeft size={14} /> Back
          </button>
          <div className="doc-editor-title">{template.name}</div>
          <button className="btn btn-primary btn-sm" onClick={onExport}>
            <Download size={14} /> Export
          </button>
        </div>

        <div className="doc-editor-content">
          {/* Header Fields */}
          <div className="doc-section">
            <div className="doc-section-title">Document Details</div>
            <div className="doc-header-fields">
              {template.headerFields.map((field) => (
                <div key={field.id} className="doc-field">
                  <label className="doc-field-label">
                    {field.label}
                    {field.required && <span className="doc-required">*</span>}
                  </label>
                  {renderField(field)}
                </div>
              ))}
            </div>
          </div>

          {/* Template Sections */}
          {template.sections.map((section) => {
            const isActive = activeSection === section.id;
            const sectionAuthorities = data.authorities[section.id] || [];

            return (
              <div
                key={section.id}
                className={cn("doc-section", isActive && "active")}
                onClick={() => setActiveSection(section.id)}
              >
                <div className="doc-section-title">{section.title}</div>

                {section.fields.map((field) => (
                  <div key={field.id} className="doc-field">
                    {field.label !== section.title && (
                      <label className="doc-field-label">{field.label}</label>
                    )}
                    {renderField(field, section.id)}
                  </div>
                ))}

                {/* Authorities for this section */}
                {sectionAuthorities.length > 0 && (
                  <div className="doc-authorities">
                    <div className="doc-authorities-label">Authorities</div>
                    {sectionAuthorities.map((caseId) => {
                      const c = casesCache[caseId];
                      return (
                        <div key={caseId} className="doc-authority-item">
                          <span className="doc-authority-title">
                            {c?.title || caseId}
                          </span>
                          {c?.citation && (
                            <span className="doc-authority-cite">{c.citation}</span>
                          )}
                          <button
                            className="icon-btn danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeAuthority(section.id, caseId);
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {isActive && sectionAuthorities.length === 0 && (
                  <div className="doc-authorities-hint">
                    Search cases in the sidebar to add authorities to this section
                  </div>
                )}
              </div>
            );
          })}

          {/* Signature Block */}
          <div className="doc-signature">
            <div className="doc-signature-line" />
            <div className="doc-signature-label">{template.signatureLabel}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DocumentBuilder({ onAction }: { onAction: (m: string) => void }) {
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [documentData, setDocumentData] = useState<DocumentData>(EMPTY_DOCUMENT);
  const [casesCache, setCasesCache] = useState<Record<string, CaseSummary>>({});

  const handleSelectTemplate = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setDocumentData({
      templateId: template.id,
      fields: {},
      listFields: {},
      authorities: {},
    });
    onAction(`Started: ${template.name}`);
  };

  const handleBack = () => {
    setSelectedTemplate(null);
    setDocumentData(EMPTY_DOCUMENT);
  };

  const handleExport = () => {
    // TODO: Implement actual export
    onAction("Export coming soon");
  };

  const handleDataChange = (data: DocumentData) => {
    setDocumentData(data);
  };

  const handleCacheCase = useCallback((caseData: CaseSummary) => {
    setCasesCache((prev) => ({ ...prev, [caseData.id]: caseData }));
  }, []);

  if (!selectedTemplate) {
    return <TemplateSelector onSelect={handleSelectTemplate} />;
  }

  return (
    <DocumentEditor
      template={selectedTemplate}
      data={documentData}
      onChange={handleDataChange}
      onBack={handleBack}
      onExport={handleExport}
      casesCache={casesCache}
      onCacheCase={handleCacheCase}
    />
  );
}
