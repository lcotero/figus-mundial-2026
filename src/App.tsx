import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, BookOpen, Check, Loader2, LogOut, Users } from 'lucide-react';
import SignInView from './components/SignInView';
import StickerGrid from './components/StickerGrid';
import FriendsList from './components/FriendsList';
import ExchangeMatchmaker from './components/ExchangeMatchmaker';
import { createEmptyAlbumMap } from './lib/teamsData';
import {
  createStickerSpreadsheet,
  findStickerSpreadsheet,
  listSharedStickerSpreadsheets,
  readSpreadsheetValues,
  shareSpreadsheetWithEmail,
  updateSpreadsheetValues
} from './lib/googleApi';
import {
  clearStoredAccessToken,
  consumeGoogleOAuthRedirect,
  fetchGoogleUserInfo,
  getGoogleClientId,
  getStoredAccessToken,
  startGoogleOAuthRedirect
} from './lib/googleAuth';
import { FriendRelation, UserProfile } from './types';

const PROFILE_CACHE_KEY = 'figus_profile';
const STICKERS_CACHE_KEY = 'figus_album_stickers';
const FRIENDS_CACHE_KEY = 'figus_friend_sheets';
const LAST_SYNC_CACHE_KEY = 'figus_last_synced';

function readJsonCache<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function extractSpreadsheetId(sheetRef: string) {
  const trimmed = sheetRef.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match?.[1] || trimmed;
}

function isUnauthorizedError(err: any) {
  const message = String(err?.message || err || '').toLowerCase();
  return message.includes('401') || message.includes('unauthorized') || message.includes('invalid credentials');
}

