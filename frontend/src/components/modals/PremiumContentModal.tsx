import {createPortal} from "react-dom";
import {useLocation} from "wouter";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faStar} from "@fortawesome/free-solid-svg-icons";

import Button from "@/components/Button.tsx";
import {groupPremiumApplicationPath} from "@/constants/routes.ts";
import {useDismissibleModal} from "@/components/modals/useDismissibleModal.ts";
import {useCurrentGroup} from "@/contexts/GroupContext.tsx";
import {getTrialOffer} from "@/lib/premium.ts";
import {useGetPremiumEligibility} from "@/services/GroupServices.ts";

interface PremiumContentModalProps {
    readonly groupCode: string;
    readonly onClose?: () => void;
    readonly title?: string;
    readonly description?: string;
    readonly contained?: boolean;
    readonly lockScroll?: boolean;
    readonly dimBackground?: boolean;
}

export function PremiumContentModal({
    groupCode,
    onClose,
    title = "Contenido premium",
    description = "El acceso a esta funcionalidad solo está disponible para grupos premium.",
    contained = false,
    lockScroll = true,
    dimBackground = true,
}: PremiumContentModalProps) {
    const [, navigate] = useLocation();
    useDismissibleModal(onClose, lockScroll);

    // Solo se promete la prueba gratuita si al usuario y al grupo les corresponde; si no (o mientras no se sabe), se
    // ofrece activar el plan. La pantalla de destino vuelve a consultarlo, así que no hace falta esperar la respuesta.
    const group = useCurrentGroup();
    const trialOffer = getTrialOffer(useGetPremiumEligibility(group.id));
    const actionLabel = trialOffer === "available" ? "Comenzar prueba gratuita" : "Activar premium";

    const modal = (
        <div
            className={`${contained ? "absolute z-30" : "fixed z-100"} inset-0 flex items-center justify-center p-4 backdrop-blur-md ${dimBackground ? "bg-black/35" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="premium-modal-title"
            onClick={onClose}
        >
            <div
                className="w-full max-w-sm rounded-3xl border border-amber/40 bg-panel p-8 text-center shadow-2xl"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-amber/15 text-amber">
                    <FontAwesomeIcon icon={faStar} className="size-4"/>
                </div>
                <h2 id="premium-modal-title" className="mt-4 text-xl font-black text-ink">
                    {title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-warm-muted">
                    {description}
                </p>
                <Button
                    type="button"
                    size="lg"
                    className="mt-6 w-full bg-amber text-sm font-semibold text-panel hover:bg-amber/90"
                    onClick={() => navigate(groupPremiumApplicationPath(groupCode))}
                >
                    {actionLabel}
                </Button>
            </div>
        </div>
    );

    return contained ? modal : createPortal(
        modal,
        document.body,
    );
}
