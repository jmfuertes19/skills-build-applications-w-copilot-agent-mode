import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type WorkoutSuggestion = {
  title: string;
  focus: string;
  minutes?: number;
  difficulty?: string;
  reason?: string;
};

const userEmail = 'mona@example.com';

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSuggestions() {
      try {
        const response = await getJson<{ suggestions: WorkoutSuggestion[] }>(`/api/workouts/suggestions/${encodeURIComponent(userEmail)}`);
        if (active) {
          setSuggestions(response.suggestions ?? []);
          setError(null);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load workout suggestions.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadSuggestions();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Workout suggestions</h2>
          <p>Recommend workouts from activity patterns.</p>
          <p role="status">Loading workout suggestions...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Workout suggestions</h2>
          <p>Recommend workouts from activity patterns.</p>
          <p role="alert">Unable to load workout suggestions: {error}</p>
        </div>
      </section>
    );
  }

  if (suggestions.length === 0) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Workout suggestions</h2>
          <p>Recommend workouts from activity patterns.</p>
          <p>No workout suggestions available.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Workout suggestions</h2>
        <p>Recommend workouts from activity patterns.</p>
        <ul className="list-group list-group-flush">
          {suggestions.map((suggestion, index) => (
            <li key={`${suggestion.title}-${index}`} className="list-group-item">
              <strong>{suggestion.title}</strong>
              <div className="small text-muted">
                {suggestion.focus} · {suggestion.minutes ?? 0} minutes · {suggestion.difficulty ?? 'moderate'}
              </div>
              <div>{suggestion.reason ?? 'A tailored recommendation for your routine.'}</div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
