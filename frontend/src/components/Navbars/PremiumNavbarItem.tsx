import {useEffect, useRef, useState} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faStar} from "@fortawesome/free-solid-svg-icons";
import {Link, useLocation, useRoute} from "wouter";

import {GROUP_ROUTE_PATTERN, groupPremiumPlansPath} from "@/constants/routes.ts";
import {useFormToasts} from "@/hooks/useFormToasts.ts";
import type {BackendError} from "@/hooks/useToast.ts";
import {useCancelGroupPremium, useGetGroups, useGetPremiumStatus} from "@/services/GroupServices.ts";

const sameCode = (a: string, b: string) => a.toUpperCase() === b.toUpperCase();

export function PremiumNavbarItem() {
    const [, routeParams] = useRoute(GROUP_ROUTE_PATTERN);
    const {data: groups} = useGetGroups();
    const [, navigate] = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const currentGroup = groups?.find((group) => routeParams?.code && sameCode(group.joinCode, routeParams.code));
    const premiumStatus = useGetPremiumStatus(currentGroup?.id ?? 0);
    const cancelPremium = useCancelGroupPremium(currentGroup?.id ?? 0);
    const {showSuccessToast, showApiError} = useFormToasts();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!currentGroup) return null;

    const isPremium = premiumStatus.data?.premium ?? currentGroup.isPremium;
    const label = premiumStatus.data?.state === "EXPIRED"
        ? "Potenciá tu grupo con Premium"
        : "Probá Premium";

    async function handleCancelPremium() {
        try {
            const result = await cancelPremium.mutateAsync();
            setIsMenuOpen(false);
            showSuccessToast(
                result.trial ? "Prueba cancelada" : "Premium cancelado",
                result.endsAt
                    ? `El grupo conserva Premium hasta el ${new Date(result.endsAt).toLocaleDateString("es-AR")}.`
                    : "El grupo volvió al plan gratuito.",
            );
        } catch (error) {
            showApiError(error as BackendError, "No se pudo cancelar Premium");
        }
    }

    return (
        <div className="relative border-r border-header-line pr-4 sm:pr-6" ref={menuRef}>
            <button
                type="button"
                onClick={() => isPremium ? setIsMenuOpen((prev) => !prev) : navigate(groupPremiumPlansPath(currentGroup.joinCode))}
                aria-label={isPremium ? "Opciones de Premium" : label}
                className="flex items-center gap-2 text-sm font-semibold text-brand transition-opacity hover:opacity-80 sm:text-base"
            >
                {isPremium ? (
                    <FontAwesomeIcon icon={faStar} className="text-amber" aria-hidden="true"/>
                ) : (
                    <span>{label}</span>
                )}
            </button>

            {isPremium && isMenuOpen && (
                <div className="absolute right-0 top-9 z-50 min-w-48 rounded-lg border border-border bg-panel py-2 shadow-panel">
                    <Link
                        href={groupPremiumPlansPath(currentGroup.joinCode)}
                        onClick={() => setIsMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-ink hover:bg-muted"
                    >
                        Ver Premium
                    </Link>
                    <button
                        type="button"
                        onClick={handleCancelPremium}
                        disabled={cancelPremium.isPending}
                        className="block w-full px-4 py-2 text-left text-sm text-destructive hover:bg-muted"
                    >
                        {cancelPremium.isPending ? "Cancelando..." : "Cancelar premium"}
                    </button>
                </div>
            )}
        </div>
    );
}
