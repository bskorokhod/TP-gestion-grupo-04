import {useEffect, useRef, useState} from "react";
import {Link, useRoute} from "wouter";

import {ChevronDownIcon} from "@/components/Icons.tsx";
import {useGetGroups} from "@/services/GroupServices.ts";

const GROUP_ROUTE_PATTERN = "/grupos/:id/*";

const groupHref = (groupId: number) => `/grupos/${groupId}/gastos`;

export function CurrentGroupSwitcher() {
    const [, routeParams] = useRoute(GROUP_ROUTE_PATTERN);
    const {data: groups, isLoading} = useGetGroups();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!routeParams) {
        return null;
    }

    if (isLoading) {
        return (
            <div className="ml-2 flex items-center gap-2 border-l border-header-line pl-3">
                <span className="h-4 w-24 animate-pulse rounded bg-muted" aria-hidden="true"/>
            </div>
        );
    }

    const currentGroupId = routeParams.id;
    const currentGroup = groups?.find((group) => String(group.id) === currentGroupId);

    if (!currentGroup) {
        return null;
    }

    const otherGroups = groups?.filter((group) => String(group.id) !== currentGroupId) ?? [];

    return (
        <div className="relative flex min-w-0 items-center pl-3" ref={menuRef}>
            <button
                onClick={() => setIsMenuOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
                aria-label={`Grupo actual: ${currentGroup.name}. Cambiar de grupo`}
                className="flex min-w-0 items-center gap-1 text-sm font-medium text-ink transition-colors hover:text-brand sm:text-base"
            >
                <span className="max-w-32 truncate sm:max-w-60">{currentGroup.name}</span>
                <ChevronDownIcon/>
            </button>

            {isMenuOpen && (
                <div
                    role="menu"
                    className="absolute left-0 top-8 z-50 min-w-50 rounded-lg border border-border bg-panel py-2 shadow-panel animate-in fade-in zoom-in-95 duration-150"
                >
                    {otherGroups.length > 0 ? (
                        otherGroups.map((group) => (
                            <Link
                                key={group.id}
                                href={groupHref(group.id)}
                                onClick={() => setIsMenuOpen(false)}
                                className="block truncate px-4 py-2 text-sm text-ink transition-colors hover:bg-muted"
                            >
                                {group.name}
                            </Link>
                        ))
                    ) : (
                        <p className="px-4 py-2 text-sm text-muted-foreground">No tenés otros grupos</p>
                    )}
                </div>
            )}
        </div>
    );
}
