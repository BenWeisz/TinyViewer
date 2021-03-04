import * as vscode from 'vscode';
import { getHTMLforWebview } from './webview';

const P3 = 'P3';
const PPM_HEADERS = [P3];

class PPMPreviewDocument extends vscode.Disposable implements vscode.CustomDocument {
  readonly uri: vscode.Uri;
  private documentData: Uint8Array;

  private static async readFile(uri: vscode.Uri) {
    return vscode.workspace.fs.readFile(uri);
  }

  static async create(uri: vscode.Uri) {
    const fileData = await PPMPreviewDocument.readFile(uri);
    return new PPMPreviewDocument(uri, fileData);
  }

  private constructor(uri: vscode.Uri, initialData: Uint8Array) {
    super(() => {});
    this.uri = uri;
    this.documentData = initialData;
  }

  public get getDocumentData() { return this.documentData; }

  public get imageData(): object {
    let stringData = this.getDocumentData.toString();
    stringData = stringData.split('\r\n').join(' ');
    stringData = stringData.split('\n').join(' ');
    stringData = stringData.split('\t').join(' ');

    const dataArray = stringData.split(' ');
    const data = dataArray.filter(str => str !== '');

    const uriPath = this.uri.fsPath;
      
    const forwardSlashPath = uriPath.split('/');
    const backwardSlashPath = uriPath.split('\\');
    const uriName = backwardSlashPath.length > 1 ? backwardSlashPath[backwardSlashPath.length - 1] : forwardSlashPath[forwardSlashPath.length - 1];

    if (PPM_HEADERS.includes(data[0])) {
      let width;
      let height;
      let imageData;

      if (data[0] === P3) {
        width = parseInt(data[1], 10);
        height = parseInt(data[2], 10);

        const maxValue = parseInt(data[3], 10);
        imageData = new Uint8Array(data.length - 4);
        data.slice(4, data.length).forEach((v, i) => {
          imageData[i] = Math.floor(parseInt(v, 10) / (maxValue + 0.0) * 255);
        });
      }

      return {
        status: 'Success',
        width,
        height,
        imageData,
      };
    }

    return { status: `Failed to load file "${uriName}". This only supported formats are plain-text: ${PPM_HEADERS}` };
  }

  dispose() {
    super.dispose();
  }
}

export default class PPMPreviewProvider implements vscode.CustomReadonlyEditorProvider<PPMPreviewDocument>{
  private static viewType = 'tinyviewer.ppmpreview';
  
  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.window.registerCustomEditorProvider(
      PPMPreviewProvider.viewType,
      new PPMPreviewProvider(context),
      { supportsMultipleEditorsPerDocument: false },
    );
  }

  constructor(private readonly _context: vscode.ExtensionContext) { }
  
  async openCustomDocument(
    uri: vscode.Uri,
    _openContext: {},
    _token: vscode.CancellationToken
  ): Promise<PPMPreviewDocument> {
    const document = await PPMPreviewDocument.create(uri);
    return document;
  }

  async resolveCustomEditor(
    document: PPMPreviewDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true,
      //retainContextWhenHidden: true,
    };
    
    webviewPanel.webview.html = getHTMLforWebview(webviewPanel.webview, this._context);
    webviewPanel.webview.postMessage(document.imageData);
  }
}