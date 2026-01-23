document.addEventListener("DOMContentLoaded", onLoaded);
//Подготовка данных
let templateInput = null; let lastTemplateIndex = 0;
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
	document.getElementById("loading").classList.add('hidden');
	document.getElementById("startFields").classList.remove('hidden');
	document.getElementById("buttonPanel").classList.remove('hidden');
	templateInput = document.getElementById("idTemplate"); // Удаляем все существующие <option>
	templateInput.addEventListener('change', onSelectWeapon);
	templateInput.addEventListener('mousedown', () => { lastTemplateIndex = templateInput.selectedIndex; }); //Записать предудщее значение для отмены
}

document.addEventListener("DOMLanguageLoaded", onLanguageLoaded);
function onLanguageLoaded() {
	console.log('onLanguageLoaded');
	sampleParams.forEach(element => {
		element.comment = tr(element.comment);
	});
}


// ——— ОБНОВИТЬ СПИСОК ПАРАМЕТРОВ ПРИ ВЫБОРЕ ОРУЖИЯ
async function onSelectWeapon(event) {
	return new Promise((resolve, reject) => {
		if (editedParams.find(field => field.value != selectedWeapon[field.fieldPath] && field.type === 'Sprite')) {
			const confirmed = confirm("Все изменения будут удалены!\nСменить оружие?");
			if (!confirmed) {
				templateInput.selectedIndex = lastTemplateIndex;
				resolve(); //Успешное завершение — даже если отменили
				return;
			}
		}
		let cacheIndex = -1;
		if ((cacheIndex = weapons.findIndex(item => item["weapon.name"] == event.target.value || item["id"] == event.target.value || item["name"] == event.target.value)) !== -1) {
			selectedWeapon = weapons[cacheIndex];
			resolve(); //Оружие найдено в списке — завершаем
			return;
		}
		//Нужно загрузить новое оружие через fetch + import — это асинхронно!
		showLoadingNewWeapon();
		fetch('templates/' + event.target.value + '.js').then(response => {
			if (!response.ok) throw new Error(`HTTP: ${response.status} - ` + event.target.value);
			return response.text();
		}).then(sourceCode => {
			const blob = new Blob([sourceCode], { type: 'application/javascript' });
			const url = URL.createObjectURL(blob);
			return import(url).then(module => {
				URL.revokeObjectURL(url);
				selectedWeapon = module.default;
				weapons.push(selectedWeapon);
				hideLoadingNewWeapon();
				resolve(); //Успешная загрузка — разрешаем промис
			});
		}).catch(error => {
			hideLoadingNewWeapon();
			console.error(`Не удалось загрузить оружие ${event.target.value}:`, error);
			alert(tr(`Не удалось загрузить оружие ${event.target.value}:\n` + error.message));
			reject(error); //Отклоняем промис на ошибку
		});
	}).then(() => {
		const weaponKeys = Object.keys(selectedWeapon);
		weaponKeys.forEach(fieldPath => {
			prefixHide.forEach(prefix => { //weapon.RifleWithMagazine.beltFeeder => beltFeeder
				if (fieldPath.startsWith(prefix)) {
					Object.defineProperty(selectedWeapon, fieldPath.replace(prefix, ""), Object.getOwnPropertyDescriptor(selectedWeapon, fieldPath));
					return;
				}
			});
		});
		lastParentPosition.x = -0.55; lastParentPosition.y = 0;
		document.getElementById("leftPanel").classList.remove('panelHidden');
		document.getElementById("rightPanel").classList.remove('panelHidden');
		document.getElementById("startCenterTitle").classList.add('hidden');
		document.getElementById("centerTitle").classList.remove('hidden');
		availableParams.length = 0;
		availableParams = availableParams.concat(baseParams);
		availableParams.forEach((field, idx) => { //Обновить значения, взять из оружия
			if (selectedWeapon.hasOwnProperty(field.fieldPath)) {
				availableParams[idx].value = selectedWeapon[field.fieldPath];
			}
		});
		sampleParams.forEach(field => { //Добавить параметры из sampleParams в список доступных в availableParams 
			if (selectedWeapon.hasOwnProperty(field.fieldPath) && !availableParams.find(p => p.fieldPath == field.fieldPath)) {
				field.value = selectedWeapon[field.fieldPath];
				availableParams.push(field);
			}
		});
		sampleParams.forEach(field => { //Добавить параметры, которые являются дочерним к параметру из availableParams
			if (!availableParams.find(a => a.startFieldPath == field.startFieldPath) && availableParams.findIndex(param => field.fieldPath.startsWith(getPrefix(param.startFieldPath, param.suffix) + ".") && field.startFieldPath in selectedWeapon) != -1) {
				console.log(field.startFieldPath + " : " + getPrefix(field.fieldPath, field.suffix));
				availableParams.push(field);
			}
		});

		editedParams.length = 0;
		//Обновить список
		availableParams.forEach(field => {	//Добавить спрайты сразу в список
			const filter = defaultAddedFields.filter(data => field.startFieldPath.endsWith(data[0]));
			let filterIndex = (filter.length != 0) ? filter.findIndex(data => field.value != data[1]) : -1;
			if (filterIndex != -1) { //console.log(field.fieldPath + ": " + filter[filterIndex]);
				if (filter[filterIndex].length == 3) {
					addParam(filter[filterIndex][2], true);
				} else {
					addParam(field.fieldPath, false);
				}
			}
		});
		//Отсортировать массив editedParams так, чтобы все параметры с type === 'Sprite' шли в начале списка
		editedParams.sort((a, b) => (b.type === 'Sprite') - (a.type === 'Sprite'));
	}).catch(err => {
		// Можно логировать или игнорировать — но промис будет отклонён
		console.error('onSelectWeapon failed:', err);
		throw err; // Перебрасываем ошибку дальше, если нужно
	});
}

function showLoadingNewWeapon() {
	document.getElementById("loading").classList.remove('hidden');
	document.getElementById("startFields").classList.add('hidden');
}
function hideLoadingNewWeapon() {
	document.getElementById("loading").classList.add('hidden');
	document.getElementById("startFields").classList.remove('hidden');
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

function convertTo180(angle) {
	return ((angle + 180) % 360 + 360) % 360 - 180;
}

function getPrefix(fieldPath, suffix = 'SpriteRenderer.sprite') { //parent.child.SpriteRenderer.sprite => parent.child
	if (!suffix) return fieldPath;
	if (fieldPath === suffix) return ''; //const match = fieldPath.match(/^(.+)\.SpriteRenderer\.sprite$/);
	return fieldPath.replace(suffix, '');
}

//Найти дочерний параметр
function getChildDepPath(parentParam, depFieldPath) {
	const prefix = getPrefix(parentParam.fieldPath, parentParam.suffix);
	const childPath = parentParam.suffix ? ((prefix ? prefix + '.' : '') + depFieldPath) : depFieldPath;
	if (availableParams.find(p => p.fieldPath == childPath)) { return childPath; }
	let index = null;
	if ((index = sampleParams.findIndex(p => p.fieldPath === childPath)) != -1) { //Параметр может быть не найден в availableParams, ищем его в sampleParams
		availableParams.push(sampleParams[index]);
		return childPath;
	}
	const childPath2 = parentParam.fieldPath + '.' + depFieldPath;
	if (availableParams.find(p => p.fieldPath == childPath2)) { return childPath2; }
	if ((index = sampleParams.findIndex(p => p.fieldPath === childPath2)) != -1) { //Параметр может быть не найден в availableParams, ищем его в sampleParams
		availableParams.push(sampleParams[index]);
		return childPath;
	}
	console.warn("getChildDepPath: не удалось найти параметр [" + childPath + "], который был указан в массиве typeDependencies для [" + parentParam.fieldPath + "]");
	return childPath;
}

// ——— ПРОВЕРКА BASE64 ———
function isValidBase64Image(data) {
	if (typeof data !== 'string') return false;
	// Проверяем, что строка — data URL с изображением
	const match = data.match(/^data:image\/(png|jpeg|jpg|gif);base64,(.*)$/);
	return match && match[2].length > 100; // базовая проверка длины
}


// ——— СИНХРОНИЗАЦИЯ В СЦЕНУ, из параметров в sceneObjects ———
function syncParamsToScene() {
	sceneObjects.length = 0;
	const processedNames = new Set();
	editedParams.filter(p => typeDependencies[p.type]?.includes('Transform.localPosition')).forEach(param => {
		const prefix = getPrefix(param.fieldPath, param.suffix);
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
			const p = findByPath(fp);
			return (p) ? p.value : defaultValue;
		};
		const localPosStr = getValue('Transform.localPosition', '(0,0,0)');
		const pivotStr = getValue('SpriteRenderer.sprite.pivotPoint', '(0.50123,0.50123)');
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
		if (availableByField[param.fieldPath] && !editedParams.find(p => (p.value === availableByField[param.fieldPath].value || Array.isArray(availableByField[param.fieldPath].value) && availableByField[param.fieldPath].value.includes(p.value)) && p.fieldPath.endsWith(availableByField[param.fieldPath].parent))) { return; } //if (availableByField[param.fieldPath]) console.log(param.fieldPath + ': ' + editedParams.find(p => (p.fieldPath === availableByField[param.fieldPath].parent)).value);
		let [x, y] = parseVector(param.value || '(0.4,0.6,0)'); y = -y;  //отразить по оси Y
		x = parseFloat(x); y = parseFloat(y);
		sceneObjects.push({
			name: param.spriteName || param.fieldPath, //Пытаемся использовать имя
			parent: getPointField(param.fieldPath, 'parent') || 'sprite',
			texture: param.spritePreview || 'images/point.png',
			localPosition: { x, y },
			localAngle: convertTo180(parseFloat(getPointField(param.fieldPath, 'angle')) || 0),
			sortingOrder: param.sortingOrder || 1000,  // Чтобы точки были поверх других объектов
			pixelPerUnit: param.spritePixelPerUnit || 200,
			pivotPoint: param.spritePivotPoint || { x: 0.5, y: 0.5 }, // Центр круга
			enabled: param.hasOwnProperty('enabled') ? param.enabled : true,
			isActive: param.hasOwnProperty('isActive') ? param.isActive : true,
			canChangePivot: false,
			canChangeLocalAngle: editedPoint.findIndex(p => (param.fieldPath === p.name || param.fieldPath.endsWith(p.name)) && p.angle) != -1,
			parameter: param.startFieldPath
		});
		const newObj = sceneObjects[sceneObjects.length - 1];
		if (spriteScreenListeners[newObj.name]) spriteScreenListeners[newObj.name].onSyncParamsToScene(newObj);
	});
	//Скрыть панель, если нет объектов
	if (sceneObjects && sceneObjects.length != 0) {
		document.getElementById("rightPanel").classList.remove('hidden')
	} else {
		document.getElementById("rightPanel").classList.add('hidden')
	}
	// Перезагрузка кэша с изображениями
	if (typeof preloadImages === 'function') {
		preloadImages();
		refreshHierarchy();
		renderScene();
		selectObject(selectedObject);
	}
}

