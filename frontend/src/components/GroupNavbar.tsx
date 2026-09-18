import {Link, useLocation} from "wouter";
import {GROUP_PAGES, GroupNavbarProps} from "@/constants/navigation.ts"


export function GroupNavbar({groupId = "123-ABC-123", groupName = "Casa Madryn"}: GroupNavbarProps) {
    const [location] = useLocation();

    const activePage = GROUP_PAGES.find((page) =>
        location.endsWith(page.pathSuffix)
    ) || GROUP_PAGES[1];

    return (
        <div>
            <nav
                className="grid grid-cols-4 overflow-hidden bg-brand text-center text-brand-foreground"
                aria-label="Secciones"
            >
                {GROUP_PAGES.map((page) => {
                    const href = `/grupos/${groupId}${page.pathSuffix}`;
                    const isActive = location.endsWith(page.pathSuffix);

                    return (
                        <Link
                            key={page.key}
                            href={href}
                            className={`flex min-w-0 items-center justify-center gap-2 rounded-b-3xl py-3 text-xs transition-colors sm:text-base ${
                                isActive
                                    ? "bg-primary font-semibold text-primary-foreground"
                                    : "bg-group-green text-brand-foreground hover:brightness-105"
                            }`}
                        >
                            {!isActive && <span className="truncate">{page.label}</span>}
                            {isActive && (<span className="truncate font-bold"> <span className="hidden sm:inline">{page.label}</span></span>)}
                        </Link>
                    );
                })}
            </nav>

            <section className="rounded-bl-4xl bg-brand px-5 py-8 text-brand-foreground sm:px-8 lg:px-30">
                <div className="mx-auto grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_auto]">
                    <div className="min-w-0">
                        <p className="text-base text-brand-foreground/70">
                            Bienvenid@ otra vez,
                        </p>
                        <h1 className="mt-1 text-4xl font-black sm:text-5xl">{groupName}</h1>

                        <p className="mt-2 text-base text-brand-foreground/70">
                            {activePage.description}
                        </p>
                    </div>

                    <div
                        className="grid grid-cols-3 divide-x divide-brand/20 rounded-full bg-panel px-6 py-4 text-foreground shadow-panel sm:px-8">
                        <div className="pr-5">
                            <strong className="block text-xl font-black text-group-danger sm:text-2xl">
                                $11.500
                            </strong>
                            <span className="text-xs font-medium uppercase text-brand"> Debés </span>
                        </div>
                        <div className="px-5">
                            <strong className="block text-xl font-black text-group-green sm:text-2xl">
                                $25.000
                            </strong>
                            <span className="text-xs font-medium uppercase text-brand"> Te deben </span>
                        </div>
                        <div className="pl-5">
                            <strong className="block text-xl font-black text-brand sm:text-2xl">
                                2
                            </strong>
                            <span className="text-xs font-medium uppercase text-brand"> Gastos propuestos </span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}