import type { ReactNode } from 'react';
import { Ticket } from 'lucide-react';
import { formatScoin } from '@/lib/coupon';
import { getServicePriceDisplay, type ServicePriceInput } from '@/utils/servicePrice';

export type PriceWithCouponVariant = 'panel' | 'inline' | 'summary';

export interface PriceWithCouponProps {
  /** Service/slot object carrying `priceScoin` and the optional coupon fields. */
  pricing: ServicePriceInput;
  /** panel = service card right panel, inline = booking cards, summary = booking modal total. */
  variant: PriceWithCouponVariant;
  /**
   * The price node the page renders today. Shown unchanged when there is no coupon discount, so
   * call sites keep their current markup.
   */
  fallback?: ReactNode;
  /** Classes of the page's existing price text, applied to the final price. */
  priceClassName?: string;
  className?: string;
  /** Formats the final price; defaults to "Miễn phí" / "69.300 S-coins". */
  formatPrice?: (value: number) => ReactNode;
}

const defaultFormatPrice = (value: number) =>
  value === 0 ? 'Miễn phí' : `${formatScoin(value)} S-coins`;

const LAYOUT: Record<PriceWithCouponVariant, string> = {
  panel: 'flex flex-col items-start gap-1',
  inline: 'inline-flex flex-wrap items-baseline gap-x-2 gap-y-1',
  summary: 'flex flex-col items-end gap-1 text-right',
};

export function PriceWithCoupon({
  pricing,
  variant,
  fallback,
  priceClassName,
  className,
  formatPrice = defaultFormatPrice,
}: PriceWithCouponProps) {
  const price = getServicePriceDisplay(pricing);

  if (!price.hasDiscount) {
    if (fallback !== undefined) return <>{fallback}</>;
    return <span className={priceClassName}>{formatPrice(price.final)}</span>;
  }

  return (
    <span className={[LAYOUT[variant], className].filter(Boolean).join(' ')}>
      <span className={variant === 'inline' ? 'contents' : 'inline-flex items-baseline gap-2'}>
        <del className="font-semibold text-text-disabled">
          <span className="sr-only">Giá gốc: </span>
          {formatScoin(price.original)} S-coins
        </del>
        <span className={priceClassName}>
          <span className="sr-only">Giá sau giảm: </span>
          {formatPrice(price.final)}
        </span>
      </span>
      {price.code ? (
        // #EAF5FE is the brand tint; it has no global token yet (same value as couponOffers.module.css).
        <span
          className="inline-flex items-center gap-1 rounded-full bg-[#eaf5fe] px-2 py-0.5 text-xs font-semibold text-primary-text"
          title={price.title}
        >
          <Ticket size={12} aria-hidden="true" />
          Mã {price.code}
        </span>
      ) : null}
    </span>
  );
}
