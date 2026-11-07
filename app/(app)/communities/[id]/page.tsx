import { CommunityView } from "@/components/communities/community-view";

export const metadata = {
  title: "Community",
};

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CommunityView communityId={id} />;
}
