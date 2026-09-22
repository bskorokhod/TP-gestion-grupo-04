import { useToast, type BackendError } from "@/hooks/useToast"

export const useFormToasts = () => {
    const { toast } = useToast()

    const showBusinessError = (description: string) => {
        toast({ variant: "destructive", title: "Error de negocio", description })
    }

    const showSchemaError = (description: string) => {
        toast({ variant: "destructive", title: "Error de validación", description })
    }

    const showApiError = (error: BackendError, title: string = "Error en la operación") => {
        const backendMessage = error?.response?.data?.message || error?.message
        toast({
            variant: "destructive",
            title,
            description: backendMessage
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