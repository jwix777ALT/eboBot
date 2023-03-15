'use strict'
/**
 * Выводит информацию о текущем занятии и время до конца
 * @returns {Promise<unknown>}
 */
module.exports.info = () => {
	const dateNow = new Date();
	const currentHours = dateNow.getHours();
	let currentState = "";

	let markup = [
		'<b>1 пара:</b> 08:10 - 09:40',
		'<b>2 пара:</b> 09:50 - 11:20',
		'<b>3 пара:</b> 11:50 - 13:20',
		'<b>4 пара:</b> 13:30 - 15:00',
		'<b>5 пара:</b> 15:10 - 16:40',
		'<b>6 пара:</b> 16:50 - 18:30',
	];

	const markupTime = [		//точность до секунд не важна, используются минуты, прошедшие с начала суток
		{
			description: "1 пара",
			stopMinuts: 580,
		},
		{
			description: "1 перемена",
			stopMinuts: 590,
		},
		{
			description: "2 пара",
			stopMinuts: 680,
		},
		{
			description: "2 перемена",
			stopMinuts: 710,
		},
		{
			description: "3 пара",
			stopMinuts: 800,
		},
		{
			description: "3 перемена",
			stopMinuts: 810,
		},
		{
			description: "4 пара",
			stopMinuts: 900,
		},
		{
			description: "4 перемена",
			stopMinuts: 910,
		},
		{
			description: "5 пара",
			stopMinuts: 1000,
		},
		{
			description: "5 перемена",
			stopMinuts: 1010,
		},
		{
			description: "6 пара",
			stopMinuts: 1110,
		},
	];

	const minutes = currentHours * 60 + dateNow.getMinutes(); //текущее количество минут с начала дня
	if((minutes < 490) || (minutes > 1090) && dateNow.getDay() != 0) {
		if(minutes < 490)
			currentState = "Еще слишком рано";
		else
			currentState = "Уже слишком поздно";
	}
	else{
		switch (dateNow.getDay()) { //смотрим на расписание, в зависимости от дня недели
			case 0:
				currentState = "Сегодня выходной";
				break;
			case 6:				//коррекция расписания под субботу
				markup[2] = '<b>3 пара:</b> 11:30 - 13:00';
				markup.length = 3;
				markupTime[3].stopMinuts = 690;
				markupTime[4].stopMinuts = 780;
				markupTime.length = 5;
				if(minutes > markupTime[4].stopMinuts){
					currentState = "Уже слишком поздно";
					break
				}
			default:			//рабочая неделя
				for(let i = 0; i < markupTime.length; ++i){			//смотрим какое сейчас событие
					if(minutes - markupTime[i].stopMinuts < 0){
						currentState = `Сейчас ${markupTime[i].description}, до конца ${markupTime[i].stopMinuts - minutes} минут`;
						if(i % 2 == 0){
							markup[i / 2] = `==> ${markup[i / 2]}`;
						}
						break;
					}
				}
				break;
		}
	}
	markup.push(currentState);
	return new Promise( resolve=>{
		resolve(markup.join("\n"));
	});
};
