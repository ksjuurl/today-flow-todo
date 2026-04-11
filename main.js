const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// [중요] 앱 설치/삭제와 관계없이 데이터를 안전하게 보관하기 위한 경로 설정
// C:\Users\사용자명\AppData\Roaming\today-flow-todo\data.json 와 같은 경로에 저장됩니다.
const userDataPath = app.getPath('userData');
const dataFile = path.join(userDataPath, 'data.json');

let win;

// [추가] 중복 실행 방지 로직
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    // 이미 앱이 실행 중이라면 현재 프로세스 종료
    app.quit();
} else {
    // 두 번째 인스턴스를 실행하려고 할 때 메인 창을 포커스함
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        if (win) {
            if (win.isMinimized()) win.restore();
            win.focus();
        }
    });

    app.whenReady().then(() => {
        createWindow();
    });
}

function createWindow() {
    win = new BrowserWindow({
        width: 480, // 모바일 느낌의 좁은 폭
        height: 800,
        icon: path.join(__dirname, 'assets/icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        autoHideMenuBar: true // 상단 메뉴바 숨김
    });

    // HTML 파일 로드 (파일명이 index.html로 변경되었다고 가정)
    win.loadFile(path.join(__dirname, 'index.html'));
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// [IPC 통신] 데이터 저장 요청 처리
ipcMain.on('save-data', async (event, data) => {
    try {
        // 폴더가 없으면 생성해주는 로직 추가
        if (!fs.existsSync(userDataPath)) {
            await fs.promises.mkdir(userDataPath, { recursive: true });
        }
        // data.json 파일에 예쁘게 포맷팅하여 저장
        await fs.promises.writeFile(dataFile, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error('저장 실패:', error);
    }
});

// [IPC 통신] 데이터 불러오기 요청 처리
ipcMain.handle('load-data', async () => {
    if (fs.existsSync(dataFile)) {
        try {
            const data = await fs.promises.readFile(dataFile, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            console.error('데이터 로드 실패:', error);
            return []; // 파일이 손상되었거나 읽을 수 없을 때 빈 배열 반환
        }
    }
    return []; // 파일이 아예 없을 때(첫 실행) 빈 배열 반환
});

// [IPC 통신] 데이터 백업 (파일로 저장)
ipcMain.handle('backup-data', async () => {
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
        title: '데이터 백업 저장',
        defaultPath: path.join(app.getPath('downloads'), 'today-flow-backup.json'),
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });

    if (!canceled && filePath) {
        try {
            if (fs.existsSync(dataFile)) {
                await fs.promises.copyFile(dataFile, filePath);
                return { success: true, path: filePath };
            } else {
                return { success: false, message: '백업할 데이터가 없습니다.' };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
    return { success: false };
});

// [IPC 통신] 데이터 복원 (파일에서 불러오기)
ipcMain.handle('restore-data', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
        title: '복원할 백업 파일 선택',
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
        properties: ['openFile']
    });

    if (!canceled && filePaths.length > 0) {
        try {
            // 폴더가 없으면 생성
            if (!fs.existsSync(userDataPath)) {
                await fs.promises.mkdir(userDataPath, { recursive: true });
            }
            
            await fs.promises.copyFile(filePaths[0], dataFile);
            // 복원된 데이터를 읽어서 리턴
            const content = await fs.promises.readFile(dataFile, 'utf-8');
            return { success: true, data: JSON.parse(content) };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
    return { success: false };
});