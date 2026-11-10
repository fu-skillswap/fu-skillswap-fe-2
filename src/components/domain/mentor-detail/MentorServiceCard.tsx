/**
 * @file MentorServiceCard.tsx
 * @description Thẻ dịch vụ tư vấn 1:1 trên hồ sơ mentor. Adapts the profile entity to the shared
 * fixed-size ServiceCard (the same component the service editor uses for its live preview).
 */

'use client';

import { ServiceCard } from '@/components/domain/mentor-service/ServiceCard';
import type { MentorService } from '@/models/entities';

interface MentorServiceCardProps {
  service: MentorService;
  /** Starts the existing booking flow with this service preselected. */
  onBook: (service: MentorService) => void;
  /** Opens the mentor's free slots for this service. */
  onViewSchedule: (service: MentorService) => void;
  /** Opens the full service description ("Xem thêm {n} nội dung"). */
  onShowMore: (service: MentorService) => void;
}

export function MentorServiceCard({
  service,
  onBook,
  onViewSchedule,
  onShowMore,
}: MentorServiceCardProps) {
  return (
    <ServiceCard
      service={{
        title: service.name,
        description: service.description ?? '',
        expectedOutcome: service.expectedOutcome ?? '',
        coverImageUrl: service.coverImageUrl,
        durationMinutes: service.durationMinutes,
        isFree: service.priceScoins === 0,
        priceScoin: service.priceScoins,
        maintainPostSessionChat: service.maintainPostSessionChat,
      }}
      onBook={() => onBook(service)}
      onViewSchedule={() => onViewSchedule(service)}
      onShowMore={() => onShowMore(service)}
    />
  );
}
