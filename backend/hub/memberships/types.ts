export type MembershipStatus = 'active' | 'waitlisted' | 'pending' | 'past_due' | 'canceled' | 'refunded';

export interface Membership {
  id: number;
  email: string;
  user_id: string | null;
  kiwify_order_id: string;
  status: MembershipStatus;
  purchased_at: Date;
  activated_at: Date | null;
  deactivated_at: Date | null;
  created_at: Date;
  updated_at: Date;
}
