import { useState } from 'react';
import { CheckSquare, Clock, Play, Square } from 'lucide-react';
import { useApp, type CareTask } from '@/context/AppContext';
import { formatDateTime } from '@/data/mockData';
import useFormFeedback from '@/hooks/useFormFeedback';
import FormFeedbackMessage from '@/components/FormFeedbackMessage';

function localDateKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

function AssignedTaskCard({ task }: { task: CareTask }) {
  const { visitNotes, updateTaskStatus, addVisitNote } = useApp();
  const [note, setNote] = useState('');
  const statusFeedback = useFormFeedback();
  const noteFeedback = useFormFeedback();
  const taskNotes = visitNotes.filter((visitNote) => visitNote.task_id === task.id);

  const changeStatus = async (status: 'in_progress' | 'completed') => {
    await statusFeedback.run(() => updateTaskStatus(task.id, status), status === 'completed' ? 'Task completed' : 'Task started');
  };

  const saveNote = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const saved = await noteFeedback.run(() => addVisitNote(task.id, note), 'Visit note saved');
    if (saved) setNote('');
  };

  return (
    <article className="card p-4">
      <div className="flex items-start gap-3">
        <span className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          task.status === 'completed' ? 'bg-success-100 text-success-600' : 'bg-primary-100 text-primary-600'
        }`}>
          {task.status === 'completed' ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="font-semibold text-sm text-neutral-800">{task.title}</h3>
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
          {task.description && <p className="text-sm text-neutral-500 mt-1">{task.description}</p>}
          <div className="flex items-center gap-1.5 mt-2 text-xs text-neutral-500">
            <Clock className="w-3.5 h-3.5" />
            {task.due_at ? `Due ${formatDateTime(task.due_at)}` : 'No due time'}
          </div>

          {task.status !== 'completed' && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {task.status === 'pending' ? (
                <button
                  type="button"
                  onClick={() => void changeStatus('in_progress')}
                  disabled={statusFeedback.isSaving}
                  className="px-3 py-2 rounded-lg bg-primary-500 text-white text-xs font-semibold hover:bg-primary-600 disabled:opacity-60 inline-flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" /> Start
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void changeStatus('completed')}
                  disabled={statusFeedback.isSaving}
                  className="px-3 py-2 rounded-lg bg-success-600 text-white text-xs font-semibold hover:bg-success-700 disabled:opacity-60"
                >
                  Complete
                </button>
              )}
              <FormFeedbackMessage success={statusFeedback.success} error={statusFeedback.error} />
            </div>
          )}

          {task.status === 'completed' && (
            <div className="mt-4 border-t border-neutral-100 pt-4">
              <h4 className="font-semibold text-sm text-neutral-700 mb-2">Visit notes</h4>
              {taskNotes.length > 0 && (
                <div className="space-y-2 mb-3">
                  {taskNotes.map((visitNote) => (
                    <div key={visitNote.id} className="rounded-xl bg-neutral-50 p-3">
                      <p className="text-sm text-neutral-700 whitespace-pre-wrap">{visitNote.note}</p>
                      <p className="text-xs text-neutral-400 mt-1">{formatDateTime(visitNote.created_at)}</p>
                    </div>
                  ))}
                </div>
              )}
              <form onSubmit={(event) => void saveNote(event)} className="space-y-2">
                <label className="block text-xs font-medium text-neutral-600">
                  Add visit note <span className="text-danger-500">*</span>
                  <textarea
                    required
                    value={note}
                    onChange={(event) => { noteFeedback.clear(); setNote(event.target.value); }}
                    rows={3}
                    maxLength={2000}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm"
                    placeholder="Record observations from this visit"
                  />
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <button type="submit" disabled={noteFeedback.isSaving || !note.trim()} className="btn-primary disabled:opacity-60">
                    {noteFeedback.isSaving ? 'Saving...' : 'Save'}
                  </button>
                  <FormFeedbackMessage success={noteFeedback.success} error={noteFeedback.error} />
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default function AssignedCareTasks({ todayOnly = false }: { todayOnly?: boolean }) {
  const { profile, tasks, taskError } = useApp();
  const assignedTasks = tasks
    .filter((task) => task.assigned_to === profile?.id)
    .filter((task) => {
      if (!todayOnly) return true;
      if (!task.due_at) return false;
      const dueDate = localDateKey(new Date(task.due_at));
      const today = localDateKey(new Date());
      return dueDate === today || (dueDate < today && task.status !== 'completed');
    });

  return (
    <div className="space-y-3">
      {taskError && <p role="alert" className="text-sm text-danger-600">Tasks are unavailable: {taskError}</p>}
      {assignedTasks.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-sm text-neutral-500">{todayOnly ? 'No tasks due today.' : 'No tasks have been assigned to you.'}</p>
        </div>
      ) : assignedTasks.map((task) => <AssignedTaskCard key={task.id} task={task} />)}
    </div>
  );
}
