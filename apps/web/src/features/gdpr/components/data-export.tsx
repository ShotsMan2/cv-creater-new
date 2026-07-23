import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { DownloadSimpleIcon } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@reactive-resume/ui/components/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@reactive-resume/ui/components/card";
import { getReadableErrorMessage } from "@/libs/error-message";
import { orpc } from "@/libs/orpc/client";

export function DataExportCard() {
  const { mutate: exportData, isPending } = useMutation(orpc.gdpr.exportMyData.mutationOptions());

  const handleExport = () => {
    exportData(undefined, {
      onSuccess: (data) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `personal-data-export-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(t`Your data has been exported successfully.`);
      },
      onError: (error) => {
        toast.error(
          getReadableErrorMessage(
            error,
            t({ message: "Failed to export your data. Please try again." }),
          ),
        );
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t`Export Your Data`}</CardTitle>
        <CardDescription>{t`Download all your personal data including resumes, sessions, and account information in JSON format.`}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          <Trans>
            This will export your profile, resumes, login sessions, connected accounts, and workspace memberships. The data will be packaged as a JSON file for your records.
          </Trans>
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={handleExport} disabled={isPending}>
          <DownloadSimpleIcon />
          {isPending ? t`Exporting...` : t`Export My Data`}
        </Button>
      </CardFooter>
    </Card>
  );
}
