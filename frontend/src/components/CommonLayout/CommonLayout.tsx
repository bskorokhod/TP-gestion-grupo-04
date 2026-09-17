import {ErrorBoundary} from "@/components/ErrorBoundary/ErrorBoundary";
import Navbar from "@/components/Navbar.tsx";

export const CommonLayout = ({children, main_style}: any) => {
    return (
        <main className={main_style}>
            <div>
                <Navbar/>
                <ErrorBoundary>{children}</ErrorBoundary>
            </div>
        </main>
    );
};
