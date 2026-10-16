import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { Medicine } from '@/data/mockData';
import useFormFeedback from '@/hooks/useFormFeedback';
import FormFeedbackMessage from '@/components/FormFeedbackMessage';

interface AddMedicineModalProps {
  onClose: () => void;
  medicine?: Medicine;
}

export default function AddMedicineModal({ onClose, medicine }: AddMedicineModalProps) {
  const { addMedicine, updateMedicine } = useApp();
  const [name, setName] = useState(medicine?.name ?? '');
  const [dosage, setDosage] = useState(medicine?.dosage ?? '');
  const [times, setTimes] = useState(medicine?.times.join(', ') ?? '08:00');
  const [savedValues, setSavedValues] = useState({
    name: medicine?.name ?? '',
    dosage: medicine?.dosage ?? '',
    times: medicine?.times.join(', ') ?? '08:00',
  });
  const [fieldsClearedAfterSave, setFieldsClearedAfterSave] = useState(false);
  const { isSaving, success, error, clear, run } = useFormFeedback();
  const unchanged = Boolean(medicine) && (
    fieldsClearedAfterSave
    || (name === savedValues.name && dosage === savedValues.dosage && times === savedValues.times)
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dosage.trim() || (medicine && unchanged)) return;
    const schedule = times.split(',').map((time) => time.trim()).filter(Boolean);
    if (schedule.length === 0) {
      clear();
      await run(() => { throw new Error('Add at least one dose time.'); });
      return;
    }
    const values = { name: name.trim(), dosage: dosage.trim(), times: schedule };
    const saved = await run(async () => {
      if (medicine) await updateMedicine(medicine.id, values);
      else await addMedicine(values);
    }, medicine ? 'Saved' : 'Added');
    if (saved && !medicine) {
      setName('');
      setDosage('');
      setTimes('');
    } else if (saved) {
      const normalizedTimes = schedule.join(', ');
      setSavedValues({ name: values.name, dosage: values.dosage, times: normalizedTimes });
      setName('');
      setDosage('');
      setTimes('');
      setFieldsClearedAfterSave(true);
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
              onChange={(e) => { clear(); setFieldsClearedAfterSave(false); setName(e.target.value); }}
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
              onChange={(e) => { clear(); setFieldsClearedAfterSave(false); setDosage(e.target.value); }}
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
              onChange={(e) => { clear(); setFieldsClearedAfterSave(false); setTimes(e.target.value); }}
              placeholder="08:00, 20:00"
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-outline px-4 py-2.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || unchanged}
              className="flex-1 btn-primary px-4 py-2.5 disabled:opacity-60"
            >
              {isSaving ? 'Saving...' : medicine ? 'Save Changes' : 'Add Medicine'}
            </button>
            <FormFeedbackMessage success={success} error={error} noChanges={unchanged} />
          </div>
        </form>
      </div>
    </div>
  );
}