//Найти угол, который связан с координатами для объекта на сцене
function getPointField(fieldPath, property) {
	let reference = editedPoint.find(p => fieldPath === p.name || fieldPath.endsWith(p.name)); // "shellDrop.position".endsWith(".position")
	if (!reference) { return null; }
	if (!reference[property]) { return null; } //console.warn('getPointField(' + fieldPath + ', ' + property + '): reference[' + property + '] == NULL - return NULL;'); 
	fieldPath = fieldPath.replace(reference.name, reference[property]); //shellDrop.position => shellDrop.angle
	let param = editedParams.find(p => p.fieldPath === fieldPath || p.startFieldPath === fieldPath);
	if (param) return param.value;
	fieldPath = reference[property];
	if (fieldPath.endsWith('.z')) {
		fieldPath = fieldPath.replace('.z', '');
		param = editedParams.find(p => p.fieldPath === fieldPath || p.startFieldPath === fieldPath);
		if (!param) { console.warn('getPointField(' + fieldPath + ', ' + property + '): editedParams[' + fieldPath + '] == NULL - return; - Параметры не успели загрузиться, но функция уже пытается раньше времени найти связаный параметр?'); return 0; }
		return parseVector(param.value)[2];
	}
	return null;
}

//Найти и изменить парамтер
function setPointField(fieldPath, property, newValue) {
	let reference = editedPoint.find(p => fieldPath === p.name || fieldPath.endsWith(p.name)); // "shellDrop.position".endsWith(".position")
	if (!reference || !reference[property]) return null;
	fieldPath = fieldPath.replace(reference.name, reference[property]); //shellDrop.position => shellDrop.angle
	const param = editedParams.find(p => p.fieldPath === fieldPath || p.startFieldPath === fieldPath);
	if (param) { param.value = newValue; return; }
	fieldPath = reference[property];
	if (fieldPath.endsWith('.z')) {
		fieldPath = fieldPath.replace('.z', '');
		const index = editedParams.findIndex(p => p.fieldPath === fieldPath || p.startFieldPath === fieldPath);
		updateVector(index, 2, newValue, false);
	}
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
document.getElementById('propGameObjActive').addEventListener('input', scheduleSync);
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
	if (!obj || !obj.parameter) return;
	const prefix = obj.name === 'sprite' ? '' : obj.parameter.replace('.SpriteRenderer.sprite', '');
	const spriteParam = findByPath(obj.parameter);
	if (spriteParam && spriteParam.value !== obj.texture) {
		spriteParam.value = obj.texture;
	}
	// Синхронизация позиции
	if (prefix) {
		const posPath = prefix + '.Transform.localPosition';
		const posParam = findByPath(posPath);
		const newPosValue = `(${parseFloat(obj.localPosition.x).toFixed(3)}, ${-parseFloat(obj.localPosition.y).toFixed(3)}, 0)`; //отразить по оси Y
		if (posParam && posParam.value !== newPosValue) {
			posParam.value = newPosValue;
		}
		//Синхронизация отдельной точки
		const pointParam = findByPath(obj.parameter);
		if (pointParam?.spritePreview) {
			const newPointValue = `(${parseFloat(obj.localPosition.x).toFixed(3)}, ${-parseFloat(obj.localPosition.y).toFixed(3)}, 0)`;  //отразить по оси Y
			if (pointParam && pointParam.value !== newPointValue) {
				pointParam.value = newPointValue;
			}
		}
	}
	// Синхронизация угла поворота
	const angleParam = findByPath(prefix ? prefix + '.Transform.localEulerAngles.z' : 'Transform.localEulerAngles.z');
	if (angleParam && angleParam.value != obj.localAngle) angleParam.value = obj.localAngle;
	// Синхронизация точки вращения
	const pivotParam = findByPath(prefix ? prefix + '.SpriteRenderer.sprite.pivotPoint' : 'SpriteRenderer.sprite.pivotPoint');
	const newPivotValue = `(${parseFloat(obj.pivotPoint.x).toFixed(3)}, ${parseFloat(obj.pivotPoint.y).toFixed(3)})`;
	if (pivotParam && pivotParam.value !== newPivotValue) { pivotParam.value = newPivotValue; }
	// Синхронизация PPU
	const ppuParam = findByPath(prefix ? prefix + '.SpriteRenderer.sprite.pixelPerUnit' : 'SpriteRenderer.sprite.pixelPerUnit');
	if (ppuParam && ppuParam.value != obj.pixelPerUnit) { ppuParam.value = obj.pixelPerUnit; }
	// Синхронизация порядка отрисовки
	const sortParam = findByPath(prefix ? prefix + '.SpriteRenderer.sortingOrder' : 'SpriteRenderer.sortingOrder');
	if (sortParam && sortParam.value != obj.sortingOrder) { sortParam.value = obj.sortingOrder; }
	// Синхронизация рендера
	const enabledParam = findByPath(prefix ? prefix + '.SpriteRenderer.enabled' : 'SpriteRenderer.enabled');
	if (enabledParam && enabledParam.value !== obj.enabled) { enabledParam.value = obj.enabled; }
	const gameObjectEnabled = findByPath(prefix ? prefix + '.gameObject.SetActive' : 'gameObject.SetActive');
	if (gameObjectEnabled && gameObjectEnabled.value !== obj.isActive) { gameObjectEnabled.value = obj.isActive; }
	//Точка с углом
	setPointField(obj.parameter, 'angle', obj.localAngle);
	//Другие данные
	if (spriteScreenListeners[obj.name]) spriteScreenListeners[obj.name].onSyncSceneToParams(obj);
	//Показать изменения на странице
	renderEditedParams();


}





// ——— ДОБАВЛЕНИЕ ПАРАМЕТРА ———
function addParam(fieldPath, addAsFirst = true) {
	if (editedParams.some(p => p.fieldPath === fieldPath || p.startFieldPath === fieldPath)) return;
	let param = availableParams.find(p => p.startFieldPath === fieldPath) || availableParams.find(p => p.fieldPath === fieldPath) || sampleParams.find(p => p.startFieldPath === fieldPath) || sampleParams.find(p => p.fieldPath === fieldPath);
	if (!param) { console.error(`addParam(${fieldPath}) == NULL - параметр не найден`); return; }
	param.value = availableParams.find(p => p.startFieldPath === fieldPath || p.fieldPath === fieldPath)?.value || param.value;
	if (addAsFirst) {
		const depKeys = Object.keys(typeDependencies);
		depKeys.forEach(type => {
			if (typeDependencies[type].find(childPath => fieldPath.endsWith(childPath))) {
				addAsFirst = false;
				return;
			}
		});
	}
	// Добавляем основной параметр
	if (addAsFirst) { editedParams.unshift(param); } else { editedParams.push(param); }
	// Проверяем, есть ли зависимости для типа параметра
	const dependencies = typeDependencies[param.startFieldPath] || typeDependencies[param.type] || typeDependencies[param.fieldPath] || [];
	editedPoint.forEach(p => {
		if (p.angle && fieldPath.endsWith(p.name)) { // "shellDrop.position".endsWith(".position")
			dependencies.push(fieldPath.replace(p.name, p.angle)); // shellDrop.position => shellDrop.angle
			return;
		}
	});
	// Добавляем параметры для спрайта и для объектов с несколькими настройками
	const spliceIndex = (addAsFirst) ? 1 : editedParams.length; //spliceIndex - индекс, после которого добавить новые парарметры, добавить в начало или в конец списка
	dependencies.forEach(depFieldPath => {	// Обрабатываем все зависимости
		const fullPath = getChildDepPath(param, depFieldPath);
		let sample = sampleParams.find(p => p.fieldPath === fullPath);
		if (sample && !editedParams.find(p => p.fieldPath === fullPath)) {// Проверяем, что параметр ещё не добавлен и существует в sampleParams
			editedParams.splice(spliceIndex, 0, sample);//console.log(sample.fieldPath + ': ' + sample.value);
		}
	});
	renderEditedParams();
	syncParamsToScene();
}

