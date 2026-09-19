export default function PendingDecisions() {
    return (
        <aside className="rounded-tl-3xl rounded-tr-lg rounded-bl-lg rounded-br-3xl bg-panel p-5 shadow-group"
               aria-labelledby="pending-title">
            <h2 id="pending-title" className="text-xl font-bold text-group-heading">
                Solicitudes pendientes
            </h2>

            <div className="p-4 text-center w-full">
                <p className="text-lg font-medium text-group-muted">¡Estás al día!</p>
                <p className="text-base text-group-muted">No tenes invitaciones a grupos pendientes</p>

            </div>

        </aside>
    );
}