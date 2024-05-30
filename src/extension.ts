// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

interface ResultType{
  [key: string]: string
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('global.findReplace', async () => {
    const result = await vscode.window.showInputBox({
      placeHolder: 'Type Json string...',
      prompt: '请输入你要替换的json格式字符串,key为查找的词,value为替换的词',
      value: ''
    });
    if (!result) {
      return;
    }
    // 选择查找的目录
    const directoryUri = await vscode.window.showOpenDialog({
      canSelectFolders: true,
      canSelectFiles: false,
      canSelectMany: false,
      openLabel: 'Select Directory'
    });
    const directoryPath = directoryUri && directoryUri.length > 0 ? directoryUri[0].fsPath : '';
    const findFilePath = directoryPath ? new vscode.RelativePattern(directoryPath, '**/*') : '**/*';

    // 排除多个目录
    const excludePatterns = ['**/node_modules/**', '**/dist/**', '**/esm/**', '**/.cache/**', '**/.umi/**', '**/.temp/**', '**/lib/**'];
    // 如果指定目录则查找指定目录，不指定则查找整个项目
    const files = await vscode.workspace.findFiles(findFilePath, `{${excludePatterns.join(',')}}`);
    // 将输入的字符串转化为json对象
    const inputRes: ResultType = JSON.parse(result);
    // console.log('files=', files);
    for (const file of files) {
      const document = await vscode.workspace.openTextDocument(file);
      const text = document.getText();
      // 遍历map依次替换所有文件中的关键字
      Object.keys(inputRes).forEach(async (key) => {
        const regex = new RegExp(key, 'g');
        const newText = text.replace(regex, inputRes[key]);
        const editor = new vscode.WorkspaceEdit();
        editor.replace(file, new vscode.Range(document.positionAt(0), document.positionAt(text.length)), newText);
        await vscode.workspace.applyEdit(editor);
        await document.save();
      });
    }
    
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