// ——— ДОБАВЛЕНИЕ ПАРАМЕТРА ———
function createParam() {
	closeAddNewField();
	const newFieldPath = document.getElementById('newFieldPath');
	const newFieldValue = document.getElementById('newFieldValue');
	const newFieldType = document.getElementById('newFieldType');
	if (!newFieldPath.value) return;
	if (newFieldType.value in typeDependencies) {
		typeDependencies[newFieldType.value].forEach(filed => {
			sample = sampleParams.find(s => s.fieldPath.endsWith(filed));
			const newSpriteInfo = { "fieldPath": newFieldPath.value + '.' + filed, "startFieldPath": newFieldPath.value + '.' + filed, "comment": sample.comment, "type": sample.type, "value": sample.value }
			editedParams.unshift(newSpriteInfo);
			availableParams.unshift(newSpriteInfo);
		});
	}

	const newProperty = { fieldPath: newFieldPath.value, startFieldPath: newFieldPath.value, comment: "", type: newFieldType.value, value: newFieldValue.value };
	editedParams.unshift(newProperty);
	availableParams.unshift(newProperty);
	if (newFieldType.value == "Vector3" || newFieldType.value == "Vector2") {
		editedPoint.unshift({ name: newFieldPath.value, angle: null, parent: null });
		editedParams[0].spritePreview = "images/point.png";
	}

	newFieldPath.value = ''; newFieldValue.value = '';
	renderEditedParams();
	syncParamsToScene();
}

// ——— УДАЛЕНИЕ ПАРАМЕТРА ———
function removeParam(path, showConfirm = true) {
	const param = findByPath(path);
	if (showConfirm) {
		const confirmed = confirm(tr("Удалить параметр из списка?\nЕсли параметр не будет указан, то он будет взят из оружия ") + templateInput.value + "\n" + param.fieldPath); // Показываем диалог подтверждения
		if (!confirmed) return; // Если пользователь нажал "Отмена", ничего не делаем
	}
	const typeDeps = typeDependencies[param.startFieldPath] || typeDependencies[param.type] || typeDependencies[param.fieldPath] || [];
	const basePaths = new Set();
	basePaths.add(param.fieldPath);// Добавляем основной путь
	typeDeps.forEach(depPath => {// Добавляем зависимости с префиксом
		basePaths.add(getChildDepPath(param, depPath));
	});
	for (let i = editedParams.length - 1; i >= 0; i--) {// Обходим в обратном порядке, чтобы splice не ломал индексы
		if (basePaths.has(editedParams[i].fieldPath)) {// Удаляем все параметры, чей fieldPath входит в basePaths
			console.log("removeParam: " + editedParams[i].fieldPath + '=' + editedParams[i].value);
			editedParams.splice(i, 1);
		}
	}
	renderEditedParams();
	syncParamsToScene();
}

// ——— ОТОБРАЖЕНИЕ ДОСТУПНЫХ ПАРАМЕТРОВ ———
function renderAvailableParams(filter = '') {
	const list = document.getElementById('availableParamsList'); list.innerHTML = '';
	availableParams.filter(param => {// Фильтр по поиску
		filter = filter.toLowerCase();
		const matchesSearch = (filter != '') ? param.value == filter || param.fieldPath.toLowerCase().includes(filter) || (param.comment || '').toLowerCase().includes(filter) || param.type.toLowerCase().includes(filter) : true;
		const isAdded = !!findByPath(param.fieldPath);// Проверяем, добавлен ли параметр
		return matchesSearch && !isAdded;// Исключаем ВСЕ добавленные параметры из списка
	}).forEach(param => {
		const li = document.createElement('li'); li.setAttribute('id', param.fieldPath + "List");
		li.style = "position: relative;";
		li.innerHTML = `
				<button onclick="addParam('${param.fieldPath}')" class="add">Изменить</button>
                <div ><span class="fieldpath">${param.displayName || param.fieldPath}</span> 
				${param.comment ? `<br><small class="fieldcomment">${param.comment}</small>` : ''}
				<br><small class="fieldtype">${param.type}</small><br>
				</div>
				
            `;
		list.appendChild(li);
		translateNode(li);
	});
}

// ——— ОТОБРАЖЕНИЕ РЕДАКТИРУЕМЫХ ПАРАМЕТРОВ ———
let renderTimeout;
function renderEditedParams(filter = '') { //Задержка перед рендером
	clearTimeout(renderTimeout);
	renderTimeout = setTimeout(forceRenderEditedParams, 100, filter);
}


const oneMeterPx = 150;
const oneMeterPPU = 50; //pixelPerUnit
function updateInputSpriteMillimetersByPPU(spriteParam, ppuParam, idElement) {
	const spriteParamIndex = editedParams.findIndex(p => p.startFieldPath == spriteParam);
	const ppuParamIndex = editedParams.findIndex(p => p.startFieldPath == ppuParam);
	const spriteBase64 = editedParams[spriteParamIndex].value;
	const pixelPerUnit = editedParams[ppuParamIndex].value;
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			const widthInMillimeters = (img.naturalWidth / pixelPerUnit) * (oneMeterPPU / oneMeterPx) * 1000;
			document.getElementById(idElement).value = Math.round(widthInMillimeters / 10) * 10;
			editedParams[spriteParamIndex].naturalWidth = img.naturalWidth;
			resolve(widthInMillimeters);
		};
		img.src = spriteBase64;
	});
}
function updateSpritePPU(spriteParam, millimeters) {
	const ppuParam = spriteParam + ".pixelPerUnit";
	const spriteParamIndex = editedParams.findIndex(p => p.startFieldPath == spriteParam);
	const ppuParamIndex = editedParams.findIndex(p => p.startFieldPath == ppuParam);
	const spriteWidthPx = editedParams[spriteParamIndex]?.naturalWidth;
	if (!spriteWidthPx) { console.warn("updateSpritePPU(): spriteWidthPx == NULL"); return; }
	if (!millimeters || millimeters <= 0) { console.warn("updateSpritePPU(): millimeters == NULL"); return; }
	const pixelPerUnit = Math.round((spriteWidthPx * oneMeterPPU * 1000) / (millimeters * oneMeterPx));
	editedParams[ppuParamIndex].value = pixelPerUnit;
	document.getElementById(editedParams[ppuParamIndex].startFieldPath).value = pixelPerUnit;
	syncParamsToScene();
}

/* function getImageWidthFromBase64(base64String) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			resolve(img.naturalWidth);
		};
		img.src = base64String;
	});
} */

