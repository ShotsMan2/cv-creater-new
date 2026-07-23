import { useState } from "react";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import {
  ArrowClockwiseIcon,
  LinkIcon,
  PlusIcon,
  TrashSimpleIcon,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, m } from "motion/react";
import { toast } from "sonner";
import { Button } from "@reactive-resume/ui/components/button";
import { Input } from "@reactive-resume/ui/components/input";
import { Label } from "@reactive-resume/ui/components/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@reactive-resume/ui/components/dialog";
import { useConfirm } from "@/hooks/use-confirm";
import { client } from "@/libs/orpc/client";

const AVAILABLE_EVENTS = [
  { value: "resume.created", label: "Resume Created" },
  { value: "resume.updated", label: "Resume Updated" },
  { value: "resume.deleted", label: "Resume Deleted" },
  { value: "resume.published", label: "Resume Published" },
  { value: "user.registered", label: "User Registered" },
  { value: "user.deleted", label: "User Deleted" },
];

export function WebhooksSettingsPage() {
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingHook, setEditingHook] = useState<{ id: string; name: string; url: string; events: string[]; retryCount: number; timeoutMs: number } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["webhooks"],
    queryFn: () => client.webhook.listWebhooks({ page: 1, limit: 100 }),
    select: (res) => res.data ?? [],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => client.webhook.deleteWebhook({ id }),
    onSuccess: () => {
      toast.success(t`Webhook deleted successfully.`);
      void queryClient.invalidateQueries({ queryKey: ["webhooks"] });
    },
  });

  const onDelete = async (id: string) => {
    const confirmed = await confirm(
      t`Are you sure you want to delete this webhook?`,
      {
        description: t`This action cannot be undone. All delivery logs will also be removed.`,
        confirmText: t`Delete`,
        cancelText: t`Cancel`,
      },
    );
    if (!confirmed) return;
    deleteMutation.mutate(id);
  };

  return (
    <m.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="grid max-w-xl gap-6 will-change-[transform,opacity]"
    >
      <div>
        <Button
          variant="outline"
          className="h-auto w-full py-3"
          onClick={() => setCreateOpen(true)}
        >
          <PlusIcon />
          <Trans>Create a new webhook</Trans>
        </Button>

        <CreateWebhookDialog open={createOpen} onOpenChange={setCreateOpen} />

        <AnimatePresence initial={false} mode="popLayout">
          {isLoading && (
            <m.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-8 text-center text-sm text-muted-foreground"
            >
              <Trans>Loading webhooks...</Trans>
            </m.div>
          )}

          {!isLoading && data?.length === 0 && (
            <m.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-8 text-center text-sm text-muted-foreground"
            >
              <Trans>No webhooks configured yet.</Trans>
            </m.div>
          )}

          {!isLoading && data?.map((hook, index) => (
            <m.div
              key={hook.id}
              className="flex items-center gap-x-4 py-4 will-change-[transform,opacity]"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.16, delay: Math.min(0.12, index * 0.04) }}
            >
              <LinkIcon className={hook.isActive ? "text-green-500" : "text-muted-foreground"} />

              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{hook.name}</p>
                <p className="font-mono text-xs text-muted-foreground">{hook.url}</p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {hook.events.map((event) => (
                    <span
                      key={event}
                      className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                    >
                      {event}
                    </span>
                  ))}
                </div>
                {hook.lastFailureAt && !hook.isActive && (
                  <p className="pt-1 text-xs text-red-500">{hook.lastFailureReason}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <m.div
                  className="will-change-transform"
                  whileHover={{ y: -1, scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ duration: 0.14, ease: "easeOut" }}
                >
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditingHook({
                        id: hook.id,
                        name: hook.name,
                        url: hook.url,
                        events: hook.events,
                        retryCount: hook.retryCount,
                        timeoutMs: hook.timeoutMs,
                      });
                      setEditOpen(true);
                    }}
                  >
                    <ArrowClockwiseIcon />
                  </Button>
                </m.div>

                <m.div
                  className="will-change-transform"
                  whileHover={{ y: -1, scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ duration: 0.14, ease: "easeOut" }}
                >
                  <Button size="icon" variant="ghost" onClick={() => onDelete(hook.id)}>
                    <TrashSimpleIcon />
                  </Button>
                </m.div>
              </div>
            </m.div>
          ))}
        </AnimatePresence>
      </div>

      {editingHook && (
        <EditWebhookDialog
          key={editingHook.id}
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) setEditingHook(null);
          }}
          webhook={editingHook}
        />
      )}
    </m.div>
  );
}

type CreateWebhookDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function CreateWebhookDialog({ open, onOpenChange }: CreateWebhookDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>([]);
  const [retryCount, setRetryCount] = useState(3);
  const [timeoutMs, setTimeoutMs] = useState(5000);

  const createMutation = useMutation({
    mutationFn: (data: { name: string; url: string; events: string[]; retryCount: number; timeoutMs: number }) =>
      client.webhook.createWebhook(data),
    onSuccess: () => {
      toast.success(t`Webhook created successfully.`);
      void queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      onOpenChange(false);
      setName("");
      setUrl("");
      setEvents([]);
      setRetryCount(3);
      setTimeoutMs(5000);
    },
    onError: () => {
      toast.error(t`Failed to create webhook.`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ name, url, events, retryCount, timeoutMs });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Trans>Create Webhook</Trans>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              <Trans>Name</Trans>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t`My Webhook`}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">
              <Trans>Payload URL</Trans>
            </Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/webhook"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>
              <Trans>Events</Trans>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_EVENTS.map((event) => (
                <Label
                  key={event.value}
                  className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-xs hover:bg-muted [&:has(:checked)]:border-primary"
                >
                  <input
                    type="checkbox"
                    className="size-3.5 accent-primary"
                    checked={events.includes(event.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setEvents([...events, event.value]);
                      } else {
                        setEvents(events.filter((v) => v !== event.value));
                      }
                    }}
                  />
                  {event.label}
                </Label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="retryCount">
                <Trans>Retry Count</Trans>
              </Label>
              <select
                id="retryCount"
                value={retryCount}
                onChange={(e) => setRetryCount(Number(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {[0, 1, 2, 3, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeoutMs">
                <Trans>Timeout (ms)</Trans>
              </Label>
              <select
                id="timeoutMs"
                value={timeoutMs}
                onChange={(e) => setTimeoutMs(Number(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {[1000, 2000, 5000, 10000, 15000, 30000].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <DialogClose
              render={
                <Button variant="outline" type="button">
                  <Trans>Cancel</Trans>
                </Button>
              }
            />
            <Button type="submit" disabled={!name || !url || events.length === 0 || createMutation.isPending}>
              {createMutation.isPending ? <Trans>Creating...</Trans> : <Trans>Create</Trans>}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type EditWebhookDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  webhook: { id: string; name: string; url: string; events: string[]; retryCount: number; timeoutMs: number };
};

function EditWebhookDialog({ open, onOpenChange, webhook }: EditWebhookDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(webhook.name);
  const [url, setUrl] = useState(webhook.url);
  const [events, setEvents] = useState<string[]>(webhook.events);
  const [retryCount, setRetryCount] = useState(webhook.retryCount);
  const [timeoutMs, setTimeoutMs] = useState(webhook.timeoutMs);

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; name?: string; url?: string; events?: string[]; retryCount?: number; timeoutMs?: number }) =>
      client.webhook.updateWebhook(data),
    onSuccess: () => {
      toast.success(t`Webhook updated successfully.`);
      void queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      onOpenChange(false);
    },
    onError: () => {
      toast.error(t`Failed to update webhook.`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ id: webhook.id, name, url, events, retryCount, timeoutMs });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Trans>Edit Webhook</Trans>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">
              <Trans>Name</Trans>
            </Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-url">
              <Trans>Payload URL</Trans>
            </Label>
            <Input
              id="edit-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>
              <Trans>Events</Trans>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_EVENTS.map((event) => (
                <Label
                  key={event.value}
                  className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-xs hover:bg-muted [&:has(:checked)]:border-primary"
                >
                  <input
                    type="checkbox"
                    className="size-3.5 accent-primary"
                    checked={events.includes(event.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setEvents([...events, event.value]);
                      } else {
                        setEvents(events.filter((v) => v !== event.value));
                      }
                    }}
                  />
                  {event.label}
                </Label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-retryCount">
                <Trans>Retry Count</Trans>
              </Label>
              <select
                id="edit-retryCount"
                value={retryCount}
                onChange={(e) => setRetryCount(Number(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {[0, 1, 2, 3, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-timeoutMs">
                <Trans>Timeout (ms)</Trans>
              </Label>
              <select
                id="edit-timeoutMs"
                value={timeoutMs}
                onChange={(e) => setTimeoutMs(Number(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {[1000, 2000, 5000, 10000, 15000, 30000].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <DialogClose
              render={
                <Button variant="outline" type="button">
                  <Trans>Cancel</Trans>
                </Button>
              }
            />
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Trans>Saving...</Trans> : <Trans>Save</Trans>}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
