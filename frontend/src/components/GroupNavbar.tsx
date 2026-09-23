import { Link, useLocation } from "wouter";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

import {GROUP_PAGES, GroupNavbarProps, PAGES_NAVBAR_DATA, Routes} from "@/constants/navigation.ts"
import {useCurrentGroup} from "@/contexts/GroupContext.tsx";


export function GroupNavbar({children, groupName: groupNameProp}: GroupNavbarProps) {
    const [location] = useLocation();
    // Las pantallas de grupo viven bajo GroupGuard: el grupo (y su código de URL) sale del contexto.
    const group = useCurrentGroup();
    // Un `groupName` explícito (incluso "") tiene prioridad; "" hace que se muestre el título de la página.
    const groupName = groupNameProp ?? group.name;

    console.log(location.split("/").at(-1));

    const pageText = PAGES_NAVBAR_DATA[location.split("/").at(-1) as Routes]
    const handleGoBack = () => { window.history.back(); };

    return (
        <div>
            <nav
                className="grid grid-cols-4 overflow-hidden bg-brand text-center text-brand-foreground"
                aria-label="Secciones"
            >
                {GROUP_PAGES.map((page) => {
                    const href = `/grupos/${group.joinCode}${page.pathSuffix}`;
                    const isActive = pageText.activeTabKey == page.key;

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
                        {pageText.goBackBtn?
                            <p onClick={handleGoBack} className="flex items-center gap-1.5 cursor-pointer text-sm font-medium hover:underline focus:outline-none pb-4">
                                <FontAwesomeIcon icon={faArrowLeft} className="h-3.5 w-3.5" />
                                Volver
                            </p>
                            :
                            <p className="text-base text-brand-foreground/70 pb-1"> Bienvenid@ otra vez </p>
                        }

                        <h1 className="mt-1 text-4xl font-black sm:text-5xl pb-2">{groupName? groupName : pageText.title}</h1>

                        <p className="mt-2 text-base text-brand-foreground/90 max-w-1/2"> {pageText.description} </p>
                    </div>

                    {children}

                </div>
            </section>
        </div>
    );
}
