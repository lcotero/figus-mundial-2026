import { WC_TEAMS, TOTAL_STICKERS_PER_TEAM, createEmptyAlbumMap } from './teamsData';

export interface SharedStickerSpreadsheet {
  id: string;
  name: string;
  ownerEmail?: string;
}

/**
 * Searches the user's Google Drive for an existing album spreadsheet.
 */
export async function findStickerSpreadsheet(accessToken: string): Promise<string | null> {
  const query = encodeURIComponent("name contains 'Figus_Mundial_2026_' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`;
  
  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (!res.ok) {
      throw new Error(`Google Drive API error: ${res.statusText}`);
    }
    
    const data = await res.json();
    if (data.files && data.files.length > 0) {
      // Find the first matching file
      return data.files[0].id;
    }
    return null;
  } catch (error) {
    console.error('Error finding spreadsheet in Drive:', error);
    throw error;
  }
}

export async function listSharedStickerSpreadsheets(accessToken: string): Promise<SharedStickerSpreadsheet[]> {
  const query = encodeURIComponent("sharedWithMe = true and name contains 'Figus_Mundial_2026_' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,owners(emailAddress,displayName))&orderBy=modifiedTime desc`;

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(`Google Drive API shared files error: ${JSON.stringify(errorData)}`);
  }

  const data = await res.json();
  return (data.files || []).map((file: any) => ({
    id: file.id,
    name: file.name,
    ownerEmail: file.owners?.[0]?.emailAddress || file.owners?.[0]?.displayName || ''
  }));
}

export async function shareSpreadsheetWithEmail(
  accessToken: string,
  spreadsheetId: string,
  email: string
): Promise<void> {
  const url = `https://www.googleapis.com/drive/v3/files/${spreadsheetId}/permissions?sendNotificationEmail=true`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'user',
      role: 'reader',
      emailAddress: email,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(`Google Drive share error: ${JSON.stringify(errorData)}`);
  }
}

/**
 * Creates a brand new fully formatted sticker spreadsheet in the user's Google Drive.
 */
export async function createStickerSpreadsheet(
  accessToken: string,
  userId: string,
  displayName: string
): Promise<string> {
  const safeName = displayName.replace(/[^a-zA-Z0-9_]/g, '_');
  const fileTitle = `Figus_Mundial_2026_${safeName}_${userId.slice(0, 6)}`;
  
  const url = 'https://sheets.googleapis.com/v4/spreadsheets';
  
  try {
    const createRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: fileTitle,
        },
        sheets: [
          {
            properties: {
              title: "Album",
            },
          },
        ],
      }),
    });
    
    if (!createRes.ok) {
      const errorData = await createRes.json();
      throw new Error(`Google Sheets API error creating spreadsheet: ${JSON.stringify(errorData)}`);
    }
    
    const sheetData = await createRes.json();
    const spreadsheetId = sheetData.spreadsheetId;
    
    // Initialise with blank cells for missing stickers.
    const emptyStickers = createEmptyAlbumMap();
    await updateSpreadsheetValues(accessToken, spreadsheetId, emptyStickers);
    
    return spreadsheetId;
  } catch (error) {
    console.error('Error creating spreadsheet:', error);
    throw error;
  }
}

/**
 * Updates the values of the Google Sheet with the current local state.
 */
export async function updateSpreadsheetValues(
  accessToken: string,
  spreadsheetId: string,
  stickers: Record<string, number>
): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:U52?valueInputOption=USER_ENTERED`;
  
  // Create headers
  const headerRow = ["Equipo / Sección"];
  for (let i = 1; i <= TOTAL_STICKERS_PER_TEAM; i++) {
    headerRow.push(i.toString());
  }
  
  const rows: any[][] = [headerRow];
  
  for (const team of WC_TEAMS) {
    const row: any[] = [team];
    for (let i = 1; i <= TOTAL_STICKERS_PER_TEAM; i++) {
      const count = stickers[`${team}_${i}`] || 0;
      row.push(count > 0 ? count : '');
    }
    rows.push(row);
  }
  
  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: "A1:U52",
        majorDimension: "ROWS",
        values: rows,
      }),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(`Google Sheets API write error: ${JSON.stringify(errorData)}`);
    }
  } catch (error) {
    console.error('Error writing spreadsheet values:', error);
    throw error;
  }
}

/**
 * Reads Google Sheet values and converts them into a key-value album map.
 */
export async function readSpreadsheetValues(
  accessToken: string,
  spreadsheetId: string
): Promise<Record<string, number>> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:U52`;
  
  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(`Error reading spreadsheet values: ${JSON.stringify(errorData)}`);
    }
    
    const data = await res.json();
    const rows: string[][] = data.values || [];
    
    const stickers = createEmptyAlbumMap();
    if (rows.length === 0) return stickers;
    
    // Row 0 is header. Loop rows 1 to end
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;
      
      // Sync names might mismatch slightly if edited manually, so fall back to matching by indexed order
      const correctTeam = WC_TEAMS[r - 1];
      if (!correctTeam) continue;
      
      for (let c = 1; c <= TOTAL_STICKERS_PER_TEAM; c++) {
        const valueStr = row[c];
        let val = 0;
        if (valueStr !== undefined && valueStr !== null) {
          val = parseInt(valueStr, 10);
          if (isNaN(val)) val = 0;
        }
        stickers[`${correctTeam}_${c}`] = val;
      }
    }
    
    return stickers;
  } catch (error) {
    console.error('Error parsing spreadsheet values:', error);
    throw error;
  }
}
