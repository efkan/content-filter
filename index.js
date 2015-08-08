

module.exports = function filter(options) {

  options = options || {};

	var urlBlackList = options.urlBlackList || ["%7B","%24"]
	var bodyBlackList = options.bodyBlackList || ["{","$"]
	var methodList = options.methodList || ["GET", "POST", "PUT", "DELETE"]
	var urlMessage = options.urlMessage || "A forbidden character has been found in URL: "
	var bodyMessage = options.bodyMessage || "A forbidden character has been found in form data: "	

	return function filter(req, res, next) {
		/* Only examine the valid methodList */
		if(methodList.indexOf(req.method)==-1) return next()
		var found = null
		/* Examining the URL */
		for(var i=0;i<urlBlackList.length;i++){ 
			if(req.originalUrl.indexOf(urlBlackList[i]) != -1) {
				found = urlBlackList[i]         
				break
			}
		}
		if(found) return res.status(403).send(urlMessage + found)
	  /* Examining the req.body object */
		if(Object.keys(req.body).length) {
			// console.log("start time: " + new Date().valueOf())	            
			jsonToString(req.body, function(str){                         
				for(var i=0;i<bodyBlackList.length;i++){
					if(str.indexOf(bodyBlackList[i]) != -1) {
						found = bodyBlackList[i]                 
						break
					}
				}			
				if(found) return res.status(403).send(bodyMessage + found)
				// console.log("end time: " + new Date().valueOf())	            
				next()
			})
		} else {
			next()
		}
	}
}


function jsonToString(json, callback) {	
	var str = "", level = 1;
	iterative(json)
	function iterative(data) {
		var keys = Object.keys(data)
		for(var i=0;i<keys.length;i++) {
			// console.log("keys: " + keys)							
			// console.log("keys.length: " + keys.length)							
			if(typeof data[keys[i]] == "object") {    
				// console.log("an object has been found: " + data[keys[i]])
				/************************************************************************************************
				 * If an object is the latest element of a for loop don't increase. Because `else { level-- }`
				 * block never works!
				 ************************************************************************************************/
				if(i != keys.length-1)	{
					level++			
					// console.log("level arttı - yeni level: " + level)						
					// console.log("level arttı - yeni leveldeki key sayısı: " + Object.keys(data[keys[i]]).length)						
				}
				iterative(data[keys[i]])
			} else {
				// console.log("else - keys: " + keys)
				// console.log("else - keys.length: " + keys.length)
				if(i == keys.length-1) {
					level--
					// console.log("level decrease")
					// console.log("level decrease - data[keys[i]]: " + data[keys[i]])
				}
				str += data[keys[i]]
				// console.log("level: " + level)				
				// console.log("i: " + i)								
				if(level==0 && i == keys.length-1) {
					// console.log("jsonToString has been completed")
					callback(str);
				}
			}
		}
	}	
}
