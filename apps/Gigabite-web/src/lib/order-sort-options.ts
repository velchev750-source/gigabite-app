export const ORDER_SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "idAsc", label: "Order ID ascending" },
  { value: "idDesc", label: "Order ID descending" },
  { value: "totalDesc", label: "Highest total" },
  { value: "totalAsc", label: "Lowest total" },
] as const;

export type OrderSortOption = (typeof ORDER_SORT_OPTIONS)[number]["value"];

export const DEFAULT_ORDER_SORT: OrderSortOption = "newest";

export function parseOrderSortOption(value: string | null): OrderSortOption {
  return ORDER_SORT_OPTIONS.some((option) => option.value === value)
    ? (value as OrderSortOption)
    : DEFAULT_ORDER_SORT;
}
