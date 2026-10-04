import {faCalendarDays, faClipboardList, faMoneyBillWave,} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export interface LandingFeature {
    readonly icon: IconDefinition;
    readonly title: string;
    readonly copy: string;
    readonly tone: string;
}

export const LANDING_FEATURES: ReadonlyArray<LandingFeature> = [
    {
        icon: faCalendarDays,
        title: "Calendario compartido",
        copy: "Cada miembro ve y reserva sus días sin pisarse. Colores por persona, sin ambigüedades.",
        tone: "bg-custom-green",
    },
    {
        icon: faMoneyBillWave,
        title: "Gestión de gastos",
        copy: "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore.",
        tone: "bg-custom-orange",
    },
    {
        icon: faClipboardList,
        title: "Historial y decisiones",
        copy: "Consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim.",
        tone: "bg-custom-lilac",
    },
];

export interface LandingStep {
    readonly title: string;
    readonly copy: string;
}

export const LANDING_STEPS: ReadonlyArray<LandingStep> = [
    { title: "Creá tu grupo", copy: "Dale un nombre que lo represente." },
    {
        title: "Agregá tu bien",
        copy: "Consectetur adipiscing elit sed do eiusmod tempor. Ut enim ad minim veniam quis nostrud exercitation ullamco.",
    },
    {
        title: "Invitá a tu grupo",
        copy: "Compartiles el código de invitación para que se unan.",
    },
];

export interface LandingTestimonial {
    readonly initial: string;
    readonly name: string;
    readonly role: string;
    readonly quote: string;
    readonly tone: string;
    readonly avatar: string;
}

export const LANDING_TESTIMONIALS: ReadonlyArray<LandingTestimonial> = [
    {
        initial: "M",
        name: "María G.",
        role: "Propietaria, casa de playa",
        quote: "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        tone: "bg-olive/30",
        avatar: "bg-olive/55 text-foreground",
    },
    {
        initial: "R",
        name: "Roberto P.",
        role: "Miembro, cabaña familiar",
        quote: "Consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore. Ut enim ad minim veniam quis nostrud exercitation.",
        tone: "bg-custom-lilac/30",
        avatar: "bg-custom-lilac/55 text-foreground",
    },
    {
        initial: "C",
        name: "Carla M.",
        role: "Administradora del grupo",
        quote: "Sed do eiusmod tempor incididunt ut labore et dolore. Ut enim ad minim veniam quis nostrud ullamco laboris nisi aliquip.",
        tone: "bg-amber/30",
        avatar: "bg-amber/55 text-foreground",
    },
];

export type LandingStat = readonly [value: string, label: string];

export const LANDING_STATS: ReadonlyArray<LandingStat> = [
    ["2.400+ grupos", "activos"],
    ["18.000+ reservas", "coordinadas"],
    ["$12M+ gastos", "gestionados"],
    ["4.9 ★", "promedio"],
];