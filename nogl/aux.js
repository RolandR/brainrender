

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

function quaternionTimesVector(q, v){
 
    var x = v[0],
        y = v[1],
        z = v[2];
 
    var qx = q[0],
        qy = q[1],
        qz = q[2],
        qw = q[3];
 
    // q*v
    var ix =  qw * x + qy * z - qz * y,
    iy =  qw * y + qz * x - qx * z,
    iz =  qw * z + qx * y - qy * x,
    iw = -qx * x - qy * y - qz * z;

	var target = [0, 0, 0];
	
    target[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    target[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    target[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
 
    return target;
};

function inverse(q){
	
    var  x = q[0]
		,y = q[1]
		,z = q[2]
		,w = q[3];
 
    target = conjugate(q);
    
    var inorm2 = 1/(x*x + y*y + z*z + w*w);
    target[0] *= inorm2;
    target[1] *= inorm2;
    target[2] *= inorm2;
    target[3] *= inorm2;
 
    return target;
};

function conjugate(q){
    var target = [0, 0, 0, 0];
 
    target[0] = -q[0];
    target[1] = -q[1];
    target[2] = -q[2];
    target[3] =  q[3];
 
    return target;
};
































