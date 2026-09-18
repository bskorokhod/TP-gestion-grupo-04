import {Link} from "wouter";

export function Brand() {
    return (
        <Link className="inline-flex items-center" aria-label="Es Nuestro, inicio" key="inicio" href="/">
          <span className="font-display text-[17px] font-extrabold leading-none text-ink sm:text-[19px]">
            esnuestro
          </span>
                <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true"/>
        </Link>
    );
}

export default function Navbar() {
    return (
        <header
            className="relative z-10 grid h-15 grid-cols-[minmax(0,1fr)_auto] items-center border-b border-header-line bg-header px-6 sm:px-13 lg:h-15 lg:px-16">
            <Brand/>
            <nav className="flex shrink-0 items-center gap-4 sm:gap-8 lg:gap-12" aria-label="Acceso">
                <Link key="iniciar-sesion" href="/login" className="hidden text-base font-medium text-brand sm:inline">
                    Iniciar sesión
                </Link>

                <Link
                    key="crear-cuenta"
                    href="/signup"
                    className="inline-flex h-9 items-center justify-center rounded-full bg-brand px-5 text-base font-medium text-brand-foreground transition-colors hover:bg-brand-hover sm:h-9 sm:px-7 sm:text-base"
                >
                    Crear cuenta
                </Link>
            </nav>
        </header>
    );
}