function forceRenderEditedParams(filter = '') {
	const processed = new Set();
	const hiddenPaths = new Set(); // Чтобы не рендерить повторно параметры из группы
	const list = document.getElementById('editedParamsList'); list.innerHTML = '';
	editedParams.forEach((param, idx) => {
		if (filter != '') { //Поиск среди параметров
			filter = filter.toLowerCase();
			const matchesSearch = param.value == filter || param.fieldPath.toLowerCase().includes(filter) || (param.comment || '').toLowerCase().includes(filter) || param.type.toLowerCase().includes(filter);
			if (!matchesSearch) { return; }
		}
		if (processed.has(param.fieldPath)) return;
		const renderFormByType = typeFullForm[param.startFieldPath] || typeFullForm[param.type] || typeLightForm[param.startFieldPath] || typeLightForm[param.type];
		const typeDeps = typeDependencies[param.startFieldPath] || typeDependencies[param.type] || typeDependencies[param.fieldPath];
		if (typeDeps) {
			const prefix = getPrefix(param.fieldPath, param.suffix);//const name = prefix || 'sprite';
			const groupPaths = new Array();
			groupPaths.push(param.fieldPath);
			typeDeps.forEach(path => groupPaths.push(getChildDepPath(param, path)));
			// Помечаем все пути группы как обработанные
			groupPaths.forEach(fp => processed.add(fp));
			groupPaths.forEach(fp => hiddenPaths.add(fp));

			if (renderFormByType) {
				const li = document.createElement('li'); li.className = 'sprite-block'; li.setAttribute('id', param.fieldPath + "List");
				groupPaths.forEach(path => {
					child = editedParams.findIndex(p => p.fieldPath === path); if (child == -1) { console.warn('editedParams[' + path + '] == NULL'); return; }
					childParam = editedParams[child];
					const renderForm = typeFullForm[childParam.startFieldPath] || typeFullForm[childParam.type] || typeLightForm[childParam.startFieldPath] || typeLightForm[childParam.type];
					if (renderForm && path == param.fieldPath) {
						li.innerHTML += `<div class="param-block">
													<div><strong data-tooltip="${childParam.startFieldPath}">${childParam.displayName || childParam.fieldPath}</strong>${childParam.comment ? `<br><small class="fieldcomment">${childParam.comment}</small>` : ''}</div><div>${renderForm(childParam, child)}</div>
													<div><button class="remove-btn" onclick="removeParam('${childParam.startFieldPath}')" data-tooltip="Удалить параметр">✕</button></div>
													</div>`;
					} else if (renderForm) {
						li.innerHTML += renderForm(childParam, child);
					} else {
						alert("#1463: " + childParam.startFieldPath + "не имеет формы для редактирования в массиве typeFullForm");
					}
				});
				list.appendChild(li);

			} else if (param.type === 'Sprite') {
				// Находим индексы параметров группы
				// Находим индексы параметров группы
				const pivot = editedParams.find(p => (prefix ? p.fieldPath.includes(prefix) : p.fieldPath.startsWith('SpriteRenderer')) && p.fieldPath.endsWith('.pivotPoint'));
				const ppu = editedParams.find(p => (prefix ? p.fieldPath.includes(prefix) : p.fieldPath.startsWith('SpriteRenderer')) && p.fieldPath.endsWith('.pixelPerUnit'));
				const sort = editedParams.find(p => (prefix ? p.fieldPath.includes(prefix) : p.fieldPath.startsWith('SpriteRenderer')) && p.fieldPath.endsWith('.sortingOrder'));
				const angle = editedParams.find(p => (prefix ? p.fieldPath.includes(prefix) : p.fieldPath.startsWith('Transform')) && p.fieldPath.endsWith('.localEulerAngles.z'));
				const renderActive = editedParams.find(p => (prefix ? p.fieldPath.includes(prefix) : p.fieldPath.startsWith('SpriteRenderer')) && p.fieldPath.endsWith('SpriteRenderer.enabled'));
				const objectActive = editedParams.find(p => (prefix ? p.fieldPath.includes(prefix) : p.fieldPath.startsWith('gameObject')) && p.fieldPath.endsWith('.gameObject.SetActive'));
				const position = editedParams.find(p => (prefix ? p.fieldPath.includes(prefix) : p.fieldPath.startsWith('Transform')) && p.fieldPath.endsWith('.localPosition'));
				const li = document.createElement('li'); li.className = 'sprite-block'; li.setAttribute('id', param.fieldPath + "List");
				li.onmouseenter = () => selectObjectByName(prefix);
				//<div class="iconButton" data-tooltip="<div style='text-align: center;'>${tr("Сохранить как PNG-файл")}<br><img src='${param.value || ''}' class='tooltip'></div>" onclick="base64ToFile('${param.value}', '${templateInput.value + "-" + prefix}.png')"><img src="images/download.png" ></div>
				li.innerHTML = ` ${prefix ? `<button class="remove-btn" onclick="removeParam('${param.startFieldPath}')" data-tooltip="Удалить параметр">✕</button>` : ''}
                <strong data-tooltip="${param.startFieldPath}">${param.fieldPath.replace('.SpriteRenderer.sprite', '<span style="color: var(--text-suffix);">.SpriteRenderer.sprite</span>')}</strong>
				${param.comment ? `<br><small class="fieldcomment">${param.comment}</small>` : ''}
				<br>
                <div class="spriteFields">
                    <div style="flex:1; width:100%;">
                        <div class="input-group">
                            <input type="text" class="text-input drop-target" value="${param.value || ''}" onchange="updateParam('${param.startFieldPath}', this.value)" placeholder="image/png;base64,..." data-file-input-id="${param.startFieldPath}-file"  id="${param.startFieldPath}">
							<label class="fileInputLabel">
                                <input type="file" class="fileInput" accept=".png" oninput="updateSprite(${idx}, this);" id="${param.startFieldPath}-file">
                                <div class="fileInputButton" data-tooltip="Выбрать другой PNG-файл">Заменить</div>
                            </label>
                        </div>
                    </div>
                    ${pivot ? `<div class="propertyBlock" data-tooltip="Точка вращения объекта" >
                            <span class="title" >Pivot:</span>
                            <div class="vector-fields">
							<input placeholder="X" type="number" step="0.02" class="num" value="${parseVector(pivot.value)[0]}"
                                   onchange="updateVector('${pivot.startFieldPath}', 0, this.value)" id ="${pivot.startFieldPath}.x">
                            <input placeholder="Y" type="number" step="0.02" class="num" value="${parseVector(pivot.value)[1]}" 
                                   onchange="updateVector('${pivot.startFieldPath}', 1, this.value)" id ="${pivot.startFieldPath}.y">
							</div>
                        </div>` : ''}

                    <span style="display: grid;grid-template-columns: 10% 10% 26% 27% 27%; ustify-content:end; place-items:end; justify-items:end; width:100%; ">

						<div style="justify-self: left;" data-tooltip="Показать/скрыть рендер при загрузке в игру<br>object.SpriteRenderer.enabled = false/true;">
						${renderActive ? getInputForType(renderActive) : ''}
						</div>

						<div style="justify-self: left;" data-tooltip="Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true);">
						${objectActive ? getInputForType(objectActive) : ''}
						</div>

							<div data-tooltip="Пикселей на единицу расстояния (Pixels Per Unit)" class="propertyBlock">
                        ${ppu ? `<span class="title">PPU:</span>
                                <input type="number" step="10" class="num" value="${ppu.value}" id="${ppu.startFieldPath}" min="10" max="300" onfocusout="inputMinMax(this); updateParam('${ppu.startFieldPath}', this.value); updateInputSpriteMillimetersByPPU('${param.startFieldPath}', '${ppu.startFieldPath}', 'mainlength')">` : ''}
							</div>

							<div class="propertyBlock">
                        ${prefix && sort ? `<span class="title">Sort:</span>
                                <input data-tooltip="Порядок отрисовки - SpriteRenderer.sortingOrder" type="number" class="num" value="${sort.value}" onchange="updateParam('${sort.startFieldPath}', this.value)" id="${sort.startFieldPath}">` : `<div class="propertyBlock"><span class="title">Длина, мм:</span><input data-tooltip="Длина оружия. Длина реального прототипа из справочника, в миллиметрах" type="number" step="1" class="num" id="mainlength" onfocusout="updateSpritePPU('${param.startFieldPath}', this.value)" ></div>`}
						    </div>

							<div class="propertyBlock">
                        ${prefix && angle ? `<span class="title">Angle:</span>
                                <input data-tooltip="Угол поворота в градусах" type="number" step="1" class="num" value="${angle.value}" onchange="updateParam('${angle.startFieldPath}', this.value)" id="${angle.startFieldPath}">` : ''}
							</div>

                    </span>
                    ${prefix && position ? `<div class="propertyBlock" data-tooltip="Позиция объекта внутри родительского объекта - localPosition" >
                            <span class="title">Position:</span>
                            <div class="vector-fields">
								<input placeholder="X" type="number" step="0.02" class="num" value="${parseVector(position.value)[0]}"
									onchange="updateVector('${position.startFieldPath}', 0, this.value)" id ="${position.startFieldPath}.x">
								<input placeholder="Y" type="number" step="0.02" class="num" value="${parseVector(position.value)[1]}" 
									onchange="updateVector('${position.startFieldPath}', 1, this.value)" id ="${position.startFieldPath}.y">
							</div>
                        </div>` : ''}
                </div>`;
				if (!prefix && ppu) {
					updateInputSpriteMillimetersByPPU(param.startFieldPath, ppu.startFieldPath, 'mainlength');
				}
				list.appendChild(li);


			} else if (param.type === 'Renderer') {
				// Находим индексы параметров группы
				const sort = editedParams.find(p => (prefix ? p.fieldPath.includes(prefix) : p.fieldPath.startsWith('SpriteRenderer')) && p.fieldPath.endsWith('.sortingOrder'));
				const angle = editedParams.find(p => (prefix ? p.fieldPath.includes(prefix) : p.fieldPath.startsWith('Transform')) && p.fieldPath.endsWith('.localEulerAngles.z'));
				const renderActive = editedParams.find(p => (prefix ? p.fieldPath.includes(prefix) : p.fieldPath.startsWith('SpriteRenderer')) && p.fieldPath.endsWith('SpriteRenderer.enabled'));
				const objectActive = editedParams.find(p => (prefix ? p.fieldPath.includes(prefix) : p.fieldPath.startsWith('gameObject')) && p.fieldPath.endsWith('.gameObject.SetActive'));
				const position = editedParams.find(p => (prefix ? p.fieldPath.includes(prefix) : p.fieldPath.startsWith('Transform')) && p.fieldPath.endsWith('.localPosition'));
				const li = document.createElement('li'); li.className = 'sprite-block'; li.setAttribute('id', param.fieldPath + "List");
				if (!spriteScreenListeners[param.fieldPath]) li.onmouseenter = () => selectObjectByName(prefix);
				li.innerHTML = ` ${prefix ? `<button class="remove-btn" onclick="removeParam('${param.startFieldPath}')" data-tooltip="Удалить параметр">✕</button>` : ''}
                <strong data-tooltip="${param.startFieldPath}">${param.fieldPath.replace('.SpriteRenderer.sprite', '<span style="color: var(--text-suffix);">.SpriteRenderer.sprite</span>')}</strong>
				${param.comment ? `<br><small class="fieldcomment">${param.comment}</small>` : ''}
				<br>
                <div>
                    <span style="display: grid;grid-template-columns: 6% 6% 15.5% 16% 33.5%;place-items: end;justify-items: right;width:100%;">
						<div style="justify-self: left;" data-tooltip="Показать/скрыть рендер при загрузке в игру<br>object.SpriteRenderer.enabled = false/true;">
						${renderActive ? getInputForType(renderActive) : ''}
						</div>
						<div style="justify-self: left;" data-tooltip="Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true);">
						${objectActive ? getInputForType(objectActive) : ''}
						</div>
						<div data-tooltip="Порядок отрисовки - SpriteRenderer.sortingOrder" class="propertyBlock">
					${sort ? `<span class="title">Sort:</span>
							<input type="number" class="num" value="${sort.value}" onchange="updateParam('${sort.startFieldPath}', this.value)">` : ''}
						</div>
						<div data-tooltip="Угол поворота в градусах" class="propertyBlock">
					${angle ? `<span class="title">Angle:</span>
							<input type="number" step="1" class="num" value="${angle.value}" onchange="updateParam('${angle.startFieldPath}', this.value)">` : ''}
						</div>
						<div class="propertyBlock" data-tooltip="Позиция объекта внутри родительского объекта - localPosition" >
							<span class="title">Position:</span>
							<div class="vector-fields">
								<input placeholder="X" type="number" step="0.02" class="num" value="${parseVector(position.value)[0]}" onchange="updateVector('${position.startFieldPath}', 0, this.value)" id ="${position.fieldPath}.x">
								<input placeholder="Y" type="number" step="0.02" class="num" value="${parseVector(position.value)[1]}" onchange="updateVector('${position.startFieldPath}', 1, this.value)" id ="${position.fieldPath}.y">
							</div>
                        </div>
                    </span>
                </div>`;
				list.appendChild(li);
			} else if (param.type == 'TextureSprite') {
				const pivot = editedParams.find(p => (prefix ? p.fieldPath.includes(prefix) : p.fieldPath.startsWith('SpriteRenderer')) && p.fieldPath.endsWith('.pivotPoint'));
				const ppu = editedParams.find(p => (prefix ? p.fieldPath.includes(prefix) : p.fieldPath.startsWith('SpriteRenderer')) && p.fieldPath.endsWith('pixelPerUnit'));
				const li = document.createElement('li'); li.className = 'param-block'; li.setAttribute('id', param.fieldPath + "List");
				if (param.type && param.spritePreview && !spriteScreenListeners[param.fieldPath]) li.onmouseenter = () => selectObjectByName(param.fieldPath);
				li.innerHTML = `
				<div>
					<strong data-tooltip="${param.startFieldPath}">${param.displayName || param.fieldPath}</strong>
					${param.comment ? `<br><small class="fieldcomment">${param.comment}</small>` : ''}
					</div>
					<div>
						<div style="display: grid; grid-template-columns: 1fr 2fr; margin-bottom: 2px;">
							${ppu ? `<div data-tooltip="Пикселей на единицу расстояния (Pixels Per Unit)" class="propertyBlock">
							<span class="title">PPU:</span>
							<input type="number" step="10" style="width:100%" value="${ppu.value}" min="10" max="300" oninput="updateParam('${ppu.startFieldPath}', this.value)" onfocusout="inputMinMax(this)">
							</div>` : ''}
							
							${pivot ? `<div class="propertyBlock" data-tooltip="Точка вращения объекта" >
							<span class="title" >Pivot:</span>
								<div class="vector-fields">
								<input placeholder="X" type="number" step="0.02" style="width:100%" value="${parseVector(pivot.value)[0]}"
								onchange="updateVector('${pivot.startFieldPath}', 0, this.value)" id ="${pivot.fieldPath}.x">
								<input placeholder="Y" type="number" step="0.02" style="width:100%" value="${parseVector(pivot.value)[1]}" 
								onchange="updateVector('${pivot.startFieldPath}', 1, this.value)" id ="${pivot.fieldPath}.y">
								</div>
							</div>` : ''}
						</div>
						${getInputForType(param)}
					</div>
					</div>
				<div><button class="remove-btn" onclick="removeParam('${param.startFieldPath}')" data-tooltip="Удалить параметр">✕</button></div>`; list.appendChild(li);

			} else if (param.type === 'WeaponHandPoints') {
				const li = document.createElement('li'); li.setAttribute('id', param.fieldPath + "List"); //li.className = 'sprite-block';
				let innerHTML = '';
				groupPaths.forEach(path => {
					if (path == param.fieldPath) return; //убрать парамтер, который не содержит переменной и использовался как заглушка
					child = editedParams.find(p => p.fieldPath === path); if (!child) { console.warn('editedParams[' + path + '] == NULL'); return; }
					if (availableByField[child.fieldPath] && !editedParams.find(p => (p.value === availableByField[child.fieldPath].value || Array.isArray(availableByField[child.fieldPath].value) && availableByField[child.fieldPath].value.includes(p.value)) && p.fieldPath.endsWith(availableByField[child.fieldPath].parent))) { return; }
					innerHTML += `<div class="param-group-field">
					 	<span><strong>${child.fieldPath.replace(param.type + '.', '')}</strong><br><small>${child.comment}</small></span>
						<div > ${getInputForType(child)} </div>
						</div>`;
				});
				li.innerHTML = `<button class="remove-btn" onclick="removeParam('${param.startFieldPath}')" data-tooltip="Удалить параметр">✕</button>
                <strong>${param.displayName}</strong><br><small>${param.comment}</small><br>
				<div class="param-group-list">` + innerHTML + `</div>`;
				list.appendChild(li);
			}

		} else if (renderFormByType) {
			const li = document.createElement('li'); li.setAttribute('id', param.fieldPath + "List");
			li.innerHTML = `<button class="remove-btn" onclick="removeParam('${param.startFieldPath}')" data-tooltip="Удалить параметр">✕</button>`
			li.innerHTML += renderFormByType(param, idx, null);
			list.appendChild(li);
		} else {
			// Обычный параметр
			const li = document.createElement('li'); li.setAttribute('id', param.fieldPath + "List"); li.className = 'param-block';
			if (param.type && param.spritePreview && !spriteScreenListeners[param.fieldPath]) li.onmouseenter = () => selectObjectByName(param.fieldPath);
			li.innerHTML = `
					<div>
					<strong data-tooltip="${param.startFieldPath}">${param.displayName || param.fieldPath}</strong>
					${param.comment ? `<br><small class="fieldcomment">${param.comment}</small>` : ''}
					</div>
					<div >${getInputForType(param)}</div>
					<div><button class="remove-btn" onclick="removeParam('${param.startFieldPath}')" data-tooltip="Удалить параметр">✕</button></div>`;
			list.appendChild(li);
		}
	});

	// Обработка drag & drop для всех .drop-target
	document.querySelectorAll('.drop-target').forEach(input => {
		const fileInputId = input.dataset.fileInputId;
		const fileInput = document.getElementById(fileInputId);
		if (!fileInput) return;
		// Предотвращаем стандартное поведение браузера
		['dragover', 'dragenter'].forEach(evt => {
			input.addEventListener(evt, e => {
				e.preventDefault();
				e.stopPropagation();
				input.classList.add('drag-over');
			});
		});
		['dragleave', 'drop'].forEach(evt => {
			input.addEventListener(evt, e => {
				e.preventDefault();
				e.stopPropagation();
				input.classList.remove('drag-over');
			});
		});
		// Обработка сброса файла
		input.addEventListener('drop', e => {
			const files = e.dataTransfer.files;
			if (files.length > 0) {
				const dt = new DataTransfer();// Используем DataTransfer для установки файлов
				dt.items.add(files[0]); // Берём первый файл (можно цикл для multiple)
				fileInput.files = dt.files;
				fileInput.dispatchEvent(new Event('input', { bubbles: true }));// Эмулируем событие input, чтобы сработал oninput
			}
		});
	});

	renderAvailableParams(document.getElementById('searchInput').value); //Обновить на экране список доступных парамтеров
	translateNode(list);
}

