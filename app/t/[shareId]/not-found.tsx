export default function TicketNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 bg-zinc-50 px-4 py-12 dark:bg-black">
      <h1 className="text-2xl font-semibold">Ticket no encontrado</h1>
      <p className="text-sm text-muted-foreground">Este enlace no existe o el ticket fue eliminado.</p>
    </div>
  );
}
