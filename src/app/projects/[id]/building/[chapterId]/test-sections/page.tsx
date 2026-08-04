'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Project {
  id: string;
  code: string;
  name: string;
}

interface Chapter {
  id: string;
  code: string;
  name: string;
}

interface TestSection {
  id: string;
  formNumber: string;
  sectionName: string;
  date: string;
  status: string;
  qualityControlApproval: boolean;
  supervisionApproval: boolean;
}

interface ProjectChapter {
  id: string;
  project: Project;
  chapter: Chapter;
}

export default function TestSectionsListPage() {
  const params = useParams();
  const [projectChapter, setProjectChapter] = useState<ProjectChapter | null>(null);
  const [testSections, setTestSections] = useState<TestSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [chapterRes, sectionsRes] = await Promise.all([
          fetch(`/api/project-chapters/${params.chapterId}`),
          fetch(`/api/project-chapters/${params.chapterId}/test-sections`),
        ]);

        if (chapterRes.ok) {
          setProjectChapter(await chapterRes.json());
        }
        if (sectionsRes.ok) {
          setTestSections(await sectionsRes.json());
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.chapterId) {
      fetchData();
    }
  }, [params.chapterId]);

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">טוען...</div>
      </div>
    );
  }

  if (!projectChapter) {
    return (
      <div dir="rtl" className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">פרק לא נמצא</h1>
          <Link href="/" className="text-blue-600 hover:underline">
            חזור לדף הבית
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <Link
          href={`/projects/${params.id}/building/${params.chapterId}`}
          className="text-blue-600 hover:underline mb-6 inline-block"
        >
          ← חזור לפרטי הפרק
        </Link>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="text-sm text-gray-500 mb-2">
            {projectChapter.project.code} • {projectChapter.project.name} • תיק מבנה
          </div>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-blue-600 font-medium mb-1">פרק {projectChapter.chapter.code}</div>
              <h1 className="text-2xl font-bold text-gray-800">קטעי ניסוי - {projectChapter.chapter.name}</h1>
            </div>
            <Link
              href={`/projects/${params.id}/building/${params.chapterId}/test-sections/new`}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              + קטע ניסוי חדש
            </Link>
          </div>
        </div>

        {testSections.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <p className="text-gray-500 text-lg">אין קטעי ניסוי בפרק זה</p>
            <p className="text-gray-400 mt-2">לחץ על &quot;קטע ניסוי חדש&quot; כדי להתחיל</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600">מספר טופס</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600">שם קטע הניסוי</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600">תאריך</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600">סטטוס</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600">אישורים</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {testSections.map((ts) => (
                  <tr key={ts.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-blue-600 font-medium">{ts.formNumber}</td>
                    <td className="py-3 px-4 font-medium text-gray-800">{ts.sectionName}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(ts.date).toLocaleDateString('he-IL')}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        ts.status === 'passed' ? 'bg-green-100 text-green-700' :
                        ts.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {ts.status === 'passed' ? 'עבר' : ts.status === 'failed' ? 'נכשל' : 'ממתין'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {ts.qualityControlApproval && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">בקרת איכות</span>
                        )}
                        {ts.supervisionApproval && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">פיקוח</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/forms/${ts.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        פרטים ←
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
