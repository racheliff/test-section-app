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

interface NonConformance {
  description: string;
  requirement: string;
  documentNumber: string;
  severity: 'minor' | 'significant' | 'critical';
  correctiveAction: string;
  responsiblePerson: string;
  dueDate: string;
  signature: string | null;
  attachments: string[];
}

interface Correction {
  description: string;
  date: string;
  performedBy: string;
  attachments: string[];
  inspectorNotes: string;
  inspectorName: string;
  inspectorSignature: string | null;
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
  images: string[];
  nonConformance: NonConformance | null;
  correction: Correction | null;
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
  const [activeTab, setActiveTab] = useState<'checklists' | 'nonConformances'>('checklists');

  // מודל אי-התאמה
  const [nonConformanceModal, setNonConformanceModal] = useState<{ itemId: string } | null>(null);
  const [nonConformanceForm, setNonConformanceForm] = useState<NonConformance>({
    description: '',
    requirement: '',
    documentNumber: '',
    severity: 'minor',
    correctiveAction: '',
    responsiblePerson: '',
    dueDate: '',
    signature: null,
    attachments: [],
  });

  // מודל תיקון
  const [correctionModal, setCorrectionModal] = useState<{ itemId: string } | null>(null);
  const [correctionForm, setCorrectionForm] = useState<Correction>({
    description: '',
    date: new Date().toISOString().split('T')[0],
    performedBy: '',
    attachments: [],
    inspectorNotes: '',
    inspectorName: '',
    inspectorSignature: null,
  });

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

  // עדכון מקומי בלבד (לשדות טקסט - בזמן הקלדה)
  const handleLocalUpdate = (itemId: string, field: string, value: string) => {
    setChecklists(prev => prev.map(checklist => ({
      ...checklist,
      items: checklist.items.map(i =>
        i.id === itemId ? { ...i, [field]: value } : i
      ),
    })));
  };

