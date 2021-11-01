const JSZip = require('jszip');
const fs = require('fs');
const XLSX = require('xlsx');
const UToolsUtils = require('../utils/UToolsUtils.js');
const {configData} = require('../utils/DataKey.js');

async function getZipFiles(zipPath) {
    return new JSZip.external.Promise((resolve, reject) => {
        fs.readFile(zipPath, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    }).then((data) => {
        return JSZip.loadAsync(data);
    });
}

async function getZipAssignFilename(zipPath, filename, type = "string") {
    return await getZipFiles(zipPath).then(async (res) => {
        return await res.file(filename).async(type)
    })
}

async function readFile(path) {
    return await getZipAssignFilename(path, 'content.json')
        .then((res) => JSON.parse(res));
}

const config = [
    {
        key: 'rootTopic.children.attached',
        value: {
            id: 'id',
            title: '标题'
        }
    }
]
Date.prototype.Format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "H+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

function getExcelRowData() {
    let {
        prefix = '',
        processor = '',
        recipients = '',
        priority = '',
        requirementId = '',
        startDate = '',
        endDate = ''
    } = UToolsUtils.read(configData) || {};
    if (startDate === undefined || startDate.toString().trim() === '') {
        startDate = new Date().Format("yyyy-MM-dd")
    }
    if (priority === undefined || priority.toString().trim() === '') {
        priority = 'High'
    }
    if (endDate === undefined || endDate.toString().trim() === '') {
        let today = new Date()
        let date2 = new Date(today)
        date2.setDate(today.getDate() + 7)
        endDate = date2.Format("yyyy-MM-dd")
    }
    return {
        '标题': '',
        '详细描述': '',
        '处理人': processor,
        '抄送人': recipients,
        '优先级': priority,
        '所属需求ID': requirementId,
        '预计开始': startDate,
        '预计结束': endDate,
        '预估工时': ''
    }
}

function getParent(parentId, contents, num) {
    num = isNaN(num) ? 2 : num
    let parent = []
    for (let i = 0; i < num; i++) {
        let ps = contents.filter(x => x.id === parentId)
        if (ps.length) {
            let p = ps[0]
            parent.unshift(p)
            parentId = p.parentId
        } else {
            break
        }
    }

    let result = ''
    for (let i = 0; i < parent.length; i++) {
        let p = parent[i]
        result = result.concat(p.title).concat("<")
    }

    return result
}

function parseContents(contents, node, children) {
    if (node === undefined) {
        return
    }

    let content = {}
    content.id = node.id
    content.parentId = node.parentId
    content.title = node.title
    contents.push(content)

    if (children === undefined || children.length === 0) {
        return
    }

    let id = node.id
    for (let i = 0, len = children.length; i < len; i++) {
        let child = children[i]
        child.parentId = id

        let toot_children_attached = child.children
        if (toot_children_attached) {
            let root_children = toot_children_attached.attached
            parseContents(contents, child, root_children)
        } else {
            parseContents(contents, child, undefined)
        }
    }
}

async function readParseFileAlsoExcel(path) {
    let {prefix = '', hierarchy = 2} = UToolsUtils.read(configData) || {}
    if (prefix === undefined || prefix.toString().trim() === '') {
        prefix = ''
    }
    if (hierarchy === undefined || hierarchy.toString().trim() === '' || isNaN(hierarchy)) {
        hierarchy = 2
    }

    const res = await readFile(path)

    const data = []
    const error = []

    let root = res[0].rootTopic

    let contents = []
    if (root.children) {
        let root_children = root.children.attached
        parseContents(contents, root, root_children)
    }

    for (let i = 0, len = contents.length; i < len; i++) {
        let content = contents[i]
        let title = content.title
        if (title === undefined) {
            continue
        }
        title = title.toString()
        if (title.length <= 1) {
            continue
        }
        if (!title.endsWith('h')
            && !title.endsWith('H')
            && !title.endsWith('h]')
            && !title.endsWith('h】')
            && !title.endsWith('H]')
            && !title.endsWith('H】')) {
            continue
        }

        let parent = getParent(content.parentId, contents, hierarchy)

        let taskTime = ''
        for (let i = title.length - 1; i >= 0; i--) {
            let char = title.charAt(i)
            if (i >= title.length - 2 && (char === 'h'
                || char === 'H'
                || char === ']'
                || char === '】')) {
                continue
            }
            if ('.1234567890'.indexOf(char) !== -1) {
                taskTime = char.concat(taskTime)
            } else {
                break
            }
        }

        taskTime = parseFloat(taskTime)
        let rowData = getExcelRowData()
        rowData['标题'] = prefix.concat(parent.concat(title))
        if (isNaN(taskTime)) {
            rowData['预估工时'] = '解析错误'
            error.push(rowData)
        } else {
            rowData['预估工时'] = taskTime
            data.push(rowData)
        }
    }
    for (let i = error.length - 1; i >= 0; i--) {
        let errorData = error[i]
        data.unshift(errorData)
    }

    return data
}

module.exports = {readParseFileAlsoExcel}
