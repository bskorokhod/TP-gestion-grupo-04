export function SectionHeading({title, copy}) {
    return (
        <header className="space-y-2 text-center">
            <h2 className="text-2xl font-black md:text-3xl">{title}</h2>
            <p className="text-sm text-ink-soft">{copy}</p>
        </header>
    );
}

export function StatsBar({stats}) {
    return (
        <div className="mx-auto max-w-4xl px-6 py-10">
            <div className="grid grid-cols-2 gap-5 rounded-2xl bg-muted px-6 py-5 shadow-pill md:grid-cols-4">
                {stats.map(([value, label]) => (
                    <div key={value} className="text-center md:border-r md:border-border md:last:border-0">
                        <strong className="block text-sm">{value}</strong>
                        <span className="text-xs text-muted-foreground">{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function FeatureCard({icon, title, copy, tone}) {
    return (
        <article className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-soft">
            <div className={`grid size-11 place-items-center rounded-xl ${tone}`}>{icon}</div>
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="text-xs leading-relaxed text-ink-soft">{copy}</p>
        </article>
    );
}

export function StepCard({index, title, copy}) {
    return (
        <article className="min-h-32 rounded-bl-lg rounded-br-3xl rounded-tl-3xl rounded-tr-lg bg-card p-6 shadow-soft">
            <div className="mb-4 flex items-center gap-3">
        <span
            className="grid size-8 place-items-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
            {index}
            </span>
                <h3 className="text-sm font-semibold">{title}</h3>
            </div>
            <p className="text-xs leading-relaxed text-ink-soft">{copy}</p>
        </article>
    );
}

export function TestimonialCard({initial, name, role, quote, tone, avatar}) {
    return (
        <article className={`rounded-bl-3xl rounded-br-lg rounded-tl-lg rounded-tr-3xl p-6 ${tone}`}>
            <p className="mb-4 text-xs text-amber">★★★★★</p>
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