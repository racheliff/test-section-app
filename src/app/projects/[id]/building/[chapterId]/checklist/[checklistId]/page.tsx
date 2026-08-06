'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

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
  projectChapter?: {
    project: { id: string; code: string; name: string };
    chapter: { id: string; code: string; name: string };
  };
}

interface ItemStatus {
  status: string;
  date: string;
  approver: string;
  notes: string;
}

interface Deficiency {
  id: string;
  linkedItemNum: string;
  description: string;
  location: string;
  action: string;
  responsible: string;
  dueDate: string;
  status: 'open' | 'in_progress' | 'closed';
  closeDate: string;
  approver: string;
  notes: string;
}

interface LabTest {
  id: string;
  testNumber: number;
  testType: string;
  layer: string;
  location: string;
  date: string;
  reportNumber: string;
  result: string;
  notes: string;
}

interface SignatureData {
  name: string;
  role: string;
  dataURL: string;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'טרם נבדק', activeClass: 'bg-amber-100 border-amber-400 text-amber-800' },
  { value: 'ok', label: 'תקין', activeClass: 'bg-emerald-500 border-emerald-600 text-white' },
  { value: 'not_ok', label: 'לא תקין', activeClass: 'bg-red-500 border-red-600 text-white' },
  { value: 'na', label: 'לא רלוונטי', activeClass: 'bg-slate-400 border-slate-500 text-white' },
  { value: 'corrected', label: 'תוקן ונבדק מחדש', activeClass: 'bg-violet-500 border-violet-600 text-white' },
];

const STAGE_LABELS: Record<string, string> = {
  'בקרה מקדימה': 'בקרה מקדימה',
  'בקרה שוטפת': 'בקרה שוטפת',
  'אישור לפני מסירה': 'אישור לפני מסירה',
};

