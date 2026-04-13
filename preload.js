const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // HTML에서 window.electronAPI.saveData(tasks)로 호출
    saveData: (data) => ipcRenderer.invoke('save-data', data),
    // HTML에서 await window.electronAPI.loadData()로 호출
    loadData: () => ipcRenderer.invoke('load-data'),
    // 백업 및 복원 기능 추가
    backupData: () => ipcRenderer.invoke('backup-data'),
    restoreData: () => ipcRenderer.invoke('restore-data')
});