// ——— ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ UI ———
const fileType = []; fileType["TextFile"] = ".txt"; fileType["LuaScript"] = ".lua"; fileType["AudioClip"] = ".wav"; fileType["Sprite"] = ".png"; fileType["Image"] = ".png"; fileType["TextureSprite"] = ".png";
function getInputForType(param, index = -1, objKey = null, objMetaData = null) {
	if (index == -1) index = editedParams.findIndex(field => field.startFieldPath == param.startFieldPath) ?? editedParams.findIndex(field => field.fieldPath == param.fieldPath);

	//Тип параметра имеет свою функцию для построения формы
	const renderFormByType = typeLightForm[param.startFieldPath] || typeLightForm[param.type];
	if (renderFormByType && objKey == null) {
		return renderFormByType(param, index);
	}

	//Поле с кнопкой для загрузки файла
	if (param.type in fileType) { // Проверяем, является ли тип файловым (присутствует в fileType)
		const ext = fileType[param.type]; const accept = ext ? ext : undefined; // можно оставить пустым для TextFile
		return `<input type="text" class="text-input drop-target" value="${param.value || ''}" onchange="updateParam('${param.startFieldPath}', this.value, '${objKey || ''}')" placeholder="${accept}" style="margin-bottom: 2px;" id="${param.startFieldPath}"  data-file-input-id="${param.startFieldPath}-file">
		<div>
		<label class="fileInputLabel"><input type="file" class="fileInput" ${accept ? `accept="${accept}"` : ''} oninput="updateSprite(${index}, this)" id="${param.startFieldPath}-file">
		<div class="fileInputButton" data-tooltip="Открыть другой файл">Заменить</div></label>
		<div class="iconButton" data-tooltip="<div style='text-align: center;'>${tr("Сохранить в файл")}<br>${ext == '.png' ? `<img src='` + param.value + `'>` : ''}</div>" onclick="base64ToFile('${param.value}', '${templateInput.value + "-" + param.fieldPath + ext}')"><img src="images/download.png" ></div>
		</div>`;
	}

	if (param.options) { //Показать список
		return renderStringList(param, index, objKey);
	}

	//Объект JavaScript
	if (param.value !== null && typeof param.value === 'object') {
		const obj = param.value;
		var asd = '';
		for (const key in obj) {
			if (obj.hasOwnProperty(key) && objMetaData) {
				childObjParam = objMetaData.find(p => p?.fieldPath === key);
				if (!childObjParam) { console.warn(`Массив objMetaData должен иметь данные для свойства ${key}`); continue; }
				childObjParam.value = obj[key];
				asd += `<div class="param-group-field">
						<div>
							<div class="field-label">${key}</div>
							<small>${tr(childObjParam.comment) || ''}</small>
						</div>
						<div class="field-control">
						${getInputForType(childObjParam, index, key)}
						</div>
					</div>`
			}
		}
		if (asd != '') {
			return asd;
		} else {
			return `<textarea onchange="updateParam('${param.startFieldPath}', this.value, false, '${objKey || ''}')" id="${param.startFieldPath}">${htmlspecialchars(JSON.stringify(param.value, null, 2))}</textarea>`;
		}
	}



	switch (param.type) {
		case 'SpriteRenderer':
		case 'Transform':
			let selectHTML = `<select onchange="updateParam('${param.startFieldPath}', this.value, true, '${objKey || ''}');" class="field-input" id="${param.startFieldPath}">`;
			selectHTML += `<option value=""${(!param.value ? ' selected' : '')}> </option>`;
			sceneObjects.forEach(obj => {
				if (editedParams.find(p => p.fieldPath.includes(obj.name) && typeDependencies[p.type]?.includes('Transform.localPosition'))) {
					selectHTML += `<option value="${obj.name}"${(obj.name == param.value ? ' selected' : '')}>${obj.name}</option>`;
				}
			});
			selectHTML += '</select>';
			return selectHTML;
		case 'Vector2':
			const v2 = parseVector(param.value);
			return `<div style="display: grid; grid-template-columns: 50% 50%; max-width: 10em;" >
				<div class="propertyBlock">
				<span class="title">X:</span>
                <input id="${param.fieldPath}.x" type="number" step="0.01" value="${v2[0]}" onchange="updateVector(${index}, 0, this.value)" style="width: 100%;">
                </div>
				<div class="propertyBlock">
				<span class="title">Y:</span>
                <input id="${param.fieldPath}.y" type="number" step="0.01" value="${v2[1]}" onchange="updateVector(${index}, 1, this.value)" style="width: 100%;">
                </div>
				</div>`;
		case 'Vector3':
			const v3 = parseVector(param.value);
			return `<div style="display: grid; grid-template-columns: 33% 33% 33%; max-width: 20em;" >
				<div class="propertyBlock">
				<span class="title">X:</span>
                <input id="${param.fieldPath}.x" type="number" step="0.01" value="${v3[0]}" onchange="updateVector(${index}, 0, this.value)" style="width: 100%;">
                </div>
				<div class="propertyBlock">
				<span class="title">Y:</span>
                <input id="${param.fieldPath}.y" type="number" step="0.01" value="${v3[1]}" onchange="updateVector(${index}, 1, this.value)" style="width: 100%;">
                </div>
				<div class="propertyBlock">
				<span class="title">Z:</span>
                <input id="${param.fieldPath}.y" type="number" step="0.01" value="${v3[2]}" onchange="updateVector(${index}, 2, this.value)" style="width: 100%;">
                </div>
				</div>`;
		case 'float':
		case 'number':
		case 'int':
			if ('min' in param && 'max' in param) {
				return `<div style="display: grid; grid-template-columns: 65% 30%; align-items: center; justify-content: space-between;">
					<input type="range" min="${param.min}" max="${param.max}" step="0.01" id="propAngleSlider" oninput="updateFieldHTML(${index}, this.value)" value="${param.value}">
					<input type="text" min="${param.min}" max="${param.max}"  placeholder="${param.placeholder || param.type}" id="${param.startFieldPath}" oninput="updateParam('${param.startFieldPath}', this.value, false, '${objKey || ''}')" value="${param.value}" >
				</div>`;
			}
			return `<input type="number" value="${param.value}" onchange="updateParam('${param.startFieldPath}', this.value, false, '${objKey || ''}')" id="${param.startFieldPath}" class="field-input" data-tooltip="${param.type}" >`;
		case 'bool':
			return `<input type="checkbox" ${(param.value === 'true' || param.value) ? 'checked' : ''} onchange="updateParam('${param.startFieldPath}', this.checked ? true : false, true, '${objKey || ''}')" id="${param.startFieldPath}">`;
		case 'AudioClip[]':
		case 'Sprite[]':
			return `<span data-tooltip="${param.type}" ><small>Массив объектов в формате JSON:</small><textarea onchange="updateParam('${param.startFieldPath}', this.value, false, '${objKey || ''}')" id="${param.startFieldPath}">${htmlspecialchars(JSON.stringify(param.value, null, 2))}</textarea></span>`;
		default:
			if (stringIsObject(param.value)) { //Объект JavaScript
				return `<textarea onchange="updateParam('${param.startFieldPath}', this.value, false, '${objKey || ''}')" id="${param.startFieldPath}">${htmlspecialchars(param.value)}</textarea>`;
			}
			return `<input type="text" value="${htmlspecialchars(param.value)}" data-tooltip="${param.type}" placeholder="${param.placeholder || ''}" onchange="updateParam('${param.startFieldPath}', this.value, false, '${objKey || ''}')" id="${param.startFieldPath}">`;
	}
}

