interface IllustrationProps {
  className?: string;
}

export function ListeningIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      {/* Headphones */}
      <path d="M60 95 C60 65 75 45 100 45 C125 45 140 65 140 95" stroke="#378ADD" strokeWidth="6" strokeLinecap="round" fill="none" />
      <rect x="48" y="88" width="20" height="32" rx="8" fill="#378ADD" opacity="0.2" stroke="#378ADD" strokeWidth="2" />
      <rect x="132" y="88" width="20" height="32" rx="8" fill="#378ADD" opacity="0.2" stroke="#378ADD" strokeWidth="2" />
      {/* Audio waves */}
      <path d="M88 78 L88 68" stroke="#378ADD" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
      <path d="M96 78 L96 60" stroke="#378ADD" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
      <path d="M104 78 L104 55" stroke="#378ADD" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
      <path d="M112 78 L112 62" stroke="#378ADD" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
      {/* Decorative dots */}
      <circle cx="30" cy="50" r="3" fill="#378ADD" opacity="0.15" />
      <circle cx="170" cy="60" r="4" fill="#378ADD" opacity="0.12" />
      <circle cx="25" cy="120" r="2" fill="#378ADD" opacity="0.1" />
      <circle cx="175" cy="110" r="3" fill="#378ADD" opacity="0.1" />
    </svg>
  );
}

export function ReadingIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      {/* Open book */}
      <path d="M100 120 L100 45" stroke="#D85A30" strokeWidth="2" opacity="0.3" />
      <path d="M100 45 C85 48 55 42 45 50 L45 120 C55 112 85 118 100 120" fill="#D85A30" opacity="0.08" stroke="#D85A30" strokeWidth="2" />
      <path d="M100 45 C115 48 145 42 155 50 L155 120 C145 112 115 118 100 120" fill="#D85A30" opacity="0.08" stroke="#D85A30" strokeWidth="2" />
      {/* Page lines - left */}
      <line x1="58" y1="65" x2="90" y2="68" stroke="#D85A30" strokeWidth="1.5" opacity="0.25" strokeLinecap="round" />
      <line x1="58" y1="78" x2="90" y2="80" stroke="#D85A30" strokeWidth="1.5" opacity="0.2" strokeLinecap="round" />
      <line x1="58" y1="91" x2="85" y2="93" stroke="#D85A30" strokeWidth="1.5" opacity="0.15" strokeLinecap="round" />
      {/* Page lines - right */}
      <line x1="110" y1="68" x2="142" y2="65" stroke="#D85A30" strokeWidth="1.5" opacity="0.25" strokeLinecap="round" />
      <line x1="110" y1="80" x2="142" y2="78" stroke="#D85A30" strokeWidth="1.5" opacity="0.2" strokeLinecap="round" />
      <line x1="115" y1="93" x2="142" y2="91" stroke="#D85A30" strokeWidth="1.5" opacity="0.15" strokeLinecap="round" />
      {/* Floating pages */}
      <rect x="30" y="35" width="24" height="30" rx="3" fill="#D85A30" opacity="0.06" stroke="#D85A30" strokeWidth="1.5" transform="rotate(-12 42 50)" />
      <rect x="150" y="32" width="22" height="28" rx="3" fill="#D85A30" opacity="0.06" stroke="#D85A30" strokeWidth="1.5" transform="rotate(8 161 46)" />
      {/* Decorative dots */}
      <circle cx="25" cy="75" r="3" fill="#D85A30" opacity="0.12" />
      <circle cx="178" cy="85" r="2.5" fill="#D85A30" opacity="0.1" />
    </svg>
  );
}

export function WritingIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      {/* Paper */}
      <rect x="55" y="30" width="90" height="110" rx="6" fill="#1B4D3E" opacity="0.06" stroke="#1B4D3E" strokeWidth="2" />
      {/* Paper lines */}
      <line x1="70" y1="55" x2="130" y2="55" stroke="#1B4D3E" strokeWidth="1.5" opacity="0.2" strokeLinecap="round" />
      <line x1="70" y1="70" x2="125" y2="70" stroke="#1B4D3E" strokeWidth="1.5" opacity="0.15" strokeLinecap="round" />
      <line x1="70" y1="85" x2="120" y2="85" stroke="#1B4D3E" strokeWidth="1.5" opacity="0.12" strokeLinecap="round" />
      <line x1="70" y1="100" x2="110" y2="100" stroke="#1B4D3E" strokeWidth="1.5" opacity="0.1" strokeLinecap="round" />
      {/* Pen */}
      <g transform="translate(120, 95) rotate(-45)">
        <rect x="0" y="0" width="8" height="45" rx="2" fill="#1B4D3E" opacity="0.25" />
        <polygon points="0,45 4,56 8,45" fill="#1B4D3E" opacity="0.35" />
      </g>
      {/* Ink drops */}
      <circle cx="138" cy="115" r="3" fill="#1B4D3E" opacity="0.15" />
      <circle cx="145" cy="120" r="2" fill="#1B4D3E" opacity="0.1" />
      {/* Decorative */}
      <circle cx="35" cy="45" r="3" fill="#1B4D3E" opacity="0.1" />
      <circle cx="170" cy="55" r="2.5" fill="#1B4D3E" opacity="0.08" />
    </svg>
  );
}