export default function ChecklistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [itemStatuses, setItemStatuses] = useState<Record<string, ItemStatus>>({});
  const [deficiencies, setDeficiencies] = useState<Deficiency[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [signatures, setSignatures] = useState<Record<string, SignatureData>>({
    contractor: { name: '', role: '', dataURL: '' },
    qc: { name: '', role: '', dataURL: '' },
    supervision: { name: '', role: '', dataURL: '' },
  });
  const [stage1Approval, setStage1Approval] = useState('');
  const [controlResult, setControlResult] = useState('');
  const [summaryNotes, setSummaryNotes] = useState('');
  const [activeSignature, setActiveSignature] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [openingLocked, setOpeningLocked] = useState(false);

  // Report details
  const [reportNumber, setReportNumber] = useState('');
  const [structureArea, setStructureArea] = useState('');
  const [workLocation, setWorkLocation] = useState('');
  const [workType, setWorkType] = useState('');
  const [qcName, setQcName] = useState('');
  const [workManagerName, setWorkManagerName] = useState('');
  const [planNumber, setPlanNumber] = useState('');
  const [detailNumber, setDetailNumber] = useState('');
  const [sectionsFromPlan, setSectionsFromPlan] = useState('');
  const [soilType, setSoilType] = useState('');
  const [fillMaterialType, setFillMaterialType] = useState('');
  const [performingLab, setPerformingLab] = useState('');

  useEffect(() => {
    fetchChecklist();
  }, [params.checklistId]);

  const fetchChecklist = async () => {
    try {
      const res = await fetch(`/api/checklists/${params.checklistId}`);
      if (res.ok) {
        const data = await res.json();
        setChecklist(data);
        setStructureArea(data.building || '');
        setPlanNumber(data.planNumber || '');

        const statuses: Record<string, ItemStatus> = {};
        data.items.forEach((item: ChecklistItem) => {
          statuses[item.id] = {
            status: item.isCompleted ? 'ok' : 'pending',
            date: item.date ? new Date(item.date).toISOString().split('T')[0] : '',
            approver: item.name || '',
            notes: item.notes || '',
          };
        });
        setItemStatuses(statuses);
      }
    } catch (error) {
      console.error('Error fetching checklist:', error);
    } finally {
      setLoading(false);
    }
  };

  const todayISO = () => new Date().toISOString().split('T')[0];

  const updateItemStatus = (itemId: string, field: string, value: string) => {
    setItemStatuses(prev => {
      const current = prev[itemId] || { status: 'pending', date: '', approver: '', notes: '' };
      const updated = { ...current, [field]: value };

      if (field === 'status' && (value === 'ok' || value === 'not_ok' || value === 'corrected')) {
        if (!updated.date) updated.date = todayISO();
      }

      return { ...prev, [itemId]: updated };
    });
  };

  const groupItemsByStage = (items: ChecklistItem[]) => {
    const groups: Record<string, ChecklistItem[]> = {};
    const stageOrder = ['בקרה מקדימה', 'בקרה שוטפת', 'אישור לפני מסירה'];

    stageOrder.forEach(stage => {
      const stageItems = items.filter(item => item.workStage === stage);
      if (stageItems.length > 0) {
        groups[stage] = stageItems;
      }
    });

    items.forEach(item => {
      if (!stageOrder.includes(item.workStage)) {
        if (!groups[item.workStage]) groups[item.workStage] = [];
        groups[item.workStage].push(item);
      }
    });

    return groups;
  };

  const getStats = () => {
    const statuses = Object.values(itemStatuses);
    const total = statuses.length;
    const ok = statuses.filter(s => s.status === 'ok').length;
    const not_ok = statuses.filter(s => s.status === 'not_ok').length;
    const pending = statuses.filter(s => s.status === 'pending').length;
    const corrected = statuses.filter(s => s.status === 'corrected').length;
    const na = statuses.filter(s => s.status === 'na').length;
    const checked = ok + not_ok + na + corrected;
    const openDef = deficiencies.filter(d => d.status !== 'closed').length;
    const closedDef = deficiencies.filter(d => d.status === 'closed').length;
    const completion = total > 0 ? Math.round((checked / total) * 100) : 0;

    return { total, ok, not_ok, pending, corrected, na, checked, openDef, closedDef, completion };
  };

  const addDeficiency = () => {
    const num = deficiencies.length + 1;
    setDeficiencies(prev => [...prev, {
      id: `def_${Date.now()}`,
      linkedItemNum: '',
      description: '',
      location: '',
      action: '',
      responsible: '',
      dueDate: '',
      status: 'open',
      closeDate: '',
      approver: '',
      notes: '',
    }]);
  };

  const updateDeficiency = (id: string, field: string, value: string) => {
    setDeficiencies(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const removeDeficiency = (id: string) => {
    if (!confirm('למחוק את רשומת הליקוי?')) return;
    setDeficiencies(prev => prev.filter(d => d.id !== id));
  };

  const addLabTest = () => {
    const num = labTests.length + 1;
    setLabTests(prev => [...prev, {
      id: `lab_${Date.now()}`,
      testNumber: num,
      testType: '',
      layer: '',
      location: '',
      date: '',
      reportNumber: '',
      result: '',
      notes: '',
    }]);
  };

  const updateLabTest = (id: string, field: string, value: string) => {
    setLabTests(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const removeLabTest = (id: string) => {
    if (!confirm('למחוק את רשומת הבדיקה?')) return;
    setLabTests(prev => prev.filter(t => t.id !== id));
  };

  // Signature canvas
  const openSignatureModal = (key: string) => setActiveSignature(key);
  const closeSignatureModal = () => { setActiveSignature(null); setIsDrawing(false); };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#0d2b4e';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    if ('touches' in e) e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    if (!activeSignature || !canvasRef.current) return;
    const dataURL = canvasRef.current.toDataURL('image/png');
    setSignatures(prev => ({ ...prev, [activeSignature]: { ...prev[activeSignature], dataURL } }));
    closeSignatureModal();
  };

  const handleSave = async () => {
    for (const [itemId, data] of Object.entries(itemStatuses)) {
      try {
        await fetch(`/api/checklist-items/${itemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.approver,
            date: data.date || null,
            notes: data.notes,
            isCompleted: data.status === 'ok' || data.status === 'corrected',
          }),
        });
      } catch (error) {
        console.error('Error saving item:', error);
      }
    }
    alert('הדוח נשמר בהצלחה. מספר דוח: ' + (reportNumber || 'יוקצה אוטומטית'));
  };

  const handlePrint = () => window.print();

  const handleConfirmOpening = () => {
    if (!checklist?.projectChapter?.project.name || !checklist?.mainContractor) {
      alert('יש למלא שם פרויקט ושם קבלן.');
      return;
    }
    if (!reportNumber) {
      setReportNumber(String(Date.now()).slice(-6));
    }
    setOpeningLocked(true);
  };

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-xl text-slate-600">טוען...</div>
      </div>
    );
  }

  if (!checklist) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">רשימת תיוג לא נמצאה</h1>
          <Link href="/" className="text-blue-600 hover:underline">חזור לדף הבית</Link>
        </div>
      </div>
    );
  }

  const stats = getStats();
  const groupedItems = groupItemsByStage(checklist.items);
  const stageNames = Object.keys(groupedItems);

  return (
    <div dir="rtl" className="min-h-screen pb-24 print:pb-0" style={{ background: '#f3f5f8', fontFamily: 'Segoe UI, Arial Hebrew, Noto Sans Hebrew, Arial, sans-serif' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 text-white p-4 shadow-md print:relative print:shadow-none" style={{ background: 'linear-gradient(90deg, #0d2b4e, #081b33)' }}>
        <h1 className="text-lg font-bold m-0">רשימת תיוג – {checklist.projectChapter?.chapter.name} פרק {checklist.projectChapter?.chapter.code}</h1>
        <div className="text-xs opacity-85 mt-1">בקרת איכות באתר | דוח מס׳ <span>{reportNumber || '-'}</span></div>

        {/* Summary Bar */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <span className="text-lg font-bold block">{stats.checked}/{stats.total}</span>
            <span className="text-xs opacity-85">נבדקו</span>
          </div>
          <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <span className="text-lg font-bold block" style={{ color: '#7be09a' }}>{stats.ok}</span>
            <span className="text-xs opacity-85">תקין</span>
          </div>
          <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <span className="text-lg font-bold block" style={{ color: '#ff9b9b' }}>{stats.not_ok}</span>
            <span className="text-xs opacity-85">לא תקין</span>
          </div>
          <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <span className="text-lg font-bold block" style={{ color: '#ffe08a' }}>{stats.pending}</span>
            <span className="text-xs opacity-85">טרם נבדק</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-3 space-y-4">
        {/* Alerts */}
        {stats.pending > 0 && (
          <div className="rounded-lg p-3 text-sm" style={{ background: '#fff6df', color: '#7a5b00', border: '1px solid #c99a12' }}>
            ⚠ קיימים סעיפים שטרם נבדקו.
          </div>
        )}
        {(stats.not_ok > 0 || stats.openDef > 0) && controlResult === 'approved' && (
          <div className="rounded-lg p-3 text-sm" style={{ background: '#fde9e9', color: '#8a1e1e', border: '1px solid #d23c3c' }}>
            ⚠ קיימים סעיפים "לא תקין" או ליקויים פתוחים, אך תוצאת הבקרה סומנה "מאושר".
          </div>
        )}

        {/* פתיחת דוח Card */}
        <section className="bg-white rounded-xl p-4 shadow-md border border-slate-200">
          <h2 className="text-blue-700 font-semibold text-base mb-4 pb-2 border-b-2 border-blue-100 flex items-center gap-2">
            פתיחת דוח
            {openingLocked && <span className="text-xs font-bold rounded-md px-2 py-0.5" style={{ background: '#fff6df', color: '#7a5b00' }}>🔒 נעול</span>}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">מספר דוח</label>
              <input
                type="text"
                value={reportNumber}
                onChange={(e) => setReportNumber(e.target.value)}
                disabled={openingLocked}
                placeholder="נוצר אוטומטית"
                className="border rounded-lg p-2 text-sm disabled:bg-slate-100 disabled:text-slate-500"
                style={{ borderColor: '#d7dee6' }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">שם פרויקט</label>
              <input
                type="text"
                value={checklist.projectChapter?.project.name || ''}
                disabled
                className="border rounded-lg p-2 text-sm bg-slate-100 text-slate-500"
                style={{ borderColor: '#d7dee6' }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">שם קבלן</label>
              <input
                type="text"
                value={checklist.mainContractor || ''}
                disabled={openingLocked}
                className="border rounded-lg p-2 text-sm disabled:bg-slate-100"
                style={{ borderColor: '#d7dee6' }}
              />
            </div>
          </div>
          {!openingLocked && (
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              <button
                onClick={handleConfirmOpening}
                className="text-white font-bold rounded-lg px-4 py-2 text-sm"
                style={{ background: '#2e9e4f' }}
              >
                ✓ אישור פרטי דוח
              </button>
              <span className="text-xs text-slate-500">לאחר אישור, מספר הדוח / שם הפרויקט / שם הקבלן ננעלים.</span>
            </div>
          )}
          {openingLocked && (
            <div className="mt-3 flex items-center gap-3">
              <span className="rounded-lg px-4 py-2 text-sm font-bold" style={{ background: '#e3f7e8', color: '#2e9e4f' }}>
                🔒 פרטי הדוח אושרו ונעולים
              </span>
            </div>
          )}
        </section>

        {/* פרטי הדוח Card */}
        <section className="bg-white rounded-xl p-4 shadow-md border border-slate-200">
          <h2 className="text-blue-700 font-semibold text-base mb-4 pb-2 border-b-2 border-blue-100">פרטי הדוח</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">מבנה/אזור</label>
              <input type="text" value={structureArea} onChange={(e) => setStructureArea(e.target.value)} className="border rounded-lg p-2 text-sm" style={{ borderColor: '#d7dee6' }} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">מיקום העבודה</label>
              <input type="text" value={workLocation} onChange={(e) => setWorkLocation(e.target.value)} className="border rounded-lg p-2 text-sm" style={{ borderColor: '#d7dee6' }} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">סוג העבודה</label>
              <select value={workType} onChange={(e) => setWorkType(e.target.value)} className="border rounded-lg p-2 text-sm" style={{ borderColor: '#d7dee6' }}>
                <option value="">בחר סוג עבודה</option>
                <option value="חפירה">חפירה</option>
                <option value="מילוי">מילוי</option>
                <option value="הכנת קרקע">הכנת קרקע</option>
                <option value="הידוק">הידוק</option>
                <option value="עבודות פיתוח">עבודות פיתוח</option>
                <option value="אחר">אחר</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">תאריך פתיחת רת"ק</label>
              <input type="date" value={checklist.openDate ? new Date(checklist.openDate).toISOString().split('T')[0] : ''} className="border rounded-lg p-2 text-sm" style={{ borderColor: '#d7dee6' }} readOnly />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">שם בקר איכות</label>
              <input type="text" value={qcName} onChange={(e) => setQcName(e.target.value)} className="border rounded-lg p-2 text-sm" style={{ borderColor: '#d7dee6' }} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">שם מנהל עבודה</label>
              <input type="text" value={workManagerName} onChange={(e) => setWorkManagerName(e.target.value)} className="border rounded-lg p-2 text-sm" style={{ borderColor: '#d7dee6' }} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">מספר תוכניות</label>
              <input type="text" value={planNumber} onChange={(e) => setPlanNumber(e.target.value)} className="border rounded-lg p-2 text-sm" style={{ borderColor: '#d7dee6' }} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">מספר פרט</label>
              <input type="text" value={detailNumber} onChange={(e) => setDetailNumber(e.target.value)} className="border rounded-lg p-2 text-sm" style={{ borderColor: '#d7dee6' }} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">חתכים מהתוכניות</label>
              <input type="text" value={sectionsFromPlan} onChange={(e) => setSectionsFromPlan(e.target.value)} className="border rounded-lg p-2 text-sm" style={{ borderColor: '#d7dee6' }} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">סוג הקרקע</label>
              <input type="text" value={soilType} onChange={(e) => setSoilType(e.target.value)} className="border rounded-lg p-2 text-sm" style={{ borderColor: '#d7dee6' }} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">סוג חומר המילוי</label>
              <input type="text" value={fillMaterialType} onChange={(e) => setFillMaterialType(e.target.value)} className="border rounded-lg p-2 text-sm" style={{ borderColor: '#d7dee6' }} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">מעבדה מבצעת</label>
              <input type="text" value={performingLab} onChange={(e) => setPerformingLab(e.target.value)} className="border rounded-lg p-2 text-sm" style={{ borderColor: '#d7dee6' }} />
            </div>
          </div>
        </section>

        {/* Checklist Stages */}
        {stageNames.map((stageName, stageIndex) => (
          <section key={stageName} className="bg-white rounded-xl p-4 shadow-md border border-slate-200">
            <h2 className="text-blue-700 font-semibold text-base mb-4 pb-2 border-b-2 border-blue-100 flex items-center gap-2 flex-wrap">
              <span className="text-white w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ background: '#0d2b4e' }}>
                {stageIndex + 1}
              </span>
              פרק {stageIndex + 1} – {stageName}
            </h2>

            <div className="space-y-3">
              {groupedItems[stageName].map((item, itemIndex) => {
                const itemData = itemStatuses[item.id] || { status: 'pending', date: '', approver: '', notes: '' };
                const isNotOk = itemData.status === 'not_ok';
                const itemNum = `${stageIndex + 1}.${itemIndex + 1}`;

                return (
                  <div
                    key={item.id}
                    className="rounded-xl p-3 border"
                    style={{
                      background: isNotOk ? '#fde9e9' : '#fafbfc',
                      borderColor: isNotOk ? '#d23c3c' : '#d7dee6',
                    }}
                  >
                    {/* Item Header */}
                    <div className="flex gap-2 items-start mb-2">
                      <div className="text-white min-w-[36px] h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: '#0d2b4e' }}>
                        {itemNum}
                      </div>
                      <div className="text-sm leading-relaxed pt-0.5">{item.description}</div>
                    </div>

                    {/* Status Buttons */}
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-1.5 mb-2">
                      {STATUS_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => updateItemStatus(item.id, 'status', opt.value)}
                          className={`border-2 rounded-lg py-2 px-1 text-xs font-bold transition-all text-center ${
                            itemData.status === opt.value ? opt.activeClass : 'bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                          style={{ borderColor: itemData.status === opt.value ? undefined : '#d7dee6' }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {/* Meta Row */}
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-500">תאריך</label>
                        <input
                          type="date"
                          value={itemData.date}
                          onChange={(e) => updateItemStatus(item.id, 'date', e.target.value)}
                          className="border rounded-lg p-1.5 text-sm"
                          style={{ borderColor: '#d7dee6' }}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-500">שם מאשר</label>
                        <input
                          type="text"
                          value={itemData.approver}
                          onChange={(e) => updateItemStatus(item.id, 'approver', e.target.value)}
                          className="border rounded-lg p-1.5 text-sm"
                          style={{ borderColor: '#d7dee6' }}
                        />
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <span className="text-xs text-slate-500 block mb-1">
                        הערות {isNotOk && <span className="text-red-600 font-bold">(חובה עבור סטטוס "לא תקין")</span>}
                      </span>
                      <textarea
                        value={itemData.notes}
                        onChange={(e) => updateItemStatus(item.id, 'notes', e.target.value)}
                        placeholder="הערות (לא רלוונטי)"
                        className="w-full border rounded-lg p-2 text-sm resize-y min-h-[36px]"
                        style={{ borderColor: '#d7dee6' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stage 1 Approval */}
            {stageIndex === 0 && (
              <>
                <div className="font-bold text-sm mt-4 mb-2" style={{ color: '#0d2b4e' }}>אישור תחילת עבודה</div>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: 'approved', label: 'מאושר' },
                    { value: 'conditional', label: 'מאושר בתנאים' },
                    { value: 'not_approved', label: 'לא מאושר' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setStage1Approval(opt.value)}
                      className={`flex-1 min-w-[100px] border-2 rounded-lg py-2 px-2 text-sm font-bold ${
                        stage1Approval === opt.value ? 'text-white' : 'bg-white text-slate-700'
                      }`}
                      style={{
                        background: stage1Approval === opt.value ? '#1a5296' : undefined,
                        borderColor: stage1Approval === opt.value ? '#1a5296' : '#d7dee6',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Stage 2 - Deficiencies & Lab Tests */}
            {stageIndex === 1 && (
              <>
                <div className="font-bold text-sm mt-4 mb-2" style={{ color: '#0d2b4e' }}>ליקויים / פעולות מתקנות</div>
                {deficiencies.length === 0 ? (
                  <div className="text-slate-500 text-sm py-2">לא נרשמו ליקויים או פעולות מתקנות.</div>
                ) : (
                  <div className="space-y-3">
                    {deficiencies.map((def, idx) => (
                      <div key={def.id} className="border rounded-xl p-3 relative" style={{ borderColor: '#d7dee6', background: '#fafbfc' }}>
                        <button onClick={() => removeDeficiency(def.id)} className="absolute left-2 top-2 rounded-md px-2 py-1 text-xs font-bold" style={{ background: '#fde9e9', color: '#d23c3c' }}>✕ מחק</button>
                        <div className="inline-block text-white rounded-md px-2 py-0.5 text-xs font-bold mb-2" style={{ background: '#0d2b4e' }}>ליקוי מס׳ {idx + 1}</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <div className="col-span-2 md:col-span-4 flex flex-col gap-1">
                            <label className="text-xs text-slate-500">תיאור הליקוי</label>
                            <textarea value={def.description} onChange={(e) => updateDeficiency(def.id, 'description', e.target.value)} className="border rounded-lg p-2 text-sm" style={{ borderColor: '#d7dee6' }} />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-slate-500">מיקום</label>
                            <input type="text" value={def.location} onChange={(e) => updateDeficiency(def.id, 'location', e.target.value)} className="border rounded-lg p-2 text-sm" style={{ borderColor: '#d7dee6' }} />
                          </div>
                          <div className="col-span-2 md:col-span-4 flex flex-col gap-1">
                            <label className="text-xs text-slate-500">פעולה מתקנת</label>
                            <textarea value={def.action} onChange={(e) => updateDeficiency(def.id, 'action', e.target.value)} className="border rounded-lg p-2 text-sm" style={{ borderColor: '#d7dee6' }} />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-slate-500">אחראי</label>
                            <input type="text" value={def.responsible} onChange={(e) => updateDeficiency(def.id, 'responsible', e.target.value)} className="border rounded-lg p-2 text-sm" style={{ borderColor: '#d7dee6' }} />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-slate-500">תאריך יעד</label>
                            <input type="date" value={def.dueDate} onChange={(e) => updateDeficiency(def.id, 'dueDate', e.target.value)} className="border rounded-lg p-2 text-sm" style={{ borderColor: '#d7dee6' }} />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-slate-500">סטטוס</label>
                            <select value={def.status} onChange={(e) => updateDeficiency(def.id, 'status', e.target.value)} className="border rounded-lg p-2 text-sm" style={{ borderColor: '#d7dee6' }}>
                              <option value="open">פתוח</option>
                              <option value="in_progress">בטיפול</option>
                              <option value="closed">סגור</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-slate-500">תאריך סגירה</label>
                            <input type="date" value={def.closeDate} onChange={(e) => updateDeficiency(def.id, 'closeDate', e.target.value)} className="border rounded-lg p-2 text-sm" style={{ borderColor: '#d7dee6' }} />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-slate-500">שם מאשר</label>
                            <input type="text" value={def.approver} onChange={(e) => updateDeficiency(def.id, 'approver', e.target.value)} className="border rounded-lg p-2 text-sm" style={{ borderColor: '#d7dee6' }} />
                          </div>
                          <div className="col-span-2 md:col-span-4 flex flex-col gap-1">
                            <label className="text-xs text-slate-500">הערות</label>
                            <textarea value={def.notes} onChange={(e) => updateDeficiency(def.id, 'notes', e.target.value)} className="border rounded-lg p-2 text-sm" style={{ borderColor: '#d7dee6' }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={addDeficiency} className="mt-2 text-white font-bold rounded-lg px-4 py-2 text-sm" style={{ background: '#1a5296' }}>+ הוסף</button>

                <div className="font-bold text-sm mt-4 mb-2" style={{ color: '#0d2b4e' }}>בדיקות מעבדה</div>
                {labTests.length === 0 ? (
                  <div className="text-slate-500 text-sm py-2">לא נרשמו בדיקות מעבדה.</div>
                ) : (
                  <div className="space-y-3">
                    {labTests.map((test, idx) => (
                      <div key={test.id} className="border rounded-xl p-3 relative" style={{ borderColor: '#d7dee6', background: '#fafbfc' }}>
                        <button onClick={() => removeLabTest(test.id)} className="absolute left-2 top-2 rounded-md px-2 py-1 text-xs font-bold" style={{ background: '#fde9e9', color: '#d23c3c' }}>✕ מחק</button>
                        <div className="inline-block text-white rounded-md px-2 py-0.5 text-xs font-bold mb-2" style={{ background: '#0d2b4e' }}>בדיקה מס׳ {idx + 1}</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <div className="flex flex-col gap-1"><label className="text-xs text-slate-500">סוג בדיקה</label><input type="text" value={test.testType} onChange={(e) => updateLabTest(test.id, 'testType', e.target.value)} className="border rounded-lg p-2 text-sm" style={{ borderColor: '#d7dee6' }} /></div>
                          <div className="flex flex-col gap-1"><label className="text-xs text-slate-500">שכבה</label><input type="text" value={test.layer} onChange={(e) => updateLabTest(test.id, 'layer', e.target.value)} className="border rounded-lg p-2 text-sm" style={{ borderColor: '#d7dee6' }} /></div>
                          <div className="flex flex-col gap-1"><label className="text-xs text-slate-500">מיקום</label><input type="text" value={test.location} onChange={(e) => updateLabTest(test.id, 'location', e.target.value)} className="border rounded-lg p-2 text-sm" style={{ borderColor: '#d7dee6' }} /></div>
                          <div className="flex flex-col gap-1"><label className="text-xs text-slate-500">תאריך</label><input type="date" value={test.date} onChange={(e) => updateLabTest(test.id, 'date', e.target.value)} className="border rounded-lg p-2 text-sm" style={{ borderColor: '#d7dee6' }} /></div>
                          <div className="flex flex-col gap-1"><label className="text-xs text-slate-500">מספר דוח</label><input type="text" value={test.reportNumber} onChange={(e) => updateLabTest(test.id, 'reportNumber', e.target.value)} className="border rounded-lg p-2 text-sm" style={{ borderColor: '#d7dee6' }} /></div>
                          <div className="flex flex-col gap-1"><label className="text-xs text-slate-500">תוצאה</label><input type="text" value={test.result} onChange={(e) => updateLabTest(test.id, 'result', e.target.value)} className="border rounded-lg p-2 text-sm" style={{ borderColor: '#d7dee6' }} /></div>
                          <div className="col-span-2 flex flex-col gap-1"><label className="text-xs text-slate-500">הערה</label><textarea value={test.notes} onChange={(e) => updateLabTest(test.id, 'notes', e.target.value)} className="border rounded-lg p-2 text-sm" style={{ borderColor: '#d7dee6' }} /></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={addLabTest} className="mt-2 text-white font-bold rounded-lg px-4 py-2 text-sm" style={{ background: '#1a5296' }}>+ הוסף בדיקה</button>
              </>
            )}
          </section>
        ))}

        {/* תוצאת הבקרה */}
        <section className="bg-white rounded-xl p-4 shadow-md border border-slate-200">
          <h2 className="text-blue-700 font-semibold text-base mb-4 pb-2 border-b-2 border-blue-100">תוצאת הבקרה</h2>
          <div className="text-slate-500 text-sm mb-2">אחוז השלמה: {stats.completion}% · ליקויים פתוחים: {stats.openDef} · ליקויים שנסגרו: {stats.closedDef}</div>
          <div className="flex gap-2 flex-wrap mb-3">
            {[
              { value: 'approved', label: 'מאושר' },
              { value: 'conditional', label: 'מאושר בתנאים' },
              { value: 'not_approved', label: 'לא מאושר' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setControlResult(opt.value)}
                className={`flex-1 min-w-[100px] border-2 rounded-lg py-2 px-2 text-sm font-bold ${
                  controlResult === opt.value ? 'text-white' : 'bg-white text-slate-700'
                }`}
                style={{
                  background: controlResult === opt.value ? '#1a5296' : undefined,
                  borderColor: controlResult === opt.value ? '#1a5296' : '#d7dee6',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500">הערות מסכמות</label>
            <textarea value={summaryNotes} onChange={(e) => setSummaryNotes(e.target.value)} className="border rounded-lg p-2 text-sm resize-y min-h-[60px]" style={{ borderColor: '#d7dee6' }} />
          </div>
        </section>

        {/* חתימות */}
        <section className="bg-white rounded-xl p-4 shadow-md border border-slate-200">
          <h2 className="text-blue-700 font-semibold text-base mb-4 pb-2 border-b-2 border-blue-100">חתימות ואישורים</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { key: 'contractor', label: '1. קבלן' },
              { key: 'qc', label: '2. בקרת איכות' },
              { key: 'supervision', label: '3. פיקוח' },
            ].map(sig => (
              <div key={sig.key} className="border rounded-xl p-3" style={{ borderColor: '#d7dee6' }}>
                <h3 className="font-bold text-sm mb-2">{sig.label}</h3>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-500">שם</label>
                    <input type="text" value={signatures[sig.key].name} onChange={(e) => setSignatures(prev => ({ ...prev, [sig.key]: { ...prev[sig.key], name: e.target.value } }))} className="border rounded-lg p-1.5 text-sm" style={{ borderColor: '#d7dee6' }} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-500">תפקיד</label>
                    <input type="text" value={signatures[sig.key].role} onChange={(e) => setSignatures(prev => ({ ...prev, [sig.key]: { ...prev[sig.key], role: e.target.value } }))} className="border rounded-lg p-1.5 text-sm" style={{ borderColor: '#d7dee6' }} />
                  </div>
                </div>
                {signatures[sig.key].dataURL ? (
                  <div className="border border-dashed rounded-lg p-2 bg-white" style={{ borderColor: '#d7dee6' }}>
                    <img src={signatures[sig.key].dataURL} alt="חתימה" className="h-16 mx-auto object-contain" />
                    <button onClick={() => openSignatureModal(sig.key)} className="w-full mt-1 text-blue-600 text-xs hover:underline">שנה חתימה</button>
                  </div>
                ) : (
                  <button onClick={() => openSignatureModal(sig.key)} className="w-full py-3 border-2 border-dashed rounded-lg text-slate-500 text-sm hover:bg-slate-50" style={{ borderColor: '#d7dee6' }}>לחץ לחתימה</button>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-2 flex gap-1.5 overflow-x-auto z-50 shadow-lg print:hidden" style={{ borderColor: '#d7dee6' }}>
        <button onClick={handleSave} className="flex-1 text-white rounded-lg py-2.5 px-3 font-bold text-sm whitespace-nowrap" style={{ background: '#1a5296' }}>💾 שמור דוח</button>
        <button onClick={() => router.push(`/projects/${params.id}/building/${params.chapterId}`)} className="flex-1 text-white rounded-lg py-2.5 px-3 font-bold text-sm whitespace-nowrap" style={{ background: '#0d2b4e' }}>📋 דוח חדש</button>
        <button className="flex-1 text-white rounded-lg py-2.5 px-3 font-bold text-sm whitespace-nowrap" style={{ background: '#5a6b7d' }}>⧉ שכפל דוח</button>
        <button className="flex-1 text-white rounded-lg py-2.5 px-3 font-bold text-sm whitespace-nowrap" style={{ background: '#d23c3c' }}>🗑 נקה טופס</button>
        <button className="flex-1 text-white rounded-lg py-2.5 px-3 font-bold text-sm whitespace-nowrap" style={{ background: '#7a5b12' }}>📂 רשימת קודמים</button>
        <button onClick={handlePrint} className="flex-1 text-white rounded-lg py-2.5 px-3 font-bold text-sm whitespace-nowrap" style={{ background: '#2e9e4f' }}>🖨 הדפס / PDF</button>
      </div>

      {/* Signature Modal */}
      {activeSignature && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-2xl p-5 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4" style={{ color: '#0d2b4e' }}>חתימה</h3>
            <div className="border-2 border-dashed rounded-lg mb-4 touch-none" style={{ borderColor: '#d7dee6' }}>
              <canvas ref={canvasRef} width={350} height={100} className="w-full bg-white rounded-lg cursor-crosshair block"
                onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} />
            </div>
            <div className="flex gap-2 justify-end flex-wrap">
              <button onClick={clearSignature} className="bg-white border rounded-lg px-3 py-1.5 text-xs" style={{ borderColor: '#d7dee6' }}>נקה חתימה</button>
              <button onClick={closeSignatureModal} className="bg-white border rounded-lg px-3 py-1.5 text-xs" style={{ borderColor: '#d7dee6' }}>ביטול</button>
              <button onClick={saveSignature} className="text-white rounded-lg px-3 py-1.5 text-xs font-bold" style={{ background: '#1a5296' }}>שמור</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
