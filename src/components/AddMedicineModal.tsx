import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { Medicine } from '@/data/mockData';

interface AddMedicineModalProps {
  onClose: () => void;
  medicine?: Medicine;
}

export default function AddMedicineModal({ onClose, medicine }: AddMedicineModalProps) {
  const { addMedicine, updateMedicine } = useApp();
  const [name, setName] = useState(medicine?.name ?? '');
  const [dosage, setDosage] = useState(medicine?.dosage ?? '');
  const [times, setTimes] = useState(medicine?.times.join(', ') ?? '08:00');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dosage.trim()) return;
    const schedule = times.split(',').map((time) => time.trim()).filter(Boolean);
    if (schedule.length === 0) {
      setError('Add at least one dose time.');
      return;
    }
    try {
      const values = { name: name.trim(), dosage: dosage.trim(), times: schedule };
      if (medicine) await updateMedicine(medicine.id, values);
      else await addMedicine(values);
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save this medicine.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-dark/60 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-md p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-lg text-neutral-800">{medicine ? 'Edit Medicine' : 'Add Medicine'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Medicine Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Metformin"
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Dosage</label>
            <input
              type="text"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder="e.g. 500mg"
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Dose times</label>
            <input
              type="text"
              value={times}
              onChange={(e) => setTimes(e.target.value)}
              placeholder="08:00, 20:00"
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
            />
          </div>
          {error && <p role="alert" className="text-sm text-danger-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-outline px-4 py-2.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary px-4 py-2.5"
            >
              {medicine ? 'Save Changes' : 'Add Medicine'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
