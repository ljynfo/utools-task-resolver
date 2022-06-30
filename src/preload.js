const Nano = require('nano-jsx');
const {jsx} = require('nano-jsx');
const zipUtils = require('./js/zipUtils.js')
const {SettingUI} = require('./ui/index.jsx');
const XLSX = require("xlsx");

// xmind 文件路径
let filePath = '';
let fileName = '';
let excelSuffix = 'xlsx'
let xmindSuffix = 'xmind'
let zxmSuffix = 'zxm'

function saveExelHandler() {
    const savePath = utools.showSaveDialog({
        title: '保存位置',
        filters: [{name: "Excel", extensions: [excelSuffix]}],
        defaultPath: filePath.replace('.'.concat(xmindSuffix), '')
            .replace('.'.concat(zxmSuffix), ''),
        buttonLabel: '保存'
    });
    try {
        zipUtils.readParseFileAlsoExcel(filePath)
            .then(data => {
                const workBook = XLSX.utils.book_new();
                const workSheet = XLSX.utils.json_to_sheet(data);
                workSheet["!cols"] = [
                    {wch: 100},
                    {wch: 10},
                    {wch: 10},
                    {wch: 10},
                    {wch: 10},
                    {wch: 10},
                    {wch: 12},
                    {wch: 12},
                    {wch: 10},
                ];
                XLSX.utils.book_append_sheet(workBook, workSheet, 'Sheet1');

                XLSX.writeFile(workBook, savePath);
            })
            .then(res => {
                window.utools.showNotification("Excel导出完成");
            })
            .then(res => {
                window.utools.shellShowItemInFolder(savePath);
                window.utools.shellOpenPath(savePath);
            });
    } catch (e) {
        window.utools.showNotification('出现问题' + e.message);
        console.error(e);
    }
}

function XMindParseHandler() {
    try {
        let text = ''
        zipUtils.readParseFileAlsoExcel(filePath)
            .then(data => {
                let result = ''
                let taskSum = 0
                let taskNum = 0
                let taskTimeSum = 0
                let max = 0
                let min = 0
                for (let i = 0; i < data.length; i++) {
                    let content = data[i]
                    taskSum++
                    let title = content.标题
                    let taskTime = content.预估工时
                    if (!isNaN(taskTime)) {
                        taskTimeSum = taskTimeSum + taskTime
                        taskNum++
                        if (max == null) {
                            max = taskTime
                        } else {
                            max = max > taskTime ? max : taskTime
                        }
                        if (min == null) {
                            min = taskTime
                        } else {
                            min = min < taskTime ? min : taskTime
                        }
                    }
                    result = result.concat('\n');
                    result = result.concat(title).concat('\t\t\t\t\t\t').concat(taskTime).concat('H').trim();
                }
                text = ('总共' + taskSum + '个任务, 解析成功' + taskNum + '个、失败' +
                    (taskSum - taskNum) + '个, 成功任务合计' +
                    taskTimeSum + 'H')
                if (taskNum > 0) {
                    let avg = taskTimeSum / taskNum
                    text = text.concat(', 平均任务工时' + avg +
                        'H, 最大任务工时' + max + 'H, 最小任务工时' + min +
                        'H\n\n')
                }
                text = text.concat('\n\n').concat(result)

                window.utools.copyText(text)
            })
            .then(res => {
                window.utools.showNotification("解析完成".concat('\n').concat(text));
            });
    } catch (e) {
        window.utools.showNotification('出现问题' + e.message);
        console.error(e);
    }
}

function save() {
    try {
        saveExelHandler();
    } catch (e) {
        console.log(e)
        window.utools.showNotification(e.message)
    }
    window.utools.hideMainWindow();
}

window.saveExcel = save;
window.exports = {
    "xmind_save": {
        mode: 'none',
        args: {
            enter: ({payload}, callbackSetList) => {
                document.getElementById('setting')?.remove();
                utools.setExpendHeight(480)
                Nano.render(jsx`${SettingUI()}`, document.documentElement)
                fileName = payload[0].name;
                filePath = payload[0].path;
            },
        }
    },
    "xmind_parse": {
        mode: 'none',
        args: {
            enter: ({payload}, callbackSetList) => {
                document.getElementById('setting')?.remove();
                fileName = payload[0].name;
                filePath = payload[0].path;

                try {
                    XMindParseHandler();
                } catch (e) {
                    console.log(e)
                    window.utools.showNotification(e.message)
                }
                window.utools.hideMainWindow();
                window.utools.outPlugin()
            }
        }
    }
}
