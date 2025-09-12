document.addEventListener("DOMContentLoaded", onLoaded);
//Подготовка данных
let templateInput = null;
let selectedWeapon = null; //Выбранный шаблон для нового оружия
function onLoaded() {
	//Вырезать из параметров приставки из массива prefixHide
	sampleParams.forEach(element => {
		element.startFieldPath = element.fieldPath;
		prefixHide.forEach(prefix => {  //weapon.RifleWithMagazine.beltFeeder => beltFeeder
			if (element.fieldPath.startsWith(prefix)) {
				element.fieldPath = element.fieldPath.replace(prefix, "");
				element.comment = element.comment.replace(/\n/g, "<br>");
				return;
			}
		});
	});

	sampleParams = sampleParams.filter((obj, index, self) => index === self.findIndex(item => item.fieldPath === obj.fieldPath));
	weapons.forEach(rifle => {
		var weaponKeys = Object.keys(rifle);
		weaponKeys.forEach(fieldPath => {
			prefixHide.forEach(prefix => { //weapon.RifleWithMagazine.beltFeeder => beltFeeder
				if (fieldPath.startsWith(prefix)) {
					Object.defineProperty(rifle, fieldPath.replace(prefix, ""), Object.getOwnPropertyDescriptor(rifle, fieldPath));
					return;
				}
			});
		});
	});

	document.getElementById("loading").remove();
	document.getElementById("startFields").classList.remove('hidden');
	document.getElementById("buttonPanel").classList.remove('hidden');
	templateInput = document.getElementById("idTemplate"); // Удаляем все существующие <option>
	templateInput.addEventListener('input', onSelectWeapon);
	// Заполняем <select> новыми опциями из массива weapons
	weapons.forEach(weapon => {
		const option = document.createElement("option");
		option.value = weapon["name"]; // Используем значение weapon.name как value
		option.textContent = weaponFullNames.find(rifle => rifle[0] == weapon["name"])?.[1] || weapon["name"]; // Отображаемое имя
		templateInput.appendChild(option);
	});
}

//ПАНЕЛИ
const leftPanel = document.getElementById("leftPanel");
const rightPanel = document.getElementById("rightPanel");

// ——— ОБНОВИТЬ СПИСОК ПАРАМЕТРОВ ПРИ ВЫБОРЕ ОРУЖИЯ
function onSelectWeapon(event) {
	lastParentPosition.x = -0.55; lastParentPosition.y = 0;
	leftPanel.style.display = 'flex';
	rightPanel.style.display = 'flex';
	selectedWeapon = weapons.find(item => item["name"] == event.target.value); //event.target == templateInput 
	availableParams.length = 0;
	availableParams = availableParams.concat(baseParams);
	editedParams.length = 0;
	sampleParams.forEach(field => { //Добавить параметры, которые есть у оружия
		if (selectedWeapon.hasOwnProperty(field.fieldPath)) {
			field.value = selectedWeapon[field.fieldPath];
			availableParams.push(field);
		}
	});
	sampleParams.forEach(field => { //Добавить параметры, которые являются дочерним к параметру из availableParams
		if (availableParams.findIndex(param => field.fieldPath.startsWith(param.fieldPath + ".")) != -1) {
			availableParams.push(field);
		}
	});

	renderAvailableParams();//Обновить список
	//Добавить спрайты сразу в список
	availableParams.forEach(field => {
		const filter = defaultAddedFields.filter(data => field.fieldPath.endsWith(data[0]));
		if (filter.length != 0 && filter.findIndex(data => field.value == data[1]) == -1) {
			addParam(field.fieldPath, false);
		}
	});
	//Отсортировать массив editedParams так, чтобы все параметры с type === 'Sprite' шли в начале списка
	editedParams.sort((a, b) => (b.type === 'Sprite') - (a.type === 'Sprite'));
}

sampleParams = baseParams.concat(sampleParams);
let availableParams = new Array();
let editedParams = new Array();

// ——— UTILS ———
function parseVector(value) {
	if (!value) return [0, 0, 0];
	const arr = value.replace(/[\(\)]/g, '').split(',').map(v => parseFloat(v.trim()) || 0);
	while (arr.length < 3) arr.push(0);
	return arr;
}

function getParamByFieldPath(fieldPath) {
	fieldPath = fieldPath.trim();
	return editedParams.find(p => p.fieldPath === fieldPath || p.startFieldPath === fieldPath);
}

function convertTo180(angle) {
	return ((angle + 180) % 360 + 360) % 360 - 180;
}

function getPrefix(fieldPath) { //parent.child.SpriteRenderer.sprite => parent.child
	if (fieldPath === 'SpriteRenderer.sprite') return '';
	const match = fieldPath.match(/^(.+)\.SpriteRenderer\.sprite$/);
	return match ? match[1] : null;
}

function getObjectNameFromFieldPath(fieldPath) {
	const prefix = getPrefix(fieldPath.trim());
	return prefix || 'sprite';
}

// ——— ПРОВЕРКА BASE64 ———
function isValidBase64Image(data) {
	if (typeof data !== 'string') return false;
	// Проверяем, что строка — data URL с изображением
	const match = data.match(/^data:image\/(png|jpeg|jpg|gif);base64,(.*)$/);
	return match && match[2].length > 100; // базовая проверка длины
}

