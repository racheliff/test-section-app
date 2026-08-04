'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface SelectedFile {
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'uploaded' | 'error';
  filepath?: string;
}

interface ProjectChapter {
  id: string;
  project: { id: string; code: string; name: string };
  chapter: { id: string; code: string; name: string };
}

interface Professional {
  id: string;
  name: string;
  role: string;
  category: string;
}

const PARTICIPANT_ROLES = ['יועץ', 'פיקוח', 'קבלן', 'בקרת איכות', 'קבלן משנה'];

export default function NewTestSectionPage() {
  const params = useParams();
  const router = useRouter();
  const [projectChapter, setProjectChapter] = useState<ProjectChapter | null>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    sectionName: '',
    participants: PARTICIPANT_ROLES.map((role) => ({ role, name: '', company: '', phone: '' })),
    crewMembers: [{ name: '', role: '' }],
    locationDescription: '',
    structure: '',
    crossSections: '',
    descriptionNotes: '',
    executionSteps: '',
    equipment: [{ name: '', quantity: 1, notes: '' }],
    tests: [{ testType: '', requirement: '', result: '', certificateNumber: '', status: '' }],
    attachments: [] as { filename: string; filepath: string; filesize: number; mimetype: string }[],
    qualityControlApproval: false,
    qualityControlApproverName: '',
    qualityControlApprovalDate: '',
    supervisionApproval: false,
    supervisionApproverName: '',
    supervisionApprovalDate: '',
    status: 'passed' as 'passed' | 'failed' | 'pending',
    summaryNotes: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/project-chapters/${params.chapterId}`);
        if (res.ok) {
          const chapter = await res.json();
          setProjectChapter(chapter);

          // Fetch professionals from the project
          const profRes = await fetch(`/api/projects/${chapter.project.id}/professionals`);
          if (profRes.ok) {
            setProfessionals(await profRes.json());
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (params.chapterId) {
      fetchData();
    }
  }, [params.chapterId]);

  const totalSteps = 8;
  const stepNames = ['פרטי טופס', 'משתתפים', 'תיאור', 'שלבי ביצוע', 'ציוד', 'בדיקות', 'מסמכים', 'סיכום'];

  const goToStep = (step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
      window.scrollTo(0, 0);
    }
  };

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    } else {
      await submitForm();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const submitForm = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/project-chapters/${params.chapterId}/test-sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save');

      router.push(`/projects/${params.id}/building/${params.chapterId}/test-sections`);
    } catch (error) {
      console.error('Error saving form:', error);
      alert('שגיאה בשמירת הטופס. נסה שוב.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = <K extends keyof typeof formData>(field: K, value: (typeof formData)[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addCrewMember = () => {
    setFormData((prev) => ({ ...prev, crewMembers: [...prev.crewMembers, { name: '', role: '' }] }));
  };

  const removeCrewMember = (index: number) => {
    setFormData((prev) => ({ ...prev, crewMembers: prev.crewMembers.filter((_, i) => i !== index) }));
  };

  const updateCrewMember = (index: number, field: 'name' | 'role', value: string) => {
    setFormData((prev) => ({
      ...prev,
      crewMembers: prev.crewMembers.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    }));
  };

  const addEquipment = () => {
    setFormData((prev) => ({ ...prev, equipment: [...prev.equipment, { name: '', quantity: 1, notes: '' }] }));
  };

  const removeEquipment = (index: number) => {
    setFormData((prev) => ({ ...prev, equipment: prev.equipment.filter((_, i) => i !== index) }));
  };

  const updateEquipment = (index: number, field: 'name' | 'quantity' | 'notes', value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      equipment: prev.equipment.map((e, i) => (i === index ? { ...e, [field]: value } : e)),
    }));
  };

  const addTest = () => {
    setFormData((prev) => ({
      ...prev,
      tests: [...prev.tests, { testType: '', requirement: '', result: '', certificateNumber: '', status: '' }],
    }));
  };

  const removeTest = (index: number) => {
    setFormData((prev) => ({ ...prev, tests: prev.tests.filter((_, i) => i !== index) }));
  };

  const updateTest = (index: number, field: 'testType' | 'requirement' | 'result' | 'certificateNumber' | 'status', value: string) => {
    setFormData((prev) => ({
      ...prev,
      tests: prev.tests.map((t, i) => (i === index ? { ...t, [field]: value } : t)),
    }));
  };

  const updateParticipant = (index: number, field: 'name' | 'company' | 'phone', value: string) => {
    setFormData((prev) => ({
      ...prev,
      participants: prev.participants.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    }));
  };

  if (!projectChapter) {
    return (
      <div dir="rtl" className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">טוען...</div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-white shadow z-50 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="text-sm text-gray-500">
                {projectChapter.project.name} • פרק {projectChapter.chapter.code}
              </div>
              <h1 className="text-xl font-bold text-gray-800">קטע ניסוי חדש</h1>
            </div>
            <Link
              href={`/projects/${params.id}/building/${params.chapterId}/test-sections`}
              className="text-gray-500 hover:text-gray-700"
            >
              ביטול ←
            </Link>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-blue-600 transition-all duration-300 rounded-full"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>

          {/* Steps navigation */}
          <nav className="flex gap-2 overflow-x-auto pb-2">
            {stepNames.map((name, index) => {
              const stepNum = index + 1;
              const isActive = stepNum === currentStep;
              const isCompleted = stepNum < currentStep;

              return (
                <button
                  key={stepNum}
                  onClick={() => goToStep(stepNum)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : isCompleted
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : isCompleted
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {isCompleted ? '✓' : stepNum}
                  </span>
                  {name}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Step 1: Form Details */}
        {currentStep === 1 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">פרטי הטופס</h2>
            <p className="text-gray-500 mb-6">מידע בסיסי על קטע הניסוי</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">פרויקט</label>
                <div className="px-3 py-2.5 bg-gray-100 rounded-lg text-gray-700">
                  {projectChapter.project.name}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">פרק</label>
                <div className="px-3 py-2.5 bg-gray-100 rounded-lg text-gray-700">
                  {projectChapter.chapter.code} - {projectChapter.chapter.name}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="text-red-500">*</span> תאריך
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => updateFormData('date', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="text-red-500">*</span> שם קטע הניסוי
                </label>
                <input
                  type="text"
                  value={formData.sectionName}
                  onChange={(e) => updateFormData('sectionName', e.target.value)}
                  placeholder='לדוגמה: ק"מ 12.5 - שכבת בסיס'
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Participants */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">משתתפים</h2>
              <p className="text-gray-500 mb-6">אנשי הקשר לקטע הניסוי</p>

              <h3 className="font-medium text-gray-700 mb-4">בעלי תפקידים</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formData.participants.map((participant, index) => (
                  <div key={participant.role} className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-semibold text-blue-600 mb-3">{participant.role}</div>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="שם"
                        value={participant.name || ''}
                        onChange={(e) => updateParticipant(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="חברה"
                        value={participant.company || ''}
                        onChange={(e) => updateParticipant(index, 'company', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="tel"
                        placeholder="טלפון"
                        value={participant.phone || ''}
                        onChange={(e) => updateParticipant(index, 'phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-medium text-gray-700 mb-4">צוות ביצוע</h3>
              <div className="space-y-3">
                {formData.crewMembers.map((crew, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <input
                      type="text"
                      placeholder="שם עובד"
                      value={crew.name}
                      onChange={(e) => updateCrewMember(index, 'name', e.target.value)}
                      className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="תפקיד"
                      value={crew.role || ''}
                      onChange={(e) => updateCrewMember(index, 'role', e.target.value)}
                      className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => removeCrewMember(index)}
                      className="w-10 h-10 flex items-center justify-center bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={addCrewMember}
                className="w-full mt-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-blue-600 font-medium hover:bg-blue-50 transition-colors"
              >
                + הוסף עובד
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Description */}
        {currentStep === 3 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">תיאור קטע הניסוי</h2>
            <p className="text-gray-500 mb-6">פרטים טכניים ומיקום</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="text-red-500">*</span> תיאור ומיקום
                </label>
                <textarea
                  rows={4}
                  value={formData.locationDescription || ''}
                  onChange={(e) => updateFormData('locationDescription', e.target.value)}
                  placeholder="תאר את מיקום קטע הניסוי, גבולות, נקודות ציון..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">מבנה</label>
                <textarea
                  rows={3}
                  value={formData.structure || ''}
                  onChange={(e) => updateFormData('structure', e.target.value)}
                  placeholder="תאר את מבנה השכבות, חומרים, עוביים..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">חתכים</label>
                <textarea
                  rows={3}
                  value={formData.crossSections || ''}
                  onChange={(e) => updateFormData('crossSections', e.target.value)}
                  placeholder="פרט חתכים רלוונטיים..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">הערות</label>
                <textarea
                  rows={2}
                  value={formData.descriptionNotes || ''}
                  onChange={(e) => updateFormData('descriptionNotes', e.target.value)}
                  placeholder="הערות נוספות..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Execution Steps */}
        {currentStep === 4 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">שלבי ביצוע</h2>
            <p className="text-gray-500 mb-6">תיאור תהליך העבודה</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="text-red-500">*</span> שלבי הביצוע
              </label>
              <textarea
                rows={12}
                value={formData.executionSteps || ''}
                onChange={(e) => updateFormData('executionSteps', e.target.value)}
                placeholder={`1. הכנת השטח\n2. פריסת החומר\n3. הידוק\n4. בדיקות...`}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-400 mt-2">תאר את שלבי העבודה לפי הסדר</p>
            </div>
          </div>
        )}

        {/* Step 5: Equipment */}
        {currentStep === 5 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">ציוד</h2>
            <p className="text-gray-500 mb-6">ציוד ששימש בקטע הניסוי</p>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-right py-3 px-2 font-medium text-gray-600">ציוד</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-600 w-24">כמות</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-600">הערות</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.equipment.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 px-2">
                        <input
                          type="text"
                          placeholder="שם הציוד"
                          value={item.name}
                          onChange={(e) => updateEquipment(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateEquipment(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <input
                          type="text"
                          placeholder="הערות"
                          value={item.notes || ''}
                          onChange={(e) => updateEquipment(index, 'notes', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <button
                          onClick={() => removeEquipment(index)}
                          className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={addEquipment}
              className="w-full mt-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-blue-600 font-medium hover:bg-blue-50 transition-colors"
            >
              + הוסף ציוד
            </button>
          </div>
        )}

        {/* Step 6: Tests */}
        {currentStep === 6 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">בדיקות ותעודות</h2>
            <p className="text-gray-500 mb-6">תיעוד תוצאות הבדיקות</p>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-right py-3 px-2 font-medium text-gray-600">סוג הבדיקה</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-600">דרישה</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-600">תוצאה</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-600">מס&apos; תעודה</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-600">סטטוס</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.tests.map((test, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 px-2">
                        <select
                          value={test.testType}
                          onChange={(e) => updateTest(index, 'testType', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">בחר...</option>
                          <option value="density">צפיפות</option>
                          <option value="cbr">CBR</option>
                          <option value="proctor">פרוקטור</option>
                          <option value="gradation">גרנולומטריה</option>
                          <option value="other">אחר</option>
                        </select>
                      </td>
                      <td className="py-3 px-2">
                        <input
                          type="text"
                          placeholder="≥98%"
                          value={test.requirement || ''}
                          onChange={(e) => updateTest(index, 'requirement', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <input
                          type="text"
                          placeholder="99.2%"
                          value={test.result || ''}
                          onChange={(e) => updateTest(index, 'result', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <input
                          type="text"
                          placeholder="T-12345"
                          value={test.certificateNumber || ''}
                          onChange={(e) => updateTest(index, 'certificateNumber', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <select
                          value={test.status || ''}
                          onChange={(e) => updateTest(index, 'status', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">בחר...</option>
                          <option value="passed">עבר</option>
                          <option value="failed">נכשל</option>
                          <option value="pending">ממתין</option>
                        </select>
                      </td>
                      <td className="py-3 px-2">
                        <button
                          onClick={() => removeTest(index)}
                          className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={addTest}
              className="w-full mt-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-blue-600 font-medium hover:bg-blue-50 transition-colors"
            >
              + הוסף בדיקה
            </button>
          </div>
        )}

        {/* Step 7: Documents */}
        {currentStep === 7 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">מסמכים מצורפים</h2>
            <p className="text-gray-500 mb-6">העלה קבצים רלוונטיים</p>

            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
              onChange={async (e) => {
                const files = e.target.files;
                if (!files) return;

                for (const file of Array.from(files)) {
                  const tempFile: SelectedFile = {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    status: 'uploading',
                  };
                  setSelectedFiles((prev) => [...prev, tempFile]);

                  try {
                    const uploadData = new FormData();
                    uploadData.append('file', file);

                    const response = await fetch('/api/upload', {
                      method: 'POST',
                      body: uploadData,
                    });

                    if (!response.ok) throw new Error('Upload failed');

                    const result = await response.json();

                    setSelectedFiles((prev) =>
                      prev.map((f) =>
                        f.name === file.name && f.status === 'uploading'
                          ? { ...f, status: 'uploaded', filepath: result.filepath }
                          : f
                      )
                    );

                    setFormData((prev) => ({
                      ...prev,
                      attachments: [
                        ...prev.attachments,
                        {
                          filename: result.filename,
                          filepath: result.filepath,
                          filesize: result.filesize,
                          mimetype: result.mimetype,
                        },
                      ],
                    }));
                  } catch (error) {
                    console.error('Upload error:', error);
                    setSelectedFiles((prev) =>
                      prev.map((f) =>
                        f.name === file.name && f.status === 'uploading' ? { ...f, status: 'error' } : f
                      )
                    );
                  }
                }
                e.target.value = '';
              }}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-gray-600 font-medium">לחץ לבחירת קבצים או גרור לכאן</p>
              <p className="text-sm text-gray-400 mt-2">PDF, Word, Excel, תמונות</p>
            </div>

            {selectedFiles.length > 0 && (
              <div className="mt-6 space-y-3">
                <h4 className="font-medium text-gray-700">קבצים ({selectedFiles.length}):</h4>
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between rounded-lg p-4 ${
                      file.status === 'error' ? 'bg-red-50' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {file.status === 'uploading' ? '⏳' : file.status === 'error' ? '❌' : file.type.includes('pdf') ? '📄' : file.type.includes('image') ? '🖼️' : '📎'}
                      </span>
                      <div>
                        <div className="font-medium text-gray-800">{file.name}</div>
                        <div className="text-sm text-gray-500">
                          {(file.size / 1024).toFixed(1)} KB
                          {file.status === 'uploading' && ' • מעלה...'}
                          {file.status === 'uploaded' && ' • הועלה בהצלחה'}
                          {file.status === 'error' && ' • שגיאה בהעלאה'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
                        if (file.filepath) {
                          setFormData((prev) => ({
                            ...prev,
                            attachments: prev.attachments.filter((a) => a.filepath !== file.filepath),
                          }));
                        }
                      }}
                      className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 8: Summary */}
        {currentStep === 8 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">סיכום</h2>
              <p className="text-gray-500 mb-6">סטטוס סופי והערות</p>

              <h3 className="font-medium text-gray-700 mb-4">סטטוס קטע הניסוי</h3>
              <div className="flex gap-4 flex-wrap">
                {[
                  { value: 'passed', label: '✓ עבר', bgColor: 'bg-green-100', borderColor: 'border-green-500', textColor: 'text-green-700' },
                  { value: 'failed', label: '✗ נכשל', bgColor: 'bg-red-100', borderColor: 'border-red-500', textColor: 'text-red-700' },
                  { value: 'pending', label: '⏳ טרם הסתיים', bgColor: 'bg-yellow-100', borderColor: 'border-yellow-500', textColor: 'text-yellow-700' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center gap-3 px-5 py-3 border-2 rounded-xl cursor-pointer flex-1 min-w-[140px] transition-all ${
                      formData.status === option.value
                        ? `${option.bgColor} ${option.borderColor} ${option.textColor}`
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={option.value}
                      checked={formData.status === option.value}
                      onChange={(e) => updateFormData('status', e.target.value as 'passed' | 'failed' | 'pending')}
                      className="hidden"
                    />
                    <span className="font-medium">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-medium text-gray-700 mb-4">אישורים</h3>
              <div className="space-y-6">
                {/* Quality Control Approval */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-gray-700">אישור בקרת איכות</span>
                    {formData.qualityControlApproval && (
                      <span className="text-green-600 text-sm font-medium">✓ אושר</span>
                    )}
                  </div>
                  {!formData.qualityControlApproval ? (
                    <div className="flex gap-3">
                      <select
                        value={formData.qualityControlApproverName}
                        onChange={(e) => {
                          updateFormData('qualityControlApproverName', e.target.value);
                          if (e.target.value) {
                            updateFormData('qualityControlApproval', true);
                            updateFormData('qualityControlApprovalDate', new Date().toISOString().split('T')[0]);
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">בחר מאשר...</option>
                        {professionals.map((prof) => (
                          <option key={prof.id} value={prof.name}>
                            {prof.name} - {prof.role}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>מאשר: {formData.qualityControlApproverName}</span>
                      <span>תאריך: {formData.qualityControlApprovalDate}</span>
                      <button
                        type="button"
                        onClick={() => {
                          updateFormData('qualityControlApproval', false);
                          updateFormData('qualityControlApproverName', '');
                          updateFormData('qualityControlApprovalDate', '');
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        בטל אישור
                      </button>
                    </div>
                  )}
                </div>

                {/* Supervision Approval */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-gray-700">אישור פיקוח</span>
                    {formData.supervisionApproval && (
                      <span className="text-green-600 text-sm font-medium">✓ אושר</span>
                    )}
                  </div>
                  {!formData.supervisionApproval ? (
                    <div className="flex gap-3">
                      <select
                        value={formData.supervisionApproverName}
                        onChange={(e) => {
                          updateFormData('supervisionApproverName', e.target.value);
                          if (e.target.value) {
                            updateFormData('supervisionApproval', true);
                            updateFormData('supervisionApprovalDate', new Date().toISOString().split('T')[0]);
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">בחר מאשר...</option>
                        {professionals.map((prof) => (
                          <option key={prof.id} value={prof.name}>
                            {prof.name} - {prof.role}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>מאשר: {formData.supervisionApproverName}</span>
                      <span>תאריך: {formData.supervisionApprovalDate}</span>
                      <button
                        type="button"
                        onClick={() => {
                          updateFormData('supervisionApproval', false);
                          updateFormData('supervisionApproverName', '');
                          updateFormData('supervisionApprovalDate', '');
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        בטל אישור
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">הערות מסכמות</label>
              <textarea
                rows={5}
                value={formData.summaryNotes || ''}
                onChange={(e) => updateFormData('summaryNotes', e.target.value)}
                placeholder="סיכום הממצאים, המלצות להמשך..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 px-4 py-4 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="px-6 py-3 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            → הקודם
          </button>
          <span className="text-gray-500">
            שלב {currentStep} מתוך {totalSteps}
          </span>
          <button
            onClick={handleNext}
            disabled={isSubmitting}
            className={`px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 ${
              currentStep === totalSteps
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? 'שומר...' : currentStep === totalSteps ? 'שמור טופס ✓' : 'הבא ←'}
          </button>
        </div>
      </footer>
    </div>
  );
}
