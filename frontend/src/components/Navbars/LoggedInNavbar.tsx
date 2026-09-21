import {useEffect, useRef, useState} from "react";
import {Link} from "wouter";

import {ChevronDownIcon, UserIcon} from "@/components/Icons.tsx";
import {EDIT_PROFILE_LINK, GROUPS_LINK} from "@/constants/navbar.ts";
import {useLogout} from "@/services/AuthServices.ts";
import {useGetUserProfile} from "@/services/UserServices.ts";

export function LoggedInNavbar() {
    const logOut = useLogout();
    const {data: profile, isLoading} = useGetUserProfile();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const closeMenu = () => setIsMenuOpen(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                closeMenu();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const greeting = profile ? `Hola, ${profile.name} ${profile.surname}!` : "Hola!";

    return (
        <div className="relative flex items-center gap-3" ref={menuRef}>
            <span className="hidden text-base font-medium text-ink sm:inline">{greeting}</span>

            <button
                onClick={() => setIsMenuOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
                aria-label="Abrir menú de cuenta"
                className="flex items-center gap-1 rounded-full transition-opacity hover:opacity-80"
            >
                <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-ink">
                    {isLoading ? (
                        <span className="h-full w-full animate-pulse rounded-full bg-muted"/>
                    ) : profile?.photoUrl ? (
                        <img
                            src={profile.photoUrl}
                            alt={`${profile.name} ${profile.surname}`}
                            className="h-full w-full rounded-full object-cover"
                        />
                    ) : (
                        <UserIcon/>
                    )}
                </span>
                <ChevronDownIcon/>
            </button>

            {isMenuOpen && (
                <div
                    role="menu"
                    className="absolute right-0 top-12 z-50 min-w-50 rounded-lg border border-border bg-panel py-2 shadow-panel animate-in fade-in zoom-in-95 duration-150"
                >
                    <Link
                        key={GROUPS_LINK.to}
                        href={GROUPS_LINK.to}
                        onClick={closeMenu}
                        className="block px-4 py-2 text-sm text-ink transition-colors hover:bg-muted"
                    >
                        {GROUPS_LINK.label}
                    </Link>

                    <Link
                        key={EDIT_PROFILE_LINK.to}
                        href={EDIT_PROFILE_LINK.to}
                        onClick={closeMenu}
                        className="block px-4 py-2 text-sm text-ink transition-colors hover:bg-muted"
                    >
                        {EDIT_PROFILE_LINK.label}
                    </Link>

                    <button
                        onClick={logOut}
                        className="block w-full px-4 py-2 text-left text-sm text-destructive transition-colors hover:bg-muted"
                    >
                        Cerrar sesión
                    </button>
                </div>
            )}
        </div>
    );
}
