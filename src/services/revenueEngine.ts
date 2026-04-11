/**
 * @deprecated
 * Bridge file — يعيد التصدير من domain الجديد.
 * استخدم بدلاً منه:
 *   import { revenueService } from '@/domains/billing'
 */

export { revenueService as revenueEngine } from "@/domains/billing";

export type {
  TransactionSummary,
  RevenueMetricSnapshot,
  PaymentGateway,
} from "@/domains/billing";

// Backwards compat: named class export
import { revenueService } from "@/domains/billing";
export { revenueService };
