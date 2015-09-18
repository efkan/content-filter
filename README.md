# Content-filter 
<span>[![Build Status](https://travis-ci.org/efkan/content-filter.svg?branch=master)](https://travis-ci.org/efkan/content-filter)</span>

The module returns an *Express.js middleware* that is used for to examine URL and HTML body contents of the request (by using body-parser) to block requests that have forbidden characters. In this way, `content-filter` provides protection against NoSQL (like MongoDB) injection attacks on Node.js .

What are the risks;<br>
<a href='https://www.owasp.org/index.php/Testing_for_NoSQL_injection'>https://www.owasp.org/index.php/Testing_for_NoSQL_injection</a><br>
<a href='http://blog.websecurify.com/2014/08/hacking-nodejs-and-mongodb.html'>http://blog.websecurify.com/2014/08/hacking-nodejs-and-mongodb.html</a>

Not depends on MongoDB
----------------------
You can use with purpose of filtering for anything. Also you can filter only URL or body data.

Motivation
-----------
There a copule of risk when developing a project using NoSQL databases like MongoDB. The first one about URL and the other one about the content of `req.body`. (sent data by an allowed user)

<b>URL risk</b><br>
If a malicious user tries to hack your database it's not so hard for any body. Although it's not the right way, assume you use `/users/123` as URL to get information and show to a user whose `id` is `123`. However someone tries `/users/%7B%24ne%3Anull%7D` as URL to get user informations after logged on your system the URL means `/users/{$ne:null}` and likely your server sends the all users from your user collection.

<b>Content risk</b><br>
If you want to check query parameters when you querying the collection there is a beautiful and lightweight solution which name is [mongo-sanitize][1]. However I've wanted a tool to sanitize the data by wrapping all codes without any special labor. Then I wrote this easy tool.

How to work
-------------
Content-filter transforms the request URL and body data to a string then searches the forbidden characters.<br>


Guide
---------
<b>Install</b><br>
`npm install content-filter`

<b>Using with Express.js</b>
```
var express = require('express')
var bodyParser = require('body-parser')
var filter = require('content-filter')  /* STEP-1 */

var app = express()

app.use(bodyParser.json()) 
app.use(bodyParser.urlencoded({extended:true}))

app.use(filter()); /* STEP-2 and that's all */
```
By the above default using, content-filter checks the request URL for `{` and `$` characters and functions and objects of the html body data *property names* for `$` character coming by `GET`, `POST`, `PUT` and `DELETE` methods. 

For example, content-filter checks "/users", _id", "$ne", "address", "street" and "province" values from the below request. "/users" is examined for `{` and `$` characters and it passes. The others are examined for `$` character and return 403 status with an error message because of "$ne" expression and hereby **content-filter provide a reliable security for MongoDB applications**.

```
PUT /users HTTP/1.1
Host: webaddress.com
Content-Type: application/json

{
  "_id": { "$ne": "A Malicious Expression" },
  "address": {
	"street": "Raising Road St.",
	"province": "New Hampshire",
  }
}	
```

There are several options are used for to configure the module.

**typeofList**:<br> 
Use this option to set filter data structure types of Javascript. Content-filter able to check every data type (object, function, number, string, boolean and symbol) to filter. Because an application cannot make a decision whether an expression is an innocent or a malicious. But a developer can. Content-filter checks `object` and `function` types as default considering MongoDB security. 

 Setting to check only `string` data types;<br>
 `app.use(filter({typeofList:['string']}))` <br>

**urlBlackList**:<br> 
Use this option to configure URL black list elements (ASCII codes) and to stop the filtering the URL content. The module checks `%7B` for `{` and `%24` for `$` as default considering MongoDB security.<br>
Also `urlBlackList` scope contains `req.query` object.<br>

 Removing url filtering;<br>
 `app.use(filter({urlBlackList:[null]}))` <br>
 
 Configuring to filter only for `$ne` characters;<br>
 `app.use(filter({urlBlackList:['%24ne']}))` <br>

**urlMessage**:<br>
Use this option to change the default request blocking message to show to the user. <br>
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
Use this option to change the default request blocking message to show to the user.<br> 
 `app.use(filter({bodyMessage: 'A forbidden string has been found in form data: '}))` <br>

**methodList**:<br>
Use this option to select method which will have been filtered and to stop the checking any method. The module checks for GET, POST, PUT and DELETE methods as default.  <br>

 Configuring to filter only for `POST`, `PUT` and `DELETE` methods;<br>
 `app.use(filter({methodList:['POST', 'PUT', 'DELETE']}))` <br>

**combining options:**<br>
 ```app.use(filter({urlBlackList:['%24ne'], bodyBlackList:['$ne'], methodList:['POST', 'PUT', 'DELETE']}))```
 or 
 ```
 var filterOptions = {
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

 I've used [process.hrtime()][2] to calculate elapsed time for my tests. <br><br>
 **Test environment:** Intel 3 Ghz Dual-Core CPU and 4 GB RAM<br>
 **Action:** POST <br>

 **Test1** <br>
 *Data:* Consists of nested objects which have 5 objects depth of the total. There were 9 elements at level-1, 11 elements at level-2, 4 elements at level-3, 2 elements at level-4 and 2 elements at level-5 too. URL data length is not important. <br> 
 *Options:* Content-filter default options were used.<br>
 *Result:* Completed at 0.486934th ms = 0.0000486934th sec ( 1 ms = 0.001 sec )<br>

 **Test2** <br>
 *Data:* Consists of nested objects which have 2 objects depth of the total. 11 elements at level-1 and 4 elements at level-2. Level-1 has two long fileds. The first one contain a picture data as base64 string and its length is 168,275. Other one contains a string its length 2,389.<br>
 *Options:* `typeofList` has been set as `["object", "function","string"]`<br>
```
{
	typeofList: ["object", "function","string"]
}
```
 *Result:* Completed at 0.386673rd ms = 0.0000386673rd sec<br>

 **Test3** <br>
 *Data:* The same with Test2 data.<br>
 *Options:* `typeofList` has been set as `["object", "function","string"]` and `bodyBlackList` has been set as `["+8+L"]`<br>
```
{
	typeofList: ["object", "function","string"],
	bodyBlackList: ["+8+L"]
}
```
 *Result:* Content-filter found the forbidden string which is at 83,225th column at 0.629969th ms = 0.0000629969th sec after the process started. <br>

 **Conclusion** <br>
 This is a configurable and reliable tool to filter data.

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

**Credit:** [http://blog.tompawlak.org/measure-execution-time-nodejs-javascript][3]

[1]:https://github.com/vkarpov15/mongo-sanitize
[2]:https://nodejs.org/api/process.html#process_process_hrtime
[3]:http://blog.tompawlak.org/measure-execution-time-nodejs-javascript


