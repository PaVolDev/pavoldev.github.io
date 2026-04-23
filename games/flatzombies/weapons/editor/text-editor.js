let textEditorCurrentPath = ''; //Текущий путь редактируемого параметра.
let textEditorCurrentParam = null; //Текущий объект параметра.
let textEditorCurrentMimeType = 'application/octet-stream'; //MIME-тип из data URI заголовка.
let showCloseConfirm = false;

//Открывает окно текстового редактора для base64-текста.
function openTextEditor(paramPath) {
	const resolvedPath = paramPath || ''; //Путь к параметру, переданный из интерфейса.
	const param = findByPath(resolvedPath); //Ищем параметр в общем списке изменений.
	if (!param) {
		console.error('openTextEditor: параметр не найден - ' + resolvedPath);
		alert('Не удалось открыть текстовый редактор: параметр не найден');
		return;
	}
	const textarea = document.getElementById('textEditorTextarea'); //Поле для редактирования текста.
	const editor = document.getElementById('textEditor'); //Панель редактора.
	if (!textarea || !editor) {
		console.error('openTextEditor: элементы редактора не найдены');
		return;
	}
	textEditorCurrentPath = param.startFieldPath || param.fieldPath || resolvedPath; //Запоминаем путь параметра.
	textEditorCurrentParam = param; //Запоминаем ссылку на параметр.
	textarea.value = decodeBase64Text(param.value); //Декодируем base64 и выводим текст.
	editor.classList.remove('hidden');
	editor.style.display = 'flex';
	textarea.focus();
	textarea.oninput = onInputTextEditor;
	textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
	showCloseConfirm = false;
}

function onInputTextEditor(event){
	showCloseConfirm = true;
}

//Закрывает окно текстового редактора.
function closeTextEditor(showConfirm = false) {
	const editor = document.getElementById('textEditor'); //Панель редактора.
	const textarea = document.getElementById('textEditorTextarea'); //Поле для редактирования текста.
	if (showConfirm && showCloseConfirm) {//Если showConfirm === true, показываем диалог подтверждения
		const confirmed = confirm(tr("Закрыть окно без сохранения изменений?"));
		if (!confirmed) return; //Если пользователь нажал "Отмена", не закрываем редактор
	}
	if (editor) {
		editor.classList.add('hidden');
		editor.style.display = 'none';
	}
	if (textarea) {
		textarea.value = '';
	}
	textEditorCurrentPath = ''; //Сбрасываем путь текущего параметра.
	textEditorCurrentParam = null; //Сбрасываем ссылку на параметр.
}

//Сохраняет текст из редактора обратно в base64.
function saveTextEditor() {
	const textarea = document.getElementById('textEditorTextarea'); //Поле для редактирования текста.
	if (!textarea || !textEditorCurrentParam) return;
	const encodedText = encodeBase64Text(textarea.value); //Кодируем введённый текст в base64.
	textEditorCurrentParam.value = encodedText; //Обновляем значение параметра.
	const input = document.getElementById(textEditorCurrentPath); //Основное поле параметра в списке справа.
	if (input) {
		input.value = encodedText;
	}
	renderEditedParams();
	syncParamsToScene();
	closeTextEditor();
}

//Декодирует строку base64 в обычный текст с поддержкой UTF-8, удаляя data URI заголовок.
function decodeBase64Text(base64Value) {
	const source = typeof base64Value === 'string' ? base64Value.trim() : ''; //Исходная строка для декодирования.
	if (!source) return '';
	try {
		//Извлекаем MIME-тип и чистый base64 из data URI формата.
		const dataUriMatch = source.match(/^data:([^;]+);base64,(.*)$/); //Проверяем формат data URI.
		let pureBase64 = source; //Чистая base64 строка без заголовка.
		if (dataUriMatch) {
			textEditorCurrentMimeType = dataUriMatch[1]; //Сохраняем MIME-тип для последующего кодирования.
			pureBase64 = dataUriMatch[2]; //Получаем чистую base64 строку.
		}
		const binary = atob(pureBase64); //Декодируем base64 в бинарную строку.
		const bytes = Uint8Array.from(binary, ch => ch.charCodeAt(0)); //Преобразуем бинарную строку в байты.
		return new TextDecoder('utf-8').decode(bytes);
	} catch (error) {
		console.warn('decodeBase64Text: ошибка декодирования', error);
		alert('#1618, decodeBase64Text: ошибка декодирования');
		return source;
	}
}

//Кодирует обычный текст в base64 с поддержкой UTF-8 и добавляет data URI заголовок.
function encodeBase64Text(textValue) {
	const source = textValue ?? ''; //Исходный текст для кодирования.
	const bytes = new TextEncoder().encode(source); //Преобразуем текст в UTF-8 байты.
	let binary = ''; //Бинарная строка для btoa.
	bytes.forEach(byte => {
		binary += String.fromCharCode(byte);
	});
	const pureBase64 = btoa(binary); //Кодируем в чистый base64.
	return `data:${textEditorCurrentMimeType};base64,${pureBase64}`; //Добавляем data URI заголовок.
}
