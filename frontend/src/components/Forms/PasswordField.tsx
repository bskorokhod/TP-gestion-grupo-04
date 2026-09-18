import type {InputHTMLAttributes} from "react";
import {useState} from "react";
import {EyeIcon, EyeOffIcon} from "../Icons.tsx";

export interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type"> {
    id: string;
    label: string;
    className?: string;
}

export default function PasswordField({id, label, className = "", ...inputProps}: PasswordFieldProps) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className={className}>
            <label htmlFor={id} className="text-base font-medium text-ink">
                {label}
            </label>
            <div className="relative mt-3">
                <input
                    id={id}
                    type={showPassword ? "text" : "password"}
                    {...inputProps}
                    className="h-14 w-full rounded-[10px] border border-field bg-input-surface py-3 pl-5 pr-14 text-base text-ink outline-none transition-shadow focus:ring-2 focus:ring-brand/25"
                />
                <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute inset-y-0 right-0 flex w-14 items-center justify-center text-ink transition-colors hover:text-brand"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                    {showPassword ? <EyeIcon/> : <EyeOffIcon/>}
                </button>
            </div>
        </div>
    );
}
