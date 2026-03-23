"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Dumbbell,
  Gift,
  LayoutDashboard,
  Layers,
  LineChart,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { completeOnboardingTutorialAction } from "@/app/(dashboard)/dashboard/actions";

const SLIDES: { title: string; subtitle: string; Icon: LucideIcon }[] = [
  {
    title: "Dashboard",
    subtitle:
      "Your daily hub. See your workout streak, supplements, and quick stats at a glance.",
    Icon: LayoutDashboard,
  },
  {
    title: "Training",
    subtitle:
      "Log workouts, track exercises, and watch your strength grow over time.",
    Icon: Dumbbell,
  },
  {
    title: "Stack",
    subtitle:
      "Track your supplements, set refill reminders, and never run out.",
    Icon: Layers,
  },
  {
    title: "Progress",
    subtitle:
      "Log body metrics, upload progress photos, and visualize your transformation.",
    Icon: LineChart,
  },
  {
    title: "Rewards",
    subtitle:
      "Earn points for check-ins, workouts, and purchases. Redeem for discounts.",
    Icon: Gift,
  },
];

type OnboardingTutorialModalProps = {
  show: boolean;
};

export function OnboardingTutorialModal({ show }: OnboardingTutorialModalProps) {
  const [visible, setVisible] = useState(show);
  const [index, setIndex] = useState(0);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setVisible(show);
  }, [show]);

  const finish = useCallback(async () => {
    setPending(true);
    try {
      const { ok } = await completeOnboardingTutorialAction();
      if (ok) setVisible(false);
    } finally {
      setPending(false);
    }
  }, []);

  const onNext = () => {
    if (index < SLIDES.length - 1) {
      setIndex((i) => i + 1);
      return;
    }
    void finish();
  };

  const onSkip = () => {
    void finish();
  };

  if (!visible) return null;

  const isLast = index === SLIDES.length - 1;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-black/85 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-tutorial-title"
    >
      <div className="relative flex min-h-0 flex-1 flex-col pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
        {!isLast && (
          <div className="flex shrink-0 justify-end px-4 pt-3 md:pt-5">
            <button
              type="button"
              onClick={onSkip}
              disabled={pending}
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200 disabled:opacity-50"
            >
              Skip
            </button>
          </div>
        )}
        {isLast && <div className="h-12 shrink-0 md:h-14" aria-hidden />}

        <div className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col px-4">
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <div
              className="flex h-full transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${index * 100}%)` }}
            >
              {SLIDES.map((slide, slideIndex) => (
                <div
                  key={slide.title}
                  className="flex w-full min-w-full shrink-0 flex-col items-center justify-center px-2 py-4 text-center md:py-6"
                >
                  <div
                    className={cn(
                      "mb-8 flex h-32 w-32 items-center justify-center rounded-3xl border border-white/[0.08]",
                      "bg-gradient-to-br from-primary-600/25 via-zinc-900/80 to-zinc-950",
                      "shadow-[0_0_60px_-12px_rgba(196,148,58,0.35)]"
                    )}
                  >
                    <slide.Icon
                      className="h-[4.5rem] w-[4.5rem] text-primary-400"
                      strokeWidth={1.25}
                      aria-hidden
                    />
                  </div>
                  <h2
                    id={
                      slideIndex === index ? "onboarding-tutorial-title" : undefined
                    }
                    className="text-2xl font-bold tracking-tight text-white md:text-3xl"
                  >
                    {slide.title}
                  </h2>
                  <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-zinc-400 md:text-base">
                    {slide.subtitle}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex shrink-0 justify-center gap-2 pb-4 pt-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                disabled={pending}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  i === index
                    ? "w-8 bg-primary-500"
                    : "w-2 bg-zinc-600 hover:bg-zinc-500"
                )}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index ? "step" : undefined}
              />
            ))}
          </div>

          <div className="shrink-0 px-1 pb-6 pt-2 md:pb-10">
            <button
              type="button"
              onClick={onNext}
              disabled={pending}
              className={cn(
                "w-full rounded-xl py-3.5 text-base font-semibold tracking-wide transition-all",
                "bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-900/30",
                "hover:from-primary-500 hover:to-primary-600 active:scale-[0.99]",
                "disabled:cursor-not-allowed disabled:opacity-60"
              )}
            >
              {pending ? "Saving…" : isLast ? "Get started" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
