import type { ToasterToast } from "@/hooks/useToast"

interface ToastProps extends ToasterToast {
    onClose: (id: string) => void;
}

export function Toast({ id, title, description, action, variant = "default", onClose }: ToastProps) {
    const isDestructive = variant === "destructive";

    const baseStyles = "pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-lg border bg-white p-5 shadow-lg transition-all animate-in slide-in-from-right-8 fade-in-50";
    const variantStyles = isDestructive
        ? "border-red-100 text-red-600"
        : "border-gray-200 text-gray-900";

    return (
        <div className={`${baseStyles} ${variantStyles}`} role="alert">
            <div className="flex flex-col gap-1 w-full">
                {title && <h3 className="text-sm font-semibold">{title}</h3>}
                {description && (
                    <p className={`text-sm opacity-90 ${isDestructive ? "text-red-500" : "text-gray-500"}`}>
                        {description}
                    </p>
                )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
                {action}
                <button
                    onClick={() => onClose(id)}
                    className="rounded-md p-1 opacity-50 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2"
                    aria-label="Cerrar notificación"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    )
}