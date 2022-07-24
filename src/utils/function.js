const authorizedParameters = require("../json/authorizedParameter.json")
const authorizedObjectParams = require("../json/authorizedObjectParams.json");
const models = require("../json/sqlModels.json");
const { param, all } = require("../routes/types");
const { createPool } = require("mysql");
const { off } = require("../../config/db.config");

async function checkInt(id, type){
    if(isNaN(id)){
        let errorMessage = await errorGenerator("400", "Validation exception", `Invalid params type for the ${type} field, int expected`)
        return errorMessage;
    }
    return false;
}

//#region message generator

async function errorGenerator(status, title, details){
    return {
        result:"error",
        message:{
            status:status,
            title:title,
            details:details
        }
    }
}
async function successMessageGenerator(data, response){
    return {
        result:"ok",
        response:response,
        data:data
    }
}
//#endregion


async function transformObjectToArray(obj){
    return Object.keys(obj)
    .map(function(key) {
        return obj[key];
    });
}

async function getProprietyOfMultiDimensionnalArray(array){
    return arr1d = [].concat(...array);
}

//#region Automatic parameters verification 

async function parametersVerification(paramsFamily, params){
    //get the family authorized parameter (ex : mangas_list)
    let authorizedParams = authorizedParameters[paramsFamily]
    let objectAuthorizedParams = authorizedObjectParams[paramsFamily]
    let authorizedParameterArray = await getAuthorizedParameterArray(authorizedParams)
    // check 
    let verificationNeeded = []
    //check if all params exist
    for(let param in params){
    //if doesn't, return a error message
        if(!authorizedParameterArray.includes(param)) {
            let error = await errorGenerator("400", "Invalid param", `The param '${param}' doesn't exist for this route`)
            return error
        }
        // params exist, push to array for value type verification
        verificationNeeded.push(await paramsTypeNeeded(authorizedParams, param, params))
    }

    //je vérifie que tous les paramètres sont valides
    for(let paramToVerif of verificationNeeded){

        if(paramToVerif.type === "int"){
            let isInt = await checkInt(paramToVerif.value, paramToVerif.param)
            if(isInt !== false) return isInt
        }
        // check if parameters are really string 
        if(paramToVerif.type === "string"){
            if(paramToVerif.value.constructor === Array || paramToVerif.value == ''){
                let err = await errorGenerator("400", "Invalid param value", `The param '${paramToVerif.param}' need one value but here, there are ${Object.keys(paramToVerif.value).length}`);
                return err;
            }
        }
        // is an object
        if(paramToVerif.type === "object"){
            // authorized value for this object parameter 
            let authorizedValue = objectAuthorizedParams[paramToVerif.param]
            //only accept one parameter
            if(paramToVerif.value.constructor !== Object || Object.keys(paramToVerif.value).length !== 1){
                let err = await errorGenerator("400","Invalid param value", `The 'order' parameter accepts only one value, but there are '${Object.keys(paramToVerif.value).length}' values.`)
                return err
            }
            let key = Object.keys(paramToVerif.value)[0];
            //if the url object key is not in the authorized key 
            if(!authorizedValue.includes(key)) {
                let err = await errorGenerator("400", "Invalid params value", `The key '${key}' is not allowed for this object (${paramToVerif.param}), the only allowed values are : ${authorizedValue.toString()} `)
                return err
            }
            if(paramToVerif.value[key] != "desc" && paramToVerif.value[key] != "asc"){
                let err = await errorGenerator("400", "Invalid params value", `The value '${paramToVerif.value[key]}' is not allowed for the key '${key}' of the object (${paramToVerif.param}), the only allowed values are : 'asc, desc' `)
                return err
            }

        }
        if(paramToVerif.type === "array"){
            //je vérifie que c'est un tableau et qu'il y a des éléments dedans 
            if(paramToVerif.value.constructor !== Array || paramToVerif.value.length <= 0){

                let err = await errorGenerator("400","Invalid param value", `The value of the param '${paramToVerif.param}' is invalid, array expected`)
                return err
            }
        }
    }
    return false
    // console.log(authorizedParams)
}

async function paramsTypeNeeded(authorizedParams, param, params){
    for(let paramType in authorizedParams){
        if(authorizedParams[paramType].includes(param)){
            return {
                type:paramType,
                param:param,
                value:params[param]
            }
        }
    }
}

