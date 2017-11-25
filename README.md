# Content-filter
<span>[![Build Status](https://travis-ci.org/efkan/content-filter.svg?branch=master)](https://travis-ci.org/efkan/content-filter)</span>

Filters coming HTML request content for any character, character set, a word (_slang_, _swearword_ or whatever) or a sentence and returns an *Express.js middleware*. The middleware examines URL and HTML body contents of the request (by using body-parser) and blocks the request and returns a message if there is a forbidden character. In this way, provides protection against NoSQL (like MongoDB) injection attacks for Node.js applications.

What about NoSQL? What are the risks?<br>
<a href='https://www.owasp.org/index.php/Testing_for_NoSQL_injection'>https://www.owasp.org/index.php/Testing_for_NoSQL_injection</a><br>
<a href='http://blog.websecurify.com/2014/08/hacking-nodejs-and-mongodb.html'>http://blog.websecurify.com/2014/08/hacking-nodejs-and-mongodb.html</a>
<br>
<a href='http://blog.websecurify.com/2014/08/attacks-nodejs-and-mongodb-part-to.html'>http://blog.websecurify.com/2014/08/attacks-nodejs-and-mongodb-part-to.html</a>

Filtering for anything
-----------------------
`content-filter` does not depend on NoSQL. You can use with purpose of filtering for anything. Also you can filter only URL or body data. See the [sample project](#sample-project) in use, [guide](#guide), [examples](#examples) and [performance tests results](#performance-test-results).

Motivation
-----------
There a copule of risk when developing a project using NoSQL databases like MongoDB. The first one about URL and the other one about the content of `req.body`. (sent data by an allowed user)

<b>URL risk</b><br>
If a malicious user tries to hack your database it's not so hard for anybody. Although it's not the right way, assume you use `/users/123` as URL to get information and show to a user whose `id` is `123`. However someone tries `/users/%7B%24ne%3Anull%7D` as URL to get user informations after logged on your system the URL means `/users/{$ne:null}` and likely your server sends the all users from your user collection.

<b>Content risk</b><br>
Malicous users might embed unwanted expression into the `req.body` object as the URL risk.
If you want to check query parameters when you querying the collection there is another beautiful and lightweight solution which is named as [mongo-sanitize][1].
<br><br>
However I've wanted a middleware tool to filter the data at the beginning of my Node.js app. Without any special labor at every MongoDB operation. Therefore I wrote this easy tool.

Sample Project
---------------
[content-filter-example](https://github.com/efkan/content-filter-example)

Guide
---------
<b>Install</b><br>
`npm install content-filter --save`

<b>Note:</b> The package doesn't contain `body-parser` library. So, the library should be added the project to use `content-filter`.<br>
`npm install body-parser --save`

<b>Using with Express.js</b>

Just add the following two lines to your code;
```
var filter = require('content-filter')
app.use(filter());
```

A sample usage in the code;
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

For example, content-filter checks "/users", "_id", "$ne", "address", "street" and "province" values from the below request. "/users" is examined for `{` and `$` characters and it passes. The others are examined for `$` character and return 403 status with an error message because of "$ne" expression and hereby **content-filter provide a reliable security for MongoDB applications against the injection attacks**.

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

**methodList**:<br>
Use this option to select method which will have been filtered and to stop the checking any method. The module checks for GET, POST, PUT and DELETE methods as default.  <br>

 Configuring the filter only for `POST`, `PUT` and `DELETE` methods;<br>
 `app.use(filter({methodList:['POST', 'PUT', 'DELETE']}))` <br>

**typeList**:<br>
Use this option to set filter data structure types of Javascript. Content-filter able to check every data type (object, function, number, string, boolean and symbol) to filter. Because an application cannot make a decision whether an expression is an innocent or a malicious. But a developer can. Content-filter checks `object` and `function` types as default considering MongoDB security.

 Setting to check only `string` data types;<br>
 `app.use(filter({typeList:['string']}))` <br><br>
_Note: To filter form data object for a string 'object' parameter must be found in typeList array_ <br>
 `app.use(filter({typeList:['object','string']}))`<br>

**urlBlackList**:<br>
Use this option to configure URL black list elements and to stop the filtering the URL content. The module checks `{` and `$` as default considering MongoDB security. Also `urlBlackList` scope contains `req.query` object. At the same time GET method requests are evaluated by using urlBlackList.<br>

_Note: Ascii code must be used for non-english and specific characters like space. (**`%20`** must be used instead of **space** - [more information](http://www.w3schools.com/tags/ref_urlencode.asp))<br>_

 Removing url filtering;<br>
 `app.use(filter({urlBlackList:[null]}))` <br>

 Configuring the filter for several words;<br>
 `app.use(filter({urlBlackList:['word1', 'word2']}))` <br>

**urlMessage**:<br>
Use this option to change the default request blocking message to show to the user. <br>
 `app.use(filter({urlMessage: 'A forbidden expression has been found in URL: '}))` <br>

**bodyBlackList**:<br>
Use this option to configure body black list elements and to stop the filtering the body content. The module checks for `$` as default considering MongoDB security.<br>

 Removing body filtering;<br>
 `app.use(filter({bodyBlackList:[null]}))` <br>

 Configuring the filter for only `test` characters;<br>
 `app.use(filter({bodyBlackList:['test']}))` <br>

**bodyMessage**:<br>
Use this option to change the default request blocking message to show to the user.<br>
 `app.use(filter({bodyMessage: 'A forbidden expression has been found in form data: '}))` <br>

**appendFound**:<br>
Use this option to append found forbidden characters to the end of error message. Error message can be default or overridden urlMessage and bodyMessage.<br>
`app.use(filter({appendFound: true}))` <br>

**caseSensitive**:<br>
Use this option to stop the case-sensitive when filtering. The option is `true` as default. <br>
Keep in mind that `bodyBlackList:['MALICIOUS']` is not equal to `bodyBlackList:['Malicious']`. To catch both of them use `caseSensitive` like the following: <br>
`app.use(filter({bodyBlackList:['malicious'], caseSensitive:false}))`

_Note: if `content-filter` is used for to secure NoSQL DB by only checking special characters like `$` and `{` don't set this parameter false because of thought of performance. Actually it takes trivial too very small time._

**checkNames**:<br>
Use this option to include property names of the objects -that will have been checked- to filter. The option is `true` as default.

Assume there is a request body object like the following which comes from a user form to delete selected goods from `shoppingCarts` collection by user `_id` value from our MongoDB. If `checkNames` option is set as `false` content-filter checks `"abcd"` and `10` values if *typeList* contains 'string' and 'number' values. When `checkNames` option is `true`, content-filter checks `id`, `$ne`, `"abcd"`, `count` and `10` values under the same conditions.

```
{
	_id: { $ne: "abcd" },
	count: 10
}
```
```
shoppingCarts.delete({ _id: req.body._id })
```

By the way, the above method is not a best-practice. Instaed that, Passport.js and `req.user._id` object could be used.<br>

**dispatchToErrorHandler**:<br>
Use this option to dispatch the error to your error handler middleware when `content-filter` catches forbidden characters. <br>

 Configuring the filter to dispatch errors to the error handler;<br>
 `app.use(filter({dispatchToErrorHandler: true}))` <br>

By this option `content-filter` gives an error object to the `next(error)` method like the following object to handle in error handler. <br>
  `{ status: 403, code: "FORBIDDEN_CONTENT", message: Message }`


**combining options:**<br>
 `app.use(filter({urlBlackList:['&&'], bodyBlackList:['$ne'], methodList:['POST', 'PUT', 'DELETE'], dispatchToErrorHandler: true}))` <br>
 or<br>
 ```
 var filterOptions = {
 	urlBlackList:['&&'],
 	urlMessage: 'A forbidden expression has been found in URL: ',
 	bodyBlackList:['$ne'],
 	bodyMessage: 'A forbidden expression has been found in form data: ',
 	methodList:['POST', 'PUT', 'DELETE'],
  dispatchToErrorHandler: true,
 }

 app.use(filter(filterConf))
 ```

Examples
-------------------------

### Protecting a MongoDB from injection
Configuring the filter for `$`, `{`, `&&` and `||` characters;<br>
```
var blackList = ['$','{','&&','||']
var options = {
	urlBlackList: blackList,
	bodyBlackList: blackList
}

app.use(filter(options))
```

_Note: Today to secure NoSQL databases, [several important characters](https://github.com/cr0hn/nosqlinjection_wordlists/blob/master/mongodb_nosqli.txt) (`$`,`{`,`&&` and `||`) should be filtered. They can be changed over time._


### Filtering the form data object for a string
Filtering the form data object for a string slang word 'sh*t' :)

_Note: Most of the time blocking the word on the client side may be more accurate solution when considering the server performance.
However if the message comes from an API `content-filter` might be solved this issue_

Configuring the `content-filter`:<br>
(Actually default values of typeList, bodyMessage and methodList are already proper and not needed to set them)
```
var options = {
	typeList:['object','string'],
	bodyBlackList:['sh*t'],
	bodyMessage: 'A forbidden expression has been found in form data: ',
	methodList:['POST', 'PUT', 'DELETE']
}

app.use(filter(options))
```

Assume that the request below comes to the server:
```
POST /users HTTP/1.1
Host: webaddress.com
Content-Type: application/json

{
  "address": {
	"street": "The Sh*t Road St."
  }
}
```

HTML status of the server response would be `403` (forbidden). And the response test like the following:
`A forbidden expression has been found in form data: sh*t`

### Filtering URL data for a string
Althought it's not sensible I'll filter URL data for 'admin_id' word for the sake of example.

Configuring the `content-filter`:
`app.use(filter({urlBlackList:['admin_id']}))`

Assume that the request below comes to the server(full URL `http://webaddress.com/?query=admin_id`):
```
GET /?query=admin_id HTTP/1.1
Host: webaddresss.com
```

HTML status of the server response would be `403` (forbidden). And the response test like the following:
`A forbidden expression has been found in URL: admin_id`


Performance test results
--------------------------

 [process.hrtime()][2] has been used for to calculate elapsed time for the tests. <br><br>
 **Test environment:** Intel 3 Ghz Dual-Core CPU and 4 GB RAM<br>
 **Action:** POST <br>

 **Test1** <br>
 *Data:* Consists of nested objects which have 5 objects depth of the total. There were 9 elements at level-1, 11 elements at level-2, 4 elements at level-3, 2 elements at level-4 and 2 elements at level-5 too. URL data length is not important. <br>
 *Options:* Content-filter default options were used.<br>
 *Result:* Completed at 0.486934th ms = 0.0000486934th sec ( 1 ms = 0.001 sec )<br>

 **Test2** <br>
 *Data:* Consists of nested objects which have 2 objects depth of the total. 11 elements at level-1 and 4 elements at level-2. Level-1 has two long fileds. The first one contain a picture data as base64 string and its length is 168,275. Other one contains a string its length 2,389.<br>
 *Options:* `typeList` has been set as `["object", "function","string"]`<br>
```
{
	typeList: ["object", "function","string"]
}
```
 *Result:* Completed at 0.386673rd ms = 0.0000386673rd sec<br>

 **Test3** <br>
 *Data:* The same with Test2 data.<br>
 *Options:* `typeList` has been set as `["object", "function","string"]` and `bodyBlackList` has been set as `["+8+L"]`<br>
```
{
	typeList: ["object", "function","string"],
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
