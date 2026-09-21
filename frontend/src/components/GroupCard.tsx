const iconStyles = {
    lilac: "bg-custom-lilac/50 before:bg-custom-lilac",
    green: "bg-custom-green/50 before:bg-custom-green",
    orange: "bg-custom-orange/50 before:bg-custom-orange",
} as const;

export type GroupCardIcon = keyof typeof iconStyles;

export interface GroupCardProps {
    name: string;
    members: number;
    icon: GroupCardIcon;
    link: string;
}

export default function GroupCard({name, members, icon}: GroupCardProps) {
    return (
        <article className="flex min-h-24 items-center gap-5 rounded-xl bg-panel p-6 shadow-group sm:min-h-28">
            <div
                className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl before:h-5 before:w-5 before:rounded-full before:content-[''] ${iconStyles[icon]}`}
                aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-medium text-group-heading">{name}</h2>
                <p className="mt-1.5 text-xs text-group-muted">{members} miembros</p>
            </div>
        </article>
    );
}
