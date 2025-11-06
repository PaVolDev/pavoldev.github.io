
//Исходные (оригинальные) тексты на базовом языке (например, русском)
window.sourceText = {
	//1000: "Добавить новый параметр",
	//1004: "Тип данных",
	//1005: "Обычная строка",
};

//Перевод на английский
window.translate = {
	//index.txt (1000–1999)
	//1000: "Add new parameter",
	//1007: "Sprite list",
	//1008: "Audio clip list",
	//1011: "Add",
};
//Атрибуты для перевода
window.attrsToTranslate = ['data-tooltip', 'placeholder', 'title'];
//Перевод текста
function applyTranslation() {
	window.sourceTextIds = Object.keys(window.sourceText).sort((a, b) => { 
		return window.sourceText[b].length - window.sourceText[a].length; //отсортировать массив по длине строк из sourceText — от самых длинных к самым коротким
	});
	translateNode(document.body);
}
function translateNode(node) {
	if (node.nodeType === Node.TEXT_NODE) {
		let text = node.textContent;
		if (!text.trim()) return;
		node.textContent = tr(text);
	} else if (node.nodeType === Node.ELEMENT_NODE) {
		if (node.tagName === 'SCRIPT' || node.tagName === 'STYLE') return;
		//Переводим атрибуты типа data-tooltip, если он есть
		for (const attr of window.attrsToTranslate) {
			const tooltip = node.getAttribute(attr);
			if (tooltip !== null) {
				const engText = tr(tooltip);
				if (engText !== tooltip) { node.setAttribute(attr, engText); }
			}
		}
		//Рекурсивно обрабатываем дочерние узлы
		node.childNodes.forEach(child => translateNode(child));
	}
}

//Перебираем исходные строки в том порядке, в котором они заданы
window.sourceTextIds = new Array();
function tr(text) {
	if (!text) return null;
	//Поиск полного соответствия
	for (let i = 0; i < window.sourceTextIds.length; i++) { //Перебираем все ключи из sourceText
		const key = window.sourceTextIds[i];
		const from = window.sourceText[key];
		const to = window.translate[key]; //перевод по тому же ключу
		if (from && to !== undefined && text === from) { //console.log(from + " -> " + to);
			return to; //просто возвращаем перевод
		}
	}

	if (text.match(/^.*[А-ЯЁ].+$/i)) { console.warn("Не найден перевод для текста:\n" + text); }

	//Частичная замена
	for (let i = 0; i < window.sourceTextIds.length; i++) { //Перебираем все ключи из sourceText
		const key = window.sourceTextIds[i];
		const from = window.sourceText[key];
		const to = window.translate[key]; //перевод по тому же ключу
		if (from && to !== undefined && text.includes(from)) { //console.log(from + " -> " + to);
			return text.replace(from, to); //просто возвращаем перевод
		}
	}
	return text;
}

//Функция для динамической загрузки скрипта
function loadScript(src) {
	console.log(src);
	return new Promise((resolve, reject) => {
		const script = document.createElement('script');
		script.src = src;
		script.onload = () => resolve(src);
		script.onerror = () => reject(new Error(`Ошибка загрузки скрипта ${src}`));
		document.head.append(script);
	});
}

//Переключение языка
async function switchLanguage(input) { //
	const langIsoId = input.value;
	try {
		localStorage.setItem('selectedLanguage', langIsoId);//Сохраняем выбранный язык в localStorage
		location.reload(); //Перезагрузить страницу
		//window.translate = {}; //Очистить переведённый текст
		//await loadScript(`lang/${langIsoId}.js`); //Загружаем файл перевода
		//applyTranslation();//Применяем перевод
		//console.log(`Язык переключен на: ${langIsoId}`);
	} catch (error) {
		alert("Ошибка при переключении языка:", error);
	}
}

document.addEventListener("DOMContentLoaded", loadTranslation);
async function loadTranslation() {
	let directory = document.getElementsByName('langdirectory')[0]?.content || 'lang/';
	let savedLang = localStorage.getItem('selectedLanguage');//Проверяем, есть ли сохраненный язык
	//Если нет сохраненного языка, пробуем определить язык браузера
	if (!savedLang) {
		const browserLang = navigator.language || navigator.languages[0];
		//Простое сопоставление: если начинается с 'ru' -> 'ru', если с 'en' -> 'en', иначе 'en'
		if (browserLang.startsWith('ru')) {
			savedLang = 'ru';
		} else if (browserLang.startsWith('en')) {
			savedLang = 'en';
		} else if (browserLang.startsWith('zh')) { //Для китайского
			savedLang = 'cn';
		} else {
			savedLang = 'en'; //По умолчанию
		}
		//Сохраняем определенный язык
		localStorage.setItem('selectedLanguage', savedLang);
	}
	//Если язык определен (сохранен или определен по браузеру), загружаем соответствующий файл
	if (savedLang && savedLang !== 'ru') { //ru.js уже подключен по умолчанию
		try {
			window.translate = {}; //Очистить переведённый текст
			await loadScript(directory + savedLang + '.js');
			applyTranslation(); //Применяем перевод
			document.dispatchEvent(new Event('DOMLanguageLoaded'));
		} catch (error) {
			alert(`Не удалось загрузить файл перевода для языка ${directory + savedLang}\n` + error);
			//В случае ошибки загрузки, используем язык по умолчанию (ru)
		}
	}

}

//Показать выбранный язык
function showSelectedLanguage(input) {
	const savedLang = localStorage.getItem('selectedLanguage');
	if (savedLang) { input.value = savedLang; }
}
// После загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
	const selectors = document.querySelectorAll('select.selectLanguage');
	selectors.forEach(select => showSelectedLanguage(select));
});