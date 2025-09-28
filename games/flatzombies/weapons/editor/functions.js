
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
	const animations = Array.isArray(param.value) ? param.value : [];
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

	html += `
		</div>
		<div><button class="remove-btn" onclick="removeParam(${paramIndex})" data-tooltip="Удалить параметр">✕</button></div>`;

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
	const items = Array.isArray(param.value) ? param.value : [];
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
					<button class="itemremove" onclick="removeArrayItem(${index}, ${i})">Удалить</button>
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
	return `<button class="remove-btn" onclick="removeParam(${index})" data-tooltip="Удалить параметр">✕</button>
			<strong>${param.fieldPath}</strong><br>
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