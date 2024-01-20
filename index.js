const express = require('express');
const app = express();
const user = require('./app/route/user.route');

app.use(express.json())
app.use(express.urlencoded({
    // 处理深层嵌套对象
    extended: true 
}))
app.get('/', (request, response) => {
    response.send("hello world");
})

// router作为app中间件，将路由对应的逻辑和app进行分离
app.use('/user', user);



app.listen(8081, () => {
    console.log('server listening at 8081.');
})