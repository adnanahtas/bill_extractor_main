const { ipcRenderer } = require('electron');

let currentUser = null;

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username === 'admin' && password === 'admin123') {
        currentUser = username;
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('extractorForm').classList.remove('hidden');
        
        const initialCount = await ipcRenderer.invoke('get-initial-image-count', currentUser);
        updateImageCountDisplay(initialCount);
    } else {
        alert('Invalid credentials');
    }
});

document.getElementById('selectFilesButton').addEventListener('click', async () => {
    const isMultiple = document.getElementById('multipleImagesToggle').checked;
    const filePaths = await ipcRenderer.invoke('select-files', isMultiple);
    if (filePaths && filePaths.length > 0) {
        document.getElementById('selectedFiles').textContent = isMultiple ? 
            `Selected folder: ${filePaths[0]}` : 
            `Selected file: ${filePaths[0]}`;
    }
});


let isMultiple = false;

document.getElementById('multipleImagesToggle').addEventListener('change', (e) => {
    isMultiple = e.target.checked;
    const selectFilesButton = document.getElementById('selectFilesButton');
    selectFilesButton.textContent = isMultiple ? 'Select Folder' : 'Select File';
});

document.getElementById('extractButton').addEventListener('click', async () => {
    const selectedFiles = document.getElementById('selectedFiles').textContent;
    if (!selectedFiles) {
        alert('Please select file(s) first.');
        return;
    }

    const filePath = selectedFiles.split(': ')[1];
    const useClaudeAPI = document.getElementById('apiToggle').checked;
    
    document.getElementById('progressBarContainer').classList.remove('hidden');
    document.getElementById('progressBar').value = 0;
    document.getElementById('progressText').textContent = 'Extraction in Progress';
    document.getElementById('resultMessage').classList.add('hidden');
    
    ipcRenderer.send('extract-text', [filePath], currentUser, useClaudeAPI, isMultiple);
});

ipcRenderer.on('extraction-progress', (event, { current, total }) => {
    const progress = (current / total) * 100;
    document.getElementById('progressBar').value = progress;
    document.getElementById('progressText').textContent = `Extracting ${current} of ${total} image${total > 1 ? 's' : ''}...`;
});

ipcRenderer.on('extraction-complete', (event, { outputFolder }) => {
    document.getElementById('progressBarContainer').classList.add('hidden');
    document.getElementById('resultMessage').classList.remove('hidden');
    document.getElementById('resultMessage').textContent = `Extraction completed. Files saved in: ${outputFolder}`;
});

ipcRenderer.on('extraction-error', (event, error) => {
    document.getElementById('progressBar').classList.add('hidden');
    document.getElementById('resultMessage').classList.remove('hidden');
    document.getElementById('resultMessage').textContent = `Error: ${error}`;
});

ipcRenderer.on('update-image-count', (event, count) => {
    updateImageCountDisplay(count);
});

function updateImageCountDisplay(count) {
    document.getElementById('imageCount').textContent = count;
    if (count >= 100) {
        document.getElementById('extractButton').disabled = true;
        document.getElementById('extractButton').classList.add('bg-gray-400');
        document.getElementById('extractButton').classList.remove('bg-green-500', 'hover:bg-green-700');
    } else {
        document.getElementById('extractButton').disabled = false;
        document.getElementById('extractButton').classList.remove('bg-gray-400');
        document.getElementById('extractButton').classList.add('bg-green-500', 'hover:bg-green-700');
    }
}

document.getElementById('apiToggle').addEventListener('change', (e) => {
    const apiLabel = document.getElementById('apiLabel');
    apiLabel.textContent = e.target.checked ? 'API C' : 'API G';
});

document.getElementById('multipleImagesToggle').addEventListener('change', (e) => {
    const selectFilesButton = document.getElementById('selectFilesButton');
    selectFilesButton.textContent = e.target.checked ? 'Select Folder' : 'Select File';
});