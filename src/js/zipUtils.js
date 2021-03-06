const JSZip = require('jszip');
const fs = require('fs');
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

async function getZipAssignFilename(zipPath, filename, type) {
    return await getZipFiles(zipPath).then(async (res) => {
        return await res.file(filename).async(type)
    })
}

async function readFile(path) {
    try {
        if (path.endsWith(".zxm")) {
            return await getZipAssignFilename(path, 'content.json', 'string')
                .then((res) => {
                    let root = JSON.parse(res)['root']
                    let contents = []
                    let root_children = root['children']
                    parseContentsJsonZxm(contents, root, root_children)
                    return contents
                })
        } else {
            return await getZipAssignFilename(path, 'content.json', 'string')
                .then((res) => {
                    let root = JSON.parse(res)[0]['rootTopic']
                    let contents = []
                    if (root['children']) {
                        let root_children = root['children']['attached']
                        parseContentsJsonXmind(contents, root, root_children)
                    }
                    return contents
                })
        }
    } catch (e) {
        return await getZipAssignFilename(path, 'content.xml', 'string')
            .then((res) => {
                const xmlDoc = new DOMParser().parseFromString(res, 'text/xml');
                let root = xmlToJson(xmlDoc)['xmap-content']['sheet']['topic']
                let contents = []
                if (root['children']) {
                    parseContentsXml(contents, root, root['children']['topics']['topic'])
                }
                return contents
            })
    }
}

// Changes XML to JSON
function xmlToJson(xml) {
    // Create the return object
    let obj = {};
    if (xml.nodeType === 1) { // element
        // do attributes
        if (xml.attributes.length > 0) {
            obj["@attributes"] = {};
            for (let j = 0; j < xml.attributes.length; j++) {
                const attribute = xml.attributes.item(j);
                obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
            }
        }
    } else if (xml.nodeType === 3) { // text
        obj = xml.nodeValue;
    }
    // do children
    if (xml.hasChildNodes()) {
        for (let i = 0; i < xml.childNodes.length; i++) {
            const item = xml.childNodes.item(i);
            const nodeName = item.nodeName;
            if (typeof (obj[nodeName]) == "undefined") {
                obj[nodeName] = xmlToJson(item);
            } else {
                if (typeof (obj[nodeName].length) == "undefined") {
                    const old = obj[nodeName];
                    obj[nodeName] = [];
                    obj[nodeName].push(old);
                }
                obj[nodeName].push(xmlToJson(item));
            }
        }
    }
    return obj;
}

Date.prototype.Format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1, //??????
        "d+": this.getDate(), //???
        "H+": this.getHours(), //??????
        "m+": this.getMinutes(), //???
        "s+": this.getSeconds(), //???
        "q+": Math.floor((this.getMonth() + 3) / 3), //??????
        "S": this.getMilliseconds() //??????
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
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
        '??????': '',
        '????????????': '',
        '?????????': processor,
        '?????????': recipients,
        '?????????': priority,
        '????????????ID': requirementId,
        '????????????': startDate,
        '????????????': endDate,
        '????????????': ''
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

function parseContentsXml(contents, node, children) {
    if (node === undefined) {
        return
    }

    let content = {}
    content.id = node['@attributes'].id
    content.parentId = node.parentId
    content.title = node.title['#text']
    contents.push(content)

    if (children === undefined || children.length === 0) {
        return
    }

    let id = node['@attributes'].id
    for (let i = 0, len = children.length; i < len; i++) {
        let child = children[i]
        child.parentId = id
        if (child['children']) {
            parseContentsXml(contents, child, child['children']['topics']['topic'])
        } else {
            parseContentsXml(contents, child, undefined)
        }
    }
}

function parseContentsJsonZxm(contents, node, children) {
    if (node === undefined) {
        return
    }

    let content = {}
    content.id = node['data'].id
    content.parentId = node['data'].parentId
    content.title = node['data'].text
    contents.push(content)

    if (children === undefined || children.length === 0) {
        return
    }

    let id = node['data'].id
    for (let i = 0, len = children.length; i < len; i++) {
        let child = children[i]
        child['data'].parentId = id

        let root_children = child.children
        if (root_children) {
            parseContentsJsonZxm(contents, child, root_children)
        } else {
            parseContentsJsonZxm(contents, child, undefined)
        }
    }
}

function parseContentsJsonXmind(contents, node, children) {
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
            parseContentsJsonXmind(contents, child, root_children)
        } else {
            parseContentsJsonXmind(contents, child, undefined)
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

    const data = []
    const error = []

    let contents = await readFile(path)

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
        if (
            !title.endsWith('h')
            && !title.endsWith('H')
            && !title.endsWith('h]')
            && !title.endsWith('h???')
            && !title.endsWith('H]')
            && !title.endsWith('H???')
            && !title.endsWith(']')
            && !title.endsWith('???')
        ) {
            continue
        }

        let parent = getParent(content.parentId, contents, hierarchy)

        let taskTime = ''
        for (let i = title.length - 1; i >= 0; i--) {
            let char = title.charAt(i)
            if (i >= title.length - 2 && (char === 'h'
                || char === 'H'
                || char === ']'
                || char === '???')) {
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
        rowData['??????'] = prefix.concat(parent.concat(title))
        if (isNaN(taskTime)) {
            rowData['????????????'] = '????????????'
            error.push(rowData)
        } else {
            rowData['????????????'] = taskTime
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
