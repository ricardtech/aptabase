import { Button } from "@components/Button";
import { Switch } from "@components/Switch";
import { TextInput } from "@components/TextInput";
import { Application } from "@features/apps";
import { api } from "@fns/api";
import { IconBrandTelegram, IconBrandWhatsapp, IconCheck, IconSend } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Props = {
  app: Application;
};

type AlertSettingsData = {
  appId: string;
  whatsGoUrl?: string;
  whatsGoInstance?: string;
  whatsGoToken?: string;
  whatsGoPhone?: string;
  whatsGoEnabled: boolean;
  telegramBotToken?: string;
  telegramChatId?: string;
  telegramEnabled: boolean;
  notifyCriticalErrors: boolean;
  notifyDailySummary: boolean;
};

export function AlertSettings({ app }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingWhatsGo, setTestingWhatsGo] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);

  const [formData, setFormData] = useState<AlertSettingsData>({
    appId: app.id,
    whatsGoUrl: "",
    whatsGoInstance: "default",
    whatsGoToken: "",
    whatsGoPhone: "",
    whatsGoEnabled: false,
    telegramBotToken: "",
    telegramChatId: "",
    telegramEnabled: false,
    notifyCriticalErrors: true,
    notifyDailySummary: true,
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await api.get<AlertSettingsData>(`/apps/${app.id}/alerts`);
        if (data) {
          setFormData({
            appId: app.id,
            whatsGoUrl: data.whatsGoUrl || "",
            whatsGoInstance: data.whatsGoInstance || "default",
            whatsGoToken: data.whatsGoToken || "",
            whatsGoPhone: data.whatsGoPhone || "",
            whatsGoEnabled: data.whatsGoEnabled || false,
            telegramBotToken: data.telegramBotToken || "",
            telegramChatId: data.telegramChatId || "",
            telegramEnabled: data.telegramEnabled || false,
            notifyCriticalErrors: data.notifyCriticalErrors ?? true,
            notifyDailySummary: data.notifyDailySummary ?? true,
          });
        }
      } catch (err) {
        console.error("Erro ao carregar configurações de alertas:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [app.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/apps/${app.id}/alerts`, formData);
      toast.success("Configurações de alerta salvas com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  };

  const handleTestWhatsGo = async () => {
    if (!formData.whatsGoUrl || !formData.whatsGoPhone) {
      toast.error("Preencha a URL da API e o Telefone de destino para testar o WhatsGo.");
      return;
    }
    setTestingWhatsGo(true);
    try {
      const res = await api.post<{ success: boolean; message: string }>(`/apps/${app.id}/alerts/test-whatsgo`, formData);
      toast.success(res.message || "Mensagem enviada com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Falha ao enviar mensagem pelo WhatsGo.");
    } finally {
      setTestingWhatsGo(false);
    }
  };

  const handleTestTelegram = async () => {
    if (!formData.telegramBotToken || !formData.telegramChatId) {
      toast.error("Preencha o Token do Bot e o Chat ID para testar o Telegram.");
      return;
    }
    setTestingTelegram(true);
    try {
      const res = await api.post<{ success: boolean; message: string }>(`/apps/${app.id}/alerts/test-telegram`, formData);
      toast.success(res.message || "Mensagem enviada com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Falha ao enviar mensagem pelo Telegram.");
    } finally {
      setTestingTelegram(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground p-4">Carregando configurações...</div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-2xl mt-4">
      {/* WhatsGo Section */}
      <div className="border rounded-lg p-5 space-y-4 bg-card shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <IconBrandWhatsapp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Notificações via WhatsGo (WhatsApp)</h3>
              <p className="text-xs text-muted-foreground">Envio direto de mensagens usando a API do WhatsGo</p>
            </div>
          </div>
          <Switch
            checked={formData.whatsGoEnabled}
            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, whatsGoEnabled: checked }))}
          />
        </div>

        {formData.whatsGoEnabled && (
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">URL da API WhatsGo</label>
              <TextInput
                placeholder="https://api.whatsgo.seuservidor.com"
                value={formData.whatsGoUrl}
                onChange={(e) => setFormData((prev) => ({ ...prev, whatsGoUrl: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Instância</label>
                <TextInput
                  placeholder="default"
                  value={formData.whatsGoInstance}
                  onChange={(e) => setFormData((prev) => ({ ...prev, whatsGoInstance: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">API Token / Secret Key</label>
                <TextInput
                  type="password"
                  placeholder="Token de autenticação"
                  value={formData.whatsGoToken}
                  onChange={(e) => setFormData((prev) => ({ ...prev, whatsGoToken: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Telefone de Destino (com DDI e DDD)</label>
              <TextInput
                placeholder="5511999999999"
                value={formData.whatsGoPhone}
                onChange={(e) => setFormData((prev) => ({ ...prev, whatsGoPhone: e.target.value }))}
              />
            </div>
            <div className="pt-1 flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={handleTestWhatsGo} loading={testingWhatsGo}>
                <IconSend className="h-4 w-4 mr-1.5" /> Testar WhatsGo
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Telegram Section */}
      <div className="border rounded-lg p-5 space-y-4 bg-card shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <IconBrandTelegram className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Notificações via Telegram Bot</h3>
              <p className="text-xs text-muted-foreground">Envio instantâneo para grupos ou conversas privadas</p>
            </div>
          </div>
          <Switch
            checked={formData.telegramEnabled}
            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, telegramEnabled: checked }))}
          />
        </div>

        {formData.telegramEnabled && (
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Bot Token</label>
              <TextInput
                type="password"
                placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                value={formData.telegramBotToken}
                onChange={(e) => setFormData((prev) => ({ ...prev, telegramBotToken: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Chat ID</label>
              <TextInput
                placeholder="-100123456789 ou 987654321"
                value={formData.telegramChatId}
                onChange={(e) => setFormData((prev) => ({ ...prev, telegramChatId: e.target.value }))}
              />
            </div>
            <div className="pt-1 flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={handleTestTelegram} loading={testingTelegram}>
                <IconSend className="h-4 w-4 mr-1.5" /> Testar Telegram
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Trigger Options */}
      <div className="border rounded-lg p-5 space-y-4 bg-card shadow-sm">
        <h3 className="font-semibold text-base">Gatilhos de Notificação</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between text-sm cursor-pointer">
            <div>
              <p className="font-medium">Erros Críticos em Tempo Real</p>
              <p className="text-xs text-muted-foreground">Dispara um alerta instantâneo quando ocorrerem falhas e exceções</p>
            </div>
            <Switch
              checked={formData.notifyCriticalErrors}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, notifyCriticalErrors: checked }))}
            />
          </label>
          <div className="border-t pt-3">
            <label className="flex items-center justify-between text-sm cursor-pointer">
              <div>
                <p className="font-medium">Resumo Diário às 08:00</p>
                <p className="text-xs text-muted-foreground">Envia métricas consolidadas e status do app todos os dias pela manhã</p>
              </div>
              <Switch
                checked={formData.notifyDailySummary}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, notifyDailySummary: checked }))}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" loading={saving}>
          <IconCheck className="h-4 w-4 mr-1.5" /> Salvar Configurações de Alertas
        </Button>
      </div>
    </form>
  );
}