// ——— ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ UI ———
const fileType = []; fileType["TextFile"] = ""; fileType["AudioClip"] = ".wav"; fileType["Sprite"] = ".png"; fileType["Image"] = ".png";
function getInputForType(param, index = -1) {
	if (index = -1) index = editedParams.findIndex(field => field.fieldPath == param.fieldPath);
	if (param.type in fileType) { // Проверяем, является ли тип файловым (присутствует в fileType)
		const ext = fileType[param.type]; const accept = ext ? ext : undefined; // можно оставить пустым для TextFile
		return `<input type="text" class="text-input" value="${param.value || ''}" onchange="updateParam(${index}, this.value)" placeholder="data:file/type;base64,..." style="margin-bottom: 2px;">
		<div class="iconButton" data-tooltip="Сохранить в файл" onclick="base64ToFile('${param.value}', '${templateInput.value + "-" + param.fieldPath + ext}')"><img src="images/download.png" ></div>
		<label class="fileInputLabel"><input type="file" class="fileInput" ${accept ? `accept="${accept}"` : ''} onchange="fileToBase64(${index}, this)">
				<div class="fileInputButton" data-tooltip="Открыть другой файл">Заменить</div></label>`;
	}
	if (param.options) { //Показать список
		let selectHTML = `<select onchange="updateParam(${index}, this.value)">`;
		param.options.forEach(opt => {
			const isSelected = opt == param.value ? ' selected' : '';
			selectHTML += `<option value="${opt}"${isSelected}>${opt}</option>`;
		});
		selectHTML += '</select>';
		return selectHTML;
	}
	switch (param.type) {
		case 'Vector2':
			const v2 = parseVector(param.value);
			return `<div style="display: grid; grid-template-columns: 50% 50%; max-width: 20em;" >
				<span style="font-size:12px; display: grid; grid-template-columns: 30% 70%; align-items: center;"><span style="text-align: center;">X:</span>
                <input type="number" step="0.01" value="${v2[0]}" onchange="updateVector(${index}, 0, this.value)" style="width: 100%;">
                </span>
				<span style="font-size:12px; display: grid; grid-template-columns: 30% 70%; align-items: center;"><span style="text-align: center;">Y:</span>
                <input type="number" step="0.01" value="${v2[1]}" onchange="updateVector(${index}, 1, this.value)" style="width: 100%;">
                </span>
				</div>`;
		case 'Vector3':
			const v3 = parseVector(param.value);
			return `<div style="display: grid; grid-template-columns: 33% 33% 33%; max-width: 20em;" >
				<span style="font-size:12px; display: grid; grid-template-columns: 30% 70%; align-items: center;"><span style="text-align: center;">X:</span>
                <input type="number" step="0.01" value="${v3[0]}" onchange="updateVector(${index}, 0, this.value)" style="width: 100%;">
                </span>
				<span style="font-size:12px; display: grid; grid-template-columns: 30% 70%; align-items: center;"><span style="text-align: center;">Y:</span>
                <input type="number" step="0.01" value="${v3[1]}" onchange="updateVector(${index}, 1, this.value)" style="width: 100%;">
                </span>
				<span style="font-size:12px; display: grid; grid-template-columns: 30% 70%; align-items: center;"><span style="text-align: center;">Z:</span>
                <input type="number" step="0.01" value="${v3[2]}" onchange="updateVector(${index}, 2, this.value)" style="width: 100%;">
                </span>
				</div>`;
		case 'float':
		case 'number':
		case 'int':
			return `<input type="number" value="${param.value}" onchange="updateParam(${index}, this.value)" id="${param.fieldPath}">`;
		case 'bool':
			return `<input type="checkbox" ${(param.value === 'true' || param.value) ? 'checked' : ''} onchange="updateParam(${index}, this.checked ? true : false)">`;
		case 'WeaponCartridge[]':
		case 'AudioClip[]':
		case 'Sprite[]':
			return `<small>Массив объектов в формате JSON:</small><textarea onchange="updateParam(${index}, this.value)" title="${tooltip}">${htmlspecialchars(JSON.stringify(param.value, null, 2))}</textarea>`;
		default:
			return `<input type="text" value="${param.value}" onchange="updateParam(${index}, this.value)">`;
	}
}



