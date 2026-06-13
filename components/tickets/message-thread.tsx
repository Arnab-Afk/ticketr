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
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
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
              "rounded-2xl border p-4",
              isInternal
                ? "border-amber-200 bg-amber-50"
                : isOwn
                  ? "border-[#167E6C]/20 bg-[#167E6C]/5"
                  : "border-gray-100 bg-white"
            )}
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {message.author.fullName}
                  {isInternal ? (
                    <span className="ml-2 text-xs font-normal text-amber-700">
                      Internal note
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-gray-500">{message.author.email}</p>
              </div>
              <span className="text-xs text-gray-400">
                {formatRelativeTime(message.createdAt)}
              </span>
            </div>
            {message.body !== "(attachment)" ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
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
