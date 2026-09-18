import type {ReactNode} from "react";

import {ErrorBoundary} from "@/components/ErrorBoundary/ErrorBoundary";
import Navbar from "@/components/Navbar.tsx";

export interface CommonLayoutProps {
    children: ReactNode;
    className?: string;
}

export const CommonLayout = ({children, className}: CommonLayoutProps) => {
    return (
        <main className={className}>
            <Navbar/>
            <ErrorBoundary>{children}</ErrorBoundary>
        </main>
    );
};
