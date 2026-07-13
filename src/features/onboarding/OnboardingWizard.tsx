"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { EnglishLevel } from "@/lib/db/schema";
import { NameStep } from "@/features/onboarding/steps/NameStep";
import { LevelStep } from "@/features/onboarding/steps/LevelStep";
import { GoalStep } from "@/features/onboarding/steps/GoalStep";
import { DailyTargetStep } from "@/features/onboarding/steps/DailyTargetStep";

const STEPS = 4;

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    english_level: "intermediate" as EnglishLevel,
    learning_goal: "",
    daily_goal_minutes: 30,
  });

  const canProceed = () => {
    if (step === 0) return form.name.trim().length > 0;
    if (step === 2) return form.learning_goal.trim().length > 0;
    return true;
  };

  const handleNext = async () => {
    if (step < STEPS - 1) {
      setStep(step + 1);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to create user");
      router.push("/");
      router.refresh();
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col px-6 py-10">
      <div className="mb-8 flex justify-center gap-2">
        {Array.from({ length: STEPS }).map((_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full transition-colors ${
              i <= step ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      <div className="mx-auto w-full max-w-md flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 0 && (
              <NameStep
                value={form.name}
                onChange={(name) => setForm({ ...form, name })}
              />
            )}
            {step === 1 && (
              <LevelStep
                value={form.english_level}
                onChange={(english_level) =>
                  setForm({ ...form, english_level })
                }
              />
            )}
            {step === 2 && (
              <GoalStep
                value={form.learning_goal}
                onChange={(learning_goal) =>
                  setForm({ ...form, learning_goal })
                }
              />
            )}
            {step === 3 && (
              <DailyTargetStep
                value={form.daily_goal_minutes}
                onChange={(daily_goal_minutes) =>
                  setForm({ ...form, daily_goal_minutes })
                }
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mx-auto mt-8 flex w-full max-w-md gap-3">
        {step > 0 && (
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setStep(step - 1)}
            disabled={loading}
          >
            Back
          </Button>
        )}
        <Button
          className="flex-1"
          onClick={handleNext}
          disabled={!canProceed() || loading}
        >
          {loading ? "Setting up..." : step === STEPS - 1 ? "Get Started" : "Continue"}
        </Button>
      </div>
    </div>
  );
}
