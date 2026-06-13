"use client";

import { useEffect, useState } from "react";
import { ReplyBox } from "@/components/tickets/reply-box";
import { apiClient } from "@/lib/api-client";
import type { CannedResponse } from "@/lib/types/ticket";

export function StaffReplyBox({
  onSubmit,
}: {
  onSubmit: (body: string, isInternal?: boolean, attachmentIds?: string[]) => Promise<void>;
}) {
  const [canned, setCanned] = useState<CannedResponse[]>([]);

  useEffect(() => {
    apiClient.get<CannedResponse[]>("/api/canned-responses").then((res) => {
      if (res.success && res.data) setCanned(res.data);
    });
  }, []);

  return (
    <ReplyBox
      onSubmit={onSubmit}
      allowInternal
      cannedResponses={canned}
    />
  );
}
