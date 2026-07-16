import type { PanelImperativeHandle } from "react-resizable-panels";
import { Trans } from "@lingui/react/macro";
import { ArrowRightIcon, ChatCircleDotsIcon, SidebarSimpleIcon } from "@phosphor-icons/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import { Button } from "@reactive-resume/ui/components/button";
import { ResizableGroup, ResizablePanel, ResizableSeparator } from "@reactive-resume/ui/components/resizable";
import { cn } from "@reactive-resume/utils/style";
import { AgentThreadSidebar } from "./-components/thread-sidebar";

export const Route = createFileRoute("/agent/")({
	component: RouteComponent,
});

function RouteComponent() {
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
						<main className="relative grid h-full min-w-0 flex-1 place-items-center overflow-auto p-6">
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
							<div className="w-full max-w-xl rounded-md border bg-card p-6 shadow-sm">
								<div className="flex items-start gap-4">
									<div className="grid size-11 shrink-0 place-items-center rounded-md border bg-background">
										<ChatCircleDotsIcon className="size-5" weight="fill" />
									</div>
									<div className="min-w-0 space-y-2">
										<h1 className="font-semibold text-2xl tracking-tight">
											<Trans>Select a thread</Trans>
										</h1>
										<p className="text-muted-foreground text-sm">
											<Trans>
												Choose an existing conversation from the sidebar, or start a new draft-focused thread.
											</Trans>
										</p>
									</div>
								</div>

								<div className="mt-6 flex justify-end border-t pt-4">
									<Button nativeButton={false} render={<Link to="/agent/new" />}>
										<ArrowRightIcon />
										<Trans>Start new thread</Trans>
									</Button>
								</div>
							</div>
						</main>
					</ResizablePanel>
				</ResizableGroup>
			</div>

			<div className="flex h-full flex-col lg:hidden">
				<main className="grid min-w-0 flex-1 place-items-center p-6">
					<div className="w-full max-w-xl rounded-md border bg-card p-6 shadow-sm">
						<div className="flex items-start gap-4">
							<div className="grid size-11 shrink-0 place-items-center rounded-md border bg-background">
								<ChatCircleDotsIcon className="size-5" weight="fill" />
							</div>
							<div className="min-w-0 space-y-2">
								<h1 className="font-semibold text-2xl tracking-tight">
									<Trans>Select a thread</Trans>
								</h1>
								<p className="text-muted-foreground text-sm">
									<Trans>Choose an existing conversation from the sidebar, or start a new draft-focused thread.</Trans>
								</p>
							</div>
						</div>

						<div className="mt-6 flex justify-end border-t pt-4">
							<Button nativeButton={false} render={<Link to="/agent/new" />}>
								<ArrowRightIcon />
								<Trans>Start new thread</Trans>
							</Button>
						</div>
					</div>
				</main>
			</div>
		</div>
	);
}
