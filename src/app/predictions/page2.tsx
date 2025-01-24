import { PredictionForm } from '@/components/predictions/prediction-form';

export default async function PredictionsPage({
  params: { userName }
}: {
  params: { userName: string }
}) {
  // Fetch fixtures for current round
  const fixtures = await getCurrentRoundFixtures();
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Enter Your Predictions</h1>
      <PredictionForm 
        fixtures={fixtures}
        userName={userName}
      />
    </div>
  );
} 