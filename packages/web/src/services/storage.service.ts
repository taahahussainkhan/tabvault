/**
 * Storage and file download utility.
 * Streams received decrypted bytes directly to disk via File System Access API or Blob download.
 */

export class WebStorageService {
  /**
   * Triggers a browser download of an ArrayBuffer or Blob as a file.
   */
  public static saveBufferAsFile(buffer: ArrayBuffer, fileName: string, mimeType: string = 'application/octet-stream'): void {
    const blob = new Blob([buffer], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  /**
   * Assembles an array of ordered ArrayBuffer chunks into a single ArrayBuffer.
   */
  public static combineChunks(chunks: ArrayBuffer[], totalBytes: number): ArrayBuffer {
    const combined = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(new Uint8Array(chunk), offset);
      offset += chunk.byteLength;
    }
    return combined.buffer;
  }
}
