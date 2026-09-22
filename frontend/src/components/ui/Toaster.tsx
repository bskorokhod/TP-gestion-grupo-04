import { useToast } from "@/hooks/useToast"
import { Toast } from "./Toast"

export function Toaster() {
    const { toasts, dismiss } = useToast()

    return (
        <div className="fixed top-0 z-300 flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-105 pointer-events-none">
            {toasts.map((toast) => (
                <Toast key={toast.id} {...toast} onClose={dismiss} />
            ))}
        </div>
    )
}