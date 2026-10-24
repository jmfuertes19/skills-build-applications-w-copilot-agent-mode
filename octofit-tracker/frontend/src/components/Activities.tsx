import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type ActivityRecord = {
  type: string;
  minutes: number;
  points: number;
  user?: string;
  team?: string;
  occurredAt?: string;
};

export default function Activities() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadActivities() {
      try {
        const response = await getJson<{ activities: ActivityRecord[] }>('/api/activities');
        if (active) {
          setActivities(response.activities ?? []);
          setError(null);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load activities.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadActivities();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Activities</h2>
          <p>Track student activity minutes and points.</p>
          <p role="status">Loading activities...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Activities</h2>
          <p>Track student activity minutes and points.</p>
          <p role="alert">Unable to load activities: {error}</p>
        </div>
      </section>
    );
  }

  if (activities.length === 0) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Activities</h2>
          <p>Track student activity minutes and points.</p>
          <p>No activities yet.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Activities</h2>
        <p>Track student activity minutes and points.</p>
        <ul className="list-group list-group-flush">
          {activities.map((activity, index) => (
            <li key={`${activity.type}-${activity.minutes}-${index}`} className="list-group-item">
              <strong>{activity.type}</strong> · {activity.minutes} minutes · {activity.points} points
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
