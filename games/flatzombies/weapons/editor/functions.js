
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


//Работа с массивом изображений
//Показать список анимаций
function renderTextureListEditor(param, paramIndex) {
	const animations = Array.isArray(param.value) ? param.value : JSON.parse(param.value) || [];
	let html = `
		<div>
			<strong data-tooltip="${param.startFieldPath}">${param.displayName || param.fieldPath}</strong><br>
			<small>${param.comment || ''}</small>
		</div>
		<div class="animations-editor" data-param-index="${paramIndex}">
			<div class="animations-header" style="margin-bottom: 8px;">
				<strong>Анимации (${animations.length})</strong>
				<button type="button" class="add-animation-btn" onclick="addAnimation(${paramIndex})" style="font-size: 0.9em; padding: 2px 6px;">➕ Анимацию</button>
			</div>`;

	animations.forEach((anim, animIdx) => {
		const name = anim?.name || '';
		const frames = Array.isArray(anim?.frames) ? anim.frames : [];

		html += `
			<div class="animation-block" style="border: 1px solid var(--border-color); padding: 6px; margin: 4px 0; border-radius: 4px;">
				<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
					<input type="text" class="text-input" value="${name}" 
						placeholder="Имя анимации" 
						onchange="updateAnimationName(${paramIndex}, ${animIdx}, this.value)"
						style="flex: 1; margin-right: 6px; font-weight: bold;">
					<div>
						${animIdx > 0 ? `<button type="button" class="move-anim-btn" onclick="moveAnimation(${paramIndex}, ${animIdx}, -1)" style="width:24px;">↑</button>` : ''}
						${animIdx < animations.length - 1 ? `<button type="button" class="move-anim-btn" onclick="moveAnimation(${paramIndex}, ${animIdx}, 1)" style="width:24px;">↓</button>` : ''}
						<button type="button" class="remove-anim-btn" onclick="removeAnimation(${paramIndex}, ${animIdx})" style="width:24px;">✕</button>
					</div>
				</div>

				<div class="frames-list" style="margin-top: 6px;">`;

		frames.forEach((frame, frameIdx) => {
			const isNull = frame === null;
			const texture = isNull ? '' : (frame.texture || '');
			// Парсим pivot из строки вида "(0.4, 0.5)"
			let pivotX = 0.5, pivotY = 0.5;
			if (!isNull && frame.pivotPoint) {
				const [px, py] = parseVector(frame.pivotPoint);
				parseVector(frame.pivotPoint);
				pivotX = px || 0.5;
				pivotY = py || 0.5;
			}
			const ppu = isNull ? 100 : (frame.pixelPerUnit || 100);

			html += `
				<div class="frame-item">
					<!-- Превью -->
					<div class="animationPreview">
						${isNull ?
					`<div style="font-size: 0.8em; color: #888;">null</div>` :
					`<img src="${texture}" onerror="this.style.opacity='0.3'" style="max-width: 100%; max-height: 60px; object-fit: contain;">`
				}
					</div>

					<!-- Поля: PPU и Pivot (в стиле вашего UI) -->
					<div style="display: grid;grid-template-columns: 50% 50%;align-self: end;">
						${isNull ? `
							<button type="button" onclick="convertNullAnimationFrame(${paramIndex}, ${animIdx}, ${frameIdx})" style="font-size: 0.85em; padding: 2px 6px;">→ Заменить на изображение</button>
						` : `
							<!-- Texture input -->
							<div class="input-group" style="align-items: end;">
							<input type="text" class="text-input" value="${texture}" onchange="updateAnimationFrameField(${paramIndex}, ${animIdx}, ${frameIdx}, 'texture', this.value)" placeholder="data:file/type;base64,..." >
							<div class="iconButton" data-tooltip="<div style='text-align: center;'>Сохранить как PNG</div>" onclick="base64ToFile('${texture.replace(/'/g, "\\'")}', 'frame-${animIdx}-${frameIdx}.png')"><img src="images/download.png" ></div>
							<label class="fileInputLabel">
							<input type="file" class="fileInput" accept=".png" onchange="fileToBase64AnimationFrame(${paramIndex}, ${animIdx}, ${frameIdx}, this)">
							<div class="fileInputButton" data-tooltip="Открыть другой файл">Заменить</div>
							</label>
							</div>





							<!-- PPU и Pivot в стиле TextureSprite -->
							<div style="display: grid; grid-template-columns: 1fr 2fr; margin-left: 2px;">
								<div data-tooltip="Пикселей на единицу расстояния (Pixels Per Unit)" class="propertyBlock">
									<span class="title">PPU:</span>
									<input type="number" step="10" style="width:100%" value="${ppu}" min="1" max="5000"
										oninput="inputMinMax(this); updateAnimationFrameField(${paramIndex}, ${animIdx}, ${frameIdx}, 'pixelPerUnit', parseFloat(this.value))">
								</div>
								<div class="propertyBlock" data-tooltip="Точка вращения объекта">
									<span class="title">Pivot:</span>
									<div class="vector-fields">
										<input placeholder="X" type="number" step="0.02" style="width:100%" value="${pivotX}"
											onchange="updateAnimationFramePivot(${paramIndex}, ${animIdx}, ${frameIdx}, 0, this.value)">
										<input placeholder="Y" type="number" step="0.02" style="width:100%" value="${pivotY}"
											onchange="updateAnimationFramePivot(${paramIndex}, ${animIdx}, ${frameIdx}, 1, this.value)">
									</div>
								</div>
							</div>
						`}
					</div>

					<!-- Кнопки управления фреймом -->
					<div style="display: flex; flex-direction: column; gap: 2px;">
						<button type="button" class="remove-frame-btn" onclick="removeAnimationFrame(${paramIndex}, ${animIdx}, ${frameIdx})" style="width:20px; height:20px; font-size:12px;">✕</button>
						${frameIdx > 0 ? `<button type="button" onclick="moveAnimationFrame(${paramIndex}, ${animIdx}, ${frameIdx}, -1)" style="width:20px; height:20px; font-size:12px;">↑</button>` : `<div></div>`}
						${frameIdx < frames.length - 1 ? `<button type="button" onclick="moveAnimationFrame(${paramIndex}, ${animIdx}, ${frameIdx}, 1)" style="width:20px; height:20px; font-size:12px;">↓</button>` : `<div></div>`}
					</div>
				</div>`;
		});

		html += `
				<div style="margin-top: 6px; display: flex; gap: 6px;">
					<button type="button" onclick="addAnimationFrame(${paramIndex}, ${animIdx})" style="font-size: 0.85em; padding: 2px 6px;">➕ Фрейм</button>
					<button type="button" onclick="addNullAnimationFrame(${paramIndex}, ${animIdx})" style="font-size: 0.85em; padding: 2px 6px;">➕ Пустой</button>
				</div>
			</div>`;
	});

	html += `</div>`;

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

