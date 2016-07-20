
var vrDisplay;
var vrEnabled = false;

if (navigator.getVRDisplays) {
	document.getElementById("autorotate").checked = false;
	document.getElementById("density").value = 20;
	navigator.getVRDisplays().then(function (displays) {
		if(displays.length > 0){
			vrDisplay = displays[0];
			vrEnabled = true;
		}
	});
	
}

var renderer = new Renderer();
var noGlRenderer;

var sagittal = {
	 imageCount: 176
	,orientation: "sagittal"
	,path: "./data/sagittal.png"
	,mappingPath: "colorMappings/incandescent.png"
	,imagesWidth: 300
	,imagesHeight: 300
	,rows: 2
	,xScale: 0.75
	,yScale: 1
	,zScale: 1
}

var water = {
	 imageCount: 176
	,orientation: "sagittal"
	,path: "./data/water.png"
	,mappingPath: "colorMappings/incandescent.png"
	,imagesWidth: 176
	,imagesHeight: 176
	,rows: 1
	,xScale: 0.75
	,yScale: 1
	,zScale: 1
}

var vessels = {
	 imageCount: 160
	,orientation: "sagittal"
	,path: "./data/vessels.png"
	,mappingPath: "colorMappings/blue.png"
	,imagesWidth: 160
	,imagesHeight: 160
	,xScale: 0.75
	,rows: 1
	,yScale: 1
	,zScale: 1
}

function load(dataset){
	document.getElementById("loadingBar").style.width = "0%";
	document.getElementById("loadingText").innerHTML = "Loading...";
	document.getElementById("loading").style.display = "block";
	
	setTimeout(function(){
		imageLoader.load(dataset);
	}, 15);
}

var doRender = false;
var animation;

var imageLoader = new ImageLoader();

imageLoader.load(water);

function ImageLoader(){

	if(animation){
		window.cancelAnimationFrame(animation);
	}

	/*var colorMap = document.createElement('canvas');
		var colorMapContext = colorMap.getContext('2d');
		colorMap.width = 256;
		colorMap.height = 1;
		colorMapContext.drawImage(colorImg, 0, 0);
		var colorMapping = colorMapContext.getImageData(0, 0, 256, 1).data;*/

	var dataset;
	var image;
	var colorImg;

	function load(d){

		dataset = d;

		if(animation){
			window.cancelAnimationFrame(animation);
		}		
		
		var {imageCount, path, imagesWidth, imagesHeight, xScale, yScale, zScale, orientation} = dataset;

		var imagesLoaded = 0;

		image = new Image();

		colorImg = new Image();
		colorImg.onload = function(){
			imagesLoaded++;
			loadingBar.style.width = (imagesLoaded/2)*100 + "%";
			if(imagesLoaded == 2){
				document.getElementById("loadingText").innerHTML = "Processing...";
				setTimeout(function(){prepareImages(dataset, image, colorImg);}, 15);
			}
		};
		colorImg.onload = onload;
		colorImg.src = "colorMappings/incandescent2.png";
	
		var loadingBar = document.getElementById("loadingBar");
		
		image.onload = onload;
		image.src = path;

		function onload(){
			imagesLoaded++;
			loadingBar.style.width = (imagesLoaded/2)*100 + "%";
			if(imagesLoaded == 2){
				document.getElementById("loadingText").innerHTML = "Processing...";
				setTimeout(function(){prepareImages(dataset, image, colorImg);}, 15);
			}
		};
	}


	function prepareImages(){

		var {imageCount, path, imagesWidth, imagesHeight, rows, xScale, yScale, zScale, orientation} = dataset;

		doRender = false;

		var points = [];
		var values = [];
		
		var canvas = document.createElement('canvas');
		var context = canvas.getContext('2d');
		canvas.width = imagesWidth * rows;
		canvas.height = (imagesHeight * imageCount)/rows;
		var imageData;

		var sizeX = imageCount * xScale;
		var sizeY = imagesHeight * yScale;
		var sizeZ = imagesWidth * zScale;

		context.drawImage(image, 0, 0 );
		imageData = context.getImageData(0, 0, canvas.width, canvas.height);

		var minX = sizeX * document.getElementById("roiXMin").value/100;
		var maxX = sizeX * document.getElementById("roiXMax").value/100;
		var minY = sizeY * document.getElementById("roiYMin").value/100;
		var maxY = sizeY * document.getElementById("roiYMax").value/100;
		var minZ = sizeZ * document.getElementById("roiZMin").value/100;
		var maxZ = sizeZ * document.getElementById("roiZMax").value/100;

		var i, x, y, z;

		var density = document.getElementById("density").value / 100;

		var rowArrays = [];

		for(var r = 0; r < rows; r++){
			rowArrays.push([]);
		}

		var valuesArrays = [];

		for(var r = 0; r < rows; r++){
			valuesArrays.push([]);
		}

		var r = 1;
		
		for(var a = 0; a < imageData.data.length; a+= 4){
			
			if(Math.random() < density){
				if(imageData.data[a] > 5){
					
					i = ~~(a/(4 * imagesWidth * imagesHeight)) % (imagesWidth*4);
					var row = ~~(a/(4*imagesWidth)) % rows;
					x = ~~((i) * xScale / rows) + (~~(a/(4*imagesWidth)) % rows) * sizeX/2;
					//x -= (x % rows) * i;
					
					if(x > minX && x < maxX){
						
						y = ~~((a % (imagesWidth*4)) * yScale /4);
						
						if(y > minY && y < maxY){
							
							z = ((~~((a) / (rows*imagesWidth*4)) % imagesHeight)) * zScale;
							
							if(z > minZ && z < maxZ){
								
								rowArrays[row].push(
									 (x*xScale-(sizeX*xScale)/2 + Math.random()*r/xScale) / sizeX
									,-(z-(sizeZ*zScale)/2 + Math.random()*r/zScale) / sizeZ
									,(y-(sizeY*yScale)/2 + Math.random()*r/yScale) / sizeY
									,imageData.data[a]
								);

								valuesArrays[row].push(
									imageData.data[a]
								);
							}
						}
					}
				}
			}
		}

		for(var r = 0; r < rows; r++){
			points = points.concat(rowArrays[r]);
		}

		for(var r = 0; r < rows; r++){
			values = values.concat(valuesArrays[r]);
		}

		document.getElementById("points").innerHTML = "Points: "+(points.length/4);

		var done = renderer.addPoints(points, values, orientation, colorImg);
		
		document.getElementById("loading").style.display = "none";
	}

	/*function renderAll(){
		if(doRender){
			if(!vrEnabled){
				renderer.rotateAll();
			}
			renderer.renderAll();
			animation = window.requestAnimationFrame(renderAll);
		}
	}*/

	return {
		 prepareImages: prepareImages
		,load: load
		,getPoints: function(){return points;}
	};
}

