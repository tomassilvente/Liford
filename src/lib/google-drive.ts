import { google } from "googleapis";

const TZ = "America/Argentina/Buenos_Aires";

function getAuth() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) return null;
  const auth = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
  auth.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
  return auth;
}

function getDrive() {
  const auth = getAuth();
  if (!auth) return null;
  return google.drive({ version: "v3", auth });
}

export function extractFolderId(driveUrl: string): string | null {
  const match = driveUrl.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return match?.[1] ?? null;
}

async function findOrCreateFolder(name: string, parentId?: string): Promise<string | null> {
  const drive = getDrive();
  if (!drive) return null;

  const parentClause = parentId ? `'${parentId}' in parents` : "'root' in parents";
  const q = `name = '${name.replace(/'/g, "\\'")}' and ${parentClause} and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;

  try {
    const search = await drive.files.list({ q, fields: "files(id)", pageSize: 1 });
    if (search.data.files?.length) return search.data.files[0].id!;

    const created = await drive.files.create({
      requestBody: {
        name,
        mimeType: "application/vnd.google-apps.folder",
        ...(parentId ? { parents: [parentId] } : {}),
      },
      fields: "id",
    });
    return created.data.id ?? null;
  } catch (err) {
    console.error("[Google Drive] Error en findOrCreateFolder:", err);
    return null;
  }
}

export async function createSessionFolder({
  clientName,
  date,
}: {
  clientName: string;
  type: string;
  eventName?: string | null;
  date: Date;
}): Promise<{ id: string; url: string } | null> {
  const drive = getDrive();
  if (!drive) return null;

  const rootParentId = process.env.GOOGLE_DRIVE_PHOTOS_FOLDER_ID || undefined;

  // Formato de fecha DD-MM-YYYY
  const dateStr = date.toLocaleDateString("es-AR", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).replace(/\//g, "-");

  try {
    // Nivel 1: carpeta del equipo/cliente
    const teamFolderId = await findOrCreateFolder(clientName, rootParentId);
    if (!teamFolderId) return null;

    // Nivel 2: carpeta de la fecha dentro del equipo
    const dateFolderId = await findOrCreateFolder(dateStr, teamFolderId);
    if (!dateFolderId) return null;

    const meta = await drive.files.get({ fileId: dateFolderId, fields: "webViewLink" });
    if (!meta.data.webViewLink) return null;

    return { id: dateFolderId, url: meta.data.webViewLink };
  } catch (err) {
    console.error("[Google Drive] Error al crear carpeta de sesión:", err);
    return null;
  }
}

export type DrivePhoto = {
  id: string;
  name: string;
  thumbnailLink: string | null;
  webViewLink: string;
  mimeType: string;
  size: string | null;
};

export type DriveItem = {
  id: string;
  name: string;
  isFolder: boolean;
  thumbnailLink: string | null;
  webViewLink: string;
  mimeType: string;
};

export async function listPhotosInFolder(folderId: string): Promise<DrivePhoto[]> {
  const drive = getDrive();
  if (!drive) return [];

  try {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
      fields: "files(id, name, thumbnailLink, webViewLink, mimeType, size)",
      orderBy: "name",
      pageSize: 200,
    });

    return (res.data.files ?? []).map((f) => ({
      id: f.id!,
      name: f.name!,
      thumbnailLink: f.thumbnailLink ?? null,
      webViewLink: f.webViewLink!,
      mimeType: f.mimeType!,
      size: f.size ?? null,
    }));
  } catch (err) {
    console.error("[Google Drive] Error al listar fotos:", err);
    return [];
  }
}

// Lista carpetas e imágenes de cualquier carpeta (o raíz si folderId = "root")
export async function listDriveFolder(folderId: string): Promise<DriveItem[]> {
  const drive = getDrive();
  if (!drive) return [];

  const parent = folderId === "root" ? "'root' in parents" : `'${folderId}' in parents`;

  try {
    const res = await drive.files.list({
      q: `${parent} and (mimeType = 'application/vnd.google-apps.folder' or mimeType contains 'image/') and trashed = false`,
      fields: "files(id, name, mimeType, thumbnailLink, webViewLink)",
      orderBy: "folder,name",
      pageSize: 200,
    });

    return (res.data.files ?? []).map((f) => ({
      id: f.id!,
      name: f.name!,
      isFolder: f.mimeType === "application/vnd.google-apps.folder",
      thumbnailLink: f.thumbnailLink ?? null,
      webViewLink: f.webViewLink!,
      mimeType: f.mimeType!,
    }));
  } catch (err) {
    console.error("[Google Drive] Error al listar carpeta:", err);
    return [];
  }
}

export async function getThumbnailStream(fileId: string): Promise<{ stream: ReadableStream; contentType: string } | null> {
  const drive = getDrive();
  const auth = getAuth();
  if (!drive || !auth) return null;

  try {
    const meta = await drive.files.get({ fileId, fields: "thumbnailLink, mimeType" });
    const rawLink = meta.data.thumbnailLink;
    if (!rawLink) return null;

    // Aumentar tamaño del thumbnail
    const thumbUrl = rawLink.replace(/=s\d+$/, "=s600");

    const { token } = await auth.getAccessToken();
    const res = await fetch(thumbUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok || !res.body) return null;
    return {
      stream: res.body,
      contentType: res.headers.get("content-type") ?? "image/jpeg",
    };
  } catch (err) {
    console.error("[Google Drive] Error al obtener thumbnail:", err);
    return null;
  }
}
