import {Link} from "wouter";

import {LOGIN_LINK, SIGNUP_LINK} from "@/constants/navbar.ts";

export function LoggedOutNavbar() {
    return (
        <>
            <Link key={LOGIN_LINK.to} href={LOGIN_LINK.to} className="hidden text-base font-medium text-brand sm:inline">
                {LOGIN_LINK.label}
            </Link>

            <Link
                key={SIGNUP_LINK.to}
                href={SIGNUP_LINK.to}
                className="inline-flex h-9 items-center justify-center rounded-full bg-brand px-5 text-base font-medium text-brand-foreground transition-colors hover:bg-brand-hover sm:h-9 sm:px-7 sm:text-base"
            >
                {SIGNUP_LINK.label}
            </Link>
        </>
    );
}
