import {cn} from "@/lib/cn.js";

const base =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed";

const variants = {
    default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
    hero: "rounded-lg bg-primary text-primary-foreground shadow-none hover:bg-primary/90",
    pill: "rounded-full bg-card text-primary shadow-none hover:bg-card/90",
    outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline",
    modalPrimary: "rounded-full border border-modal-primary bg-modal-primary text-modal-primary-foreground shadow-none hover:bg-modal-primary/90",
    modalSecondary: "rounded-full border border-modal-border bg-modal-surface text-modal-ink shadow-none hover:bg-modal-field",
    modalIcon: "rounded-lg bg-modal-soft text-modal-primary shadow-none hover:bg-modal-soft/80",
};

const sizes = {
    default: "h-9 px-4 py-2",
    sm: "h-8 rounded-md px-3 text-xs",
    lg: "h-10 rounded-md px-8",
    hero: "h-12 px-6 text-base",
    icon: "h-9 w-9",
    modal: "h-12 px-6 text-sm",
    modalIcon: "size-7 p-0",
};

export function Button({className, variant = "default", size = "default", ...props}) {
    return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}

export default Button;