type Item = {
  id: "vk" | "tg" | "dc";
  label: string;
};

type Props = {
  vk: string;
  telegram: string;
  discord: string;
};

function VkMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className="h-8 w-8">
      <path
        d="M9 13.5 18 34.5 27 13.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M31 13.5v21M31 24.5 43 13.5M31 24.5 43 34.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TelegramMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className="h-8 w-8">
      <path
        d="M8 24.2 40.5 10.5 31 39.2 22.4 28.6 8 24.2Z"
        fill="currentColor"
      />
      <path
        d="M22.4 28.6 40.5 10.5"
        fill="none"
        stroke="#0a0812"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DiscordMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className="h-8 w-8">
      <path
        d="M14 16.5c2.2-1.6 4.6-2.5 10-2.5s7.8.9 10 2.5c2.2 3.4 3 8.2 2.4 13.2-2.4 1.6-4.8 2.6-7.4 3.1l-1.6-2.6c1.2-.3 2.3-.8 3.3-1.4-1.4.6-2.9 1.1-4.5 1.4-1.6.3-3.3.4-5.2.4s-3.6-.1-5.2-.4c-1.6-.3-3.1-.8-4.5-1.4 1 .6 2.1 1.1 3.3 1.4l-1.6 2.6c-2.6-.5-5-1.5-7.4-3.1-.6-5 .2-9.8 2.4-13.2Z"
        fill="currentColor"
      />
      <circle cx="19.2" cy="24.5" r="2.3" fill="#0a0812" />
      <circle cx="28.8" cy="24.5" r="2.3" fill="#0a0812" />
    </svg>
  );
}

const marks = {
  vk: VkMark,
  tg: TelegramMark,
  dc: DiscordMark,
} as const;

export function StayInTouch({ vk, telegram, discord }: Props) {
  const items: Item[] = [
    { id: "vk", label: vk },
    { id: "tg", label: telegram },
    { id: "dc", label: discord },
  ];

  return (
    <ul className="mt-8 flex flex-wrap items-start justify-center gap-6 sm:gap-10">
      {items.map((item) => {
        const Mark = marks[item.id];
        return (
          <li key={item.id}>
            <div className={`social-plate social-${item.id}`} aria-disabled="true">
              <Mark />
              <span className="sr-only">{item.label}</span>
            </div>
            <p className="mt-2 text-center text-sm font-bold tracking-wide text-foreground">
              {item.label}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
