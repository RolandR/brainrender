var vertexShader = `

uniform float zoom;
uniform float pointSize;
uniform mat4 transform;
attribute vec3 coordinates;
attribute float value;

attribute vec4 aVertexColor;
varying lowp vec4 vColor;

attribute lowp float values;

void main(void){
	
	/*distanceFactor = 1-(World.vanishingPointY/(zoom*y));
	renderX = ~~(x + distanceFactor * (World.vanishingPointX - x));
	
	if(renderX > 0 && renderX < width){
		renderY = ~~(z + distanceFactor * (World.vanishingPointZ - z));*/


	//vec4 coordinates = vec4(coordinates.xyz / resolution.xyz, 1.0);
	//coordinates = coordinates.xyz * 2.0;
	//coordinates = coordinates.xyz + 1.0;
	//value = 0.5;

	vColor = aVertexColor.xyzw;

	vec4 coordinates = transform * vec4(coordinates.xyz, 1.0);
	
	coordinates.xy = coordinates.xy / (coordinates.z * zoom);

	//position = rotation * position;
	
	gl_Position = vec4(coordinates.xy, 1.0-values/255.0, 1.0);
	//gl_Position = vec4(coordinates.xyz, 1.0);
	gl_PointSize = pointSize/(coordinates.z);
}

`;
