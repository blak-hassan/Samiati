"use client";

import { Screen } from "@/types";
import PeopleToFollowScreen from "@/components/screens/PeopleToFollowScreen";
import { useNavigation } from "@/hooks/useNavigation";

export default function PeopleToFollowPage() {
    const { navigate, goBack } = useNavigation();

    return (
        <PeopleToFollowScreen
            navigate={navigate}
            goBack={goBack}
            onViewProfile={(user) => navigate(Screen.PROFILE, { user })}
        />
    );
}