export default function App() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [albumStickers, setAlbumStickers] = useState<Record<string, number>>(createEmptyAlbumMap());
  const [friends, setFriends] = useState<FriendRelation[]>([]);
  const [selectedFriendUid, setSelectedFriendUid] = useState<string | null>(null);
  const [friendAlbumStickers, setFriendAlbumStickers] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<'album' | 'friends'>('album');
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [successText, setSuccessText] = useState<string | null>(null);
  const [lastSyncedDate, setLastSyncedDate] = useState<Date | null>(null);

  const isSavingRef = useRef(false);
  const pendingStickersUpdateRef = useRef<Record<string, number> | null>(null);

  useEffect(() => {
    const cachedProfile = readJsonCache<UserProfile | null>(PROFILE_CACHE_KEY, null);
    const cachedStickers = readJsonCache<Record<string, number>>(STICKERS_CACHE_KEY, createEmptyAlbumMap());
    const cachedFriends = readJsonCache<FriendRelation[]>(FRIENDS_CACHE_KEY, []);
    const cachedSync = localStorage.getItem(LAST_SYNC_CACHE_KEY);

    setUserProfile(cachedProfile);
    setAlbumStickers(cachedStickers);
    setFriends(cachedFriends);
    setLastSyncedDate(cachedSync ? new Date(cachedSync) : null);

    try {
      const redirectToken = consumeGoogleOAuthRedirect();
      const storedToken = redirectToken || getStoredAccessToken();

      if (!getGoogleClientId()) {
        setErrorText('Falta configurar VITE_GOOGLE_CLIENT_ID para conectar Google Sheets sin Firebase.');
      }

      if (storedToken) {
        setAccessToken(storedToken);
        connectGoogleSheets(storedToken).catch((err) => {
          console.error('Initial Sheets sync failed:', err);
          setErrorText(err.message || 'No pudimos sincronizar Google Sheets.');
        });
      }
    } catch (err: any) {
      console.error('OAuth redirect failed:', err);
      setErrorText(err.message || 'No pudimos completar el inicio de sesión con Google.');
    } finally {
      setIsInitializing(false);
    }
  }, []);

  async function connectGoogleSheets(token: string) {
    setIsSyncing(true);
    setErrorText(null);

    try {
      const googleUser = await fetchGoogleUserInfo(token);
      const cachedProfile = readJsonCache<UserProfile | null>(PROFILE_CACHE_KEY, null);
      let spreadsheetId = cachedProfile?.spreadsheetId || '';

      if (spreadsheetId) {
        try {
          await readSpreadsheetValues(token, spreadsheetId);
        } catch (err) {
          console.warn('Cached spreadsheet is not readable, finding/creating another one:', err);
          spreadsheetId = '';
        }
      }

      if (!spreadsheetId) {
        spreadsheetId = await findStickerSpreadsheet(token) || await createStickerSpreadsheet(token, googleUser.sub, googleUser.name);
      }

      const profile: UserProfile = {
        userId: googleUser.sub,
        email: googleUser.email,
        displayName: googleUser.name || 'Coleccionista',
        photoURL: googleUser.picture,
        friendCode: spreadsheetId,
        spreadsheetId,
        updatedAt: new Date()
      };

      setAccessToken(token);
      setUserProfile(profile);
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));

      await syncFromTrustedSheet(token, spreadsheetId);
    } catch (err: any) {
      if (isUnauthorizedError(err)) {
        clearStoredAccessToken();
        setAccessToken(null);
        setErrorText('La sesión de Google venció. Volvé a conectar tu cuenta.');
        return;
      }
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }

  async function syncFromTrustedSheet(token: string, spreadsheetId: string) {
    const cloudStickers = await readSpreadsheetValues(token, spreadsheetId);
    await updateSpreadsheetValues(token, spreadsheetId, cloudStickers);
    setAlbumStickers(cloudStickers);
    localStorage.setItem(STICKERS_CACHE_KEY, JSON.stringify(cloudStickers));
    localStorage.setItem(LAST_SYNC_CACHE_KEY, new Date().toISOString());
    setLastSyncedDate(new Date());
  }

  const handleGoogleSignIn = async () => {
    setIsAuthLoading(true);
    setErrorText(null);

    try {
      startGoogleOAuthRedirect();
    } catch (err: any) {
      setErrorText(err.message || 'No pudimos iniciar sesión con Google.');
      setIsAuthLoading(false);
    }
  };

  const handleLogout = () => {
    clearStoredAccessToken();
    setAccessToken(null);
    setUserProfile(null);
    setSelectedFriendUid(null);
  };

  const handleManualSync = async () => {
    if (!accessToken || !userProfile) {
      await handleGoogleSignIn();
      return;
    }

    setIsSyncing(true);
    setErrorText(null);

    try {
      await syncFromTrustedSheet(accessToken, userProfile.spreadsheetId);
      setSuccessText('Planilla sincronizada desde Google Sheets.');
      setTimeout(() => setSuccessText(null), 3000);
    } catch (err: any) {
      if (isUnauthorizedError(err)) {
        clearStoredAccessToken();
        setAccessToken(null);
        setErrorText('La sesión de Google venció. Volvé a conectar tu cuenta.');
      } else {
        setErrorText(err.message || 'No pudimos leer tu Google Sheet.');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const triggerSheetsAutosave = async (currentProfile: UserProfile, currentToken: string) => {
    if (isSavingRef.current) return;

    isSavingRef.current = true;
    setIsSyncing(true);

    try {
      while (pendingStickersUpdateRef.current !== null) {
        const stickersToSave = pendingStickersUpdateRef.current;
        pendingStickersUpdateRef.current = null;

        await updateSpreadsheetValues(currentToken, currentProfile.spreadsheetId, stickersToSave);
        localStorage.setItem(LAST_SYNC_CACHE_KEY, new Date().toISOString());
        setLastSyncedDate(new Date());
        setErrorText(null);
      }
    } catch (err: any) {
      if (isUnauthorizedError(err)) {
        clearStoredAccessToken();
        setAccessToken(null);
        setErrorText('La sesión de Google venció. Reconectá tu cuenta para guardar en Sheets.');
      } else {
        setErrorText('Guardamos el cambio localmente, pero no pudimos escribir en Google Sheets.');
      }
    } finally {
      isSavingRef.current = false;
      setIsSyncing(false);
    }
  };

  const handleStickerCountChange = async (team: string, num: number, increment: boolean) => {
    const key = `${team}_${num}`;

    setAlbumStickers(previousStickers => {
      const currentCount = previousStickers[key] || 0;
      const nextCount = increment ? currentCount + 1 : Math.max(currentCount - 1, 0);
      if (nextCount === currentCount) return previousStickers;

      const updated = {
        ...previousStickers,
        [key]: nextCount
      };

      localStorage.setItem(STICKERS_CACHE_KEY, JSON.stringify(updated));

      if (userProfile && accessToken) {
        pendingStickersUpdateRef.current = updated;
        triggerSheetsAutosave(userProfile, accessToken);
      }

      return updated;
    });
  };

  const handleAddFriendSheet = async (name: string, sheetRef: string) => {
    const spreadsheetId = extractSpreadsheetId(sheetRef);
    if (!spreadsheetId) throw new Error('Ingresá un link o ID de Google Sheets válido.');
    if (spreadsheetId === userProfile?.spreadsheetId) throw new Error('Esa es tu propia planilla.');
    if (friends.some(friend => friend.friendUid === spreadsheetId)) throw new Error('Esa planilla ya está agregada.');

    const nextFriend: FriendRelation = {
      friendshipId: spreadsheetId,
      friendUid: spreadsheetId,
      friendEmail: spreadsheetId,
      friendName: name,
      status: 'accepted',
      isSender: false,
      albumSynced: true,
      spreadsheetId
    };

    const nextFriends = [...friends, nextFriend];
    setFriends(nextFriends);
    localStorage.setItem(FRIENDS_CACHE_KEY, JSON.stringify(nextFriends));
  };

  const handleShareMySheet = async (email: string) => {
    if (!accessToken || !userProfile) throw new Error('Reconectá Google para compartir tu planilla.');
    await shareSpreadsheetWithEmail(accessToken, userProfile.spreadsheetId, email);
  };

  const handleDiscoverSharedSheets = async () => {
    if (!accessToken) throw new Error('Reconectá Google para buscar planillas compartidas.');

    const sharedSheets = await listSharedStickerSpreadsheets(accessToken);
    const newFriends = sharedSheets
      .filter(sheet => sheet.id !== userProfile?.spreadsheetId)
      .filter(sheet => !friends.some(friend => friend.friendUid === sheet.id))
      .map((sheet): FriendRelation => ({
        friendshipId: sheet.id,
        friendUid: sheet.id,
        friendEmail: sheet.ownerEmail || sheet.id,
        friendName: sheet.ownerEmail || sheet.name.replace(/^Figus_Mundial_2026_/, ''),
        status: 'accepted',
        isSender: false,
        albumSynced: true,
        spreadsheetId: sheet.id
      }));

    if (newFriends.length === 0) return 0;

    const nextFriends = [...friends, ...newFriends];
    setFriends(nextFriends);
    localStorage.setItem(FRIENDS_CACHE_KEY, JSON.stringify(nextFriends));
    return newFriends.length;
  };

  const handleRemoveFriend = (spreadsheetId: string) => {
    const nextFriends = friends.filter(friend => friend.friendUid !== spreadsheetId);
    setFriends(nextFriends);
    localStorage.setItem(FRIENDS_CACHE_KEY, JSON.stringify(nextFriends));
  };

  const handleSelectFriendForExchange = async (spreadsheetId: string) => {
    const friendMeta = friends.find(f => f.friendUid === spreadsheetId);
    if (!friendMeta || !accessToken) return;

    setIsSyncing(true);
    setErrorText(null);

    try {
      const friendStickers = await readSpreadsheetValues(accessToken, spreadsheetId);
      setFriendAlbumStickers(friendStickers);
      friendMeta.albumSynced = true;
      setSelectedFriendUid(spreadsheetId);
    } catch (err: any) {
      console.error('Error loading friend sheet:', err);
      setFriendAlbumStickers({});
      friendMeta.albumSynced = false;
      setErrorText('No pudimos leer esa planilla. Verificá que tu amigo la haya compartido con tu correo de Google.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCloseExchangeView = () => {
    setSelectedFriendUid(null);
    setFriendAlbumStickers({});
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 text-emerald-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Cargando aplicación...</p>
        </div>
      </div>
    );
  }

  if (!accessToken || !userProfile) {
    return (
      <SignInView
        onSignIn={handleGoogleSignIn}
        isLoading={isAuthLoading || isSyncing}
        errorText={errorText}
      />
    );
  }

  const activeFriend = friends.find(f => f.friendUid === selectedFriendUid);

  return (
    <div className="min-h-screen bg-fifa-bg font-sans text-slate-800 antialiased flex flex-col p-4 sm:p-6 lg:p-8 gap-6">
      <header className="bg-fifa-green rounded-2xl text-white shadow-lg shrink-0 py-4 px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center font-black text-fifa-green shadow-md text-lg select-none">
              26
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight flex items-center gap-1.5 uppercase">
                Figus Mundial 2026
              </h1>
              <span className="text-[10px] text-emerald-100 font-semibold block uppercase tracking-wider">
                Google Sheets como fuente confiable
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {!selectedFriendUid && (
              <nav className="flex space-x-1 bg-black/15 p-1 rounded-xl text-xs">
                <button
                  id="tab-album"
                  onClick={() => setActiveTab('album')}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
                    activeTab === 'album'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-white/80 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Álbum
                </button>
                <button
                  id="tab-friends"
                  onClick={() => setActiveTab('friends')}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
                    activeTab === 'friends'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-white/80 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  Amigos
                </button>
              </nav>
            )}

            <div className="flex items-center space-x-2 border-l border-white/20 pl-4 h-9">
              {userProfile.photoURL ? (
                <img
                  src={userProfile.photoURL}
                  alt="Perfil"
                  referrerPolicy="no-referrer"
                  className="h-8 w-8 rounded-full border border-white/40 select-none bg-white"
                />
              ) : (
                <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {userProfile.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="hidden md:inline text-xs font-bold text-white truncate max-w-[120px]">
                {userProfile.displayName}
              </span>

              <button
                onClick={handleLogout}
                title="Cerrar sesión"
                className="text-white/70 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="grow max-w-7xl w-full mx-auto py-2">
        {errorText && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-2xl flex items-start space-x-3 text-sm">
            <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-red-500" />
            <div>
              <span className="font-bold">Atención</span>
              <p className="text-xs text-red-600 mt-1">{errorText}</p>
            </div>
          </div>
        )}

        {successText && (
          <div className="mb-6 p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl flex items-start space-x-3 text-sm">
            <Check className="h-5 w-5 mt-0.5 shrink-0 text-emerald-600" />
            <span className="font-semibold">{successText}</span>
          </div>
        )}

        {isSyncing && (
          <div className="mb-6 p-4 bg-slate-100 text-slate-700 border border-slate-200 rounded-2xl flex items-center space-x-3 text-xs font-semibold">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
            <span>Sincronizando con Google Sheets...</span>
          </div>
        )}

        {selectedFriendUid && activeFriend ? (
          <ExchangeMatchmaker
            myAlbum={albumStickers}
            friendAlbum={friendAlbumStickers}
            friend={activeFriend}
            onBack={handleCloseExchangeView}
          />
        ) : activeTab === 'album' ? (
          <StickerGrid
            stickers={albumStickers}
            onStickerChange={handleStickerCountChange}
            isSaving={isSyncing}
            onManualSave={handleManualSync}
            lastSynced={lastSyncedDate}
          />
        ) : (
          <FriendsList
            mySpreadsheetId={userProfile.spreadsheetId}
            friends={friends}
            onAddFriendSheet={handleAddFriendSheet}
            onShareMySheet={handleShareMySheet}
            onDiscoverSharedSheets={handleDiscoverSharedSheets}
            onRemoveFriend={handleRemoveFriend}
            onSelectFriend={handleSelectFriendForExchange}
            isLoading={isSyncing}
          />
        )}
      </main>

      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400 shrink-0">
        <p className="max-w-md mx-auto">
          Figus Mundial 2026. Tus datos viven en tu Google Sheets y el navegador guarda una copia local para arrancar rápido.
        </p>
      </footer>
    </div>
  );
}
