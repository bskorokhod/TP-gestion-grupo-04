import type {ReactNode} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faChartSimple, faClock, faGear, faHeart, faStar, type IconDefinition} from "@fortawesome/free-solid-svg-icons";
import {useLocation} from "wouter";
import premiumIllustration from "@/assets/premium.svg";

import Button from "@/components/Button.tsx";
import {CommonLayout} from "@/components/CommonLayout/CommonLayout.tsx";
import {useCurrentGroup} from "@/contexts/GroupContext.tsx";
import {useFormToasts} from "@/hooks/useFormToasts.ts";
import type {BackendError} from "@/hooks/useToast.ts";
import {cn} from "@/lib/cn.ts";
import {groupPremiumApplicationPath, groupReservationsPath} from "@/constants/routes.ts";
import {useCancelGroupPremium, useGetPremiumStatus} from "@/services/GroupServices.ts";

const benefits: ReadonlyArray<{ icon: IconDefinition; title: string; copy: string }> = [
    {icon: faGear, title: "Personalizá tu grupo", copy: "Accedé a las configuraciones exclusivas que mejor se adaptan a tu bien"},
    {icon: faChartSimple, title: "Consultá el balance", copy: "Revisá la evolución de gastos y el desglose por categorías"},
    {icon: faClock, title: "Examiná el historial", copy: "Inspeccioná el reporte histórico de todos los gastos de tu grupo"},
];

function scrollToPlans() {
    document.getElementById("planes")?.scrollIntoView({behavior: "smooth"});
}

function TrialLegend({price, trialLabel, className}: { price: string; trialLabel: string; className?: string }) {
    return (
        <p className={cn("text-xs leading-snug text-ink-soft", className)}>
            0 ARS por {trialLabel}. Después, cuesta {price} ARS*** al mes.<br/>
            La oferta solo está disponible si aún no probaste Premium.<br/>
            {/* TODO: completar el destino del link de Términos y condiciones */}
            Se aplican <a href="#" className="underline">Términos y condiciones</a>.<br/>
            *** + impuestos aplicables.
        </p>
    );
}

interface PlanActionsProps {
    label: string;
    pending: boolean;
    onPrimary: () => void;
}

function PlanActions({label, pending, onPrimary}: PlanActionsProps) {
    return (
        <>
            <Button type="button" variant="proposal" className="h-14 px-8 text-base font-bold" onClick={onPrimary} disabled={pending}>
                {pending ? "Cancelando..." : label}
            </Button>
            <Button type="button" variant="outline" className="h-14 rounded-full border-ink-soft bg-transparent px-8 text-base text-ink-soft shadow-none" onClick={scrollToPlans}>
                Comparar planes
            </Button>
        </>
    );
}

const planTones = {
    brand: {icon: "bg-brand/15 text-brand", accent: "text-brand", button: "default"},
    amber: {icon: "bg-amber/15 text-amber", accent: "text-amber", button: "proposal"},
} as const;

interface PlanCardProps {
    tone: keyof typeof planTones;
    icon: IconDefinition;
    name: string;
    actionLabel: string;
    onAction: () => void;
    actionDisabled?: boolean;
    price: string;
    priceNote?: string;
    features: ReactNode[];
    footer?: ReactNode;
}

function PlanCard({tone, icon, name, actionLabel, onAction, actionDisabled, price, priceNote, features, footer}: PlanCardProps) {
    const styles = planTones[tone];

    return (
        <article className="flex flex-col justify-start rounded-4xl bg-panel p-10 shadow-panel">
            <span className={cn("mx-auto mb-4 grid size-11 place-items-center rounded-lg", styles.icon)}>
                <FontAwesomeIcon icon={icon} aria-hidden/>
            </span>
            <h3 className="text-3xl font-semibold text-ink">esnuestro <span className={styles.accent}>{name}</span></h3>
            <p className="text-sm font-bold text-ink">{price}</p>

            {priceNote && <p className="text-xs text-ink-soft">{priceNote}</p>}

            <ul className="my-5 space-y-0.5 border-t border-ink-soft/20 pt-4 text-sm text-ink">
                {features.map((feature, index) => <li key={index}>• {feature}</li>)}
            </ul>

            <Button
                type="button"
                variant={styles.button}
                className="mt-auto h-12 w-full rounded-full text-lg font-bold shadow-none"
                onClick={onAction}
                disabled={actionDisabled}
            >
                {actionLabel}
            </Button>
            <div className="md:min-h-24">{footer}</div>
        </article>
    );
}

