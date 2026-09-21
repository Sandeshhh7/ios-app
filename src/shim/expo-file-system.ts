export const documentDirectory = 'file:///app-storage/music/';
export const cacheDirectory = 'file:///app-storage/cache/';

export interface FileInfo {
  exists: boolean;
  size?: number;
  isDirectory?: boolean;
  modificationTime?: number;
  uri?: string;
}

export async function getInfoAsync(fileUri: string): Promise<FileInfo> {
  return {
    exists: true,
    size: 1024 * 1024 * 8,
    isDirectory: false,
    uri: fileUri,
  };
}

export async function readAsStringAsync(fileUri: string): Promise<string> {
  return '';
}

export async function copyAsync(options: { from: string; to: string }): Promise<void> {
  return Promise.resolve();
}

export async function deleteAsync(fileUri: string): Promise<void> {
  return Promise.resolve();
}
