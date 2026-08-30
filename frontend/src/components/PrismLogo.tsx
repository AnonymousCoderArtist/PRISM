export function PrismLogo({ size = 30 }: { size?: number }) {
  const ink = "#F4F1EB";
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
      <path d="M16 3 L28.5 26 L3.5 26 Z" stroke={ink} strokeWidth="1.6" fill="rgba(244,241,235,0.08)" />
      <path d="M16 3 L16 26 L3.5 26 Z" fill="rgba(244,241,235,0.22)" stroke="rgba(244,241,235,0.55)" strokeWidth="1" />
      <path d="M16 3 L28.5 26 L16 26 Z" fill="rgba(244,241,235,0.06)" stroke="rgba(244,241,235,0.35)" strokeWidth="1" />
      <path d="M16 3 L16 26" stroke={ink} strokeWidth="1.2" strokeLinecap="round" opacity={0.9} />
      <path d="M16 11 L11.2 19.2" stroke={ink} strokeWidth="0.7" opacity={0.5} />
      <circle cx="16" cy="16.5" r="1.4" fill={ink} opacity={0.95} />
      <circle cx="16" cy="16.5" r="4" fill="none" stroke={ink} strokeWidth="0.6" opacity={0.18} />
    </svg>
  );
}
