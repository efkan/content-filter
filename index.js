module.exports = function filter(options) {

	options = options || {};

	var checkNames = options.checkNames || true;
	var typeList = options.typeList || ['object', 'function', 'string'];
	var urlBlackList = options.urlBlackList || ['$','{'];
	var bodyBlackList = options.bodyBlackList || ['$'];
	var methodList = options.methodList || ['GET', 'POST', 'PUT', 'DELETE'];
	var urlMessage = options.urlMessage || 'A forbidden expression has been found in URL: ';
	var bodyMessage = options.bodyMessage || 'A forbidden expression has been found in form data: ';
	var appendFound = options.appendFound || false;
	var caseSensitive = (options.caseSensitive === false) ? false : true;
	var dispatchToErrorHandler = (options.dispatchToErrorHandler === true) ? true : false;

	var errorStatus = 403
	var errorCode = "FORBIDDEN_CONTENT"

	return function filter(req, res, next) {
		/* Only examine the valid methodList */
		if (methodList.indexOf(req.method) === -1) {
			return next();
		}
		var found = null;
		/* Examining the URL */
		if (caseSensitive) {
			for (var i = 0; i < urlBlackList.length; i++){
				/* The URL in the request might be handled by using 'req.params.id' for 'address/users/:id' by a programmer.
				   Because of this don't use req.query object instead of req.originalUrl value */
				if (req.originalUrl.indexOf(urlBlackList[i]) !== -1) {
					found = urlBlackList[i];
					break;
				}
			}
		} else {
			/* If caseSensitive is `false` convert the originalURL value and bodyBlackList items into lowercase strings then examine them */
			var url = req.originalUrl.toLowerCase();
			for (var i = 0; i < urlBlackList.length; i++){
				if (url.indexOf(urlBlackList[i].toLowerCase()) !== -1) {
					found = urlBlackList[i];
					break;
				}
			}
		}
		if (found) {
			if (dispatchToErrorHandler) {
				return next({status: errorStatus, code: errorCode, message: urlMessage + (appendFound ? found : "")})
			} else {
				return res.status(errorStatus).send(urlMessage + (appendFound ? found : ""));
			}
		}

		/* Examining the req.body object If there is a req.body object it must be checked */
		if (req.body && Object.keys(req.body).length) {
			// // hrstart is used for to calculate the elapsed time
			// // https://nodejs.org/api/process.html#process_process_hrtime
			// var hrstart = process.hrtime()
			jsonToString(req.body, typeList, checkNames, function(str){
				/* If caseSensitive is `true` search for bodyBlackList items in combined body string */
				if (caseSensitive) {
					for (var i = 0; i < bodyBlackList.length; i++){
						if (str.indexOf(bodyBlackList[i]) !== -1) {
							found = bodyBlackList[i];
							break;
						}
					}
				} else {
					/* If caseSensitive is `false` convert the string and bodyBlackList items into lowercase strings then examine them */
					str = str.toLowerCase()
					for (var i = 0; i < bodyBlackList.length; i++){
						if (str.indexOf(bodyBlackList[i].toLowerCase()) !== -1) {
							found = bodyBlackList[i];
							break;
						}
					}
				}
				// // hrend is used for to calculate the elapsed time
				// var hrend = process.hrtime(hrstart)
				// console.log('Execution time (hr): %ds %dms', hrend[0], hrend[1]/1000000)
				if (found) {
					if (dispatchToErrorHandler) {
						return next({status: errorStatus, code: errorCode, message: urlMessage + (appendFound ? found : "")})
					} else {
						return res.status(errorStatus).send(bodyMessage + (appendFound ? found : ""));
					}
				}
				next();
			});
		} else {
			next();
		}
	};
};

function jsonToString(json, typeList, checkNames, callback) {
    var visitNode = function(obj) {
        var type = typeof(obj);

        if (obj === null || typeList.indexOf(type) === -1) {
            return '';
        }

        switch (type) {
            case 'string':
                return obj;

            case 'number':
            case 'boolean':
            case 'undefined':
                return String(obj);

            default:
                return visitObject(obj);
        }
    }

    var visitObject = function(obj) {
        var buffer = '';

        var keys = Object.keys(obj);
        var includeKey = checkNames && !Array.isArray(obj);

        for (var i = 0; i < keys.length; ++i) {
            var key = keys[i];
            buffer += (includeKey ? key : '') + visitNode(obj[key]);
        }

        return buffer;
    }

    return callback(visitNode(json));
}