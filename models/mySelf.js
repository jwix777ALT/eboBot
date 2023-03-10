const mongoose = require('mongoose');
const modelUser = require('../models/users');

const mySelfSchema = mongoose.Schema({
    userId: {type: Number, min: 1},
    affairs: {type: Array}
}, {collection: 'mySelf'});

const Affair = mongoose.model('mySelf', mySelfSchema);

/**
 * Создает новый документ в коллекции или редактирует существующий
 * @param userId
 * @param data Новое дело
 * @returns {Promise<void>}
 */
module.exports.addAffair = async (userId, data) => {
    let userAffairs = await Affair.findOne({userId: userId}).exec();
    if(!userAffairs){
        userAffairs = new Affair(
            {
                userId: userId,
            }
        );
    }
    userAffairs.affairs.push({
        affair: data,
        date: dateDecorator(Date.now()),
        isDone: false
    });
    try {
        await userAffairs.save();
    } catch (err) {
        throw new Error('Ошибка при сохранении в базу данных');
    }
}

/**
 * Очищает список дел в базе
 * @param userId
 * @returns {Promise<void>}
 */
module.exports.clearAffair = async (userId) => {
    const userAffairs = await Affair.findOne({userId: userId}).exec();
    if(!userAffairs){
        throw new Error('Не могу найти записи в базе данных');
    }
    userAffairs.affairs.splice(0, userAffairs.affairs.length);
    try {
        await userAffairs.save();
    } catch (err) {
        throw new Error('Ошибка при сохранении в базу данных');
    }
}

/**
 * Получает данные из базы
 * @param userId
 * @returns {Promise<unknown>}
 */
module.exports.get = (userId) => {
    return new Promise(async (resolve) => {
       const response = await Affair.findOne({userId: userId});
       resolve(response);
    });
}

module.exports.getTaskByName = async (userId, taskName) => {
    const mySelf = await Affair.findOne({userId});
    const tasks = mySelf.affairs;
    const task = tasks.find(task => task.affair === taskName);
    return task;
}

module.exports.changeState = async (userId, taskId) => {
    let userAffairs = await Affair.findOne({userId: userId}).exec();
    if(!userAffairs){
        throw new Error("Ошибка: Нет такой задачи: " + taskId);
    } else {
        let affair = userAffairs.affairs.find(el => el.affair === taskId);
        affair.isDone = ! affair.isDone;
        await Affair.updateOne({_id: userAffairs._id},
                               {$set: {affairs: userAffairs.affairs}},
                               {});
    }
};

/**
 * Требуется чтобы один раз заполнить базу данными из файлов
 * @param userId
 * @param data
 * @returns {Promise<void>}
 */
module.exports.refactor = async (userId, data) => {
    const userAffairs = new Affair(
        {
            userId: userId,
            affairs: data,
        }
    );

    try {
        await modelUser.refactor(userId);
        await userAffairs.save();
    } catch (err) {
        throw new Error('Ошибка при сохранении в базу данных');
    }
}

/**
 * Декорирует таймштамп в красивую дату
 * @param timeStamp
 * @returns {string}
 */
function dateDecorator(timeStamp){
    const date = new Date(timeStamp);
    const months = ["Января", "Февраля", "Марта", "Апреля", "Мая",
        "Июня", "Июля", "Августа", "Сентября", "Октября", "Ноября", "Декабря"];
    return date.getDate() + ' ' + months[date.getMonth()];
}
