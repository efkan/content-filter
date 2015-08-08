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

There are several options is used for to configure the module. 

**urlBlackList**:<br> 
Use this option to configure URL black list elements (ASCII codes) and to stop the filtering the URL content. The module checks `%7B` for `{` and `%24` for `$` as default  considering MongoDB.<br>
<small>req.originalUrl data contains req.query object</small><br>

 To remove url filtering;<br>
 `app.use(filter({urlBlackList:[null]}))` <br>
 
  To configure to filter only for `$ne` characters;<br>
 `app.use(filter({urlBlackList:['%24ne']}))` <br>

**urlMessage**:<br>
Use this option to change the default request blocking message to see by the user.<br>

**bodyBlackList**:<br>
Use this option to configure body black list elements and to stop the filtering the body content. The module checks for `{` and `$` as default considering MongoDB.<br>

 To remove body filtering;<br>
 `app.use(filter({bodyBlackList:[null]}))` <br>
 
  To configure to filter only for `$ne` characters;<br>
 `app.use(filter({bodyBlackList:['$ne']}))` <br>

**bodyMessage**:<br>
Use this option to change the default request blocking message to see by the user.<br> 

**methodList**:<br>
Use this option to select method which will have been filtered and to stop the checking any method. The module checks for GET, POST, PUT and DELETE methods as default.  <br>

  To configure to filter only for `POST`, `PUT` and `DELETE` methods;<br>
 `app.use(filter({methodList:['POST', 'PUT', 'DELETE']}))` <br>

**Giving combine options:**<br>
 ```app.use(filter({urlBlackList:['%24ne'], bodyBlackList:['$ne'], methodList:['POST', 'PUT', 'DELETE']}))```
 or 
 ```
 var filterConf = {
 	urlBlackList:['%24ne'], 
 	urlMessage: 'A forbidden character has been found in URL: ',
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
 **Test1 data:** JSON includes; 9 elements at level-1, 11 elements at level-2, 4 elements at 
             level-3, 2 elements at level-4 and 2 elements at level-5 too. URL data length is not important. <br> 
 **Test1 result:** 5 ms = 0.005 sec<br>
 **Test2 data:** JSON includes; 11 elements at level-1 and 4 elements at level-2 Level-1 has two long
             fileds. The first one contain a picture data as base64 string and its length is 168275.
             Other one contains a string its length 2365.<br>
 **Test2 result:** 1 ms = 0.001 sec<br>



[1]:https://github.com/vkarpov15/mongo-sanitize
