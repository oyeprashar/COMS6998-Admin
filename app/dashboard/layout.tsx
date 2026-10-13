import { Suspense } from "react";

export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode;
}) {
    return (
        <Suspense
            fallback={
                <main className="min-h-screen bg-black p-10 text-white">
                    Loading dashboard...
                </main>
            }
        >
            {children}
        </Suspense>
    );
}