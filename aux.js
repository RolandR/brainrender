

function quaternionToEuler(x, y, z, w){
	
	var heading, attitude, bank;
	
	var test = x*y + z*w;
	if (test > 0.499) { // singularity at north pole
		heading = 2 * Math.atan2(x,w);
		attitude = Math.PI/2;
		bank = 0;
	}
	if (test < -0.499) { // singularity at south pole
		heading = -2 * Math.atan2(x,w);
		attitude = - Math.PI/2;
		bank = 0;
	}
	if(isNaN(heading)){
		var sqx = x*x;
		var sqy = y*y;
		var sqz = z*z;
		heading = Math.atan2(2*y*w - 2*x*z , 1 - 2*sqy - 2*sqz); // Heading
		attitude = Math.asin(2*test); // attitude
		bank = Math.atan2(2*x*w - 2*y*z , 1 - 2*sqx - 2*sqz); // bank
	}

	return {
		 y: heading
		,z: attitude
		,x: bank
	};
	
};
