"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { TestSectionWithRelations } from "@/lib/types";

export default function FormDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const contentRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<TestSectionWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchForm();
    }
  }, [id]);

  const fetchForm = async () => {
    try {
      const response = await fetch(`/api/test-sections/${id}`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setForm(data);
    } catch (err) {
      setError("שגיאה בטעינת הטופס");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("he-IL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "passed":
        return (
          <span className="px-3 py-1.5 text-sm font-medium rounded-full bg-green-100 text-green-700">
            ✓ עבר
          </span>
        );
      case "failed":
        return (
          <span className="px-3 py-1.5 text-sm font-medium rounded-full bg-red-100 text-red-700">
            ✗ נכשל
          </span>
        );
      default:
        return (
          <span className="px-3 py-1.5 text-sm font-medium rounded-full bg-yellow-100 text-yellow-700">
            ⏳ ממתין
          </span>
        );
    }
  };

  const getTestStatusBadge = (status: string | null) => {
    switch (status) {
      case "passed":
        return <span className="text-green-600 font-medium">✓ עבר</span>;
      case "failed":
        return <span className="text-red-600 font-medium">✗ נכשל</span>;
      default:
        return <span className="text-yellow-600 font-medium">⏳ ממתין</span>;
    }
  };

  const exportToPDF = () => {
    if (!form) return;
    setExporting(true);

    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        body * { visibility: hidden; }
        #print-content, #print-content * { visibility: visible; }
        #print-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          background: white !important;
          color: black !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        header, footer, .no-print { display: none !important; }
      }
    `;
    document.head.appendChild(style);

    const originalTitle = document.title;
    document.title = form.formNumber;

    window.print();

    document.head.removeChild(style);
    document.title = originalTitle;
    setExporting(false);
  };

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">טוען...</div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div dir="rtl" className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">{error || "הטופס לא נמצא"}</div>
          <Link href="/" className="text-blue-600 hover:underline">
            חזרה לדף הבית
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-10 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-start">
            <div>
              {form.projectChapter ? (
                <Link
                  href={`/projects/${form.projectChapter.project.id}/building/${form.projectChapterId}/test-sections`}
                  className="text-sm text-blue-600 hover:underline mb-2 inline-block"
                >
                  ← חזרה לרשימת קטעי ניסוי
                </Link>
              ) : (
                <Link href="/" className="text-sm text-blue-600 hover:underline mb-2 inline-block">
                  ← חזרה לדף הבית
                </Link>
              )}
              <h1 className="text-xl font-bold text-gray-800">{form.sectionName}</h1>
              {form.projectChapter && (
                <p className="text-gray-500">
                  {form.projectChapter.project.name} • פרק {form.projectChapter.chapter.code} - {form.projectChapter.chapter.name}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(form.status)}
              <button
                onClick={exportToPDF}
                disabled={exporting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
              >
                {exporting ? "מייצא..." : "PDF 📄"}
              </button>
              <Link
                href={`/forms/${form.id}/edit`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
              >
                עריכה ✏️
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main ref={contentRef} id="print-content" className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Basic Info */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="font-semibold text-lg mb-4 text-blue-600">פרטי הטופס</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-500">מספר טופס</div>
              <div className="font-medium text-gray-800">{form.formNumber}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">תאריך</div>
              <div className="font-medium text-gray-800">{formatDate(form.date)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">נוצר</div>
              <div className="font-medium text-gray-800">{formatDate(form.createdAt)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">עודכן</div>
              <div className="font-medium text-gray-800">{formatDate(form.updatedAt)}</div>
            </div>
          </div>
        </section>

        {/* Participants */}
        {form.participants.length > 0 && form.participants.some(p => p.name) && (
          <section className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="font-semibold text-lg mb-4 text-blue-600">משתתפים</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {form.participants.filter(p => p.name).map((p) => (
                <div key={p.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-semibold text-blue-600 mb-2">{p.role}</div>
                  <div className="font-medium text-gray-800">{p.name}</div>
                  {p.company && <div className="text-sm text-gray-500">{p.company}</div>}
                  {p.phone && <div className="text-sm text-gray-500">{p.phone}</div>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Crew Members */}
        {form.crewMembers.length > 0 && form.crewMembers.some(c => c.name) && (
          <section className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="font-semibold text-lg mb-4 text-blue-600">צוות ביצוע</h2>
            <div className="space-y-2">
              {form.crewMembers.filter(c => c.name).map((c) => (
                <div key={c.id} className="flex justify-between items-center bg-gray-50 rounded-lg p-4">
                  <span className="font-medium text-gray-800">{c.name}</span>
                  {c.role && <span className="text-sm text-gray-500">{c.role}</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Description */}
        {(form.locationDescription || form.structure || form.crossSections) && (
          <section className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="font-semibold text-lg mb-4 text-blue-600">תיאור</h2>
            <div className="space-y-4">
              {form.locationDescription && (
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">תיאור ומיקום</div>
                  <div className="whitespace-pre-wrap text-gray-700">{form.locationDescription}</div>
                </div>
              )}
              {form.structure && (
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">מבנה</div>
                  <div className="whitespace-pre-wrap text-gray-700">{form.structure}</div>
                </div>
              )}
              {form.crossSections && (
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">חתכים</div>
                  <div className="whitespace-pre-wrap text-gray-700">{form.crossSections}</div>
                </div>
              )}
              {form.descriptionNotes && (
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">הערות</div>
                  <div className="whitespace-pre-wrap text-gray-700">{form.descriptionNotes}</div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Execution Steps */}
        {form.executionSteps && (
          <section className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="font-semibold text-lg mb-4 text-blue-600">שלבי ביצוע</h2>
            <div className="whitespace-pre-wrap text-gray-700">{form.executionSteps}</div>
          </section>
        )}

        {/* Equipment */}
        {form.equipment.length > 0 && form.equipment.some(e => e.name) && (
          <section className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="font-semibold text-lg mb-4 text-blue-600">ציוד</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-right py-3 px-3 font-medium text-gray-600">ציוד</th>
                    <th className="text-right py-3 px-3 font-medium text-gray-600">כמות</th>
                    <th className="text-right py-3 px-3 font-medium text-gray-600">הערות</th>
                  </tr>
                </thead>
                <tbody>
                  {form.equipment.filter(e => e.name).map((e) => (
                    <tr key={e.id} className="border-b border-gray-100">
                      <td className="py-3 px-3 text-gray-800">{e.name}</td>
                      <td className="py-3 px-3 text-gray-800">{e.quantity}</td>
                      <td className="py-3 px-3 text-gray-500">{e.notes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Tests */}
        {form.tests.length > 0 && form.tests.some(t => t.testType) && (
          <section className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="font-semibold text-lg mb-4 text-blue-600">בדיקות</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-right py-3 px-3 font-medium text-gray-600">סוג</th>
                    <th className="text-right py-3 px-3 font-medium text-gray-600">דרישה</th>
                    <th className="text-right py-3 px-3 font-medium text-gray-600">תוצאה</th>
                    <th className="text-right py-3 px-3 font-medium text-gray-600">תעודה</th>
                    <th className="text-right py-3 px-3 font-medium text-gray-600">סטטוס</th>
                  </tr>
                </thead>
                <tbody>
                  {form.tests.filter(t => t.testType).map((t) => (
                    <tr key={t.id} className="border-b border-gray-100">
                      <td className="py-3 px-3 text-gray-800">{t.testType}</td>
                      <td className="py-3 px-3 text-gray-800">{t.requirement || "-"}</td>
                      <td className="py-3 px-3 text-gray-800">{t.result || "-"}</td>
                      <td className="py-3 px-3 text-gray-800">{t.certificateNumber || "-"}</td>
                      <td className="py-3 px-3">{getTestStatusBadge(t.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Attachments */}
        {form.attachments.length > 0 && (
          <section className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="font-semibold text-lg mb-4 text-blue-600">מסמכים מצורפים</h2>
            <div className="space-y-3">
              {form.attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={attachment.filepath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {attachment.mimetype.includes("pdf")
                        ? "📄"
                        : attachment.mimetype.includes("image")
                        ? "🖼️"
                        : attachment.mimetype.includes("word") || attachment.mimetype.includes("document")
                        ? "📝"
                        : attachment.mimetype.includes("sheet") || attachment.mimetype.includes("excel")
                        ? "📊"
                        : "📎"}
                    </span>
                    <div>
                      <div className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                        {attachment.filename}
                      </div>
                      <div className="text-sm text-gray-400">
                        {(attachment.filesize / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                  <span className="text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    פתח ←
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Approvals */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="font-semibold text-lg mb-4 text-blue-600">אישורים</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                form.qualityControlApproval ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                {form.qualityControlApproval ? '✓' : '○'}
              </span>
              <div>
                <span className={form.qualityControlApproval ? 'text-green-700 font-medium' : 'text-gray-500'}>
                  אישור בקרת איכות
                </span>
                {form.qualityControlApproval && form.qualityControlApproverName && (
                  <div className="text-sm text-gray-500">
                    {form.qualityControlApproverName} • {form.qualityControlApprovalDate && formatDate(form.qualityControlApprovalDate)}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                form.supervisionApproval ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                {form.supervisionApproval ? '✓' : '○'}
              </span>
              <div>
                <span className={form.supervisionApproval ? 'text-green-700 font-medium' : 'text-gray-500'}>
                  אישור פיקוח
                </span>
                {form.supervisionApproval && form.supervisionApproverName && (
                  <div className="text-sm text-gray-500">
                    {form.supervisionApproverName} • {form.supervisionApprovalDate && formatDate(form.supervisionApprovalDate)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Summary */}
        {form.summaryNotes && (
          <section className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="font-semibold text-lg mb-4 text-blue-600">הערות מסכמות</h2>
            <div className="whitespace-pre-wrap text-gray-700">{form.summaryNotes}</div>
          </section>
        )}
      </main>
    </div>
  );
}
