import { Button } from "@components/Button";
import { IconCube } from "@tabler/icons-react";
import { useRef, useState } from "react";
import { AppIcon } from "./AppIcon";

type ImageDetails = {
  src: string;
  contentAsBase64: string;
  width: number;
  height: number;
};

async function getImageDetails(file: File): Promise<ImageDetails> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function (e) {
      var image = new Image();
      image!.src = reader.result as string;
      image.onload = function () {
        if (image.width !== image.height) {
          reject("O ícone deve ter proporção quadrada (1:1).");
          return;
        }

        if (image.width < 100 || image.height < 100) {
          reject("O ícone deve ter no mínimo 100x100 pixels.");
          return;
        }

        resolve({
          src: image.src,
          contentAsBase64: image.src.split(",")[1],
          width: image.width,
          height: image.height,
        });
      };
      image.onerror = function () {
        reject("Arquivo de imagem inválido.");
      };
    };
    reader.onerror = function (error) {
      reject("Erro ao carregar a imagem.");
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
  const inputRef = useRef<HTMLInputElement>(null);

  function handleClick() {
    inputRef.current?.click();
  }

  async function handleFileChanged(event: React.ChangeEvent<HTMLInputElement>) {
    props.onIconChanged("");
    setError("");

    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 50) {
      setError("O tamanho do ícone deve ser menor que 50KB.");
      return;
    }

    if (file.type !== "image/png") {
      setError("O ícone deve ser um arquivo PNG.");
      return;
    }

    try {
      const details = await getImageDetails(file);
      setImgSrc(details.src);
      props.onIconChanged(details.contentAsBase64);
    } catch (err: any) {
      console.log(err);
      setError(err instanceof Error ? err.message : err.toString());
    }
  }

  return (
    <div>
      <label className="text-sm mb-2 block font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        Ícone
      </label>
      <div className="flex gap-2 items-center">
        {imgSrc ? (
          <img src={imgSrc} className="w-9 h-9 rounded" loading="lazy" />
        ) : props.iconPath ? (
          <AppIcon iconPath={props.iconPath} className="w-9 h-9" />
        ) : (
          <IconCube className="w-9 h-9 border p-1.5 rounded" />
        )}

        <input ref={inputRef} onChange={handleFileChanged} type="file" className="hidden" />
        <div>
          <Button variant="ghost" onClick={handleClick} type="button">
            Alterar
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
