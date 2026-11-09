import { useToast, type BackendError } from "@/hooks/useToast"
import { apiErrorMessage, type ApiErrorOverrides } from "@/lib/apiErrors.ts"

export const useFormToasts = () => {
    const { toast } = useToast()

    const showBusinessError = (description: string) => {
        toast({ variant: "destructive", title: "Error de negocio", description })
    }

    const showSchemaError = (description: string) => {
        toast({ variant: "destructive", title: "Error de validación", description })
    }

    /** El texto sale del status HTTP (`apiErrorMessage`), nunca del mensaje crudo del backend. `overrides` pisa por status. */
    const showApiError = (error: BackendError | unknown, title: string = "Error en la operación", overrides?: ApiErrorOverrides) => {
        toast({
            variant: "destructive",
            title,
            description: apiErrorMessage(error, overrides)
        })
    }

    const showSuccessToast = (title: string, description?: string) => {
        toast({ title, description, variant: "default" })
    }

    const showErrorToast = (title: string, description: string) => {
        toast({
            variant: "destructive",
            title,
            description
        })
    }

    return { showBusinessError, showSchemaError, showApiError, showSuccessToast, showErrorToast }
}