function htmlspecialchars(str) {
	if (typeof str !== 'string') return str; // Если не строка, возвращаем как есть
	return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// ——— СИНХРОНИЗАЦИЯ В СЦЕНУ, из параметров в sceneObjects ———
function syncParamsToScene() {
	sceneObjects.length = 0;
	const processedNames = new Set();
	editedParams.filter(p => p.type === 'Sprite').forEach(param => {
		const fieldPath = param.fieldPath;
		const prefix = getPrefix(fieldPath);
		let parentName = prefix?.includes('.') ? prefix.split('.').slice(0, -1).join('.') : '';
		let name = prefix || 'sprite';
		if (prefix?.includes('.')) name = prefix.split('.').pop();
		if (!parentName && name != 'sprite') parentName = 'sprite';
		let uniqueName = name;
		let counter = 1;
		while (processedNames.has(uniqueName)) {
			uniqueName = `${name}_${counter++}`;
		}
		processedNames.add(uniqueName);
		const getValue = (suffix, defaultValue = '') => {
			const fp = (prefix ? prefix + '.' : '') + suffix;
			const p = getParamByFieldPath(fp);
			return (p) ? p.value : defaultValue;
		};
		const localPosStr = getValue('Transform.localPosition', '(0,0,0)');
		const pivotStr = getValue('SpriteRenderer.sprite.pivotPoint', '(0.5,0.5)');
		const ppuStr = getValue('SpriteRenderer.sprite.pixelPerUnit', '100');
		const angleStr = getValue('Transform.localEulerAngles.z', '0');
		const sortingOrderStr = getValue('SpriteRenderer.sortingOrder', 0);
		const enabledStr = getValue('SpriteRenderer.enabled', true);
		const gameObjectIsActive = getValue('gameObject.SetActive', true);
		const [lx, ly] = parseVector(localPosStr);
		const [px, py] = parseVector(pivotStr);
		const angle = convertTo180(parseFloat(angleStr) || 0);
		sceneObjects.push({
			name: uniqueName,
			parent: parentName,
			texture: param.value,
			localPosition: { x: parseFloat(lx), y: -parseFloat(ly) }, //отразить по оси Y
			localAngle: angle,
			sortingOrder: sortingOrderStr,
			pixelPerUnit: parseFloat(ppuStr) || 100,
			pivotPoint: { x: px, y: py },
			enabled: enabledStr,
			isActive: gameObjectIsActive,
			canChangePivot: true,
			canChangeLocalAngle: true,
			parameter: param.startFieldPath
		});
	});

	// Обработка Vector2/Vector3 (как точки)
	editedParams.filter(p => (p.type === 'Vector2' || p.type === 'Vector3') && p.spritePreview).forEach(param => {
		let [x, y] = parseVector(param.value || '(0.4,0.6,0)'); y = -y;  //отразить по оси Y
		x = parseFloat(x); y = parseFloat(y);
		sceneObjects.push({
			name: param.spriteName || param.fieldPath, //Пытаемся использовать имя
			parent: getPointField(param.fieldPath, 'parent')?.value || 'sprite',
			texture: param.spritePreview || 'images/point.png',
			localPosition: { x, y },
			localAngle: convertTo180(parseFloat(getPointField(param.fieldPath, 'angle')?.value) || 0),
			sortingOrder: param.sortingOrder || 1000,  // Чтобы точки были поверх других объектов
			pixelPerUnit: param.spritePixelPerUnit || 200,
			pivotPoint: param.spritePivotPoint || { x: 0.5, y: 0.5 }, // Центр круга
			enabled: param.hasOwnProperty('enabled') ? param.enabled : true,
			isActive: param.hasOwnProperty('isActive') ? param.isActive : true,
			canChangePivot: false,
			canChangeLocalAngle: editedPoint.findIndex(p => (param.fieldPath === p.name || param.fieldPath.endsWith(p.name)) && p.angle) != -1,
			parameter: param.startFieldPath
		});
	});




	// Перезагрузка кэша с изображениями
	if (typeof preloadImages === 'function') {
		preloadImages();
		refreshHierarchy();
		renderScene();
	}
}

function getPointField(fieldPath, property) {
	let reference = editedPoint.find(p => fieldPath === p.name || fieldPath.endsWith(p.name)); // "shellDrop.position".endsWith(".position")
	if (!reference) return null;
	fieldPath = fieldPath.replace(reference.name, reference[property]); //shellDrop.position => shellDrop.angle
	return editedParams.find(p => p.fieldPath === fieldPath || p.startFieldPath === fieldPath);
}



// ——— СИНХРОНИЗАЦИЯ ИЗ sceneObjects В ПАРАМЕТРЫ ———
document.getElementById('scene').addEventListener('mouseup', scheduleSync); //Синхронизация при отпускании мыши, когда перемещение обънета завершено
document.getElementById('propName').addEventListener('input', scheduleSync);
document.getElementById('propPosX').addEventListener('input', scheduleSync);
document.getElementById('propPosY').addEventListener('input', scheduleSync);
document.getElementById('propSortingOrder').addEventListener('input', scheduleSync);
document.getElementById('propAngle').addEventListener('input', scheduleSync);
document.getElementById('propAngleSlider').addEventListener('input', scheduleSync);
document.getElementById('propPixelsPerUnit').addEventListener('input', scheduleSync);
document.getElementById('propPivotX').addEventListener('input', scheduleSync);
document.getElementById('propPivotY').addEventListener('input', scheduleSync);
document.getElementById('propTexture').addEventListener('input', scheduleSync);
document.getElementById('propRenderEnabled').addEventListener('input', scheduleSync);
document.getElementById('sceneFileInput').addEventListener('input', scheduleSync);

// Подписываемся на события мыши с debounce
let syncTimeout;
function scheduleSync() {
	clearTimeout(syncTimeout);
	syncTimeout = setTimeout(syncAllSceneObjectsToParams, 200);
}
function syncAllSceneObjectsToParams() {
	if (!sceneObjects) return;
	sceneObjects.forEach(obj => { syncSceneObjectToParams(obj); });
}

// ПЕРЕНОС ДАННЫХ ИЗ СЦЕНЫ в список параметров
// Функция синхронизации одного объекта
function syncSceneObjectToParams(obj) {
	if (!obj) return;
	const prefix = obj.name === 'sprite' ? '' : obj.name;
	// Синхронизация текстуры
	const spritePath = prefix ? `${prefix}.SpriteRenderer.sprite` : 'SpriteRenderer.sprite';
	const spriteParam = getParamByFieldPath(spritePath);
	if (spriteParam && spriteParam.value !== obj.texture) {
		spriteParam.value = obj.texture;
	}
	// Синхронизация позиции
	if (prefix) {
		const posPath = `${prefix}.Transform.localPosition`;
		const posParam = getParamByFieldPath(posPath);
		const newPosValue = `(${parseFloat(obj.localPosition.x).toFixed(3)}, ${-parseFloat(obj.localPosition.y).toFixed(3)}, 0)`; //отразить по оси Y
		if (posParam && posParam.value !== newPosValue) {
			posParam.value = newPosValue;
		}
		//Синхронизация отдельной точки
		const pointParam = getParamByFieldPath(obj.parameter);
		if (pointParam.spritePreview) {
			const newPointValue = `(${parseFloat(obj.localPosition.x).toFixed(3)}, ${-parseFloat(obj.localPosition.y).toFixed(3)}, 0)`;  //отразить по оси Y
			if (pointParam && pointParam.value !== newPointValue) {
				pointParam.value = newPointValue;
			}
		}
	}
	// Синхронизация угла поворота
	const angleParam = getParamByFieldPath(prefix ? `${prefix}.Transform.localEulerAngles.z` : 'Transform.localEulerAngles.z');
	if (angleParam && angleParam.value != obj.localAngle) angleParam.value = obj.localAngle;
	const pointAngleParam = getPointField(obj.parameter, 'angle'); //Точка с углом поворота
	console.log(obj.parameter);
	if (pointAngleParam) pointAngleParam.value = obj.localAngle;
	// Синхронизация точки опоры
	const pivotParam = getParamByFieldPath(prefix ? `${prefix}.SpriteRenderer.sprite.pivotPoint` : 'SpriteRenderer.sprite.pivotPoint');
	const newPivotValue = `(${parseFloat(obj.pivotPoint.x).toFixed(3)}, ${parseFloat(obj.pivotPoint.y).toFixed(3)})`;
	if (pivotParam && pivotParam.value !== newPivotValue) { pivotParam.value = newPivotValue; }
	// Синхронизация PPU
	const ppuParam = getParamByFieldPath(prefix ? `${prefix}.SpriteRenderer.sprite.pixelPerUnit` : 'SpriteRenderer.sprite.pixelPerUnit');
	if (ppuParam && ppuParam.value != obj.pixelPerUnit) { ppuParam.value = obj.pixelPerUnit; }
	// Синхронизация порядка отрисовки
	const sortParam = getParamByFieldPath(prefix ? `${prefix}.SpriteRenderer.sortingOrder` : 'SpriteRenderer.sortingOrder');
	if (sortParam && sortParam.value != obj.sortingOrder) { sortParam.value = obj.sortingOrder; }
	// Синхронизация рендера
	const enabledParam = getParamByFieldPath(prefix ? `${prefix}.SpriteRenderer.enabled` : 'SpriteRenderer.enabled');
	if (enabledParam && enabledParam.value !== obj.enabled) { enabledParam.value = obj.enabled; }
	const gameObjectEnabled = getParamByFieldPath(prefix ? `${prefix}.gameObject.SetActive` : 'gameObject.SetActive');
	if (gameObjectEnabled && gameObjectEnabled.value !== obj.isActive) { gameObjectEnabled.value = obj.isActive; }
	//Показать изменения на странице
	renderEditedParams();
}






// ——— ДОБАВЛЕНИЕ ПАРАМЕТРА ———
function addParam(fieldPath, addAsFirst = true) {
	if (editedParams.some(p => p.fieldPath === fieldPath)) return;
	const param = availableParams.find(p => p.fieldPath === fieldPath);
	if (!param) return;
	// Добавляем основной параметр
	if (addAsFirst) { editedParams.unshift(param); } else { editedParams.push(param); }
	// Проверяем, есть ли зависимости для типа параметра
	const dependencies = typeDependencies[param.type] || typeDependencies[param.startFieldPath] || [];
	const prefix = getPrefix(fieldPath);// Если тип Sprite — добавляем дополнительную зависимость при наличии префикса
	if (param.type === 'Sprite' && prefix) dependencies.push('Transform.localPosition');
	editedPoint.forEach(p => {
		if (fieldPath.endsWith(p.name)) { // "shellDrop.position".endsWith(".position")
			dependencies.push(fieldPath.replace(p.name, p.angle)); // shellDrop.position => shellDrop.angle
			return;
		}
	});
	const spliceIndex = (addAsFirst) ? 1 : editedParams.length;
	dependencies.forEach(depFieldPath => {	// Обрабатываем все зависимости
		const fullPath = (prefix ? prefix + '.' : '') + depFieldPath;
		const sample = sampleParams.find(p => p.fieldPath === fullPath);
		if (!editedParams.find(p => p.fieldPath === fullPath) && sample) {// Проверяем, что параметр ещё не добавлен и существует в sampleParams
			editedParams.splice(spliceIndex, 0, structuredClone(sample));
		}
	});
	renderAvailableParams(document.getElementById('searchInput').value);
	renderEditedParams();
	syncParamsToScene();
}

// ——— ДОБАВЛЕНИЕ ПАРАМЕТРА ———
function createParam() {
	closeAddNewField();
	const newFieldPath = document.getElementById('newFieldPath');
	const newFieldValue = document.getElementById('newFieldValue');
	if (!newFieldPath.value) return;
	editedParams.unshift({ "fieldPath": newFieldPath.value, "comment": "", "type": "string", "value": newFieldValue.value });
	newFieldPath.value = ''; newFieldValue.value = '';
	renderEditedParams();
}

// ——— УДАЛЕНИЕ ПАРАМЕТРА ———
function removeParam(index) {
	const param = editedParams[index];
	const confirmed = confirm("Удалить параметр из списка?\nЕсли параметр не будет указан, то он будет взят из оружия " + templateInput.value + "\n" + param.fieldPath); // Показываем диалог подтверждения
	if (!confirmed) return; // Если пользователь нажал "Отмена", ничего не делаем
	const prefix = getPrefix(param.fieldPath);
	const typeDeps = typeDependencies[param.type] || [];
	const basePaths = new Set();
	basePaths.add(param.fieldPath);// Добавляем основной путь
	typeDeps.forEach(dep => {// Добавляем зависимости с префиксом
		const fullPath = (prefix ? prefix + '.' : '') + dep;
		basePaths.add(fullPath);
	});
	// Специфичное поведение для типа 'Sprite' — добавляем Transform.localPosition при наличии префикса
	if (param.type === 'Sprite' && prefix) { basePaths.add(prefix + '.Transform.localPosition'); }
	for (let i = editedParams.length - 1; i >= 0; i--) {// Обходим в обратном порядке, чтобы splice не ломал индексы
		if (basePaths.has(editedParams[i].fieldPath)) {// Удаляем все параметры, чей fieldPath входит в basePaths
			console.log("removeParam: " + editedParams[i].fieldPath);
			editedParams.splice(i, 1);
		}
	}
	renderAvailableParams(document.getElementById('searchInput').value);
	renderEditedParams();
	syncParamsToScene();
}

// ——— ОТОБРАЖЕНИЕ ДОСТУПНЫХ ПАРАМЕТРОВ ———
function renderAvailableParams(filter = '') {
	const list = document.getElementById('availableParamsList'); list.innerHTML = '';
	availableParams.filter(param => {// Фильтр по поиску
		const matchesSearch = (filter != '') ? param.fieldPath.toLowerCase().includes(filter.toLowerCase()) || (param.comment || '').toLowerCase().includes(filter.toLowerCase()) || param.type.toLowerCase().includes(filter.toLowerCase()) : true;
		const isAdded = !!getParamByFieldPath(param.fieldPath);// Проверяем, добавлен ли параметр
		return matchesSearch && !isAdded;// Исключаем ВСЕ добавленные параметры из списка
	}).forEach(param => {
		const li = document.createElement('li');
		li.style = "position: relative;";
		li.innerHTML = `
				<button onclick="addParam('${param.fieldPath}')" class="add">Добавить</button>
                <div ><span class="fieldpath">${param.fieldPath}</span> 
				<br>
				<small class="fieldcomment">${param.comment || ''}</small>
				<br><small class="fieldtype">${param.type}</small><br>
				</div>
				
            `;
		list.appendChild(li);
	});
}

// ——— ОТОБРАЖЕНИЕ РЕДАКТИРУЕМЫХ ПАРАМЕТРОВ ———
let renderTimeout;
function renderEditedParams(filter = '') { //Задержка перед рендером
	clearTimeout(renderTimeout);
	renderTimeout = setTimeout(forceRenderEditedParams, 100, filter);
}
function forceRenderEditedParams(filter = '') {
	const processed = new Set();
	const hiddenPaths = new Set(); // Чтобы не рендерить повторно параметры из группы
	const list = document.getElementById('editedParamsList'); list.innerHTML = '';
	editedParams.forEach((param, idx) => {
		if (filter != '') { //Поиск среди параметров
			const matchesSearch = param.fieldPath.toLowerCase().includes(filter.toLowerCase()) || (param.comment || '').toLowerCase().includes(filter.toLowerCase()) || param.type.toLowerCase().includes(filter.toLowerCase());
			if (!matchesSearch) { return; }
		}
		if (processed.has(param.fieldPath)) return;
		if (typeDependencies[param.type]) {
			const typeDeps = typeDependencies[param.type] || [];
			const prefix = getPrefix(param.fieldPath);//const name = prefix || 'sprite';
			const groupPaths = new Array();
			typeDeps.forEach(dep => groupPaths.push((prefix ? prefix + '.' : '') + dep));
			if (prefix) groupPaths.push(prefix + '.Transform.localPosition');
			groupPaths.push(param.fieldPath);
			// Помечаем все пути группы как обработанные
			groupPaths.forEach(fp => processed.add(fp));
			groupPaths.forEach(fp => hiddenPaths.add(fp));
			if (param.type === 'Sprite') {
				// Находим индексы параметров группы
				const pivotIdx = editedParams.findIndex(p => p.fieldPath === groupPaths[0]);
				const ppuIdx = editedParams.findIndex(p => p.fieldPath === groupPaths[1]);
				const sortIdx = editedParams.findIndex(p => p.fieldPath === groupPaths[2]);
				const angleIdx = editedParams.findIndex(p => p.fieldPath === groupPaths[3]);
				const enabledIdx = editedParams.findIndex(p => p.fieldPath === groupPaths[4]);
				const activeIdx = editedParams.findIndex(p => p.fieldPath === groupPaths[5]);
				const posIdx = prefix ? editedParams.findIndex(p => p.fieldPath === prefix + '.Transform.localPosition') : -1;
				const li = document.createElement('li');
				li.onmouseenter = () => selectObjectByName(prefix);
				li.className = 'param-group-block';
				li.innerHTML = ` ${prefix ? `<button class="remove-btn" onclick="removeParam(${idx})" data-tooltip="Удалить параметр">✕</button>` : ''}
                <strong>${param.fieldPath.replace('.SpriteRenderer.sprite', '<span style="color: var(--text-suffix);">.SpriteRenderer.sprite</span>')}</strong><br>
                <small>${param.comment || ''}</small><br>
                <div style="margin-top:6px;display: grid;grid-template-columns: 65% 35%;place-items: self-end;row-gap: 10px;">
                    <div style="flex:1; width:100%;">
                        <div class="input-group">
                            <input type="text" class="text-input" value="${param.value || ''}" onchange="updateParam(${idx}, this.value)" placeholder="image/png;base64,...">
							<div class="iconButton" data-tooltip="Сохранить как PNG-файл" onclick="base64ToFile('${param.value}', '${templateInput.value + "-" + prefix}.png')"><img src="images/download.png" ></div>
							<label class="fileInputLabel">
                                <input type="file" class="fileInput" accept=".png" onchange="fileToBase64(${idx}, this)">
                                <div class="fileInputButton" data-tooltip="Выбрать другой PNG-файл">Заменить</div>
                            </label>
                        </div>
                    </div>
                    ${pivotIdx >= 0 ? `<div class="vector-input">
                            <span style="font-size:11px;" >Pivot:</span>
                            <span data-tooltip="Точка вращения объекта">
							<input type="number" step="0.02" style="width:5em;" value="${parseVector(editedParams[pivotIdx].value)[0]}"
                                   onchange="updateVector(${pivotIdx}, 0, this.value)">
                            <input type="number" step="0.02" style="width:5em;" value="${parseVector(editedParams[pivotIdx].value)[1]}" 
                                   onchange="updateVector(${pivotIdx}, 1, this.value)">
							</span>
                        </div>` : ''}

                    <span style="display: grid;grid-template-columns: 8% 8% 28% 28% 28%; ustify-content:end; place-items:end; justify-items:end; width:100%; ">

						<div data-tooltip="Показать/скрыть рендер при загрузке в игру\nobject.SpriteRenderer.enabled = false/true;">
						${enabledIdx != -1 ? getInputForType(editedParams[enabledIdx], enabledIdx) : ''}
						</div>

						<div data-tooltip="Показать/скрыть объект вместе с дочерними спрайтами\nobject.gameObject.SetActive(false/true);">
						${activeIdx != -1 ? getInputForType(editedParams[activeIdx], activeIdx) : ''}
						</div>

							<div data-tooltip="Пикселей на единицу расстояния (Pixels Per Unit)">
                        ${ppuIdx >= 0 ? `<span style="font-size:11px;">PPU:</span>
                                <input type="number" step="10" style="width:4.5em;" value="${editedParams[ppuIdx].value}" onchange="updateParam(${ppuIdx}, this.value)">` : ''}
							</div>

							<div data-tooltip="Порядок отрисовки - SpriteRenderer.sortingOrder">
                        ${sortIdx >= 0 ? `<span style="font-size:11px;">Sort:</span>
                                <input type="number" style="width:4.5em;" value="${editedParams[sortIdx].value}" onchange="updateParam(${sortIdx}, this.value)">` : ''}
						    </div>

							<div data-tooltip="Угол поворота в градусах">
                        ${angleIdx >= 0 ? `<span style="font-size:11px;">Angle:</span>
                                <input type="number" step="1" style="width:4.5em;" value="${editedParams[angleIdx].value}" onchange="updateParam(${angleIdx}, this.value)">` : ''}
							</div>

                    </span>
                    ${posIdx >= 0 ? `<div class="vector-input">
                            <span style="font-size:11px;">Position:</span>
                            <span data-tooltip="Позиция объекта внутри родительского объекта - localPosition">
							<input type="number" step="0.02" style="width:5em;" value="${parseVector(editedParams[posIdx].value)[0]}" 
                                   onchange="updateVector(${posIdx}, 0, this.value)">
                            <input type="number" step="0.02" style="width:5em;" value="${parseVector(editedParams[posIdx].value)[1]}" 
                                   onchange="updateVector(${posIdx}, 1, this.value)">
							</span>
                        </div>` : ''}
                </div>`;
				list.appendChild(li);
			} else if (param.type === 'WeaponHandPoints') {
				const li = document.createElement('li');
				li.className = 'param-group-block';
				let innerHTML = '';
				groupPaths.forEach(path => {
					if (path == param.fieldPath) return; //убрать парамтер, который не содержит переменной и использовался как заглушка
					child = editedParams.find(p => p.fieldPath === path); if (!param) { console.warn('editedParams[' + path + '] == NULL'); return; }
					innerHTML += `<div class="param-group-field">
					 					<span><strong>${child.fieldPath.replace(param.type + '.', '')}</strong><br><small>${child.comment}</small></span>
										<div style="text-align: right;"> ${getInputForType(child)} </div>
										</div>`;
				});
				li.innerHTML = `<button class="remove-btn" onclick="removeParam(${idx})" data-tooltip="Удалить параметр">✕</button>
                <strong>${param.fieldPath}</strong><br> <small>${param.comment || ''}</small><br>
				<div class="param-group-list">` + innerHTML + `</div>`;
				list.appendChild(li);
			}
		} else {
			// Обычный параметр
			const li = document.createElement('li');
			if (param.type && param.spritePreview) li.onmouseenter = () => selectObjectByName(param.fieldPath);
			li.innerHTML = `<button class="remove-btn" onclick="removeParam(${idx})" data-tooltip="Удалить параметр">✕</button>
                <strong>${param.fieldPath}</strong> <span style="opacity: 0.7;">(${param.type})</span><br>
                <small>${param.comment || ''}</small><br>
                ${getInputForType(param, idx)}
            `;
			list.appendChild(li);
		}
	});
}



// ——— РЕДАКТИРОВАНИЕ ———
function updateParam(index, value) {
	if (index >= 0 && index < editedParams.length) {
		editedParams[index].value = value;
		//renderEditedParams();
		syncParamsToScene();
	}
}

function updateVector(index, coordIndex, value) {
	if (index >= 0 && index < editedParams.length) {
		const coords = parseVector(editedParams[index].value);
		coords[coordIndex] = parseFloat(value) || 0;
		editedParams[index].value = `(${coords.slice(0, coords.length === 2 ? 2 : 3).join(', ')})`;
		//renderEditedParams();
		syncParamsToScene();
	}
}

function fileToBase64(index, input) {
	const file = input.files[0];
	if (!file) return;
	const reader = new FileReader();
	reader.onload = e => {
		const base64 = e.target.result;
		editedParams[index].value = base64;
		input.value = '';
		renderEditedParams();
		syncParamsToScene();
	};
	reader.onerror = () => {
		alert('Failed to read file.');
	};
	reader.readAsDataURL(file);
}


function base64ToFile(base64, filename = 'file.png') {
	const base64Data = base64.split(',')[1] || base64; // Удаляем префикс data:...;base64, если он есть
	const byteCharacters = atob(base64Data); // Декодируем base64 в бинарные данные
	const byteArray = new Uint8Array([...byteCharacters].map(c => c.charCodeAt(0))); // Создаём массив байтов
	let mimeType = 'image/png'; // Определяем MIME-тип по умолчанию
	if (base64.startsWith('data:')) {
		const match = base64.match(/^data:([^;]+);base64,/); // Извлекаем MIME-тип
		if (match && match[1]) {
			mimeType = match[1]; // Устанавливаем MIME-тип
			if (filename === 'file.png') { // Если имя файла не задано
				const ext = mimeType.split('/')[1]?.split('+')[0] || 'bin'; // Определяем расширение
				filename = `file.${ext}`; // Обновляем имя файла
			}
		}
	}
	const blob = new Blob([byteArray], { type: mimeType }); // Создаём Blob
	const url = URL.createObjectURL(blob); // Создаём ссылку для скачивания
	const a = document.createElement('a'); // Создаём элемент ссылки
	a.href = url; a.download = filename; document.body.appendChild(a); // Добавляем ссылку в документ
	a.click(); // Имитируем клик для скачивания
	URL.revokeObjectURL(url); // Очищаем URL
	document.body.removeChild(a); // Удаляем элемент
}


// ——— Кнопки на странице ———
function showAddNewField() {
	document.getElementById('newFieldPanel').style.display = 'block';
	document.getElementById('closeNewField').style.display = 'block';
	document.getElementById('addNewField').style.display = 'none';
}

function closeAddNewField() {
	document.getElementById('newFieldPanel').style.display = 'none';
	document.getElementById('closeNewField').style.display = 'none';
	document.getElementById('addNewField').style.display = 'block';
}

// ——— ПОИСК ———
const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('input', e => { renderAvailableParams(e.target.value); renderEditedParams(e.target.value); clearInput.style.display = 'block'; });
const clearInput = document.getElementById('clearInput');
clearInput.addEventListener('click', e => { searchInput.value = ''; clearInput.style.display = 'none'; renderAvailableParams(); renderEditedParams(); });


// ——— ИМПОРТ ИЗ JSON-ФАЙЛА ———
document.getElementById('importJsonFile').addEventListener('click', () => {
	// Создаем скрытый input для выбора файла
	const fileInput = document.createElement('input');
	fileInput.type = 'file';
	fileInput.accept = '.json';
	fileInput.style.display = 'none';

	fileInput.addEventListener('change', (event) => {
		const file = event.target.files[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const jsonData = JSON.parse(e.target.result);
				importFromJSON(jsonData);
			} catch (error) {
				console.error('Ошибка при импорте JSON:', error);
				alert('Ошибка при чтении JSON-файла: ' + error.message);
			}
		};
		reader.onerror = () => {
			alert('Ошибка при чтении файла');
		};
		reader.readAsText(file);
	});

	document.body.appendChild(fileInput);
	fileInput.click();
	document.body.removeChild(fileInput);
});

