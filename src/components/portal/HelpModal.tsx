import React from 'react';
import { X } from 'lucide-react';
import DoubtSolver from '../DoubtSolver';
import { useEduPortal } from '../../context/EduPortalContext';
import { buildSessionContextFromPrediction } from '../../utils/sessionContext';

interface HelpModalProps {
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  const { selectedStudentId, getRecord, records } = useEduPortal();
  const sessionContext = (() => {
    if (selectedStudentId) {
      const r = getRecord(selectedStudentId);
      if (r) return buildSessionContextFromPrediction(r.prediction);
    }
    if (records[0]) return buildSessionContextFromPrediction(records[0].prediction);
    return undefined;
  })();

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-slate-950 border border-white/10 shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-950 z-10">
          <span className="text-sm font-semibold text-white">Doubt solver</span>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-slate-400"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 pb-8">
          <DoubtSolver sessionContext={sessionContext} />
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
