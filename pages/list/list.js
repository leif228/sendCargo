// index.js
// 日记聚合页

const config = require("../../config");
const requestUtil = require('../../utils/reqUtil.js');

var app = getApp();

Page({

  data: {
    // 日记列表
    // TODO 从server端拉取
    diaries: null,

    // 是否显示loading
    showLoading: false,

    // loading提示语
    loadingMessage: '',
    content: "",
    time: "",
    shareCaroId:0,
    showCard:false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    wx.showShareMenu({
      withShareTicket: true //要求小程序返回分享目标信息
    })
    if (app.globalData.shareCaroId != 0) {
      this.setData({ shareCaroId: app.globalData.shareCaroId});
      let that = this;
      requestUtil.get(app.globalData.getCargoUrl, {
        cargoId: app.globalData.shareCaroId
      }).then(
        function(data) {
          console.log(data);
          if (data.data.returnCode == 'Success'){          
            that.setData({
              content: data.data.content.content,
              time: data.data.content.createTime,
              showCard: true
            });
          }
        })
    }  
},

/**
 * 获取日记列表
 * 目前为本地缓存数据 + 本地假数据
 * TODO 从服务端拉取
 */
// getDiaries() {
//   var that = this;
//   app.getDiaryList(list => {
//     that.setData({
//       diaries: list
//     });
//   })
// },

// 查看详情
// showDetail(event) {
//   wx.navigateTo({
//     url: '../entry/entry?id=' + event.currentTarget.id,
//   });
// }
})