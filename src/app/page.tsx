"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-[380px] bg-[#1E1E1E] border-[#2D2D2D] p-6 md:p-8">
        <div className="flex flex-col items-center gap-8">
          {/* Trophy Icon */}
          <div className="bg-amber-500 p-4 rounded-full">
            <Trophy className="w-8 h-8 text-white" />
          </div>

          {/* Welcome Text */}
          <div className="text-center space-y-3">
            <h1 className="text-2xl font-semibold text-white">
              Welcome to <span className="text-amber-500">Predictions</span>
            </h1>
            <p className="text-amber-500 text-sm md:text-base">
              Make your predictions for upcoming matches
            </p>
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-4">
            <Button
              onClick={() => router.push("/user")}
              className="w-full bg-[#2D2D2D] hover:bg-[#3D3D3D] text-amber-500 border-none h-12"
            >
              Make Predictions
            </Button>
            <Button
              onClick={() => router.push("/leaderboard")}
              variant="outline"
              className="w-full border-[#2D2D2D] hover:bg-[#3D3D3D] text-amber-500 h-12"
            >
              View Leaderboard
            </Button>
          </div>
        </div>
      </Card>
    </main>
  );
} 