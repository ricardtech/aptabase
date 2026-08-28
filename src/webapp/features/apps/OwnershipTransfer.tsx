import { Alert, AlertDescription, AlertTitle } from "@components/Alert";
import { Button } from "@components/Button";
import { ErrorState } from "@components/ErrorState";
import { LoadingState } from "@components/LoadingState";
import { TextInput } from "@components/TextInput";
import { Application } from "@features/apps";
import { api } from "@fns/api";
import { IconClock, IconCrown, IconHelp } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { OwnershipTransferModal } from "./OwnershipTransferModal";
import { AppRequest, AppRequestPurpose } from "./app-requests";

type Props = {
  app: Application;
};

export function OwnershipTransfer(props: Props) {
  const [newOwnerEmail, setNewOwnerEmail] = useState("");
  const [showTransferModal, setShowTransferModal] = useState(false);

  const {
    isLoading: transferLoading,
    isError: transferError,
    data: ownershipTransfer,
    refetch: refetchTransfer,
  } = useQuery({
    queryKey: ["app-request", props.app.id, AppRequestPurpose.AppOwnership],
    queryFn: async () => {
      return await api.getEmpty<AppRequest | null>(
        `/_apps/${props.app.id}/requests?purpose=${AppRequestPurpose.AppOwnership}`
      );
    },
  });

  const handleTransferSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setShowTransferModal(true);
  };

  const handleCancelTransfer = async () => {
    await api.delete(`/_apps/${props.app.id}/requests?purpose=${AppRequestPurpose.AppOwnership}`);
    refetchTransfer();
  };

  const handleTransferInitiated = () => {
    setNewOwnerEmail("");
    refetchTransfer();
  };

  if (transferLoading) return <LoadingState />;
  if (transferError) return <ErrorState />;

  const hasPendingTransfer = ownershipTransfer?.status === "pending";

  return (
    <div className="space-y-8">
      {/* Ownership Transfer Section */}
      <div className="max-w-[40rem]">
        <div className="flex items-center space-x-2 mb-4">
          <IconCrown className="h-5 w-5 text-foreground" />
          <h3 className="text-lg font-medium">Transferir Propriedade</h3>
        </div>

        {hasPendingTransfer ? (
          <div className="border border-warning/20 bg-warning/10 rounded-md p-4">
            <div className="flex items-center space-x-2 mb-2">
              <IconClock className="h-4 w-4 text-warning" />
              <p className="font-medium text-warning-foreground">Transferência Pendente</p>
            </div>
            <p className="text-sm text-warning-foreground mb-3">
              A transferência de propriedade para <span className="font-semibold">{ownershipTransfer.targetUserEmail}</span> está aguardando aprovação.
            </p>
            <Button variant="outline" size="sm" onClick={handleCancelTransfer}>
              Cancelar Transferência
            </Button>
          </div>
        ) : (
          <form onSubmit={handleTransferSubmit} className="space-y-4">
            <div className="flex items-center space-x-2">
              <TextInput
                label="Transferir para:"
                name="newOwnerEmail"
                type="email"
                required={true}
                value={newOwnerEmail}
                placeholder="novo.proprietario@ricardtech.com"
                maxLength={300}
                onChange={(e) => setNewOwnerEmail(e.target.value)}
                description="Digite o e-mail do usuário que se tornará o novo proprietário."
              />
              <Button variant="destructive" disabled={newOwnerEmail.length === 0} type="submit">
                Transferir Propriedade
              </Button>
            </div>
          </form>
        )}
      </div>

      <Alert className="max-w-[40rem]">
        <IconHelp className="h-4 w-4" />
        <AlertTitle>Como funciona a transferência de propriedade?</AlertTitle>
        <AlertDescription className="text-muted-foreground">
          <ol className="list-decimal mx-4 my-2 space-y-1">
            <li>Transferir a propriedade concede a outro usuário o controle total sobre o aplicativo.</li>
            <li>O novo proprietário se torna responsável pelo faturamento e gerenciamento.</li>
            <li>Você será mantido na lista de compartilhamento com acesso de leitura.</li>
            <li>Esta ação requer confirmação e aceite do novo proprietário.</li>
            <li>
              <span className="font-bold">Esta ação não pode ser desfeita</span> após ser aceita.
            </li>
          </ol>
        </AlertDescription>
      </Alert>

      <OwnershipTransferModal
        open={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        app={props.app}
        newOwnerEmail={newOwnerEmail}
        onTransferInitiated={handleTransferInitiated}
      />
    </div>
  );
}
