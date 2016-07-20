
function PointRenderer(canvasId){

	var canvas = document.getElementById(canvasId);
	var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

	var shaderProgram;
	var size;

	var vertexBuffer;
	var colorBuffer;
	var valueBuffer;

	var transform;
	var zoomAttr;
	var pointSize;

	init();

	function init(){

		/*=========================Shaders========================*/


		// Create a vertex shader object
		var vertShader = gl.createShader(gl.VERTEX_SHADER);

		// Attach vertex shader source code
		gl.shaderSource(vertShader, vertexShader);

		// Compile the vertex shader
		gl.compileShader(vertShader);

		// Create fragment shader object
		var fragShader = gl.createShader(gl.FRAGMENT_SHADER);

		// Attach fragment shader source code
		gl.shaderSource(fragShader, fragmentShader);

		// Compile the fragmentt shader
		gl.compileShader(fragShader);

		// Create a shader program object to store
		// the combined shader program
		shaderProgram = gl.createProgram();

		// Attach a vertex shader
		gl.attachShader(shaderProgram, vertShader); 

		// Attach a fragment shader
		gl.attachShader(shaderProgram, fragShader);

		// Link both programs
		gl.linkProgram(shaderProgram);

		// Use the combined shader program object
		gl.useProgram(shaderProgram);


		vertexBuffer = gl.createBuffer();
		colorBuffer = gl.createBuffer();
		valueBuffer = gl.createBuffer();
	}

	function addVertices(vertices, colors, values){

		/*==========Defining and storing the geometry=======*/

		size = ~~(vertices.length/4);

		gl.deleteBuffer(vertexBuffer);
		gl.deleteBuffer(colorBuffer);
		gl.deleteBuffer(valueBuffer);
		vertexBuffer = gl.createBuffer();
		colorBuffer = gl.createBuffer();
		valueBuffer = gl.createBuffer();

		
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);

		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

		// Get the attribute location
		var coord = gl.getAttribLocation(shaderProgram, "coordinates");

		// Point an attribute to the currently bound VBO
		gl.vertexAttribPointer(coord, 4, gl.FLOAT, false, 0, 0);

		// Enable the attribute
		gl.enableVertexAttribArray(coord);

		
		gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

		var color = gl.getAttribLocation(shaderProgram, "aVertexColor");
		gl.enableVertexAttribArray(color);
		gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
		gl.vertexAttribPointer(color, 4, gl.FLOAT, false, 0, 0);

		
		gl.bindBuffer(gl.ARRAY_BUFFER, valueBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, values, gl.STATIC_DRAW);

		var valuesAttr = gl.getAttribLocation(shaderProgram, "values");
		gl.enableVertexAttribArray(valuesAttr);
		gl.bindBuffer(gl.ARRAY_BUFFER, valueBuffer);
		gl.vertexAttribPointer(valuesAttr, 1, gl.FLOAT, false, 0, 0);

		transform = gl.getUniformLocation(shaderProgram, "transform");
		zoomAttr = gl.getUniformLocation(shaderProgram, "zoom");
		pointSize = gl.getUniformLocation(shaderProgram, "pointSize");

	}

	function setColors(colors){
		
		gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
		
	}

	//var angle = 1/3 * Math.PI;
	var angle = 0;
	//var rotationQuaternion = [0, 0, 0, 1];
	//var rotationMatrix = matrixFromQuaternion(rotationQuaternion);

	function render(transformMatrix, zoom){

		if(vrEnabled){
			var translationMatrix = makeTranslationMatrix([0.0001, 0, 0]);
			transformMatrix =  matrix4Multiply(transformMatrix, translationMatrix);
		}

		
		gl.uniformMatrix4fv(transform, false, transformMatrix);

		
		gl.uniform1f(zoomAttr, zoom);

		
		gl.uniform1f(pointSize, 0.001/zoom);

		// Clear the canvas
		gl.clearColor(0, 0, 0, 0);
		
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);
		
		/*gl.enable(gl.BLEND);
		gl.blendEquation( gl.FUNC_ADD );
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);*/

		// Clear the color buffer bit
		gl.clear(gl.COLOR_BUFFER_BIT);

		if(vrEnabled){
			// Set the view port
			gl.viewport(-canvas.width/16, 0, canvas.width/2, canvas.height);

			// Draw the triangle
			gl.drawArrays(gl.POINTS, 0, size);

			translationMatrix = makeTranslationMatrix([-0.0002, 0, 0]);
			transformMatrix =  matrix4Multiply(transformMatrix, translationMatrix);
			
			gl.uniformMatrix4fv(transform, false, transformMatrix);

			// Set the view port
			gl.viewport(canvas.width/2+canvas.width/16, 0, canvas.width/2, canvas.height);

			// Draw the triangle
			gl.drawArrays(gl.POINTS, 0, size);
		} else {
			// Set the view port
			gl.viewport(0, 0, canvas.width, canvas.height);

			// Draw the triangle
			gl.drawArrays(gl.POINTS, 0, size);
		}
		
	}

	return{
		 addVertices: addVertices
		,render: render
		,setColors: setColors
	};

}
