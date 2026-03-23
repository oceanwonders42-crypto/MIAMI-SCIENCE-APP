import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { ROUTES } from "@/lib/constants";
import { AnnouncementEditor } from "../AnnouncementEditor";

export default function NewAnnouncementPage() {
  return (
    <>
      <Header title="New announcement" subtitle="Rich HTML body and scheduled publish" />
      <div className="px-4 md:px-6 space-y-6 pb-8 max-w-3xl">
        <AnnouncementEditor mode="create" />
        <p className="text-sm">
          <Link href={ROUTES.adminAnnouncements} className="text-primary-600 dark:text-primary-400 hover:underline">
            ← Back to announcements
          </Link>
        </p>
      </div>
    </>
  );
}
