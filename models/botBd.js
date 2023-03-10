const mongoose = require("mongoose");

module.exports.connect = () => {
        mongoose.connect('mongodb://127.0.0.1:27017/nntcBot', 
            {useNewUrlParser: true, useUnifiedTopology: true },
            (err) => {
                        if(err) throw new Error('Нет подключения к базе');
        });

}


