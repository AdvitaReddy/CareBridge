import { Pill, Check, Clock, AlertCircle } from 'lucide-react';
import type { Medicine } from '@/data/mockData';
import StatusBadge from './StatusBadge';

interface MedicineCardProps {
  medicine: Medicine;
  onMarkTaken?: (id: string) => void;
  onSimulateMissed?: (id: string) => void;
  large?: boolean;
  showSimulate?: boolean;
}

export default function MedicineCard({
  medicine,
  onMarkTaken,
  onSimulateMissed,
  large = false,
  showSimulate = false,
}: MedicineCardProps) {
  const isTaken = medicine.status === 'taken';
  const isMissed = medicine.status === 'missed';

  return (
    <div
      className={`card p-4 ${large ? 'sm:p-5' : ''} ${
        isTaken ? 'border-success-200 bg-success-50/50' : ''
      } ${isMissed ? 'border-danger-200 bg-danger-50/50' : ''} transition-all`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${
            isTaken
              ? 'bg-success-100 text-success-600'
              : isMissed
                ? 'bg-danger-100 text-danger-600'
                : 'bg-primary-100 text-primary-600'
          }`}
        >
          {isTaken ? (
            <Check className={large ? 'w-7 h-7' : 'w-5 h-5'} />
          ) : isMissed ? (
            <AlertCircle className={large ? 'w-7 h-7' : 'w-5 h-5'} />
          ) : (
            <Pill className={large ? 'w-7 h-7' : 'w-5 h-5'} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className={`font-display font-bold ${large ? 'text-xl' : 'text-base'} text-neutral-800`}>
              {medicine.name}
            </h3>
            <StatusBadge status={medicine.status} />
          </div>
          <p className={`text-neutral-500 ${large ? 'text-base mt-1' : 'text-sm mt-0.5'}`}>
            {medicine.dosage} · {medicine.frequency}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {medicine.times.map((t) => (
              <span
                key={t}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                  isTaken ? 'bg-success-100 text-success-700' : 'bg-neutral-100 text-neutral-600'
                }`}
              >
                <Clock className="w-3 h-3" />
                {t}
              </span>
            ))}
            {medicine.notes && (
              <span className="text-xs text-neutral-400 italic">{medicine.notes}</span>
            )}
          </div>
        </div>
      </div>
      {onMarkTaken && !isTaken && (
        <button
          onClick={() => onMarkTaken(medicine.id)}
          className={`mt-4 w-full ${large ? 'btn-elderly' : 'px-4 py-2.5 text-sm font-semibold rounded-xl'} bg-success-500 text-white hover:bg-success-600 transition-colors active:scale-95 flex items-center justify-center gap-2`}
        >
          <Check className={large ? 'w-6 h-6' : 'w-4 h-4'} />
          {large ? 'Mark as Taken' : 'Mark Taken'}
        </button>
      )}
      {showSimulate && !isTaken && !isMissed && onSimulateMissed && (
        <button
          onClick={() => onSimulateMissed(medicine.id)}
          className="mt-2 w-full px-4 py-2 text-xs font-medium rounded-xl bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition-colors"
        >
          [Demo] Simulate Missed Dose
        </button>
      )}
    </div>
  );
}
