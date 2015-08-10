# Content-filter
The module returns an Express.js **middleware** that is used for to examine URL and HTML body contents of the request (by using body-parser) to block requests that have forbidden characters. In this way, `content-filter` protects your applications from NoSQL (like MongoDB) injection on Node.js . 

For more informations;<br>
https://www.owasp.org/index.php/Testing_for_NoSQL_injection<br>
http://blog.websecurify.com/2014/08/hacking-nodejs-and-mongodb.html

Not depends on MongoDB
----------------------
Also you can use with purpose of filtering for anything.

Motivation
-----------
There a copule of risc when developing a project using NoSQL databases like MongoDB. The first one about URL and the other one about req.body .(sent data by an allowed user)

<b>Allowed user risc</b><br>
If a malicious user tries to hack your database it's not so hard for any body. For instance you use `/users/123` as URL to get information and show to a user whose `id` is `123`. However someone tries `/users/%7B%24ne%3Anull%7D` as URL to get user informations after logged on your system the URL means `/users/{$ne:null}` and likely your server sends the all users from your user collection.

<b>Content risc</b><br>
If you want to check query parameters when you querying the collection there is a beautiful and lightweight solution which name is [mongo-sanitize][1]. However my aim is to generate a module that wraps all codes without any special labor. So I've written this easy module.

How to work
-------------
Content-filter transforms the request URL and body data to a string then searches the forbidden characters.<br><br>


Guide
---------
<b>Install</b><br>
`npm install content-filter`

<b>Using with Express.js</b>
```
var express = require('express')
var bodyParser = require('body-parser')
var filter = require('content-filter')

var app = express()

app.use(bodyParser.json({limit: '5mb'})) 
app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }))

app.use(filter());
```
By the above default using, content-filter checks the request URL for `{` and `$` characters and functions and objects of the html body data property names for `$` character coming by `GET`, `POST`, `PUT` and `DELETE` methods. 

For example, content-filter checks "/users", _id", "name", "address", "street", "province" and "$ne" values from the below request. "/users" is examined for `{` and `$` characters and it passes. The others are examined for `$` character and return 403 status with an error message because of "$ne" expression and hereby **content-filter provide a reliable security for applications**.

```
PUT /users HTTP/1.1
Host: webaddress.com
Content-Type: application/json

{
  "_id": "b4a7dedaa8cbbf30154f14bc",
  "name": "Jack",
  "addrsss": {
		"street": "Raising Road St.",
		"province": { "$ne": "A Malicious Expression" } 
  }
}	
```

There are several options is used for to configure the module.

**typeofList**:<br> 
Use this option to set filter data structure types of Javascript. Content-filter able to check every data type (object, function, number, string, boolean and symbol) to filter. Because an application cannot make a decision whether an expression is an innocent or a malicious. But a developer can. Content-filter checks `object` and `function` types as default considering MongoDB security. 

 Setting to check only `string` data types;<br>
 `app.use(filter({typeofList:['string']}))` <br>

**urlBlackList**:<br> 
Use this option to configure URL black list elements (ASCII codes) and to stop the filtering the URL content. The module checks `%7B` for `{` and `%24` for `$` as default considering MongoDB security.<br>
<small>req.originalUrl data contains req.query object</small><br>

 Removing url filtering;<br>
 `app.use(filter({urlBlackList:[null]}))` <br>
 
 Configuring to filter only for `$ne` characters;<br>
 `app.use(filter({urlBlackList:['%24ne']}))` <br>

**urlMessage**:<br>
Use this option to change the default request blocking message to see by the user. <br>
 `app.use(filter({urlMessage: 'A forbidden character set has been found in URL: '}))` <br>

**bodyBlackList**:<br>
Use this option to configure body black list elements and to stop the filtering the body content. The module checks for `$` as default considering MongoDB security.<br>

 Removing body filtering;<br>
 `app.use(filter({bodyBlackList:[null]}))` <br>
 
 Configuring to filter only for `$ne` characters;<br>
 `app.use(filter({bodyBlackList:['$ne']}))` <br>

**checkNames**:<br>
Use this option to include property names of the objects -that will have been checked- to filter. The option is `true` as default.

Assume there is a request body object like the following which comes from a user form to delete selected goods from `shoppingCarts` collection by user _id value from our MongoDB. If `checkNames` option is set as `false` content-filter checks `"abcd"` and `10` values if *typeofList* contains 'string' and 'number' values. When `checkNames` option is `true`, content-filter checks `id`, `$ne`, `"abcd"`, `count` and `10` values under the same conditions.

```
{ 
	_id: { $ne: "abcd" },
	count: 10
}
```
```
shoppingCarts.delete({ _id: req.body._id })
```

By the way, the above method is wrong. Instaed that, Passport.js and `req.user._id` object could be used.<br> 


**bodyMessage**:<br>
Use this option to change the default request blocking message to see by the user.<br> 

**methodList**:<br>
Use this option to select method which will have been filtered and to stop the checking any method. The module checks for GET, POST, PUT and DELETE methods as default.  <br>

 Configuring to filter only for `POST`, `PUT` and `DELETE` methods;<br>
 `app.use(filter({methodList:['POST', 'PUT', 'DELETE']}))` <br>

**Giving combine options:**<br>
 ```app.use(filter({urlBlackList:['%24ne'], bodyBlackList:['$ne'], methodList:['POST', 'PUT', 'DELETE']}))```
 or 
 ```
 var filterConf = {
 	urlBlackList:['%24ne'], 
 	urlMessage: 'A forbidden character set has been found in URL: ',
 	bodyBlackList:['$ne'], 
 	bodyMessage: 'A forbidden character has been found in form data: ',
 	methodList:['POST', 'PUT', 'DELETE']
 }

 app.use(filter(filterConf))
 ```

Performance test results
--------------------------

 I've used real data for my tests. <br>
 **Test environment:** Intel 3 Ghz Dual-Core CPU and 4 GB RAM<br>
 **Action:** POST <br>
 **Options:** Default options <br>

 **Test1** <br>
 *Data:* Consists of nested objects which have 5 objects depth of the total. There were 9 elements at level-1, 11 elements at level-2, 4 elements at level-3, 2 elements at level-4 and 2 elements at level-5 too. URL data length is not important. <br> 
 *Result:* 1 ms < result < 15 ms  &nbsp;  ( 1 ms = 0.001 sec )<br><br>

 **Test2** <br>
 *Data:* Consists of nested objects which have 2 objects depth of the total. 11 elements at level-1 and 4 elements at level-2. Level-1 has two long fileds. The first one contain a picture data as base64 string and its length is 168275. Other one contains a string its length 2365.<br>
 *Options:* typeofList has been set as ["object", "function","string"]<br>
 *Result:* Total filtered string length is 170814 in 1 ms = 0.001 sec<br>

 **Decription of object levels**
 ```
{
	level1_a: 1,
	level1_b: 2,
	level1_c: {
		level2_a: "One",
		level2_b: {
			level3_a: "The level is three",
		}
	}	
}
 ```

 **Conclusion** <br>
 This is a configurable and convenient tool to filter data which doesn't have so deep nested objects.


[1]:https://github.com/vkarpov15/mongo-sanitize
