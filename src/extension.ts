// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface ResultType{
  [key: string]: string
}

async function fileReplace(jsonText: string){
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
  // console.log('files=', files);
  // 将输入的字符串转化为json对象
  const inputRes: ResultType = JSON.parse(jsonText);
  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: "正在替换中...",
    cancellable: true
}, async (progress, token) => {
    token.onCancellationRequested(() => {
        console.log("用户取消了操作");
    });

    progress.report({ increment: 0 });

    const tasks = files.map(async (file) => {
      progress.report({ increment: 1, message: `正在替换 ${file} 文件` });
      // 打开文本文件进行替换，不是文本文件则catch继续
      try {
        // 读取文件内容
        const fileData = await vscode.workspace.fs.readFile(file);
        const text = new TextDecoder('utf-8').decode(fileData);

        // 遍历map依次替换所有文件中的关键字
        let newText = text;
        Object.keys(inputRes).forEach((key) => {
            if (newText.includes(key)) {
                const regex = new RegExp(key, 'g');
                newText = newText.replace(regex, inputRes[key]);
            }
        });

        // 写入新的文件内容
        const newFileData = new TextEncoder().encode(newText);
        await vscode.workspace.fs.writeFile(file, newFileData);
      } catch (error) {
          console.log('error=', error);
      }
    });

    await Promise.all(tasks);

    vscode.window.showInformationMessage("替换完成！");
});
}
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('global.findReplace', async () => {
    const pickItems = [
      { value: 'jdesign', label: 'JDesign升级(stable->preview)', description: '选择此项进行JDesign升级' },
      { value: 'custom', label: '自定义输入', description: '选择此项进行自定义输入' }
    ];
    const selected = await vscode.window.showQuickPick(pickItems, {
      placeHolder: '请选择一个操作',
      canPickMany: false
    });
    if (selected) {
      if (selected.value === 'jdesign') {
        // const jsonFilePath = path.join(context.extensionPath, 'jdesign.json');
        const jsonFilePath = path.resolve(__dirname, './jdesign.json');
        fs.readFile(jsonFilePath, 'utf8', async (err, data) => {
          if (err) {
              vscode.window.showErrorMessage(`Error reading file: ${err.message}`);
              return;
          }
          const startTime = Date.now();
          await fileReplace(data);
          const endTime = Date.now();
          console.log(`fileReplace 方法运行时长: ${endTime - startTime} 毫秒`);

        });
      } else if (selected.value === 'custom') {
        const result = await vscode.window.showInputBox({
          placeHolder: 'Type Json string...',
          prompt: '请输入你要替换的json格式字符串,key为查找的词,value为替换的词',
          value: ''
        });
        if (!result) {
          return;
        }
        fileReplace(result);
      }
    }
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
