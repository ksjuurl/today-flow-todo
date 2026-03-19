const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// 데이터 저장 파일 경로 (앱 실행 파일과 같은 위치의 data.json)
const dataPath = path.join(__dirname, 'data.json');

const createWindow = () => {
    const win = new BrowserWindow({
        width: 480,
        height: 800,
        autoHideMenuBar: true, // 메뉴바 자동 숨김 (Alt 누르면 보임)
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), // 다리 연결
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    // 메뉴 템플릿 생성 (File, View, Help)
    const template = [
        {
            label: 'File',
            submenu: [
                { role: 'quit', label: '종료' }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload', label: '새로고침' },
                { role: 'toggleDevTools', label: '개발자 도구' },
                { type: 'separator' },
                { role: 'resetZoom', label: '배율 초기화' },
                { role: 'zoomIn', label: '확대' },
                { role: 'zoomOut', label: '축소' },
                { type: 'separator' },
                { role: 'togglefullscreen', label: '전체화면' }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About', // 여기에 버전 정보를 보여주는 About 메뉴 추가
                    click: () => {
                        dialog.showMessageBox(win, {
                            type: 'info',
                            title: '프로그램 정보',
                            message: '평온한 일과표 (To Do List)',
                            detail: `버전: 1.0.0\n현재 Electron 버전: ${process.versions.electron}`,
                            buttons: ['확인']
                        });
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    // HTML 파일 로드
    win.loadFile('To do List(html).html');
};

app.whenReady().then(() => {
    // 1. 데이터 저장 요청 처리
    ipcMain.on('save-data', (event, data) => {
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    });

    // 2. 데이터 불러오기 요청 처리
    ipcMain.handle('load-data', async () => {
        if (fs.existsSync(dataPath)) {
            const data = fs.readFileSync(dataPath, 'utf-8');
            return JSON.parse(data);
        }
        return null; // 파일이 없으면 null 반환
    });

    createWindow();
});

app.on('window-all-closed', () => app.quit());