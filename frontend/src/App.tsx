import {QueryClientProvider} from "@tanstack/react-query";

import {Navigation} from "@/Navigation";
import {appQueryClient} from "@/config/app-query-client";
import {TokenProvider} from "@/contexts/TokenContext.tsx";
import {Toaster} from "@/components/ui/Toaster.tsx";

export function App() {
    return (
        <QueryClientProvider client={appQueryClient}>
            <TokenProvider>
                <Navigation/>
                <Toaster/>
            </TokenProvider>
        </QueryClientProvider>
    );
}
