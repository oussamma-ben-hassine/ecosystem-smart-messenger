export interface DriveConfig {
  baseUrl: string;
  tokenGetter: () => Promise<string | null>;
}

export interface DriveFileMetadata {
  id: string;
  name: string;
  size: number;
  mime_type: string;
  folder_id?: string;
  created_at: string;
  updated_at: string;
  download_url: string;
}

export interface ShareOptions {
  expires_in_days?: number;
  password?: string;
}

export class DriveConnector {
  private baseUrl: string;
  private tokenGetter: () => Promise<string | null>;

  constructor(config: DriveConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.tokenGetter = config.tokenGetter;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.tokenGetter();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  /**
   * Upload an attachment or media file to Drive
   */
  async uploadFile(
    fileBlob: Blob | Uint8Array,
    fileName: string,
    mimeType: string,
    folderId?: string
  ): Promise<DriveFileMetadata> {
    const headers = await this.getAuthHeaders();
    const formData = new FormData();
    const blob = fileBlob instanceof Blob ? fileBlob : new Blob([fileBlob], { type: mimeType });
    formData.append('file', blob, fileName);
    if (folderId) {
      formData.append('folder_id', folderId);
    }

    const response = await fetch(`${this.baseUrl}/api/files/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Drive upload failed (${response.status}): ${err}`);
    }

    return response.json();
  }

  /**
   * Get metadata for an existing file
   */
  async getFileMetadata(fileId: string): Promise<DriveFileMetadata> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}/api/files/${fileId}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch file metadata (${response.status})`);
    }

    return response.json();
  }

  /**
   * Search files across Drive
   */
  async searchFiles(query: string): Promise<DriveFileMetadata[]> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}/api/files/search?q=${encodeURIComponent(query)}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to search Drive files (${response.status})`);
    }

    return response.json();
  }

  /**
   * Create a public or shared link for a file
   */
  async createShareReference(fileId: string, options: ShareOptions = {}): Promise<{ shareUrl: string; shareId: string }> {
    const headers = await this.getAuthHeaders();
    headers['Content-Type'] = 'application/json';

    const response = await fetch(`${this.baseUrl}/api/shares`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        file_id: fileId,
        expires_days: options.expires_in_days || 7,
        password: options.password,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create file share (${response.status})`);
    }

    return response.json();
  }

  /**
   * Revoke an active share link
   */
  async revokeShare(shareId: string): Promise<boolean> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}/api/shares/${shareId}`, {
      method: 'DELETE',
      headers,
    });

    return response.ok;
  }

  /**
   * Generate authorized download URL
   */
  async getAuthorizedDownload(fileId: string): Promise<string> {
    return `${this.baseUrl}/api/files/${fileId}/download`;
  }
}
