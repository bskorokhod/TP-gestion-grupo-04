export function Button({ className = "", tone = "primary", ...props }) {
  const tones = {
    primary: "bg-primary text-primary-foreground hover:bg-primary-strong",
    success: "bg-success text-on-color hover:bg-success-strong",
    danger: "bg-danger text-on-color hover:bg-danger-strong",
    proposal: "bg-proposal text-on-color hover:bg-proposal-strong",
    muted: "bg-muted text-muted-foreground hover:bg-tint",
  };

  return (
    <button
      className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors ${tones[tone]} ${className}`}
      {...props}
    />
  );
}

const people = {
  Lucia: { label: "L", tone: "bg-avatar-red" },
  Pablo: { label: "P", tone: "bg-avatar-gold" },
  Diego: { label: "D", tone: "bg-avatar-lilac" },
  Rocio: { label: "R", tone: "bg-avatar-green" },
  Yo: { label: "Yo", tone: "bg-primary" },
};

export function Avatar({ name }) {
  const person = people[name];
  return (
    <span className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold text-on-color ${person.tone}`}>
      {person.label}
    </span>
  );
}

export function PersonRow({ name, paid = false, claim = false }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-tint px-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <Avatar name={name} />
        <span className="truncate text-xs font-medium">{name === "Rocio" ? "Rocío" : name}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${paid ? "bg-success text-on-color" : "bg-neutral-soft text-muted-foreground"}`}>
          {paid ? "Pagó" : "No pagó"}
        </span>
        {claim && <Button tone="danger" className="hidden sm:block">Reclamar pago</Button>}
      </div>
    </div>
  );
}

export function AmountTitle({ title, amount, tag }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium">
      <h3>{title}</h3>
      <span className="text-primary">{amount}</span>
      {tag && <span className="rounded-full bg-tint px-3 py-1 text-xs text-primary">{tag}</span>}
    </div>
  );
}

export function PeopleMeta({ assigned, owner }) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <span>Asignado a:</span>
        <span className="flex -space-x-1">{assigned.map((name) => <Avatar key={name} name={name} />)}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span>A cargo de:</span>
        <Avatar name={owner} />
      </div>
    </div>
  );
}

export function ExpenseCard({ children, className = "" }) {
  return <article className={`rounded-lg border border-primary/50 bg-card p-5 ${className}`}>{children}</article>;
}

export function SectionBanner({ title, description, tone, action }) {
  return (
    <div className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-3xl px-6 py-4 text-on-color ${tone === "success" ? "bg-success" : "bg-danger"}`}>
      <div className="min-w-0">
        <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
        <p className="mt-1 hidden text-xs sm:block">{description}</p>
      </div>
      {action && <Button className="shrink-0">{action}</Button>}
    </div>
  );
}

export function DebtCard({ title, amount, description, children }) {
  return (
    <ExpenseCard>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <AmountTitle title={title} amount={amount} />
        <button className="text-xs font-medium text-primary" aria-label={`Ver pagos de ${title}`}>2 de 3 pagaron⌄</button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{description}</p>
      <div className="mt-3 space-y-2">{children}</div>
    </ExpenseCard>
  );
}

export function OwedCard({ title, amount, description, assigned, owner, tag }) {
  return (
    <ExpenseCard className="flex min-h-48 flex-col justify-between">
      <div className="space-y-2">
        <AmountTitle title={title} amount={amount} tag={tag} />
        <p className="text-xs text-muted-foreground">{description}</p>
        <PeopleMeta assigned={assigned} owner={owner} />
      </div>
      <div className="mt-4 flex justify-end"><Button tone="success">Marcar como pagado</Button></div>
    </ExpenseCard>
  );
}

export function ProposalCard({ title, amount, description, assigned, owner, accepted = false }) {
  return (
    <ExpenseCard className="border-proposal">
      <div className="space-y-2">
        <AmountTitle title={title} amount={amount} />
        <p className="text-xs text-muted-foreground">{description}</p>
        <PeopleMeta assigned={assigned} owner={owner} />
      </div>
      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <button className="truncate text-left text-xs font-medium text-primary">Ver votos ({accepted ? "3 de 4" : "1 de 3"} votaron)⌄</button>
        <div className="flex shrink-0 gap-2">
          <Button tone={accepted ? "muted" : "success"}>{accepted ? "Aceptado" : "Aceptar"}</Button>
          <Button tone={accepted ? "muted" : "danger"}>{accepted ? "Cancelar" : "Rechazar"}</Button>
        </div>
      </div>
    </ExpenseCard>
  );
}

export function Navbar() {
  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
      <a href="#" className="flex items-center gap-1.5 text-xl font-black" aria-label="esnuestro, inicio">esnuestro<span className="size-1.5 rounded-full bg-brand" /></a>
      <nav className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
        <a href="#groups">Mis grupos</a>
        <a href="#logout" className="font-semibold text-brand">Cerrar sesión →</a>
      </nav>
    </header>
  );
}

export function SectionTabs({ historyIcon }) {
  return (
    <nav className="grid grid-cols-4 overflow-hidden bg-primary text-center text-on-color" aria-label="Secciones">
      {[
        ["Reservas", false], ["Historial", true], ["Balance", false], ["Configuración", false],
      ].map(([label, history]) => (
        <a key={String(label)} href={`#${String(label).toLowerCase()}`} className="flex min-w-0 items-center justify-center gap-2 rounded-b-3xl bg-success py-3 text-xs sm:text-base">
          {history && <img src={historyIcon} alt="" className="hidden size-5 sm:block" />}
          <span className="truncate">{label}</span>
        </a>
      ))}
    </nav>
  );
}
