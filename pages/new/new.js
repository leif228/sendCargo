// new.js
// TODO 并不是所有非中文字符宽度都为中文字符宽度一半，需特殊处理
// TODO 由于文本框聚焦存在bug，故编辑模式待实现
const input = require('../../utils/input');
const config = require('../../config');
const geo = require('../../services/geo');
const util = require('../../utils/util');
const requestUtil = require('../../utils/reqUtil.js');

const RESOLUTION = 750; // 微信规定屏幕宽度为750rpx
const MARGIN = 10; // 写字面板左右margin
const ROW_CHARS = Math.floor((RESOLUTION - 2 * MARGIN) / config.input.charWidth);
const MAX_CHAR = 1000; // 最多输1000字符

// 内容布局
const layoutColumnSize = 3;

// 日记内容类型
const TEXT = 'TEXT';
const IMAGE = 'IMAGE';
const VIDEO = 'VIDEO';

const mediaActionSheetItems = ['拍照', '选择照片', '选择视频'];
const mediaActionSheetBinds = ['chooseImage', 'chooseImage', 'chooseVideo'];

var app = getApp();

Page({

  data: {
    // 日记对象
    diary: {
      meta: {},
      list: [],
    },

    // 日记内容布局列表（2x2矩阵）
    layoutList: [],

    // 是否显示loading
    showLoading: false,

    // loading提示语
    loadingMessage: '',

    // 页面所处模式
    showMode: 'common',

    // 输入框状态对象
    inputStatus: {
      row: 0,
      column: 0,
      lines: [''],
      mode: 'INPUT',
      auto: false, // 是否有自动换行
    },

    // 当前位置信息
    poi: null,

    // 点击`图片`tab的action-sheet
    mediaActionSheetHidden: true,

    // 多媒体文件插入action-sheet
    mediaActionSheetItems: mediaActionSheetItems,

    // 多媒体文件插入项点击事件
    mediaActionSheetBinds: mediaActionSheetBinds,

    // 是否显示底部tab栏
    showTab: true,

    note: {
      id: "",
      title: "",
      summary: "",
      content: "",
      createTime: "",
      updateTime: "",
      isDelete: 0
    },

    isNew: false,
    focus: false,
    height: "", //data里面增加height属性

    cargoId: 0,
    cargoValue: '',
    toshowqcy: 1
  },

  // 显示底部tab
  showTab() {
    this.setData({
      showTab: true
    });
  },

  // 隐藏底部tab
  hideTab() {
    this.setData({
      showTab: false
    });
  },

  // 显示loading提示
  showLoading(loadingMessage) {
    this.setData({
      showLoading: true,
      loadingMessage
    });
  },

  // 隐藏loading提示
  hideLoading() {
    this.setData({
      showLoading: false,
      loadingMessage: ''
    });
  },

  // 数据初始化
  init() {
    this.getPoi();
    this.setMeta();
  },

  // 设置日记数据
  setDiary(diary) {
    let layout = util.listToMatrix(diary.list, layoutColumnSize);
    this.setData({
      diary: diary,
      layoutList: layout
    });
    this.saveDiary(diary);
  },

  // 保存日记
  // TODO sync to server
  saveDiary(diary) {
    const key = config.storage.diaryListKey;

    app.getLocalDiaries(diaries => {
      diaries[diary.meta.title] = diary;
      wx.setStorage({
        key: key,
        data: diaries
      });
    })
  },

  // 页面初始化
  onLoad: function(options) {
    //  wx.showShareMenu({
    //    withShareTicket: true //要求小程序返回分享目标信息
    //  })

    if (options) {
      let cargoId = options.cargoid;
      //let cargoValue = options.value;
      if (cargoId != 0) {
        this.setData({
            'cargoId': cargoId
          }),
          this.setData({
          'cargoValue': app.globalData.editCargoValue
          })
      }
    }
    //if (options) {
    //let title = options.title;
    //if (title) {this.setData({
    //'diary.meta.title': title,
    //'diary.meta.create_time': util.formatTime(new Date()),
    //'diary.meta.cover': ''
    //});}
    //}

    //this.init();
  },
  textareainput: function(e) {
    this.setData({
      'cargoValue': e.detail.value
    })
  },

  // 页面渲染完成
  onReady: function() {
    wx.setNavigationBarTitle({
      title: '编辑货盘'
    });
  },

  onShow: function() {
    var that = this;

    let id = "#textareawrap";
    let query = wx.createSelectorQuery(); //创建查询对象
    query.select(id).boundingClientRect(); //获取view的边界及位置信息
    query.exec(function(res) {
      that.setData({
        height: res[0].height + "px"
      });
    });
  },
  showqcy: function(e) {
    if (e.detail.value == '') {
      this.setData({
        toshowqcy: 0
      })
    } else {
      this.setData({
        toshowqcy: 1
      })
    }
  },
  onSubmit: function(e) {

    let contents = e.detail.value.content;
    this.toadd(contents, true)
  },
  toadd: function(contents, toshowToast) {
    let that = this;
    let toqcy = this.data.toshowqcy;
    if (toshowToast) {
      wx.showLoading({
        title: '加载中...',
      })
    };

    requestUtil.post(app.globalData.addUrl, {
      cargoId: this.data.cargoId,
      content: contents,
      toQcy: toqcy
    }).then(
      function(data) {
        console.log(data);
        if (toshowToast) {
          wx.hideLoading();
        };
        if (data.data.returnCode == 'Success') {
          that.setData({
            cargoId: data.data.content
          })
        } else {
          if (toshowToast) {
            wx.showToast({
              title: '保存失败!',
              icon: 'none',
              duration: 2000
            })
          }
        }

      },
      function(error) {
        if (toshowToast) {
          wx.hideLoading();
          wx.showToast({
            title: error,
            icon: 'none',
            duration: 2000
          })
        }
      }
    )
  },

  onDelete: function() {
    var that = this.data;
    wx.showModal({
      title: '提示',
      content: '确认删除？',
      success(res) {
        if (res.confirm) {
          if (that.cargoId != 0) {
            //TODO 后台删除数据
            wx.showLoading({
              title: '删除中...',
            })
            requestUtil.get(app.globalData.delUrl, {
              cargoId: that.cargoId
            }).then(
              function(data) {
                console.log(data);
                wx.hideLoading();
                if (data.data.returnCode == 'Success') {} else {
                  wx.showToast({
                    title: '删除失败',
                    icon: 'none',
                    duration: 2000
                  })
                }
                wx.switchTab({
                  url: '../mine/mine',
                });
              },
              function(error) {
                wx.hideLoading();
                wx.showToast({
                  title: error,
                  icon: 'none',
                  duration: 2000
                })
              }
            )

          }
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  },
  onHide: function() {
    // 页面隐藏
  },

  onUnload: function() {
    // 页面关闭
    console.log('页面跳转中...');
  },

  // 清除正在输入文本
  clearInput() {
    this.setData({
      inputStatus: {
        row: 0,
        common: 0,
        lines: [''],
        mode: 'INPUT',
        auto: false,
      }
    });
  },

  // 结束文本输入
  inputDone() {
    let text = this.data.inputStatus.lines.join('\n');
    let diary = this.data.diary;

    if (text) {
      diary.list.push(this.makeContent(TEXT, text, ''));
      this.setDiary(diary);
    }

    this.inputCancel();
  },

  // 进入文本编辑模式
  inputTouch(event) {
    this.setData({
      showMode: 'inputText'
    });
  },

  // 取消文本编辑
  inputCancel() {
    this.setData({
      showMode: 'common'
    });
    this.clearInput();
  },

  // 文本输入
  textInput(event) {
    console.log(event);
    let context = event.detail;

    // 输入模式
    if (this.data.inputStatus.mode === 'INPUT') {
      if (context.value.length != context.cursor) {
        console.log('用户输入中...');
      } else {
        let text = context.value;
        let len = input.strlen(text);
        let lines = this.data.inputStatus.lines;
        let row = this.data.inputStatus.row;
        let [extra, extra_index] = [
          [
            ['']
          ], 0
        ];
        let hasNewLine = false;
        console.log('当前文本长度: ' + len);

        // 当前输入长度超过规定长度
        if (len >= ROW_CHARS) {
          // TODO 此处方案不完善
          // 一次输入最好不超过两行
          hasNewLine = true;
          while (input.strlen(text) > ROW_CHARS) {
            let last = text[text.length - 1];

            if (input.strlen(extra[extra_index] + last) > ROW_CHARS) {
              extra_index += 1;
              extra[extra_index] = [''];
            }

            extra[extra_index].unshift(last);
            text = text.slice(0, -1);
          }
        }

        lines[lines.length - 1] = text;
        if (hasNewLine) {
          extra.reverse().forEach((element, index, array) => {
            lines.push(element.join(''));
            row += 1;
          });
        }

        let inputStatus = {
          lines: lines,
          row: row,
          mode: 'INPUT',
          auto: true, // // 自动换行的则处于输入模式
        };

        this.setData({
          inputStatus
        });
      }
    }
  },

  // 文本框获取到焦点
  focusInput(event) {
    let isInitialInput = this.data.inputStatus.row == 0 &&
      this.data.inputStatus.lines[0].length == 0;
    let isAutoInput = this.data.inputStatus.mode == 'INPUT' &&
      this.data.inputStatus.auto == true;
    let mode = 'EDIT';

    if (isInitialInput || isAutoInput) {
      mode = 'INPUT';
    }

    this.setData({
      'inputStatus.mode': mode
    });
  },

  // 点击多媒体插入按钮
  mediaTouch() {
    this.setData({
      showTab: false,
      mediaActionSheetHidden: false,
    });
  },

  mediaActionSheetChange(event) {
    this.setData({
      showTab: true,
      mediaActionSheetHidden: true,
    })
  },

  // 将内容写入至日记对象
  writeContent(res, type) {
    let diary = this.data.diary;

    if (type === IMAGE) {
      res.tempFilePaths.forEach((element, index, array) => {
        // TODO 内容上传至服务器
        diary.list.push(this.makeContent(type, element, ''))
      });
    }

    if (type === VIDEO) {
      // TODO 内容上传至服务器
      diary.list.push(this.makeContent(type, res.tempFilePath, ''))
    }

    // 设置日记封面
    if (type === IMAGE && !this.data.diary.meta.cover) {
      this.setData({
        'diary.meta.cover': res.tempFilePaths[0]
      });
    }

    this.setDiary(diary);
    this.hideLoading();
    this.showTab();
  },

  // 从相册选择照片或拍摄照片
  chooseImage() {
    let that = this;

    wx.chooseImage({
      count: 9, // 最多选9张
      sizeType: ['origin', 'compressed'],
      sourceType: ['album', 'camera'],

      success: (res) => {
        this.setData({
          mediaActionSheetHidden: true
        });
        this.showLoading('图片处理中...');
        that.writeContent(res, IMAGE);
      }
    })
  },

  // 从相册选择视频文件
  chooseVideo() {
    let that = this;

    wx.chooseVideo({
      sourceType: ['album'], // 仅从相册选择
      success: (res) => {
        this.setData({
          mediaActionSheetHidden: true
        });
        this.showLoading('视频处理中...');
        that.writeContent(res, VIDEO);
      }
    })
  },

  // 获得当前位置信息
  getPoi() {
    var that = this;
    wx.getLocation({
      type: 'gcj02',
      success: function(res) {
        geo.mapRequest(
          'geocoder', {
            'location': geo.formatLocation(res)
          },
          loc => {
            let poi = {
              'latitude': res.latitude,
              'longitude': res.longitude,
              'name': loc.result.address,
            };
            that.setData({
              poi: poi
            });
          })
      }
    })
  },

  // 构造日记内容对象
  makeContent(type, content, description) {
    return {
      type: type,
      content: content,
      description: description,
      poi: this.data.poi,
    };
  },

  // 构造日记meta信息
  setMeta() {
    var that = this;
    app.getUserInfo(info => {
      that.setData({
        'diary.meta.avatar': info.avatarUrl,
        'diary.meta.nickName': info.nickName,
      })
    })
  },

  //监听用户点击页面内转发按钮（<button> 组件 open-type="share"）或右上角菜单“转发”按钮的行为，并自定义转发内容。
  //注意：只有定义了此事件处理函数，右上角菜单才会显示“转发”按钮  
  onShareAppMessage: function(res) {
    if (res.from === 'button') {
      // 来自页面内转发按钮
      console.log(res.target)
    } 
    this.toadd(this.data.cargoValue, false);
    return {
      title: '货盘分享',
      path: 'pages/list/list?cargoId=' + this.data.cargoId
    }
  }

})