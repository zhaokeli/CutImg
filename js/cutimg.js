(function(a, $) {
	'use strick';
	var _dev = true;

	function _debug(msg) {
		if (!_dev || undefined === console) {
			return;
		}
		if ('object' === typeof msg) {
			console.log(msg);
		} else {
			console.log('%c' + msg, 'color: #fff; background: #f40;padding:0px 10px; font-size: 14px;');
		}

	}
	//对象深拷贝
	function _deepCopy(source) {
		var result = {};
		for (var key in source) {
			result[key] = typeof source[key] === 'object' ? _deepCopy(source[key]) : source[key];
		}
		return result;
	};
	//图片加载器
	function _loadImage(url, callback) {
		//创建一个Image对象，
		var img = new Image();
		img.src = url;
		// 如果图片已经存在于浏览器缓存，直接调用回调函数
		if (img.complete) {
			callback.call(img);
			return;
		}
		//图片下载完毕时异步调用callback函数。
		img.onload = function() {
			//将回调函数的this替换为Image对象
			callback.call(img);
		};
	}

	function _cutImg() {
		//剪切器的容器
		this.container = null;
		//剪切区域成功后回调
		this.callback = null;
		//剪切的图片
		this.img = null;
		//容器宽高
		this.con_w = 0;
		this.con_h = 0;
		//图片的原宽高
		this.img_s_w = 0;
		this.img_s_h = 0;
		//图片的现宽高
		this.img_c_w = 0;
		this.img_c_h = 0;
		//移动框对像
		this.cutRect = null;
		//移动框的位置大小
		this.cutRectSize = {
			left: 0,
			top: 0,
			width: 100,
			height: 100
		};
		//剪切的方框的比例,默认为0不限制,如果想限制到一定的比例请 '宽/高';
		this.rectScale = 0;
		//图片缩放比例
		this.img_scale = 1;
		//遮罩和背景层dom
		this.cut_bg = null;
		this.cut_zz = null;
		this.cut_zz_img = null;
		this.ckMoveArea = null;
		// this._initContainer(option);
	}
	_cutImg.prototype = {
		isMobile: function() {
			var ua = navigator.userAgent;
			var ipad = ua.match(/(iPad).*OS\s([\d_]+)/),
				isIphone = !ipad && ua.match(/(iPhone\sOS)\s([\d_]+)/),
				isAndroid = ua.match(/(Android)\s+([\d.]+)/);
			return (isIphone || isAndroid);
		},
		initContainer: function(id) {
			var _t = this;
			if (_t.container) {
				return false;
			}
			_t.container = $(id);
			_t.con_w = _t.container.outerWidth();
			_t.con_h = _t.container.outerHeight();
			_t.container.append('<div  class="cutimg-container"><div class="ck-move-area"></div><div class="cut-black-bg"></div><div class="cutimg-bg"></div><div class="cutimg-zz"><div class="zz-img"></div><div class="move-point"><div class="move-block"></div><div class="point-t-l"></div><div class="point-t-c"></div><div class="point-t-r"></div><div class="point-b-l"></div><div class="point-b-c"></div><div class="point-b-r"></div><div class="point-l-c"></div><div class="point-r-c"></div></div></div></div>');
			var _size = {
				width: _t.con_w,
				height: _t.con_h
			};
			_t.container.find('.cutimg-container').css(_size);
			_t.cutRect = _t.container.find('.move-point');
			_t.cut_bg = _t.container.find('.cutimg-bg');
			_t.cut_zz = _t.container.find('.cutimg-zz');
			_t.cut_zz_img = _t.cut_zz.find('.zz-img');
			_t.ckMoveArea = _t.container.find('.ck-move-area');
			// _t.ckMoveArea.css(_size);

		},
		/**
		 * 设置剪切的方框的宽高比例,值宽/高
		 */
		setRectScale: function(scale) {
			this.rectScale = scale;
		},
		/**
		 * 设置矩框的初始位置和大小
		 */
		setRectSize: function(opt) {
			this.cutRectSize = opt;
		},
		//添加一个图片
		addImage: function(uri, callback) {
			var _t = this;
			_t.callback = callback;
			_loadImage(uri, function() {
				_t.img = this;
				_t.img_s_w = _t.img.width;
				_t.img_s_h = _t.img.height;
				_t._initImage();
				_t._initCutRect();
			});


		},
		/**
		 * 初始化加载的图片dom元素
		 * @return {[type]} [description]
		 */
		_initImage: function() {
			var _t = this;
			var str = '<img src="' + _t.img.src + '" />';
			_t.container.find('.cutimg-bg').html(_t.img);
			_t.container.find('.cutimg-zz .zz-img').html(str);
			_t.container.find('img').attr({
				onselectstart: "return false",
				unselectable: "on"
			});
			var _im = _t.container.find('img');
			var _bili = _t.img.width / _t.img.height;
			// debugger;
			if (_t.img.width > _t.img.height) {
				if (_t.img.width > _t.con_w) {
					_im.width(_t.con_w);
					_im.height(_t.con_w / _bili);
				}
			} else {
				if (_t.img.height > _t.con_h) {
					_im.height(_t.con_h);
					_im.width(_t.con_h * _bili);
				}
			}
			_t.img_c_w = _t.img.width;
			_t.img_c_h = _t.img.height;
			_t.img_scale = _t.img_c_h / _t.img_s_h;
			//连续设置两次防止图片变形定位错误
			// debugger;
			_t._resetPosition();
			setTimeout(function() {
				_t._resetPosition();
			}, 500);

			var size = {
				width: _t.img_c_w,
				height: _t.img_c_h
			};
			_t.cut_bg.css(size);
			_t.cut_zz.css(size);
			_t.cut_zz_img.css(size);
			//处理矩形大于图片的情况
			_t.cutRectSize.width > _t.img_c_w && (_t.cutRectSize.left = -1) && (_t.cutRectSize.width = _t.img_c_w);
			_t.cutRectSize.height > _t.img_c_h && (_t.cutRectSize.top = -1) && (_t.cutRectSize.height = _t.img_c_h);

			//把原宽高按比例处理下
			if (_t.rectScale !== 0) {
				if (_t.cutRectSize.width < _t.cutRectSize.height) {
					var _hh = parseInt(_t.cutRectSize.width / _t.rectScale);
					_t.cutRectSize.height = _hh;
				} else {
					var _ww = parseInt(_t.cutRectSize.height * _t.rectScale);
					_t.cutRectSize.width = _ww;
				}
			}
			_t._moveCutArea();
		},
		/**
		 * 定位刚刚加载的图片的位置,让它居中
		 * @return {[type]} [description]
		 */
		_resetPosition: function() {
			// debugger;
			var _t = this;
			_debug(_t.img.offsetWidth);
			var _left = _t.img_c_w / 2;
			var _top = _t.img_c_h / 2;
			_t.cut_bg.css({
				marginLeft: -_left,
				marginTop: -_top
			});
			_t.cut_zz.css({
				marginLeft: -_left,
				marginTop: -_top
			});
		},
		/**
		 * 初始化移动框移动事件
		 * @return {[type]} [description]
		 */
		_initCutRect: function() {
			var _t = this;
			//触控点移动
			var pointlist = _t.cutRect.find('div').not('.move-block');
			//触控点移动区域
			if (_t.isMobile()) {
				pointlist.each(function(index, el) {
					var dom = $(this)[0];
					dom.addEventListener('touchstart', function(e) {
						// debugger;
						if (e.targetTouches.length == 1) {　
							e.preventDefault();
							var touch = e.targetTouches[0];
							_ckDown($(this), touch.pageX, touch.pageY);
						}
						_debug(e);
					}, false);
				});
				// pointlist.each(function(index, el) {
				// var dom = $(this)[0];
				_t.ckMoveArea[0].addEventListener('touchmove', function(e) {
					if (e.targetTouches.length == 1) {　　　　
						e.preventDefault();
						var touch = e.targetTouches[0];
						//移动超过10个像素判断为选中文字
						_ckMove(_t.selectedObj, touch.pageX, touch.pageY);
					}
				}, false);
				// });
				// pointlist.each(function(index, el) {
				// var dom = $(this)[0];
				_t.ckMoveArea[0].addEventListener('touchend', function(e) {
					if (e.changedTouches.length > 0) {　
						e.preventDefault();
						var touch = e.changedTouches[0];
						_ckUp(_t.selectedObj, touch.pageX, touch.pageY);
					}
				}, false);
				// });
			} else {

				pointlist.mousedown(function(e) {
					_ckDown($(this), e.clientX, e.clientY);
				});
				_t.ckMoveArea.mousemove(function(e) {
					_ckMove(_t.selectedObj, e.clientX, e.clientY);
				});
				_t.ckMoveArea.mouseup(function(e) {
					_ckUp(_t.selectedObj, e.clientX, e.clientY);
				});
				_t.ckMoveArea.mouseout(function(e) {
					_ckUp(_t.selectedObj, e.clientX, e.clientY);
				});
			}
			var _ckDown = function(obj, e_x, e_y) {
				_t.ck_mousedown = true;
				_t.s_point = {
					x: e_x,
					y: e_y
				};
				_t.selectedObj = obj;
				_t.ckMoveArea.css('cursor', obj.css('cursor'));
				_t.ckMoveArea.show();

			};
			var _ckMove = function(obj, e_x, e_y) {
				if (_t.ck_mousedown) {
					_t.timeid && clearTimeout(_t.timeid);
					_t.timeid = setTimeout(function() {
						var classname = obj.prop('class');
						_debug(classname);
						// debugger;
						switch (classname) {
							case 'point-t-l':
								_t.upBorder(-(e_y - _t.s_point.y));
								_t.leftBorder(-(e_x - _t.s_point.x));
								break;
							case 'point-t-c':
								_t.upBorder(-(e_y - _t.s_point.y));
								break;
							case 'point-t-r':
								_t.upBorder(-(e_y - _t.s_point.y));
								_t.rightBorder((e_x - _t.s_point.x))
								break;
							case 'point-b-l':
								_t.downBorder((e_y - _t.s_point.y));
								_t.leftBorder(-(e_x - _t.s_point.x))
								break;
							case 'point-b-c':
								_t.downBorder((e_y - _t.s_point.y));
								break;
							case 'point-b-r':
								_t.downBorder((e_y - _t.s_point.y));
								_t.rightBorder((e_x - _t.s_point.x))
								break;
							case 'point-l-c':
								_t.leftBorder(-(e_x - _t.s_point.x));
								break;
							case 'point-r-c':
								_t.rightBorder((e_x - _t.s_point.x));
								break;
						}
						_t.s_point = {
							x: e_x,
							y: e_y
						};
					});
				}

			};
			var _ckUp = function(obj, e_x, e_y) {

				_t.selectedObj = null;
				_t.timeid && clearTimeout(_t.timeid);
				_t.ckMoveArea.hide();
				_debug('ck_mouse up');
				_t.ck_mousedown && _t.successCallback();
				_t.ck_mousedown = false;

			};

			//剪切框移动
			if (_t.isMobile()) {
				//移动端
				var obj = _t.cutRect.find('.move-block')[0];
				obj.addEventListener('touchstart', function(e) {
					if (e.targetTouches.length == 1) {　
						e.preventDefault();
						var touch = e.targetTouches[0];
						_mDown(touch.pageX, touch.pageY);
					}
					_debug(e);
				}, false);
				obj.addEventListener('touchmove', function(e) {
					if (e.targetTouches.length == 1) {　　　　
						e.preventDefault();
						var touch = e.targetTouches[0];
						//移动超过10个像素判断为选中文字
						_mMove(touch.pageX, touch.pageY);
					}
				}, false);
				obj.addEventListener('touchend', function(e) {
					if (e.changedTouches.length > 0) {　
						e.preventDefault();
						var touch = e.changedTouches[0];
						_mUp(touch.pageX, touch.pageY);
					}
				}, false);
			} else {
				var obj = _t.cutRect.find('.move-block');
				//pc端
				obj.mousedown(function(e) {
					_mDown(e.clientX, e.clientY);
				});
				obj.mousemove(function(e) {
					_mMove(e.clientX, e.clientY);
				});
				obj.mouseup(function(e) {
					_mUp(e.clientX, e.clientY);
				});
				obj.mouseout(function(e) {
					_mUp(e.clientX, e.clientY);
				});
			}
			//按下的时候处理
			var _mDown = function(e_x, e_y) {
				_t.mousedown = true;
				_t.s_point = {
					x: e_x,
					y: e_y
				};
			};
			//移动的时候处理
			var _mMove = function(e_x, e_y) {
				_t.timeid && clearTimeout(_t.timeid);
				_t.timeid = setTimeout(function() {
					if (_t.mousedown) {
						_t.cutRectSize.left = _t.cutRectSize.left + e_x - _t.s_point.x;
						_t.cutRectSize.top = _t.cutRectSize.top + e_y - _t.s_point.y;
						//设置剪切的图片区域
						//定义下一个源坐标
						_t.s_point = {
							x: e_x,
							y: e_y
						};
						_t._moveCutArea();
					}
				});
			};
			//抬起来的时候处理
			var _mUp = function(e_x, e_y) {
				// debugger
				// ;
				_t.timeid && clearTimeout(_t.timeid);
				_t.mousedown && _t.successCallback();
				_t.mousedown = false;
			}
		},
		/**
		 * 取当前剪切的图片坐标点
		 * @return {[type]} [description]
		 */
		getCutPoint: function() {
			var _t = this;
			// _debug(_t.img_scale);
			var le = Math.round((parseInt(_t.cutRect.css('left')) + 1) / _t.img_scale);
			var to = Math.round((parseInt(_t.cutRect.css('top')) + 1) / _t.img_scale);

			return {
				x: le > _t.img_s_w ? _t.img_s_w : le,
				y: to > _t.img_s_h ? _t.img_s_h : to,
				width: _t.cutRectSize.width,
				height: _t.cutRectSize.height
			};
		},
		//剪切成功后回调坐标
		successCallback: function() {
			var _t = this;
			typeof _t.callback === 'function' && _t.callback(_t.getCutPoint());
			//输出要剪切图片的起点和宽高
			// _debug(zb);
		},
		/**
		 * 移动剪切区域
		 */
		_moveCutArea: function() {

			var _t = this;
			if (_t._isRectInImage()) {
				//备份上次移动的正确的点
				_t.cutRectSize_bak = _deepCopy(_t.cutRectSize);
			} else {
				_debug('矩形区域有错');
				_debug(_t.cutRectSize);
				//还原上次移动
				_t.cutRectSize_bak && (_t.cutRectSize = _deepCopy(_t.cutRectSize_bak));
				return false;
			}
			//保证数值是整形,此处加上后会导致缩放有偏移
			// for (var i in _t.cutRectSize) {
			// 	_t.cutRectSize[i] = parseInt(_t.cutRectSize[i]);
			// }
			_t.cutRect.css({
				left: _t.cutRectSize.left,
				top: _t.cutRectSize.top,
				width: _t.cutRectSize.width,
				height: _t.cutRectSize.height
			});
			//计算剪切区域位置
			var _cutArea = {
				top: _t.cutRectSize.top,
				right: _t.cutRectSize.left + _t.cutRectSize.width + 1,
				bottom: _t.cutRectSize.top + _t.cutRectSize.height + 1,
				left: _t.cutRectSize.left + 1
			};
			_t.cut_zz_img.css({
				clip: 'rect(' + _cutArea.top + 'px,' + _cutArea.right + 'px,' + _cutArea.bottom + 'px,' + _cutArea.left + 'px)'
			});
		},
		/**
		 * 判断当前矩开位置是否在图片区域内
		 * @return {Boolean} [description]
		 */
		_isRectInImage: function() {
			var _t = this;
			var cur_h = _t.cutRectSize.height + _t.cutRectSize.top + 1;
			var cur_w = _t.cutRectSize.width + _t.cutRectSize.left + 1;
			if (cur_h > _t.img_c_h || cur_w > _t.img_c_w || _t.cutRectSize.top < -1 || _t.cutRectSize.left < -1) {
				return false;
			} else {
				return true;
			}
		},
		/**
		 * 重置剪切框大小
		 * cd为方框扩大(正数)或缩小(负数)的数值
		 */
		upBorder: function(cd) {
			var _t = this;
			// debugger;
			var h = _t.cutRectSize.height + cd;
			var t = _t.cutRectSize.top - cd;
			// _debug(t);
			if (h > _t.img_c_h || h < 50 || (t) < -1) {
				return
			}
			_t._upDownMove(h, t, true);
		},
		downBorder: function(cd) {
			var _t = this;
			var h = _t.cutRectSize.height + cd;
			var t = h + _t.cutRectSize.top + 1;
			if (h > _t.img_c_h || h < 50 || (t) > _t.img_c_h) {
				return
			}
			_t._upDownMove(h, t);

		},
		/**
		 * 上下边框移动时,设置剪切区域左右和宽
		 * @param h 移动后的高度
		 * @param t top和距离
		 * @param st settop是否设置top的值
		 * @return {[type]} [description]
		 */
		_upDownMove: function(h, t, st) {
			var _t = this;
			//剪切的比例 宽/高
			if (_t.rectScale !== 0) {

				var _ww = parseInt(h * _t.rectScale);
				if (_ww > _t.img_c_w) {
					return;
				}
				_t.cutRectSize.height = h;
				var toleft = (_t.cutRectSize.left == -1);
				var toright = (_t.cutRectSize.left + _t.cutRectSize.width + 1) == _t.img_c_w;
				if ((toleft && toright) || (!toleft && !toright)) {
					_t.cutRectSize.left = _t.cutRectSize.left - (_ww - _t.cutRectSize.width) / 2;
					// _t.cutRectSize.left = (_t.img_c_w - _ww) / 2;
				} else if (toright) {
					//到最右边
					_t.cutRectSize.left = _t.cutRectSize.left - (_ww - _t.cutRectSize.width);
				}
				_t.cutRectSize.width = _ww;
			} else {
				_t.cutRectSize.height = h;
			}
			st && (_t.cutRectSize.top = t);
			_t._moveCutArea();
		},
		/**
		 * 左右边框移动时,设置剪切区域顶部和高
		 * @param w 移动后的宽度
		 * @param l left的距离
		 * @param setleft是否设置左边距离
		 * @return {[type]} [description]
		 */
		_leftRightMove: function(w, l, sl) {
			var _t = this;
			//剪切的比例 宽/高
			if (_t.rectScale !== 0) {
				var _hh = parseInt(w / _t.rectScale);
				if (_hh > _t.img_c_h) {
					return;
				}
				_t.cutRectSize.width = w;

				var totop = (_t.cutRectSize.top == -1);
				var tobottom = (_t.cutRectSize.top + _t.cutRectSize.height + 1) == _t.img_c_h;
				if ((tobottom && totop) || (!tobottom && !totop)) {
					_t.cutRectSize.top = _t.cutRectSize.top - (_hh - _t.cutRectSize.height) / 2;
				} else if (tobottom) {
					_t.cutRectSize.top = _t.cutRectSize.top - (_hh - _t.cutRectSize.height);
				}
				_t.cutRectSize.height = _hh;
			} else {
				_t.cutRectSize.width = w;
			}
			sl && (_t.cutRectSize.left = l);
			_t._moveCutArea();
		},
		leftBorder: function(cd) {
			var _t = this;
			var w = _t.cutRectSize.width + cd;
			var l = _t.cutRectSize.left - cd;
			if (w > _t.img_c_w || w < 50 || (l) < -1) {
				return
			}
			_t._leftRightMove(w, l, true);
		},
		rightBorder: function(cd) {
			var _t = this;
			var w = _t.cutRectSize.width + cd;
			var l = w + _t.cutRectSize.left + 1;
			if (w > _t.img_c_w || w < 50 || (l) > _t.img_c_w) {
				return
			}
			_t._leftRightMove(w, l);
		}
	};
	a.CutImg = function(option) {
		return new _cutImg(option);
	};
})(window, $);