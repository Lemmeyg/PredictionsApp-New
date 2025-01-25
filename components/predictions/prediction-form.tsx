'use client'

import { useState, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { submitPredictions } from '@/app/actions/submit-predictions';
import { useRouter } from 'next/navigation';

interface Props {
  fixtures: {
    fixtureId: number;
    homeTeam: string;
    awayTeam: string;
    round: number;
  }[];
  userName: string;
}

export function PredictionForm({ fixtures, userName }: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const [scores, setScores] = useState<Record<number, { home: string; away: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Create refs for all input fields
  const inputRefs = useRef<Record<string, HTMLInputElement>>({});

  const handleInputChange = (
    fixtureId: number, 
    team: 'home' | 'away', 
    value: string,
    currentIndex: number
  ) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    // Update scores
    setScores(prev => ({
      ...prev,
      [fixtureId]: {
        ...prev[fixtureId],
        [team]: value
      }
    }));

    // If a single digit is entered, move to next input
    if (value.length === 1) {
      const nextIndex = currentIndex + 1;
      const totalInputs = fixtures.length * 2;
      
      if (nextIndex < totalInputs) {
        const nextFixtureIndex = Math.floor(nextIndex / 2);
        const isNextHome = nextIndex % 2 === 0;
        const nextFixture = fixtures[nextFixtureIndex];
        const nextId = `${nextFixture.fixtureId}-${isNextHome ? 'home' : 'away'}`;
        
        inputRefs.current[nextId]?.focus();
      }
    }
  };

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {fixtures.map((fixture, index) => (
        <div key={fixture.fixtureId} className="grid grid-cols-[1fr,auto,auto,1fr] items-center gap-2">
          <div className="text-right text-sm text-amber-500">{fixture.homeTeam}</div>
          <Input
            ref={el => {
              if (el) inputRefs.current[`${fixture.fixtureId}-home`] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="\d*"
            maxLength={1}
            className="w-12 text-center"
            value={scores[fixture.fixtureId]?.home || ''}
            onChange={(e) => handleInputChange(
              fixture.fixtureId, 
              'home', 
              e.target.value,
              index * 2
            )}
          />
          <Input
            ref={el => {
              if (el) inputRefs.current[`${fixture.fixtureId}-away`] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="\d*"
            maxLength={1}
            className="w-12 text-center"
            value={scores[fixture.fixtureId]?.away || ''}
            onChange={(e) => handleInputChange(
              fixture.fixtureId, 
              'away', 
              e.target.value,
              index * 2 + 1
            )}
          />
          <div className="text-sm text-amber-500">{fixture.awayTeam}</div>
        </div>
      ))}
      
      <Button 
        type="submit" 
        className="w-full bg-amber-500 text-white"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Predictions'}
      </Button>
    </form>
  );
} 