  // הוספת תמונה
  const handleAddImage = async (itemId: string, imageUrl: string) => {
    const item = checklists.flatMap(c => c.items).find(i => i.id === itemId);
    if (!item) return;

    const currentImages = Array.isArray(item.images) ? item.images : [];
    const newImages = [...currentImages, imageUrl];

    setChecklists(prev => prev.map(checklist => ({
      ...checklist,
      items: checklist.items.map(i =>
        i.id === itemId ? { ...i, images: newImages } : i
      ),
    })));

    try {
      await fetch(`/api/checklist-items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.name,
          signature: item.signature,
          date: item.date,
          notes: item.notes,
          isCompleted: item.isCompleted,
          status: item.status || 'pending',
          images: newImages,
        }),
      });
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  // מחיקת תמונה
  const handleRemoveImage = async (itemId: string, imageIndex: number) => {
    const item = checklists.flatMap(c => c.items).find(i => i.id === itemId);
    if (!item) return;

    const currentImages = Array.isArray(item.images) ? item.images : [];
    const newImages = currentImages.filter((_, idx) => idx !== imageIndex);

    setChecklists(prev => prev.map(checklist => ({
      ...checklist,
      items: checklist.items.map(i =>
        i.id === itemId ? { ...i, images: newImages } : i
      ),
    })));

    try {
      await fetch(`/api/checklist-items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.name,
          signature: item.signature,
          date: item.date,
          notes: item.notes,
          isCompleted: item.isCompleted,
          status: item.status || 'pending',
          images: newImages,
        }),
      });
    } catch (error) {
      console.error('Error removing image:', error);
    }
  };

  // שמירה ל-DB (נקרא ב-onBlur או בלחיצה על כפתור)
  const handleSaveItem = async (itemId: string) => {
    try {
      const item = checklists.flatMap(c => c.items).find(i => i.id === itemId);
      if (!item) return;

      await fetch(`/api/checklist-items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.name,
          signature: item.signature,
          date: item.date,
          notes: item.notes,
          isCompleted: item.isCompleted,
          status: item.status || 'pending',
          images: item.images,
        }),
      });
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  // עדכון מיידי (לכפתורים, תאריכים, חתימות)
  const handleUpdateItem = async (itemId: string, field: string, value: string | boolean) => {
    try {
      const item = checklists.flatMap(c => c.items).find(i => i.id === itemId);
      if (!item) return;

      const updateData: Record<string, string | boolean | null | string[]> = {
        name: item.name,
        signature: item.signature,
        date: item.date,
        notes: item.notes,
        isCompleted: item.isCompleted,
        status: item.status || 'pending',
        images: item.images,
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

  // פתיחת טופס אי-התאמה
  const openNonConformanceModal = (itemId: string) => {
    const item = checklists.flatMap(c => c.items).find(i => i.id === itemId);
    if (item?.nonConformance) {
      setNonConformanceForm(item.nonConformance);
    } else {
      setNonConformanceForm({
        description: '',
        requirement: '',
        documentNumber: '',
        severity: 'minor',
        correctiveAction: '',
        responsiblePerson: '',
        dueDate: '',
        signature: null,
        attachments: [],
      });
    }
    setNonConformanceModal({ itemId });
  };

  // שמירת טופס אי-התאמה
  const handleSaveNonConformance = async () => {
    if (!nonConformanceModal) return;
    const itemId = nonConformanceModal.itemId;

    try {
      const item = checklists.flatMap(c => c.items).find(i => i.id === itemId);
      if (!item) return;

      await fetch(`/api/checklist-items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.name,
          signature: item.signature,
          date: new Date().toISOString(),
          notes: item.notes,
          isCompleted: false,
          status: 'not_ok',
          images: item.images,
          nonConformance: nonConformanceForm,
        }),
      });

      setChecklists(prev => prev.map(checklist => ({
        ...checklist,
        items: checklist.items.map(i =>
          i.id === itemId
            ? { ...i, status: 'not_ok', isCompleted: false, date: new Date().toISOString(), nonConformance: nonConformanceForm }
            : i
        ),
      })));

      setNonConformanceModal(null);
    } catch (error) {
      console.error('Error saving non-conformance:', error);
    }
  };

  // פתיחת טופס תיקון
  const openCorrectionModal = (itemId: string) => {
    const item = checklists.flatMap(c => c.items).find(i => i.id === itemId);
    if (item?.correction) {
      setCorrectionForm(item.correction);
    } else {
      setCorrectionForm({
        description: '',
        date: new Date().toISOString().split('T')[0],
        performedBy: '',
        attachments: [],
        inspectorNotes: '',
        inspectorName: '',
        inspectorSignature: null,
      });
    }
    setCorrectionModal({ itemId });
  };

  // שמירת טופס תיקון
  const handleSaveCorrection = async () => {
    if (!correctionModal) return;
    const itemId = correctionModal.itemId;

    try {
      const item = checklists.flatMap(c => c.items).find(i => i.id === itemId);
      if (!item) return;

      await fetch(`/api/checklist-items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.name,
          signature: item.signature,
          date: new Date().toISOString(),
          notes: item.notes,
          isCompleted: true,
          status: 'corrected',
          images: item.images,
          nonConformance: item.nonConformance,
          correction: correctionForm,
        }),
      });

      setChecklists(prev => prev.map(checklist => ({
        ...checklist,
        items: checklist.items.map(i =>
          i.id === itemId
            ? { ...i, status: 'corrected', isCompleted: true, date: new Date().toISOString(), correction: correctionForm }
            : i
        ),
      })));

      setCorrectionModal(null);
    } catch (error) {
      console.error('Error saving correction:', error);
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

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('checklists')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'checklists'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            רשימות תיוג
          </button>
          <button
            onClick={() => setActiveTab('nonConformances')}
            className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'nonConformances'
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            אי-התאמות
            {checklists.flatMap(c => c.items).filter(i => i.status === 'not_ok').length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'nonConformances' ? 'bg-white text-red-600' : 'bg-red-500 text-white'
              }`}>
                {checklists.flatMap(c => c.items).filter(i => i.status === 'not_ok').length}
              </span>
            )}
          </button>
        </div>

        {/* Checklists Section */}
        {activeTab === 'checklists' && (
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
                            href={`/projects/${params.id}/building/${params.chapterId}/checklist/${checklist.id}/print`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors"
                            title="הדפס PDF"
                          >
                            🖨️
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
                                    className={`rounded-lg p-4 border transition-all ${
                                      item.status === 'ok' || item.status === 'corrected'
                                        ? 'bg-emerald-50 border-emerald-300'
                                        : item.status === 'not_ok'
                                        ? 'bg-red-50 border-red-300'
                                        : 'bg-white border-gray-300'
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
                                    <div className="grid grid-cols-5 gap-2 mb-4">
                                      <button
                                        onClick={() => handleUpdateItem(item.id, 'status', 'pending')}
                                        className={`border rounded-lg p-2.5 text-sm font-medium transition-all ${
                                          (item.status || 'pending') === 'pending'
                                            ? 'bg-amber-100 border-amber-400 text-amber-800'
                                            : 'bg-white text-gray-600 border-gray-300 hover:bg-amber-50'
                                        }`}
                                      >
                                        טרם נבדק
                                      </button>
                                      <button
                                        onClick={() => handleUpdateItem(item.id, 'status', 'ok')}
                                        className={`border rounded-lg p-2.5 text-sm font-medium transition-all ${
                                          item.status === 'ok'
                                            ? 'bg-emerald-500 border-emerald-500 text-white'
                                            : 'bg-white text-gray-600 border-gray-300 hover:bg-emerald-50'
                                        }`}
                                      >
                                        תקין
                                      </button>
                                      <button
                                        onClick={() => openNonConformanceModal(item.id)}
                                        className={`border rounded-lg p-2.5 text-sm font-medium transition-all ${
                                          item.status === 'not_ok'
                                            ? 'bg-red-500 border-red-500 text-white'
                                            : 'bg-white text-gray-600 border-gray-300 hover:bg-red-50'
                                        }`}
                                      >
                                        לא תקין
                                      </button>
                                      <button
                                        onClick={() => handleUpdateItem(item.id, 'status', 'na')}
                                        className={`border rounded-lg p-2.5 text-sm font-medium transition-all ${
                                          item.status === 'na'
                                            ? 'bg-slate-400 border-slate-400 text-white'
                                            : 'bg-white text-gray-600 border-gray-300 hover:bg-slate-50'
                                        }`}
                                      >
                                        לא רלוונטי
                                      </button>
                                      <button
                                        onClick={() => openCorrectionModal(item.id)}
                                        className={`border rounded-lg p-2.5 text-sm font-medium transition-all ${
                                          item.status === 'corrected'
                                            ? 'bg-violet-500 border-violet-500 text-white'
                                            : 'bg-white text-gray-600 border-gray-300 hover:bg-violet-50'
                                        }`}
                                      >
                                        תוקן
                                      </button>
                                    </div>

                                    {/* Meta Fields */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">תאריך</label>
                                        <input
                                          type="date"
                                          value={item.date ? new Date(item.date).toISOString().split('T')[0] : ''}
                                          onChange={(e) => handleUpdateItem(item.id, 'date', e.target.value)}
                                          className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">שם מאשר</label>
                                        <input
                                          type="text"
                                          value={item.name || ''}
                                          onChange={(e) => handleLocalUpdate(item.id, 'name', e.target.value)}
                                          onBlur={() => handleSaveItem(item.id)}
                                          placeholder="הזן שם"
                                          className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">חתימה</label>
                                        {item.signature ? (
                                          <div className="flex items-center gap-2 p-2.5 border border-gray-300 rounded-lg bg-white">
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
                                            className="w-full p-2.5 border border-dashed border-blue-300 rounded-lg text-sm text-blue-600 hover:bg-blue-50"
                                          >
                                            לחץ לחתימה
                                          </button>
                                        )}
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">הערות</label>
                                        <input
                                          type="text"
                                          value={item.notes || ''}
                                          onChange={(e) => handleLocalUpdate(item.id, 'notes', e.target.value)}
                                          onBlur={() => handleSaveItem(item.id)}
                                          placeholder="הוסף הערה..."
                                          className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">תמונות</label>
                                        <div className="space-y-2">
                                          {/* תמונות קיימות */}
                                          {Array.isArray(item.images) && item.images.length > 0 && (
                                            <div className="grid grid-cols-3 gap-2">
                                              {item.images.map((img, idx) => (
                                                <div key={idx} className="relative group">
                                                  <img
                                                    src={img}
                                                    alt={`תמונה ${idx + 1}`}
                                                    className="w-full h-20 object-cover rounded-lg border border-gray-300"
                                                  />
                                                  <button
                                                    onClick={() => handleRemoveImage(item.id, idx)}
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                  >
                                                    ✕
                                                  </button>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                          {/* כפתור הוספת תמונה */}
                                          <label className="flex items-center justify-center w-full p-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                                            <input
                                              type="file"
                                              accept="image/*"
                                              className="hidden"
                                              onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                  const reader = new FileReader();
                                                  reader.onload = (event) => {
                                                    const base64 = event.target?.result as string;
                                                    handleAddImage(item.id, base64);
                                                  };
                                                  reader.readAsDataURL(file);
                                                }
                                              }}
                                            />
                                            <span className="text-sm text-gray-500">📷 הוסף תמונה</span>
                                          </label>
                                        </div>
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
        )}

        {/* Non-Conformances Tab */}
        {activeTab === 'nonConformances' && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-700">רשימת אי-התאמות</h2>
            </div>

            {(() => {
              const nonConformanceItems = checklists.flatMap(checklist =>
                checklist.items
                  .filter(item => item.status === 'not_ok' || item.status === 'corrected')
                  .map(item => ({ ...item, checklistName: checklist.name, checklistId: checklist.id, building: checklist.building }))
              );

              if (nonConformanceItems.length === 0) {
                return (
                  <div className="text-center py-12 bg-white rounded-xl shadow">
                    <div className="text-4xl mb-4">✓</div>
                    <p className="text-gray-500 text-lg">אין אי-התאמות</p>
                    <p className="text-gray-400 mt-2">כל הפריטים תקינים</p>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-red-600">
                        {nonConformanceItems.filter(i => i.status === 'not_ok').length}
                      </div>
                      <div className="text-sm text-red-700">אי-התאמות פתוחות</div>
                    </div>
                    <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-violet-600">
                        {nonConformanceItems.filter(i => i.status === 'corrected').length}
                      </div>
                      <div className="text-sm text-violet-700">תוקנו</div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-gray-600">
                        {nonConformanceItems.length}
                      </div>
                      <div className="text-sm text-gray-700">סה״כ</div>
                    </div>
                  </div>

                  {/* List */}
                  {nonConformanceItems.map((item, index) => (
                    <div
                      key={item.id}
                      className={`bg-white rounded-xl shadow-lg p-5 border-r-4 ${
                        item.status === 'not_ok' ? 'border-red-500' : 'border-violet-500'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            item.status === 'not_ok'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-violet-100 text-violet-700'
                          }`}>
                            {item.status === 'not_ok' ? 'לא תקין' : 'תוקן'}
                          </span>
                          <span className="text-sm text-gray-500">#{index + 1}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.date && new Date(item.date).toLocaleDateString('he-IL')}
                        </div>
                      </div>

                      <h3 className="font-bold text-gray-800 mb-2">{item.description}</h3>

                      <div className="text-sm text-gray-500 mb-3">
                        <span className="font-medium">רשימת תיוג:</span> {item.checklistName}
                        {item.building && <span className="mr-3">| <span className="font-medium">מבנה:</span> {item.building}</span>}
                      </div>

                      {item.nonConformance && (
                        <div className="bg-red-50 rounded-lg p-4 mt-3 space-y-2">
                          <h4 className="font-bold text-red-800 text-sm mb-2">פרטי אי-ההתאמה:</h4>
                          {item.nonConformance.description && (
                            <p className="text-sm"><span className="font-medium">תיאור:</span> {item.nonConformance.description}</p>
                          )}
                          {item.nonConformance.requirement && (
                            <p className="text-sm"><span className="font-medium">דרישה:</span> {item.nonConformance.requirement}</p>
                          )}
                          {item.nonConformance.documentNumber && (
                            <p className="text-sm"><span className="font-medium">מסמך:</span> {item.nonConformance.documentNumber}</p>
                          )}
                          <p className="text-sm">
                            <span className="font-medium">חומרה:</span>{' '}
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              item.nonConformance.severity === 'critical' ? 'bg-red-200 text-red-800' :
                              item.nonConformance.severity === 'significant' ? 'bg-orange-200 text-orange-800' :
                              'bg-yellow-200 text-yellow-800'
                            }`}>
                              {item.nonConformance.severity === 'critical' ? 'חמורה' :
                               item.nonConformance.severity === 'significant' ? 'משמעותית' : 'קלה'}
                            </span>
                          </p>
                          {item.nonConformance.correctiveAction && (
                            <p className="text-sm"><span className="font-medium">פעולה מתקנת:</span> {item.nonConformance.correctiveAction}</p>
                          )}
                          {item.nonConformance.responsiblePerson && (
                            <p className="text-sm"><span className="font-medium">אחראי:</span> {item.nonConformance.responsiblePerson}</p>
                          )}
                          {item.nonConformance.dueDate && (
                            <p className="text-sm"><span className="font-medium">מועד יעד:</span> {new Date(item.nonConformance.dueDate).toLocaleDateString('he-IL')}</p>
                          )}
                          {item.nonConformance.attachments && item.nonConformance.attachments.length > 0 && (
                            <div className="flex gap-2 mt-2">
                              {item.nonConformance.attachments.map((att: string, idx: number) => (
                                <img key={idx} src={att} alt={`צרופה ${idx + 1}`} className="w-16 h-16 object-cover rounded-lg border" />
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {item.correction && item.status === 'corrected' && (
                        <div className="bg-violet-50 rounded-lg p-4 mt-3 space-y-2">
                          <h4 className="font-bold text-violet-800 text-sm mb-2">פרטי התיקון:</h4>
                          {item.correction.description && (
                            <p className="text-sm"><span className="font-medium">תיאור:</span> {item.correction.description}</p>
                          )}
                          {item.correction.performedBy && (
                            <p className="text-sm"><span className="font-medium">בוצע ע״י:</span> {item.correction.performedBy}</p>
                          )}
                          {item.correction.date && (
                            <p className="text-sm"><span className="font-medium">תאריך:</span> {new Date(item.correction.date).toLocaleDateString('he-IL')}</p>
                          )}
                          {item.correction.inspectorNotes && (
                            <p className="text-sm"><span className="font-medium">הערות מפקח:</span> {item.correction.inspectorNotes}</p>
                          )}
                          {item.correction.inspectorName && (
                            <p className="text-sm"><span className="font-medium">מפקח:</span> {item.correction.inspectorName}</p>
                          )}
                          {item.correction.attachments && item.correction.attachments.length > 0 && (
                            <div className="flex gap-2 mt-2">
                              {item.correction.attachments.map((att: string, idx: number) => (
                                <img key={idx} src={att} alt={`צרופה ${idx + 1}`} className="w-16 h-16 object-cover rounded-lg border" />
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {item.status === 'not_ok' && (
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() => openCorrectionModal(item.id)}
                            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm"
                          >
                            סמן כתוקן
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
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

      {/* Non-Conformance Modal - טופס אי-התאמה */}
      {nonConformanceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-red-600 text-white p-4 rounded-t-xl">
              <h3 className="text-xl font-bold">טופס אי-התאמה</h3>
            </div>
            <div className="p-6 space-y-5">
              {/* תיאור אי-ההתאמה */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">תיאור אי-ההתאמה:</label>
                <textarea
                  value={nonConformanceForm.description}
                  onChange={(e) => setNonConformanceForm({ ...nonConformanceForm, description: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                  rows={3}
                  placeholder="תאר את אי-ההתאמה שנמצאה..."
                />
              </div>

              {/* הדרישה שלא מולאה */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">הדרישה שלא מולאה:</label>
                <p className="text-xs text-gray-500 mb-1">תכנית / מפרט / תקן / נוהל / הוראת יצרן</p>
                <input
                  type="text"
                  value={nonConformanceForm.requirement}
                  onChange={(e) => setNonConformanceForm({ ...nonConformanceForm, requirement: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                  placeholder="לדוגמה: ת״י 466, מפרט 08..."
                />
              </div>

              {/* מספר תכנית / סעיף */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">מספר תכנית / סעיף מפרט / תקן:</label>
                <input
                  type="text"
                  value={nonConformanceForm.documentNumber}
                  onChange={(e) => setNonConformanceForm({ ...nonConformanceForm, documentNumber: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                  placeholder="מספר סעיף או תכנית..."
                />
              </div>

              {/* תיעוד מצורף */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">תיעוד מצורף:</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {nonConformanceForm.attachments.map((att, idx) => (
                    <div key={idx} className="relative">
                      <img src={att} alt={`צרופה ${idx + 1}`} className="w-16 h-16 object-cover rounded-lg border" />
                      <button
                        onClick={() => setNonConformanceForm({
                          ...nonConformanceForm,
                          attachments: nonConformanceForm.attachments.filter((_, i) => i !== idx)
                        })}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <label className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-red-500 hover:bg-red-50">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setNonConformanceForm({
                              ...nonConformanceForm,
                              attachments: [...nonConformanceForm.attachments, event.target?.result as string]
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <span className="text-2xl text-gray-400">+</span>
                  </label>
                </div>
              </div>

              {/* סיווג אי-ההתאמה - רמת חומרה */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">סיווג אי-ההתאמה - רמת חומרה:</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="severity"
                      checked={nonConformanceForm.severity === 'minor'}
                      onChange={() => setNonConformanceForm({ ...nonConformanceForm, severity: 'minor' })}
                      className="w-4 h-4 text-yellow-500"
                    />
                    <span className="text-sm">קלה</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="severity"
                      checked={nonConformanceForm.severity === 'significant'}
                      onChange={() => setNonConformanceForm({ ...nonConformanceForm, severity: 'significant' })}
                      className="w-4 h-4 text-orange-500"
                    />
                    <span className="text-sm">משמעותית</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="severity"
                      checked={nonConformanceForm.severity === 'critical'}
                      onChange={() => setNonConformanceForm({ ...nonConformanceForm, severity: 'critical' })}
                      className="w-4 h-4 text-red-500"
                    />
                    <span className="text-sm">חמורה / קריטית</span>
                  </label>
                </div>
              </div>

              {/* טיפול נדרש */}
              <div className="border-t pt-4">
                <h4 className="font-bold text-gray-800 mb-3">טיפול נדרש</h4>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">פעולה מתקנת מוצעת:</label>
                    <textarea
                      value={nonConformanceForm.correctiveAction}
                      onChange={(e) => setNonConformanceForm({ ...nonConformanceForm, correctiveAction: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                      rows={2}
                      placeholder="תאר את הפעולה המתקנת הנדרשת..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">אחראי לביצוע התיקון:</label>
                      <input
                        type="text"
                        value={nonConformanceForm.responsiblePerson}
                        onChange={(e) => setNonConformanceForm({ ...nonConformanceForm, responsiblePerson: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                        placeholder="שם האחראי..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">מועד נדרש להשלמת התיקון:</label>
                      <input
                        type="date"
                        value={nonConformanceForm.dueDate}
                        onChange={(e) => setNonConformanceForm({ ...nonConformanceForm, dueDate: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">חתימת אחראי:</label>
                    {nonConformanceForm.signature ? (
                      <div className="relative inline-block">
                        <img src={nonConformanceForm.signature} alt="חתימה" className="h-16 border rounded-lg p-2" />
                        <button
                          onClick={() => setNonConformanceForm({ ...nonConformanceForm, signature: null })}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <canvas
                        id="ncSignatureCanvas"
                        width={300}
                        height={100}
                        className="border border-gray-300 rounded-lg bg-white cursor-crosshair"
                        onMouseDown={(e) => {
                          const canvas = e.currentTarget;
                          const ctx = canvas.getContext('2d');
                          if (!ctx) return;
                          const rect = canvas.getBoundingClientRect();
                          ctx.beginPath();
                          ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
                          canvas.dataset.drawing = 'true';
                        }}
                        onMouseMove={(e) => {
                          const canvas = e.currentTarget;
                          if (canvas.dataset.drawing !== 'true') return;
                          const ctx = canvas.getContext('2d');
                          if (!ctx) return;
                          const rect = canvas.getBoundingClientRect();
                          ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
                          ctx.stroke();
                        }}
                        onMouseUp={(e) => {
                          const canvas = e.currentTarget;
                          canvas.dataset.drawing = 'false';
                          setNonConformanceForm({ ...nonConformanceForm, signature: canvas.toDataURL() });
                        }}
                        onMouseLeave={(e) => {
                          const canvas = e.currentTarget;
                          if (canvas.dataset.drawing === 'true') {
                            canvas.dataset.drawing = 'false';
                            setNonConformanceForm({ ...nonConformanceForm, signature: canvas.toDataURL() });
                          }
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 justify-end p-4 border-t bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setNonConformanceModal(null)}
                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={handleSaveNonConformance}
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                שמור אי-התאמה
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Correction Modal - טופס תיקון */}
      {correctionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-violet-600 text-white p-4 rounded-t-xl">
              <h3 className="text-xl font-bold">טופס תיקון</h3>
            </div>
            <div className="p-6 space-y-5">
              {/* תיאור התיקון */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">תיאור התיקון שבוצע:</label>
                <textarea
                  value={correctionForm.description}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, description: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                  rows={3}
                  placeholder="תאר את התיקון שבוצע..."
                />
              </div>

              {/* תאריך ומבצע */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">תאריך ביצוע:</label>
                  <input
                    type="date"
                    value={correctionForm.date}
                    onChange={(e) => setCorrectionForm({ ...correctionForm, date: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">בוצע על ידי:</label>
                  <input
                    type="text"
                    value={correctionForm.performedBy}
                    onChange={(e) => setCorrectionForm({ ...correctionForm, performedBy: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                    placeholder="שם המבצע..."
                  />
                </div>
              </div>

              {/* תיעוד מצורף */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">תיעוד מצורף:</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {correctionForm.attachments.map((att, idx) => (
                    <div key={idx} className="relative">
                      <img src={att} alt={`צרופה ${idx + 1}`} className="w-16 h-16 object-cover rounded-lg border" />
                      <button
                        onClick={() => setCorrectionForm({
                          ...correctionForm,
                          attachments: correctionForm.attachments.filter((_, i) => i !== idx)
                        })}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <label className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-violet-500 hover:bg-violet-50">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setCorrectionForm({
                              ...correctionForm,
                              attachments: [...correctionForm.attachments, event.target?.result as string]
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <span className="text-2xl text-gray-400">+</span>
                  </label>
                </div>
              </div>

              {/* אישור מפקח */}
              <div className="border-t pt-4">
                <h4 className="font-bold text-gray-800 mb-3">אישור מפקח</h4>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">הערות מפקח:</label>
                    <textarea
                      value={correctionForm.inspectorNotes}
                      onChange={(e) => setCorrectionForm({ ...correctionForm, inspectorNotes: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                      rows={2}
                      placeholder="הערות המפקח..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">שם המפקח:</label>
                    <input
                      type="text"
                      value={correctionForm.inspectorName}
                      onChange={(e) => setCorrectionForm({ ...correctionForm, inspectorName: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                      placeholder="שם המפקח..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">חתימת מפקח:</label>
                    {correctionForm.inspectorSignature ? (
                      <div className="relative inline-block">
                        <img src={correctionForm.inspectorSignature} alt="חתימה" className="h-16 border rounded-lg p-2" />
                        <button
                          onClick={() => setCorrectionForm({ ...correctionForm, inspectorSignature: null })}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <canvas
                        id="corrSignatureCanvas"
                        width={300}
                        height={100}
                        className="border border-gray-300 rounded-lg bg-white cursor-crosshair"
                        onMouseDown={(e) => {
                          const canvas = e.currentTarget;
                          const ctx = canvas.getContext('2d');
                          if (!ctx) return;
                          const rect = canvas.getBoundingClientRect();
                          ctx.beginPath();
                          ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
                          canvas.dataset.drawing = 'true';
                        }}
                        onMouseMove={(e) => {
                          const canvas = e.currentTarget;
                          if (canvas.dataset.drawing !== 'true') return;
                          const ctx = canvas.getContext('2d');
                          if (!ctx) return;
                          const rect = canvas.getBoundingClientRect();
                          ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
                          ctx.stroke();
                        }}
                        onMouseUp={(e) => {
                          const canvas = e.currentTarget;
                          canvas.dataset.drawing = 'false';
                          setCorrectionForm({ ...correctionForm, inspectorSignature: canvas.toDataURL() });
                        }}
                        onMouseLeave={(e) => {
                          const canvas = e.currentTarget;
                          if (canvas.dataset.drawing === 'true') {
                            canvas.dataset.drawing = 'false';
                            setCorrectionForm({ ...correctionForm, inspectorSignature: canvas.toDataURL() });
                          }
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 justify-end p-4 border-t bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setCorrectionModal(null)}
                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={handleSaveCorrection}
                className="px-5 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
              >
                שמור תיקון
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
