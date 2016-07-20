

var vrDisplay;
var vrEnabled = false;

if (navigator.getVRDisplays) {
	document.getElementById("autorotate").checked = false;
	document.getElementById("density").value = 15;
	navigator.getVRDisplays().then(function (displays) {
		if(displays.length > 0){
			vrDisplay = displays[0];
			vrEnabled = true;
		}
	});
	
}

var renderer = new Renderer();

var water = {
	 imageCount: 176
	,orientation: "sagittal"
	,path: "../data/water.png"
	,mappingPath: "colorMappings/incandescent.png"
	,imagesWidth: 176
	,imagesHeight: 176
	,xScale: 0.75
	,yScale: 1
	,zScale: 1
}

var vessels = {
	 imageCount: 160
	,orientation: "sagittal"
	,path: "../data/vessels.png"
	,mappingPath: "colorMappings/blue.png"
	,imagesWidth: 160
	,imagesHeight: 160
	,xScale: 0.75
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

	function load(dataset){

		if(animation){
			window.cancelAnimationFrame(animation);
		}

		var imagesLoaded = 0;

		var image = new Image();

		var colorImg = new Image();
		colorImg.onload = function(){
			renderer.changeTransferImage(colorImg);
		};
		colorImg.onload = onload;
		colorImg.src = "colorMappings/incandescent.png";

		
		
		var {imageCount, path, imagesWidth, imagesHeight, xScale, yScale, zScale, orientation} = dataset;
	
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


	function prepareImages(dataset, image, colorImg){

		var {imageCount, path, imagesWidth, imagesHeight, xScale, yScale, zScale, orientation} = dataset;

		doRender = false;
		
		var canvas = document.createElement('canvas');
		var context = canvas.getContext('2d');
		canvas.width = imagesWidth;
		canvas.height = imagesHeight * imageCount;
		var imageData;

		var sizeX = imageCount * xScale;
		var sizeY = imagesHeight * yScale;
		var sizeZ = imagesWidth * zScale;

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
					x = ~~(i * xScale);
					
					if(x > minX && x < maxX){
						
						y = ~~(a % (imagesWidth*4) * yScale /4);
						
						if(y > minY && y < maxY){
							
							z = (~~((a) / (imagesWidth*4)) % imagesHeight) * zScale;
							
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

		var done = renderer.addPoints(points, sizeX, sizeY, sizeZ, xScale, yScale, zScale, orientation, colorImg);
		
		document.getElementById("loading").style.display = "none";

		doRender = true;
		renderAll();
	}

	function renderAll(){
		if(doRender){
			if(!vrEnabled){
				renderer.rotateAll();
			}
			renderer.renderAll();
			animation = window.requestAnimationFrame(renderAll);
		}
	}

	return {
		 prepareImages: prepareImages
		,load: load
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