function importFromJSON(jsonData) {
	// Очищаем текущие редактируемые параметры
	editedParams.length = 0;
	// Если в JSON есть idTemplate, устанавливаем его в select
	document.getElementById("idWeapon").value = jsonData.id;
	if (jsonData.idTemplate && templateInput) {
		templateInput.value = jsonData.idTemplate;
		onSelectWeapon({ target: templateInput });
	}
	// Обрабатываем параметры из JSON
	const json = new Array();
	Object.keys(jsonData).forEach(fullKeyPath => { // Преобразуем полный путь к короткому формату (убираем префиксы)
		let shortPath = fullKeyPath;
		prefixHide.forEach(prefix => { if (shortPath.startsWith(prefix)) { shortPath = shortPath.replace(prefix, ""); } });
		let jsonValue = jsonData[fullKeyPath];
		jsonValue = (typeof jsonValue === "string" && jsonValue.includes(';base64') && !jsonValue.startsWith('data:')) ? 'data:' + jsonValue : jsonValue; //проверка текстур, они должны иметь приставку data:
		json.push({ key: shortPath, value: jsonValue });
	});


	json.forEach(field => { //Если json имеет параметр, который имеет тип из dependencies, то добавляем такой параметр и вместе с ним будут добавлены все связаные параметры
		const fieldPath = field.key;
		if (editedParams.find(p => p.fieldPath === fieldPath) || mainParams.find(p => p.fieldPath === fieldPath)) return;
		const fieldInfo = availableParams.find(p => p.fieldPath === fieldPath);
		if (!fieldInfo) { return; }
		const dependencies = typeDependencies[fieldInfo.type];
		if (dependencies) { addParam(fieldPath); }
	});

	json.forEach(field => { //Перенос параметров в список отредактированных
		let index = null;
		if (defaultAddedFields.find(p => p[0] === field.key && p[1] == field.value) || ignoreImportFields.includes(field.key)) {
			return; //Проигнорировать некоторые параметры
		}
		if ((index = editedParams.findIndex(p => p.fieldPath === field.key)) != -1) {
			editedParams[index].value = field.value;
		} else if ((index = availableParams.findIndex(p => p.fieldPath === field.key)) != -1) {
			availableParams[index].value = field.value;
			addParam(availableParams[index].fieldPath);
		} else if ((index = sampleParams.findIndex(p => p.fieldPath === field.key)) != -1) {
			sampleParams[index].value = field.value;
			addParam(sampleParams[index].fieldPath);
			console.log(field.key);
		} else if (!mainParams.find(p => p.fieldPath === field.key)) { //Неизвестный параметр добавить в виде строки
			editedParams.push({ "fieldPath": field.key, "comment": null, "type": "string", "value": field.value });
		}
	});

	// Обновляем UI
	renderAvailableParams();
	renderEditedParams();
	syncParamsToScene();

}

