import { useState } from 'react';
import { ClipboardList, Plus } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { formatDateTime } from '@/data/mockData';
import useFormFeedback from '@/hooks/useFormFeedback';
import FormFeedbackMessage from '@/components/FormFeedbackMessage';

export default function CareTaskManager() {
  const { careCircle, tasks, taskError, createTask } = useApp();
  const caregivers = careCircle.filter((member) => member.type === 'caregiver');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueAt, setDueAt] = useState('');
  const feedback = useFormFeedback();

  const submitTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const saved = await feedback.run(() => createTask({
      title: title.trim(),
      description: description.trim(),
      assigned_to: assignedTo,
      due_at: dueAt ? new Date(dueAt).toISOString() : null,
    }), 'Task assigned');
    if (saved) {
      setTitle('');
      setDescription('');
      setAssignedTo('');
      setDueAt('');
    }
  };

  return (
    <section className="space-y-6 animate-fade-in">
      <div className="card p-5">
        <h2 className="font-display font-bold text-lg text-neutral-800 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-primary-500" />
          Assign a caregiver task
        </h2>
        {caregivers.length === 0 ? (
          <p className="text-sm text-neutral-500">Invite a caregiver to your care circle before assigning a task.</p>
        ) : (
          <form className="grid grid-cols-1 sm:grid-cols-2 gap-3" onSubmit={(event) => void submitTask(event)}>
            <label className="text-sm font-medium text-neutral-700 sm:col-span-2">
              Task title
              <input
                required
                value={title}
                onChange={(event) => { feedback.clear(); setTitle(event.target.value); }}
                maxLength={160}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm"
                placeholder="e.g. Help with the evening walk"
              />
            </label>
            <label className="text-sm font-medium text-neutral-700 sm:col-span-2">
              Description <span className="font-normal text-neutral-400">(optional)</span>
              <textarea
                value={description}
                onChange={(event) => { feedback.clear(); setDescription(event.target.value); }}
                rows={2}
                maxLength={1000}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm"
                placeholder="Add details for the caregiver"
              />
            </label>
            <label className="text-sm font-medium text-neutral-700">
              Caregiver
              <select
                required
                value={assignedTo}
                onChange={(event) => { feedback.clear(); setAssignedTo(event.target.value); }}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm bg-white"
              >
                <option value="">Choose a caregiver</option>
                {caregivers.map((caregiver) => (
                  <option key={caregiver.id} value={caregiver.id}>{caregiver.name}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-neutral-700">
              Due time <span className="font-normal text-neutral-400">(optional)</span>
              <input
                type="datetime-local"
                value={dueAt}
                onChange={(event) => { feedback.clear(); setDueAt(event.target.value); }}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm"
              />
            </label>
            <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
              <button type="submit" disabled={feedback.isSaving || !title.trim() || !assignedTo} className="btn-primary disabled:opacity-60">
                {feedback.isSaving ? 'Saving...' : 'Assign task'}
              </button>
              <FormFeedbackMessage success={feedback.success} error={feedback.error} />
            </div>
          </form>
        )}
      </div>

      <div>
        <h2 className="font-display font-bold text-lg text-neutral-800 mb-3">Care circle tasks</h2>
        {taskError && <p role="alert" className="mb-3 text-sm text-danger-600">Tasks are unavailable: {taskError}</p>}
        {tasks.length === 0 ? (
          <div className="card p-6 text-center">
            <ClipboardList className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm text-neutral-500">No tasks assigned yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const caregiver = careCircle.find((member) => member.id === task.assigned_to);
              return (
                <article key={task.id} className="card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-sm text-neutral-800">{task.title}</h3>
                      {task.description && <p className="text-sm text-neutral-500 mt-1">{task.description}</p>}
                      <p className="text-xs text-neutral-500 mt-2">Assigned to {caregiver?.name ?? 'Caregiver'}</p>
                      <p className="text-xs text-neutral-400 mt-1">
                        {task.due_at ? `Due ${formatDateTime(task.due_at)}` : 'No due time'}
                      </p>
                    </div>
                    <span className={`badge ${
                      task.status === 'completed'
                        ? 'bg-success-100 text-success-700'
                        : task.status === 'in_progress'
                          ? 'bg-warning-100 text-warning-700'
                          : 'bg-neutral-100 text-neutral-600'
                    }`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
