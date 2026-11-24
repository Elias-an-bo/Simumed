/** Logo provisório (texto + marca). Trocar pelo oficial quando o dono enviar o arquivo. */
export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5" aria-label="Simumed">
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
        <rect width="34" height="34" rx="9" fill={inverted ? "#fff" : "#0a1a2f"} />
        <path
          d="M6 18h6l2.5-6 4 11 3-7.5L23 18h5"
          fill="none"
          stroke="#12a396"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className={`font-[family-name:var(--font-display)] text-[22px] font-extrabold tracking-[-0.03em] ${inverted ? "text-white" : "text-ink"}`}
      >
        simu<span className={inverted ? "text-[#5fd3c5]" : "text-brand"}>med</span>
      </span>
    </span>
  );
}