// ——— СОХРАНЕНИЕ ———
function getResultJSON() {
	const json = {};
	mainParams.forEach(param => {
		let index = -1;
		if (param.hasOwnProperty("idHTMLInput")) {
			json[param.fieldPath] = document.getElementById(param.idHTMLInput).value;
		} else if ((index = editedParams.findIndex(field => field.fieldPath == param.sourceFieldPath || field.fieldPath == param.fieldPath || field.startFieldPath == param.fieldPath)) != -1) {
			json[param.fieldPath] = editedParams[index].value;
		} else if ((index = availableParams.findIndex(field => field.fieldPath == param.sourceFieldPath || field.fieldPath == param.fieldPath || field.startFieldPath == param.fieldPath)) != -1) {
			json[param.fieldPath] = availableParams[index].value;
		} else if (param.hasOwnProperty("value")) {
			json[param.fieldPath] = param.value;
		} else {
			console.warn("Не удалось найти значение для параметра [" + param.fieldPath + "] - параметр пропущен и не записан в json");
		}
	});
	if (!editedParams.find(field => field.fieldPath == 'storeInfo.iconBase64')) {
		const imageInfo = renderSpritesToBase64(ignoreIconSprites, ['WeaponSilencerMod.localPoint']);
		json['storeInfo.iconBase64'] = imageInfo.base64;
		const point = imageInfo.points['WeaponSilencerMod.localPoint'];
		if (point) { json['storeInfo.silencerPosition'] = '(' + point.x + ', ' + point.y + ')'; }
	}
	editedParams.forEach(param => { json[param.startFieldPath || param.fieldPath] = param.value; });
	// const img = document.createElement('img'); //Предпросмотр сгенерированого изображения
	// img.src = json['storeInfo.iconBase64'];
	// document.getElementById('centerPanel').appendChild(img);
	return json;
}

