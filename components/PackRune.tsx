type PackId = string;

function pathsFor(id: PackId): string[] {
  if (id === "pathfinder") {
    return [
      "M18 6 L30 18 L18 30 L6 18 Z",
      "M18 8 V50",
      "M10 40 L18 50 L26 40",
      "M8 16 L14 22",
    ];
  }
  if (id === "chronicler") {
    return [
      "M10 10 H26 V46 H10 Z",
      "M14 18 H22",
      "M14 26 H22",
      "M14 34 H20",
      "M8 8 L28 48",
    ];
  }
  return [
    "M10 46 Q18 8 26 46",
    "M13 30 H23",
    "M18 14 V6",
    "M14 10 H22",
    "M8 50 H28",
  ];
}

export function PackRune({ packId }: { packId: PackId }) {
  return (
    <svg viewBox="0 0 36 56" width="72" height="108" className={`pack-rune pack-rune-${packId}`} aria-hidden>
      {pathsFor(packId).map((d) => (
        <path key={d} pathLength={100} d={d} />
      ))}
    </svg>
  );
}
