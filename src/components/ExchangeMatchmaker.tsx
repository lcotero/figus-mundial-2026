import React, { useState } from 'react';
import { FriendRelation } from '../types';
import { WC_TEAMS, TOTAL_STICKERS_PER_TEAM } from '../lib/teamsData';
import { ArrowLeftRight, Check, AlertCircle, Share2, ArrowLeft } from 'lucide-react';

interface ExchangeMatchmakerProps {
  myAlbum: Record<string, number>;
  friendAlbum: Record<string, number>;
  friend: FriendRelation;
  onBack: () => void;
}

interface StickerDetail {
  key: string;
  team: string;
  num: number;
}

export default function ExchangeMatchmaker({
  myAlbum,
  friendAlbum,
  friend,
  onBack,
}: ExchangeMatchmakerProps) {
  const [selectedOffer, setSelectedOffer] = useState<string[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const iCanGive: StickerDetail[] = [];
  const friendCanGive: StickerDetail[] = [];

  for (const team of WC_TEAMS) {
    for (let i = 1; i <= TOTAL_STICKERS_PER_TEAM; i++) {
      const key = `${team}_${i}`;
      const myCount = myAlbum[key] || 0;
      const friendCount = friendAlbum[key] || 0;

      if (myCount > 1 && friendCount === 0) {
        iCanGive.push({ key, team, num: i });
      }

      if (friendCount > 1 && myCount === 0) {
        friendCanGive.push({ key, team, num: i });
      }
    }
  }

  const getOfferText = () => {
    if (selectedOffer.length === 0) return 'Ninguna seleccionada';
    return selectedOffer.map(key => {
      const parts = key.split('_');
      return `${parts[0]} #${parts[1]}`;
    }).join(', ');
  };

  const getRequestText = () => {
    if (selectedRequest.length === 0) return 'Ninguna seleccionada';
    return selectedRequest.map(key => {
      const parts = key.split('_');
      return `${parts[0]} #${parts[1]}`;
    }).join(', ');
  };

  const handleToggleOffer = (key: string) => {
    setSelectedOffer(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleToggleRequest = (key: string) => {
    setSelectedRequest(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleCopyProposal = () => {
    const offerStickers = selectedOffer.map(key => {
      const parts = key.split('_');
      return `- ${parts[0]} #${parts[1]}`;
    }).join('\n');

    const requestStickers = selectedRequest.map(key => {
      const parts = key.split('_');
      return `- ${parts[0]} #${parts[1]}`;
    }).join('\n');

    const message = `*PROPUESTA DE TRUEQUE - FIGUS 2026*
Con mi amigo/a: *${friend.friendName}*

*Te ofrezco (Mis Repetidas):*
${offerStickers || '(Ninguna seleccionada todavía)'}

*Te pido (Tus Repetidas):*
${requestStickers || '(Ninguna seleccionada todavía)'}

_Enviado desde nuestra app de figuritas del Mundial 2026._`;

    navigator.clipboard.writeText(message)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      })
      .catch(err => {
        console.error('Error copying:', err);
        alert(`Copia esta propuesta para enviarla por WhatsApp:\n\n${message}`);
      });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl transition-colors shrink-0 shadow-sm border border-slate-200 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Cruzar Planilla</h3>
              <span className="bg-fifa-blue/10 text-fifa-blue text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full font-black">
                Compatibilidad Activa
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Analizando repetidas cruzadas con <strong className="text-slate-800">{friend.friendName} ({friend.friendEmail})</strong>.
            </p>
          </div>
        </div>
      </div>

      {(!friend.albumSynced) && (
        <div className="bg-amber-50 text-amber-850 p-4 rounded-2xl border border-fifa-gold/30 flex items-start space-x-3 text-xs leading-relaxed">
          <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-amber-600" />
          <div>
            <span className="font-black block">Tu amigo no ha sincronizado su álbum todavía</span>
            Para ver datos precisos, {friend.friendName} debe iniciar sesión en la app y pulsar "Sincronizar Planilla" en el menú principal. Mostrando el estado en blanco por el momento.
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-fifa-blue p-6 rounded-3xl text-white shadow-xl border border-white/5 space-y-4">
        <div className="flex items-center space-x-2 text-fifa-gold">
          <ArrowLeftRight className="h-5 w-5" />
          <h4 className="font-black tracking-tight uppercase">Propuesta de Trueque Activa</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-1">
            <span className="text-[10px] text-fifa-green font-extrabold uppercase block tracking-wider">Yo le doy ({selectedOffer.length})</span>
            <p className="text-sm font-black truncate text-slate-100">{getOfferText()}</p>
          </div>

          <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-1">
            <span className="text-[10px] text-fifa-gold font-extrabold uppercase block tracking-wider">Me da ({selectedRequest.length})</span>
            <p className="text-sm font-black truncate text-slate-100">{getRequestText()}</p>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
          <p className="text-slate-400 max-w-sm">
            Tildá las figuritas de abajo para armar la propuesta ideal. Luego copiala para mandarsela por WhatsApp o mail.
          </p>

          <button
            onClick={handleCopyProposal}
            disabled={selectedOffer.length === 0 && selectedRequest.length === 0}
            className="bg-fifa-green hover:bg-emerald-600 active:scale-95 text-white font-black px-5 py-3 rounded-xl shadow-lg transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-40 disabled:scale-100 cursor-pointer text-xs"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 font-black text-white" /> ¡Copiado!
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" /> Copiar para WhatsApp
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-md space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div>
              <h4 className="font-extrabold text-sm text-slate-800">
                Mis Figus Repetidas para {friend.friendName} ({iCanGive.length})
              </h4>
              <p className="text-[11px] text-slate-400">Figuritas mías duplicadas que a {friend.friendName} le faltan.</p>
            </div>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {iCanGive.map(sticker => {
              const isChecked = selectedOffer.includes(sticker.key);
              return (
                <button
                  key={sticker.key}
                  onClick={() => handleToggleOffer(sticker.key)}
                  className={`w-full p-3 rounded-2xl border flex items-center justify-between text-left transition-all ${
                    isChecked
                      ? 'bg-emerald-50/50 border-fifa-green ring-2 ring-fifa-green/20'
                      : 'bg-slate-50 border-slate-150 hover:bg-slate-100/45'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-10 h-10 bg-fifa-green text-white font-black text-sm rounded-xl flex items-center justify-center">
                      {sticker.num}
                    </span>
                    <div>
                      <span className="text-xs font-black text-slate-800 block leading-tight font-mono">{sticker.team}</span>
                      <span className="text-[10px] text-slate-500 font-semibold">Tengo {myAlbum[sticker.key]} copias disponible(s)</span>
                    </div>
                  </div>

                  <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 ${
                    isChecked ? 'bg-fifa-green border-fifa-green text-white' : 'border-slate-300 bg-white'
                  }`}>
                    {isChecked && <Check className="h-3 w-3 text-white" />}
                  </div>
                </button>
              );
            })}

            {iCanGive.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-xs">
                No tenés figuritas repetidas que le sirvan a {friend.friendName}.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-md space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div>
              <h4 className="font-extrabold text-sm text-slate-800">
                Repetidas de {friend.friendName} que me sirven ({friendCanGive.length})
              </h4>
              <p className="text-[11px] text-slate-400">Figuritas de tu amigo que tenés vacías en tu álbum.</p>
            </div>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {friendCanGive.map(sticker => {
              const isChecked = selectedRequest.includes(sticker.key);
              return (
                <button
                  key={sticker.key}
                  onClick={() => handleToggleRequest(sticker.key)}
                  className={`w-full p-3 rounded-2xl border flex items-center justify-between text-left transition-all ${
                    isChecked
                      ? 'bg-blue-50/50 border-fifa-blue ring-2 ring-fifa-blue/20'
                      : 'bg-slate-50 border-slate-150 hover:bg-slate-100/45'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-10 h-10 bg-fifa-blue text-white font-black text-sm rounded-xl flex items-center justify-center">
                      {sticker.num}
                    </span>
                    <div>
                      <span className="text-xs font-black text-slate-800 block leading-tight font-mono">{sticker.team}</span>
                      <span className="text-[10px] text-slate-500 font-semibold">Tu amigo tiene {friendAlbum[sticker.key]} copias</span>
                    </div>
                  </div>

                  <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 ${
                    isChecked ? 'bg-fifa-blue border-fifa-blue text-white' : 'border-slate-300 bg-white'
                  }`}>
                    {isChecked && <Check className="h-3 w-3 text-white" />}
                  </div>
                </button>
              );
            })}

            {friendCanGive.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-xs">
                {friend.friendName} no tiene figuritas repetidas que te falten.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
