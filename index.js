const express = require('express');
const bodyParser = require('body-parser');
require("dotenv/config")


// create express app 
const app = express();

// parse request data content type application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// parse request data content type application/json
app.use(bodyParser.json()) 

// setup the server port 
const port = process.env.PORT || 5000;

// define root routes
app.get("/", (req, res)=>{
    res.send("Hello world")
})


// import types routes 
const typesRoutes = require("./src/routes/types");

// create types routes 
app.use('/types', typesRoutes)


// unknow route
app.use(function(req, res, next){
    //res status to "not found"
    res.status(404);

    //get full url actual url 
    var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    // json response  
    res.json({
    result:"error", 
    message:{   
        status:"404",
        title:"Not found",
        details:`No route found for ${fullUrl}`}})
});

// listen to the port  
app.listen(port, ()=>{
    console.log(`Le serveur express tourne sur le port ${port}`)
})