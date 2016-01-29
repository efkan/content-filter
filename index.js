module.exports = function filter(options) {

	options = options || {};

	var checkNames = options.checkNames || true;
	var typeList = options.typeList || ['object', 'function'];
	var urlBlackList = options.urlBlackList || ['%7B','%24'];
	var bodyBlackList = options.bodyBlackList || ['$'];
	var methodList = options.methodList || ['GET', 'POST', 'PUT', 'DELETE'];
	var urlMessage = options.urlMessage || 'A forbidden character set has been found in URL: ';
	var bodyMessage = options.bodyMessage || 'A forbidden string has been found in form data: ';

	return function filter(req, res, next) {
		/* Only examine the valid methodList */
		if (methodList.indexOf(req.method) === -1) {
			return next();
		}
		var found = null;
		/* Examining the URL */
		for (var i = 0; i < urlBlackList.length; i++){
			if (req.originalUrl.indexOf(urlBlackList[i]) !== -1) {
				found = urlBlackList[i];
				break;
			}
		}
		if (found) {
			return res.status(403).send(urlMessage + found);
		}

		/* Examining the req.body object If there is a req.body object it must be checked */
		if (req.body && Object.keys(req.body).length) {
			// // hrstart is used for to calculate the elapsed time
			// // https://nodejs.org/api/process.html#process_process_hrtime
			// var hrstart = process.hrtime()
			jsonToString(req.body, typeList, checkNames, function(str){
				for (var i = 0; i < bodyBlackList.length; i++){
					if (str.indexOf(bodyBlackList[i]) !== -1) {
						found = bodyBlackList[i];
						break;
					}
				}
				// // hrend is used for to calculate the elapsed time
				// var hrend = process.hrtime(hrstart)
				// console.log('Execution time (hr): %ds %dms', hrend[0], hrend[1]/1000000)
				if (found) {
					return res.status(403).send(bodyMessage + found);
				}
				next();
			});
		} else {
			next();
		}
	};
};

function jsonToString(json, typeList, checkNames, callback) {

	var str = '', level = 1;
	iterative(json);
	function iterative(data) {
		var keys = Object.keys(data);
		// Ari [fixing]: Never callback if keys.lenght == 0
		if (keys.length === 0) {
			callback('');
		}

		for (var i = 0; i < keys.length; i++) {
			// console.log('keys: ' + keys)
			// console.log('keys.length: ' + keys.length)
			if (typeList.indexOf(typeof data[keys[i]]) !== -1) {

				// Carlos [fixing]: null is an object too. So check the value `data[keys[i]]`
				if (typeof data[keys[i]] === 'object' && data[keys[i]]) {
					// console.log('an object has been found: ' + data[keys[i]])
					if (checkNames) {
						// if the object is an array get the elements
						if (data[keys[i]].length) {
							str += data[keys[i]].join('');
						} else {
							// else this is an object	so get the property names
							str += Object.getOwnPropertyNames(data[keys[i]]);
						}
					}
					/************************************************************************************************
					* If an object is the latest element of a for loop don't increase. Because `else { level-- }`
					* block never works!
					************************************************************************************************/
					if (i !== keys.length - 1)	{
						level++;
						// console.log('level increased - new level: ' + level)
						// console.log('level increased - number of the keys of the new level: ' + Object.keys(data[keys[i]]).length)
					}
					iterative(data[keys[i]]);
				} else {
					// console.log('else - keys: ' + keys)
					// console.log('else - keys.length: ' + keys.length)
					if (i === keys.length - 1) {
						level--;
						// console.log('level decrease')
						// console.log('level decrease - data[keys[i]]: ' + data[keys[i]])
					}
					str += (checkNames) ? keys[i] + data[keys[i]] : data[keys[i]];
					// console.log('level: ' + level)
					// console.log('i: ' + i)
					if (level === 0 && i === keys.length - 1) {
						// console.log('jsonToString has been completed')
						callback(str);
					}
				}

			} else {
				if (i === keys.length - 1) {
					level--;
				}
				if (level === 0 && i === keys.length - 1) {
					callback(str);
				}
			}
		}
	}
}