async function getAuthorizedParameterArray(authorizedParams){
    let multiDimentionalArrayOfParameters = await transformObjectToArray(authorizedParams)
    return await getProprietyOfMultiDimensionnalArray(multiDimentionalArrayOfParameters)
}
//#endregion

//complete with new parameters form
async function sqlRequestGenerator(params, request, route) {
    //all params that will be associed at the request

    let paramDetails = []
    let limit = 150
    let order = "ORDER BY id desc";
    let authorizedParamsForRoute = authorizedParameters[route]
    for(let param in params){
        paramDetails.push(await paramsTypeNeeded(authorizedParamsForRoute,param, params))
    } 
    let sqlParams = []; 
    for(let param of paramDetails){
        switch(param.param){
            case "limit":
                limit = param.value
                break
            case "name":
                let where = ""
                // get each words
                let name = param.value.split(" ")
                // check if a where already exist on the request
                if(!request.includes("WHERE")) where+=" WHERE";
                if( where === "" ) request += " AND " 
                // prepare the request 
                request += `${where} UPPER(name) LIKE (?)` 
                //put "%" before, after and enter each words to prepare the request 
                name = `%${name.join("%")}%`
                // push the param in the array of params for the future request 
                sqlParams.push(name)  
                break;
            case "order":
                order = `ORDER BY ${Object.keys(param.value)} ${param.value[Object.keys(param.value)]}`
                break
        }
    }
    request += ` ${order} LIMIT ${limit}`;
    return {
        request:request,
        sqlParams:sqlParams
    }
}


async function messageSender(result, res){
    if(result.result == "error") { 
        res.status(parseInt(result.message.status))
    }else{
        res.status(200)
    }
    res.json(result)
}

//TODO : complete with possible missing elements
async function fieldParserVerificator(parametersToVerif, route){
    let paramToVerif = parametersToVerif
    let model = models[route]
    let paramArray = Object.keys(paramToVerif)
    let paramsAuthorized = Object.keys(model)
    let allParams = {}
    // I cycle through all the allowed values for this mode
    for (let param of paramArray){
        if(!paramsAuthorized.includes(param)){
            let err = await errorGenerator("400", "Invalid param", `The param '${param}' does not exist in the type table !`)
            return err
        }
    }
    for(each in model){
        let modelInfos = model[each];
        //if the value is required, i check if she is in the value passed by the user
        if(modelInfos.required === true){
            if(!(paramArray.includes(each))){
                let err = await errorGenerator("400", "Invalid param", `The needed param '${each}' is missing`)
                return err
            }
        }else{
            if(!paramArray.includes(each)) continue;
        }
        //if length is good
        switch(modelInfos.type){
            case "String":
                let isOkString = await checkSize(paramToVerif, each, modelInfos)
                if (isOkString !== 'ok') return isOkString
                break;
            case "Int":
                let isInt = await checkInt(paramToVerif[each], each)
                if(isInt !== false) return isInt; 
                console.log("Int")
                break;
            case "Bool":
                let isOkBool = await checkSize(paramToVerif, each, modelInfos)
                if (isOkBool !== 'ok') return isOkBool;
                if(paramToVerif[each] != 1 && paramToVerif[each] != 0) {
                    let err = await errorGenerator("400", "Invalid param", `The only values allowed for the parameter '${each}' is 0 and 1`)
                    return err  
                } 
                break;
        }
        allParams[each] = paramToVerif[each];
    }
    return{
        result:"ok",
        typeRequestData:allParams
    }
}

async function checkSize(paramToVerif, each, modelInfos){
    if(!(paramToVerif[each].length >= modelInfos.minlength && paramToVerif[each].length <= modelInfos.maxlength)){
        let err = await errorGenerator("400", "Invalid param", `The parameter '${each}' does not match the size criteria. (min : ${modelInfos.minlength}, max : ${modelInfos.maxlength})`)
        return err            
    }else{
        return "ok"
    }
}



module.exports = { checkInt, errorGenerator, transformObjectToArray, getProprietyOfMultiDimensionnalArray, parametersVerification, successMessageGenerator, sqlRequestGenerator, messageSender, fieldParserVerificator }
