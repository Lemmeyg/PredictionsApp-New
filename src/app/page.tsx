"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <main className="min-h-[100dvh] flex items-center justify-center p-4">
      <Card className="w-full max-w-[min(90vw,380px)] border-border">
        <div className="flex flex-col items-center gap-6 p-6">
          {/* Trophy Icon */}
          <div className="bg-primary rounded-full p-4">
            <Trophy className="h-8 w-8 text-primary-foreground" />
          </div>

          {/* Welcome Text */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">
              Welcome to <span className="text-primary">Predictions</span>
            </h1>
            <p className="text-primary text-sm md:text-base">
              Make your predictions for upcoming matches
            </p>
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-3">
            <Button
              onClick={() => router.push("/user")}
              className="w-full h-11"
              variant="secondary"
            >
              Make Predictions
            </Button>
            <Button
              onClick={() => router.push("/leaderboard")}
              className="w-full h-11"
              variant="secondary"
            >
              View Leaderboard
            </Button>
          </div>
        </div>
      </Card>
    </main>
  );
} 