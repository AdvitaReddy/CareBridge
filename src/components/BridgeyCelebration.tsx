import { useEffect, useRef, useState } from 'react';
import { Sparkles, Star, X } from 'lucide-react';
import Bridgey from '@/components/Bridgey';
import { useApp } from '@/context/AppContext';

type CelebrationEvent = 'medicine-taken' | 'medicines-complete' | 'appointment-added' | 'caregiver-added' | 'task-completed' | 'sos-resolved';
type CelebrationCopy = { title: string; message: string; button: string };

const copy: Record<CelebrationEvent, CelebrationCopy[]> = {
  'medicine-taken': [
    { title: 'Nice work!', message: 'That medicine is taken and checked off your care plan.', button: 'Got it' },
    { title: 'Right on track!', message: 'One more dose handled. Your consistency matters.', button: 'Nice!' },
    { title: 'Dose complete!', message: 'Bridgey saw that caring win. Keep going at your own pace.', button: 'Continue' },
    { title: 'Well done!', message: 'That is one less thing to worry about today.', button: 'Got it' },
  ],
  'medicines-complete': [
    { title: 'A wonderful win!', message: 'All medicines are taken for today. You are doing a great job staying on track.', button: 'Nice!' },
    { title: 'All done today!', message: 'Your medicine plan is complete. Time to feel proud of that.', button: 'Celebrate' },
    { title: 'Care goal reached!', message: 'Every dose is accounted for today. That is fantastic teamwork.', button: 'Continue' },
    { title: 'You did it!', message: 'The whole day is checked off. Bridgey is cheering for you!', button: 'Nice!' },
  ],
  'appointment-added': [
    { title: 'Appointment added!', message: 'It is safely on the shared timeline so everyone can stay in the loop.', button: 'Continue' },
    { title: 'Calendar sorted!', message: 'The care circle can now see when and where support is needed.', button: 'Got it' },
    { title: 'One less thing to remember!', message: 'That visit is saved and ready for the next step.', button: 'Nice!' },
    { title: 'All set!', message: 'Bridgey added the appointment to the care plan.', button: 'Continue' },
  ],
  'caregiver-added': [
    { title: 'Care circle growing!', message: 'A new caregiver is now part of the care team.', button: 'Continue' },
    { title: 'More support, together!', message: 'Your care circle just got stronger and more connected.', button: 'Nice!' },
    { title: 'Teamwork unlocked!', message: 'The new caregiver is ready to help keep care moving smoothly.', button: 'Got it' },
    { title: 'Welcome to the circle!', message: 'Another trusted person is now in the loop.', button: 'Continue' },
  ],
  'task-completed': [
    { title: 'Task complete!', message: 'That is one more caring thing taken care of. Great work!', button: 'Nice!' },
    { title: 'Checked off!', message: 'Your thoughtful work is making someone’s day easier.', button: 'Got it' },
    { title: 'Beautiful follow-through!', message: 'One more task done and the care plan is moving forward.', button: 'Continue' },
    { title: 'You made progress!', message: 'Small caring actions add up to a big difference.', button: 'Nice!' },
  ],
  'sos-resolved': [
    { title: 'Everything is okay', message: 'The SOS has been resolved. Thank you for looking after one another.', button: 'Nice!' },
    { title: 'A calm moment again', message: 'The care circle responded and things are back under control.', button: 'Continue' },
    { title: 'Safe and supported', message: 'That alert is resolved. Everyone can take a breath now.', button: 'Got it' },
    { title: 'Glad you are okay', message: 'Bridgey is relieved to see the care team together again.', button: 'Nice!' },
  ],
};

export default function BridgeyCelebration() {
  const { bridgeyEvent } = useApp();
  const [activeEvent, setActiveEvent] = useState<CelebrationEvent | null>(null);
  const [activeCopy, setActiveCopy] = useState<CelebrationCopy | null>(null);
  const lastEvent = useRef<number | null>(null);
  const variantIndexes = useRef<Partial<Record<CelebrationEvent, number>>>({});

  useEffect(() => {
    if (!bridgeyEvent || lastEvent.current === bridgeyEvent.id) return;
    lastEvent.current = bridgeyEvent.id;
    if (bridgeyEvent.type === 'sos-triggered') {
      setActiveEvent(null);
      setActiveCopy(null);
      return;
    }
    if (bridgeyEvent.type === 'medicine-taken' || bridgeyEvent.type === 'medicines-complete' || bridgeyEvent.type === 'appointment-added' || bridgeyEvent.type === 'caregiver-added' || bridgeyEvent.type === 'task-completed' || bridgeyEvent.type === 'sos-resolved') {
      setActiveEvent(bridgeyEvent.type);
      const variants = copy[bridgeyEvent.type];
      const nextIndex = ((variantIndexes.current[bridgeyEvent.type] ?? -1) + 1) % variants.length;
      variantIndexes.current[bridgeyEvent.type] = nextIndex;
      setActiveCopy(variants[nextIndex]);
    }
  }, [bridgeyEvent]);

  if (!activeEvent || !activeCopy) return null;

  return (
    <div className="bridgey-celebration" role="dialog" aria-modal="true" aria-label={activeCopy.title}>
      <div className="bridgey-celebration__card">
        <button type="button" className="bridgey-celebration__close" onClick={() => { setActiveEvent(null); setActiveCopy(null); }} aria-label="Close celebration">
          <X className="w-5 h-5" />
        </button>
        <div className="bridgey-celebration__sparkles" aria-hidden="true">
          <Sparkles /><Star /><Sparkles />
        </div>
        <Bridgey expression="excited" size="lg" floating={false} interactive={false} showTips={false} />
        <h2>{activeCopy.title}</h2>
        <p>{activeCopy.message}</p>
        <button type="button" className="btn-primary" onClick={() => { setActiveEvent(null); setActiveCopy(null); }}>{activeCopy.button}</button>
      </div>
    </div>
  );
}
