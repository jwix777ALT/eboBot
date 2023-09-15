const axios = require('axios');

module.exports.openItPark = () => {
    return new Promise(resolve=>{
        var timeout = setTimeout(() => {
        axios.get(`http://${process.env.esp_ip}/gpio/2`)
            .then((response) => {
                resolve('Успешно!');
            }).catch(err=>{
                resolve('Ошибка');
            });
        }, 0).unref()
        setTimeout(() => {
            clearTimeout(timeout)
            resolve("Не могу достучаться до открывашки")
        }, 3000)
    });
};

module.exports.openMasterskie = () => {
    return new Promise(resolve=>{
        axios.get('http://192.168.7.101/gpio/2')
            .then((response) => {
                resolve('Успешно!');
            }).catch(err=>{
            resolve('Ошибка');
        });
    });
};
