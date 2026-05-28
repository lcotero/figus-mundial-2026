import React, { useState } from 'react';
import { WC_TEAMS, TOTAL_STICKERS_PER_TEAM } from '../lib/teamsData';
import { Search, Plus, Minus, Flame, Save } from 'lucide-react';

const ALL_TEAMS_VIEW = '__all_teams__';

type FilterType = 'all' | 'missing' | 'owned' | 'repeated';

interface StickerGridProps {
  stickers: Record<string, number>;
  onStickerChange: (team: string, num: number, increment: boolean) => void;
  isSaving: boolean;
  onManualSave: () => void;
  lastSynced: Date | null;
}

export default function StickerGrid({
  stickers,
  onStickerChange,
  isSaving,
  onManualSave,
  lastSynced,
}: StickerGridProps) {
  const [selectedTeam, setSelectedTeam] = useState<string>(WC_TEAMS[0]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const totalStickersCount = WC_TEAMS.length * TOTAL_STICKERS_PER_TEAM;
  const ownedUnique = Object.values(stickers).filter(count => count > 0).length;
  const totalRepeated = Object.values(stickers).reduce((total, count) => total + Math.max(count - 1, 0), 0);
  const completionPercent = Math.round((ownedUnique / totalStickersCount) * 100) || 0;

  const filteredTeams = WC_TEAMS.filter(team => team.toLowerCase().includes(searchQuery.toLowerCase()));
  const isAllTeamsView = selectedTeam === ALL_TEAMS_VIEW;
  const activeTeam = isAllTeamsView ? ALL_TEAMS_VIEW : (filteredTeams.includes(selectedTeam) ? selectedTeam : filteredTeams[0] || '');
  const activeTitle = isAllTeamsView ? 'Todas las selecciones' : activeTeam;
  const stickerNumbers = Array.from({ length: TOTAL_STICKERS_PER_TEAM }, (_, index) => index + 1);

  const visibleStickers = (isAllTeamsView ? WC_TEAMS : activeTeam ? [activeTeam] : [])
    .flatMap(team => stickerNumbers.map(num => ({ team, num })))
    .filter(({ team, num }) => {
      const count = stickers[`${team}_${num}`] || 0;
      if (filter === 'missing') return count === 0;
      if (filter === 'owned') return count > 0;
      if (filter === 'repeated') return count > 1;
      return true;
    });

  const getTeamStats = (team: string) => {
    let owned = 0;
    let repeated = 0;
    for (let num = 1; num <= TOTAL_STICKERS_PER_TEAM; num++) {
      const count = stickers[`${team}_${num}`] || 0;
      if (count > 0) owned++;
      repeated += Math.max(count - 1, 0);
    }
    return { owned, repeated };
  };

  return (
    <div className="space-y-6">
      <section className="bg-gradient-to-r from-fifa-green via-emerald-600 to-fifa-blue rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 text-white/5 font-bold text-9xl pointer-events-none select-none">
          26
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          <div className="space-y-1 col-span-1 md:col-span-2">
            <h3 className="text-2xl font-black tracking-tight uppercase">Mi Álbum Oficial</h3>
            <p className="text-emerald-50 text-xs">Mantené al día tu colección y sincronizá con Google Sheets.</p>
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span>Progreso del Álbum</span>
                <span className="font-mono text-fifa-gold">{ownedUnique} / {totalStickersCount} ({completionPercent}%)</span>
              </div>
              <div className="w-full bg-black/25 rounded-full h-3 overflow-hidden border border-white/5">
                <div className="bg-fifa-gold h-full rounded-full transition-all duration-500" style={{ width: `${completionPercent}%` }} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-white/10 p-4 rounded-2xl backdrop-blur-md self-stretch md:col-span-2 border border-white/10">
            <div className="text-center"><span className="block text-2xl font-black">{ownedUnique}</span><span className="text-[9px] uppercase tracking-widest font-bold">Tengo</span></div>
            <div className="text-center border-x border-white/10"><span className="block text-2xl font-black text-emerald-200">{totalStickersCount - ownedUnique}</span><span className="text-[9px] uppercase tracking-widest font-bold">Faltan</span></div>
            <div className="text-center"><span className="block text-2xl font-black text-fifa-gold">{totalRepeated}</span><span className="text-[9px] uppercase tracking-widest font-bold flex items-center justify-center gap-0.5">Repetidas <Flame className="h-3 w-3 fill-fifa-gold" /></span></div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-2 items-center justify-between text-xs text-emerald-50">
          <span>{lastSynced ? <>Sincronizado con Sheets: <strong className="text-white bg-black/10 px-2 py-0.5 rounded font-mono">{lastSynced.toLocaleTimeString()}</strong></> : 'Cambios guardados localmente'}</span>
          <button onClick={onManualSave} disabled={isSaving} className="bg-fifa-gold hover:bg-yellow-300 text-slate-900 px-4 py-1.5 rounded-xl font-black shadow-md transition-transform active:scale-95 disabled:opacity-50 text-xs shrink-0 cursor-pointer flex items-center gap-1.5">
            <Save className="h-3.5 w-3.5" /> {isSaving ? 'Guardando...' : 'Sincronizar Planilla'}
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="bg-white rounded-2xl shadow-md border border-slate-100 p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar selección..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-250 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-fifa-blue"
            />
          </div>

          <div className="max-h-[420px] overflow-y-auto space-y-1 pr-1">
            <button
              onClick={() => setSelectedTeam(ALL_TEAMS_VIEW)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-black tracking-wide transition-all flex justify-between items-center border ${isAllTeamsView ? 'bg-fifa-blue text-white shadow-md border-transparent' : 'hover:bg-slate-50 text-slate-700 border-transparent'}`}
            >
              <span className="truncate pr-1 uppercase font-mono">Ver todos</span>
              <span className={`text-[10px] font-semibold ${isAllTeamsView ? 'text-blue-100' : 'text-slate-400'}`}>{totalRepeated > 0 ? `+${totalRepeated}` : `${ownedUnique}/${totalStickersCount}`}</span>
            </button>

            {filteredTeams.map(team => {
              const stats = getTeamStats(team);
              const isActive = activeTeam === team;
              return (
                <button
                  key={team}
                  onClick={() => setSelectedTeam(team)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all flex justify-between items-center border ${isActive ? 'bg-fifa-blue text-white shadow-md border-transparent font-black' : 'hover:bg-slate-50 text-slate-700 border-transparent'}`}
                >
                  <span className="truncate pr-1 uppercase font-mono">{team}</span>
                  <span className="flex items-center space-x-1 shrink-0">
                    <span className={`text-[10px] font-semibold ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>({stats.owned}/{TOTAL_STICKERS_PER_TEAM})</span>
                    {stats.repeated > 0 && <span className={`font-black rounded-lg px-2 py-0.5 text-[9px] ${isActive ? 'bg-fifa-gold text-slate-900 shadow' : 'bg-amber-100 text-amber-800'}`}>+{stats.repeated}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="lg:col-span-3 bg-white rounded-3xl shadow-md border border-slate-100 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
            <div>
              <h4 className="text-2xl font-black text-slate-900 tracking-tight uppercase font-mono">{activeTitle}</h4>
              <p className="text-xs text-slate-500">{isAllTeamsView ? 'Usá los filtros para ver faltantes o repetidas de todo el álbum juntas.' : 'Tocá el número para sumar o usá los controles de cada figurita.'}</p>
            </div>
            <div className="flex flex-wrap bg-slate-100/80 p-1 rounded-xl border border-slate-200/50 text-xs gap-1">
              {(['all', 'missing', 'owned', 'repeated'] as const).map(type => {
                const labels = { all: 'Todas', missing: 'Faltantes', owned: 'Tengo', repeated: 'Repetidas' };
                return <button key={type} onClick={() => setFilter(type)} className={`px-3 py-1.5 rounded-lg font-bold transition-all ${filter === type ? 'bg-fifa-blue text-white shadow font-black' : 'text-slate-500 hover:text-slate-800'}`}>{labels[type]}</button>;
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {visibleStickers.map(({ team, num }) => {
              const count = stickers[`${team}_${num}`] || 0;
              const isOwned = count > 0;
              const isRepeated = count > 1;
              const boxStyle = isRepeated ? 'bg-[#FFFBEB] border-2 border-fifa-gold ring-4 ring-fifa-gold/10' : isOwned ? 'bg-[#F0FFF4] border-2 border-fifa-green' : 'bg-white border-2 border-slate-200 border-dashed';
              const numStyle = isRepeated ? 'text-amber-800 font-extrabold' : isOwned ? 'text-fifa-green font-black' : 'text-slate-400';

              return (
                <div key={`${team}_${num}`} className={`aspect-[3/4] p-3 rounded-2xl transition-all relative flex flex-col items-center justify-between shadow-sm ${boxStyle}`}>
                  {isRepeated && <span className="absolute -top-2 -right-2 bg-fifa-gold text-slate-900 font-black text-[11px] h-6 px-2 rounded-full flex items-center justify-center border-2 border-white shadow-md">{count}</span>}
                  <button onClick={() => onStickerChange(team, num, true)} className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white shadow border border-slate-150 font-black text-2xl select-none transition-transform active:scale-95 focus:outline-none">
                    <span className={numStyle}>{num}</span>
                  </button>
                  {isAllTeamsView && <div className="text-[9px] text-slate-400 font-black uppercase text-center leading-tight line-clamp-2 px-1">{team}</div>}
                  <div className="text-[10px] text-slate-500 font-bold select-none text-center">{count === 0 ? 'Faltante' : count === 1 ? '¡Tengo!' : `${count} unidades`}</div>
                  <div className="flex items-center space-x-1.5 mt-2 bg-white rounded-lg shadow-sm border border-slate-150 overflow-hidden text-xs shrink-0 p-0.5">
                    <button onClick={() => onStickerChange(team, num, false)} disabled={count === 0} className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-30 hover:bg-slate-50 rounded"><Minus className="h-3.5 w-3.5" /></button>
                    <span className="font-bold text-slate-800 px-0.5 min-w-[12px] text-center font-mono">{count}</span>
                    <button onClick={() => onStickerChange(team, num, true)} className="p-1 text-slate-400 hover:text-fifa-green hover:bg-slate-50 rounded"><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              );
            })}
          </div>

          {visibleStickers.length === 0 && <div className="text-center py-12 text-slate-400 text-xs">No hay figuritas que coincidan con el filtro actual.</div>}
        </section>
      </div>
    </div>
  );
}
