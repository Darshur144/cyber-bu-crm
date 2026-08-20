import { redirect } from "next/navigation";

export default async function EditDealRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/opportunities/${id}`);
}
