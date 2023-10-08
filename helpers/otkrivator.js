const axios = require('axios');
var cooldown_list = []

module.exports.openItPark = (user_id) => {
    return new Promise(resolve=>{
        if(cooldown_list.includes(user_id)) resolve("Пожалуйста подождите")
        else{
        cooldown_list.push(user_id)
        setTimeout((user_id) => {
            cooldown_list.shift()
        }, 3000)
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
}
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
