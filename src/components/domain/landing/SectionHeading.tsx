import type { ReactNode } from 'react';

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  centered?: boolean;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  centered = false,
}: SectionHeadingProps) {
  return (
    <div
      className={`mb-8 flex gap-5 ${centered ? 'flex-col items-center text-center' : 'items-end justify-between'}`}
    >
      <div className={centered ? 'max-w-2xl' : 'max-w-3xl'}>
        {eyebrow && (
          <p className="mb-2 text-xs font-bold tracking-[0.14em] text-primary uppercase">
            {eyebrow}
          </p>
        )}
        <h2 className="text-[clamp(1.7rem,3vw,2.15rem)] leading-tight font-extrabold tracking-[-0.03em] text-[#102a56]">
          {title}
        </h2>
        {description && (
          <p className="mt-3 text-sm leading-6 text-[#5b6f89] sm:text-base">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