function updateRoi(){
	document.getElementById("loading").style.display = "block";
	setTimeout(function(){
		imageLoader.prepareImages();
	}, 15);
}

function setBackground(div){
	document.getElementById('renderCanvas').style.backgroundColor = div.style.backgroundColor;
}

function toggleFullscreen(){
	
	var isFullScreen = document.fullScreen || 
		document.mozFullScreen || 
		document.webkitIsFullScreen;

	if(isFullScreen){
		if (document.fullscreenEnabled) {
			document.exitFullscreen();
		} else if (document.webkitFullscreenEnabled) {
			document.webkitExitFullscreen();
		} else if (document.mozFullScreenEnabled) {
			document.mozCancelFullScreen();
		}
	} else {
		if (document.fullscreenEnabled) {
			document.documentElement.requestFullscreen();
		} else if (document.webkitFullscreenEnabled) {
			document.documentElement.webkitRequestFullscreen();
		} else if (document.mozFullScreenEnabled) {
			document.documentElement.mozRequestFullScreen();
		}
	}
}

function handleFullscreenChange(){
	var isFullScreen = document.fullScreen || 
		document.mozFullScreen || 
		document.webkitIsFullScreen;

	if(isFullScreen){
		document.getElementById("controls").style.display = "none";
		document.getElementById("canvasContainer").style.left = "0px";
		document.getElementById("fullscreenbutton").style.backgroundImage = "url('./smaller.svg')";
	} else {
		document.getElementById("controls").style.display = "block";
		document.getElementById("canvasContainer").style.left = "240px";
		document.getElementById("fullscreenbutton").style.backgroundImage = "url('./larger.svg')";
	}
}

document.addEventListener("fullscreenchange", function(event) {
	handleFullscreenChange();
});

document.addEventListener("webkitfullscreenchange", function(event) {
	handleFullscreenChange();
});

document.addEventListener("mozfullscreenchange", function(event) {
	handleFullscreenChange();
});










