import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle } from "lucide-react";
import type { Notification } from "@shared/schema";

interface MessageNotificationListenerProps {
  recipientId: string;
  recipientType: "athlete" | "coach";
}

export default function MessageNotificationListener({ recipientId, recipientType }: MessageNotificationListenerProps) {
  const { toast } = useToast();
  const seenNotificationIds = useRef<Set<string>>(new Set());
  const initialLoadDone = useRef(false);

  const endpoint = recipientType === "coach"
    ? `/api/coaches/${recipientId}/notifications`
    : `/api/athletes/${recipientId}/notifications`;

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: [endpoint, "listener"],
    queryFn: async () => {
      const res = await fetch(endpoint);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!recipientId,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (!notifications.length) return;

    if (!initialLoadDone.current) {
      notifications.forEach((n) => seenNotificationIds.current.add(n.id));
      initialLoadDone.current = true;
      return;
    }

    const newMessageNotifications = notifications.filter(
      (n) => n.type === "new_message" && !seenNotificationIds.current.has(n.id)
    );

    newMessageNotifications.forEach((n) => {
      seenNotificationIds.current.add(n.id);
      toast({
        title: (
          <span className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            {n.title}
          </span>
        ) as any,
        description: n.message,
      });
    });
  }, [notifications, toast]);

  return null;
}
