"use client";
import NotificationsScreen from "@/components/screens/NotificationsScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { NotificationItem, Screen } from "@/types";
import { Id } from "../../../../convex/_generated/dataModel";

export default function NotificationsPage() {
    const { navigate, goBack } = useNavigation();

    // Fetch notifications
    const notificationsData = useQuery(api.notifications.queries.list, { limit: 50 });
    const markAllRead = useMutation(api.notifications.mutations.markAllAsRead);
    const markRead = useMutation(api.notifications.mutations.markAsRead);

    // Map Convex data to Frontend type
    const notifications: NotificationItem[] = (notificationsData || []).map((n: any) => ({
        id: n._id,
        type: n.type as any, // Cast or map if needed
        title: n.title,
        message: n.message,
        time: new Date(n.time).toISOString(), // Or just use n.time depending on type definition
        // Type def says time: string. Usually formatted date or ISO.
        // Let's assume ISO string for now or relative time. 
        // Initial mock data likely used strings like "2 hours ago" or ISO.
        isRead: n.isRead,
        targetScreen: n.targetScreen as Screen,
    }));

    const handleMarkAllRead = async () => {
        await markAllRead();
    };

    const handleNotificationClick = async (id: string, target?: Screen) => {
        // Mark as read when clicked?
        await markRead({ notificationId: id as Id<"notifications"> });

        if (target) {
            navigate(target);
        }
    };

    return (
        <NotificationsScreen
            navigate={navigate}
            goBack={goBack}
            notifications={notifications}
            onMarkAllRead={handleMarkAllRead}
            onNotificationClick={handleNotificationClick}
        />
    );
}

