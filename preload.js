const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // HTML에서 사용할 함수들
    saveData: (data) => ipcRenderer.send('save-data', data),
    loadData: () => ipcRenderer.invoke('load-data')
});