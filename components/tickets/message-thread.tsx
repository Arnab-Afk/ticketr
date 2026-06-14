import type { TicketMessage } from "@/lib/types/ticket";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/components/tickets/ticket-badges";
import { AttachmentList } from "@/components/tickets/attachment-uploader";

export function MessageThread({
  messages,
  currentUserId,
}: {
  messages: TicketMessage[];
  currentUserId: string;
}) {
  if (messages.length === 0) {
    return (
      <div className="receipt-panel border-dashed p-8 text-center text-sm text-muted-foreground">
        No messages yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => {
        const isOwn = currentUserId ? message.authorId === currentUserId : false;
        const isInternal = message.isInternal;

        return (
          <div
            key={message.id}
            className={cn(
              "border border-dashed p-4",
              isInternal
                ? "border-amber-400 bg-amber-50"
                : isOwn
                  ? "border-primary/30 bg-primary/5 receipt-paper"
                  : "receipt-panel"
            )}
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold">
                  {message.author.fullName}
                  {isInternal ? (
                    <span className="receipt-label ml-2 text-[9px] font-normal text-amber-800">
                      Internal note
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-muted-foreground">
                  {message.author.email}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(message.createdAt)}
              </span>
            </div>
            {message.body !== "(attachment)" ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {message.body}
              </p>
            ) : null}
            {message.attachments?.length ? (
              <AttachmentList attachments={message.attachments} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
