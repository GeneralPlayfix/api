const express = require("express");
const router = express.Router();
const {messageSender} = require("../utils/function")
const typesController = require("../controllers/types");
// get all mangas 
router.get("/", async function(req, res){
    let result = await typesController.getTypesList(req)
    await messageSender(result, res)
});

// get mangas by id
router.get("/:id", async function(req, res){
    let result = await typesController.getTypesByID(req)
    if(result.result == "error") { 
        res.status(parseInt(result.message.status))
    }else{
        res.status(200)
    }
    res.json(result)
});

// create new type 
router.post("/", async function(req, res){
    let result = await typesController.createNewType(req)
    if(result.result == "error") { 
        res.status(parseInt(result.message.status))
    }else{
        res.status(200)
    }
    res.json(result)
});

// update type
router.put("/:id", async function(req, res){
    let result = await typesController.updateType(req)
    if(result.result == "error") { 
        res.status(parseInt(result.message.status))
    }else{
        res.status(200)
    }
    res.json(result)
});



// delete type
router.delete("/:id", async function(req, res){
    let result = await typesController.deleteType(req)
    if(result.result == "error") { 
        res.status(parseInt(result.message.status))
    }else{
        res.status(200)
    }
    res.json(result)
});

module.exports = router;
