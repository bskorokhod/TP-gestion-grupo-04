import type {ReactNode} from "react";

export interface SubmitButtonProps {
    className?: string;
    children: ReactNode;
}

export default function SubmitButton({className = "", children}: SubmitButtonProps) {
    return (
        <button
            type="submit"
            className={`flex h-14 w-full items-center justify-center rounded-full bg-brand text-base font-semibold text-brand-foreground transition-colors hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${className}`}
        >
            {children}
        </button>
    );
}
