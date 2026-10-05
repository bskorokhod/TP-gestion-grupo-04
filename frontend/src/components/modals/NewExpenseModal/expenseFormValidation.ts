export type ExpenseFieldsValidation =
    | { readonly isValid: true; readonly amount: number }
    | { readonly isValid: false; readonly message: string };

export interface ExpenseFieldsInput {
    readonly title: string;
    readonly rawAmount: string;
    readonly participantCount: number;
}

/** Acepta coma o punto decimal; null si está vacío o no es un número. */
export function parseExpenseAmount(rawAmount: string): number | null {
    if (rawAmount.trim() === "") return null;

    const parsed = Number(rawAmount.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Validaciones comunes a registrar y a modificar un gasto. El comprobante y la membresía no se validan acá porque
 * cambian según el caso: al registrar el comprobante es obligatorio, al modificar se puede conservar el actual.
 */
export function validateExpenseFields({ title, rawAmount, participantCount }: ExpenseFieldsInput): ExpenseFieldsValidation {
    if (!title.trim()) {
        return { isValid: false, message: "El título del gasto es obligatorio" };
    }

    const amount = parseExpenseAmount(rawAmount);
    if (amount === null || amount <= 0) {
        return { isValid: false, message: "Ingresá un monto válido, mayor a cero" };
    }

    if (participantCount === 0) {
        return { isValid: false, message: "Asigná al menos una persona al gasto" };
    }

    return { isValid: true, amount };
}
