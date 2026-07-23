import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { TrashSimpleIcon } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { m } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@reactive-resume/ui/components/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@reactive-resume/ui/components/card";
import { Input } from "@reactive-resume/ui/components/input";
import { useConfirm } from "@/hooks/use-confirm";
import { authClient } from "@/libs/auth/client";
import { getReadableErrorMessage } from "@/libs/error-message";
import { orpc } from "@/libs/orpc/client";

const CONFIRMATION_TEXT = "DELETE MY ACCOUNT";

export function AccountDeletionCard() {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [confirmationText, setConfirmationText] = useState("");
  const isConfirmationValid = confirmationText === CONFIRMATION_TEXT;

  const { mutate: deleteAccount, isPending } = useMutation(orpc.gdpr.deleteMyAccount.mutationOptions());

  const handleDeleteAccount = async () => {
    const confirmed = await confirm(
      t`Are you absolutely sure you want to delete your account?`,
      {
        description: t`This will permanently delete all your data including resumes, sessions, and linked accounts. This action cannot be undone.`,
        confirmText: t`Confirm Deletion`,
        cancelText: t`Cancel`,
      },
    );

    if (!confirmed) return;

    const toastId = toast.loading(t`Deleting your account...`);

    deleteAccount(
      { confirmation: "DELETE MY ACCOUNT" },
      {
        onSuccess: async () => {
          toast.success(t`Your account has been deleted successfully.`, { id: toastId });
          await authClient.signOut();
          void navigate({ to: "/" });
        },
        onError: (error) => {
          toast.error(
            getReadableErrorMessage(
              error,
              t({ message: "Failed to delete your account. Please try again." }),
            ),
            { id: toastId },
          );
        },
      },
    );
  };

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-lg text-destructive">{t`Delete Account`}</CardTitle>
        <CardDescription>{t`Permanently delete your account and all associated data. This action cannot be reversed.`}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4 leading-relaxed text-sm">
          <Trans>
            To delete your account, type <strong>{CONFIRMATION_TEXT}</strong> in the field below and click the delete button.
          </Trans>
        </p>
        <Input
          type="text"
          value={confirmationText}
          onChange={(e) => setConfirmationText(e.target.value)}
          placeholder={t`Type "${CONFIRMATION_TEXT}" to confirm`}
        />
      </CardContent>
      <CardFooter>
        <m.div
          whileHover={!isConfirmationValid || isPending ? undefined : { y: -1, scale: 1.01 }}
          whileTap={!isConfirmationValid || isPending ? undefined : { scale: 0.98 }}
          transition={{ duration: 0.14, ease: "easeOut" }}
        >
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={!isConfirmationValid || isPending}
          >
            <TrashSimpleIcon />
            {isPending ? t`Deleting...` : t`Delete My Account`}
          </Button>
        </m.div>
      </CardFooter>
    </Card>
  );
}
