
function addNewSprite() {
	const spriteName = prompt(tr("Имя объекта.\nМожно указать родительский объект, например: parent.newSprite"));
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
		const newSpriteInfo = { "fieldPath": spriteName + '.' + filed, "startFieldPath": 'weapon.' + spriteName + '.' + filed, "comment": sample.comment, "type": sample.type, "value": sample.value }
		editedParams.unshift(newSpriteInfo);
		availableParams.unshift(newSpriteInfo);
	});
	const newSpriteInfo = { "fieldPath": spriteName + ".SpriteRenderer.sprite", "startFieldPath": 'weapon.' + spriteName + ".SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", "type": "Sprite", suffix: ".SpriteRenderer.sprite", "value": "" };
	editedParams.unshift(newSpriteInfo);
	availableParams.unshift(newSpriteInfo);
	renderEditedParams();
	syncParamsToScene();
}


//ПОКАЗАТЬ ПРАВИЛА
// Показать модальное окно при загрузке страницы
var modRulesModal = document.getElementById('modRulesModal');
document.addEventListener('DOMContentLoaded', function () {
	if (localStorage.getItem('agreedToRulesV2') !== 'true') {// Показать только если пользователь ещё не соглашался
		modRulesModal.style.display = 'block';
		document.getElementById('page').classList.add('hidden');
	} else {
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
function removeRulesWindow(event = null) {
	modRulesModal.style.display = 'none';
	modRulesModal.innerHTML = '';
	localStorage.setItem('agreedToRulesV2', 'true');
	document.getElementById('page').classList.remove('hidden');
	window.scrollTo(0, 0);
}





// Всплывающие подсказки
const tooltip = Object.assign(document.createElement('div'), {
	className: 'smart-tooltip',
	hidden: true
});
document.body.appendChild(tooltip);
const spacing = 8;
document.addEventListener('mouseover', tooltipMouseOverElement);
document.addEventListener('touchstart', tooltipMouseOverElement, { passive: false });
document.addEventListener('touchmove', tooltipMouseOverElement, { passive: false });
function tooltipMouseOverElement(e) {
	const target = e.target.closest('[data-tooltip]');
	if (!target) return;
	tooltip.innerHTML = target.getAttribute('data-tooltip').replace(/\n/g, '<br>');
	tooltip.hidden = false;
	tooltip.style.opacity = '0';
	if (!tooltip.innerHTML) return;
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
}
document.addEventListener('mouseout', tooltipMouseOut);
document.addEventListener('touchend', tooltipMouseOut, { passive: false });
document.addEventListener('touchcancel', handleTouchEnd, { passive: false });
function tooltipMouseOut() {
	tooltip.style.opacity = 0;
}


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

let background = 'white';
//Переключение фона предпросмотра
function backgroundPreview(color, element) {
	background = color;
	forceRenderEditedParams();
}


function setPreviewAnimation(paramPath, animayionName) {
	param = findByPath(paramPath);
	param.previewAnimation = animayionName;
	forceRenderEditedParams();
}

function nextFrameInFrameList(paramPath) {
	const param = findByPath(paramPath);
	changeAnimationPreviewFrame(paramPath, param.frame + 1);
}
function backFrameInFrameList(paramPath) {
	const param = findByPath(paramPath);
	changeAnimationPreviewFrame(paramPath, param.frame - 1);
}
function lastFrameInFrameList(paramPath) {
	const param = findByPath(paramPath);
	changeAnimationPreviewFrame(paramPath, param.value.length);
}

function changeAnimationPreviewFrame(paramPath, frame) {
	const param = findByPath(paramPath);
	const animation = param.value.find(a => a.name == param.previewAnimation) ?? param.value[0];
	param.frame = Math.min(Math.max(frame, 0), animation.frames.length - 1);
	document.getElementById(param.fieldPath + "Frame").innerHTML = showAnimationFrame(param); //renderEditedParams(); //Показать изменения на странице
	document.getElementById(param.fieldPath + "Timeline").value = param.frame;
	document.getElementById(param.fieldPath + "Current").innerHTML = param.frame + 1;
}


function showAnimationFrame(param) {
	if (param.value.length == 0) return '';
	const animationIndex = Math.max(0, param.value.findIndex(a => a.name == param.previewAnimation));
	const animation = param.value[animationIndex];
	if (!animation) return '';
	const frames = animation.frames;
	if (frames.length == 0) return 'Нет кадров';
	const frame = Math.min(Math.max(param.frame, 0), frames.length - 1);
	if (!frames[frame]) return 'Пустой кадр';
	const fieldsHtml = param.spriteMetaData.map(fieldMeta => {
		const fieldMetaValue = frames[frame][fieldMeta.fieldPath];
		if (fieldMeta.type == "Sprite") {
			return `<img src="${fieldMetaValue}" style="width: 180px; height: 180px; object-fit: contain; margin: auto; background-color: ${background ?? 'black'};" onerror="this.style.visibility='hidden';"><br>${getInput(fieldMeta, [param.startFieldPath, animationIndex, 'frames', frame, fieldMeta.fieldPath])}`;
		}
		return `<div class="field-row" data-tooltip="${fieldMeta.comment || ''}">
							<div class="field-label">${fieldMeta.fieldPath}</div>
							<div class="field-control">${getInput(fieldMeta, [param.startFieldPath, animationIndex, 'frames', frame, fieldMeta.fieldPath])}</div>
						</div>`;
	}).join('');
	return `
            <div class="array-item" data-animation="${animation.name}" data-frame="${frame}">
                <div class="array-item-head">
                    <div class="array-item-title">[${animationIndex}][${frame}]</div>
					<button class="remove-btn" onclick="removeArrayItem(['${param.startFieldPath}', ${animationIndex}], ${frame})" data-tooltip="Удалить из списка">✕</button>
                </div>
                <div class="grid-in-object">
                    ${fieldsHtml}
                </div>
            </div>
        `;
};


//Работа с массивом изображений
//Показать список анимаций
function renderAnimationSprite(param, paramIndex, spriteMetaData) {
	param.value = param.value || [{ "name": "asd", "frames": [{ "texture": "", "pivotPoint": "(0.5, 0.5)", "pixelPerUnit": 50 }] }];
	param.frame = param.frame || 0;
	param.index = paramIndex;
	param.spriteMetaData = spriteMetaData;
	param.value = Array.isArray(param.value) ? param.value : JSON.parse(param.value);
	param.previewAnimation = param.previewAnimation ?? '';

	const animations = Array.isArray(param.value) ? param.value : [];
	let html = `
		<div>
			<strong data-tooltip="${param.startFieldPath}">${param.displayName || param.fieldPath}</strong><br>
			<small>${param.comment || ''}</small>
		</div>`;


	let animIdx = animations.findIndex(a => a.name == param.previewAnimation);
	animIdx = (animIdx == -1) ? 0 : animIdx;
	const anim = animations[animIdx];
	const name = anim?.name || '';
	anim.frames = Array.isArray(anim?.frames) ? anim.frames : [];
	const frames = anim.frames;

	frames.forEach((frame, frameIndex) => {
		if (!frame) {
			frames[frameIndex] = newObjectByMetaData(spriteMetaData);
		}
	});

	let selectHTML = `<select onchange="setPreviewAnimation('${param.startFieldPath}', this.value);" value="${param.previewAnimation}" id="${param.startFieldPath}">`;
	animations.forEach((anim, animIdx) => {
		selectHTML += `<option value="${anim.name}"${(anim.name == param.previewAnimation ? ' selected' : '')}>${anim.name}</option>`;
	});
	selectHTML += '</select>';

	html += `
			<div style="display: grid; grid-template-columns: 2fr 1fr">
				<div style="display: grid;grid-template-columns: 1fr 1fr;gap: 0.5em; align-items: start;">
					${selectHTML}
					<input type="text" value="${name}" placeholder="Имя анимации" onchange="updateAnimationName(${paramIndex}, ${animIdx}, this.value)" >
				</div>
				<div style="text-align: right;">
					<button type="button" class="add animation-btn" onclick="addAnimation(${paramIndex})" data-tooltip="Добавить новую анимацию">Добавить</button>
					<button type="button" class="itemremove" onclick="removeAnimation(${paramIndex}, ${animIdx})" data-tooltip="Удалить анимацию ${name}">Удалить</button>
				</div>
			</div>
			<div class="animation-block" style="border: 1px solid var(--border-color); padding: 6px; margin: 4px 0; border-radius: 4px;">
				<div class="frames-list" style="margin-top: 6px;">
				<div class="field-control">
					<div class="array-items" id="array-items-${param.frame}">
						${frames.length != 0 ?
			`<input type="range" min="0" max="${frames.length - 1}" step="1" oninput="changeAnimationPreviewFrame('${param.startFieldPath}', this.value)" onmouseup="forceRenderEditedParams();" value="${param.frame}" id="${param.fieldPath}Timeline">
				<div style="display: flex;align-items: center;justify-content: right; column-gap: 1em">
					<div class="bg-btn-group" style="display: flex; align-items: center; gap: 1px;">
						<div class="bg-btn" data-bg="black" style="background: black;" onclick="backgroundPreview('black', this);"></div>
						<div class="bg-btn" data-bg="white" style="background: white;" onclick="backgroundPreview('white', this);"></div>
					</div>
					<div><span id="${param.fieldPath}Current">${param.frame + 1}</span>/<span id="${param.fieldPath}Total">${frames.length}</span></div>
					<div>
						<button class="add" onclick="nextFrameInFrameList('${param.startFieldPath}')">⏭</button>
						<button class="add" onclick="backFrameInFrameList('${param.startFieldPath}')">⏮</button>
					</div>
				</div>`
			: ''}
						<span id="${param.fieldPath}Frame">${showAnimationFrame(param)}</span>
						<div class="row-actions">
							${param.frame > 0 ? `<button class="add" onclick="moveAnimationFrame(${paramIndex}, ${animIdx}, ${param.frame}, -1)" data-tooltip="Поменять местами текущий кадр">⬅</button>` : ''}
							${param.frame < frames.length - 1 ? `<button class="add" onclick="moveAnimationFrame(${paramIndex}, ${animIdx}, ${param.frame}, 1)" data-tooltip="Поменять местами текущий кадр">➡</button>` : ''}
							<button class="add" onclick="addAnimationFrame(${paramIndex}, ${animIdx}); nextFrameInFrameList('${param.startFieldPath}');">Добавить</button>
						</div>
					</div>
				</div>
			</div>
    `;

	return html;
}








// --- Анимации ---
function addAnimation(paramIndex) {
	const param = editedParams[paramIndex];
	if (!Array.isArray(param.value)) param.value = [];
	param.value.push({ name: 'newAnim', frames: [] });
	forceRenderEditedParams();
}

function removeAnimation(paramIndex, animIdx) {
	const param = editedParams[paramIndex];
	if (Array.isArray(param.value)) {
		param.value.splice(animIdx, 1);
		if (param.value.length == 0) {
			param.value.push({ name: 'empty', frames: [] });
		}
		forceRenderEditedParams();
	}
}

function moveAnimation(paramIndex, animIdx, offset) {
	const param = editedParams[paramIndex];
	if (!Array.isArray(param.value)) return;
	const target = animIdx + offset;
	if (target < 0 || target >= param.value.length) return;
	[param.value[animIdx], param.value[target]] = [param.value[target], param.value[animIdx]];
	forceRenderEditedParams();
}

function updateAnimationName(paramIndex, animIdx, name) {
	const param = editedParams[paramIndex];
	if (Array.isArray(param.value) && param.value[animIdx]) {
		param.value[animIdx].name = name;
	}
}

// --- Фреймы ---
function addAnimationFrame(paramIndex, animIdx) {
	const param = editedParams[paramIndex];
	if (Array.isArray(param.value) && param.value[animIdx]?.frames) {
		param.value[animIdx].frames.push({
			texture: '',
			pivotPoint: '(0.5, 0.5)',
			pixelPerUnit: 100
		});
		forceRenderEditedParams();
	}
}


function moveAnimationFrame(paramIndex, animIdx, frameIdx, offset) {
	const param = editedParams[paramIndex];
	const frames = param.value?.[animIdx]?.frames;
	if (!Array.isArray(frames)) return;
	const target = frameIdx + offset;
	if (target < 0 || target >= frames.length) return;
	[frames[frameIdx], frames[target]] = [frames[target], frames[frameIdx]];
	forceRenderEditedParams();
}

function convertNullAnimationFrame(paramIndex, animIdx, frameIdx) {
	const param = editedParams[paramIndex];
	const frames = param.value?.[animIdx]?.frames;
	if (Array.isArray(frames) && frames[frameIdx] === null) {
		frames[frameIdx] = {
			texture: '',
			pivotPoint: '(0.5, 0.5)',
			pixelPerUnit: 100
		};
		forceRenderEditedParams();
	}
}

function updateAnimationFrameField(paramIndex, animIdx, frameIdx, field, value) {
	const param = editedParams[paramIndex];
	const frame = param.value?.[animIdx]?.frames?.[frameIdx];
	if (frame && frame !== null) {
		frame[field] = value;
	}
}

function fileToBase64AnimationFrame(paramIndex, animIdx, frameIdx, input) {
	if (!input.files?.length) return;
	const file = input.files[0];
	const reader = new FileReader();
	reader.onload = function (e) {
		updateAnimationFrameField(paramIndex, animIdx, frameIdx, 'texture', e.target.result);
		forceRenderEditedParams();
	};
	reader.readAsDataURL(file);
	input.value = '';
}





//Форма для редактирование списка материалов
function renderPhysicsMaterialMultiply(param, index, childFields) {
	param.value = param.value || [];
	const items = Array.isArray(param.value) ? param.value : JSON.parse(param.value);
	const renderItem = (item, i) => {
		const materialOptions = [
			{ value: "armor", label: "Armor" },
			{ value: "metal", label: "Metal" },
			{ value: "skin", label: "Skin" }
		];
		const selectedMaterial = item?.materialName.toLowerCase().replace('material', '').replace('-', '') || "skin";
		const optionsHtml = materialOptions.map(opt => `<option value="${opt.value}" ${opt.value === selectedMaterial ? 'selected' : ''}>${opt.label}</option>`).join('');
		return `<div class="array-item" data-index="${i}">
				<div class="array-item-head">
					<div class="array-item-title">${param.fieldPath}[${i}]</div>
					<button class="remove-btn" onclick="removeArrayItem('${param.startFieldPath}', ${i})" data-tooltip="Удалить из списка">✕</button>
				</div>
				<div class="grid-in-object">
					<div class="field-row" data-tooltip="Материал тела">
						<div class="field-label">materialName</div>
						<div class="field-control">
							<select onchange="updateMaterialName(${index}, ${i}, this.value)" class="field-input">
								${optionsHtml}
							</select>
						</div>
					</div>
					<div class="field-row" data-tooltip="Умножить урон при попадании в материал">
						<div class="field-label">scaleFirst</div>
						<div class="field-control">
							<input type="number" step="0.1" value="${item.scaleFirst || 1}" class="field-input"
								onchange="updateArrayField(${index}, ${i}, 'scaleFirst', parseFloat(this.value))">
						</div>
					</div>
					<div class="field-row" data-tooltip="Ещё раз умножить урон для следующего попадания, если maxHits >= 2 (когда пуля имеет возможность пробивать несколько тел)">
						<div class="field-label">scaleThrough</div>
						<div class="field-control">
							<input type="number" step="0.1" value="${item.scaleThrough || 0.5}" class="field-input"
								onchange="updateArrayField(${index}, ${i}, 'scaleThrough', parseFloat(this.value))">
						</div>
					</div>
					<div class="field-row" data-tooltip="Остановить пулю, если урон стал слишком низким после прохождения несольких тел">
						<div class="field-label">stopBulletDamage</div>
						<div class="field-control">
							<input type="number" step="0.1" value="${item.stopBulletDamage || 0}" class="field-input"
								onchange="updateArrayField(${index}, ${i}, 'stopBulletDamage', parseFloat(this.value))">
						</div>
					</div>
				</div>
			</div>`;
	};
	const itemsHtml = items.map((item, i) => renderItem(item, i)).join('');
	return `<strong>${param.fieldPath}</strong><br>
			<small>${param.comment || ''}</small><br>
			<div class="field-control">
				<div class="array-items" id="array-items-physics-${index}">
					${itemsHtml}
					<div class="row-actions"><button data-tooltip="${tr("Добавить ещё один параметр")}" class="add" onclick="addArrayItem(${index})">Добавить</button></div>
				</div>
			</div>`;
}






// Добавить новый элемент в массив
function addArrayItem(paramIndex) {
	const param = editedParams[paramIndex];
	if (!Array.isArray(param.value)) param.value = [];
	param.value.push({
		materialName: "armor",
		scaleFirst: 1,
		scaleThrough: 0.5,
		stopBulletDamage: 0
	});
	updateParam(paramIndex, param.value, true);
}

// Удалить элемент по индексу
function removeArrayItem(path, itemIndex) {
	const paramArray = findValueByPath(path);
	if (Array.isArray(paramArray)) {
		paramArray.splice(itemIndex, 1);
		renderEditedParams();
	}
}

// Обновить поле в объекте массива
function updateArrayField(paramIndex, itemIndex, field, value) {
	const param = editedParams[paramIndex];
	if (Array.isArray(param.value) && param.value[itemIndex]) {
		param.value[itemIndex][field] = value;
	}
}

// Обновить materialName при выборе из select
function updateMaterialName(paramIndex, itemIndex, materialName) {
	const param = editedParams[paramIndex];
	if (Array.isArray(param.value) && param.value[itemIndex]) {
		param.value[itemIndex].materialName = materialName;
	}
}







//Универсальная функция renderObjectArray, которая работает с любым массивом объектов, основываясь на конфигурации objectMetaData
// Форма для редактирования массива объектов
function renderObjectArray(param, index, objectMetaData) {
	param.objectMetaData = objectMetaData; // добавляем метаданные в param
	param.value = param.value || [];
	const items = Array.isArray(param.value) ? param.value : JSON.parse(param.value);
	const renderItem = (item, i) => {
		const fieldsHtml = objectMetaData.map(fieldMeta => {
			fieldMeta.value = item[fieldMeta.fieldPath];
			return `<div class="field-row" data-tooltip="${fieldMeta.comment || ''}">
							<div class="field-label">${fieldMeta.fieldPath}</div>
							<div class="field-control">${getInput(fieldMeta, [param.startFieldPath, i, fieldMeta.fieldPath])}</div>
						</div>`;
		}).join('');


		return `
            <div class="array-item" data-index="${i}">
                <div class="array-item-head">
                    <div class="array-item-title">${param.fieldPath}[${i}]</div>
					<button class="remove-btn" onclick="removeArrayItem('${param.startFieldPath}', ${i})" data-tooltip="Удалить из списка">✕</button>
                </div>
                <div class="grid-in-object">
                    ${fieldsHtml}
                </div>
            </div>
        `;
	};

	const itemsHtml = items.map((item, i) => renderItem(item, i)).join('');

	return `
		<strong>${param.fieldPath}</strong><br>
        <small>${param.comment || ''}</small><br>
        <div class="field-control">
            <div class="array-items" id="array-items-${index}">
                ${itemsHtml}
                <div class="row-actions">
                    <button data-tooltip="${tr("Добавить ещё один параметр")}" class="add" onclick="addArrayItemByMeta('${param.startFieldPath}')">Добавить</button>
                </div>
            </div>
        </div>
    `;
}

//Универсальная функция renderSpriteArray, которая работает с любым массивом объектов, основываясь на конфигурации objectMetaData
// Форма для редактирования массива объектов
function renderSpriteArray(param, index, objectMetaData) {
	param.objectMetaData = objectMetaData; // добавляем метаданные в param
	param.frame = param.frame || 0;
	param.index = index;
	param.value = param.value || [{ "sprite": "", "pivotPoint": "(0.5, 0.5)", "pixelPerUnit": 50 }];
	param.value = Array.isArray(param.value) ? param.value : JSON.parse(param.value);
	const items = param.value;
	return `<strong>${param.fieldPath}</strong><br>
        <small>${param.comment || ''}</small><br>
        <div class="field-control">
            <div class="array-items" id="array-items-${index}">
				${param.value.length != 0 ?
			`<input type="range" min="0" max="${items.length - 1}" step="1" oninput="changePreviewFrame('${param.startFieldPath}', this.value)" value="${param.frame}" id="${param.fieldPath}Timeline">
				<div style="display: flex;align-items: center;justify-content: right; column-gap: 1em">
					<div><span id="${param.fieldPath}Current">${param.frame + 1}</span>/<span id="${param.fieldPath}Total">${param.value.length}</span></div>
					<div>
						<button class="add" onclick="nextFrameInSpriteList('${param.startFieldPath}')">⏭</button>
						<button class="add" onclick="backFrameInSpriteList('${param.startFieldPath}')">⏮</button>
					</div>
				 </div>`
			: ''}
                <span id="${param.fieldPath}Frame">${showSelectedFrame(param)}</span>
                <div class="row-actions">
                    <button class="add" onclick="addArrayItemByMeta('${param.startFieldPath}', ${param.frame ?? -1}); nextFrameInSpriteList('${param.startFieldPath}');">Добавить</button>
                </div>
            </div>
        </div>
    `;
}

function showSelectedFrame(param) {
	if (param.value.length == 0) { return ''; }
	const frame = Math.min(Math.max(param.frame, 0), param.value.length - 1);
	const fieldsHtml = param.objectMetaData.map(fieldMeta => {
		fieldMeta.value = param.value[frame][fieldMeta.fieldPath];
		if (fieldMeta.type == "Sprite") {
			return `<img src="${fieldMeta.value}" style="width: 180px; height: 180px; object-fit: contain; margin: auto; background-color: ${background ?? 'black'};" onerror="this.style.visibility='hidden';"><br>${getInput(fieldMeta, [param.startFieldPath, frame, fieldMeta.fieldPath])}`;
		}
		return `<div class="field-row" data-tooltip="${fieldMeta.comment || ''}">
							<div class="field-label">${fieldMeta.fieldPath}</div>
							<div class="field-control">${getInput(fieldMeta, [param.startFieldPath, frame, fieldMeta.fieldPath])}</div>
						</div>`;
	}).join('');
	return `
            <div class="array-item" data-index="${frame}">
                <div class="array-item-head">
                    <div class="array-item-title">${param.fieldPath}[${frame}]</div>
					<button class="remove-btn" onclick="removeArrayItem('${param.startFieldPath}', ${frame})" data-tooltip="Удалить из списка">✕</button>
                </div>
                <div class="grid-in-object">
                    ${fieldsHtml}
                </div>
            </div>
        `;
};

function nextFrameInSpriteList(paramPath) {
	const param = findByPath(paramPath);
	changePreviewFrame(paramPath, param.frame + 1);
}
function backFrameInSpriteList(paramPath) {
	const param = findByPath(paramPath);
	changePreviewFrame(paramPath, param.frame - 1);
}
function lastFrameInSpriteList(paramPath) {
	const param = findByPath(paramPath);
	changePreviewFrame(paramPath, param.value.length);
}

function changePreviewFrame(paramPath, frame) {
	const param = findByPath(paramPath);
	param.frame = Math.min(Math.max(frame, 0), param.value.length - 1);
	if (2 <= param.value.length) {
		document.getElementById(param.fieldPath + "Frame").innerHTML = showSelectedFrame(param); //renderEditedParams(); //Показать изменения на странице
		document.getElementById(param.fieldPath + "Timeline").value = param.frame;
		document.getElementById(param.fieldPath + "Current").innerHTML = param.frame + 1;
		document.getElementById(param.fieldPath + "Total").innerHTML = param.value.length;
	}
}



/**
 * Устанавливает значение по вложенному пути в объекте или массиве.
 * @param {*} newValue — новое значение
 * @param {(string|Array)[]} path — путь в виде массива ключей/индексов
 */
function updateValueByPath(newValue, path) {
	let index = null;
	if (typeof path === "string" && (index = editedParams.findIndex(p => p.fieldPath === path || p.startFieldPath === path)) != -1) {
		editedParams[index].value = newValue;
		return editedParams[index];
	}
	index = parseInt(path);
	if (index) {
		editedParams[index].value = newValue;
		return editedParams[index];
	}
	const pathList = (typeof path === "string") ? path.split('.') : path;
	if (Array.isArray(pathList) && (index = editedParams.findIndex(p => p.fieldPath === pathList[0] || p.startFieldPath === pathList[0])) != -1) {
		pathList.shift();
		editedParams[index].value = updateChildValueByPath(editedParams[index].value, newValue, pathList);
		return editedParams[index];
	}
	console.warn("updateValueByPath: параметр не найден для пути: " + path.join('/') + "; Тип: <" + typeof path + ">, parseInt = " + index);
	return null;
}

function findByPath(fieldPath) {
	const index = parseInt(fieldPath);
	if (index) return editedParams[index];
	if (!fieldPath) return null;
	fieldPath = fieldPath.trim();
	return editedParams.find(p => p.startFieldPath === fieldPath) ?? editedParams.find(p => p.fieldPath === fieldPath);
}



/**
 * Устанавливает значение по вложенному пути в объекте или массиве.
 * @param {Object|Array} currentObj — целевой объект/массив
 * @param {*} newValue — новое значение
 * @param {(string|number)[]} path — путь в виде массива ключей/индексов
 */
function updateChildValueByPath(currentObj, newValue, path) {
	if (path.length === 0) { return newValue; }
	let lastObject = currentObj;
	let current = currentObj;
	let objKey = path[path.length - 1];
	for (let i = 0; i < path.length; i++) {
		objKey = path[i];
		current = lastObject[objKey];
		if ((objKey == 'x' || objKey == 'y' || objKey == 'z') && i == path.length - 1) {
			break; //Остановить цикл. //Оставить предыдущий объект, если текущее значение является всего лишь строкой
		}
		if (current == null) { console.error(`Невозможно получить свойство '${objKey}' в объекте: ` + ((currentObj) ? JSON.stringify(currentObj) : 'NULL')); }
		if (typeof current !== 'object' && !Array.isArray(current)) { //throw new Error(`Свойство '${objKey}' должно быть объектом для сохранения изменений в родительском объекте: ` + JSON.stringify(currentObj));
			break; //Остановить цикл. //Оставить предыдущий объект, если текущее значение является всего лишь строкой
		} else {
			lastObject = current;
		}
	}
	const lastKey = path[path.length - 1];
	if (lastKey == 'x') {
		lastObject[objKey] = updateVectorValue(lastObject[objKey], 0, newValue);
	} else if (lastKey == 'y') {
		lastObject[objKey] = updateVectorValue(lastObject[objKey], 1, newValue);
	} else if (lastKey == 'z') {
		lastObject[objKey] = updateVectorValue(lastObject[objKey], 2, newValue);
	} else {
		lastObject[objKey] = newValue;
	}
	//console.log(JSON.stringify(lastObject) + ' [' + objKey + ']');
	//console.log(JSON.stringify(currentObj));
	return currentObj;
}



function findValueByPath(path) {
	let index = null;
	let param = null;
	if (!Array.isArray(path)) {
		param = findByPath(path);
		return param.value;
	} else if ((index = editedParams.findIndex(p => p.fieldPath === path[0] || p.startFieldPath === path[0])) != -1) {
		param = editedParams[index];
	}
	if (param) {
		if (path.length === 1) return param.value;
		let lastObject = param.value;
		let current = param.value;
		let objKey = path[path.length - 1];
		for (let i = 1; i < path.length; i++) {
			objKey = path[i];
			current = lastObject[objKey];
			if ((objKey == 'x' || objKey == 'y' || objKey == 'z') && i == path.length - 1) {
				break; //Остановить цикл. //Оставить предыдущий объект, если текущее значение является всего лишь строкой
			}
			if (current == null) { console.error(`Невозможно получить свойство '${objKey}' в объекте: ` + JSON.stringify(lastObject)); }
			if (typeof current !== 'object' && !Array.isArray(current)) { //throw new Error(`Свойство '${objKey}' должно быть объектом для сохранения изменений в родительском объекте: ` + JSON.stringify(currentObj));
				break; //Остановить цикл. //Оставить предыдущий объект, если текущее значение является всего лишь строкой
			} else {
				lastObject = current;
			}
		}
		const lastKey = path[path.length - 1];
		if (lastKey == 'x') {
			return parseVector(lastObject[objKey])[0];
		} else if (lastKey == 'y') {
			return parseVector(lastObject[objKey])[1];
		} else if (lastKey == 'z') {
			return parseVector(lastObject[objKey])[2];
		} else {
			return lastObject[objKey];
		}
	}
}



// Добавить новый элемент в массив
function addArrayItemByMeta(path, positionIndex = -1, objectMetaData = null) {
	let paramArray = findValueByPath(path);
	const param = (Array.isArray(path)) ? findByPath(path[0]) : findByPath(path);
	if (!paramArray) { console.warn(`addArrayItemByMeta: ${path} - массив не найден`); return; }
	if (!Array.isArray(paramArray)) { console.warn(`addArrayItemByMeta: ${path} - не является массивом = `, paramArray); return; }
	let newItem;
	objectMetaData = objectMetaData ?? param.objectMetaData;
	if (Array.isArray(objectMetaData)) {
		newItem = newObjectByMetaData(objectMetaData);
	} else {
		newItem = ''; // Пустая строка по умолчанию
		if (objectMetaData == null) console.warn("addArrayItemByMeta.objectMetaData == null - параметр фукнции не указан");
	}
	let insertIndex;
	if (positionIndex === -1 || positionIndex < 0) {
		insertIndex = paramArray.length;// Добавляем в конец, как в оригинальной функции
	} else {
		insertIndex = Math.min(positionIndex + 1, paramArray.length);// Вставляем после указанного индекса, но не дальше конца массива
	}
	paramArray.splice(insertIndex, 0, newItem);
	renderEditedParams();
}

function newObjectByMetaData(metaData) {
	let newItem = {};
	metaData.forEach(field => { newItem[field.fieldPath] = field.value; });
	return newItem;
}

// Обновить поле в объекте массива
function updateArrayFieldByMeta(paramIndex, itemIndex, field, value) {
	const param = editedParams[paramIndex];
	if (Array.isArray(param.value) && param.value[itemIndex]) {
		if (field in param.value[itemIndex]) {
			param.value[itemIndex][field] = value;
		} else {
			console.warn("updateArrayFieldByMeta: свойство '" + field + "' не найдено в объекте ", param.value[itemIndex]);
		}
	}
}








function renderFileArray(param, index, fileType = ".png") {
	param.value = param.value || [];
	const items = Array.isArray(param.value) ? param.value : JSON.parse(param.value);
	const renderItem = (itemValue, i) => {
		//<img src="images/download.png" onclick="saveArrayItemToFile(${index}, ${i})">
		return `
            <div class="array-item" data-index="${i}">
                <div class="array-item-head">
                    <div class="field-label">${param.fieldPath}[${i}]</div>
					<button class="remove-btn" onclick="removeArrayItem('${param.startFieldPath}', ${i})" data-tooltip="Удалить из списка">✕</button>
                </div>
                <div class="grid-in-object">
					<div class="field-control">
						<input type="text" class="text-input" placeholder="data:file/type;base64,..." onchange="updateFileItem(${index}, ${i}, this.value)" style="margin-bottom: 2px;" value="${htmlspecialchars(itemValue)}" id="${param.fieldPath}-input-${i}">
						<div>
						<div class="iconButton" data-tooltip="Сохранить в файл"><img src="images/download.png" onclick="saveJsonToFile(${index}, ${i})"></div>
						<label class="fileInputLabel">
							<input type="file" class="fileInput" ${fileType ? `accept="${fileType}"` : ''} oninput="loadFileToArray(${index}, ${i}, this)">
							<div class="fileInputButton" data-tooltip="Открыть другой файл">Заменить</div>
						</label>
						</div>
					</div>
                </div>
            </div>
        `;
	};

	const itemsHtml = items.map((item, i) => renderItem(item, i)).join('');

	return `
        <strong>${param.fieldPath}</strong><br>
        <small>${param.comment}</small><br>
        <div class="field-control">
            <div class="array-items" id="array-items-${index}">
                ${itemsHtml}
                <div class="row-actions">
                    <button class="add" onclick="addFileItem(${index})" data-tooltip="Добавить новый файл в список">Добавить</button>
                </div>
            </div>
        </div>
    `;
}




// Добавить новый элемент в массив
function addFileItem(paramIndex) {
	const param = editedParams[paramIndex];
	if (!Array.isArray(param.value)) param.value = [];
	param.value.push(''); //Добавить пустую строку
	updateParam(paramIndex, param.value, true);
}

// Обновить поле в объекте массива
function updateFileItem(paramIndex, itemIndex, value) {
	const param = editedParams[paramIndex];
	if (Array.isArray(param.value) && param.value[itemIndex]) {
		param.value[itemIndex] = value;
	}
}
// Обновить элемент массива
function loadFileToArray(paramIndex, itemIndex, input) {
	const file = input.files[0];
	if (!file) return;
	const reader = new FileReader();
	reader.onload = e => {
		const base64 = e.target.result;
		// Обрезаем прозрачные края
		trimTransparentEdges(base64, 512, 1, 1, trimmedBase64 => {
			const param = editedParams[paramIndex];
			param.value[itemIndex] = trimmedBase64;
			updateParam(paramIndex, param.value, true);
		});
	};
	reader.onerror = () => {
		alert('Failed to read file.');
	};
	reader.readAsDataURL(file);
}



//Функция позволяет редактировать массив объектов, где каждый элемент — JSON-строка:
// Форма для редактирования массива JSON-объектов
function renderJsonArray(param, index) {
	param.value = param.value || [];
	const items = Array.isArray(param.value) ? param.value : JSON.parse(param.value);
	const renderItem = (item, i) => {
		// Преобразуем объект в JSON-строку
		const jsonStr = typeof item === 'object' ? htmlspecialchars(JSON.stringify(item)) : item;

		return `
            <div class="array-item" data-index="${i}">
                <div class="array-item-head">
                    <div class="field-label">${param.fieldPath}[${i}]</div>
					<button class="remove-btn" onclick="removeArrayItem('${param.startFieldPath}', ${i})" data-tooltip="Удалить из списка">✕</button>
                </div>
                <div class="grid-in-object">
					<div class="field-control">
						<input type="text" class="text-input" placeholder="JSON" onchange="updateJsonItem(${index}, ${i}, this.value)" style="margin-bottom: 2px;" value="${jsonStr}" id="${param.fieldPath}-input-${i}">
						<div>
						<div class="iconButton" data-tooltip="Сохранить в файл"><img src="images/download.png" onclick="saveJsonToFile(${index}, ${i})"></div>
						<label class="fileInputLabel">
							<input type="file" class="fileInput" accept=".json" oninput="loadJsonFromFile(${index}, ${i}, this)">
							<div class="fileInputButton" data-tooltip="Открыть другой файл">Заменить</div>
						</label>
						</div>
					</div>
                </div>
            </div>
        `;
	};

	const itemsHtml = items.map((item, i) => renderItem(item, i)).join('');
	return `
        <strong>${param.fieldPath}</strong><br>
        <small>${param.comment}</small><br>
        <div class="field-control">
            <div class="array-items" id="array-items-${index}">
                ${itemsHtml}
                <div class="row-actions">
                    <button class="add" onclick="addJsonItem(${index})" data-tooltip="Добавить новый файл в список">Добавить</button>
                </div>
            </div>
        </div>
    `;
}


// Добавить пустой JSON-объект в массив
function addJsonItem(paramIndex) {
	const param = editedParams[paramIndex];
	if (!Array.isArray(param.value)) param.value = [];
	param.value.push({});
	updateParam(paramIndex, param.value, true);
}

// Обновить JSON-объект в массиве
function updateJsonItem(paramIndex, itemIndex, jsonString) {
	try {
		const parsed = JSON.parse(jsonString);
		const param = editedParams[paramIndex];
		if (Array.isArray(param.value) && param.value[itemIndex] !== undefined) {
			param.value[itemIndex] = parsed;
		}
	} catch (e) {
		console.error("Неверный JSON:", e);
		alert("Неверный формат JSON");
	}
}

// Загрузить JSON-объект из файла
function loadJsonFromFile(paramIndex, itemIndex, inputElement) {
	const file = inputElement.files[0];
	if (!file) return;
	const reader = new FileReader();
	reader.onload = function (e) {
		try {
			const parsed = JSON.parse(e.target.result);
			const param = editedParams[paramIndex];
			if (Array.isArray(param.value) && param.value[itemIndex] !== undefined) {
				param.value[itemIndex] = parsed;
				updateParam(paramIndex, param.value, true);
			}
		} catch (e) {
			console.error("Ошибка парсинга JSON из файла:", e);
			alert("Файл содержит неверный JSON.");
		}
	};
	reader.readAsText(file);
}

// Сохранить JSON-объект в файл
function saveJsonToFile(paramIndex, itemIndex) {
	const param = editedParams[paramIndex];
	if (!Array.isArray(param.value) || !param.value[itemIndex]) return;
	const dataStr = JSON.stringify(param.value[itemIndex], null, 2);
	const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
	const exportFileDefaultName = `${param.fieldPath}_${itemIndex}.json`;
	const linkElement = document.createElement('a');
	linkElement.setAttribute('href', dataUri);
	linkElement.setAttribute('download', exportFileDefaultName);
	linkElement.click();
}







const setOwnValueText = "< Указать свой >";
function renderStringList(param, path, objKey = null, placeholder = "", tooltip = "") {
	if (param.options) { //Показать список
		const fullPath = (Array.isArray(path)) ? path.join('.') : path;
		let selectHTML = `<select onchange="updateOptionParam('${fullPath}', this.value, '${objKey || ''}');" class="field-input" id="${fullPath}">`;
		if (!param.options.includes(setOwnValueText)) { param.options.unshift(""); param.options.unshift(setOwnValueText); }
		param.options.forEach(opt => {
			const isSelected = opt == param.value ? ' selected' : '';
			selectHTML += `<option value="${opt}"${isSelected}>${htmlspecialchars(opt == setOwnValueText ? tr(opt) : opt)}</option>`; //Показать перевод для setOwnValueText
		});
		selectHTML += '</select>';
		if (param.optionsValue == setOwnValueText || param.value == setOwnValueText || (param.value != "" && param.options.includes(param.value) == false)) {
			param.value = param.value.replace(setOwnValueText, '');
			param.optionsValue = setOwnValueText;
			placeholder = placeholder || param.placeholder || param.type;
			tooltip = tooltip || param.tooltip || "";
			const userInput = `<input type="text" value="${param.value}" onchange="updateUserOptionParam('${fullPath}', this.value, false)" placeholder="${placeholder}" data-tooltip="${tooltip}"></input>`;
			selectHTML = '<div style="display: grid;grid-template-columns: 1fr 2em; max-width: 10em;">' + userInput + selectHTML + '</div>';
		}
		return selectHTML;
	}
	console.warn('renderStringList: параметр не имеет списка значений, param.options == NULL');
	return '';
}

function updateOptionParam(path, value, objKey) {
	updateParam(path, value, true, objKey).optionsValue = value;
}

function updateUserOptionParam(path, value) {
	updateParam(path, value, false);
}



let cartridgeListParam = null; //Параметр со списком патронов записываем в отдельную переменную, чтобы убирать с экрана
function renderWeaponCartridge(param, index) {
	if ('options' in param) {
		let selectHTML = renderStringList(param, index, null, "Идентификатор патрона", "Укажите идентификатор патрона.<br>При загрузке оружия в игру, будет обнаружено, что оружие нуждается в патроне и игра попытается загрузить этот патрон по идентификатору. Нужно указать не калибр, а именно идентификатора вашего патрона.<br><br>Вам доступен список патронов <b>cartridgeList</b>.<br>Основной патрон можно сразу добавить в список и тогда патроны будут загружаться сразу вместе с оружием.");
		cartridgeListParam = editedParams.find(p => p.fieldPath == "cartridgeList") || availableParams.find(p => p.fieldPath == "cartridgeList") || sampleParams.find(p => p.fieldPath == "cartridgeList");
		const listIndex = editedParams.findIndex(p => p.fieldPath == "cartridgeList");
		if (param.optionsValue == setOwnValueText) {
			if (listIndex == -1 && cartridgeListParam) {
				editedParams.push(cartridgeListParam);
			}
		} else if (listIndex != -1) {
			cartridgeListParam = editedParams[listIndex];
			editedParams.splice(listIndex, 1);
		}
		return selectHTML;
	}
	alert("renderWeaponCartridge: параметр не имеет списка значений\n" + param.startFieldPath + '.options == NULL');
	return '';
}