export function Footer() {
    return (
        <footer
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 bg-footer px-6 py-6 text-primary-foreground md:px-12">
            <strong className="truncate text-base font-black">esnuestro</strong>
            <p className="text-right text-xs text-muted-foreground">
                © 2026 EsNuestro. Todos los derechos reservados.
            </p>
        </footer>
    );
}

export default Footer;