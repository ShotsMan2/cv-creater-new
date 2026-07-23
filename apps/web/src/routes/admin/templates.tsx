import { t } from "@lingui/core/macro";
import { Layout } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@reactive-resume/ui/components/card";
import { Separator } from "@reactive-resume/ui/components/separator";
import { DashboardHeader } from "../dashboard/-components/header";

const templates = [
	{ id: "azur", name: "Azur", description: "A clean, modern template with a blue accent" },
	{ id: "basilica", name: "Basilica", description: "Professional two-column layout" },
	{ id: "catalyst", name: "Catalyst", description: "Bold and modern design" },
	{ id: "echo", name: "Echo", description: "Minimalist single-column layout" },
	{ id: "gala", name: "Gala", description: "Elegant design with refined typography" },
	{ id: "glyph", name: "Glyph", description: "Compact design with icon-driven sections" },
	{ id: "ikon", name: "Ikon", description: "Visual-first template with icon headers" },
	{ id: "kardinal", name: "Kardinal", description: "Traditional resume layout" },
	{ id: "material", name: "Material", description: "Material Design-inspired template" },
	{ id: "mirage", name: "Mirage", description: "Creative design with unique layout" },
	{ id: "nano", name: "Nano", description: "Ultra-compact single-page design" },
	{ id: "onepage", name: "OnePage", description: "Classic single-page resume" },
	{ id: "paper", name: "Paper", description: "Print-friendly traditional design" },
	{ id: "pika", name: "Pika", description: "Colorful and vibrant template" },
	{ id: "pluto", name: "Pluto", description: "Dark-themed modern template" },
	{ id: "riva", name: "Riva", description: "Elegant two-column with sidebar" },
	{ id: "stack", name: "Stack", description: "Full-width stacked sections" },
	{ id: "teal", name: "Teal", description: "Teal-accented professional design" },
	{ id: "vite", name: "Vite", description: "Fast-loading minimal template" },
];

export const Route = createFileRoute("/admin/templates")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="space-y-4">
			<DashboardHeader icon={Layout} title={t`Templates`} />
			<Separator />

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{templates.map((template) => (
					<Card key={template.id} className="overflow-hidden">
						<div className="aspect-[210/297] bg-muted">
							<img
								src={`/templates/jpg/${template.id}.jpg`}
								alt={template.name}
								className="h-full w-full object-cover"
								onError={(e) => {
									(e.target as HTMLImageElement).src = `https://placehold.co/210x297/e2e8f0/64748b?text=${template.name}`;
								}}
							/>
						</div>
						<CardHeader>
							<CardTitle>{template.name}</CardTitle>
							<CardDescription>{template.description}</CardDescription>
						</CardHeader>
						<CardContent className="flex gap-x-2">
							<span className="rounded-full bg-muted px-2.5 py-0.5 text-muted-foreground text-xs font-medium">
								{template.id}
							</span>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
