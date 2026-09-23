import type {ReactNode} from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";

export interface SectionHeadingProps {
    title: string;
    copy: string;
}

export function SectionHeading({title, copy}: SectionHeadingProps) {
    return (
        <header className="space-y-2 text-center">
            <h2 className="text-2xl font-black md:text-3xl">{title}</h2>
            <p className="text-base text-ink-soft">{copy}</p>
        </header>
    );
}

export type Stat = [value: ReactNode, label: string];

export interface StatsBarProps {
    stats: Stat[];
}

export function StatsBar({stats}: StatsBarProps) {
    return (
        <div className="mx-auto max-w-4xl px-6 py-10 bg-background">
            <div className="grid grid-cols-2 gap-5 rounded-2xl bg-muted px-6 py-5 shadow-pill md:grid-cols-4">
                {stats.map(([value, label]) => (
                    <div key={label} className="text-center md:border-r md:border-border md:last:border-0">
                        <strong className="block text-base">{value}</strong>
                        <span className="text-xs text-muted-foreground">{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export interface FeatureCardProps {
    icon: ReactNode;
    title: string;
    copy: string;
    tone: string;
}

export function FeatureCard({icon, title, copy, tone}: FeatureCardProps) {
    return (
        <article className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-soft">
            <div className={`grid size-11 place-items-center rounded-xl ${tone}`}>{icon}</div>
            <h3 className="text-base font-semibold">{title}</h3>
            <p className="text-xs leading-relaxed text-ink-soft">{copy}</p>
        </article>
    );
}

export interface StepCardProps {
    index: number | string;
    title: string;
    copy: string;
}

export function StepCard({index, title, copy}: StepCardProps) {
    return (
        <article className="min-h-32 rounded-bl-lg rounded-br-3xl rounded-tl-3xl rounded-tr-lg bg-card p-6 shadow-soft">
            <div className="mb-4 flex items-center gap-3">
        <span
            className="grid size-8 place-items-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
            {index}
            </span>
                <h3 className="text-base font-semibold">{title}</h3>
            </div>
            <p className="text-xs leading-relaxed text-ink-soft">{copy}</p>
        </article>
    );
}

export interface TestimonialCardProps {
    initial: string;
    name: string;
    role: string;
    quote: string;
    tone: string;
    avatar: string;
}

export function TestimonialCard({initial, name, role, quote, tone, avatar}: TestimonialCardProps) {
    return (
        <article className={`rounded-bl-3xl rounded-br-lg rounded-tl-lg rounded-tr-3xl p-6 ${tone}`}>
            <p className="mb-4 flex items-center gap-0.5 text-xs text-amber">
                {Array.from({ length: 5 }).map((_, index) => (
                    <FontAwesomeIcon key={index} icon={faStar} className="h-3 w-3" />
                ))}
            </p>
            <blockquote className="mb-5 text-xs leading-relaxed">“{quote}”</blockquote>
            <div className="flex items-center gap-3">
    <span className={`grid size-8 place-items-center rounded-full text-xs font-medium ${avatar}`}>
    {initial}
    </span>
                <div>
                    <h3 className="text-xs font-semibold">{name}</h3>
                    <p className="text-xs text-ink-soft">{role}</p>
                </div>
            </div>
        </article>
    );
}
