export function PrismLogo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
      {/* outer triangle */}
      <path d="M16 3 L28.5 26 L3.5 26 Z" stroke="#CCFF00" strokeWidth="1.6" fill="rgba(204,255,0,0.08)" />
      {/* inner prism facets */}
      <path d="M16 3 L16 26 L3.5 26 Z" fill="rgba(204,255,0,0.22)" stroke="rgba(204,255,0,0.55)" strokeWidth="1" />
      <path d="M16 3 L28.5 26 L16 26 Z" fill="rgba(204,255,0,0.06)" stroke="rgba(204,255,0,0.35)" strokeWidth="1" />
      {/* center line + glow */}
      <path d="M16 3 L16 26" stroke="#CCFF00" strokeWidth="1.2" strokeLinecap="round" opacity={0.9} />
      <path d="M16 11 L11.2 19.2" stroke="#E8ECEB" strokeWidth="0.7" opacity={0.5} />
      <circle cx="16" cy="16.5" r="1.4" fill="#CCFF00" opacity={0.95} />
      <circle cx="16" cy="16.5" r="4" fill="none" stroke="#CCFF00" strokeWidth="0.6" opacity={0.18} />
    </svg>
  );
}