/**
 * Возвращаем HTML-форму для редактирования параметра оружия
 * @param {*} param — параметр
 * @param {(string|number)[]} parentPath — путь в виде массива ключей/индексов
 */
function getInput(param, path) {
	const pathString = JSON.stringify(path).replaceAll('"', '\'');
	const currentValue = findValueByPath(path);
	const idElement = path.join('.');

	//Тип параметра имеет свою функцию для построения формы
	const renderFormByType = typeLightForm[param.startFieldPath] || typeLightForm[param.type];
	if (renderFormByType && objKey == null) {
		return renderFormByType(param, index);
	}

	if (param.options) { //Показать список
		return renderStringList(param, path);
	}

	//Поле с кнопкой для загрузки файла
	if (param.type in fileType) { // Проверяем, является ли тип файловым (присутствует в fileType)
		const ext = fileType[param.type]; const accept = ext ? ext : undefined; // можно оставить пустым для TextFile
		return `<input type="text" class="text-input drop-target" value="${currentValue || ''}" onchange="updateValueByPath(this.value, ${pathString});" placeholder="${accept}" style="margin-bottom: 2px;" id="${idElement}" data-file-input-id="${idElement}-file" data-tooltip="Поместите сюда файл из другого окна">
		<div>
		<label class="fileInputLabel"><input type="file" class="fileInput" ${accept ? `accept="${accept}"` : ''} oninput="updateSprite('${idElement}', this)" id="${idElement}-file" >
		<div class="fileInputButton" data-tooltip="Открыть другой файл">Заменить</div></label>
		<div class="iconButton" data-tooltip="<div style='text-align: center;'>${tr(" Сохранить в файл")}<br>${ext == '.png' ? `<img src='` + currentValue + `'>` : ''}</div>" onclick = "base64ToFile('${currentValue}', '${templateInput.value + " - " + param.fieldPath + ext}')" > <img src="images/download.png" ></div>
		</div>`;
	}

	//Объект JavaScript
	if (currentValue !== null && typeof currentValue === 'object') {
		const obj = currentValue;
		var asd = '';
		for (const key in obj) {
			if (obj.hasOwnProperty(key) && objMetaData) {
				childObjParam = objMetaData.find(p => p?.fieldPath === key);
				if (!childObjParam) { console.warn(`Массив objMetaData должен иметь данные для свойства ${key}`); continue; }
				childObjParam.value = obj[key];
				asd += `<div class="param-group-field">
						<div>
							<div class="field-label">${key}</div>
							<small>${childObjParam.comment || ''}</small>
						</div>
						<div class="field-control">
						${getInputForType(childObjParam, index, key)}
						</div>
					</div>`
			}
		}
		if (asd != '') {
			return asd;
		} else {
			return `<textarea onchange="updateParam('${param.startFieldPath}', this.value, false, '${objKey || ''}')" id="${param.startFieldPath}">${htmlspecialchars(JSON.stringify(param.value, null, 2))}</textarea>`;
		}
	}


	switch (param.type) {
		case 'SpriteRenderer':
		case 'Transform':
			let selectHTML = `<select onchange="updateValueByPath(this.value, ${pathString});" class="field-input" id="${idElement}">`;
			selectHTML += `<option value=""${(!currentValue ? ' selected' : '')}> </option>`;
			sceneObjects.forEach(obj => {
				if (editedParams.find(p => p.fieldPath.includes(obj.name) && typeDependencies[p.type]?.includes('Transform.localPosition'))) {
					selectHTML += `<option value="${obj.name}"${(obj.name == currentValue ? ' selected' : '')}>${obj.name}</option>`;
				}
			});
			selectHTML += '</select>';
			return selectHTML;
		case 'Vector2':
			const v2 = parseVector(currentValue);
			return `<div style="display: grid; grid-template-columns: 50% 50%; max-width: 10em;" >
				<div class="propertyBlock">
				<span class="title">X:</span>
                <input id="${idElement}.x" type="number" step="0.01" value="${v2[0]}" onchange="updateValueByPath(this.value, ${pathString.replace(']', ", 'x']")})" style="width: 100%;">
                </div>
				<div class="propertyBlock">
				<span class="title">Y:</span>
                <input id="${idElement}.y" type="number" step="0.01" value="${v2[1]}" onchange="updateValueByPath(this.value, ${pathString.replace(']', ", 'y']")})" style="width: 100%;">
                </div>
				</div>`;
		case 'Vector3':
			const v3 = parseVector(currentValue);
			return `<div style="display: grid; grid-template-columns: 33% 33% 33%; max-width: 20em;" >
				<div class="propertyBlock">
				<span class="title">X:</span>
                <input id="${idElement}.x" type="number" step="0.01" value="${v3[0]}" onchange="updateValueByPath(this.value, ${pathString.replace(']', ", 'x']")})" style="width: 100%;">
                </div>
				<div class="propertyBlock">
				<span class="title">Y:</span>
                <input id="${idElement}.y" type="number" step="0.01" value="${v3[1]}" onchange="updateValueByPath(this.value, ${pathString.replace(']', ", 'y']")})" style="width: 100%;">
                </div>
				<div class="propertyBlock">
				<span class="title">Z:</span>
                <input id="${idElement}.y" type="number" step="0.01" value="${v3[2]}" onchange="updateValueByPath(this.value, ${pathString.replace(']', ", 'z']")})" style="width: 100%;">
                </div>
				</div>`;
		case 'float':
		case 'number':
		case 'int':
			if ('min' in param && 'max' in param) {
				return `<div style="display: grid; grid-template-columns: 65% 30%; align-items: center; justify-content: space-between;">
					<input type="range" min="${param.min}" max="${param.max}" step="0.01" id="propAngleSlider" oninput="updateValueByPath(this.value, ${pathString})" value="${currentValue}">
					<input type="text" min="${param.min}" max="${param.max}"  placeholder="${param.type}" id="${idElement}" oninput="updateValueByPath(this.value, ${pathString})" value="${currentValue}" >
				</div>`;
			}
			return `<input type="number" value="${currentValue}" onchange="updateValueByPath(this.value, ${pathString})" id="${idElement}" class="field-input" data-tooltip="${param.type}" >`;
		case 'bool':
			return `<input type="checkbox" ${(currentValue === 'true' || currentValue) ? 'checked' : ''} onchange="updateValueByPath(this.checked ? true : false, ${pathString})" id="${idElement}">`;
		default:
			if (currentValue?.length > 50) {
				return `<textarea onchange="updateValueByPath(this.value, ${pathString})" id="${idElement}">${currentValue}</textarea>`;
			}
			return `<input type="text" value="${currentValue}" data-tooltip="${param.type}" onchange="updateValueByPath(this.value, ${pathString})" id="${idElement}">`;
	}
}


