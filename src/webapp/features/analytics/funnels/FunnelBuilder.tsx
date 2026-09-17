import { Button } from "@components/Button";
import { IconPlus, IconSparkles, IconTrash, IconX } from "@tabler/icons-react";

type Props = {
  availableEvents: string[];
  selectedSteps: string[];
  onChangeSteps: (steps: string[]) => void;
  conversionWindow: string;
  onChangeConversionWindow: (window: string) => void;
};

export function FunnelBuilder({
  availableEvents,
  selectedSteps,
  onChangeSteps,
  conversionWindow,
  onChangeConversionWindow,
}: Props) {
  const addStep = () => {
    // Escolhe o próximo evento disponível que ainda não está selecionado
    const nextEvent = availableEvents.find((e) => !selectedSteps.includes(e)) || availableEvents[0] || "";
    if (nextEvent) {
      onChangeSteps([...selectedSteps, nextEvent]);
    }
  };

  const removeStep = (index: number) => {
    if (selectedSteps.length <= 2) return;
    const newSteps = [...selectedSteps];
    newSteps.splice(index, 1);
    onChangeSteps(newSteps);
  };

  const updateStep = (index: number, value: string) => {
    const newSteps = [...selectedSteps];
    newSteps[index] = value;
    onChangeSteps(newSteps);
  };

  // Presets inteligentes automáticos
  const presets: Array<{ name: string; steps: string[] }> = [];

  // Preset 1: Loja de APKs
  if (
    availableEvents.some((e) => e.toLowerCase().includes("loja")) &&
    availableEvents.some((e) => e.toLowerCase().includes("download"))
  ) {
    const lojaEvent = availableEvents.find((e) => e.toLowerCase().includes("loja"))!;
    const downloadEvent = availableEvents.find((e) => e.toLowerCase().includes("download"))!;
    presets.push({
      name: "Fluxo de Download (Loja)",
      steps: [lojaEvent, downloadEvent],
    });
  }

  // Preset 2: Play Max / Streaming de Vídeo
  if (
    availableEvents.some((e) => e.toLowerCase().includes("abertura")) &&
    availableEvents.some((e) => e.toLowerCase().includes("reproduzir canal") || e.toLowerCase().includes("reproduzir"))
  ) {
    const openEvent = availableEvents.find((e) => e.toLowerCase().includes("abertura"))!;
    const sessEvent = availableEvents.find((e) => e.toLowerCase().includes("sessão iniciada")) || "";
    const playEvent = availableEvents.find((e) => e.toLowerCase().includes("reproduzir canal")) || availableEvents.find((e) => e.toLowerCase().includes("reproduzir"))!;
    
    presets.push({
      name: "Fluxo de Reprodução (Play Max)",
      steps: sessEvent ? [openEvent, sessEvent, playEvent] : [openEvent, playEvent],
    });
  }

  // Preset 3: Gestor de Clientes / Painel
  if (
    availableEvents.some((e) => e.toLowerCase().includes("acesso") || e.toLowerCase().includes("login")) &&
    availableEvents.some((e) => e.toLowerCase().includes("navegação") || e.toLowerCase().includes("edição"))
  ) {
    const loginEvent = availableEvents.find((e) => e.toLowerCase().includes("acesso") || e.toLowerCase().includes("login"))!;
    const navEvent = availableEvents.find((e) => e.toLowerCase().includes("navegação") || e.toLowerCase().includes("edição"))!;
    presets.push({
      name: "Fluxo de Engajamento (Gestor)",
      steps: [loginEvent, navEvent],
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card/60 p-5 backdrop-blur-sm shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Definição das Etapas do Funil</h3>
          <p className="text-xs text-muted-foreground">
            Escolha os eventos na ordem em que o usuário deve realizá-los
          </p>
        </div>

        {/* Seletor da Janela de Conversão */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Janela de Conversão:</span>
          <select
            value={conversionWindow}
            onChange={(e) => onChangeConversionWindow(e.target.value)}
            className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="1800">30 Minutos</option>
            <option value="3600">1 Hora</option>
            <option value="86400">24 Horas</option>
            <option value="604800">7 Dias</option>
            <option value="2592000">30 Dias</option>
          </select>
        </div>
      </div>

      {/* Modelos / Presets Rápidos */}
      {presets.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
            <IconSparkles className="h-3.5 w-3.5 text-amber-500" />
            Sugestões Rápidas:
          </span>
          {presets.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => onChangeSteps(preset.steps)}
              className="rounded-full border border-border/80 bg-secondary/40 px-3 py-1 text-xs font-medium text-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
            >
              {preset.name}
            </button>
          ))}
        </div>
      )}

      {/* Lista de Etapas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
        {selectedSteps.map((step, index) => (
          <div
            key={index}
            className="relative flex flex-col rounded-lg border border-border/80 bg-secondary/30 p-3 transition-all hover:border-border"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-primary">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">
                  {index + 1}
                </span>
                Etapa {index + 1}
              </span>

              {selectedSteps.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeStep(index)}
                  className="text-muted-foreground hover:text-rose-500 transition-colors p-1"
                  title="Remover esta etapa"
                >
                  <IconX className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <select
              value={step}
              onChange={(e) => updateStep(index, e.target.value)}
              className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary truncate"
            >
              {availableEvents.map((evt) => (
                <option key={evt} value={evt}>
                  {evt}
                </option>
              ))}
            </select>
          </div>
        ))}

        {/* Botão Adicionar Etapa */}
        {selectedSteps.length < 8 && (
          <button
            type="button"
            onClick={addStep}
            className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/80 bg-background/40 p-4 text-xs font-medium text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all min-h-[85px]"
          >
            <IconPlus className="h-4 w-4 mb-1" />
            <span>Adicionar Etapa</span>
          </button>
        )}
      </div>
    </div>
  );
}
