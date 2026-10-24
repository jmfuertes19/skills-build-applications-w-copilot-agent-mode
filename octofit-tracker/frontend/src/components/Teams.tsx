import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type TeamRecord = {
  name: string;
  mascot: string;
  members: Array<string | { _id?: string; toString?: () => string }>;
};

export default function Teams() {
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadTeams() {
      try {
        const response = await getJson<{ teams: TeamRecord[] }>('/api/teams');
        if (active) {
          setTeams(response.teams ?? []);
          setError(null);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load teams.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadTeams();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Teams</h2>
          <p>Manage teams and members.</p>
          <p role="status">Loading teams...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Teams</h2>
          <p>Manage teams and members.</p>
          <p role="alert">Unable to load teams: {error}</p>
        </div>
      </section>
    );
  }

  if (teams.length === 0) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Teams</h2>
          <p>Manage teams and members.</p>
          <p>No teams available.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Teams</h2>
        <p>Manage teams and members.</p>
        <ul className="list-group list-group-flush">
          {teams.map((team, index) => (
            <li key={`${team.name}-${index}`} className="list-group-item">
              <strong>{team.name}</strong> ({team.mascot})
              <div className="small text-muted">
                Members: {team.members.map((member) => (typeof member === 'string' ? member : member?._id ?? member?.toString?.() ?? 'Unknown')).join(', ') || 'None'}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