function htmlspecialchars(str) {
	if (!str || typeof str !== 'string') return str; // Если не строка, возвращаем как есть
	return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function stringIsObject(value) {
	if (!value || typeof value !== 'string') return false; // Если не строка, возвращаем как есть
	value = value.trim();
	return (7 <= value.length && ((value.startsWith("{") && value.endsWith("}")) || (value.startsWith("[") && value.endsWith("]"))));
}

// ——— РЕДАКТИРОВАНИЕ ———
function updateParam(path, value, updateParamList = false, objKey = null) {
	let index = parseInt(path) ?? editedParams.findIndex(p => p.fieldPath === path || p.startFieldPath === path);
	if (isNaN(index) && typeof path === "string") {
		const param = updateValueByPath(value, path);
		if (updateParamList) { renderEditedParams(); }
		syncParamsToScene();
		return param;
	} else if ((0 <= index && index < editedParams.length)) {
		if (stringIsObject(value)) {
			value = JSON.parse(value);
		}
		if (objKey && objKey != null && objKey != 'null') {
			editedParams[index].value[objKey] = value;
		} else {
			editedParams[index].value = value;
		}
		if (updateParamList) { renderEditedParams(); }
		syncParamsToScene();
		return editedParams[index];
	}
}
function updateFieldHTML(index, value) {
	const param = findByPath(index);
	if (param) {
		param.value = value;
		document.getElementById(param.startFieldPath).value = value;
	}
}



function updateVector(index, coordIndex, value, syncToScene = true) {
	const param = findByPath(index);
	if (param) {
		param.value = updateVectorValue(param.value, coordIndex, value);
		if (syncToScene) syncParamsToScene();
	}
}



function updateVectorValue(vectorValue, coordIndex, newFloatValue) {
	const coords = parseVector(vectorValue);
	coords[coordIndex] = parseFloat(newFloatValue) || 0;
	return `(${coords.slice(0, coords.length === 2 ? 2 : 3).join(', ')})`;
}


function updateSprite(idInputElement, input) {
	const file = input.files[0];
	if (!file) return;
	const reader = new FileReader();
	reader.onload = e => {
		const base64 = e.target.result;
		const textInput = Number.isInteger(idInputElement) ? null : document.getElementById(idInputElement);
		// Обрезаем прозрачные края
		trimTransparentEdges(base64, 512, 1, 1, trimmedBase64 => {
			if (textInput != null) {
				textInput.value = trimmedBase64;
				textInput.dispatchEvent(new Event('change'));
			} else {
				editedParams[idInputElement].value = trimmedBase64;
			}
			input.value = '';
			renderEditedParams();
			syncParamsToScene();
		});
	};
	reader.onerror = () => { alert('Failed to read file.'); };
	reader.readAsDataURL(file);
}

/*
// Обрабатываем все изображения параллельно
Promise.all(
	editedParams.map(item =>
		item.type === 'Sprite'
			? compressImage(item.value, maxSize)
				.then(compressed => ({
					...item, // копируем все исходные свойства
					value: compressed.base64, // заменяем value на сжатый base64
					error: undefined // очищаем ошибку, если была
				}))
				.catch(err => ({
					...item, // оставляем оригинал
					error: err.message || "Unknown error", // добавляем ошибку
				}))
			: Promise.resolve({ ...item }) // не Sprite — возвращаем без изменений
	)
).then(results => {
	const successful = results.filter(r => !r.error);
	const failed = results.filter(r => r.error);
	console.log(`Успешно: ${successful.length}, Ошибок: ${failed.length}`);
	saveAll(results); // ← передаём ВСЕ объекты (и Sprite, и другие)
}).catch(err => {
	console.error("Неожиданная ошибка при обработке:", err);
});
*/

function compressImage(base64, maxSize) {
	return new Promise((resolve) => {
		const img = new Image();
		img.src = base64;
		img.onload = () => {
			// Если изображение не превышает maxSize — ничего не делаем
			if (img.width <= maxSize && img.height <= maxSize) {
				return resolve({ base64: base64, scale: 1 });
			}
			// Вычисляем масштаб
			const scale = Math.min(maxSize / img.width, maxSize / img.height);
			const newWidth = Math.round(img.width * scale);
			const newHeight = Math.round(img.height * scale);
			// Создаём canvas для сжатия
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d');
			canvas.width = newWidth;
			canvas.height = newHeight;
			// Улучшаем качество
			ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
			// Рисуем уменьшенное изображение
			ctx.drawImage(img, 0, 0, newWidth, newHeight);
			// Возвращаем новый base64 и коэффициент масштабирования
			resolve({ base64: canvas.toDataURL('image/png'), scale: scale });
		};
		img.onerror = () => { resolve({ base64: base64, scale: 1 }); }; // При ошибке — возвращаем оригинал и scale = 1
	});
}



function base64ToFile(base64, filename = 'file.png') {
	base64 = base64.trim();
	if (!base64) { alert(tr('Нет данных для сохранения в файл')); return; }
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
				alert(tr('Ошибка при чтении JSON-файла: ') + error.message);
			}
		};
		reader.onerror = () => {
			alert(tr('Ошибка при чтении файла'));
		};
		reader.readAsText(file);
	});

	document.body.appendChild(fileInput);
	fileInput.click();
	document.body.removeChild(fileInput);
});

