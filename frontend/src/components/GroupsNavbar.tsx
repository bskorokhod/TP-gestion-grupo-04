export default function GroupsNavbar() {
    return (
        <header className="border-b border-header-line bg-header shadow-xs backdrop-blur-xl">
            <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
                <a href="/groups" className="inline-flex items-center" aria-label="Es Nuestro, grupos">
                    <span className="font-display text-xl font-black leading-none text-group-heading">esnuestro</span>
                    <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true"/>
                </a>
                <a
                    href="/"
                    className="inline-flex min-h-12 items-center justify-center rounded-full bg-brand px-5 text-base text-brand-foreground transition-colors hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                    Cerrar sesión
                </a>
            </div>
        </header>
    );
}