export function PremiumPlansScreen() {
    const group = useCurrentGroup();
    const [, navigate] = useLocation();
    const {showSuccessToast, showApiError} = useFormToasts();
    const status = useGetPremiumStatus(group.id);
    const cancel = useCancelGroupPremium(group.id);
    const premium = status.data?.premium ?? group.isPremium;
    const price = status.data?.monthlyPrice?.toLocaleString("es-AR") ?? "4.499";
    const trialDays = status.data?.trialDays ?? 7;
    const trialLabel = trialDays === 1 ? "1 día" : `${trialDays} días`;

    async function handleCancel() {
        try {
            const result = await cancel.mutateAsync();
            showSuccessToast(
                result.trial ? "Prueba cancelada" : "Premium cancelado",
                result.endsAt
                    ? `El grupo conserva Premium hasta el ${new Date(result.endsAt).toLocaleDateString("es-AR")}.`
                    : "El grupo volvió al plan gratuito.",
            );
            void status.refetch();
        } catch (error) {
            showApiError(error as BackendError, "No se pudo cancelar Premium");
        }
    }

    const primaryAction = premium ? handleCancel : () => navigate(groupPremiumApplicationPath(group.joinCode));
    const primaryLabel = premium ? "Cancelar premium" : `Probá ${trialLabel} por 0 ARS`;

    return (
        <CommonLayout className="min-h-screen bg-background text-foreground">
            <section className="login-backdrop">
                <div className="h-full mx-auto px-6 py-16 md:px-12 pb-0 flex flex-row">
                    <div className="space-y-6 h-full content-center ps-16 basis-2/3 pb-16">
                        <p className="text-3xl font-semibold text-ink mb-2">esnuestro <span className="text-amber">Premium</span></p>
                        <h1 className="max-w-3xl text-5xl font-black leading-none text-footer md:text-8xl">
                            El mejor lugar<br/>para<br/><em className="font-extrabold">compartir</em>
                        </h1>
                        <div className="mt-10 flex flex-wrap gap-4">
                            <PlanActions label={primaryLabel} pending={cancel.isPending} onPrimary={primaryAction}/>
                        </div>
                        <TrialLegend price={price} trialLabel={trialLabel} className="mt-4"/>
                    </div>

                    <div className="justify-center content-center basis-1/3">
                        <img
                            className="hidden md:block content-end"
                            src={premiumIllustration}
                            alt="EsNuestro Premium"
                        />
                    </div>
                </div>
            </section>

            <section className="bg-background px-6 py-24 text-center">
                <p className="text-3xl font-semibold text-ink">esnuestro <span className="text-amber">Premium</span></p>
                <h2 className="mt-1 text-4xl font-black text-ink md:text-6xl">Gestioná sin límites</h2>
                <div className="mx-auto mt-12 grid max-w-4xl gap-8 text-left md:grid-cols-3">
                    {benefits.map((benefit) => (
                        <article key={benefit.title} className="space-y-1 text-center">
                            <FontAwesomeIcon icon={benefit.icon} className="mb-2 text-4xl text-amber" aria-hidden/>
                            <h3 className="text-xl font-bold text-ink">{benefit.title}</h3>
                            <p className="text-base leading-relaxed text-ink">{benefit.copy}</p>
                        </article>
                    ))}
                </div>
                <div className="mt-8 flex flex-wrap justify-center gap-4">
                    <PlanActions label={primaryLabel} pending={cancel.isPending} onPrimary={primaryAction}/>
                </div>
                <TrialLegend price={price} trialLabel={trialLabel} className="mt-4"/>
            </section>

            <section id="planes" className="login-backdrop px-12 py-24">
                <div className="mx-auto max-w-5xl text-center">
                    <h2 className="text-4xl font-black text-ink md:text-6xl">Los que saben, gestionan acá</h2>
                    <p className="mt-4 text-3xl text-ink">Sumate ahora con <span className="font-bold text-amber">Premium</span></p>
                    <div className="mt-16 grid gap-12 text-left md:grid-cols-2 md:gap-16">
                        <PlanCard
                            tone="brand"
                            icon={faHeart}
                            name="Estándar"
                            price="0 ARS, siempre"
                            features={[
                                <>Un grupo <strong>Estándar</strong></>,
                                "Gestión de reservas",
                                "Gestión de gastos",
                            ]}
                            actionLabel="Empezá ahora gratis"
                            onAction={() => navigate(groupReservationsPath(group.joinCode))}
                        />
                        <PlanCard
                            tone="amber"
                            icon={faStar}
                            name="Premium"
                            price={`0 ARS por ${trialLabel}`}
                            priceNote={`Después, cuesta ${price} ARS*** al mes`}
                            features={[
                                <>Un grupo <strong>Premium</strong></>,
                                "Gestión de reservas",
                                "Gestión de gastos",
                                "Balance e historial",
                                "Personalización de configuraciones",
                                "Cancelá cuando quieras",
                            ]}
                            actionLabel={cancel.isPending ? "Cancelando..." : primaryLabel}
                            onAction={primaryAction}
                            actionDisabled={cancel.isPending}
                            footer={<TrialLegend price={price} trialLabel={trialLabel} className="mt-6 text-center"/>}
                        />
                    </div>
                </div>
            </section>
        </CommonLayout>
    );
}
