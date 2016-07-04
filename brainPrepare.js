
var renderer;

var water = {
	 min: 1
	,max: 176
	,imageCount: 176
	,prefix: "./larger/sagittal"
	,zeroes: 4
	,imagesWidth: 176
	,imagesHeight: 176
}

var vessels = {
	 min: 1
	,max: 160
	,imageCount: 160
	,prefix: "./other/othersagittal"
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

var imageLoader = new ImageLoader(water);

function ImageLoader(dataset){

	var {min, max, imageCount, prefix, zeroes, imagesWidth, imagesHeight} = dataset;

	renderer = new Renderer();
	var loadingBar = document.getElementById("loadingBar");

	var imagesLoaded = 0;

	//var prepareCanvas = document.getElementById("prepareCanvas");
	//var prepareContext = prepareCanvas.getContext("2d");
	var images = [];

	for(var i = 0; i < imageCount; i++){
		var imageNumber = Math.floor(min + i*((max-min)/imageCount));
		var path = prefix + ("0000" + imageNumber).substr(-4,4) + ".png";
		//console.log(i, path);
		images[i] = new Image();
		images[i].onload = function(){
			imagesLoaded++;
			loadingBar.style.width = (imagesLoaded/imageCount)*100 + "%";
			if(imagesLoaded == imageCount + 1){
				document.getElementById("loadingText").innerHTML = "Processing...";
				setTimeout(prepareImages, 15);
			}
		};
		images[i].src = path;
	}

	var colorImg = new Image();
	colorImg.onload = function(){
		imagesLoaded++;
		if(imagesLoaded == imageCount + 1){
				document.getElementById("loadingText").innerHTML = "Processing...";
				setTimeout(prepareImages, 15);
			}
	};
	colorImg.src = "colorMappings/incandescent.png";


	function prepareImages(skipRendering){
		
		var canvas = document.createElement('canvas');
		var context = canvas.getContext('2d');
		canvas.width = imagesWidth;
		canvas.height = imagesHeight;
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
		
		for(var i = 0; i < images.length; i++){
			//document.getElementById("debug").appendChild(images[i]);
			context.drawImage(images[i], 0, 0 );
			imageData = context.getImageData(0, 0, imagesWidth, imagesHeight);
			
			for(var a = 0; a < imageData.data.length; a+= 4){
				if(imageData.data[a] > 50){
					var x = (a % (imagesWidth*4)/4);
					var y = i * 0.75;
					var z = (a / (imagesWidth*4));

					if(x > minX && x < maxX && y > minY && y < maxY && z > minZ && z < maxZ){
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

		document.getElementById("points").innerHTML = "Points: "+points.length;

		var colorMap = document.createElement('canvas');
		var colorMapContext = colorMap.getContext('2d');
		colorMap.width = 256;
		colorMap.height = 1;
		colorMapContext.drawImage(colorImg, 0, 0);
		var colorMapping = colorMapContext.getImageData(0, 0, 256, 1).data;

		renderer.setPoints(points, sizeX, sizeY, sizeZ, colorMapping);
		
		document.getElementById("loading").style.display = "none";

		if(!skipRendering){
			renderAll();
		}
	}

	function renderAll(){
		renderer.rotateAll();
		renderer.renderAll();
		window.requestAnimationFrame(renderAll);
	}

	return {
		prepareImages: prepareImages
	};
}

function updateRoi(){
	document.getElementById("loading").style.display = "block";
	setTimeout(function(){
		imageLoader.prepareImages(true);
	}, 15);
}

function setBackground(div){
	document.getElementById('renderCanvas').style.backgroundColor = div.style.backgroundColor;
}
