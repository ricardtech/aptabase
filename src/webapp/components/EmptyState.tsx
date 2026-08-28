export function EmptyState() {
  return (
    <div className="bg-muted rounded w-full h-full flex flex-col space-y-1 items-center justify-center p-6 text-center">
      <p className="text-lg font-medium">Nenhum Dado</p>
      <p className="text-sm text-muted-foreground">
        Não há dados disponíveis para o período ou filtros selecionados.
      </p>
    </div>
  );
}
