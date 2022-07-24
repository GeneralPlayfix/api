let pool = require('../../config/db.config');
const { sqlRequestGenerator, checkInt } = require("../utils/function");
const authorizedParameters = require("../json/authorizedParameter.json");

//modele
let types = function (type) {
    this.name = type.name
    this.isvalid = type.isvalid
}

//get all types
getAllTypes = async (params) => {
    let request = "Select id, name FROM type";
    let route = "types_list";
    if(Object.keys(params).length == 0){
        return new Promise((resolve, reject) => {
            pool.query(request, (error, elements) => {
                if (error) {
                    return reject(error);
                }
                return resolve(elements);
            });
        });
    }else{
        let requestArray = await sqlRequestGenerator(params, request,route);
        return new Promise((resolve, reject) => {
            pool.query(requestArray.request,requestArray.sqlParams,(error, elements) => {
                if (error) {
                    return reject(error);
                }
                return resolve(elements);
            });
        });
    }
   
};

// get "type" by ID from DB 
getTypeById = (id) => {
    return new Promise((resolve, reject) => {
        pool.query('SELECT id, name FROM type WHERE id=?', id, (error, elements) => {
            if (error) {
                return reject(error);
            }
            return resolve(elements);
        });
    });
};



//create new type
createType = (typeRequestData) => {
    return new Promise((resolve, reject) => {
        pool.query('INSERT INTO type SET ?', typeRequestData, (error, elements) => {
            if (error) {
                console.log(error)
                return reject("Error while creating a new type.");
            }
            return resolve(elements);
        });
    });
};

// update type 
updateType = (id, typeRequestData) => {
    return new Promise((resolve, reject) => {
        pool.query('UPDATE type SET ? WHERE id=?', [typeRequestData, id], (error, elements) => {
            if (error) {
                return reject("Error while updating a type.");
            }
            return resolve("The 'type' has been successfully updated.");
        });
    });
};


// types.updateType = (id, typeRequestData, result)=> {
//     dbConn.query('UPDATE type SET ? WHERE id=?', [typeRequestData, id], (err, res)=>{
//         if(err){
//             requestResult = {error:"Error while fetching type"}
//             result(requestResult);
//         }else{
//             requestResult = {ok:res}
//             result(requestResult);
//         }
//     });
// }



// delete "type" by ID 
deleteType = (id) => {
    return new Promise((resolve, reject) => {
        pool.query('DELETE FROM type WHERE id=?', id, (error, elements) => {
            if (error) {

                return reject("Error while deleting a type.");
            }
            return resolve("The 'type' has been successfully removed.");
        });
    });
};


module.exports = {getTypeById, deleteType, createType, getAllTypes, updateType, types}