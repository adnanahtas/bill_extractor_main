const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { PythonShell } = require('python-shell');
const fs = require('fs-extra');
const { getUserStats, updateUserStats } = require('./userStats');
const { spawn } = require('child_process');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle('select-files', async (event, isMultiple) => {
  const result = await dialog.showOpenDialog({
    properties: isMultiple ? ['openDirectory'] : ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }]
  });
  return result.filePaths;
});

async function clearOutputFolders() {
  const outputFolder = path.join(__dirname, 'output');
  const jsonFolder = path.join(outputFolder, 'json');
  const excelFolder = path.join(outputFolder, 'excel');

  await fs.emptyDir(jsonFolder);
  await fs.emptyDir(excelFolder);
}

async function runPythonScript(scriptPath, args) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', [scriptPath, ...args], {
      encoding: 'utf8',
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    });
    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString('utf8');
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString('utf8');
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python script exited with code ${code}: ${errorOutput}`));
      } else {
        resolve(output);
      }
    });
  });
}


ipcMain.handle('get-initial-image-count', async (event, username) => {
  const userStats = await getUserStats(username);
  return userStats.imagesProcessed;
});

ipcMain.on('extract-text', async (event, filePaths, username, useClaudeAPI, isMultiple) => {
  try {
    const userStats = await getUserStats(username);
    event.reply('update-image-count', userStats.imagesProcessed);

    const imagePaths = isMultiple ? await getImagePaths(filePaths[0]) : [filePaths[0]];
    const totalImages = imagePaths.length;

    if (userStats.imagesProcessed + totalImages > 100) {
      event.reply('extraction-error', 'Processing these images would exceed the daily limit');
      return;
    }

    const outputFolder = path.join(__dirname, 'output');
    const jsonFolder = path.join(outputFolder, 'json');
    const excelFolder = path.join(outputFolder, 'excel');

    await fs.ensureDir(jsonFolder);
    await fs.ensureDir(excelFolder);

    for (let i = 0; i < imagePaths.length; i++) {
      const imagePath = imagePaths[i];
      const scriptPath = path.join(__dirname, 'extractor.py');
      const args = [imagePath, useClaudeAPI ? 'API C' : 'API G'];

      try {
        const jsonFilePath = await runPythonScript(scriptPath, args);
        // Trim any whitespace or newline characters from the file path
        const trimmedJsonFilePath = jsonFilePath.trim();
        console.log(`JSON file saved at: ${trimmedJsonFilePath}`);

        const excelFilePath = path.join(excelFolder, `extracted_${i + 1}.xlsx`);
        await saveToExcel(trimmedJsonFilePath, excelFilePath);

        event.reply('extraction-progress', { current: i + 1, total: totalImages });
      } catch (err) {
        console.error('Error in Python script:', err);
        event.reply('extraction-error', `Error processing image ${i + 1}: ${err.message}`);
      }
    }

    const updatedCount = await updateUserStats(username, totalImages);
    event.reply('update-image-count', updatedCount);
    event.reply('extraction-complete', { outputFolder });

  } catch (err) {
    console.error('Error:', err);
    event.reply('extraction-error', err.message);
  }
});

async function getImagePaths(filePath) {
  const stats = await fs.stat(filePath);
  if (stats.isDirectory()) {
    const files = await fs.readdir(filePath);
    return files
      .filter(file => ['.png', '.jpg', '.jpeg'].includes(path.extname(file).toLowerCase()))
      .map(file => path.join(filePath, file));
  } else {
    return [filePath];
  }
}

async function saveToExcel(jsonFilePath, outputFile) {
  const excelOptions = {
    mode: 'text',
    pythonPath: 'python',
    scriptPath: __dirname,
    args: [jsonFilePath, outputFile]
  };

  await PythonShell.run('save_to_excel.py', excelOptions);
}