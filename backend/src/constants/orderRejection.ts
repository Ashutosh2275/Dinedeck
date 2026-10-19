export interface PredefinedRejectionReason {
  code: string;
  title: string;
  description: string;
}

export const PREDEFINED_REJECTION_REASONS: PredefinedRejectionReason[] = [
  {
    code: 'ITEM_UNAVAILABLE',
    title: 'Item Unavailable',
    description: 'One or more requested items are out of stock.'
  },
  {
    code: 'KITCHEN_CAPACITY',
    title: 'Kitchen at Capacity',
    description: 'The kitchen cannot prepare additional orders right now.'
  },
  {
    code: 'RESTAURANT_CLOSING',
    title: 'Restaurant Closing',
    description: 'The restaurant is closing or has stopped accepting orders.'
  },
  {
    code: 'PREP_TIME_TOO_LONG',
    title: 'Preparation Time Too Long',
    description: 'The order cannot be prepared within a reasonable time.'
  },
  {
    code: 'INGREDIENT_UNAVAILABLE',
    title: 'Ingredient Unavailable',
    description: 'Required ingredients are unavailable.'
  },
  {
    code: 'TEMPORARY_OPERATIONAL_ISSUE',
    title: 'Temporary Operational Issue',
    description: 'An unexpected operational issue prevents preparation.'
  }
];

export const TIMEOUT_REJECTION_CODE = 'ACCEPTANCE_TIMEOUT';
export const TIMEOUT_REJECTION_REASON =
  'The restaurant did not accept your order within 90 seconds. Please try another restaurant or place your order again.';

export const ORDER_ACCEPTANCE_TIMEOUT_MS = 90 * 1000; // 90 seconds
