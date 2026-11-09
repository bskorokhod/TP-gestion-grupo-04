import { parseAmount } from "@/lib/format.ts";
import { MAX_CLOSING_DEADLINE_DAYS, MIN_CLOSING_DEADLINE_DAYS } from "@/models/Expense.ts";

export type ExpenseFieldsValidation =
    | { readonly isValid: true; readonly amount: number; readonly closingDeadlineDays: number }
    | { readonly isValid: false; readonly message: string };

export interface ExpenseFieldsInput {
    readonly title: string;
    readonly rawAmount: string;
    readonly rawClosingDeadlineDays: string;
    readonly participantCount: number;
}

/** Acepta notación argentina o punto decimal, con hasta 2 decimales (mismas reglas que parseAmount); null si no es válido. */
export function parseExpenseAmount(rawAmount: string): number | null {
    if (rawAmount.trim() === "") return null;

    const parsed = parseAmount(rawAmount);
    return Number.isFinite(parsed) ? parsed : null;
}

/** Entero dentro de [MIN_CLOSING_DEADLINE_DAYS, MAX_CLOSING_DEADLINE_DAYS]; null si no es válido. */
export function parseClosingDeadlineDays(rawClosingDeadlineDays: string): number | null {
    if (rawClosingDeadlineDays.trim() === "") return null;

    const parsed = Number(rawClosingDeadlineDays);
    if (!Number.isInteger(parsed)) return null;
    if (parsed < MIN_CLOSING_DEADLINE_DAYS || parsed > MAX_CLOSING_DEADLINE_DAYS) return null;
    return parsed;
}

/**
 * Validaciones comunes a registrar y a modificar un gasto. El comprobante y la membresía no se validan acá porque
 * cambian según el caso: al registrar el comprobante es obligatorio, al modificar se puede conservar el actual.
 */
export function validateExpenseFields(
    { title, rawAmount, rawClosingDeadlineDays, participantCount }: ExpenseFieldsInput,
): ExpenseFieldsValidation {
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

    const closingDeadlineDays = parseClosingDeadlineDays(rawClosingDeadlineDays);
    if (closingDeadlineDays === null) {
        return {
            isValid: false,
            message: `Ingresá un plazo de cierre entre ${MIN_CLOSING_DEADLINE_DAYS} y ${MAX_CLOSING_DEADLINE_DAYS} días`,
        };
    }

    return { isValid: true, amount, closingDeadlineDays };
}
