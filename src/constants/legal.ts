/**
 * @file legal.ts
 * @description Platform operator details shown before payment (Luật Thương mại điện tử 2025,
 * 122/2025/QH15) and the payment rate note.
 */

import { SKILLSWAP_CONTACT_EMAIL } from '@/constants/contact';

/** Operator shown before payment. SkillSwap runs the platform; no tax code/address is shown. */
export const PLATFORM_OPERATOR = {
  operatorName: 'SkillSwap',
  email: SKILLSWAP_CONTACT_EMAIL,
} as const;

/** True once every placeholder above has been replaced. */
export const PLATFORM_OPERATOR_READY = !Object.values(PLATFORM_OPERATOR).some((value) =>
  value.startsWith('['),
);

/**
 * VND charged by PayOS per S-coin. Confirmed 1:1 by the product owner (real bookings average
 * ~111.000 S-coins per session). Set to null to hide the rate clause.
 */
export const SCOIN_TO_VND: number | null = 1;
