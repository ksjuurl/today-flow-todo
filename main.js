const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// [중요] 앱 설치/삭제와 관계없이 데이터를 안전하게 보관하기 위한 경로 설정
// C:\Users\사용자명\AppData\Roaming\today-flow-todo\data.json 와 같은 경로에 저장됩니다.
const userDataPath = app.getPath('userData');
const dataFile = path.join(userDataPath, 'data.json');

function createWindow() {
    const win = new BrowserWindow({
        width: 480, // 모바일 느낌의 좁은 폭
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        autoHideMenuBar: true // 상단 메뉴바 숨김
    });

    // HTML 파일 로드 (파일명이 index.html로 변경되었다고 가정)
    win.loadFile('index.html');
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// [IPC 통신] 데이터 저장 요청 처리
ipcMain.on('save-data', (event, data) => {
    try {
        // 폴더가 없으면 생성해주는 로직 추가
        if (!fs.existsSync(userDataPath)) {
            fs.mkdirSync(userDataPath, { recursive: true });
        }
        // data.json 파일에 예쁘게 포맷팅하여 저장
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('저장 실패:', error);
    }
});

// [IPC 통신] 데이터 불러오기 요청 처리
ipcMain.handle('load-data', async () => {
    if (fs.existsSync(dataFile)) {
        try {
            const data = fs.readFileSync(dataFile, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            console.error('데이터 로드 실패:', error);
            return null; // 파일이 손상되었을 경우를 대비
        }
    }
    return null;
});