function importFromJSON(jsonData) {
	if (!jsonData.idTemplate) { alert(tr('Файл не имеет идентификатора idTemplate')); return; }
	// Очищаем текущие редактируемые параметры
	editedParams.length = 0;
	document.getElementById("idWeapon").value = jsonData.id;
	templateInput.value = jsonData.idTemplate;
	onSelectWeapon({ target: templateInput }).then(() => {
		// Обрабатываем параметры из JSON
		const json = new Array();
		Object.keys(jsonData).forEach(jsonKey => { // Преобразуем полный путь к короткому формату (убираем префиксы)
			let fullKeyPath = jsonKey;
			importReplace.forEach(field => { if (fullKeyPath.includes(field.fieldPath)) { fullKeyPath = fullKeyPath.replace(field.fieldPath, field.newPath); } });   //Заменить имена параметров
			let shortPath = fullKeyPath;
			prefixHide.forEach(prefix => { if (shortPath.startsWith(prefix)) { shortPath = shortPath.replace(prefix, ""); } });
			let jsonValue = jsonData[jsonKey];
			jsonValue = (typeof jsonValue === "string" && jsonValue.includes(';base64') && !jsonValue.startsWith('data:')) ? 'data:' + jsonValue : jsonValue; //проверка текстур, они должны иметь приставку data:
			json.push({ key: shortPath, fullKeyPath: fullKeyPath, value: jsonValue });
		});

		json.forEach(field => { //Если json имеет параметр, который имеет тип из dependencies, то добавляем такой параметр и вместе с ним будут добавлены все связаные параметры
			const fieldPath = field.key;
			if (editedParams.find(p => p.fieldPath === fieldPath) || mainParams.find(p => p.fieldPath === fieldPath)) return;
			const fieldInfo = availableParams.find(p => p.fieldPath === fieldPath);
			if (!fieldInfo) { return; }
			const dependencies = typeDependencies[fieldInfo.type] || typeDependencies[fieldInfo.startFieldPath];
			if (dependencies) { addParam(fieldPath); }
		});


		json.forEach(field => { //Перенос параметров в список отредактированных
			let index = null;
			if (defaultAddedFields.find(p => p[0] === field.key && p[1] == field.value) || ignoreImportFields.includes(field.key)) {
				return; //Проигнорировать некоторые параметры
			}
			if ((index = editedParams.findIndex(p => p.fieldPath === field.key)) != -1) {
				editedParams[index].value = field.value;
			} else if ((index = availableParams.findIndex(p => p.fieldPath === field.key || p.displayName === field.key)) != -1) {
				availableParams[index].value = field.value;
				addParam(availableParams[index].fieldPath);
			} else if ((index = sampleParams.findIndex(p => p.fieldPath === field.key || p.displayName === field.key)) != -1) {
				sampleParams[index].value = field.value;
				addParam(sampleParams[index].fieldPath);
			} else if (!mainParams.find(p => p.fieldPath === field.key)) { //Неизвестный параметр добавить в виде строки
				const pathSuffix = field.key.split('.').slice(-2).join('.') // 'weapon.parent.laserSight.SpriteRenderer.sprite' => 'SpriteRenderer.sprite', получаем суффикс и ищем какой тип данных имеет этот параметр по похожим данным из массива sampleParams
				const analog = sampleParams.findLast(p => p.fieldPath.endsWith(pathSuffix));
				editedParams.push({ "fieldPath": field.key, "startFieldPath": field.fullKeyPath, "comment": null, "type": analog?.type || typeByValue(field.value), "value": field.value, "suffix": analog?.suffix });
			}
		});

		// Обновляем UI
		renderEditedParams();
		syncParamsToScene();
	}).catch(error => {
		console.error('#1121/Error:', error);
		alert(tr('Не удалось загрузить оружие. Проверьте консоль: CTRL+SHIFT + i'));
	});
}



function typeByValue(value) {
	if (value.startsWith("data:image/png;base64")) {
		return "TextureSprite";
	} else if (value.startsWith("data:audio/wav;base64")) {
		return "AudioClip";
	}
	return "string";
}







// ——— СОХРАНЕНИЕ ———
function getExportResultJSON() {
	const json = {};
	const empty = new Array();
	mainParams.forEach(param => {
		let index = -1;
		let value = "";
		if (param.hasOwnProperty("idHTMLInput")) {
			value = document.getElementById(param.idHTMLInput)?.value || editedParams.find(field => field.fieldPath == param.idHTMLInput)?.value;
			if (value && param.lowerCase) { value = value.toLowerCase(); }
		} else if ((index = editedParams.findIndex(field => field.fieldPath == param.sourceFieldPath || field.fieldPath == param.fieldPath || field.startFieldPath == param.fieldPath || field.startFieldPath == param.sourceFieldPath)) != -1) {
			value = editedParams[index].value;
		} else if ((index = availableParams.findIndex(field => field.fieldPath == param.sourceFieldPath || field.fieldPath == param.fieldPath || field.startFieldPath == param.fieldPath || field.startFieldPath == param.sourceFieldPath)) != -1) {
			value = availableParams[index].value;
		} else if (param.hasOwnProperty("value")) {
			value = param.value;
		} else {
			console.warn("Не удалось найти значение для параметра [" + param.fieldPath + "] - параметр пропущен и не записан в json");
		}
		if (value != "" && !json[param.fieldPath]) json[param.fieldPath] = value;
	});
	mainParams.forEach(param => {
		if (!json[param.fieldPath]) {
			empty.push(param.fieldPath);
		}
	});
	if (empty.length != 0) {
		alert(tr("Некоторые параметры не указаны.\nМод может работать с ошибками.\nСледует указать параметры:\n") + empty.join("\n"));
	}
	if (!editedParams.find(field => field.fieldPath == 'storeInfo.iconBase64') && !ignoreExportFields.find(word => word == 'storeInfo.iconBase64')) {
		const imageInfo = renderSpritesToBase64(ignoreIconSprites, ['WeaponSilencerMod.localPoint'], 1, 120, 600);
		json['storeInfo.iconBase64'] = imageInfo.base64;
		const point = imageInfo.points['WeaponSilencerMod.localPoint'];
		if (point) { json['storeInfo.silencerPosition'] = '(' + point.x + ', ' + point.y + ')'; }
	}
	editedParams.forEach(param => {
		if (!ignoreExportFields.find(word => param.startFieldPath.includes(word)) && param.fieldPath != param.type) {
			json[param.startFieldPath || param.fieldPath] = convertTextValueToJsonFile(param.value);
		}
	});
	// const img = document.createElement('img'); //Предпросмотр сгенерированого изображения
	// img.src = json['storeInfo.iconBase64'];
	// document.getElementById('centerPanel').appendChild(img);
	return json;
}

function convertTextValueToJsonFile(value) {
	if (stringIsObject(value)) {
		value = JSON.parse(value);
	}
	return value;
}



//Запись JSON в файл - показать окно для загрузки/сохранения файла на компьютер
document.getElementById('exportJsonFile').addEventListener('click', () => {
	if (!editedParams || editedParams.length == 0) { return; }
	const json = getExportResultJSON();
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
//document.getElementById('saveButton').addEventListener('click', (event) => {
document.querySelector('.save').addEventListener('submit', async (event) => {
	event.preventDefault(); //У хтмл-формы запрещаем стандартную отправку
	if (!editedParams || editedParams.length == 0) { return; }
	const lastDisplayMode = event.target.style.display; event.target.style.display = "none"; saveState.style.display = lastDisplayMode;
	const json = getExportResultJSON();
	const data = 'aHR0cHM6Ly9oNTEzNTguc3J2NS50ZXN0LWhmLnJ1L21vZHMvanNvbjJnaXRodWIucGhw';
	json['lang'] = navigator.language;
	json['login'] = document.getElementById('login').value;
	json['password'] = document.getElementById('password').value;
	json['saveMode'] = document.getElementById('saveMode').value;
	json['selspriteupd'] = 'update';
	json['selspriteupd'] = (selectedWeapon["weapon.SpriteRenderer.sprite"] && editedParams.find(p => p.fieldPath == "SpriteRenderer.sprite")?.value == selectedWeapon["weapon.SpriteRenderer.sprite"]) ? 'standrt' : json['selspriteupd'];
	json['selspriteupd'] = (selectedWeapon["iconButtonSprite"] && editedParams.find(p => p.fieldPath == "iconButtonSprite")?.value == selectedWeapon["iconButtonSprite"]) ? 'standrt' : json['selspriteupd'];

	fetch(atob(data), {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(json)
	}).then(response => {
		if (!response.ok) {
			event.target.style.display = lastDisplayMode; saveState.style.display = 'none';
			return response.text().then(text => {
				throw new Error(text);
			});
		}
		return response.text();
	}).then(data => {
		event.target.style.display = lastDisplayMode; saveState.style.display = 'none';
		alert(tr(data));
	}).catch(error => {
		event.target.style.display = lastDisplayMode; saveState.style.display = 'none';
		alert(tr("Ошибка браузера:\n") + tr(error.message));
	});
});


// ——— ИНИЦИАЛИЗАЦИЯ ———
renderEditedParams();
syncParamsToScene();