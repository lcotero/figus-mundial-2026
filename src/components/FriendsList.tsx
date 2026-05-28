import React, { useState } from 'react';
import { FriendRelation } from '../types';
import { Link, Mail, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';

interface FriendsListProps {
  mySpreadsheetId: string;
  friends: FriendRelation[];
  onAddFriendSheet: (name: string, sheetRef: string) => Promise<void>;
  onShareMySheet: (email: string) => Promise<void>;
  onDiscoverSharedSheets: () => Promise<number>;
  onRemoveFriend: (spreadsheetId: string) => void;
  onSelectFriend: (spreadsheetId: string) => void;
  isLoading: boolean;
}

export default function FriendsList({
  mySpreadsheetId,
  friends,
  onAddFriendSheet,
  onShareMySheet,
  onDiscoverSharedSheets,
  onRemoveFriend,
  onSelectFriend,
  isLoading,
}: FriendsListProps) {
  const [nameInput, setNameInput] = useState('');
  const [sheetInput, setSheetInput] = useState('');
  const [shareEmailInput, setShareEmailInput] = useState('');
  const [errorWord, setErrorWord] = useState('');
  const [successWord, setSuccessWord] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const acceptedFriends = friends.filter(f => f.status === 'accepted');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !sheetInput.trim()) return;

    setActionLoading(true);
    setErrorWord('');
    setSuccessWord('');

    try {
      await onAddFriendSheet(nameInput.trim(), sheetInput.trim());
      setSuccessWord('Planilla agregada. Ya podés cruzar repetidas.');
      setNameInput('');
      setSheetInput('');
    } catch (err: any) {
      setErrorWord(err.message || 'No pudimos agregar esa planilla.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareEmailInput.trim()) return;

    setActionLoading(true);
    setErrorWord('');
    setSuccessWord('');

    try {
      await onShareMySheet(shareEmailInput.trim());
      setSuccessWord('Planilla compartida. Tu amigo puede detectarla desde su app.');
      setShareEmailInput('');
    } catch (err: any) {
      setErrorWord(err.message || 'No pudimos compartir tu planilla.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDiscover = async () => {
    setActionLoading(true);
    setErrorWord('');
    setSuccessWord('');

    try {
      const addedCount = await onDiscoverSharedSheets();
      setSuccessWord(addedCount > 0 ? `Agregamos ${addedCount} planilla(s) compartida(s).` : 'No encontramos planillas nuevas compartidas contigo.');
    } catch (err: any) {
      setErrorWord(err.message || 'No pudimos buscar planillas compartidas.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">Mi Planilla</span>
            <h3 className="text-xl font-extrabold text-slate-800 mt-1">Google Sheets</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Compartila por Gmail para que tus amigos la detecten sin copiar IDs.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">ID de planilla</span>
            <span className="text-xs font-black text-fifa-blue break-all font-mono">{mySpreadsheetId || 'Sin planilla vinculada'}</span>
          </div>

          <form onSubmit={handleShareSubmit} className="space-y-2">
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                placeholder="gmail de tu amigo"
                value={shareEmailInput}
                onChange={(e) => setShareEmailInput(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-fifa-green"
                disabled={actionLoading || isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={actionLoading || isLoading || !shareEmailInput.trim()}
              className="w-full bg-fifa-green hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-xs shadow-sm transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              Compartir por Gmail
            </button>
          </form>
        </div>

        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
          <div>
            <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">Sumar Amigo</span>
            <h3 className="text-xl font-extrabold text-slate-800 mt-1">Detectar o Agregar Planilla</h3>
          </div>

          {errorWord && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-200 text-xs font-medium">
              {errorWord}
            </div>
          )}

          {successWord && (
            <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg border border-emerald-200 text-xs font-semibold">
              {successWord}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleDiscover}
              disabled={actionLoading || isLoading}
              className="bg-fifa-blue hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-bold text-xs shadow-sm transition-transform active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Search className="h-3.5 w-3.5" />
              Buscar compartidas conmigo
            </button>
            <span className="text-xs text-slate-400 self-center">
              O pegá el link/ID si tu amigo te lo mandó por otro medio.
            </span>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-[minmax(0,180px)_1fr_auto] gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200/40">
            <input
              type="text"
              placeholder="Nombre"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-fifa-blue"
              disabled={actionLoading || isLoading}
            />
            <div className="relative">
              <Link className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Link o ID de Google Sheets"
                value={sheetInput}
                onChange={(e) => setSheetInput(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-fifa-blue"
                disabled={actionLoading || isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={actionLoading || isLoading || !nameInput.trim() || !sheetInput.trim()}
              className="bg-fifa-blue hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-bold text-xs shadow-sm transition-transform active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Agregar
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <h4 className="font-extrabold text-base text-slate-800">
            Planillas de Amigos ({acceptedFriends.length})
          </h4>
          <span className="text-[10px] text-fifa-blue font-bold uppercase tracking-widest bg-fifa-blue/10 px-2.5 py-1 rounded-full">
            Fuente: Sheets
          </span>
        </div>

        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {acceptedFriends.map(friend => (
            <div
              key={friend.friendshipId}
              className="p-4 bg-slate-50 rounded-xl border border-slate-200/40 flex flex-col sm:flex-row sm:items-center sm:justify-between hover:bg-fifa-blue/5 hover:border-fifa-blue/20 transition-all gap-4"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className="h-10 w-10 bg-gradient-to-tr from-fifa-blue to-fifa-green text-white rounded-full flex items-center justify-center font-black font-sans shadow-sm shrink-0">
                  {friend.friendName.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h5 className="text-sm font-extrabold text-slate-800">{friend.friendName}</h5>
                  <p className="text-xs text-slate-400 font-mono truncate">{friend.spreadsheetId}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => onSelectFriend(friend.friendUid)}
                  className="bg-fifa-blue hover:bg-blue-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Comparar
                </button>
                <button
                  onClick={() => onRemoveFriend(friend.friendUid)}
                  className="bg-white hover:bg-red-50 text-red-600 px-3 py-2 rounded-xl text-xs font-bold border border-red-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Quitar
                </button>
              </div>
            </div>
          ))}

          {acceptedFriends.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-xs">
              Todavía no agregaste planillas de amigos. Pediles que compartan su Google Sheet con tu correo.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