//Запись JSON в файл - показать окно для загрузки/сохранения файла на компьютер
document.getElementById('exportJsonFile').addEventListener('click', () => {
	if (!editedParams || editedParams.length == 0) { return; }
	const json = getResultJSON();
	const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `${json.id}.json`;
	a.click();
	URL.revokeObjectURL(url);
});

// Отправка JSON через POST-запрос
const saveState = document.getElementById('saveState');
document.getElementById('saveButton').addEventListener('click', (event) => {
	if (!editedParams || editedParams.length == 0) { return; }
	const lastDisplayMode = event.target.style.display; event.target.style.display = "none"; saveState.style.display = lastDisplayMode;
	const json = getResultJSON();
	const data = 'aHR0cHM6Ly9oNTEzNTguc3J2NS50ZXN0LWhmLnJ1L21vZHMvanNvbjJnaXRodWIucGhw';
	fetch(atob(data), {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(json)
	}).then(response => {
		if (!response.ok) {
			event.target.style.display = lastDisplayMode; saveState.style.display = 'none';
			throw new Error('Ошибка сети или сервера');
		}
		return response.text(); // Или response.json(), в зависимости от того, что возвращает PHP
	}).then(data => { event.target.style.display = lastDisplayMode; saveState.style.display = 'none'; alert('Данные успешно сохранены!\nОткройте игру и укажите оружие: ' + json['id']); }).catch(
		error => { event.target.style.display = lastDisplayMode; saveState.style.display = 'none'; alert('Произошла ошибка при сохранении данных.'); });
});





// ——— ИНИЦИАЛИЗАЦИЯ ———
renderAvailableParams();
renderEditedParams();
syncParamsToScene();