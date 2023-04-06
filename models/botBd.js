const mongoose = require("mongoose");

module.exports.connect = () => {
        mongoose.connect(`mongodb://${process.env.db_ip}:27017/nntcBot`,
            {useNewUrlParser: true, useUnifiedTopology: true });

}


