import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { ROUTES } from "@/lib/constants";
import { getAnnouncementByIdAdmin } from "../../actions";
import { AnnouncementEditor } from "../../AnnouncementEditor";

export default async function EditAnnouncementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await getAnnouncementByIdAdmin(id);
  if (!row) notFound();

  return (
    <>
      <Header title="Edit announcement" subtitle={row.title} />
      <div className="px-4 md:px-6 space-y-6 pb-8 max-w-3xl">
        <AnnouncementEditor mode="edit" initial={row} />
        <p className="text-sm">
          <Link href={ROUTES.adminAnnouncements} className="text-primary-600 dark:text-primary-400 hover:underline">
            ← Back to announcements
          </Link>
        </p>
      </div>
    </>
  );
}
