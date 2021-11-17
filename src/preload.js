const fs = require('fs');
const Nano = require('nano-jsx');
const {jsx} = require('nano-jsx');
const zipUtils = require('./js/zipUtils.js')
const {SettingUI} = require('./Setting/index.jsx');
const XLSX = require("xlsx");

let bookmarksDataCache = [
    {
        title: '保存到Excel',
        code: 'xmind_save',
        description: '提取XMind中的任务信息，并存到Excel，可直接进行导入',
        pinyin: 'xmindbaocun',
        icon: 'img/columnCalculation.svg'
    }
    ,
    {
        title: '提取到剪贴板',
        code: 'xmind_parse',
        description: '提取XMind中的任务信息，并复制到剪贴板',
        pinyin: 'xmindtiqu',
        icon: 'img/taskExtract.svg'
    }
]
// xmind 文件路径
let filePath = '';
let fileName = '';
let excelSuffix = 'xlsx'
let xmindSuffix = 'xmind'

function saveExelHandler() {
    const savePath = utools.showSaveDialog({
        title: '保存位置',
        filters: [{name: "Excel", extensions: [excelSuffix]}],
        defaultPath: filePath.replace('.'.concat(xmindSuffix), ''),
        buttonLabel: '保存'
    });
    try {
        zipUtils.readParseFileAlsoExcel(filePath)
            .then(data => {
                const wb = XLSX.utils.book_new();
                const ws = XLSX.utils.json_to_sheet(data);
                XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

                XLSX.writeFile(wb, savePath);
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
                let max
                let min
                for (let i = 0; i < data.length; i++) {
                    let content = data[i]
                    taskSum++
                    let title = content.标题
                    let taskTime = content.预估工时
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
                    result = result.concat('\n');
                    result = result.concat(title).concat('\t\t\t\t\t\t').concat(taskTime).concat('H').trim();
                }
                text = ('总共' + taskSum + '个任务, 解析成功' + taskNum + '个、失败' +
                    (taskSum - taskNum) + '个, 成功任务合计' +
                    taskTimeSum + 'H, 平均任务工时' + (taskTimeSum / taskNum) +
                    'H, 最大任务工时' + max + 'H, 最小任务工时' + min +
                    'H\n\n').concat(result)

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

window.exports = {
    "setting": {
        mode: 'none',
        args: {
            // 进入插件时调用（可选）
            enter: ({payload}, callbackSetList) => {
                // 如果进入插件就要显示列表数据
                utools.setExpendHeight(480)
                Nano.render(jsx`${SettingUI()}`, document.documentElement)
            },
        }
    },
    "task_resolver": {
        mode: "list",
        args: {
            // 进入插件时调用（可选）
            enter: ({payload}, callbackSetList) => {
                document.getElementById('setting')?.remove();
                // 如果进入插件就要显示列表数据
                fileName = payload[0].name;
                filePath = payload[0].path;
                callbackSetList(bookmarksDataCache);
            },
            // 用户选择列表中某个条目时被调用
            select: (action, {code}) => {
                try {
                    switch (code) {
                        case 'xmind_save':
                            saveExelHandler();
                            break;
                        case 'xmind_parse':
                            XMindParseHandler();
                            break;
                    }
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
