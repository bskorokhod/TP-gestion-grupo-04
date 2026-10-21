import type {ReactElement} from "react";

import {categoryLabel, EXPENSE_CATEGORIES} from "@/constants/expenseCategories.ts";
import {ExpenseCategorySchema, type ExpenseCategory} from "@/models/Expense.ts";

interface CategorySelectProps {
    readonly id: string;
    readonly value: ExpenseCategory;
    readonly onChange: (category: ExpenseCategory) => void;
}

/**
 * Select nativo con el estilo de los campos del modal (los de `TextInput`). No se usa `Forms/SelectField` porque
 * trae el estilo de las pantallas (otra altura, otros colores) y una opción vacía obligatoria: acá siempre hay una
 * categoría elegida, "Sin Categoría" por defecto.
 */
export function CategorySelect({id, value, onChange}: CategorySelectProps): ReactElement {
    return (
        <select
            id={id}
            value={value}
            onChange={(event) => {
                const parsed = ExpenseCategorySchema.safeParse(event.target.value);
                if (parsed.success) onChange(parsed.data);
            }}
            className="h-12 w-full rounded-xl border border-modal-border bg-modal-field px-4 text-sm text-modal-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-modal-primary/30"
        >
            {EXPENSE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                    {categoryLabel(category)}
                </option>
            ))}
        </select>
    );
}
