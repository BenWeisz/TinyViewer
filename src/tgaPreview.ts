import * as vscode from 'vscode';
import { getHTMLforWebview } from './webview';

class TGAPreviewDocument extends vscode.Disposable implements vscode.CustomDocument {
  readonly uri: vscode.Uri;
  private documentData: Uint8Array;

  private static async readFile(uri: vscode.Uri) {
    return vscode.workspace.fs.readFile(uri);
  }

  static async create(uri: vscode.Uri) {
    const fileData = await TGAPreviewDocument.readFile(uri);
    return new TGAPreviewDocument(uri, fileData);
  }

  private constructor(uri: vscode.Uri, initialData: Uint8Array) {
    super(() => {});
    this.uri = uri;
    this.documentData = initialData;
  }

  public get getDocumentData() { return this.documentData; }

  public get imageData(): object {
    const data = this.getDocumentData;

    const uriPath = this.uri.fsPath;
    const forwardSlashPath = uriPath.split('/');
    const backwardSlashPath = uriPath.split('\\');
    const uriName = backwardSlashPath.length > 1 ? backwardSlashPath[backwardSlashPath.length - 1] : forwardSlashPath[forwardSlashPath.length - 1];

    if (data[2] === 0x02 && data[16] === 0x18) {
      const width = (data[13] << 8) || data[12];
      const height = (data[15] << 8) || data[14];

      const imageData = new Uint8Array(data.length - 18);
      const dataSlice = data.slice(18, data.length);
      const totalPages = dataSlice.length / 3;
      for (let i = 0; i < totalPages; i += 1) {
        const pageIndex = i * 3;
        imageData[pageIndex + 0] = dataSlice[(totalPages * 3) - 3 - pageIndex + 0];
        imageData[pageIndex + 1] = dataSlice[(totalPages * 3) - 3 - pageIndex + 1];
        imageData[pageIndex + 2] = dataSlice[(totalPages * 3) - 3 - pageIndex + 2];
      } 

      return {
        status: 'Success',
        width,
        height,
        imageData,
      };
    }

    return { status: `Failed to load file "${uriName}". Please see Paul Bourke's Basic TGA setup for the format` }; 
  }

  dispose() { super.dispose(); }
}

export default class TGAPreviewProvider implements vscode.CustomReadonlyEditorProvider<TGAPreviewDocument>{
  private static viewType = 'tinyviewer.tgapreview';
  
  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.window.registerCustomEditorProvider(
      TGAPreviewProvider.viewType,
      new TGAPreviewProvider(context),
      { supportsMultipleEditorsPerDocument: false },
    );
  }

  constructor(private readonly _context: vscode.ExtensionContext) { }
  
  async openCustomDocument(
    uri: vscode.Uri,
    _openContext: {},
    _token: vscode.CancellationToken
  ): Promise<TGAPreviewDocument> {
    const document = await TGAPreviewDocument.create(uri);
    return document;
  }

  async resolveCustomEditor(
    document: TGAPreviewDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true,
    };

    webviewPanel.webview.html = getHTMLforWebview(webviewPanel.webview, this._context);
    webviewPanel.webview.postMessage(document.imageData);
  }
}