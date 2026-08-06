'use client';

import { useEffect, useState, useRef } from 'react';
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
}

interface ChecklistItem {
  id: string;
  workStage: string;
  description: string;
  responsible: string;
  name: string | null;
  signature: string | null;
  date: string | null;
  notes: string | null;
  isCompleted: boolean;
  status: string;
  sortOrder: number;
}

interface Checklist {
  id: string;
  name: string;
  building: string | null;
  elementType: string | null;
  location: string | null;
  planNumber: string | null;
  mainContractor: string | null;
  openDate: string | null;
  closeDate: string | null;
  items: ChecklistItem[];
}

interface ProjectChapter {
  id: string;
  project: Project;
  chapter: Chapter;
  testSections: TestSection[];
}

export default function ChapterDetailPage() {
  const params = useParams();
  const [projectChapter, setProjectChapter] = useState<ProjectChapter | null>(null);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewChecklist, setShowNewChecklist] = useState(false);
  const [newChecklist, setNewChecklist] = useState({
    building: '',          // מבנה/אזור
    workLocation: '',      // מיקום העבודה
    workType: '',          // סוג העבודה
    openDate: '',          // תאריך פתיחת רת"ק
    qcName: '',            // שם בקר איכות
    workManagerName: '',   // שם מנהל עבודה
    planNumber: '',        // מספר תוכניות
    detailNumber: '',      // מספר תוכנו
    sectionsFromPlan: '',  // חתכים מהתוכניות
    soilType: '',          // סוג הקרקע
    fillMaterialType: '',  // סוג חומר המילוי
    performingLab: '',     // מעבדה מבצעת
  });
  const [expandedChecklist, setExpandedChecklist] = useState<string | null>(null);
  const [signatureModal, setSignatureModal] = useState<{ itemId: string; checklistId: string } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (params.chapterId) {
      fetchData();
    }
  }, [params.chapterId]);

  const fetchData = async () => {
    try {
      const [chapterRes, checklistsRes] = await Promise.all([
        fetch(`/api/project-chapters/${params.chapterId}`),
        fetch(`/api/project-chapters/${params.chapterId}/checklists`),
      ]);

      if (chapterRes.ok) {
        setProjectChapter(await chapterRes.json());
      }
      if (checklistsRes.ok) {
        const checklistsData = await checklistsRes.json();
        setChecklists(checklistsData);
        if (checklistsData.length > 0) {
          setExpandedChecklist(checklistsData[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const name = [newChecklist.workType, newChecklist.building, newChecklist.workLocation].filter(Boolean).join(' - ') || 'רשימת תיוג';
      const res = await fetch(`/api/project-chapters/${params.chapterId}/checklists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newChecklist, name }),
      });

      if (res.ok) {
        setNewChecklist({
          building: '',
          workLocation: '',
          workType: '',
          openDate: '',
          qcName: '',
          workManagerName: '',
          planNumber: '',
          detailNumber: '',
          sectionsFromPlan: '',
          soilType: '',
          fillMaterialType: '',
          performingLab: '',
        });
        setShowNewChecklist(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error creating checklist:', error);
    }
  };

  const handleUpdateItem = async (itemId: string, field: string, value: string | boolean) => {
    try {
      const item = checklists.flatMap(c => c.items).find(i => i.id === itemId);
      if (!item) return;

      const updateData: Record<string, string | boolean | null> = {
        name: item.name,
        signature: item.signature,
        date: item.date,
        notes: item.notes,
        isCompleted: item.isCompleted,
        status: item.status || 'pending',
      };
      updateData[field] = value;

      // אם זה עדכון סטטוס, עדכן גם isCompleted
      if (field === 'status') {
        updateData.isCompleted = (value === 'ok' || value === 'corrected');
        if ((value === 'ok' || value === 'not_ok' || value === 'corrected') && !item.date) {
          updateData.date = new Date().toISOString();
        }
      }

      if (field === 'isCompleted' && value === true && !item.date) {
        updateData.date = new Date().toISOString();
      }

      await fetch(`/api/checklist-items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      setChecklists(prev => prev.map(checklist => ({
        ...checklist,
        items: checklist.items.map(i => {
          if (i.id !== itemId) return i;
          const updates: Partial<ChecklistItem> = { [field]: value };
          if (field === 'status') {
            updates.isCompleted = (value === 'ok' || value === 'corrected');
            if ((value === 'ok' || value === 'not_ok' || value === 'corrected') && !i.date) {
              updates.date = new Date().toISOString();
            }
          }
          return { ...i, ...updates };
        }),
      })));
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleDeleteChecklist = async (checklistId: string) => {
    if (!confirm('האם למחוק את רשימת התיוג?')) return;

    try {
      const res = await fetch(`/api/checklists/${checklistId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setChecklists(prev => prev.filter(c => c.id !== checklistId));
        if (expandedChecklist === checklistId) {
          setExpandedChecklist(null);
        }
      }
    } catch (error) {
      console.error('Error deleting checklist:', error);
    }
  };

  const handleDeleteItem = async (checklistId: string, itemId: string) => {
    try {
      const res = await fetch(`/api/checklist-items/${itemId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setChecklists(prev => prev.map(checklist =>
          checklist.id === checklistId
            ? { ...checklist, items: checklist.items.filter(i => i.id !== itemId) }
            : checklist
        ));
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const openSignatureModal = (itemId: string, checklistId: string) => {
    setSignatureModal({ itemId, checklistId });
  };

  const closeSignatureModal = () => {
    setSignatureModal(null);
    setIsDrawing(false);
  };

  const getCanvasContext = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
    return ctx;
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = getCanvasContext();
    if (!canvas || !ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    let x: number, y: number;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = getCanvasContext();
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x: number, y: number;

    if ('touches' in e) {
      e.preventDefault();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const saveSignature = async () => {
    if (!signatureModal || !canvasRef.current) return;

    const signatureData = canvasRef.current.toDataURL('image/png');
    await handleUpdateItem(signatureModal.itemId, 'signature', signatureData);
    closeSignatureModal();
  };

  const groupItemsByStage = (items: ChecklistItem[]) => {
    const groups: { [key: string]: ChecklistItem[] } = {};
    items.forEach(item => {
      if (!groups[item.workStage]) {
        groups[item.workStage] = [];
      }
      groups[item.workStage].push(item);
    });
    return groups;
  };

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
      <div className="max-w-6xl mx-auto">
        <Link
          href={`/projects/${projectChapter.project.id}/building`}
          className="text-blue-600 hover:underline mb-6 inline-block"
        >
          ← חזור לתיק מבנה
        </Link>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="text-sm text-gray-500 mb-2">
            {projectChapter.project.code} • {projectChapter.project.name} • תיק מבנה
          </div>
          <div className="text-sm text-blue-600 font-medium mb-1">פרק {projectChapter.chapter.code}</div>
          <h1 className="text-2xl font-bold text-gray-800">{projectChapter.chapter.name}</h1>
        </div>

        {/* Test Sections Link */}
        <Link
          href={`/projects/${params.id}/building/${params.chapterId}/test-sections`}
          className="block bg-blue-600 text-white rounded-xl shadow-lg p-6 hover:bg-blue-700 transition-colors mb-8"
        >
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold mb-1">רשימת קטעי ניסוי</h2>
              <p className="text-blue-100">
                {projectChapter.testSections.length} קטעי ניסוי בפרק זה
              </p>
            </div>
            <span className="text-3xl">←</span>
          </div>
        </Link>

        {/* Recent Test Sections */}
        {projectChapter.testSections.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">קטעי ניסוי אחרונים</h3>
            <div className="space-y-3">
              {projectChapter.testSections.slice(0, 5).map((ts) => (
                <Link
                  key={ts.id}
                  href={`/forms/${ts.id}`}
                  className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm text-blue-600 font-medium">{ts.formNumber}</div>
                      <div className="font-medium text-gray-800">{ts.sectionName}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        ts.status === 'passed' ? 'bg-green-100 text-green-700' :
                        ts.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {ts.status === 'passed' ? 'עבר' : ts.status === 'failed' ? 'נכשל' : 'ממתין'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(ts.date).toLocaleDateString('he-IL')}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Checklists Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-700">רשימות תיוג</h2>
            <button
              onClick={() => setShowNewChecklist(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              + רשימת תיוג חדשה
            </button>
          </div>

          {/* New Checklist Form */}
          {showNewChecklist && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4 text-blue-700 border-b-2 border-blue-100 pb-2">רשימת תיוג חדשה</h3>
              <form onSubmit={handleCreateChecklist} className="space-y-4">
                {/* שורה 1 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">מבנה/אזור</label>
                    <input
                      type="text"
                      value={newChecklist.building}
                      onChange={(e) => setNewChecklist({ ...newChecklist, building: e.target.value })}
                      placeholder="מבנה"
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">מיקום העבודה</label>
                    <input
                      type="text"
                      value={newChecklist.workLocation}
                      onChange={(e) => setNewChecklist({ ...newChecklist, workLocation: e.target.value })}
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">סוג העבודה</label>
                    <select
                      value={newChecklist.workType}
                      onChange={(e) => setNewChecklist({ ...newChecklist, workType: e.target.value })}
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">בחר סוג עבודה</option>
                      <option value="חפירה">חפירה</option>
                      <option value="מילוי">מילוי</option>
                      <option value="הכנת קרקע">הכנת קרקע</option>
                      <option value="הידוק">הידוק</option>
                      <option value="עבודות פיתוח">עבודות פיתוח</option>
                      <option value="אחר">אחר</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">תאריך פתיחת רת״ק</label>
                    <input
                      type="date"
                      value={newChecklist.openDate}
                      onChange={(e) => setNewChecklist({ ...newChecklist, openDate: e.target.value })}
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
                {/* שורה 2 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">שם בקר איכות</label>
                    <input
                      type="text"
                      value={newChecklist.qcName}
                      onChange={(e) => setNewChecklist({ ...newChecklist, qcName: e.target.value })}
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">שם מנהל עבודה</label>
                    <input
                      type="text"
                      value={newChecklist.workManagerName}
                      onChange={(e) => setNewChecklist({ ...newChecklist, workManagerName: e.target.value })}
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">מספר תוכניות</label>
                    <input
                      type="text"
                      value={newChecklist.planNumber}
                      onChange={(e) => setNewChecklist({ ...newChecklist, planNumber: e.target.value })}
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">מספר תוכנו</label>
                    <input
                      type="text"
                      value={newChecklist.detailNumber}
                      onChange={(e) => setNewChecklist({ ...newChecklist, detailNumber: e.target.value })}
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
                {/* שורה 3 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">חתכים מהתוכניות</label>
                    <input
                      type="text"
                      value={newChecklist.sectionsFromPlan}
                      onChange={(e) => setNewChecklist({ ...newChecklist, sectionsFromPlan: e.target.value })}
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">סוג הקרקע</label>
                    <input
                      type="text"
                      value={newChecklist.soilType}
                      onChange={(e) => setNewChecklist({ ...newChecklist, soilType: e.target.value })}
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">סוג חומר המילוי</label>
                    <input
                      type="text"
                      value={newChecklist.fillMaterialType}
                      onChange={(e) => setNewChecklist({ ...newChecklist, fillMaterialType: e.target.value })}
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">מעבדה מבצעת</label>
                    <input
                      type="text"
                      value={newChecklist.performingLab}
                      onChange={(e) => setNewChecklist({ ...newChecklist, performingLab: e.target.value })}
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 font-medium"
                  >
                    צור רשימה
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewChecklist(false)}
                    className="bg-gray-300 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-400"
                  >
                    ביטול
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Checklists */}
          {checklists.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-lg">
              <p className="text-gray-500 text-lg">אין רשימות תיוג בפרק זה</p>
              <p className="text-gray-400 mt-2">לחץ על &quot;רשימת תיוג חדשה&quot; כדי להתחיל</p>
            </div>
          ) : (
            <div className="space-y-6">
              {checklists.map((checklist) => {
                const groupedItems = groupItemsByStage(checklist.items);
                const completedCount = checklist.items.filter(i => i.isCompleted).length;
                const totalCount = checklist.items.length;
                const isExpanded = expandedChecklist === checklist.id;

                return (
                  <div key={checklist.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {/* Checklist Header */}
                    <div
                      className="p-6 cursor-pointer hover:bg-gray-50"
                      onClick={() => setExpandedChecklist(isExpanded ? null : checklist.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">{checklist.name}</h3>
                          <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                            {checklist.building && <span>מבנה: {checklist.building}</span>}
                            {checklist.elementType && <span>סוג: {checklist.elementType}</span>}
                            {checklist.mainContractor && <span>קבלן: {checklist.mainContractor}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{completedCount}/{totalCount}</div>
                            <div className="text-xs text-gray-500">הושלמו</div>
                          </div>
                          <Link
                            href={`/projects/${params.id}/building/${params.chapterId}/checklist/${checklist.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                          >
                            פתח דוח מלא
                          </Link>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteChecklist(checklist.id);
                            }}
                            className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                            title="מחק רשימה"
                          >
                            🗑️
                          </button>
                          <span className={`text-2xl transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                            ▼
                          </span>
                        </div>
                      </div>
                      {/* Progress Bar */}
                      <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-all"
                          style={{ width: `${(completedCount / totalCount) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Checklist Items - Sections Layout */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 p-4 space-y-6">
                        {Object.entries(groupedItems).map(([stage, items], stageIndex) => (
                          <div key={stage} className="bg-slate-50 rounded-xl p-4">
                            {/* Stage Header */}
                            <h3 className="flex items-center gap-3 text-blue-700 font-semibold text-base mb-4 pb-2 border-b-2 border-blue-100">
                              <span className="bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">
                                {stageIndex + 1}
                              </span>
                              פרק {stageIndex + 1} – {stage}
                            </h3>

                            {/* Items */}
                            <div className="space-y-3">
                              {items.map((item, itemIndex) => {
                                const itemNum = `${stageIndex + 1}.${itemIndex + 1}`;
                                return (
                                  <div
                                    key={item.id}
                                    className={`rounded-xl p-4 border-2 transition-all ${
                                      item.status === 'ok' || item.status === 'corrected'
                                        ? 'bg-emerald-50 border-emerald-300'
                                        : item.status === 'not_ok'
                                        ? 'bg-red-50 border-red-300'
                                        : 'bg-white border-gray-200 hover:border-gray-300'
                                    }`}
                                  >
                                    {/* Item Header */}
                                    <div className="flex gap-3 items-start mb-3">
                                      <div className="bg-slate-700 text-white min-w-[40px] h-6 rounded-full flex items-center justify-center text-xs font-bold">
                                        {itemNum}
                                      </div>
                                      <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-800">{item.description}</div>
                                        <div className="text-xs text-gray-400 mt-1">אחראי: {item.responsible}</div>
                                      </div>
                                      <button
                                        onClick={() => handleDeleteItem(checklist.id, item.id)}
                                        className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded p-1"
                                        title="מחק"
                                      >
                                        ✕
                                      </button>
                                    </div>

                                    {/* Status Buttons */}
                                    <div className="grid grid-cols-5 gap-1.5 mb-3">
                                      <button
                                        onClick={() => handleUpdateItem(item.id, 'status', 'pending')}
                                        className={`border-2 rounded-lg py-2 text-xs font-bold transition-all ${
                                          (item.status || 'pending') === 'pending'
                                            ? 'bg-amber-100 border-amber-400 text-amber-800'
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-amber-50'
                                        }`}
                                      >
                                        טרם נבדק
                                      </button>
                                      <button
                                        onClick={() => handleUpdateItem(item.id, 'status', 'ok')}
                                        className={`border-2 rounded-lg py-2 text-xs font-bold transition-all ${
                                          item.status === 'ok'
                                            ? 'bg-emerald-500 border-emerald-600 text-white'
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-emerald-50'
                                        }`}
                                      >
                                        תקין
                                      </button>
                                      <button
                                        onClick={() => handleUpdateItem(item.id, 'status', 'not_ok')}
                                        className={`border-2 rounded-lg py-2 text-xs font-bold transition-all ${
                                          item.status === 'not_ok'
                                            ? 'bg-red-500 border-red-600 text-white'
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-red-50'
                                        }`}
                                      >
                                        לא תקין
                                      </button>
                                      <button
                                        onClick={() => handleUpdateItem(item.id, 'status', 'na')}
                                        className={`border-2 rounded-lg py-2 text-xs font-bold transition-all ${
                                          item.status === 'na'
                                            ? 'bg-slate-400 border-slate-500 text-white'
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-slate-50'
                                        }`}
                                      >
                                        לא רלוונטי
                                      </button>
                                      <button
                                        onClick={() => handleUpdateItem(item.id, 'status', 'corrected')}
                                        className={`border-2 rounded-lg py-2 text-xs font-bold transition-all ${
                                          item.status === 'corrected'
                                            ? 'bg-violet-500 border-violet-600 text-white'
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-violet-50'
                                        }`}
                                      >
                                        תוקן
                                      </button>
                                    </div>

                                    {/* Meta Fields */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                      <div className="flex flex-col gap-1">
                                        <label className="text-xs font-semibold text-gray-500">תאריך</label>
                                        <input
                                          type="date"
                                          value={item.date ? new Date(item.date).toISOString().split('T')[0] : ''}
                                          onChange={(e) => handleUpdateItem(item.id, 'date', e.target.value)}
                                          className="border-2 rounded-lg p-2 text-sm bg-white border-gray-200 focus:border-blue-400 focus:outline-none"
                                        />
                                      </div>
                                      <div className="flex flex-col gap-1">
                                        <label className="text-xs font-semibold text-gray-500">שם מאשר</label>
                                        <input
                                          type="text"
                                          value={item.name || ''}
                                          onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                                          placeholder="הזן שם"
                                          className="border-2 rounded-lg p-2 text-sm bg-white border-gray-200 focus:border-blue-400 focus:outline-none"
                                        />
                                      </div>
                                      <div className="flex flex-col gap-1">
                                        <label className="text-xs font-semibold text-gray-500">חתימה</label>
                                        {item.signature ? (
                                          <div className="flex items-center gap-2 border-2 rounded-lg p-1.5 bg-white border-gray-200">
                                            <img src={item.signature} alt="חתימה" className="h-6 object-contain" />
                                            <button
                                              onClick={() => openSignatureModal(item.id, checklist.id)}
                                              className="text-blue-600 hover:text-blue-800 text-xs"
                                            >
                                              שנה
                                            </button>
                                          </div>
                                        ) : (
                                          <button
                                            onClick={() => openSignatureModal(item.id, checklist.id)}
                                            className="border-2 border-dashed rounded-lg p-2 text-sm text-blue-600 hover:bg-blue-50 border-blue-300"
                                          >
                                            לחץ לחתימה
                                          </button>
                                        )}
                                      </div>
                                      <div className="flex flex-col gap-1">
                                        <label className="text-xs font-semibold text-gray-500">הערות</label>
                                        <input
                                          type="text"
                                          value={item.notes || ''}
                                          onChange={(e) => handleUpdateItem(item.id, 'notes', e.target.value)}
                                          placeholder="הוסף הערה..."
                                          className="border-2 rounded-lg p-2 text-sm bg-white border-gray-200 focus:border-blue-400 focus:outline-none"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Signature Modal */}
      {signatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">חתימה</h3>
            <div className="border-2 border-gray-300 rounded-lg mb-4 touch-none">
              <canvas
                ref={canvasRef}
                width={350}
                height={200}
                className="w-full bg-white rounded-lg cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={clearSignature}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                נקה
              </button>
              <button
                onClick={closeSignatureModal}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={saveSignature}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                שמור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
