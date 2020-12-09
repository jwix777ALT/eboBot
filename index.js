const {Telegraf} = require('telegraf');
const {Markup} = require('telegraf');


//const HttpsProxyAgent = require('https-proxy-agent');

const cfg = require('./resources/config');
const strings = require('./resources/strings');
const otkrivator = require('./helpers/otkrivator');
const jitsi = require('./helpers/jitsi');
const bells = require('./helpers/bells');
const myself = require('./helpers/myself');
const easterEggs = require('./helpers/easterEggs');
const kursGen = require('./helpers/wizard-kurs-report-generator');


/*const bot = new Telegraf(cfg.TG_TOKEN, {
    telegram: {
        agent: new HttpsProxyAgent('http://svg:svgpassw0rd@vslugin.ru:3128')
    }
});*/

const bot = new Telegraf(cfg.TG_TOKEN);
const addCase = {};
/*
* addCase - буфер, помогающий определить цель следующего сообщения- обработать как текст или записать в список дел
* Считаем, что пользователь может передумать вводить новое дело и забьет другую команду, в таком случае
* middlewares пометит свойство объекта == id пользователя на удаление и удалит при следующем вводе.
* Защита от сучайного срабатывания
* */

let userId;
let userName;

// ######## Middleware ###########
bot.use(async (ctx, next) => { //установка значений id и имени пользователя
    userId = ctx.from.id.toString();
    userName = ctx.from.first_name;
    await next();
});

bot.use(async (ctx, next) => {  //отсекаю невалидных пользователей
    strings.textConstants.ACCESS_DENIED_MESSAGE = userName + ', Вам доступ запрещён. Сообщите ваш ID для добавления полномочий: ' + userId;

    if (cfg.VALID_USERS.indexOf(userId) === -1) {
        await ctx.reply(strings.textConstants.ACCESS_DENIED_MESSAGE);
    }
    else {
        await next();
    }
});

bot.use(async (ctx, next) => { //скорость выполнения запросов
    const start = new Date();
    await next();
    const ms  = new Date() - start;
 //  ctx.reply(`Запрос выполнен за ${ms} мс`);
});

bot.use(async (ctx, next) => {  //Защита от случайного срабатываия записи дел
    const userId = ctx.from.id.toString();
    if(userId in addCase){
        if(addCase[userId] === true){
           delete addCase[userId];
        }
        else{
            addCase[userId] = true;
        }
    }
    await next();
});

//bot.use(Telegraf.log());

// ######## Middleware ###########

/*async function test(){
    let awaitPromise = new Promise(resolve => {
        setTimeout(() => {
            resolve("timeOut");
        }, 2000);
    });
    console.log(await awaitPromise);
    console.log("endOfFunction");

    let promise = new Promise(resolve => {
        setTimeout(() => {
            resolve("ok");
        }, 2000);
        console.log("EndOfPtomise");
    });

    promise.then(() => {
        console.log("TimeOutProimise");
    });
}*/

async function hello(ctx){
    const WELCOME_MESSAGE = [
        'Добро пожаловать, ' + userName,
        'Чтобы быстро добавить дело введи:',
        'Д: %whatYourDo%',
        'Или выбери действие:',
    ].join('\n');

    await ctx.reply(WELCOME_MESSAGE, {
        "reply_markup": {
            "keyboard": [[strings.keyboardConstants.BELLS, strings.keyboardConstants.JITSY],   [strings.keyboardConstants.VC, strings.keyboardConstants.MYSELF]]
        }
    });
}

async function mySelfMenu(ctx){
    await ctx.reply('Меню самооценки:',
         Markup.inlineKeyboard(
             [[ Markup.callbackButton(strings.keyboardConstants.MYSELF_LIST, strings.commands.MYSELF_LIST)],
             [Markup.callbackButton(strings.keyboardConstants.MYSELF_NEW, strings.commands.MYSELF_NEW)],
             [Markup.callbackButton(strings.keyboardConstants.MYSELF_CLEAR, strings.commands.MYSELF_CLEAR)],
             [Markup.callbackButton(strings.keyboardConstants.MYSELF_GET_FILE, strings.commands.MYSELF_GET_FILE)],
             ]).extra());
}

