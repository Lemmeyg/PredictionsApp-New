'use client'

import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { submitPredictions } from '@/app/actions/submit-predictions';
import { useRouter } from 'next/navigation';

export function PredictionForm({ fixtures, userName }: PredictionFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [scores, setScores] = useState<Record<number, { home: string; away: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Validate all fixtures have predictions
      const isComplete = fixtures.every(fixture => 
        scores[fixture.fixtureId]?.home !== undefined && 
        scores[fixture.fixtureId]?.away !== undefined
      );

      if (!isComplete) {
        toast({
          title: "Error",
          description: "Please enter predictions for all matches",
          variant: "destructive"
        });
        return;
      }

      const predictions = fixtures.map(fixture => ({
        fixtureId: fixture.fixtureId,
        homeTeam: fixture.homeTeam,
        awayTeam: fixture.awayTeam,
        homeTeamScore: parseInt(scores[fixture.fixtureId].home),
        awayTeamScore: parseInt(scores[fixture.fixtureId].away),
        round: fixture.round
      }));

      const result = await submitPredictions({ userName, predictions });

      // Format predictions for toast
      const predictionsList = predictions.map(p => 
        `${p.homeTeam} ${p.homeTeamScore} - ${p.awayTeamScore} ${p.awayTeam}`
      ).join('\n');

      // Show success toast
      toast({
        title: `Round ${result.round} Predictions Submitted`,
        description: (
          <div className="mt-2 space-y-2 text-sm">
            <div className="font-semibold">Date: {result.date}</div>
            <div className="font-mono whitespace-pre-wrap">{predictionsList}</div>
          </div>
        ),
        duration: 3000,
      });

      // Navigate after delay
      setTimeout(() => {
        router.push('/');
      }, 3000);

    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Error",
        description: "Failed to submit predictions. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ... rest of the component code remains the same ...
} 