
function addNewSprite() {
	const spriteName = prompt("Имя объекта.\nМожно указать родительский объект, например: parent.newSprite");
	if (!spriteName) { return; }
	if (sceneObjects.find(o => o.name === spriteName)) {
		alert('Объект с таким именем уже существует!');
		return;
	}
	var index = editedParams.findIndex(p => p.fieldPath == 'addedGameObjects');
	if (index == -1) {
		addParam('addedGameObjects', true);
		editedParams[0].value = spriteName;
	} else {
		updateParam(index, editedParams[index].value + ',' + spriteName, true);
	}

	const component = '.SpriteRenderer';
	index = editedParams.findIndex(p => p.fieldPath == 'addedComponents');
	if (index == -1) {
		addParam('addedComponents', true);
		editedParams[0].value = spriteName + component;
	} else {
		updateParam(index, editedParams[index].value + ',' + spriteName + component, true);
	}

	typeDependencies['Sprite'].forEach(filed => {
		sample = sampleParams.find(s => s.fieldPath.endsWith(filed));
		editedParams.unshift({ "fieldPath": spriteName + '.' + filed, "startFieldPath": 'weapon.' + spriteName + '.' + filed, "comment": sample.comment, "type": sample.type, "value": sample.value });
	});
	editedParams.unshift({ "fieldPath": spriteName + ".SpriteRenderer.sprite", "startFieldPath": 'weapon.' + spriteName + ".SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", "type": "Sprite", "value": "" });

	renderEditedParams();
	syncParamsToScene();
}


//ПОКАЗАТЬ ПРАВИЛА
// Показать модальное окно при загрузке страницы
var modRulesModal = document.getElementById('modRulesModal');
document.addEventListener('DOMContentLoaded', function () {
	if (localStorage.getItem('modderAgreedToRules') !== 'true') {// Показать только если пользователь ещё не соглашался
		modRulesModal.style.display = 'block';
		document.getElementById('page').classList.add('hidden');
	}else{
		removeRulesWindow();
	}
});
// Включить/выключить кнопку "Согласен" в зависимости от чекбокса
const checkbox = document.getElementById('agreeCheckbox');
const agreeButton = document.getElementById('agreeBtn');
checkbox.addEventListener('change', function () {
	if (checkbox.checked) {
		agreeButton.classList.add('enabled');
		agreeButton.disabled = false;
	} else {
		agreeButton.classList.remove('enabled');
		agreeButton.disabled = true;
	}
});

// Закрыть окно при нажатии "Согласен"
agreeButton.addEventListener('click', removeRulesWindow);

function removeRulesWindow(event = null){
	modRulesModal.style.display = 'none';
	modRulesModal.innerHTML = '';
	localStorage.setItem('modderAgreedToRules', 'true');
	document.getElementById('page').classList.remove('hidden');
}


// Всплывающие подсказки
const tooltip = Object.assign(document.createElement('div'), {
	className: 'smart-tooltip',
	hidden: true
});
document.body.appendChild(tooltip);
const spacing = 8;
document.addEventListener('mouseover', e => {
	const target = e.target.closest('[data-tooltip]');
	if (!target) return;
	tooltip.innerHTML = target.getAttribute('data-tooltip').replace(/\n/g, '<br>');
	tooltip.hidden = false;
	tooltip.style.opacity = '0';
	const { width: tW, height: tH } = tooltip.getBoundingClientRect();
	const { left, right, top, bottom } = target.getBoundingClientRect();
	let x, y;
	// Приоритет: top → bottom → right → left
	if (top >= tH + spacing) {// Сверху: центрируем
		x = Math.max(spacing, Math.min(left + (right - left) / 2 - tW / 2, window.innerWidth - tW - spacing));
		y = top - tH - spacing;
	} else if (bottom + tH + spacing <= window.innerHeight) {// Снизу: центрируем
		x = Math.max(spacing, Math.min(left + (right - left) / 2 - tW / 2, window.innerWidth - tW - spacing));
		y = bottom + spacing;
	} else if (right + tW + spacing <= window.innerWidth) {// Справа: прижат к правому краю элемента
		x = right + spacing;
		y = Math.max(spacing, Math.min(top + (bottom - top) / 2 - tH / 2, window.innerHeight - tH - spacing));
	} else if (left - tW - spacing >= 0) {// Слева: прижат к левому краю элемента
		x = left - tW - spacing;
		y = Math.max(spacing, Math.min(top + (bottom - top) / 2 - tH / 2, window.innerHeight - tH - spacing));
	} else {// Fallback: сверху слева с отступом
		x = spacing;
		y = Math.max(spacing, top - tH - spacing);
	}
	tooltip.style.left = `${x}px`; tooltip.style.top = `${y}px`;
	tooltip.style.right = tooltip.style.bottom = '';
	tooltip.style.opacity = '1';
});
document.addEventListener('mouseout', () => {
	tooltip.style.opacity = 0;
});

//Небольшие функции для кнопки Сохранить
function generateRandomString() {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	return Array.from({ length: 8 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
}
const login = document.getElementById('login');
const password = document.getElementById('password');
document.getElementById('save').addEventListener('mouseenter', function () { // Проверяем, пусты ли поля при загрузке страницы
	if (!login.value && !password.value) {// Генерируем автоматические значения только если оба поля пусты
		login.value = generateRandomString();
		password.value = generateRandomString();
	}
});



function inputMinMax(input) {
	if (input.value != "") {
		if (parseInt(input.value) < parseInt(input.min)) {
			input.value = input.min;
		}
		if (parseInt(input.value) > parseInt(input.max)) {
			input.value = input.max;
		}
	}
}