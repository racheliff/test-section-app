'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Chapter {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
}

interface ProjectChapter {
  id: string;
  projectId: string;
  chapterId: string;
  fileType: string;
  chapter: Chapter;
  _count: {
    testSections: number;
  };
}

interface Project {
  id: string;
  code: string;
  name: string;
}

export default function DevelopmentFilePage() {
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [projectChapters, setProjectChapters] = useState<ProjectChapter[]>([]);
  const [availableChapters, setAvailableChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [selectedChapterId, setSelectedChapterId] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  const fetchData = async () => {
    try {
      const [projectRes, chaptersRes, allChaptersRes] = await Promise.all([
        fetch(`/api/projects/${params.id}`),
        fetch(`/api/projects/${params.id}/chapters?fileType=development`),
        fetch('/api/chapters'),
      ]);

      if (projectRes.ok) {
        setProject(await projectRes.json());
      }
      if (chaptersRes.ok) {
        setProjectChapters(await chaptersRes.json());
      }
      if (allChaptersRes.ok) {
        setAvailableChapters(await allChaptersRes.json());
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChapterId) return;

    try {
      const res = await fetch(`/api/projects/${params.id}/chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId: selectedChapterId,
          fileType: 'development',
        }),
      });

      if (res.ok) {
        setSelectedChapterId('');
        setShowAddChapter(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error adding chapter:', error);
    }
  };

  const usedChapterIds = new Set(projectChapters.map((pc) => pc.chapterId));
  const unusedChapters = availableChapters.filter((c) => !usedChapterIds.has(c.id));

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">טוען...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div dir="rtl" className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">פרויקט לא נמצא</h1>
          <Link href="/" className="text-blue-600 hover:underline">
            חזור לדף הבית
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Link href={`/projects/${project.id}`} className="text-blue-600 hover:underline mb-6 inline-block">
          ← חזור לפרויקט
        </Link>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-green-600 font-medium">{project.code}</div>
              <h1 className="text-2xl font-bold text-gray-800">{project.name}</h1>
              <div className="text-gray-500">תיק פיתוח</div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-700">פרקים</h2>
          <button
            onClick={() => setShowAddChapter(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            + הוסף פרק
          </button>
        </div>

        {showAddChapter && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">הוסף פרק לתיק פיתוח</h3>
            <form onSubmit={handleAddChapter} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  בחר פרק
                </label>
                <select
                  value={selectedChapterId}
                  onChange={(e) => setSelectedChapterId(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">בחר פרק...</option>
                  {unusedChapters.map((chapter) => (
                    <option key={chapter.id} value={chapter.id}>
                      {chapter.code} - {chapter.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  הוסף
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddChapter(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        )}

        {projectChapters.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <p className="text-gray-500 text-lg">אין פרקים בתיק פיתוח</p>
            <p className="text-gray-400 mt-2">לחץ על &quot;הוסף פרק&quot; כדי להתחיל</p>
          </div>
        ) : (
          <div className="space-y-4">
            {projectChapters.map((pc) => (
              <Link
                key={pc.id}
                href={`/projects/${project.id}/development/${pc.id}`}
                className="block bg-white rounded-xl shadow p-5 hover:shadow-lg transition-shadow border-2 border-transparent hover:border-green-500"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-green-600 font-medium mb-1">פרק {pc.chapter.code}</div>
                    <h3 className="text-lg font-semibold text-gray-800">{pc.chapter.name}</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-500">
                      {pc._count.testSections} קטעי ניסוי
                    </div>
                    <span className="text-green-600">פרטים ←</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
