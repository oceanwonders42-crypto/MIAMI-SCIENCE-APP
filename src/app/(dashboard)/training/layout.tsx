import { TrainingOfflineSync } from "@/components/training/TrainingOfflineSync";

export default function TrainingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TrainingOfflineSync />
      {children}
    </>
  );
}
