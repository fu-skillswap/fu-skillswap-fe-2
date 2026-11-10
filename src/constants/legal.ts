/**
 * @file legal.ts
 * @description Platform operator details shown before payment (Luật Thương mại điện tử 2025,
 * 122/2025/QH15) and the payment rate note.
 */

import { SKILLSWAP_CONTACT_EMAIL } from '@/constants/contact';

/** TODO(legal): fill before launch with the registered operator details. */
export const PLATFORM_OPERATOR = {
  operatorName: '[Tên đơn vị vận hành]',
  taxCode: '[Mã số thuế]',
  address: '[Địa chỉ trụ sở]',
  email: SKILLSWAP_CONTACT_EMAIL,
} as const;

/** True once every placeholder above has been replaced. */
export const PLATFORM_OPERATOR_READY = !Object.values(PLATFORM_OPERATOR).some((value) =>
  value.startsWith('['),
);

/**
 * VND charged by PayOS per S-coin. Swagger's checkout example (110 S-coins ↔ 110.000 VND)
 * suggests 1.000. TODO: confirm rate with BE/finance; set to null to hide the rate clause.
 */
export const SCOIN_TO_VND: number | null = 1000;
