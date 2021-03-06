
var autorotate = true;
var debug = document.getElementById("debug");

function Renderer(){

	autorotate = document.getElementById("autorotate").checked;
	
	var framesSinceCount = 0;
	
	var objects = [];
	var colors;
	
	var canvas = document.getElementById('renderCanvas');
	var context = canvas.getContext("2d");

	var fpsMeter = document.getElementById("fps");

	var canvasContainer = document.getElementById("canvasContainer");
	
	canvas.width = ~~(canvasContainer.offsetWidth/3);
	canvas.height = ~~(canvasContainer.offsetHeight/3);
	
	var width = canvas.width;
	var height = canvas.height;

	var imageData = new ImageData(width, height);

	var objectSize = 5;

	var rotation = [0, 0, 0];

	var xd = 0;
	var yd = 0;
	var zd = 0;

	window.onresize = function(){
		canvas.width = ~~(canvasContainer.offsetWidth/3);
		canvas.height = ~~(canvasContainer.offsetHeight/3);
		
		var oldWidth = width;
		var oldHeight = height;
		
		width = canvas.width;
		height = canvas.height;

		imageData = new ImageData(width, height);

		for(var i = 0; i < objects.length; i+=objectSize){
			translate(i, [(width-oldWidth)/4, 0, (height-oldHeight)/4]);
		}
		rotateCenter[0] += (width-oldWidth)/4;
		rotateCenter[2] += (height-oldHeight)/4;
		
	}
	
	var args = window.location.search;
	var zoom = 2000/width;
	if(args){
		zoomArgs = args.split("zoom=")[1];
		if(zoomArgs){
			zoom = zoomArgs.split("&")[0];
		}
	}
	
	var World = {
		 vanishingPointX: width/2
		,vanishingPointY: 800
		,vanishingPointZ: height/3
	};
	
	var rotateCenter = [~~(width/2), 400, ~~(2*height/5)];
	var rotateAngle = [Math.sin(0.02), Math.cos(0.02)];

	var PI = Math.PI;

	canvas.addEventListener('touchend', function(e) {
		if (document.fullscreenEnabled) {
			document.documentElement.requestFullscreen();
		} else if (document.webkitFullscreenEnabled) {
			document.documentElement.webkitRequestFullscreen();
		} else if (document.mozFullScreenEnabled) {
			document.documentElement.mozRequestFullScreen();
		}
		
		document.getElementById("controls").style.display = "none";
		document.getElementById("canvasContainer").style.left = "0px";
	});

	canvas.addEventListener('wheel', function(e) {
		//console.log(e.deltaY);
		if(e.shiftKey){
			zoom += zoom * 0.001 * e.deltaX;
		} else {
			moveY += e.deltaY * 0.5;
		}
		return false;
	});

	var moving = false;
	var panning = false;
	var moveStartX = 0;
	var moveStartY = 0;
	var lastX = 0;
	var lastY = 0;
	var moveX = 0;
	var moveY = 0;
	var moveZ = 0;
	var panX = 0;
	var panY = 0;

	var lastPose = [0, 0, 0];
	var poseDiff = [0, 0, 0];

	canvas.addEventListener('mousemove', function(e) {
		if(panning || moving){
			var deltaX = e.screenX - moveStartX;
			var deltaY = e.screenY - moveStartY;
			if(panning){
				panX += deltaX - lastX;
				panY += deltaY - lastY;
			} else if(moving){
				moveX += deltaX - lastX;
				moveZ += deltaY - lastY;
			}
			lastX = deltaX;
			lastY = deltaY;
		}
	});

	canvas.addEventListener('mousedown', function(e) {
		if(e.buttons == 1){
			moving = true;
		} else if(e.buttons == 2){
			panning = true;
			e.preventDefault();
		}
		moveStartX = e.screenX;
		moveStartY = e.screenY;
	});

	canvas.addEventListener('mouseup', function(e) {
		moving = false;
		panning = false;
		moveStartX = 0;
		moveStartY = 0;
		lastX = 0;
		lastY = 0;
		panX = 0;
		panY = 0;
	});
	/*window.addEventListener('mouseout', function(e) {
		moving = false;
	});*/

	var position = [0, 0, 0];
	var speeds = [0, 0, 0];

	/*window.addEventListener("devicemotion", function(e){
		debug.innerHTML = e.acceleration.x + " | " + e.acceleration.y + " | " + e.acceleration.z + "<br />";
		var time = e.interval / 1000;
		var velocity = [e.acceleration.x * time, e.acceleration.y * time, e.acceleration.z * time];
		debug.innerHTML += velocity[0] + " | " + velocity[1] + " | " + velocity[2] + "<br />";
		speeds[0] += velocity[0];
		speeds[1] += velocity[1];
		speeds[2] += velocity[2];
		debug.innerHTML += speeds[0] + " | " + speeds[1] + " | " + speeds[2] + "<br />";
		/*debug.innerHTML += "<br />";
		debug.innerHTML += JSON.stringify([e.accelerationIncludingGravity.x, e.accelerationIncludingGravity.y, e.accelerationIncludingGravity.z], null, 3);
		debug.innerHTML += "<br />";
		debug.innerHTML += JSON.stringify([e.rotationRate.alpha, e.rotationRate.beta, e.rotationRate.gamma], null, 3);
		debug.innerHTML += "<br />";
		debug.innerHTML += JSON.stringify(e.interval, null, 3);*/
	//});
	
	
	setInterval(fpsCount, 1000);
	
	function fpsCount(){
		fpsMeter.innerHTML = "fps: "+framesSinceCount;
		framesSinceCount = 0;
	}

	function renderAll(){
		framesSinceCount++;

		//imageData = new ImageData(width, height);
		
		var distanceFactor = 0;
		var renderY = 0;
		var renderX = 0;
		var pos0 = 0;

		//var scale = -0.01;
		//zoom += zoom * scale;
		//World.vanishingPointY += World.vanishingPointY * scale;

		var data = new Uint8ClampedArray(height*width*4);
		//var data = [];

		var x, y, z, vanishY, value;

		if(!objects){
			console.log("ouch!");
		}
		var orientation;

		if(vrEnabled){
			orientation = vrDisplay.getPose().orientation;
			orientation = [orientation[0], -orientation[2], -orientation[1], orientation[3]];
		}
		var rot;
		
		for(var i = 0; i < objects.length; i+=objectSize){

			
			x = objects[i  ];
			y = ~~objects[i+1];
			z = objects[i+2];

			if(vrEnabled){
				rot = quaternionTimesVector(orientation, [x - rotateCenter[0], y - rotateCenter[1], z - rotateCenter[2]]);
				x = rot[0] + rotateCenter[0];
				y = rot[1] + rotateCenter[1];
				z = rot[2] + rotateCenter[2];
			}
			
			
			vanishY = ~~objects[i+3];
			value = objects[i+4];
			
			if(value > 20){
				if(y > 0 && y < vanishY){
					
					distanceFactor = 1-(World.vanishingPointY/(zoom*y));
					renderX = ~~(x + distanceFactor * (World.vanishingPointX - x));
					
					if(renderX > 0 && renderX < width){
						renderY = ~~(z + distanceFactor * (World.vanishingPointZ - z));
						
						if(renderY > 0 && renderY < height){
							
							pos0 = (renderY	* width + renderX ) * 4;
							//c = 255 - ~~(255 * objects[i+1] / (World.vanishingPointY*2));
							if(data[pos0+3] < value){
								
								data[pos0  ] = colors[i  ];
								data[pos0+1] = colors[i+1];
								data[pos0+2] = colors[i+2];
								data[pos0+3] = value;
								
							}
							
						}
					}
				}
			}
		}

		imageData.data.set(data);
		
		context.putImageData(imageData, 0, 0);

		//imageData.data.fill(0);

	}
	
	function rotateAll(){

		if(autorotate){
			for(var i = 0; i < objects.length; i+=objectSize){
				rotateZ(i, rotateAngle, rotateCenter);
			}
		}

		if(panX || panY){
			var zAngle = [Math.sin(0.01 * panX), Math.cos(0.01 * panX)];
			var yAngle = [Math.sin(0.01 * -panY), Math.cos(0.01 * -panY)];
			
			for(var i = 0; i < objects.length; i+=objectSize){
				rotateZ(i, zAngle, rotateCenter);
				rotateX(i, yAngle, rotateCenter);
			}

			panX = 0;
			panY = 0;
		}

		if(moveX || moveZ){

			moveX = moveX * 0.3;
			moveZ = moveZ * 0.3;
			
			for(var i = 0; i < objects.length; i+=objectSize){
				translate(i, [moveX, 0, moveZ]);
			}

			rotateCenter[0] += moveX;
			rotateCenter[2] += moveZ;
			moveX = 0;
			moveZ = 0;
		}

		if(moveY){
			for(var i = 0; i < objects.length; i+=objectSize){
				translate(i, [0, moveY, 0]);
			}

			rotateCenter[1] += moveY;
			moveY = 0;
		}
	}

	function rotateX(i, angle, center){		
		var y = objects[i+1] - center[1]
		var z = objects[i+2] - center[2]

		objects[i+1] = y * angle[1] - z * angle[0] + center[1];
		objects[i+2] = y * angle[0] + z * angle[1] + center[2];
	}

	function rotateY(i, angle, center){
		var x = objects[i  ] - center[0]
		var z = objects[i+2] - center[2]

		objects[i+2] = z * angle[1] - x * angle[0] + center[2];
		objects[i  ] = z * angle[0] + x * angle[1] + center[0];
	}

	function rotateZ(i, angle, center){
		var x = objects[i  ] - center[0]
		var y = objects[i+1] - center[1]

		objects[i  ] = x * angle[1] - y * angle[0] + center[0];
		objects[i+1] = x * angle[0] + y * angle[1] + center[1];
	}

	function scale(i, factor){
		objects[i  ] *= factor;
		objects[i+1] *= factor;
		objects[i+2] *= factor;
	}

	function translate(i, coords){
		objects[i  ] += coords[0];
		objects[i+1] += coords[1];
		objects[i+2] += coords[2];
	}

	function minmax(number, min, max){
		if(number < min){
			number = min;
		}
		if(number > max){
			number = max;
		}
		return number;
	}
	
	function addPoints(points, xDim, yDim, zDim, xScale, yScale, zScale, orientation, colorImg){

		/*xDim = xd;
		yDim = yd;
		zDim = zd;*/
	
		//objects = new Float32Array(objectSize * points.length);

		var offset = objects.length;
		
		//objects = [];
		colors = new Uint8ClampedArray(objectSize*points.length + offset);

		var r = 1;

		rotateCenter = [width/2, World.vanishingPointY/5, 2*height/5];

		//showEdgePoints(xDim, yDim, zDim);
		
		for(var i = 0; i < points.length; i++){
			points[i].vanishY = World.vanishingPointY * Math.random();

			//points[i].value = Math.pow(points[i].value/255, 2) * 255;
			
			/*colors[i*objectSize  +offset] = colorMapping[~~points[i].value*4  ];
			colors[i*objectSize+1+offset] = colorMapping[~~points[i].value*4+1];
			colors[i*objectSize+2+offset] = colorMapping[~~points[i].value*4+2];
			colors[i*objectSize+3+offset] = colorMapping[~~points[i].value*4+3];*/
			
			objects[i*objectSize  +offset] = points[i].x;
			objects[i*objectSize+1+offset] = points[i].y;
			objects[i*objectSize+2+offset] = points[i].z;
			objects[i*objectSize+3+offset] = points[i].vanishY;
			objects[i*objectSize+4+offset] = points[i].value;

			translate(i*objectSize+offset, [width/2 - xDim/2, World.vanishingPointY/5-yDim/2, 2*height/5 - zDim/2]);
			translate(i*objectSize+offset, [Math.random()*r*xScale, Math.random()*r*yScale, Math.random()*r*zScale]);

			if(orientation == "axial"){
				rotateY(i*objectSize+offset, [Math.sin(Math.PI/2), Math.cos(Math.PI/2)], rotateCenter );
			}
			
		}

		changeTransferImage(colorImg);

		
		
	/*	for(var i = 0; i < objects.length; i+=objectSize){
			//scale(i, 1);
			
			//rotateX(i, [Math.sin(Math.PI/2), Math.cos(Math.PI/2)], [0, 0, 0] );
			//translate(i, [0, 400, 0]);
			
			
		}*/

		return true;
	}

	function changeTransferImage(image){

		var colorMap = document.createElement('canvas');
		var colorMapContext = colorMap.getContext('2d');
		colorMap.width = 256;
		colorMap.height = 1;
		colorMapContext.drawImage(image, 0, 0);
		var colorMapping = colorMapContext.getImageData(0, 0, 256, 1).data;
		
		colors = new Uint8ClampedArray(colors.length);
		
		for(var i = 0; i < objects.length; i+=objectSize){
			
			colors[i  ] = colorMapping[~~(objects[i+4]*4)  ];
			colors[i+1] = colorMapping[~~(objects[i+4]*4)+1];
			colors[i+2] = colorMapping[~~(objects[i+4]*4)+2];
			colors[i+3] = colorMapping[~~(objects[i+4]*4)+3];
			
		}
	}

	function showEdgePoints(xDim, yDim, zDim){
		var e = 0;
		
		objects[e+0] = 0;
		objects[e+1] = 0;
		objects[e+2] = 0;
		objects[e+3] = 10000;
		objects[e+4] = 255;
		colors[e+0] = 0;
		colors[e+1] = 255;
		colors[e+2] = 0;
		colors[e+3] = 255;
		e+=objectSize;

		objects[e+0] = xDim;
		objects[e+1] = 0;
		objects[e+2] = 0;
		objects[e+3] = 10000;
		objects[e+4] = 255;
		colors[e+0] = 0;
		colors[e+1] = 255;
		colors[e+2] = 0;
		colors[e+3] = 255;
		e+=objectSize;

		objects[e+0] = 0;
		objects[e+1] = yDim;
		objects[e+2] = 0;
		objects[e+3] = 10000;
		objects[e+4] = 255;
		colors[e+0] = 0;
		colors[e+1] = 255;
		colors[e+2] = 0;
		colors[e+3] = 255;
		e+=objectSize;

		objects[e+0] = xDim;
		objects[e+1] = yDim;
		objects[e+2] = 0;
		objects[e+3] = 10000;
		objects[e+4] = 255;
		colors[e+0] = 0;
		colors[e+1] = 255;
		colors[e+2] = 0;
		colors[e+3] = 255;
		e+=objectSize;

		objects[e+0] = 0;
		objects[e+1] = 0;
		objects[e+2] = zDim;
		objects[e+3] = 10000;
		objects[e+4] = 255;
		colors[e+0] = 0;
		colors[e+1] = 255;
		colors[e+2] = 0;
		colors[e+3] = 255;
		e+=objectSize;

		objects[e+0] = xDim;
		objects[e+1] = 0;
		objects[e+2] = zDim;
		objects[e+3] = 10000;
		objects[e+4] = 255;
		colors[e+0] = 0;
		colors[e+1] = 255;
		colors[e+2] = 0;
		colors[e+3] = 255;
		e+=objectSize;

		objects[e+0] = 0;
		objects[e+1] = yDim;
		objects[e+2] = zDim;
		objects[e+3] = 10000;
		objects[e+4] = 255;
		colors[e+0] = 0;
		colors[e+1] = 255;
		colors[e+2] = 0;
		colors[e+3] = 255;
		e+=objectSize;

		objects[e+0] = xDim;
		objects[e+1] = yDim;
		objects[e+2] = zDim;
		objects[e+3] = 10000;
		objects[e+4] = 255;
		colors[e+0] = 0;
		colors[e+1] = 255;
		colors[e+2] = 0;
		colors[e+3] = 255;
		e+=objectSize;
	}
	
	return{
		 addPoints: addPoints
		,renderAll: renderAll
		,rotateAll: rotateAll
		,changeTransferImage: changeTransferImage
	}
}

function changeTransferImage(file){
	//console.log(file[0]);
	file = window.URL.createObjectURL(file[0]);
	var image = new Image();
	image.src = file;

	//console.log(colorMapping);
	image.onload = function(){renderer.changeTransferImage(image)};
}



















