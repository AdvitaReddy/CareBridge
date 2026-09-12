import { useEffect, useState, type ReactNode } from 'react';
import Bridgey, { type BridgeyExpression } from '@/components/Bridgey';
import { useApp } from '@/context/AppContext';

interface BridgeyHeroProps {
  eyebrow: string;
  message: string;
  expression?: BridgeyExpression;
  action?: ReactNode;
}

export default function BridgeyHero({ eyebrow, message, expression = 'happy', action }: BridgeyHeroProps) {
  const { bridgeyEvent } = useApp();
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [showPersonality, setShowPersonality] = useState(() => Math.random() < 0.2);

  useEffect(() => {
    setShowPersonality(Math.random() < 0.2);
  }, [message]);

  useEffect(() => {
    if (!bridgeyEvent) return;
    if (bridgeyEvent.type === 'sos-triggered') {
      setActionMessage(null);
      return;
    }
    const messages: Record<string, string> = {
      'medicine-taken': 'That dose is done. Great job staying on track! 💛',
      'medicines-complete': 'Everything is done for today. That is worth celebrating! 💛',
      'appointment-added': 'Got it, the appointment is safely on the timeline.',
      'caregiver-added': 'Your care circle just got stronger. Great teamwork! 💛',
      'sos-resolved': "So glad everything's okay now. 💛",
    };
    const nextMessage = messages[bridgeyEvent.type];
    if (!nextMessage) return;
    setActionMessage(nextMessage);
    const timer = window.setTimeout(() => setActionMessage(null), 4000);
    return () => window.clearTimeout(timer);
  }, [bridgeyEvent]);

  return (
    <section className="bridgey-hero" aria-label="Bridgey care update">
      <div className="bridgey-hero__mascot">
        <Bridgey expression={expression} size="lg" floating={false} interactive={false} showTips={false} />
      </div>
      <div className="bridgey-hero__bubble">
        <span className="bridgey-hero__eyebrow">{eyebrow}</span>
        <p>{actionMessage ?? (showPersonality ? 'Taking care of family takes a village — you’re doing great.' : message)}</p>
        {action}
      </div>
    </section>
  );
}
