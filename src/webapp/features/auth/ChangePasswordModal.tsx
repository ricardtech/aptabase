import { Button } from "@components/Button";
import { TextInput } from "@components/TextInput";
import { Dialog, Transition } from "@headlessui/react";
import { IconLock, IconX } from "@tabler/icons-react";
import { Fragment, useState } from "react";
import { changePassword } from "./auth";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ChangePasswordModal(props: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    setSuccess(false);
    setLoading(false);
  };

  const close = () => {
    resetForm();
    props.onClose();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("A confirmação de senha não confere com a nova senha.");
      return;
    }

    setLoading(true);
    const result = await changePassword(currentPassword, newPassword);

    if (result.success) {
      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        close();
      }, 1500);
    } else {
      setError(result.error || "Senha atual incorreta.");
      setLoading(false);
    }
  };

  return (
    <Transition.Root show={props.open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={close}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-card text-card-foreground border px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:p-6">
                <div className="flex justify-between items-center pb-4 border-b">
                  <div className="flex items-center space-x-2">
                    <IconLock className="w-5 h-5 text-primary" />
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6">
                      Alterar Senha
                    </Dialog.Title>
                  </div>
                  <button
                    type="button"
                    className="rounded-md text-muted-foreground hover:text-foreground"
                    onClick={close}
                  >
                    <IconX className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <TextInput
                    label="Senha Atual"
                    type="password"
                    name="currentPassword"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />

                  <TextInput
                    label="Nova Senha (mínimo 6 caracteres)"
                    type="password"
                    name="newPassword"
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />

                  <TextInput
                    label="Confirmar Nova Senha"
                    type="password"
                    name="confirmPassword"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />

                  {error && <p className="text-sm text-destructive font-medium">{error}</p>}
                  {success && <p className="text-sm text-success font-medium">Senha alterada com sucesso!</p>}

                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <Button type="submit" loading={loading} className="w-full sm:col-start-2">
                      Salvar Senha
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-3 w-full sm:col-start-1 sm:mt-0"
                      onClick={close}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
