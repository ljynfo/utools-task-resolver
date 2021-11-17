const {Fragment, jsx, Component} = require('nano-jsx');
const {PureCss, CustomCss} = require('./css.js');
const UToolsUtils = require('../utils/UToolsUtils.js');
const {configData} = require('../utils/DataKey.js');

class SettingUI extends Component {
    defaultValue = {
        prefix: '',
        hierarchy: '',
        processor: '',
        recipients: '',
        priority: '',
        requirementId: '',
        startDate: '',
        endDate: ''
    }

    constructor(props) {
        super(props);
        const saveData = UToolsUtils.read(configData) || {};
        this.data = {...this.defaultValue, ...saveData};
    }

    changeData(e, key) {
        this.data[key] = e.target.value;
        this.saveData();
    }

    saveData() {
        UToolsUtils.save(configData, this.data);
    }

    render() {
        return jsx`
         <div id="setting" style="display: flex;flex-direction: column; align-items: center;margin-top: 20px;">
            <div class="modal">
                <div class="title">「任务解析」设置</div>
                <div class="form-item inputBox">
                  <div class="tips">标题前缀</div>
                  <div class="input">
                      <input value="${this.data.prefix}"  type="text" required
                      onChange=${(e) => this.changeData(e, 'prefix')}/>
                      <span class="highlight"></span>
                      <span class="bar"></span>
                      <label>默认「''」</label>
                  </div>
                </div>
                <div class="form-item inputBox">
                  <div class="tips">父标题层级数</div>
                  <div class="input">
                      <input value="${this.data.hierarchy}"  type="text" required
                      onChange=${(e) => this.changeData(e, 'hierarchy')}/>
                      <span class="highlight"></span>
                      <span class="bar"></span>
                      <label>默认「'2'」</label>
                  </div>
                </div>
                <div class="form-item inputBox">
                  <div class="tips">处理人</div>
                  <div class="input">
                      <input value="${this.data.processor}"  type="text" required
                      onChange=${(e) => this.changeData(e, 'processor')}/>
                      <span class="highlight"></span>
                      <span class="bar"></span>
                      <label>默认「''」</label>
                  </div>
                </div>
                <div class="form-item inputBox">
                  <div class="tips">抄送人</div>
                  <div class="input">
                      <input value="${this.data.recipients}"  type="text" required
                      onChange=${(e) => this.changeData(e, 'recipients')}/>
                      <span class="highlight"></span>
                      <span class="bar"></span>
                      <label>默认「''」</label>
                  </div>
                </div>
                <div class="form-item inputBox">
                  <div class="tips">优先级</div>
                  <div class="input">
                      <input value="${this.data.priority}"  type="text" required
                      onChange=${(e) => this.changeData(e, 'priority')}/>
                      <span class="highlight"></span>
                      <span class="bar"></span>
                      <label>默认「'High'」</label>
                  </div>
                </div>
                <div class="form-item inputBox">
                  <div class="tips">所属需求ID</div>
                  <div class="input">
                      <input value="${this.data.requirementId}"  type="text" required
                      onChange=${(e) => this.changeData(e, 'requirementId')}/>
                      <span class="highlight"></span>
                      <span class="bar"></span>
                      <label>默认「''」</label>
                  </div>
                </div>
                <div class="form-item inputBox">
                  <div class="tips">预计开始(yyyy-MM-dd)</div>
                  <div class="input">
                      <input value="${this.data.startDate}"  type="text" required
                      onChange=${(e) => this.changeData(e, 'startDate')}/>
                      <span class="highlight"></span>
                      <span class="bar"></span>
                      <label>默认「'今天'」</label>
                  </div>
                </div>
                <div class="form-item inputBox">
                  <div class="tips">预计结束(yyyy-MM-dd)</div>
                  <div class="input">
                      <input value="${this.data.endDate}"  type="text" required
                      onChange=${(e) => this.changeData(e, 'endDate')}/>
                      <span class="highlight"></span>
                      <span class="bar"></span>
                      <label>默认「'7天后'」</label>
                  </div>
                </div>
            </div>
          </div>`
    }
}

const app = () => {
    return jsx`
<${Fragment}>
<head>
  <title>Setting</title>
  <script src="index.js"/>
  <style>${PureCss}</style>
  <style>${CustomCss}</style>
</head>
<body>
  <div id="root"/>
   <${SettingUI} />
</body>
</${Fragment}>`
}
module.exports = {
    SettingUI: app
}
