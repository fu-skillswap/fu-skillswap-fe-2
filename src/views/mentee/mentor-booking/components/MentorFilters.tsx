/**
 * @file MentorFilters.tsx
 * @description Bộ lọc trang Tìm Mentor: ô tìm kiếm, cơ sở, chuyên ngành (nhóm theo ngành),
 * cách sắp xếp và các chip nhu cầu nhanh.
 */

'use client';

import { studentProfileRepo } from '@/repositories/studentProfileRepo';
import * as SelectPrimitive from '@radix-ui/react-select';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronDown, Search } from 'lucide-react';

/** Quick needs shown as chips; each one fills the search box. Edit freely. */
export const QUICK_NEEDS = [
  'PRN211',
  'SWP391',
  'MAE101',
  'CV & phỏng vấn OJT',
  'Phân tích dữ liệu',
  'UI/UX',
] as const;

export type MentorSort = 'match' | 'rating';

// TODO(api): sortBy=createdAt on /api/mentors — it is ignored today (ASC and DESC return the same
// order), so the "Mới tham gia" option stays hidden until the API supports it.
const SORT_OPTIONS: { value: MentorSort; label: string }[] = [
  { value: 'match', label: 'Hợp với bạn nhất' },
  { value: 'rating', label: 'Đánh giá cao' },
];

export function isMentorSort(value: string | null): value is MentorSort {
  return SORT_OPTIONS.some((option) => option.value === value);
}

/** Radix Select items cannot have an empty value. */
const ALL = 'all';
const LONG_STALE = 30 * 60 * 1000;

interface OptionGroup {
  label?: string;
  options: { value: string; label: string }[];
}

async function fetchSpecializationGroups(): Promise<OptionGroup[]> {
  const programs = await studentProfileRepo.getPrograms();
  const groups = await Promise.all(
    programs.map(async (program) => ({
      label: program.nameVi,
      options: (await studentProfileRepo.getSpecializations(program.id).catch(() => [])).map(
        (specialization) => ({ value: specialization.id, label: specialization.nameVi }),
      ),
    })),
  );
  return groups.filter((group) => group.options.length > 0);
}

interface MentorFiltersProps {
  query: string;
  onQueryChange: (value: string) => void;
  campusId?: string;
  onCampusChange: (value?: string) => void;
  specializationId?: string;
  onSpecializationChange: (value?: string) => void;
  sort: MentorSort;
  onSortChange: (value: MentorSort) => void;
}

export function MentorFilters({
  query,
  onQueryChange,
  campusId,
  onCampusChange,
  specializationId,
  onSpecializationChange,
  sort,
  onSortChange,
}: MentorFiltersProps) {
  const campuses = useQuery({
    queryKey: ['campuses'],
    queryFn: studentProfileRepo.getCampuses,
    staleTime: LONG_STALE,
  });
  const specializations = useQuery({
    queryKey: ['program-specializations'],
    queryFn: fetchSpecializationGroups,
    staleTime: LONG_STALE,
  });

  const campusOptions = (campuses.data ?? []).map((campus) => ({
    value: campus.id,
    label: campus.name,
  }));
  const specializationGroups = specializations.data ?? [];
  const activeNeed = query.trim();

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2.5">
        <label className="relative block min-w-0 flex-[1_1_320px]">
          <span className="sr-only">Tìm mentor</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Môn học, kỹ năng hoặc tên mentor"
            className="min-h-[52px] w-full rounded-2xl border border-solid border-slate-200 bg-white pr-4 pl-12 text-[15px] text-text-main outline-none transition-colors placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </label>

        {campusOptions.length > 0 && (
          <FilterSelect
            label="Cơ sở"
            value={campusId ?? ALL}
            groups={[{ options: [{ value: ALL, label: 'Tất cả' }, ...campusOptions] }]}
            onChange={(value) => onCampusChange(value === ALL ? undefined : value)}
          />
        )}
        {specializationGroups.length > 0 && (
          <FilterSelect
            label="Chuyên ngành"
            value={specializationId ?? ALL}
            groups={[{ options: [{ value: ALL, label: 'Tất cả' }] }, ...specializationGroups]}
            onChange={(value) => onSpecializationChange(value === ALL ? undefined : value)}
          />
        )}
        <FilterSelect
          label="Sắp xếp"
          value={sort}
          groups={[{ options: SORT_OPTIONS }]}
          onChange={(value) => {
            if (isMentorSort(value)) onSortChange(value);
          }}
        />
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Nhu cầu thường gặp">
        <NeedChip label="Tất cả" active={!activeNeed} onClick={() => onQueryChange('')} />
        {QUICK_NEEDS.map((need) => (
          <NeedChip
            key={need}
            label={need}
            active={activeNeed === need}
            onClick={() => onQueryChange(need)}
          />
        ))}
      </div>
    </div>
  );
}

function NeedChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-[38px] cursor-pointer rounded-full border border-solid px-3.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${
        active
          ? 'border-primary bg-primary text-white'
          : 'border-slate-200 bg-white text-slate-600 hover:border-primary-border hover:text-primary'
      }`}
    >
      {label}
    </button>
  );
}

function FilterSelect({
  label,
  value,
  groups,
  onChange,
}: {
  label: string;
  value: string;
  groups: OptionGroup[];
  onChange: (value: string) => void;
}) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onChange}>
      <SelectPrimitive.Trigger className="flex min-h-12 min-w-0 flex-[1_1_180px] cursor-pointer items-center justify-between gap-2 rounded-2xl border border-solid border-slate-200 bg-white px-3.5 py-1.5 text-left outline-none transition-colors hover:border-primary-border focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 sm:max-w-[240px]">
        <span className="flex min-w-0 flex-col">
          <span className="text-[11px] font-semibold text-slate-500">{label}</span>
          <span className="truncate text-sm font-semibold text-text-main">
            <SelectPrimitive.Value />
          </span>
        </span>
        <SelectPrimitive.Icon className="shrink-0 text-text-muted">
          <ChevronDown size={18} />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="z-[99999] max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-y-auto rounded-2xl border border-solid border-slate-200 bg-white p-1.5 shadow-[0_12px_32px_rgba(16,50,90,0.14)]"
        >
          <SelectPrimitive.Viewport className="p-1">
            {groups.map((group, index) => (
              <SelectPrimitive.Group key={group.label ?? `group-${index}`}>
                {group.label && (
                  <SelectPrimitive.Label className="px-3 pt-2.5 pb-1 text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                    {group.label}
                  </SelectPrimitive.Label>
                )}
                {group.options.map((option) => (
                  <SelectPrimitive.Item
                    key={option.value}
                    value={option.value}
                    className="flex min-h-10 cursor-pointer items-center justify-between gap-2 rounded-lg px-3 text-sm text-text-main outline-none data-[highlighted]:bg-primary-light data-[highlighted]:text-primary"
                  >
                    <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                    <SelectPrimitive.ItemIndicator className="shrink-0 text-primary">
                      <Check size={16} />
                    </SelectPrimitive.ItemIndicator>
                  </SelectPrimitive.Item>
                ))}
              </SelectPrimitive.Group>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
