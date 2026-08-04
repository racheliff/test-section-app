"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TestSectionWithRelations } from "@/lib/types";

export default function FormsListPage() {
  const [forms, setForms] = useState<TestSectionWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const response = await fetch("/api/test-sections");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setForms(data);
    } catch (err) {
      setError("שגיאה בטעינת הנתונים");
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
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
            ✓ עבר
          </span>
        );
      case "failed":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
            ✗ נכשל
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
            ⏳ ממתין
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-slate-500 dark:text-slate-400">טוען...</div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600">טפסי קטע ניסוי</h1>
          <Link
            href="/"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
          >
            + טופס חדש
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {forms.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-12 text-center">
            <div className="text-4xl mb-4">📋</div>
            <h2 className="text-lg font-semibold mb-2">אין טפסים שנשמרו</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">צור טופס חדש כדי להתחיל</p>
            <Link
              href="/"
              className="inline-block px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              צור טופס חדש
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {forms.map((form) => (
              <Link
                key={form.id}
                href={`/forms/${form.id}`}
                className="block bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h2 className="font-semibold text-lg">{form.sectionName}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{form.projectChapter?.project.name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(form.status)}
                    <span className="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                      פרטים ←
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">מספר טופס:</span>
                    <div className="font-medium">{form.formNumber}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">תאריך:</span>
                    <div className="font-medium">{formatDate(form.date)}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">בדיקות:</span>
                    <div className="font-medium">{form.tests.length}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">נוצר:</span>
                    <div className="font-medium">{formatDate(form.createdAt)}</div>
                  </div>
                </div>

                {form.summaryNotes && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{form.summaryNotes}</p>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
