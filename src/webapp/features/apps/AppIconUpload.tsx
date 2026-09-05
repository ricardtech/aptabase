import { Button } from "@components/Button";
import { IconCube } from "@tabler/icons-react";
import { useRef, useState } from "react";
import { AppIcon } from "./AppIcon";

type ImageDetails = {
  src: string;
  contentAsBase64: string;
};

async function processImageFile(file: File): Promise<ImageDetails> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function () {
      const img = new Image();
      img.src = reader.result as string;
      img.onload = function () {
        const size = 128;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject("Não foi possível processar a imagem.");
          return;
        }

        // Auto center-crop to square
        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;

        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);

        const dataUrl = canvas.toDataURL("image/png");
        const base64 = dataUrl.split(",")[1];

        resolve({
          src: dataUrl,
          contentAsBase64: base64,
        });
      };
      img.onerror = function () {
        reject("Arquivo de imagem inválido ou corrompido.");
      };
    };
    reader.onerror = function () {
      reject("Erro ao ler o arquivo de imagem.");
    };
  });
}

type Props = {
  iconPath: string;
  onIconChanged: (contentAsBase64: string) => void;
};

export function AppIconUpload(props: Props) {
  const [imgSrc, setImgSrc] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleClick() {
    inputRef.current?.click();
  }

  async function handleFileChanged(event: React.ChangeEvent<HTMLInputElement>) {
    setError("");

    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("O tamanho do arquivo deve ser menor que 10MB.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecione um arquivo de imagem válido (PNG, JPG, WebP, SVG).");
      return;
    }

    try {
      setIsProcessing(true);
      const details = await processImageFile(file);
      setImgSrc(details.src);
      props.onIconChanged(details.contentAsBase64);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : err.toString());
    } finally {
      setIsProcessing(false);
      // Reset input value so same file can be selected again if needed
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <label className="text-sm mb-2 block font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        Ícone
      </label>
      <div className="flex gap-3 items-center">
        <div className="relative flex-shrink-0">
          {imgSrc ? (
            <img src={imgSrc} className="w-10 h-10 rounded border shadow-sm object-cover" loading="lazy" alt="Ícone do app" />
          ) : props.iconPath ? (
            <AppIcon iconPath={props.iconPath} className="w-10 h-10 rounded border shadow-sm" />
          ) : (
            <IconCube className="w-10 h-10 border p-1.5 rounded text-muted-foreground bg-muted/40" />
          )}
        </div>

        <input ref={inputRef} onChange={handleFileChanged} type="file" accept="image/*" className="hidden" />
        <div>
          <Button variant="ghost" onClick={handleClick} type="button" disabled={isProcessing}>
            {isProcessing ? "Processando..." : "Alterar"}
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-1.5">Formatos suportados: PNG, JPG, WebP e SVG. Ajustado automaticamente para 128x128.</p>

      {error && <p className="text-sm text-destructive mt-1">{error}</p>}
    </div>
  );
}
