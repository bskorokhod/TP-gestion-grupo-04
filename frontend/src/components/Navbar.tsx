import {Link} from "wouter";

import {CurrentGroupSwitcher} from "@/components/Navbars/CurrentGroupSwitcher.tsx";
import {LoggedInNavbar} from "@/components/Navbars/LoggedInNavbar.tsx";
import {LoggedOutNavbar} from "@/components/Navbars/LoggedOutNavbar.tsx";
import {useToken} from "@/contexts/TokenContext.tsx";

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
    const [tokenState] = useToken();
    const isLoggedOut = tokenState.state === "LOGGED_OUT";

    return (
        <header
            className="relative z-10 grid h-15 grid-cols-[minmax(0,1fr)_auto] items-center border-b border-header-line bg-header px-6 sm:px-13 lg:h-15 lg:px-16">
            <div className="flex min-w-0 items-center">
                <Brand/>
                {!isLoggedOut && <CurrentGroupSwitcher/>}
            </div>
            <nav className="flex shrink-0 items-center gap-4 sm:gap-8 lg:gap-12" aria-label="Cuenta">
                {isLoggedOut ? <LoggedOutNavbar/> : <LoggedInNavbar/>}
            </nav>
        </header>
    );
}
