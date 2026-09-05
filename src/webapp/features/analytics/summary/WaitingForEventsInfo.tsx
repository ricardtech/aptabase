import { PingSignal } from "@components/PingSignal";

export function WaitingForEventsInfo() {
  return (
    <>
      <PingSignal color="success" size="sm" />
      <div>
        <p className="text-center">Aguardando o primeiro evento...</p>
        <p className="text-center text-muted-foreground">Clique para saber mais</p>
      </div>
    </>
  );
}
