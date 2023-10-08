const {Database} = require("sqlite3").verbose()
const db = new Database('./test.sqlite3');


module.exports.connect = () => {
    db.serialize(() => {
        console.log("Database ready!")
    })
}

module.exports.getAllUsers = () => {
    return new Promise(resolve => {
        db.all(`SELECT * FROM "users"`, function(err, row){
            console.log(row)
            resolve(row)
        })
    })
}
module.exports.changeUserCharacteristics = (userId, newProperty) => {
    var q = ""
    q += `UPDATE "users" `
    q += `SET "opener" = ${newProperty.opener} `
    q += `, "role" = "${newProperty.role}" `
    q += `, "notes" = "${newProperty.notes}" `
    q += `WHERE user_id == "${userId}"`
    db.run(q, function(err){
        if(err) console.log(err)
    })
}

module.exports.close = () => {
    db.close();
}

module.exports.getRole = (user_id) => {
    db.get(`SELECT role FROM "users" WHERE user_id == "${user_id}"`, function(err, row){
        return row.role
    })
}

module.exports.createUser = (user_id, role, opener, first_name, last_name) => {
    db.run(`INSERT INTO "users" ("id", "user_id", "role", "opener", "firstname", "lastname") VALUES (?, "${user_id}", "${role}", ${opener}, "${first_name}", "${last_name}");`, function(err){
        if(err) console.log(err)
    })
}

module.exports.IsOpener = (user_id) => {
    db.get(`SELECT opener FROM "users" WHERE user_id == "${user_id}"`, function(err, row){
        return row.opener == 1
    })
}

module.exports.getUserFromDB = (user_id) => {
    return new Promise((resolve) => {
        db.get(`SELECT * FROM "users" WHERE user_id == "${user_id}"`, function(err, row){
            if(err) console.log(err)
            resolve(row)
        })
    })
}