

var vrDisplay;

if (navigator.getVRDisplays) {
	document.getElementById("density").value = 20;
	navigator.getVRDisplays().then(function (displays) {
		if(displays.length > 0){
			vrDisplay = displays[0];
		}
	});
	
}

var renderer = new Renderer();

var water = {
	 min: 1
	,max: 176
	,imageCount: 176
	,path: "./data/water.png"
	,zeroes: 4
	,imagesWidth: 176
	,imagesHeight: 176
}

var vessels = {
	 min: 1
	,max: 160
	,imageCount: 160
	,path: "./data/vessels.png"
	,zeroes: 4
	,imagesWidth: 160
	,imagesHeight: 160
}

function load(dataset){
	document.getElementById("loadingBar").style.width = "0%";
	document.getElementById("loadingText").innerHTML = "Loading...";
	document.getElementById("loading").style.display = "block";
	
	setTimeout(function(){
		imageLoader = new ImageLoader(dataset);
	}, 15);
}

var doRender = false;
var animation;

var imageLoader = new ImageLoader(water);

function ImageLoader(dataset){

	if(animation){
		window.cancelAnimationFrame(animation);
	}

	var {min, max, imageCount, path, imagesWidth, imagesHeight} = dataset;

	renderer = new Renderer();
	var loadingBar = document.getElementById("loadingBar");

	var imagesLoaded = 0;

	//var prepareCanvas = document.getElementById("prepareCanvas");
	//var prepareContext = prepareCanvas.getContext("2d");
	var image = new Image();
	image.onload = function(){
		imagesLoaded++;
		loadingBar.style.width = (imagesLoaded/imageCount)*100 + "%";
		if(imagesLoaded == 2){
			document.getElementById("loadingText").innerHTML = "Processing...";
			setTimeout(prepareImages, 15);
		}
	};
	image.src = path;

	var colorImg = new Image();
	colorImg.onload = function(){
		imagesLoaded++;
		if(imagesLoaded == 2){
			document.getElementById("loadingText").innerHTML = "Processing...";
			setTimeout(prepareImages, 15);
		}
	};
	colorImg.src = "colorMappings/incandescent.png";


	function prepareImages(){

		doRender = false;
		
		var canvas = document.createElement('canvas');
		var context = canvas.getContext('2d');
		canvas.width = imagesWidth;
		canvas.height = imagesHeight * imageCount;
		var imageData;

		var sizeX = imagesWidth;
		var sizeY = imagesHeight * 0.75;
		var sizeZ = imageCount;

		var minX = sizeX * document.getElementById("roiXMin").value/100;
		var maxX = sizeX * document.getElementById("roiXMax").value/100;
		var minY = sizeY * document.getElementById("roiYMin").value/100;
		var maxY = sizeY * document.getElementById("roiYMax").value/100;
		var minZ = sizeZ * document.getElementById("roiZMin").value/100;
		var maxZ = sizeZ * document.getElementById("roiZMax").value/100;

		var points = [];
		
		context.drawImage(image, 0, 0 );
		imageData = context.getImageData(0, 0, canvas.width, canvas.height);

		var i, x, y, z;

		var density = document.getElementById("density").value / 100;
		
		for(var a = 0; a < imageData.data.length; a+= 4){
			
			if(Math.random() < density){
				if(imageData.data[a] > 50){

					i = ~~(a/(4 * imagesWidth * imagesHeight));
					x = ~~(a % (imagesWidth*4)/4);
					
					if(x > minX && x < maxX){
						
						y = ~~(i * 0.75);
						
						if(y > minY && y < maxY){
							
							z = ~~((a) / (imagesWidth*4)) % imageCount;
							
							if(z > minZ && z < maxZ){
								
									points.push({
										 x: x
										,y: y
										,z: z
										,value: imageData.data[a]
									});
							}
						}
					}
				}
			}
		}

		document.getElementById("points").innerHTML = "Points: "+points.length;

		var colorMap = document.createElement('canvas');
		var colorMapContext = colorMap.getContext('2d');
		colorMap.width = 256;
		colorMap.height = 1;
		colorMapContext.drawImage(colorImg, 0, 0);
		var colorMapping = colorMapContext.getImageData(0, 0, 256, 1).data;

		var done = renderer.setPoints(points, sizeX, sizeY, sizeZ, colorMapping);
		
		document.getElementById("loading").style.display = "none";

		doRender = true;
		renderAll();
	}

	function renderAll(){
		if(doRender){
			renderer.rotateAll();
			renderer.renderAll();
			animation = window.requestAnimationFrame(renderAll);
		}
	}

	return {
		prepareImages: prepareImages
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
