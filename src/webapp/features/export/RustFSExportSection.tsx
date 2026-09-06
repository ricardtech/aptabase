import { Button } from "@components/Button";
import { Switch } from "@components/Switch";
import { TextInput } from "@components/TextInput";
import { Application } from "@features/apps";
import { api } from "@fns/api";
import { IconCheck, IconCloudUpload, IconServer, IconTestPipe } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Props = {
  app: Application;
};

type S3SettingsData = {
  appId: string;
  s3Endpoint: string;
  s3Bucket: string;
  s3Region: string;
  s3AccessKey: string;
  s3SecretKey: string;
  enabled: boolean;
  lastExportedAt?: string;
};

export function RustFSExportSection({ app }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const [formData, setFormData] = useState<S3SettingsData>({
    appId: app.id,
    s3Endpoint: "",
    s3Bucket: "",
    s3Region: "us-east-1",
    s3AccessKey: "",
    s3SecretKey: "",
    enabled: true,
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await api.get<S3SettingsData>(`/api/apps/${app.id}/export/s3`);
        if (data) {
          setFormData({
            appId: app.id,
            s3Endpoint: data.s3Endpoint || "",
            s3Bucket: data.s3Bucket || "",
            s3Region: data.s3Region || "us-east-1",
            s3AccessKey: data.s3AccessKey || "",
            s3SecretKey: data.s3SecretKey || "",
            enabled: data.enabled ?? true,
            lastExportedAt: data.lastExportedAt,
          });
        }
      } catch (err) {
        console.error("Erro ao carregar configurações S3/RustFS:", err);
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
      await api.put(`/api/apps/${app.id}/export/s3`, formData);
      toast.success("Configurações do RustFS/S3 salvas com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!formData.s3Endpoint || !formData.s3Bucket) {
      toast.error("Informe o Endpoint e o Bucket do RustFS para testar.");
      return;
    }
    setTesting(true);
    try {
      const res = await api.post<{ success: boolean; message: string }>(`/api/apps/${app.id}/export/s3/test`, formData);
      toast.success(res.message || "Conexão com RustFS bem-sucedida!");
    } catch (err: any) {
      toast.error(err.message || "Falha na conexão com o RustFS / S3.");
    } finally {
      setTesting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="border rounded-lg p-5 space-y-4 bg-card shadow-sm mt-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400">
            <IconServer className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base">Exportação Automática para RustFS / S3</h3>
            <p className="text-xs text-muted-foreground">Armazenamento a frio (Cold Storage) de eventos brutos no seu storage RustFS</p>
          </div>
        </div>
        <Switch
          checked={formData.enabled}
          onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, enabled: checked }))}
        />
      </div>

      {formData.enabled && (
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Endpoint do RustFS / S3</label>
              <TextInput
                placeholder="https://s3.rustfs.seuservidor.com"
                value={formData.s3Endpoint}
                onChange={(e) => setFormData((prev) => ({ ...prev, s3Endpoint: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nome do Bucket</label>
              <TextInput
                placeholder="aptabase-events-coldstorage"
                value={formData.s3Bucket}
                onChange={(e) => setFormData((prev) => ({ ...prev, s3Bucket: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Região</label>
              <TextInput
                placeholder="us-east-1"
                value={formData.s3Region}
                onChange={(e) => setFormData((prev) => ({ ...prev, s3Region: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Access Key ID</label>
              <TextInput
                placeholder="rustfs_access_key"
                value={formData.s3AccessKey}
                onChange={(e) => setFormData((prev) => ({ ...prev, s3AccessKey: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Secret Access Key</label>
              <TextInput
                type="password"
                placeholder="••••••••••••••••"
                value={formData.s3SecretKey}
                onChange={(e) => setFormData((prev) => ({ ...prev, s3SecretKey: e.target.value }))}
              />
            </div>
          </div>

          {formData.lastExportedAt && (
            <p className="text-xs text-muted-foreground">
              Última sincronização com RustFS: {new Date(formData.lastExportedAt).toLocaleString("pt-BR")}
            </p>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button type="button" variant="outline" size="sm" onClick={handleTest} loading={testing}>
              <IconTestPipe className="h-4 w-4 mr-1.5" /> Testar Conexão RustFS
            </Button>
            <Button type="submit" loading={saving}>
              <IconCheck className="h-4 w-4 mr-1.5" /> Salvar Configuração RustFS
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
