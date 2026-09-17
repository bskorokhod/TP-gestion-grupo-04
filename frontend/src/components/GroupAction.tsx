export default function GroupAction({children, variant = "filled", href = "#"}) {
    const variants = {
        filled: "border-group-paper bg-group-paper text-brand hover:bg-panel",
        outlined: "border-group-paper/60 text-group-paper hover:bg-group-paper/10",
    };

    return (
        <a
            href={href}
            className={`inline-flex min-h-12 items-center justify-center rounded-full border px-5 text-base font-normal transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-group-paper ${variants[variant]}`}
        >
            {children}
        </a>
    );
}