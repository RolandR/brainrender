
var autorotate = false;
var debug = document.getElementById("debug");

function Renderer(){

	autorotate = document.getElementById("autorotate").checked;

	var canvas = document.getElementById('renderCanvas');
	
	function scale(){

		var pxRatio = window.devicePixelRatio || 1;
		
		canvas.width = ~~(canvasContainer.clientWidth * pxRatio);
		canvas.height = ~~(canvasContainer.clientHeight * pxRatio);
		
		width = canvas.width;
		height = canvas.height;		
	}

	window.onresize = scale;

	scale();

	var zoom = 0.8;

	var angleX = 0;
	var angleY = 0;
	
	var translateX = 0;
	var translateY = 0;
	var translateZ = 0.8;

	var running = true;

	var moving = false;
	var panning = false;
	var moveStartX = 0;
	var moveStartY = 0;
	var lastX = 0;
	var lastY = 0;
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
				translateX += (deltaX - lastX)*0.001;
				translateY -= (deltaY - lastY)*0.001;
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

	canvas.addEventListener('wheel', function(e) {
		//console.log(e.deltaY);
		if(e.shiftKey){
			zoom += zoom * 0.001 * e.deltaX;
		} else {
			translateZ += e.deltaY * 0.001;
		}
		return false;
	});
	
	var objectSize = 4;
	
	var objects;
	var colors;
	var values;
	var rendering = false;

	var glRenderer = new PointRenderer("renderCanvas");
	
	function addPoints(points, v, orientation, colorImg){
		
		colors = new Float32Array(objectSize*points.length/objectSize);
		objects = new Float32Array(points);
		values = new Float32Array(v);

		var r = 1;
		
		/*for(var i = 0; i < points.length; i+=objectSize){
			
			objects[i*objectSize  ] = (points[i*objectSize  ]*xScale-(xDim*xScale)/2 + Math.random()*r/xScale) / xDim;
			objects[i*objectSize+2] = (points[i*objectSize+1]*yScale-(yDim*yScale)/2 + Math.random()*r/yScale) / yDim;
			objects[i*objectSize+1] = -(points[i*objectSize+2]*zScale-(zDim*zScale)/2 + Math.random()*r/zScale) / zDim;

			values[i] = points[i*objectSize+3];


			//if(orientation == "axial"){
				//rotateY(i*objectSize, [Math.sin(Math.PI/2), Math.cos(Math.PI/2)], rotateCenter );
			//}
			
		}*/

		changeTransferImage(colorImg);
		
		glRenderer.addVertices(objects, colors, values);

		if(!rendering){
			render();
			rendering = true;
		}

		return true;
	}

	function render(){

		var rotationMatrix;
		
		if(vrEnabled){
			var orientation = vrDisplay.getPose().orientation;
			orientation = [-orientation[0], -orientation[1], orientation[2], orientation[3]];
			rotationMatrix = matrix4FromQuaternion(orientation);
		} else {
			if(autorotate && panX == 0 && panY == 0){
				angleX += 0.008;
			}
			angleX += panX*0.0018;
			panX = 0;
			var c = Math.cos(angleX);
			var s = Math.sin(angleX);
			
			rotationMatrix = [
				c, 0, s, 0,
				0, 1, 0, 0,
				-s, 0, c, 0,
				0,  0, 0, 1
			];

			angleY += panY*0.0018;
			panY = 0;
			var c = Math.cos(angleY);
			var s = Math.sin(angleY);
			
			var yRotationMatrix = [
				1, 0,  0, 0,
				0, c, -s, 0,
				0, s,  c, 0,
				0, 0,  0, 1,
			];

			rotationMatrix = matrix4Multiply(rotationMatrix, yRotationMatrix);
		}
		
		if(vrEnabled){
			var translationMatrix = makeTranslationMatrix([translateX, translateY, translateZ + 0.6]);
			var depth = 800;
			var scaleMatrix = makeScaleMatrix([1/(canvas.width/2), 1/canvas.height, 1/depth]);
			
		} else {
			
			var translationMatrix = makeTranslationMatrix([translateX, translateY, translateZ]);
			var depth = 800;
			var scaleMatrix = makeScaleMatrix([1/canvas.width, 1/canvas.height, 1/depth]);
		}

		var transformMatrix =  matrix4Multiply(rotationMatrix, translationMatrix);
		transformMatrix =  matrix4Multiply(transformMatrix, scaleMatrix);
		
		glRenderer.render(transformMatrix, zoom);

		if(running){	
			window.requestAnimationFrame(render);
		}
	}

	function pause(){
		running = false;
	}

	function unpause(){
		scale();
		running = true;
		render();
	}

	function changeTransferImage(image, updateRenderer){

		var colorMap = document.createElement('canvas');
		var colorMapContext = colorMap.getContext('2d');
		colorMap.width = 256;
		colorMap.height = 1;
		colorMapContext.drawImage(image, 0, 0);
		var colorMapping = colorMapContext.getImageData(0, 0, 256, 1).data;
		
		//colors = new Uint8ClampedArray(colors.length);
		
		for(var a = 0; a < objects.length; a+=objectSize){
			
			colors[a  ] = colorMapping[~~(values[~~(a/objectSize)]*4)  ] / 255;
			colors[a+1] = colorMapping[~~(values[~~(a/objectSize)]*4)+1] / 255;
			colors[a+2] = colorMapping[~~(values[~~(a/objectSize)]*4)+2] / 255;
			colors[a+3] = colorMapping[~~(values[~~(a/objectSize)]*4)+3] / 255;
			//colors[a+3] = values[~~(a/objectSize)] / 255;
			
		}

		if(updateRenderer){
			glRenderer.setColors(colors);
		}

		return colors;
	}

	
	return{
		 addPoints: addPoints
		,changeTransferImage: changeTransferImage
		,pause: pause
		,unpause: unpause
	}
}

function changeTransferImage(file){
	//console.log(file[0]);
	file = window.URL.createObjectURL(file[0]);
	var image = new Image();
	image.src = file;

	//console.log(colorMapping);
	image.onload = function(){renderer.changeTransferImage(image, true)};
}

















