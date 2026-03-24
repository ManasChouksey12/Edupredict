import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import type { StudentRecord } from '../../types/portal';
import { useEduPortal } from '../../context/EduPortalContext';
import type { StudentData } from '../../types';

interface TeacherStudentFormProps {
  record: StudentRecord;
  onBack: () => void;
}

const TeacherStudentForm: React.FC<TeacherStudentFormProps> = ({ record, onBack }) => {
  const { updateRecord, addImprovement, removeImprovement, getRecord } = useEduPortal();
  const live = getRecord(record.id) ?? record;
  const d = live.data;

  const [name, setName] = useState(d.name);
  const [rollNumber, setRollNumber] = useState(live.rollNumber);
  const [program, setProgram] = useState(live.program);
  const [attendance, setAttendance] = useState(d.attendanceRate);
  const [term1, setTerm1] = useState(d.termAssessment1);
  const [term2, setTerm2] = useState(d.termAssessment2);
  const [labMarks, setLabMarks] = useState(d.labMarks);
  const [labTotal, setLabTotal] = useState(d.labTotal);
  const [teacherRemarkNum, setTeacherRemarkNum] = useState(d.teacherRemark);
  const [remarkCaption, setRemarkCaption] = useState(d.remarkCaption || '');
  const [previousSGPA, setPreviousSGPA] = useState(d.previousSGPA?.toString() || '');
  const [narrative, setNarrative] = useState(record.teacherNarrative);
  const [nAssignments, setNAssignments] = useState(Math.min(5, Math.max(3, d.assignments.length || 3)));
  const [assignments, setAssignments] = useState<number[]>(() => {
    const a = [...d.assignments];
    while (a.length < 5) a.push(8);
    return a.slice(0, 5);
  });
  const [newImp, setNewImp] = useState('');

  const handleSave = () => {
    const asg = assignments.slice(0, nAssignments);
    const sum = asg.reduce((s, x) => s + x, 0);
    const assignmentAverage = asg.length ? (sum / (asg.length * 10)) * 100 : 0;
    const nextData: StudentData = {
      ...d,
      name,
      attendanceRate: attendance,
      assignments: asg,
      assignmentAverage,
      termAssessment1: term1,
      termAssessment2: term2,
      labMarks,
      labTotal,
      teacherRemark: teacherRemarkNum,
      remarkCaption: remarkCaption || undefined,
      previousSGPA: previousSGPA ? parseFloat(previousSGPA) : undefined,
    };
    updateRecord(live.id, {
      data: nextData,
      rollNumber,
      program,
      teacherNarrative: narrative,
    });
    onBack();
  };

  return (
    <div className="p-6 sm:p-10 max-w-4xl">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to roster
      </button>

      <h1 className="text-2xl font-bold text-slate-900 mb-2">Edit student</h1>
      <p className="text-slate-500 text-sm mb-8">
        Changes save to this browser only. Numeric fields feed the same prediction model as before.
      </p>

      <div className="space-y-8 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Full name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Roll / ID</label>
            <input
              value={rollNumber}
              onChange={e => setRollNumber(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Program</label>
            <input
              value={program}
              onChange={e => setProgram(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Attendance %
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={attendance}
              onChange={e => setAttendance(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              # Assignments
            </label>
            <select
              value={nAssignments}
              onChange={e => setNAssignments(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
            </select>
          </div>
          {Array.from({ length: nAssignments }, (_, i) => (
            <div key={i}>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Assignment {i + 1} /10
              </label>
              <input
                type="number"
                min={0}
                max={10}
                step={0.5}
                value={assignments[i]}
                onChange={e => {
                  const next = [...assignments];
                  next[i] = Number(e.target.value);
                  setAssignments(next);
                }}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Term test 1 /20
            </label>
            <input
              type="number"
              min={0}
              max={20}
              value={term1}
              onChange={e => setTerm1(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Term test 2 /20
            </label>
            <input
              type="number"
              min={0}
              max={20}
              value={term2}
              onChange={e => setTerm2(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Lab marks</label>
            <input
              type="number"
              min={0}
              value={labMarks}
              onChange={e => setLabMarks(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Lab total</label>
            <select
              value={labTotal}
              onChange={e => setLabTotal(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value={20}>20</option>
              <option value={30}>30</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Teacher remark /10
            </label>
            <input
              type="number"
              min={0}
              max={10}
              step={0.5}
              value={teacherRemarkNum}
              onChange={e => setTeacherRemarkNum(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Previous SGPA (optional)
            </label>
            <input
              type="number"
              min={0}
              max={10}
              step={0.1}
              value={previousSGPA}
              onChange={e => setPreviousSGPA(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Short caption (CSV / summary)
            </label>
            <input
              value={remarkCaption}
              onChange={e => setRemarkCaption(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
            Teacher narrative (student-visible)
          </label>
          <textarea
            value={narrative}
            onChange={e => setNarrative(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm leading-relaxed"
          />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Improvement actions</h3>
          <ul className="space-y-2 mb-4">
            {live.improvementActions.map(a => (
              <li
                key={a.id}
                className="flex items-start gap-2 text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100"
              >
                <span className="flex-1">{a.text}</span>
                <button
                  type="button"
                  onClick={() => removeImprovement(live.id, a.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                  aria-label="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input
              value={newImp}
              onChange={e => setNewImp(e.target.value)}
              placeholder="Add an action item…"
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => {
                if (newImp.trim()) {
                  addImprovement(live.id, newImp.trim());
                  setNewImp('');
                }
              }}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
          >
            <Save className="w-4 h-4" />
            Save & close
          </button>
          <button type="button" onClick={onBack} className="px-6 py-2.5 text-sm text-slate-600 hover:text-slate-900">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherStudentForm;
