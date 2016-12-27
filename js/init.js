$(function() {
	//创建一个剪切图片的对象
	window.cutimg = CutImg();

	//初始化容器,容器大小自己指定
	cutimg.initContainer('#container');

	//设置剪切的矩形区域大小和位置
	cutimg.setRectSize({
		top: 10,
		left: 20,
		width: 200,
		height: 200
	});

	//设置剪切的矩形宽/高比例,此参数默认为0,不为0时上面设置的矩形大小会失效,根据设置的比例和初始化大小自动调整
	cutimg.setRectScale(3 / 3);

	//添加要处理的图片,[图片地址,剪切点回调],当移动剪切区域后,会触发回调并传来当前的图片的剪切坐标点
	//这些坐标点是根据原图的像素计算出来的,左上角的一个点的x,y坐标,和图片宽和高
	// {
	// 	x: 20,
	// 	y: 30,
	// 	width: 150,
	// 	height: 200
	// }
	// 比如上面的结构表示,从图片的20,30这个点开始取宽为150高为200的区域的图像数据
	cutimg.addImage('./min.jpg', function(zb) {
		console.log(zb);
	});
	// cutimg.addImage('https://ss1.bdstatic.com/5eN1bjq8AAUYm2zgoY3K/r/www/cache/holiday/xmas2016/logo.gif');
	// cutimg.addImage('http://h.hiphotos.baidu.com/image/pic/item/43a7d933c895d143c2a0ab2d71f082025baf07ed.jpg');
	//取剪切框所在区域的图像的坐标点,一般在调用addImage后调用
	var zb = cutimg.getCutPoint();
	// console.log(zb);
});