function addNullAnimationFrame(paramIndex, animIdx) {
	const param = editedParams[paramIndex];
	if (Array.isArray(param.value) && param.value[animIdx]?.frames) {
		param.value[animIdx].frames.push(null);
		forceRenderEditedParams();
	}
}

function removeAnimationFrame(paramIndex, animIdx, frameIdx) {
	const param = editedParams[paramIndex];
	if (Array.isArray(param.value) && param.value[animIdx]?.frames) {
		param.value[animIdx].frames.splice(frameIdx, 1);
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

// Обновление pivot через X/Y (аналог updateVector)
function updateAnimationFramePivot(paramIndex, animIdx, frameIdx, axis, value) {
	const param = editedParams[paramIndex];
	const frame = param.value?.[animIdx]?.frames?.[frameIdx];
	if (!frame || frame === null) return;

	const numValue = parseFloat(value);
	if (isNaN(numValue)) return;

	// Получаем текущий pivot
	let x = 0.5, y = 0.5;
	if (frame.pivotPoint) {
		const match = frame.pivotPoint.match(/\(([^,]+),\s*([^)]+)\)/);
		if (match) {
			x = parseFloat(match[1].trim()) || 0.5;
			y = parseFloat(match[2].trim()) || 0.5;
		}
	}

	// Обновляем нужную ось
	if (axis === 0) x = numValue;
	else if (axis === 1) y = numValue;

	// Форматируем как строку "(x, y)"
	frame.pivotPoint = `(${x}, ${y})`;
}





//Форма для редактирование списка материалов
function renderPhysicsMaterialMultiply(param, index, childFields) {
	const items = Array.isArray(param.value) ? param.value : JSON.parse(param.value) || [];
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
					<button class="remove-btn" onclick="removeArrayItem(${index}, ${i})" data-tooltip="Удалить из списка">✕</button>
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
					<div class="row-actions"><button data-tooltip="Добавить ещё один параметр<br>в список ${param.fieldPath}" class="add" onclick="addArrayItem(${index})">Добавить</button></div>
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
function removeArrayItem(paramIndex, itemIndex) {
	const param = editedParams[paramIndex];
	if (Array.isArray(param.value)) {
		param.value.splice(itemIndex, 1);
		updateParam(paramIndex, param.value, true);
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
	const items = Array.isArray(param.value) ? param.value : JSON.parse(param.value) || [];
	const renderItem = (item, i) => {
		const fieldsHtml = objectMetaData.map(fieldMeta => {
			const currentValue = item[fieldMeta.fieldPath] ?? fieldMeta.value;
			// Определение типа поля
			if (fieldMeta.type === 'string' && fieldMeta.options) {
				// Выпадающий список
				const optionsHtml = fieldMeta.options.map(opt =>
					`<option value="${opt}" ${opt === currentValue ? 'selected' : ''}>${opt}</option>`
				).join('');
				return `
                    <div class="field-row" data-tooltip="${fieldMeta.comment || ''}">
                        <div class="field-label">${fieldMeta.fieldPath}</div>
                        <div class="field-control">
                            <select onchange="updateArrayFieldByMeta(${index}, ${i}, '${fieldMeta.fieldPath}', this.value)" class="field-input">
                                ${optionsHtml}
                            </select>
                        </div>
                    </div>
                `;
			} else if (fieldMeta.type === 'int' || fieldMeta.type === 'float') {
				// Числовое поле
				const step = fieldMeta.type === 'float' ? '0.1' : '1';
				return `
                    <div class="field-row" data-tooltip="${fieldMeta.comment || ''}">
                        <div class="field-label">${fieldMeta.fieldPath}</div>
                        <div class="field-control">
                            <input type="${fieldMeta.type === 'int' ? 'number' : 'number'}" step="${step}" value="${currentValue}" class="field-input"
                                onchange="updateArrayFieldByMeta(${index}, ${i}, '${fieldMeta.fieldPath}', ${fieldMeta.type === 'int' ? 'parseInt' : 'parseFloat'}(this.value))">
                        </div>
                    </div>
                `;
			} else {
				// Обычное текстовое поле
				return `
                    <div class="field-row" data-tooltip="${fieldMeta.comment || ''}">
                        <div class="field-label">${fieldMeta.fieldPath}</div>
                        <div class="field-control">
                            <input type="text" value="${currentValue}" class="field-input"
                                onchange="updateArrayFieldByMeta(${index}, ${i}, '${fieldMeta.fieldPath}', this.value)">
                        </div>
                    </div>
                `;
			}
		}).join('');

		return `
            <div class="array-item" data-index="${i}">
                <div class="array-item-head">
                    <div class="array-item-title">${param.fieldPath}[${i}]</div>
					<button class="remove-btn" onclick="removeArrayItem(${index}, ${i})" data-tooltip="Удалить из списка">✕</button>
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
                    <button data-tooltip="Добавить ещё один параметр<br>в список ${param.fieldPath}" class="add" onclick="addArrayItemByMeta(${index})">Добавить</button>
                </div>
            </div>
        </div>
    `;
}

// Добавить новый элемент в массив
function addArrayItemByMeta(paramIndex) {
	const param = editedParams[paramIndex];
	if (!Array.isArray(param.value)) param.value = [];
	if (Array.isArray(param.objectMetaData)) {
		const newItem = {};
		param.objectMetaData.forEach(field => {
			newItem[field.fieldPath] = field.value;
		});
		param.value.push(newItem);
	} else {
		param.value.push(''); //Добавить пустую строку
	}
	updateParam(paramIndex, param.value, true);
}

// Удалить элемент по индексу
function removeArrayItem(paramIndex, itemIndex) {
	const param = editedParams[paramIndex];
	if (Array.isArray(param.value)) {
		param.value.splice(itemIndex, 1);
		updateParam(paramIndex, param.value, true);
	}
}

// Обновить поле в объекте массива
function updateArrayFieldByMeta(paramIndex, itemIndex, field, value) {
	const param = editedParams[paramIndex];
	if (Array.isArray(param.value) && param.value[itemIndex]) {
		param.value[itemIndex][field] = value;
	}
}








function renderFileArray(param, index, fileType = ".png") {
	const items = Array.isArray(param.value) ? param.value : JSON.parse(param.value) || [];
	const renderItem = (itemValue, i) => {

		return `
            <div class="array-item" data-index="${i}">
                <div class="array-item-head">
                    <div class="field-label">${param.fieldPath}[${i}]</div>
					<button class="remove-btn" onclick="removeArrayItem(${index}, ${i})" data-tooltip="Удалить из списка">✕</button>
                </div>
                <div class="grid-in-object">
					<div class="field-control">
						<input type="text" class="text-input" placeholder="data:file/type;base64,..." onchange="updateFileItem(${index}, ${i}, this.value)" style="margin-bottom: 2px;" value="${itemValue}" id="${param.fieldPath}-input-${i}">
						<div class="iconButton" data-tooltip="Сохранить в файл">
							<img src="images/download.png" onclick="saveArrayItemToFile(${index}, ${i})">
						</div>
						<label class="fileInputLabel">
							<input type="file" class="fileInput" ${fileType ? `accept="${fileType}"` : ''} onchange="loadFileToArray(${index}, ${i}, this)">
							<div class="fileInputButton" data-tooltip="Открыть другой файл">Заменить</div>
						</label>
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
	const items = Array.isArray(param.value) ? param.value : JSON.parse(param.value) || [];
	const renderItem = (item, i) => {
		// Преобразуем объект в JSON-строку
		const jsonStr = typeof item === 'object' ? htmlspecialchars(JSON.stringify(item)) : item;

		return `
            <div class="array-item" data-index="${i}">
                <div class="array-item-head">
                    <div class="field-label">${param.fieldPath}[${i}]</div>
					<button class="remove-btn" onclick="removeArrayItem(${index}, ${i})" data-tooltip="Удалить из списка">✕</button>
                </div>
                <div class="grid-in-object">
					<div class="field-control">
						<input type="text" class="text-input" placeholder="JSON" onchange="updateJsonItem(${index}, ${i}, this.value)" style="margin-bottom: 2px;" value="${jsonStr}" id="${param.fieldPath}-input-${i}">
						<div class="iconButton" data-tooltip="Сохранить в файл">
							<img src="images/download.png" onclick="saveJsonToFile(${index}, ${i})">
						</div>
						<label class="fileInputLabel">
							<input type="file" class="fileInput" accept=".json" onchange="loadJsonFromFile(${index}, ${i}, this)">
							<div class="fileInputButton" data-tooltip="Открыть другой файл">Заменить</div>
						</label>
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








function renderStringList(param, index, objKey = null) {
	if (param.options) { //Показать список
		let selectHTML = `<select onchange="updateParam(${index}, this.value, true, '${objKey || ''}');" class="field-input">`;
		if (!param.options.includes("< Указать свой >")) { param.options.unshift("< Указать свой >"); }
		param.options.forEach(opt => {
			const isSelected = opt == param.value ? ' selected' : '';
			selectHTML += `<option value="${opt}"${isSelected}>${htmlspecialchars(opt)}</option>`;
		});
		selectHTML += '</select>';
		return selectHTML;
	}
	console.warn('renderStringList: параметр не имеет списка значений, param.options == NULL');
	return '';
}







let cartridgeListParam = null; //Параметр со списком патронов записываем в отдельную переменную, чтобы убирать с экрана
const setOwnValueText = "< Указать свой >";
function renderWeaponCartridge(param, index) {
	if ('options' in param) {
		if (!param.options.includes(setOwnValueText)) { param.options.unshift(setOwnValueText); }
		let selectHTML = renderStringList(param, index);
		cartridgeListParam = editedParams.find(p => p.fieldPath == "cartridgeList") || availableParams.find(p => p.fieldPath == "cartridgeList") || sampleParams.find(p => p.fieldPath == "cartridgeList");
		const listIndex = editedParams.findIndex(p => p.fieldPath == "cartridgeList");
		if (param.options.indexOf(param.value) <= 0) {
			param.value = param.value.replace(setOwnValueText, '');
			selectHTML += `<br><input type="text" placeholder="Идентификатор патрона" value="${param.value}" data-tooltip="Укажите идентификатор патрона.<br>При загрузке оружия в игру, будет обнаружено, что оружие нуждается в патроне и игра попытается загрузить этот патрон по идентификатору. Нужно указать не калибр, а именно идентификатора вашего патрона.<br><br>Вам доступен список патронов <b>cartridgeList</b>.<br>Основной патрон можно сразу добавить в список и тогда патроны будут загружаться сразу вместе с оружием." onchange="updateParam(${index}, this.value, false)" id="${param.fieldPath}"></input>`;
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