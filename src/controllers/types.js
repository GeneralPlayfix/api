const { Types, createPool } = require("mysql");
const { off } = require("../../config/db.config");
let typesModel = require("../models/types");

const { checkInt, parametersVerification, errorGenerator, successMessageGenerator, fieldParserVerificator } = require("../utils/function");


// get all "types" 
async function getTypesList (req) {
    let params = req.query
    let paramsQuantity = Object.keys(params).length
    if(paramsQuantity > 0){
        let isOk = await parametersVerification("types_list", params)
        if(isOk !== false) return isOk
    }
    try{
        let result = await typesModel.getAllTypes(params)
        let successMessage = await successMessageGenerator(result, "Entity")
        return successMessage;  
    }catch(err){
        console.log(err)
        let error = await errorGenerator("500", "Internal error" , "Error while fetching types data");
        return error;
    }
}
// get mangas by ID

async function getTypesByID (req) {
    //check int value
    let isInt = await checkInt(req.params.id, "id"); 
    if(isInt !== false) return isInt
    try{
        //get sql result
        let result = await typesModel.getTypeById(req.params.id)
        //if only needs to print the result  
        let successMessage = await successMessageGenerator(result[0], "Entity")
        return successMessage;
    }catch(err){
            console.log(err)
            let error = await errorGenerator("500", "Internal error" , "Error while fetching type data");
            return error;                        
    }
}



async function createNewType (req) {
    //check int value
    let error = await errorGenerator("400", "Creation error" , "Error while creating new type");
    try{
        // i similulate a param json organization in express
        let params = {query:{name:req.body.name,limit:1}}
        // I check if the name already exist
        let isNameExist = await getTypesList(params)
        if(isNameExist.result === "error") return error;
        if(isNameExist.data.length > 0) {
            let error = errorGenerator("400", "Check Error",`The '${req.body.name}' type you are trying to create already exists.`)
            return error
        }
        let isAllValid = await fieldParserVerificator(req.body, "types")
        if(isAllValid.result == "error") return isAllValid;
        let result = await typesModel.createType(isAllValid.typeRequestData)
        let successMessage = await successMessageGenerator("New type succesfully added, an administrator will check its validity before confirming its creation.", "Entity")
        return successMessage;
    }catch(err){
            console.log(err)
            return error;                        
    }
}
 // update type

async function updateType (req) {
    let error = await errorGenerator("400", "Update error" , "Error while creating new type");
    try{
        //check if the param id is an int
        let isInt = await checkInt(req.params.id, "id"); 
        if(isInt !== false) return isInt
        //check if there is a type with this id
        let resMessage = await getTypesByID(req, false)
        if(resMessage.result === "error") return resMessage;
        if(resMessage.data == undefined) {
            let error = await errorGenerator("400", "Update error" , `There is no type with the id ${req.params.id}`)
            return error
        }
        //i check if the all the needed params are here and if there are all correct 
        let isAllValid = await fieldParserVerificator(req.body, "types")
        if(isAllValid.result == "error") return isAllValid;

         // i similulate a param json organization in express
         let params = {query:{name:req.body.name,limit:1}}
         // I check if the name already exist
         let isNameExist = await getTypesList(params)
         if(isNameExist.result === "error") return error;

         //TODO : check if all items is the same, if it is, just don't maj the item
        //  let ok = await checkIfItsAllSame(isNameExist, isAllValid); 
         if(isNameExist.data.length > 0  && isNameExist.data.id != req.params.id) {
             let error = errorGenerator("400", "Check Error",`The '${req.body.name}' type you are trying to update already exists.`)
             return error
         }
        let result = await typesModel.updateType(req.params.id,isAllValid.typeRequestData)
        console.log(result);
    }catch(err){
        console.log(err);
        return error;
    }
}

// delete type
async function deleteType (req) {
    let isInt = await checkInt(req.params.id, "id"); 
    if(isInt !== false) return isInt
    let resMessage = await getTypesByID(req, false)
    if(resMessage.result == "error") return resMessage;
    try{
        //get sql result
        let deleteResult = await typesModel.deleteType(req.params.id)
        //if only needs to print the result  
        let successMessage = await successMessageGenerator(deleteResult, "Entity")
        return successMessage;
    }catch(err){
            let error = await errorGenerator("500", "Internal error" , "Error while deleting a type.");
            return error;                        
    }
}

module.exports = {getTypesByID, deleteType, createNewType, getTypesList, updateType}
