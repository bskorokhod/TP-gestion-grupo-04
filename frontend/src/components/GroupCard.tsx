const iconStyles = {
    lilac: "bg-group-lilac-soft before:bg-group-lilac",
    green: "bg-group-green-soft before:bg-group-green",
    amber: "bg-group-amber-soft before:bg-group-amber",
};

const badgeStyles = {
    expense: "bg-group-danger-soft text-group-danger",
    credit: "bg-group-credit-soft text-group-credit",
};

export default function GroupCard({name, members, icon, badges, turn}) {
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
            <div className="flex shrink-0 flex-col items-end gap-1">
                <div className="flex flex-wrap justify-end gap-2">
                    {badges.map((badge) => (
                        <span key={badge.label}
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeStyles[badge.kind]}`}>
              {badge.label}
            </span>
                    ))}
                </div>
                <p className="max-w-44 text-right text-xs text-group-muted">{turn}</p>
            </div>
        </article>
    );
}