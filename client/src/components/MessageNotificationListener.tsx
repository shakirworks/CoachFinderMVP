import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Notification } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    osc1.connect(gain1);
    gain1.connect(audioContext.destination);
    osc1.frequency.setValueAtTime(880, audioContext.currentTime);
    osc1.type = "sine";
    gain1.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    osc1.start(audioContext.currentTime);
    osc1.stop(audioContext.currentTime + 0.3);

    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    osc2.connect(gain2);
    gain2.connect(audioContext.destination);
    osc2.frequency.setValueAtTime(1174.66, audioContext.currentTime + 0.15);
    osc2.type = "sine";
    gain2.gain.setValueAtTime(0.01, audioContext.currentTime);
    gain2.gain.setValueAtTime(0.3, audioContext.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    osc2.start(audioContext.currentTime + 0.15);
    osc2.stop(audioContext.currentTime + 0.5);

    setTimeout(() => audioContext.close(), 1000);
  } catch (e) {
  }
}

interface MessageNotificationListenerProps {
  recipientId: string;
  recipientType: "athlete" | "coach";
}

interface PopupNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
}

export default function MessageNotificationListener({ recipientId, recipientType }: MessageNotificationListenerProps) {
  const shownNotificationIds = useRef<Set<string>>(new Set());
  const [activePopup, setActivePopup] = useState<PopupNotification | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const showPopup = useCallback((notification: Notification) => {
    playNotificationSound();
    setActivePopup({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      createdAt: notification.createdAt as unknown as string,
    });

    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }
    dismissTimerRef.current = setTimeout(() => {
      setActivePopup(null);
    }, 5000);
  }, []);

  const dismissPopup = useCallback(() => {
    setActivePopup(null);
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!notifications.length) return;

    const unshownMessageNotifications = notifications.filter(
      (n) => n.type === "new_message" && n.read === "false" && !shownNotificationIds.current.has(n.id)
    );

    if (unshownMessageNotifications.length > 0) {
      const latest = unshownMessageNotifications[0];
      shownNotificationIds.current.add(latest.id);
      showPopup(latest);

      unshownMessageNotifications.slice(1).forEach((n) => {
        shownNotificationIds.current.add(n.id);
      });
    }
  }, [notifications, showPopup]);

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, []);

  return (
    <AnimatePresence>
      {activePopup && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed top-4 right-4 z-[9999] w-[380px] max-w-[calc(100vw-2rem)]"
          data-testid="message-notification-popup"
        >
          <Card className="border-primary/30 shadow-lg" role="status" aria-live="polite">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <MessageCircle className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm" data-testid="popup-title">{activePopup.title}</p>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={dismissPopup}
                      data-testid="button-dismiss-popup"
                      aria-label="Dismiss notification"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2" data-testid="popup-message">
                    {activePopup.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(activePopup.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <div className="mt-3 h-0.5 w-full bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 5, ease: "linear" }}
                  className="h-full bg-primary rounded-full"
                />
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
