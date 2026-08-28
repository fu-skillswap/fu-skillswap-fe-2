/**
 * @file useMentorServices.ts
 * @description Điều phối tải, tạo và bật/tắt dịch vụ mentoring của mentor.
 */

'use client';

import { ApiClientError } from '@/models/apiClient';
import type {
  CreateMentorServiceRequest,
  MentorServiceConstraintsResponse,
  MentorServiceManagementResponse,
} from '@/models/auth';
import { mentorServiceRepo } from '@/repositories/mentorServiceRepo';
import { useCallback, useEffect, useState } from 'react';

const defaultError = 'Không thể tải dịch vụ. Vui lòng thử lại.';

/** Quản lý dữ liệu màn hình Khóa học của tôi theo service API. */
export function useMentorServices() {
  const [services, setServices] = useState<MentorServiceManagementResponse[]>([]);
  const [constraints, setConstraints] = useState<MentorServiceConstraintsResponse>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      const [nextConstraints, nextServices] = await Promise.all([
        mentorServiceRepo.getConstraints(),
        mentorServiceRepo.list(),
      ]);
      setConstraints(nextConstraints);
      setServices(nextServices);
    } catch (reason) {
      setError(reason instanceof ApiClientError ? reason.message : defaultError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async (data: CreateMentorServiceRequest) => {
    setIsSaving(true);
    setError(undefined);
    try {
      const created = await mentorServiceRepo.create(data);
      setServices((current) => [created, ...current]);
      return true;
    } catch (reason) {
      setError(reason instanceof ApiClientError ? reason.message : defaultError);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (service: MentorServiceManagementResponse) => {
    setIsSaving(true);
    setError(undefined);
    try {
      const updated = await mentorServiceRepo.setActive(service.serviceId, {
        isActive: !service.isActive,
        expectedVersion: service.version,
      });
      setServices((current) =>
        current.map((item) => (item.serviceId === updated.serviceId ? updated : item)),
      );
    } catch (reason) {
      setError(
        reason instanceof ApiClientError && reason.status === 409
          ? 'Dịch vụ đã thay đổi. Vui lòng tải lại trước khi thao tác tiếp.'
          : reason instanceof ApiClientError
            ? reason.message
            : defaultError,
      );
    } finally {
      setIsSaving(false);
    }
  };

  return { constraints, create, error, isLoading, isSaving, load, services, toggleActive };
}
