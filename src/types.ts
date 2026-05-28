export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  photoURL: string;
  friendCode: string;
  spreadsheetId: string;
  updatedAt: any;
}

export interface AlbumState {
  userId: string;
  stickers: Record<string, number>; // "Argentina_5": count
  updatedAt: any;
}

export interface Friendship {
  id: string; // uidA_uidB
  uids: string[];
  emails: string[];
  names: string[];
  status: 'pending' | 'accepted';
  senderId: string;
  receiverId: string;
  updatedAt: any;
}

export interface FriendRelation {
  friendshipId: string;
  friendUid: string;
  friendEmail: string;
  friendName: string;
  status: 'pending' | 'accepted';
  isSender: boolean;
  albumSynced?: boolean;
  spreadsheetId?: string;
}

export interface StickerMatch {
  sheetRow: string; // Team
  num: number; // Sticker number
}
