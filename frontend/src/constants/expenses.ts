export const PAYMENT_STATUS_CONFIG = {
    paid: { badgeClasses: "bg-group-green/70 text-brand-foreground", label: "Pagó" },
    partial: { badgeClasses: "bg-group-amber/70 text-brand-foreground", label: "Parcial" },
    pending: { badgeClasses: "bg-field/70 text-group-muted", label: "Pendiente" },
    unpaid: { badgeClasses: "bg-field/70 text-group-muted", label: "No pagó" },
} as const;

export type PaymentStatus = keyof typeof PAYMENT_STATUS_CONFIG;

export const TRANSACTION_VARIANTS = {
    debt: "text-group-danger",
    credit: "text-brand",
} as const;

export type TransactionVariant = keyof typeof TRANSACTION_VARIANTS;

export const BALANCE_COLORS = {
    positive: "text-group-green",
    negative: "text-group-danger",
    neutral: "text-group-muted",
} as const;

export type BalanceStatus = keyof typeof BALANCE_COLORS;

export const SECTION_BANNER_VARIANTS = {
    othersDebt: "bg-group-green",
    ownDebt: "bg-group-danger",
    allDebt: "bg-brand-hover",
} as const;

export type SectionBannerVariant = keyof typeof SECTION_BANNER_VARIANTS;