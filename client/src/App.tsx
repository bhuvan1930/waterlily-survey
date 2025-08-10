import { useState } from 'react';
import SurveyForm from './components/SurveyForm';
import Review from './components/Review';

export default function App() {
  const [id, setId] = useState<number | null>(null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      {id === null ? <SurveyForm onComplete={setId} /> : <Review responseId={id} />}
    </div>
  );
}
