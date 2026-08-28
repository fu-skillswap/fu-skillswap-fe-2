/**
 * @file useMentorSchedulingRead.ts
 * @description Coordinates read-only scheduling data for the mentor screen.
 */

'use client';

import { ApiClientError } from '@/models/apiClient';
import type {
  AvailabilitySlotsQuery,
  AvailabilitySlotsResponse,
  GoogleCalendarStatusResponse,
  MentorBookingPolicyResponse,
  MentorSchedulingConstraintsResponse,
} from '@/models/auth';
import { mentorSchedulingRepo } from '@/repositories/mentorSchedulingRepo';
import { useCallback, useEffect, useState } from 'react';

export interface MentorSchedulingReadData {
  bookingPolicy?: MentorBookingPolicyResponse;
  constraints?: MentorSchedulingConstraintsResponse;
  googleCalendarStatus?: GoogleCalendarStatusResponse;
  availabilitySlots?: AvailabilitySlotsResponse;
}

interface SchedulingReadErrors {
  availability?: string;
  configuration?: string;
}

function getErrorMessage(reason: unknown) {
  if (!(reason instanceof ApiClientError)) {
    return 'Unable to load the scheduling configuration. Please try again.';
  }

  switch (reason.status) {
    case 403:
      return 'You do not have permission to view the scheduling configuration.';
    case 404:
      return 'The scheduling configuration was not found.';
    case 409:
      return 'The scheduling configuration changed. Please reload and try again.';
    case 429:
      return 'Too many requests. Please try again later.';
    default:
      return reason.message;
  }
}

/**
 * Loads all read-only scheduling resources in parallel.
 * Errors are exposed through state so the view can choose how to render them without duplicate toasts.
 */
export function useMentorSchedulingRead(availabilityQuery: AvailabilitySlotsQuery = {}) {
  const [data, setData] = useState<MentorSchedulingReadData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<SchedulingReadErrors>({});
  const { fromDate, isActive, toDate } = availabilityQuery;

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrors({});
    setData((current) => ({ ...current, availabilitySlots: undefined }));

    const [bookingPolicyResult, constraintsResult, googleCalendarResult, availabilityResult] =
      await Promise.allSettled([
        mentorSchedulingRepo.getBookingPolicy(),
        mentorSchedulingRepo.getConstraints(),
        mentorSchedulingRepo.getGoogleCalendarStatus(),
        mentorSchedulingRepo.listAvailabilitySlots({ fromDate, isActive, toDate }),
      ]);

    setData((current) => ({
      bookingPolicy:
        bookingPolicyResult.status === 'fulfilled'
          ? bookingPolicyResult.value
          : current.bookingPolicy,
      constraints:
        constraintsResult.status === 'fulfilled' ? constraintsResult.value : current.constraints,
      googleCalendarStatus:
        googleCalendarResult.status === 'fulfilled'
          ? googleCalendarResult.value
          : current.googleCalendarStatus,
      availabilitySlots:
        availabilityResult.status === 'fulfilled' ? availabilityResult.value : undefined,
    }));
    setErrors({
      availability:
        availabilityResult.status === 'rejected'
          ? getErrorMessage(availabilityResult.reason)
          : undefined,
      configuration:
        bookingPolicyResult.status === 'rejected'
          ? getErrorMessage(bookingPolicyResult.reason)
          : googleCalendarResult.status === 'rejected'
            ? getErrorMessage(googleCalendarResult.reason)
            : constraintsResult.status === 'rejected'
              ? getErrorMessage(constraintsResult.reason)
              : undefined,
    });
    setIsLoading(false);
  }, [fromDate, isActive, toDate]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    ...data,
    availabilityError: errors.availability,
    configurationError: errors.configuration,
    isLoading,
    load,
  };
}
