import {createPortal} from "react-dom";
import {useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactElement} from "react";
import {faCheck, faChevronDown} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

import type {SelectOption} from "@/components/Forms/SelectField.tsx";
import {cn} from "@/lib/cn.ts";

interface DropdownSelectProps {
    readonly id: string;
    readonly options: ReadonlyArray<SelectOption>;
    readonly value: string;
    readonly onChange: (value: string) => void;
    readonly placeholder?: string;
    readonly "aria-label"?: string;
    readonly disabled?: boolean;
    readonly className?: string;
}

export function DropdownSelect({
    id,
    options,
    value,
    onChange,
    placeholder = "Elegí una opción",
    "aria-label": ariaLabel,
    disabled = false,
    className,
}: DropdownSelectProps): ReactElement {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [menuStyle, setMenuStyle] = useState<CSSProperties>({
        position: "fixed",
        top: 0,
        left: 0,
        visibility: "hidden",
    });
    const selectedLabel = options.find((option) => option.value === value)?.label ?? placeholder;

    useEffect(() => {
        if (!isOpen) return;

        const closeOnOutsideClick = (event: PointerEvent) => {
            const target = event.target as Node;
            if (
                containerRef.current
                && !containerRef.current.contains(target)
                && !menuRef.current?.contains(target)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("pointerdown", closeOnOutsideClick);
        return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
    }, [isOpen]);

    useLayoutEffect(() => {
        if (!isOpen || !buttonRef.current || !menuRef.current) return;

        const updateMenuPosition = () => {
            if (!buttonRef.current || !menuRef.current) return;

            const buttonRect = buttonRef.current.getBoundingClientRect();
            const menuRect = menuRef.current.getBoundingClientRect();
            const spacing = 8;
            const openAbove = buttonRect.bottom + menuRect.height > window.innerHeight - spacing
                && buttonRect.top - menuRect.height >= spacing;
            const top = openAbove
                ? buttonRect.top - menuRect.height - spacing
                : buttonRect.bottom + spacing;
            const left = Math.min(
                Math.max(spacing, buttonRect.left),
                window.innerWidth - menuRect.width - spacing,
            );

            setMenuStyle({
                position: "fixed",
                top,
                left,
                width: buttonRect.width,
                visibility: "visible",
            });
        };

        const frame = window.requestAnimationFrame(updateMenuPosition);
        window.addEventListener("resize", updateMenuPosition);
        window.addEventListener("scroll", updateMenuPosition, true);
        return () => {
            window.cancelAnimationFrame(frame);
            window.removeEventListener("resize", updateMenuPosition);
            window.removeEventListener("scroll", updateMenuPosition, true);
        };
    }, [isOpen, options.length]);

    return (
        <div ref={containerRef} className={cn("relative", className)}>
            <button
                ref={buttonRef}
                id={id}
                type="button"
                aria-label={ariaLabel}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                disabled={disabled}
                onClick={() => setIsOpen((current) => !current)}
                className="flex h-14 w-full items-center justify-between gap-3 rounded-xl border border-field bg-input-surface px-5 text-left text-base text-ink shadow-sm transition hover:border-brand/50 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
                <span className="truncate">{selectedLabel}</span>
                <FontAwesomeIcon icon={faChevronDown} className={`size-3 shrink-0 text-texto-principal/60 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>
            {isOpen && createPortal(
                <div
                    ref={menuRef}
                    role="listbox"
                    aria-labelledby={id}
                    style={menuStyle}
                    className="z-300 rounded-2xl border border-[#e4ded4] bg-white p-1.5 shadow-[0_10px_28px_rgba(63,53,37,0.18)]"
                >
                    {options.map((option) => {
                        const selected = option.value === value;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                role="option"
                                aria-selected={selected}
                                disabled={option.disabled}
                                onClick={() => {
                                    if (!option.disabled) {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }
                                }}
                                className={cn(
                                    "flex w-full items-center justify-between gap-5 rounded-xl px-3 py-2.5 text-left text-sm transition",
                                    selected ? "bg-brand text-brand-foreground" : "text-ink hover:bg-group-paper",
                                    "disabled:cursor-not-allowed disabled:opacity-50",
                                )}
                            >
                                <span>{option.label}</span>
                                {selected && <FontAwesomeIcon icon={faCheck} className="size-3" />}
                            </button>
                        );
                    })}
                </div>,
                document.body,
            )}
        </div>
    );
}
