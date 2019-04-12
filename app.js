// app.js

const config = require('config');
const diaries = require('demo/diaries');
const requestUtil = require('utils/reqUtil.js');

App({

  onLaunch: function(ops) {
    // if (ops.scene == 1044) {
    //   console.log(ops.shareTicket)
    //   console.log(ops.query)
    //   //this.globalData.shareCaroId = ops.query.cargoId
    //   console.log(ops)

    //   var shareTicket = ops.shareTicket
    //   wx.getShareInfo({
    //     shareTicket: shareTicket,
    //     complete(res) {
    //       console.log(res)
    //     }
    //   })
    // }

    let token = wx.getStorageSync('token');
    if (!token) {
      // 登录
      wx.login({
        success: res => {
          // 发送 res.code 到后台换取 openId, sessionKey, unionId
          console.log('res.code:' + res.code)
          wx.showLoading({
            title: '登录中...',
          });
          requestUtil.post(this.globalData.loginUrl, {
            code: res.code
          }).then(function(value) {
            wx.hideLoading();
            // success
            if (value.data.returnCode == 'Success') {
              console.log('successlogin:' + value.data.content);
              wx.setStorageSync('token', value.data.content);
            } else {
              console.log('faillogin:' + value.data.message);
              wx.showToast({
                title: '登录失败!',
                icon: 'none',
                duration: 2000
              })
            }

          }, function(error) {
            console.log('errorlogin:' + error)
            wx.hideLoading();
            wx.showToast({
              title: error,
              icon: 'none',
              duration: 2000
            })
          });
        }
      })
    }
  },

  onShow: function(ops) {
    if (ops.scene == 1044) {
      console.log(ops.shareTicket)
      console.log(ops.query)
      this.globalData.shareCaroId = ops.query.cargoId
      console.log(ops)

      if (this.globalData.shareCaroId != 0) {
        requestUtil.get(this.globalData.addReadNumUrl, {
          cargoId: this.globalData.shareCaroId
        }).then(
          function(data) {
            console.log(data)
          })
      }

      let shareTicket = ops.shareTicket
      wx.getShareInfo({
        shareTicket: shareTicket,
        complete(res) {
          console.log(res)
        }
      })
    }
  },

  // 获取用户信息
  getUserInfo: function(cb) {
    var that = this;

    if (this.globalData.userInfo) {
      typeof cb == 'function' && cb(this.globalData.userInfo)
    } else {
      // 先登录
      wx.login({
        success: function() {
          wx.getUserInfo({
            success: (res) => {
              that.globalData.userInfo = res.userInfo;
              typeof cb == 'function' && cb(that.globalData.userInfo)
            }
          })
        }
      })
    }
  },

  // 获取本地全部日记列表
  getDiaryList(cb) {
    var that = this;

    if (this.globalData.diaryList) {
      typeof cb == 'function' && cb(this.globalData.diaryList);
    } else {
      let list = [];

      this.getLocalDiaries(storage => {
        // 本地缓存数据
        for (var k in storage) {
          list.push(storage[k]);
        }
      });

      // 本地假数据
      list.push(...diaries.diaries);
      that.globalData.diaryList = list;
      typeof cb == 'function' && cb(that.globalData.diaryList)
    }
  },

  // 获取本地日记缓存
  getLocalDiaries(cb) {
    var that = this;

    if (this.globalData.localDiaries) {
      typeof cb == 'function' && cb(this.globalData.localDiaries);
    } else {
      wx.getStorage({
        key: config.storage.diaryListKey,
        success: (res) => {
          that.globalData.localDiaries = res.data;
          typeof cb == 'function' && cb(that.globalData.localDiaries);
        },
        fail: (error) => {
          that.globalData.localDiaries = {};
          typeof cb == 'function' && cb(that.globalData.localDiaries);
        }
      });
    }
  },

  // 获取当前设备信息
  getDeviceInfo: function(callback) {
    var that = this;

    if (this.globalData.deviceInfo) {
      typeof callback == "function" && callback(this.globalData.deviceInfo)
    } else {
      wx.getSystemInfo({
        success: function(res) {
          that.globalData.deviceInfo = res;
          typeof callback == "function" && callback(that.globalData.deviceInfo)
        }
      })
    }
  },

  globalData: {
    // 设备信息，主要用于获取屏幕尺寸而做适配
    deviceInfo: null,

    // 本地日记缓存列表 + 假数据
    // TODO 真实数据同步至服务端，本地只做部分缓存
    diaryList: null,

    // 本地日记缓存
    localDiaries: null,

    // 用户信息
    userInfo: null,

    shareCaroId: 0,

    // loginUrl: 'http://192.168.1.101:8080/shipwx/login',
    // listUrl: 'http://192.168.1.101:8080/shipwx/list',
    // addUrl: 'http://192.168.1.101:8080/shipwx/add',
    // delUrl: 'http://192.168.1.101:8080/shipwx/del',
    // addReadNumUrl: 'http://192.168.1.101:8080/shipwx/addReadNum',
    // getCargoUrl: 'http://192.168.1.101:8080/shipwx/getCargo',

    loginUrl: 'https://wx.qingchuanyi.com/shipwx/login',
    listUrl: 'https://wx.qingchuanyi.com/shipwx/list',
    addUrl: 'https://wx.qingchuanyi.com/shipwx/add',
    delUrl: 'https://wx.qingchuanyi.com/shipwx/del',
    addReadNumUrl: 'https://wx.qingchuanyi.com/shipwx/addReadNum',
    getCargoUrl: 'https://wx.qingchuanyi.com/shipwx/getCargo',

  }

})