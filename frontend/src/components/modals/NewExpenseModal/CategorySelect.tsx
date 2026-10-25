import type {ReactElement} from "react";

import {DropdownSelect} from "@/components/Forms/DropdownSelect.tsx";
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
        <DropdownSelect
            id={id}
            value={value}
            onChange={(selectedValue) => {
                const parsed = ExpenseCategorySchema.safeParse(selectedValue);
                if (parsed.success) onChange(parsed.data);
            }}
            options={EXPENSE_CATEGORIES.map((category) => ({value: category, label: categoryLabel(category)}))}
            className="w-full"
        />
    );
}
