import { useEffect, useRef, useState } from 'react';
import bridgeySvg from '@/assets/bridgey.svg?raw';
import { useApp } from '@/context/AppContext';

export type BridgeyExpression = 'happy' | 'excited' | 'concerned' | 'relieved' | 'sleepy';
export type BridgeySize = 'sm' | 'md' | 'lg';

interface BridgeyProps {
  expression?: BridgeyExpression;
  size?: BridgeySize;
  floating?: boolean;
  interactive?: boolean;
  showTips?: boolean;
  className?: string;
}

export default function Bridgey({
  expression: requestedExpression,
  size = 'md',
  className = '',
}: BridgeyProps) {
  const { bridgeyEvent, activeSOS } = useApp();
  const [isHeartPulsing, setIsHeartPulsing] = useState(false);
  const lastEventKey = useRef<string | null>(
    bridgeyEvent ? `${bridgeyEvent.type}:${bridgeyEvent.id}` : null
  );

  useEffect(() => {
    if (!bridgeyEvent) return;
    const eventKey = `${bridgeyEvent.type}:${bridgeyEvent.id}`;
    if (eventKey === lastEventKey.current) return;
    lastEventKey.current = eventKey;
    if (bridgeyEvent.type === 'medicine-taken' || bridgeyEvent.type === 'medicines-complete' || bridgeyEvent.type === 'sos-resolved') {
      setIsHeartPulsing(true);
      const timer = window.setTimeout(() => setIsHeartPulsing(false), 1000);
      return () => window.clearTimeout(timer);
    }
  }, [bridgeyEvent]);

  const expression = requestedExpression ?? (
    activeSOS ? 'concerned' : isHeartPulsing ? 'excited' : 'happy'
  );
  const mascotClass = [
    'bridgey-inline',
    `bridgey-size-${size}`,
    `bridgey-expression-${expression}`,
    isHeartPulsing ? 'bridgey-inline--heart-pulse' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={mascotClass} aria-label={`Bridgey in ${expression} expression`}>
      <span className="bridgey-svg" dangerouslySetInnerHTML={{ __html: bridgeySvg }} />
    </div>
  );
}
