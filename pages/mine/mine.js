// mine.js
var app = getApp();
var util = require('../../utils/util.js')
const requestUtil = require('../../utils/reqUtil.js');
// 自定义标签
var iconPath = "../../images/icons/"
var tabs = [{
    "icon": iconPath + "mark.png",
    "iconActive": iconPath + "markHL.png",
    "title": "日记",
    "extraStyle": "",
  },
  {
    "icon": iconPath + "collect.png",
    "iconActive": iconPath + "collectHL.png",
    "title": "收藏",
    "extraStyle": "",
  },
  {
    "icon": iconPath + "like.png",
    "iconActive": iconPath + "likeHL.png",
    "title": "喜欢",
    "extraStyle": "",
  },
  {
    "icon": iconPath + "more.png",
    "iconActive": iconPath + "moreHL.png",
    "title": "更多",
    "extraStyle": "border:none;",
  },
]
var userInfo = {
  avatar: "https://pic4.zhimg.com/e515adf3b_xl.jpg",
  nickname: "小闹钟",
  sex: "♂", // 0, male; 1, female
  meta: '1篇日记',
}


Page({

  // data
  data: {
    // 展示的tab标签
    tabs: tabs,

    // 当前选中的标签
    currentTab: "tab1",

    // 高亮的标签索引
    highLightIndex: "0",

    // 模态对话框样式 
    modalShowStyle: "",

    // 待新建的日记标题
    diaryTitle: "",

    // TODO 用户信息
    userInfo: userInfo,

    showNums: 0,
    searchKeyword: '', //需要搜索的字符  
    searchSongList: [], //放置返回数据的数组  
    isFromSearch: true, // 用于判断searchSongList数组是不是空数组，默认true，空的数组  
    searchPageNum: 1, // 设置加载的第几次，默认是第一次  
    totalPages: 1,
    callbackcount: 5, //返回数据的个数  
    searchLoading: false, //"上拉加载"的变量，默认false，隐藏  
    searchLoadingComplete: false //“没有数据”的变量，默认false，隐藏  
  },

  // 隐藏模态框
  hideModal() {
    this.setData({
      modalShowStyle: ""
    });
  },

  // 清除日记标题
  clearTitle() {
    this.setData({
      diaryTitle: ""
    });
  },

  onLoad: function() {

  },

  onShow: function() {
    this.setData({
      showNums: 0,
      searchSongList: [], //放置返回数据的数组    
      searchPageNum: 1, // 设置加载的第几次，默认是第一次  
      totalPages: 1,
      searchLoading: false, //"上拉加载"的变量，默认false，隐藏 
    })
    this.fetchSearchList();
    //this.hideModal();
    //this.clearTitle();
  },

  // 点击tab项事件
  touchTab: function(event) {
    var tabIndex = parseInt(event.currentTarget.id);
    var template = "tab" + (tabIndex + 1).toString();

    this.setData({
      currentTab: template,
      highLightIndex: tabIndex.toString()
    });
  },

  // 点击新建日记按钮
  touchAddNew: function(event) {
    // this.setData({
    //   modalShowStyle: "opacity:1;pointer-events:auto;"
    // })
    wx.navigateTo({
      url: "../new/new?cargoid=" + 0,
    });
  },

  // 新建日记
  touchAdd: function(event) {
    this.hideModal();
    app.globalData.editCargoValue = event.currentTarget.dataset['value'];
    wx.navigateTo({
      url: "../new/new?cargoid=" + event.currentTarget.dataset['cargoid']
    });
  },

  // 取消标题输入
  touchCancel: function(event) {
    this.hideModal();
    this.clearTitle();
  },

  // 标题输入事件
  titleInput: function(event) {
    this.setData({
      diaryTitle: event.detail.value,
    })
  },


  //输入框事件，每输入一个字符，就会触发一次  
  bindKeywordInput: function(e) {
    console.log("输入框事件")
    this.setData({
      searchKeyword: e.detail.value
    })
  },
  //搜索，访问网络  
  fetchSearchList: function() {
    let that = this;
    let searchKeyword = that.data.searchKeyword, //输入框字符串作为参数  
      searchPageNum = that.data.searchPageNum, //把第几次加载次数作为参数
      totalPages = that.data.totalPages,
      searchLoading = that.data.searchLoading,
      callbackcount = that.data.callbackcount; //返回数据的个数  

    if (searchPageNum <= totalPages && !searchLoading) {
      //访问网络  
      wx.showLoading({
        title: '列表加载中...',
      });
      requestUtil.get(app.globalData.listUrl, {
        pageNo: searchPageNum,
        pageSize: callbackcount
      }).then(
        function(data) {
          console.log(data);
          wx.hideLoading();
          if (data.data.returnCode == 'Success') {
            let searchList = [];
            //如果isFromSearch是true从data中取出数据，否则先从原来的数据继续添加  
            //that.data.isFromSearch ? searchList = data.data.content.list : searchList = that.data.searchSongList.concat(data.data.content.list)
            searchList = that.data.searchSongList.concat(data.data.content.list);
            that.setData({
              totalPages: data.data.content.totalPages,
              showNums: data.data.content.totalCount,
              searchSongList: searchList, //获取数据数组  
              searchLoading: false //把"上拉加载"的变量设为false，显示  
            });
          }else{
            wx.showToast({
              title: '服务端错误！',
              icon: 'none',
              duration: 2000
            })
          }

        },
        function(error) {
          wx.hideLoading();
          that.setData({
            searchLoading: false //把"上拉加载"的变量设为false，隐藏  
          });
          wx.showToast({
            title: error,
            icon: 'none',
            duration: 2000
          })
        });
      that.setData({
        searchLoading: true //把"上拉加载"的变量设为false，隐藏  
      });
    }
  },
  //点击搜索按钮，触发事件  
  // keywordSearch: function(e) {
  //   this.setData({
  //     showNums: 0,
  //     searchPageNum: 1, //第一次加载，设置1  
  //     searchSongList: [], //放置返回数据的数组,设为空  
  //     isFromSearch: true, //第一次加载，设置true  
  //     searchLoading: true, //把"上拉加载"的变量设为true，显示  
  //     searchLoadingComplete: false //把“没有数据”设为false，隐藏  
  //   })
  //   this.fetchSearchList();
  // },
  //滚动到底部触发事件  
  searchScrollLower: function() {
    let that = this;
    let searchPageNum = that.data.searchPageNum, //把第几次加载次数作为参数
      searchLoading = that.data.searchLoading,
      totalPages = that.data.totalPages;
    if (searchPageNum <= totalPages && !searchLoading) {
      that.setData({
        searchPageNum: that.data.searchPageNum + 1, //每次触发上拉事件，把searchPageNum+1  
      });
      that.fetchSearchList();
    }
  }

})