"use client";

import NotificationsScreen from "@/components/screens/NotificationsScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { INITIAL_NOTIFICATIONS } from "@/data/mock";

export default function NotificationsPage() {
    const { navigate, goBack } = useNavigation();

    return (
        <NotificationsScreen
            navigate={navigate}
            goBack={goBack}
            notifications={INITIAL_NOTIFICATIONS}
            onMarkAllRead={() => console.log("Mark all read")}
            onNotificationClick={(id, target) => {
                if (target) navigate(target);
            }}
        />
    );
}
