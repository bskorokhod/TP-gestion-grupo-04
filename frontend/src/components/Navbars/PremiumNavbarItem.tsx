import {useEffect, useRef, useState} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faStar} from "@fortawesome/free-solid-svg-icons";
import {Link, useLocation, useRoute} from "wouter";

import {GROUP_ROUTE_PATTERN, PREMIUM_PATH} from "@/constants/routes.ts";
import {useFormToasts} from "@/hooks/useFormToasts.ts";
import type {BackendError} from "@/hooks/useToast.ts";
import {formatDaysLeft, getTrialOffer} from "@/lib/premium.ts";
import type {PremiumStatus} from "@/models/Group.ts";
import {useCancelGroupPremium, useGetGroups, useGetPremiumStatus} from "@/services/GroupServices.ts";

const sameCode = (a: string, b: string) => a.toUpperCase() === b.toUpperCase();

/**
 * Datos del plan en el desplegable. Todos los miembros ven quién lo contrató y cuánto falta; la tarjeta (que el
 * backend solo envía al pagador) se muestra con una leyenda de privacidad.
 */
function PremiumDetails({status}: { status: PremiumStatus }) {
    const cancelled = status.state === "CANCELLED_IN_FORCE";
    const showCard = status.youArePayer && Boolean(status.cardLast4 || status.cardholderName);
    const hasDays = status.daysLeft !== null && status.daysLeft !== undefined;

    if (!status.payerNickname && !hasDays && !showCard) return null;

    return (
        <div className="space-y-1 border-b border-border px-4 pb-3 pt-1 text-sm text-ink">
            {status.payerNickname && (
                <p>
                    <span className="text-ink-soft">Pagado por: </span>
                    <span className="font-semibold">{status.payerNickname}</span>
                </p>
            )}
            {hasDays && (
                <p>
                    <span className="text-ink-soft">{cancelled ? "Premium vence en: " : "Próximo cobro en: "}</span>
                    <span className="font-semibold">{formatDaysLeft(status.daysLeft as number)}</span>
                </p>
            )}
            {showCard && (
                <div className="mt-2 space-y-1 border-t border-border pt-2">
                    {status.cardLast4 && (
                        <p>
                            <span className="text-ink-soft">Tarjeta terminada en: </span>
                            <span className="font-semibold">{status.cardLast4}</span>
                        </p>
                    )}
                    {status.cardholderName && (
                        <p>
                            <span className="text-ink-soft">Titular: </span>
                            <span className="font-semibold">{status.cardholderName}</span>
                        </p>
                    )}
                    <p className="text-xs leading-snug text-ink-soft">
                        Esta información es privada: solo vos podés verla.
                    </p>
                </div>
            )}
        </div>
    );
}

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
    // Solo se promete la prueba si el backend confirma que al usuario y al grupo les corresponde; mientras no se sabe
    // o si la consulta falla, no se promete nada.
    const label = getTrialOffer(premiumStatus) === "available"
        ? "Probá Premium"
        : "Potenciá tu grupo con Premium";

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
                onClick={() => isPremium ? setIsMenuOpen((prev) => !prev) : navigate(PREMIUM_PATH)}
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
                <div className="absolute right-0 top-9 z-50 min-w-64 max-w-md rounded-lg border border-border bg-panel py-2 shadow-panel">
                    {premiumStatus.data && <PremiumDetails status={premiumStatus.data}/>}
                    <Link
                        href={PREMIUM_PATH}
                        onClick={() => setIsMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-ink hover:bg-muted"
                    >
                        Ver Premium
                    </Link>
                    {premiumStatus.data && premiumStatus.data.state !== "CANCELLED_IN_FORCE" && (
                        <button
                            type="button"
                            onClick={handleCancelPremium}
                            disabled={cancelPremium.isPending}
                            className="block w-full px-4 py-2 text-left text-sm text-destructive hover:bg-muted"
                        >
                            {cancelPremium.isPending ? "Cancelando..." : "Cancelar premium"}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
