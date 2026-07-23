import { t } from "@lingui/core/macro";
import { useState } from "react";
import { Button } from "@reactive-resume/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@reactive-resume/ui/components/card";
import { Label } from "@reactive-resume/ui/components/label";
import { Switch } from "@reactive-resume/ui/components/switch";
import { Separator } from "@reactive-resume/ui/components/separator";

const FEATURE_FLAGS = [
	{ key: "enableRegistration" as const, label: t`Enable Registration`, description: t`Allow new users to sign up` },
	{ key: "enableTwoFactor" as const, label: t`Two-Factor Authentication`, description: t`Require 2FA for admin accounts` },
	{ key: "enableAuditLogging" as const, label: t`Audit Logging`, description: t`Log all administrative actions` },
	{ key: "enableTelemetry" as const, label: t`Telemetry Collection`, description: t`Collect anonymous usage data` },
	{ key: "enableMaintenanceMode" as const, label: t`Maintenance Mode`, description: t`Block all non-admin access` },
];

export function SystemSettingsForm() {
	const [flags, setFlags] = useState<Record<string, boolean>>({
		enableRegistration: true,
		enableTwoFactor: false,
		enableAuditLogging: true,
		enableTelemetry: true,
		enableMaintenanceMode: false,
	});

	const toggleFlag = (key: string) => {
		setFlags((prev) => ({ ...prev, [key]: !prev[key] }));
	};

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>{t`Feature Flags`}</CardTitle>
					<CardDescription>{t`Enable or disable system-wide features`}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{FEATURE_FLAGS.map((flag) => (
						<div key={flag.key}>
							<div className="flex items-center justify-between">
								<div>
									<Label className="font-medium">{flag.label}</Label>
									<p className="text-muted-foreground text-sm">{flag.description}</p>
								</div>
								<Switch checked={flags[flag.key]} onCheckedChange={() => toggleFlag(flag.key)} />
							</div>
							<Separator className="mt-4" />
						</div>
					))}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{t`Danger Zone`}</CardTitle>
					<CardDescription>{t`Irreversible system-wide actions`}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="font-medium text-destructive">{t`Purge All Data`}</p>
							<p className="text-muted-foreground text-sm">
								{t`Permanently delete all resumes and user data`}
							</p>
						</div>
						<Button variant="destructive" disabled>
							{t`Purge`}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
