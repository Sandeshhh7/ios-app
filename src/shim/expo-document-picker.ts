export interface DocumentPickerAsset {
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
  file?: File;
}

export interface DocumentPickerResult {
  canceled: boolean;
  assets: DocumentPickerAsset[] | null;
}

export interface DocumentPickerOptions {
  type?: string | string[];
  copyToCacheDirectory?: boolean;
  multiple?: boolean;
}

export async function getDocumentAsync(options: DocumentPickerOptions = {}): Promise<DocumentPickerResult> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve({ canceled: true, assets: null });
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = !!options.multiple;
    
    // Accept user audio formats: mp3, flac, wav, m4a, aac, ogg
    if (options.type) {
      if (Array.isArray(options.type)) {
        input.accept = options.type.join(',');
      } else {
        input.accept = options.type;
      }
    } else {
      input.accept = 'audio/*,.mp3,.flac,.wav,.m4a,.aac,.ogg';
    }

    input.onchange = () => {
      if (input.files && input.files.length > 0) {
        const assets: DocumentPickerAsset[] = Array.from(input.files).map((file) => {
          const objectUrl = URL.createObjectURL(file);
          return {
            uri: objectUrl,
            name: file.name,
            size: file.size,
            mimeType: file.type || 'audio/*',
            file,
          };
        });
        resolve({ canceled: false, assets });
      } else {
        resolve({ canceled: true, assets: null });
      }
    };

    input.oncancel = () => {
      resolve({ canceled: true, assets: null });
    };

    // Trigger file chooser
    input.click();
  });
}
