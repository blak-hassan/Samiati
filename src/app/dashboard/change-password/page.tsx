"use client";

import ChangePasswordScreen from "@/components/screens/ChangePasswordScreen";
import { useNavigation } from "@/hooks/useNavigation";

export default function ChangePasswordPage() {
    const { navigate, goBack } = useNavigation();

    return (
        <ChangePasswordScreen
            navigate={navigate}
            goBack={goBack}
        />
    );
}
