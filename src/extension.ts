import * as vscode from 'vscode';
import PPMPreviewProvider from './ppmPreview';
import TGAPreviewProvider from './tgaPreview';

export const activate = (context: vscode.ExtensionContext) => {
	context.subscriptions.push(PPMPreviewProvider.register(context));
	context.subscriptions.push(TGAPreviewProvider.register(context));
};

export const deactivate = () => {

};