export function SpeakingIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      {/* Microphone body */}
      <rect x="88" y="40" width="24" height="48" rx="12" fill="#1D9E75" opacity="0.15" stroke="#1D9E75" strokeWidth="2" />
      {/* Microphone stand */}
      <path d="M76 80 C76 95 86 105 100 105 C114 105 124 95 124 80" stroke="#1D9E75" strokeWidth="2" fill="none" opacity="0.3" />
      <line x1="100" y1="105" x2="100" y2="125" stroke="#1D9E75" strokeWidth="2" opacity="0.3" />
      <line x1="85" y1="125" x2="115" y2="125" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      {/* Speech bubbles */}
      <ellipse cx="150" cy="55" rx="28" ry="20" fill="#1D9E75" opacity="0.08" stroke="#1D9E75" strokeWidth="1.5" />
      <circle cx="130" cy="78" r="4" fill="#1D9E75" opacity="0.06" stroke="#1D9E75" strokeWidth="1" />
      {/* Bubble content dots */}
      <circle cx="142" cy="55" r="2" fill="#1D9E75" opacity="0.2" />
      <circle cx="150" cy="55" r="2" fill="#1D9E75" opacity="0.2" />
      <circle cx="158" cy="55" r="2" fill="#1D9E75" opacity="0.2" />
      {/* Sound waves */}
      <path d="M60 58 C55 65 55 75 60 82" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.2" />
      <path d="M50 50 C42 62 42 78 50 90" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.12" />
      {/* Decorative */}
      <circle cx="170" cy="95" r="3" fill="#1D9E75" opacity="0.1" />
      <circle cx="35" cy="70" r="2" fill="#1D9E75" opacity="0.08" />
    </svg>
  );
}

export function VocabIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      {/* Stacked flashcards */}
      <rect x="55" y="50" width="90" height="65" rx="8" fill="var(--color-accent)" opacity="0.05" stroke="var(--color-accent)" strokeWidth="1.5" transform="rotate(-4 100 82)" />
      <rect x="55" y="48" width="90" height="65" rx="8" fill="var(--color-accent)" opacity="0.08" stroke="var(--color-accent)" strokeWidth="1.5" transform="rotate(2 100 80)" />
      <rect x="55" y="45" width="90" height="65" rx="8" fill="var(--color-accent)" opacity="0.12" stroke="var(--color-accent)" strokeWidth="2" />
      {/* Card content - "A" letter */}
      <text x="100" y="88" textAnchor="middle" fontSize="28" fontWeight="bold" fill="var(--color-accent)" opacity="0.3" fontFamily="serif">Aa</text>
      {/* Brain sparkle */}
      <path d="M155 40 L158 48 L166 48 L160 53 L162 61 L155 56 L148 61 L150 53 L144 48 L152 48 Z" fill="var(--color-accent)" opacity="0.15" />
      <path d="M42 60 L44 65 L49 65 L45 68 L46 73 L42 70 L38 73 L39 68 L35 65 L40 65 Z" fill="var(--color-accent)" opacity="0.1" />
      {/* Decorative */}
      <circle cx="165" cy="100" r="3" fill="var(--color-accent)" opacity="0.1" />
      <circle cx="30" cy="90" r="2" fill="var(--color-accent)" opacity="0.08" />
    </svg>
  );
}

export function GrammarIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      {/* Building blocks */}
      <rect x="60" y="95" width="35" height="30" rx="4" fill="var(--color-accent)" opacity="0.12" stroke="var(--color-accent)" strokeWidth="2" />
      <rect x="100" y="95" width="40" height="30" rx="4" fill="var(--color-accent)" opacity="0.08" stroke="var(--color-accent)" strokeWidth="2" />
      <rect x="72" y="62" width="45" height="30" rx="4" fill="var(--color-accent)" opacity="0.1" stroke="var(--color-accent)" strokeWidth="2" />
      <rect x="120" y="68" width="25" height="24" rx="4" fill="var(--color-accent)" opacity="0.06" stroke="var(--color-accent)" strokeWidth="1.5" />
      {/* Top block */}
      <rect x="85" y="35" width="30" height="24" rx="4" fill="var(--color-accent)" opacity="0.15" stroke="var(--color-accent)" strokeWidth="2" />
      {/* Connection lines */}
      <line x1="78" y1="62" x2="78" y2="55" stroke="var(--color-accent)" strokeWidth="1" opacity="0.15" strokeDasharray="3 3" />
      <line x1="120" y1="95" x2="120" y2="92" stroke="var(--color-accent)" strokeWidth="1" opacity="0.15" strokeDasharray="3 3" />
      {/* Decorative brackets */}
      <path d="M45 55 C40 55 38 60 38 65 C38 70 40 75 45 75" stroke="var(--color-accent)" strokeWidth="1.5" fill="none" opacity="0.12" />
      <path d="M155 55 C160 55 162 60 162 65 C162 70 160 75 155 75" stroke="var(--color-accent)" strokeWidth="1.5" fill="none" opacity="0.12" />
      {/* Decorative */}
      <circle cx="170" cy="45" r="3" fill="var(--color-accent)" opacity="0.1" />
      <circle cx="30" cy="100" r="2.5" fill="var(--color-accent)" opacity="0.08" />
    </svg>
  );
}
