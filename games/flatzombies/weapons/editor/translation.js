
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
let newIndex = 0;
let maxIndex = 0;
function tr(text) {
	if (!text || window.sourceTextIds.length == 0) return text;
	//Поиск полного соответствия
	for (let i = 0; i < window.sourceTextIds.length; i++) { //Перебираем все ключи из sourceText
		const key = window.sourceTextIds[i];
		const from = window.sourceText[key];
		const to = window.translate[key]; //перевод по тому же ключу
		if (from && to !== undefined && text === from) {
			return to; //просто возвращаем перевод
		} else if (key == text) {
			return to; //просто возвращаем перевод
		}
	}
	//Частичная замена
	for (let i = 0; i < window.sourceTextIds.length; i++) { //Перебираем все ключи из sourceText
		const key = window.sourceTextIds[i];
		const from = window.sourceText[key];
		const to = window.translate[key]; //перевод по тому же ключу
		if (from && to !== undefined && text.includes(from)) { //console.log(from + " -> " + to);
			return text.replace(from, to); //просто возвращаем перевод
		}
	}
	if (text.match(/^.*[А-ЯЁ].+$/i)) {
		newIndex++;
		const index = maxIndex + newIndex;
		console.warn(`Не найден перевод для текста:\n${index}: "${text}",`);
	}
	return text;
}


//Функция для динамической загрузки скрипта
//Если не удалось загрузить файл, то пытаемся загрузить defaultFile, если он был указан
function loadScript(src, defaultFile = undefined) {
	return new Promise((resolve, reject) => {
		const attemptLoad = (url, isFallback = false) => {
			const script = document.createElement('script');
			script.src = url;
			script.onload = () => resolve(url);
			script.onerror = () => {
				if (!isFallback && defaultFile) {
					attemptLoad(defaultFile, true);
				} else {
					reject(new Error(`Ошибка загрузки скрипта: ${isFallback ? defaultFile : src}`));
				}
			};
			document.head.append(script);
		};
		attemptLoad(src);
	});
}

//Переключение языка
async function switchLanguage(input) { //
	const langIsoId = input.value;
	try {
		localStorage.setItem('selectedLanguage', langIsoId);//Сохраняем выбранный язык в localStorage
		location.reload(); //Перезагрузить страницу
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
	//Если язык определен (был ранее указан или определен по браузеру), то загружаем соответствующий файл
	//Строки с переводом имеют идентификаторы, записываем их в отдельный массив sourceTextIds
	//Сортируем массив sourceTextIds по длине исходной строки, чтобы короткие слова не были в конце списка. В процессе обработки текста, сначала берем перевод длинных предложений, а затем перевод коротких фраз
	if (savedLang && savedLang !== 'ru') { //ru.js уже подключен по умолчанию
		try {
			window.translate = {}; //Очистить имеющийся текст с переводом
			await loadScript(directory + savedLang + '.js', directory + 'en.js'); //В случае ошибки загрузки, используем английский язык 
			window.sourceTextIds = Object.keys(window.sourceText).sort((a, b) => {
				return window.sourceText[b].length - window.sourceText[a].length; //отсортировать массив по длине строк из sourceText — от самых длинных к самым коротким
			});
			window.sourceTextIds.forEach(id => maxIndex = (id < 7000) ? Math.max(maxIndex, id) : maxIndex);
			applyTranslation(); //Применяем перевод
			document.dispatchEvent(new Event('DOMLanguageLoaded'));
		} catch (error) {
			alert(`Не удалось загрузить файл перевода для языка ${directory + savedLang}\n` + error);
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