"use client";

import { Suspense } from "react";
import AdminQueuePage from "./admin-queue-content";

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-24">
          <div className="receipt-spinner size-10" />
        </div>
      }
    >
      <AdminQueuePage />
    </Suspense>
  );
}
