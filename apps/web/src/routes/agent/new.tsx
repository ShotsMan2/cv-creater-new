import type { PanelImperativeHandle } from "react-resizable-panels";
import { Trans } from "@lingui/react/macro";
import { SidebarSimpleIcon } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import z from "zod";
import { Button } from "@reactive-resume/ui/components/button";
import { ResizableGroup, ResizablePanel, ResizableSeparator } from "@reactive-resume/ui/components/resizable";
import { cn } from "@reactive-resume/utils/style";
import { NewThreadSetup } from "./-components/new-thread-setup";
import { AgentThreadSidebar } from "./-components/thread-sidebar";

const searchSchema = z.object({ resumeId: z.string().optional() });

export const Route = createFileRoute("/agent/new")({
	component: RouteComponent,
	validateSearch: searchSchema,
});

function RouteComponent() {
	const { resumeId } = Route.useSearch();
	const threadsPanelRef = useRef<PanelImperativeHandle | null>(null);
	const [isThreadsCollapsed, setIsThreadsCollapsed] = useState(false);

	const toggleThreadsPanel = useCallback(() => {
		const panel = threadsPanelRef.current;
		if (!panel) return;
		if (panel.isCollapsed()) {
			panel.expand();
			setIsThreadsCollapsed(false);
		} else {
			panel.collapse();
			setIsThreadsCollapsed(true);
		}
	}, []);

	return (
		<div className="h-svh bg-background">
			<div className="hidden h-full lg:block">
				<ResizableGroup orientation="horizontal" className="h-full">
					<ResizablePanel
						id="threads"
						panelRef={threadsPanelRef}
						defaultSize="18%"
						minSize="240px"
						maxSize="360px"
						collapsible
						collapsedSize="0px"
						onResize={(size) => setIsThreadsCollapsed(size.inPixels < 24)}
					>
						<AgentThreadSidebar
							className={cn(isThreadsCollapsed && "invisible")}
							onToggleThreads={toggleThreadsPanel}
						/>
					</ResizablePanel>
					<ResizableSeparator withHandle />
					<ResizablePanel id="main" defaultSize="82%">
						<main className="relative grid h-full min-w-0 flex-1 overflow-auto">
							{isThreadsCollapsed && (
								<div className="absolute top-4 left-4 z-10">
									<Button size="icon-sm" variant="ghost" onClick={toggleThreadsPanel}>
										<SidebarSimpleIcon />
										<span className="sr-only">
											<Trans>Toggle threads</Trans>
										</span>
									</Button>
								</div>
							)}
							<NewThreadSetup resumeId={resumeId} />
						</main>
					</ResizablePanel>
				</ResizableGroup>
			</div>

			<div className="flex h-full flex-col lg:hidden">
				<main className="grid min-w-0 flex-1 overflow-auto p-4">
					<NewThreadSetup resumeId={resumeId} />
				</main>
			</div>
		</div>
	);
}
