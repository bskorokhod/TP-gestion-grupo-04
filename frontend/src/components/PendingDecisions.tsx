const items = [
    {mark: "$", title: "Poda de árboles", detail: "$18.000 · Casa Madryn", kind: "expense"},
    {mark: "$", title: "GTA VI", detail: "$62.000 – Cuenta Steam", kind: "expense"},
    {mark: "R", title: "Reclamo de saldo", detail: "Rocío · PS5", kind: "request"},
];

export default function PendingDecisions() {
    return (
        <aside className="rounded-tl-3xl rounded-tr-lg rounded-bl-lg rounded-br-3xl bg-panel p-5 shadow-group"
               aria-labelledby="pending-title">
            <h2 id="pending-title" className="text-base font-medium text-group-heading">
                Pendientes de decisión
            </h2>
            <ul className="mt-3.5 space-y-3.5">
                {items.map((item) => (
                    <li key={item.title} className="flex items-center gap-3">
            <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                    item.kind === "expense"
                        ? "bg-group-danger-soft text-group-danger"
                        : "bg-group-lilac-faint text-group-request"
                }`}
                aria-hidden="true"
            >
              {item.mark}
            </span>
                        <div className="min-w-0">
                            <p className="text-xs font-medium text-group-heading">{item.title}</p>
                            <p className="mt-0.5 text-xs text-group-muted">{item.detail}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </aside>
    );
}