bot.start(async (ctx) => {
    await hello(ctx);
});

bot.help( async (ctx) => {
    await hello(ctx);
});

//bot.command('voice', async (ctx) => {
//    ctx.reply(await action(ctx.from.id.toString(), ctx.from.first_name, 'voice'));
//});

bot.hears(strings.keyboardConstants.VC, async (ctx) => {
    await ctx.reply(await otkrivator.openItPark());
});

bot.hears(strings.keyboardConstants.BELLS, async (ctx) => {
    await ctx.replyWithHTML(await bells.info());
});

bot.hears(strings.keyboardConstants.JITSY, async (ctx) => {
    await ctx.reply(userName + ', ' + await jitsi.health());
});

bot.command('open_m', async (ctx) => {
    await ctx.reply(await otkrivator.openMasterskie());
});

/*
Когда то код был нужен для рефакторинга хранимых данных. Возможно, еще понадобиться
bot.command('ref', async (ctx) => {
    await ctx.reply(await myself.refactor(cfg.VALID_USERS));
});*/

bot.hears(strings.keyboardConstants.MYSELF, async (ctx) => {
    await mySelfMenu(ctx);
});

//если в сообщении будет подходящий шаблон, то выполняем соотвествующие действия
bot.on('text', async (ctx) => {
    try {
        if (userId in addCase) {     //Если бот предложил пользователю ввести дело, то в объекте будет свойство == id
            delete addCase[userId];
            await ctx.reply(await myself.new(userId, userName, ctx.message.text.trim()));
        } else {
            if (ctx.message.text.startsWith(strings.commands.MYSELF_QUICK_NEW)) {
                await ctx.reply(await myself.new(userId, userName, ctx.message.text.slice(2).trim()));
            } else {
                if (ctx.message.text === strings.textConstants.CONFIRM_DELETE) {
                    await ctx.reply(await myself.clear(userId));
                } else {
                    await hello(ctx);
                }
            }
        }
    }catch (err) {
        await ctx.reply(err.message);
    }
});

//обработка команд с inline клавиатуры

bot.on('callback_query', async (ctx) =>{
        const callbackQuery = ctx.callbackQuery.data;
        try {
            switch (callbackQuery) {
                case strings.commands.MYSELF_LIST:
                    await ctx.reply(await myself.list(userId, userName));
                    break;
                case strings.commands.MYSELF_NEW:
                    addCase[userId] = false;
                    await ctx.reply("Что ты сделал, дружочек?");
                    break;
                case strings.commands.MYSELF_CLEAR:
                    await ctx.reply(textConstants.DELETE);
                    break;
                case strings.commands.MYSELF_GET_FILE:
                        await replyMyselfFile(userId, ctx);
                    break;
            }
        }catch (err) {
            await ctx.reply(err.message);
        }
});

/**
 * Отдает в чат лист самооценки и прибирает мусор за генератором файла
 * @param userId
 * @param ctx
 * @returns {Promise<unknown>}
 */
async function replyMyselfFile(userId, ctx){
    return new Promise(async (resolve, reject) => {
        try {
            const myselfFile = await myself.getMyselfFile(userId);
            await ctx.replyWithDocument({source: myselfFile});
            resolve();
        }
        catch (err) {
            reject(new Error(err.message));
        }
        finally {
            await myself.garbageCollector(userId); //сборка мусора
        }
    });
}

bot.launch();

process.on("uncaughtException",(err) => {
    console.log("Все паламалась!!!");
    console.log(err.message);
});
/*
* Запаковать: zip file.odt -r *
  Распаковать в директорию: unzip template.odt -d e
*
* */