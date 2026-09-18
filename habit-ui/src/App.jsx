import { useState, useEffect } from 'react';

function App() {
  const [habits, setHabits] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [journal, setJournal] = useState({
    sleepQuality: '',
    urgeStatus: '',
    dailyWin: '',
    mindDump: '',
    socialConnection: '',
    tomorrowFocus: ''
  });
  const [journalSaved, setJournalSaved] = useState(false);
  const [history, setHistory] = useState([]);

  // Detecció dinàmica del host per funcionar tant a PC com a Mòbil
  const API_URL = `http://${window.location.hostname}:5000/api`;

  const fetchHabits = async () => {
    try {
      const res = await fetch(`${API_URL}/habits/today`);
      const data = await res.json();
      if (Array.isArray(data)) setHabits(data);
    } catch (err) {
      console.error('Error carregant hàbits:', err);
    }
  };

  const fetchJournal = async () => {
    try {
      const res = await fetch(`${API_URL}/journal/today`);
      const data = await res.json();
      if (data) {
        setJournal({
          sleepQuality: data.SleepQuality || '',
          urgeStatus: data.UrgeStatus || '',
          dailyWin: data.DailyWin || '',
          mindDump: data.MindDump || '',
          socialConnection: data.SocialConnection || '',
          tomorrowFocus: data.TomorrowFocus || ''
        });
      }
    } catch (err) {
      console.error('Error carregant journal:', err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/journal/history`);
      const data = await res.json();
      if (Array.isArray(data)) setHistory(data);
    } catch (err) {
      console.error('Error carregant historial:', err);
    }
  };

  useEffect(() => {
    fetchHabits();
    fetchJournal();
    fetchHistory();
  }, []);

  const handleHabitSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const res = await fetch(`${API_URL}/habits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      if (res.ok) {
        setName('');
        setDescription('');
        fetchHabits();
      }
    } catch (err) {
      console.error('Error guardant hàbit:', err);
    }
  };

  const deleteHabit = async (id) => {
    if (!confirm('Vols eliminar aquest hàbit?')) return;
    try {
      const res = await fetch(`${API_URL}/habits/${id}`, { method: 'DELETE' });
      if (res.ok) fetchHabits();
    } catch (err) {
      console.error('Error eliminant hàbit:', err);
    }
  };

  const toggleHabit = async (id) => {
    try {
      const res = await fetch(`${API_URL}/habits/${id}/toggle`, { method: 'POST' });
      if (res.ok) fetchHabits();
    } catch (err) {
      console.error('Error actualitzant compliment:', err);
    }
  };

  const handleJournalSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/journal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(journal),
      });
      if (res.ok) {
        setJournalSaved(true);
        fetchHistory();
        setTimeout(() => setJournalSaved(false), 3000);
      }
    } catch (err) {
      console.error('Error guardant el journal:', err);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', padding: '24px 12px', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        
        {/* Capçalera */}
        <header style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#38bdf8', fontWeight: 'bold' }}>Rutina & Creixement</span>
          <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '4px 0 8px', letterSpacing: '-0.02em' }}>⚡ Panell de Control Diari</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>Construeix consistència dia rere dia.</p>
        </header>

        {/* 1. SECCIÓ HÀBITS */}
        <section style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '16px', marginBottom: '24px', border: '1px solid #334155', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🎯 Hàbits d'avui
          </h2>

          <form onSubmit={handleHabitSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Nom de l'hàbit..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ flex: 1, minWidth: '150px', padding: '10px 14px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff', fontSize: '14px' }}
              />
              <input
                type="text"
                placeholder="Detall breu..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ flex: 1, minWidth: '150px', padding: '10px 14px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff', fontSize: '14px' }}
              />
            </div>
            <button
              type="submit"
              style={{ padding: '10px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px', transition: 'background 0.2s' }}
            >
              + Afegir nou hàbit
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {habits.map((habit) => {
              const isDone = Boolean(habit.CompletedToday);
              return (
                <div
                  key={habit.IdHabit}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    backgroundColor: isDone ? 'rgba(34, 197, 94, 0.1)' : '#0f172a',
                    border: '1px solid',
                    borderColor: isDone ? '#22c55e' : '#334155',
                    borderRadius: '10px',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ flex: 1, marginRight: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '600', fontSize: '15px', textDecoration: isDone ? 'line-through' : 'none', color: isDone ? '#4ade80' : '#f8fafc' }}>
                        {habit.Name}
                      </span>
                      {habit.streak > 0 && (
                        <span style={{ fontSize: '11px', background: '#451a03', color: '#fbbf24', padding: '2px 8px', borderRadius: '12px', fontWeight: '700', border: '1px solid #78350f' }}>
                          🔥 {habit.streak} {habit.streak === 1 ? 'dia' : 'dies'}
                        </span>
                      )}
                    </div>
                    {habit.Description && <p style={{ margin: '2px 0 0', color: '#94a3b8', fontSize: '13px' }}>{habit.Description}</p>}
                  </div>

                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button
                      onClick={() => toggleHabit(habit.IdHabit)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '700',
                        fontSize: '13px',
                        backgroundColor: isDone ? '#22c55e' : '#334155',
                        color: isDone ? '#052e16' : '#cbd5e1',
                        transition: 'background 0.2s'
                      }}
                    >
                      {isDone ? '✓ Fet' : 'Pendent'}
                    </button>
                    <button
                      onClick={() => deleteHabit(habit.IdHabit)}
                      title="Eliminar"
                      style={{ padding: '6px 8px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 2. SECCIÓ JOURNAL */}
        <section style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '16px', marginBottom: '24px', border: '1px solid #334155', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 16px 0' }}>
            📝 Diari de reflexió
          </h2>

          <form onSubmit={handleJournalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>🏆 Victòria d'avui</label>
              <textarea
                rows="2"
                placeholder="Què has complert avui que et faci sentir satisfet?"
                value={journal.dailyWin || ''}
                onChange={(e) => setJournal({ ...journal, dailyWin: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>💤 Qualitat del son</label>
                <input
                  type="text"
                  placeholder="Ex: 7h profundes, sense talls..."
                  value={journal.sleepQuality || ''}
                  onChange={(e) => setJournal({ ...journal, sleepQuality: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>🧘 Estat d'impulsos</label>
                <input
                  type="text"
                  placeholder="Ex: Serè, zero temptació de fumar..."
                  value={journal.urgeStatus || ''}
                  onChange={(e) => setJournal({ ...journal, urgeStatus: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>💭 Buidatge mental (soroll o preocupacions)</label>
              <textarea
                rows="2"
                placeholder="Aboca el soroll mental per deixar-lo anar..."
                value={journal.mindDump || ''}
                onChange={(e) => setJournal({ ...journal, mindDump: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>👥 Connexió social</label>
              <input
                type="text"
                placeholder="Ex: Bona conversa amb la família o amics..."
                value={journal.socialConnection || ''}
                onChange={(e) => setJournal({ ...journal, socialConnection: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>🎯 Acció clau per a demà</label>
              <input
                type="text"
                placeholder="L'única tasca innegociable de demà..."
                value={journal.tomorrowFocus || ''}
                onChange={(e) => setJournal({ ...journal, tomorrowFocus: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <button
              type="submit"
              style={{ padding: '12px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', marginTop: '6px' }}
            >
              Guardar diari d'avui
            </button>

            {journalSaved && (
              <p style={{ color: '#34d399', fontWeight: '700', textAlign: 'center', margin: '4px 0 0', fontSize: '14px' }}>
                ✓ Guardat correctament a MySQL!
              </p>
            )}
          </form>
        </section>

        {/* 3. SECCIÓ HISTORIAL */}
        <section style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '16px', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 16px 0' }}>
            📖 Historial recent
          </h2>
          {history.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '14px' }}>Encara no hi ha entrades prèvies registrades.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {history.map((entry) => {
                const formattedDate = new Date(entry.Date).toLocaleDateString('ca-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                });
                return (
                  <div key={entry.IdJournalEntries} style={{ backgroundColor: '#0f172a', padding: '14px', borderRadius: '10px', border: '1px solid #334155' }}>
                    <div style={{ color: '#38bdf8', fontWeight: '700', fontSize: '14px', textTransform: 'capitalize', marginBottom: '6px' }}>
                      📅 {formattedDate}
                    </div>
                    {entry.DailyWin && <p style={{ margin: '4px 0', fontSize: '13px' }}><strong style={{ color: '#facc15' }}>🏆 Victòria:</strong> {entry.DailyWin}</p>}
                    {entry.SleepQuality && <p style={{ margin: '4px 0', fontSize: '13px' }}><strong style={{ color: '#94a3b8' }}>💤 Son:</strong> {entry.SleepQuality}</p>}
                    {entry.UrgeStatus && <p style={{ margin: '4px 0', fontSize: '13px' }}><strong style={{ color: '#94a3b8' }}>🧘 Impulsos:</strong> {entry.UrgeStatus}</p>}
                    {entry.MindDump && <p style={{ margin: '4px 0', fontSize: '13px', color: '#94a3b8' }}><strong>💭 Buidatge:</strong> {entry.MindDump}</p>}
                    {entry.TomorrowFocus && <p style={{ margin: '4px 0', fontSize: '13px', color: '#34d399' }}><strong>🎯 Focus:</strong> {entry.TomorrowFocus}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

export default App;