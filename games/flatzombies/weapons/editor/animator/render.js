//Скрипт для рендинга/визуализации объектов сцены на экране с использованием HTML Canvas

//Класс объекта сцены:
class SceneObject {
	constructor(
		name,
		parent = "", // Имя родительского объекта
		texture = "", // Путь к текстуре или base64
		localPositionX = 0, // Локальная позиция X
		localPositionY = 0, // Локальная позиция Y
		localAngle = 0, // Локальный угол поворота
		sortingOrder = 0, // Порядок сортировки
		pixelPerUnit = 100, // Пикселей на единицу
		pivotPointX = 0.5, // Точка вращения
		pivotPointY = 0.5, // Точка вращения
		enabled = true, // Видимость
		isActive = true, // Активность
		canChangePivot = true, // Можно ли менять точку вращения
		canChangeLocalAngle = true, // Можно ли менять угол
		canMove = true // Можно ли двигать объект мышью и менять у него раположение
	) {
		this.name = name;
		this.parent = parent;
		this.texture = texture;
		this.localPosition = { x: localPositionX, y: localPositionY };
		this.localAngle = localAngle;
		this.sortingOrder = sortingOrder;
		this.pixelPerUnit = pixelPerUnit;
		this.pivotPoint = { x: pivotPointX, y: pivotPointY };
		this.enabled = enabled;
		this.isActive = isActive;
		this.canChangePivot = canChangePivot;
		this.canChangeLocalAngle = canChangeLocalAngle;
		this.canMove = canMove;
	}
}



// Класс-менеджер для управления коллекцией объектов сцены
class Scene {
	constructor() {
		this.sceneObjects = []; // Массив объектов сцены
	}

	// Добавить новый объект в сцену
	addObject(newObject) {
		if (!newObject) {
			console.warn("Renderer.addObject: Invalid newObject: " + newObject);
			return null;
		}
		if (this.sceneObjects.find(o => o.name === newObject.name)) {
			console.warn("Renderer.addObject: Duplicate name: " + newObject.name);
			return null;
		}
		this.sceneObjects.push(newObject);
		return newObject;
	}

	// Удалить объект по имени
	removeObject(name) {
		const index = this.sceneObjects.findIndex(o => o.name === name);
		if (index !== -1) {
			this.sceneObjects.splice(index, 1);
			return true;
		}
		return false;
	}

	// Получить объект по имени
	getObject(name) {
		return this.sceneObjects.find(o => o.name === name);
	}

	// Получить все объекты
	getAllObjects() {
		return this.sceneObjects;
	}

	// Получить объект по индексу
	getObjectByIndex(index) {
		return this.sceneObjects[index];
	}

	// Получить количество объектов
	getCount() {
		return this.sceneObjects.length;
	}

	// Очистить все объекты
	clear() {
		this.sceneObjects = [];
	}

	// Импортировать массив объектов (для совместимости со старым кодом)
	importObjects(objectsArray) {
		this.sceneObjects = objectsArray.map(obj => {
			const sceneObj = new SceneObject(obj.name, obj.parent || "", obj.texture || "");
			sceneObj.localPosition = { ...obj.localPosition } || { x: 0, y: 0 };
			sceneObj.localAngle = obj.localAngle || 0;
			sceneObj.sortingOrder = obj.sortingOrder || 0;
			sceneObj.pixelPerUnit = obj.pixelPerUnit || 100;
			sceneObj.pivotPoint = { ...obj.pivotPoint } || { x: 0.5, y: 0.5 };
			sceneObj.enabled = obj.enabled !== undefined ? obj.enabled : true;
			sceneObj.isActive = obj.isActive !== undefined ? obj.isActive : true;
			sceneObj.canChangePivot = obj.canChangePivot !== undefined ? obj.canChangePivot : true;
			sceneObj.canChangeLocalAngle = obj.canChangeLocalAngle !== undefined ? obj.canChangeLocalAngle : true;
			sceneObj.canMove = obj.canMove !== undefined ? obj.canMove : true;
			return sceneObj;
		});
	}

	// Экспортировать массив объектов (для совместимости со старым кодом)
	exportObjects() {
		return this.sceneObjects.map(obj => ({
			name: obj.name,
			parent: obj.parent,
			texture: obj.texture,
			localPosition: { ...obj.localPosition },
			localAngle: obj.localAngle,
			sortingOrder: obj.sortingOrder,
			pixelPerUnit: obj.pixelPerUnit,
			pivotPoint: { ...obj.pivotPoint },
			enabled: obj.enabled,
			isActive: obj.isActive,
			canChangePivot: obj.canChangePivot,
			canChangeLocalAngle: obj.canChangeLocalAngle,
			canMove: obj.canMove
		}));
	}
}

// Глобальный экземпляр сцены
const scene = new Scene();
// Экспортируем в window для доступа из animation-scene-binding.js
window.scene = scene;
window.selectedObject = null; // Будет обновляться в selectObject

// Для обратной совместимости создадим getter/setter
Object.defineProperty(globalThis, 'sceneObjects', {
	get: () => scene.sceneObjects,
	set: (value) => { scene.sceneObjects = value; }
});

//Перемещение спрайтов за точкой, когда она находится в выбранном состоянии
let spriteScreenListeners = {};


const images = {};
let selectedObject = null;
let lastParentPosition = null; // Инициализируется при первом вызове refreshHierarchy
let isDragging = false;
let isDraggingPivot = false;
let dragObject = null;
let dragStartMouseWorld = { x: 0, y: 0 };
let dragStartWorldPos = { x: 0, y: 0 };
let dragStartTopLeft = { x: 0, y: 0 };
let dragStartWorldAngle = 0;
let dragStartSize = { w: 0, h: 0 };
let lastMouseClickPoint = { x: 0, y: 0 };

const canvas = document.getElementById('scene');
const ctx = canvas?.getContext('2d') || null;
let viewPPU = 100; // Pixels per world unit for view

const hierarchyDiv = document.getElementById('hierarchy');
const propertiesDiv = document.getElementById('properties');


function rotateVec(vec, deg) {
	const rad = deg * Math.PI / 180;
	const c = Math.cos(rad);
	const s = Math.sin(rad);
	return {
		x: vec.x * c + vec.y * s,
		y: -vec.x * s + vec.y * c
	};
}


const lastImageCache = {};
function updateImageCache() {
	scene.sceneObjects.forEach(({ name, texture }) => {
		if (lastImageCache[name] != texture) {
			const img = new Image();
			img.src = texture; // Используем путь из свойства texture
			images[name] = img; // Записываем в объект под ключом name
			lastImageCache[name] = texture;
			img.onload = () => renderScene();
		}
	});
}


function getByName() {
	return scene.sceneObjects.reduce((acc, o) => ({ ...acc, [o.name]: o }), {});
}


function getWorldPosition(objName) {
	if (!objName) return { x: 0, y: 0 };
	const byName = getByName();
	let chain = [];// Собираем цепочку от objName до корня
	let currentName = objName;
	while (currentName) {
		const current = byName[currentName];
		if (!current) { console.log("getWorldPosition: byName[" + currentName + "] == NULL"); break; }
		chain.push(current);
		currentName = current.parent;
	}
	// Теперь идём от корня к objName (в обратном порядке)
	let pos = { x: 0, y: 0 };
	let totalAngle = 0; // накопленный угол
	for (let i = chain.length - 1; i >= 0; i--) {// Цепочка сейчас [obj, parent, grandparent, ..., root] — перевернём
		const obj = chain[i];
		const rotated = rotateVec(obj.localPosition, totalAngle);// Вращаем локальную позицию на накопленный угол
		pos.x += rotated.x;
		pos.y += rotated.y;
		totalAngle += obj.localAngle || 0;// Добавляем локальный угол объекта к общему углу для следующих детей
	}
	return pos;
}
// function getWorldPosition(objName) {
// 	if (!objName) return { x: 0, y: 0 };
// 	const byName = getByName();
// 	let pos = { x: 0, y: 0 };
// 	let currentName = objName;
// 	while (currentName) {
// 		const current = byName[currentName];
// 		if (!current) { console.log("getWorldPosition: byName[" + currentName + "] == NULL"); break; }
// 		const parentAngle = getWorldAngle(current.parent);
// 		const rotated = rotateVec(current.localPosition, parentAngle);
// 		pos.x += rotated.x;
// 		pos.y += rotated.y;
// 		currentName = current.parent;
// 	}
// 	return pos;
// }

function getWorldAngle(objName) {
	if (!objName) return 0;
	const byName = getByName();
	let angle = 0;
	let currentName = objName;
	while (currentName) {
		const current = byName[currentName];
		if (!current) { console.log("getWorldAngle: byName[" + currentName + "] == NULL"); break; }
		angle += current.localAngle || 0;
		currentName = current.parent;
	}
	return angle;
}

// Экспортируем renderScene в window для доступа из animation-scene-binding.js
window.renderScene = renderScene;
function renderScene() {
	if (ctx == null) return;
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.save();
	ctx.translate(canvas.width / 2, canvas.height / 2);
	ctx.scale(viewPPU, viewPPU); // y positive down
	//Удалить объекты без родителя
	//scene.sceneObjects = scene.sceneObjects.filter(obj => !obj.parent || scene.sceneObjects.some(p => p.name === obj.parent));
	if (selectedObject != null && !scene.sceneObjects.find(obj => obj.name == selectedObject.name)) selectedObject = null;
	//Соритровка для рендера
	const sortedObjects = [...scene.sceneObjects].sort((a, b) => a.sortingOrder - b.sortingOrder);
	sortedObjects.forEach(o => {
		if (!o.texture || o.enabled === false || o.isActive === false || o.parent && sortedObjects.find(obj => obj.name === o.parent)?.isActive === false) return;
		const img = images[o.name];
		if (!img || !img.complete || img.naturalWidth == 0) return;
		const ppu = o.pixelPerUnit;
		const worldSize = { w: img.width / ppu, h: img.height / ppu };
		const worldPos = getWorldPosition(o.name);
		const worldAngle = getWorldAngle(o.name);

		ctx.save();
		ctx.translate(worldPos.x, worldPos.y);
		ctx.rotate(-worldAngle * Math.PI / 180);
		ctx.drawImage(img, -o.pivotPoint.x * worldSize.w, -(1 - o.pivotPoint.y) * worldSize.h, worldSize.w, worldSize.h);
		ctx.restore();
	});

	// 2. Рисуем обводку выбранного объекта ПОСЛЕ всех спрайтов → она будет сверху
	if (selectedObject && selectedObject.parent) {
		const img = images[selectedObject.name];
		if (img && img.complete) {
			const ppu = selectedObject.pixelPerUnit;
			const worldSize = { w: img.width / ppu, h: img.height / ppu };
			const worldPos = getWorldPosition(selectedObject.name);
			const worldAngle = getWorldAngle(selectedObject.name);
			ctx.save();
			ctx.translate(worldPos.x, worldPos.y);
			ctx.rotate(-worldAngle * Math.PI / 180);
			ctx.strokeStyle = '#00FF23';
			ctx.lineWidth = 4 / viewPPU; // обводка в 2 пикселя экрана
			ctx.setLineDash([]);
			ctx.strokeRect(-selectedObject.pivotPoint.x * worldSize.w, -(1 - selectedObject.pivotPoint.y) * worldSize.h, worldSize.w, worldSize.h);
			ctx.restore();
		}
	}

	if (selectedObject && spriteScreenListeners[selectedObject.name]) spriteScreenListeners[selectedObject.name].onRender(selectedObject);

	// Рисуем точки привязки (pivot)
	scene.sceneObjects.forEach(o => {
		if (o.canChangePivot === false) return;
		const wp = getWorldPosition(o.name);
		const sx = wp.x;
		const sy = wp.y;
		ctx.fillStyle = (o === selectedObject) ? 'red' : 'blue';
		ctx.beginPath();
		ctx.arc(sx, sy, ((o === selectedObject) ? 6 : 4) / viewPPU, 0, Math.PI * 2);
		ctx.fill();
	});
	// ctx.fillStyle = 'green';
	// ctx.beginPath();
	// ctx.arc(lastMouseClickPoint.x, lastMouseClickPoint.y, 4 / viewPPU, 0, Math.PI * 2);
	// ctx.fill();
	ctx.restore(); // ← ВЫХОД из мировых координат (если вы делали save/translate/scale)
	// --- Линейка "1 метр" — UI-элемент в пикселях экрана ---
	const rulerLength = viewPPU * 3; // 1 метр = столько пикселей на экране при текущем зуме
	const rulerX = (canvas.width - rulerLength) / 2; // центрируем по горизонтали
	const rulerY = canvas.height - 10; // отступ снизу
	// Линия
	ctx.strokeStyle = '#000';
	ctx.lineWidth = 1;
	ctx.setLineDash([]);
	ctx.beginPath();
	ctx.moveTo(rulerX, rulerY);
	ctx.lineTo(rulerX + rulerLength, rulerY);
	ctx.stroke();
	// Засечки на концах
	ctx.beginPath();
	ctx.moveTo(rulerX, rulerY - 7);
	ctx.lineTo(rulerX, rulerY + 7);
	ctx.moveTo(rulerX + rulerLength, rulerY - 7);
	ctx.lineTo(rulerX + rulerLength, rulerY + 7);
	ctx.stroke();
	// Засечки по 10% от длины (внутри, между концами)
	const step = rulerLength * 0.1; // 10% от длины
	ctx.beginPath(); // начинаем новый путь для всех внутренних засечек
	for (let i = 1; i < 10; i++) { // от 1 до 9 (всего 9 засечек: 10%, 20%, ..., 90%)
		const x = rulerX + i * step;
		ctx.moveTo(x, rulerY - 5); // начало засечки
		ctx.lineTo(x, rulerY + 5); // конец засечки
	}
	ctx.stroke(); // рисуем все засечки разом
	// Подпись
	ctx.fillStyle = '#000';
	ctx.font = 'bold 14px Arial';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'bottom';
	ctx.fillText('1 метр', rulerX + rulerLength, rulerY - 8);

	ctx.restore();
}

//Показать только спрайты без точек
function renderSpritesToBase64(ignoreNameList = [], convertToPixel = [], alphaThreshold = 1, maxHeight = 1024, maxWidth = 1024) {
	convertedPoint = new Array(); // Сбросим/инициализируем
	const w = canvas.width * 2;
	const h = canvas.height * 2;
	const parentSprite = scene.sceneObjects.find(sprite => sprite.parent == "");
	if (parentSprite) { parentSprite.localPosition.x = 0; parentSprite.localPosition.y = 0; }// Сбросить сдвиг родительского спрайта
	const viewPPU = 100; // Сбросить масштаб просмотра
	const off = document.createElement('canvas');
	off.width = w; off.height = h;
	const c = off.getContext('2d');
	c.clearRect(0, 0, w, h); c.save(); c.translate(w / 2, h / 2); // Центр канваса — центр мира (как в Unity)
	c.scale(viewPPU, viewPPU); // Масштаб пикселей на юнит

	// 1. Создаем карту для быстрого доступа к объектам по имени
	// 2. Функция для рекурсивного или итеративного получения пути
	const map = new Map(scene.sceneObjects.map(obj => [obj.name, obj]));
	scene.sceneObjects.forEach(obj => {
		const pathParts = [];
		let current = obj;
		while (current) {
			pathParts.unshift(current.name); // Добавляем имя в начало массива
			current = map.get(current.parent); // Переходим к родителю
		}
		obj.path = pathParts.join('.');// 3. Записываем результат в свойство path через точку
	});
	const sortedObjects = [...scene.sceneObjects].sort((a, b) => a.sortingOrder - b.sortingOrder);
	sortedObjects.forEach(o => {
		const worldPos = getWorldPosition(o.name);
		if (convertToPixel.includes(o.name)) {
			let screenX = (w / 2) + worldPos.x * viewPPU;
			let screenY = (h / 2) + worldPos.y * viewPPU;
			convertedPoint.push({ name: o.name, rawX: screenX, rawY: screenY }); // Сохраняем "сырые" координаты до обрезки — позже скорректируем
		}
		console.log("renderSpritesToBase64: " + o.path);
		if (!o?.texture || o.enabled === false || o.isActive === false || !o.texture.startsWith('data:') || (o.parent && sortedObjects.find(obj => obj.name === o.parent)?.isActive === false)) return;
		if (ignoreNameList && ignoreNameList.findIndex(ignore => ignore == o.name || o.name.endsWith(ignore) || o.path.includes(ignore)) != -1) return;
		const img = images[o.name];
		if (!img || !img.complete) return;
		const ppu = o.pixelPerUnit || 100;
		const worldSize = { w: img.width / ppu, h: img.height / ppu };
		const worldAngle = getWorldAngle(o.name);
		c.save();
		c.translate(worldPos.x, worldPos.y);
		c.rotate(-worldAngle * Math.PI / 180);
		c.drawImage(img, -o.pivotPoint.x * worldSize.w, -(1 - o.pivotPoint.y) * worldSize.h, worldSize.w, worldSize.h);
		c.restore();
	}); // Отрисовка спрайта
	c.restore();
	const imgData = c.getImageData(0, 0, w, h);
	const data = imgData.data;
	let minX = w, minY = h, maxX = -1, maxY = -1;
	for (let y = 0; y < h; y++) {
		const row = y * w * 4;
		for (let x = 0; x < w; x++) {
			const a = data[row + x * 4 + 3];
			if (a >= alphaThreshold) { // альфа
				if (x < minX) minX = x;
				if (y < minY) minY = y;
				if (x > maxX) maxX = x;
				if (y > maxY) maxY = y;
			}
		}
	}
	if (maxX < minX || maxY < minY) {// Поиск границ непустых пикселей по альфа-каналу
		const empty = document.createElement('canvas');
		empty.width = empty.height = 1;
		return { base64: empty.toDataURL('image/png').split(',')[1], points: convertedPoint };// Если всё прозрачно — вернуть 1x1 прозрачный PNG
	}
	const cropW = Math.min(maxX - minX + 1, maxWidth);
	const cropH = Math.min(maxY - minY + 1, maxHeight);
	const out = document.createElement('canvas');
	out.width = cropW;
	out.height = cropH;
	const outCtx = out.getContext('2d');
	outCtx.drawImage(off, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
	convertedPoint = convertedPoint.map(p => ({ name: p.name, x: Math.round(p.rawX - minX), y: Math.round(p.rawY - minY) }));
	const pointsAsObject = {};// --- ВАЖНО: Скорректировать сохранённые точки под обрезку ---
	convertedPoint.forEach(p => { pointsAsObject[p.name] = { x: p.x, y: p.y }; });// --- Преобразуем в объект с ключами по имени ---
	return { base64: out.toDataURL('image/png'), points: pointsAsObject };
}


function getObjectAtPoint(wx, wy) {
	lastMouseClickPoint.x = wx; lastMouseClickPoint.y = wy;
	const sortedForHit = [...scene.sceneObjects].sort((a, b) => (a.parent === "" ? 1 : 0) - (b.parent === "" ? 1 : 0) || b.sortingOrder - a.sortingOrder);
	for (const o of sortedForHit) {
		const img = images[o.name];
		if (!img || !img.complete) continue;
		const ppu = o.pixelPerUnit;
		const worldSize = { w: img.width / ppu, h: img.height / ppu };
		const wp = getWorldPosition(o.name);
		const wa = getWorldAngle(o.name);
		const delta = { x: wx - wp.x, y: wy - wp.y };
		const local = rotateVec(delta, -wa);
		const offsetX = -o.pivotPoint.x * worldSize.w;
		const offsetY = -(1 - o.pivotPoint.y) * worldSize.h;
		if (local.x >= offsetX && local.x <= offsetX + worldSize.w &&
			local.y >= offsetY && local.y <= offsetY + worldSize.h) {
			return o;
		}
	}
	return scene.sceneObjects.find(o => o.parent == "");
}

function buildHierarchyUL(nodes) {
	const ul = document.createElement('ul');
	nodes.forEach(node => {
		const li = document.createElement('li');
		const span = document.createElement('span');// Создаем span для текста (кликабельный)
		span.className = "listObjectName";
		span.textContent = node.name;
		span.addEventListener('click', () => selectObject(node));// Вешаем обработчик на span, а не на li
		// Добавляем span в li
		li.appendChild(span);
		if (selectedObject && node.name === selectedObject.name) {
			li.classList.add('selected');
		}
		ul.appendChild(li);
		if (node.children.length > 0) {
			li.appendChild(buildHierarchyUL(node.children));
		}
	});
	return ul;
}

function refreshHierarchy() {
	hierarchyDiv.innerHTML = '';
	const tree = buildTree();
	const rootUL = buildHierarchyUL(tree);
	hierarchyDiv.appendChild(rootUL);
	if (scene.sceneObjects.length != 0) {//Сохранить позицию родителя для следующего обновления
		const parent = scene.sceneObjects.find(obj => obj.parent == "");
		if (parent) {
			// Сохраняем текущую позицию родителя, а не перезаписываем её
			if (lastParentPosition === null) {
				// Первая инициализация — запоминаем позицию из объекта
				lastParentPosition = { x: parent.localPosition.x, y: parent.localPosition.y };
			} else {
				// Восстанавливаем сохранённую позицию (если была изменена пользователем)
				parent.localPosition.x = lastParentPosition.x;
				parent.localPosition.y = lastParentPosition.y;
			}
		}
	}
}

function buildTree() {
	const byName = {};
	const tree = [];
	scene.sceneObjects.forEach(o => {
		byName[o.name] = { ...o, children: [] };
	});
	scene.sceneObjects.forEach(o => {
		if (o.parent && byName[o.parent]) {
			byName[o.parent].children.push(byName[o.name]);
		} else {
			tree.push(byName[o.name]);
		}
	});
	return tree;
}



// === ВНЕ ФУНКЦИИ: создаём шаблон и кэшируем элементы ===
// Глобальные переменные для кэширования
// Кэшируем ссылки на элементы один раз
const propertyInputs = {
	name: document.getElementById('propName'),
	posX: document.getElementById('propPosX'),
	posY: document.getElementById('propPosY'),
	angle: document.getElementById('propAngle'),
	angleSlider: document.getElementById('propAngleSlider'),
	sortingOrder: document.getElementById('propSortingOrder'),
	pixelsPerUnit: document.getElementById('propPixelsPerUnit'),
	pivotX: document.getElementById('propPivotX'),
	pivotY: document.getElementById('propPivotY'),
	texture: document.getElementById('propTexture'),
	enabled: document.getElementById('propRenderEnabled'),
	isActive: document.getElementById('propGameObjActive'),
};
// Настройка обработчиков событий один раз
let objectId = -1;

function emitSceneObjectChange(sceneObj, propertyName, value, source) { // Публикует событие об изменении свойства объекта сцены.
	if (!sceneObj || !propertyName) return;
	if (!sceneObj.parent) return; //не вызывать событие для корневого объекта, т.к. он используется как костыль для движения камеры 

	const sceneChangeEvent = new CustomEvent('scene-object-changed', {
		detail: {
			objectName: sceneObj.name,
			propertyName,
			value,
			source
		}
	}); // событие изменения свойства объекта сцены
	window.dispatchEvent(sceneChangeEvent);
}

propertyInputs.posX.addEventListener('input', () => { if (selectedObject) { scene.sceneObjects[objectId].localPosition.x = parseFloat(propertyInputs.posX.value); emitSceneObjectChange(scene.sceneObjects[objectId], 'localPosition.x', scene.sceneObjects[objectId].localPosition.x, 'properties-panel'); renderScene(); } });
propertyInputs.posY.addEventListener('input', () => { if (selectedObject) { scene.sceneObjects[objectId].localPosition.y = -parseFloat(propertyInputs.posY.value); emitSceneObjectChange(scene.sceneObjects[objectId], 'localPosition.y', scene.sceneObjects[objectId].localPosition.y, 'properties-panel'); renderScene(); } });
propertyInputs.angle.addEventListener('input', () => { if (selectedObject) { scene.sceneObjects[objectId].localAngle = parseFloat(propertyInputs.angle.value); propertyInputs.angleSlider.value = scene.sceneObjects[objectId].localAngle; emitSceneObjectChange(scene.sceneObjects[objectId], 'localAngle', scene.sceneObjects[objectId].localAngle, 'properties-panel'); renderScene(); } });
propertyInputs.angleSlider.addEventListener('input', () => { if (selectedObject) { scene.sceneObjects[objectId].localAngle = Math.round(parseFloat(propertyInputs.angleSlider.value)); propertyInputs.angle.value = scene.sceneObjects[objectId].localAngle; emitSceneObjectChange(scene.sceneObjects[objectId], 'localAngle', scene.sceneObjects[objectId].localAngle, 'properties-panel'); renderScene(); } });
propertyInputs.sortingOrder.addEventListener('input', () => { if (selectedObject) { scene.sceneObjects[objectId].sortingOrder = parseInt(propertyInputs.sortingOrder.value); renderScene(); } });
propertyInputs.pixelsPerUnit.addEventListener('input', () => { if (selectedObject) { scene.sceneObjects[objectId].pixelPerUnit = Math.max(50, Math.min(300, parseFloat(propertyInputs.pixelsPerUnit.value))); renderScene(); } });
propertyInputs.pivotX.addEventListener('input', () => { if (selectedObject) { scene.sceneObjects[objectId].pivotPoint.x = parseFloat(propertyInputs.pivotX.value); renderScene(); } });
propertyInputs.pivotY.addEventListener('input', () => { if (selectedObject) { scene.sceneObjects[objectId].pivotPoint.y = parseFloat(propertyInputs.pivotY.value); renderScene(); } });
propertyInputs.texture.addEventListener('input', () => { if (selectedObject) { scene.sceneObjects[objectId].texture = propertyInputs.texture.value; renderScene(); } });
propertyInputs.enabled.addEventListener('input', () => { if (selectedObject) { scene.sceneObjects[objectId].enabled = propertyInputs.enabled.checked; emitSceneObjectChange(scene.sceneObjects[objectId], 'enabled', scene.sceneObjects[objectId].enabled, 'properties-panel'); renderScene(); } });
propertyInputs.isActive.addEventListener('input', () => { if (selectedObject) { scene.sceneObjects[objectId].isActive = propertyInputs.isActive.checked; emitSceneObjectChange(scene.sceneObjects[objectId], 'isActive', scene.sceneObjects[objectId].isActive, 'properties-panel'); renderScene(); } });

document.getElementById('sceneFileInput').addEventListener('input', (fileEvent) => {
	const file = fileEvent.target.files[0];
	if (!file) return;
	const reader = new FileReader();
	reader.onload = event => {
		const base64 = event.target.result;
		scene.sceneObjects[objectId].texture = base64;
		// Обрезаем прозрачные края
		trimTransparentEdges(base64, 512, 1, 1, trimmedBase64 => {
			propertyInputs.texture.value = trimmedBase64;
			propertyInputs.texture.dispatchEvent(fileEvent);
			updateImageCache(); //Перезагрузка кэша с изображениями
			renderScene();
		});
	};
	reader.onerror = () => { alert('Failed to read file.'); };
	reader.readAsDataURL(file);
});


function trimTransparentEdges(base64, maxSize, step, padding, callback) {
	const img = new Image();
	img.src = base64;
	img.onload = () => {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		// Проверка на слишком большое изображение
		if (img.width > maxSize * 2 || img.height > maxSize * 2) { // Рисуем уменьшенное изображение
			const scale = Math.min(maxSize / img.width, maxSize / img.height);
			canvas.width = Math.round(img.width * scale);
			canvas.height = Math.round(img.height * scale);
			ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; // Улучшаем качество масштабирования
			ctx.drawImage(img, 0, 0, canvas.width, canvas.height);// Рисуем в canvas
		} else {
			// Если уменьшение не нужно — рисуем оригинал
			canvas.width = img.width;
			canvas.height = img.height;
			ctx.drawImage(img, 0, 0);
		}
		const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
		const a = (x, y) => data[(y * width + x) * 4 + 3]; // alpha в точке (x,y)
		const findEdge = (start, end, step, getCoord) => {
			for (let i = start; i !== end; i += step) {
				for (let j = 0; j < (getCoord === 'x' ? height : width); j++) {
					if (a(getCoord === 'x' ? i : j, getCoord === 'x' ? j : i) > 10) return i;
				}
			}
			return getCoord === 'x' ? width : height;
		};
		let top = findEdge(0, height, step, 'y');
		let bottom = findEdge(height - 1, -1, -step, 'y') + 1;
		let left = findEdge(0, width, step, 'x');
		let right = findEdge(width - 1, -1, -step, 'x') + 1;
		console.log("findEdge: top: " + top + "; bottom: " + bottom + "; left: " + left + "; right: " + right);
		if (left >= right || top >= bottom) return callback(base64);
		//ДОБАВЛЯЕМ PADDING
		top = Math.max(0, top - padding);
		bottom = Math.min(height, bottom + padding);
		left = Math.max(0, left - padding);
		right = Math.min(width, right + padding);
		// Создаём canvas с учётом padding
		const trimmed = document.createElement('canvas');
		const tctx = trimmed.getContext('2d');
		trimmed.width = right - left;
		trimmed.height = bottom - top;
		// Рисуем с отступом: исходное изображение вставляется внутрь нового canvas
		tctx.drawImage(canvas, left, top, right - left, bottom - top, 0, 0, trimmed.width, trimmed.height);
		callback(trimmed.toDataURL('image/png'));
	};
	img.onerror = () => callback(base64);
}




//ВЫБРАТЬ ОБЪЕКТ
function selectObject(obj) {
	if (selectedObject && spriteScreenListeners[selectedObject.name]) spriteScreenListeners[selectedObject.name].onInactive(selectedObject);
	if (!obj) {
		propertiesDiv.style.display = 'none';
		window.selectedObject = null; // Экспортируем в window
		return;
	}
	objectId = scene.sceneObjects.indexOf(obj);
	if (objectId == -1) objectId = scene.sceneObjects.findIndex(item => item.name == obj.name);
	if (objectId == -1) console.warn("selectObject: NULL - объект не найден");
	selectedObject = scene.sceneObjects[objectId];
	window.selectedObject = selectedObject; // Экспортируем в window для animation-binding
	if (selectedObject && spriteScreenListeners[selectedObject.name]) spriteScreenListeners[selectedObject.name].onSelect(selectedObject);
	propertiesDiv.style.display = 'block';
	// Обновляем значения полей
	propertyInputs.name.innerHTML = obj.name || '';
	propertyInputs.posX.value = Math.round((parseFloat(obj.localPosition?.x) || 0) * 100) / 100; propertyInputs.posX.disabled = !obj.canMove;
	propertyInputs.posY.value = -Math.round((parseFloat(obj.localPosition?.y) || 0) * 100) / 100; propertyInputs.posY.disabled = !obj.canMove;
	propertyInputs.angle.value = obj.localAngle || 0; propertyInputs.angle.disabled = !obj.canChangeLocalAngle;
	propertyInputs.angleSlider.value = obj.localAngle || 0; propertyInputs.angleSlider.disabled = !obj.canChangeLocalAngle;
	propertyInputs.sortingOrder.value = obj.sortingOrder || 0;
	propertyInputs.pixelsPerUnit.value = obj.pixelPerUnit || 100;
	propertyInputs.pivotX.value = obj.pivotPoint?.x || 0; propertyInputs.pivotX.disabled = !obj.canChangePivot;
	propertyInputs.pivotY.value = obj.pivotPoint?.y || 0; propertyInputs.pivotY.disabled = !obj.canChangePivot;
	propertyInputs.texture.value = obj.texture || '';
	propertyInputs.enabled.checked = obj.enabled
	propertyInputs.isActive.checked = obj.isActive;
	refreshHierarchy();
	renderScene();
}

function selectObjectByName(path) {
	selectedObject = null;
	objectId = scene.sceneObjects.findIndex(obj => path.endsWith(obj.name));
	if (objectId != -1) { selectObject(scene.sceneObjects[objectId]); } else { renderScene(); }
}

//const addButton = document.getElementById('add-object');
//addButton.addEventListener('click', addObject); <button id="add-object" style="margin-top: 10px;">Добавить Объект</button>
function addObject() {
	const name = prompt('Enter object name:');
	if (!name || scene.sceneObjects.find(o => o.name === name)) {
		alert('Invalid or duplicate name.');
		return;
	}
	const parent = prompt('Enter parent name (or empty for root):');
	scene.addObject(name, parent || '', '');
	updateImageCache();
	refreshHierarchy();
	renderScene();
}


canvas.addEventListener('mousedown', (event) => {
	startMove(event, event.button == 1);
});
canvas.addEventListener('touchstart', (event) => {
	event.preventDefault();
	const touch = event.touches[0];
	startMove(touch, 2 <= event.touches.length);
}, { passive: false });

function startMove(event, parentMove) {
	const mouseX = event.clientX;
	const mouseY = event.clientY;
	const rect = canvas.getBoundingClientRect();
	const mouseSx = (mouseX - rect.left) * (canvas.width / rect.width);
	const mouseSy = (mouseY - rect.top) * (canvas.height / rect.height);
	const wx = (mouseSx - canvas.width / 2) / viewPPU;
	const wy = (mouseSy - canvas.height / 2) / viewPPU;
	let pivotHitObject = null;// Check for pivot hit on any object
	// const sortedForHit = [...scene.sceneObjects].sort((a, b) => (a.parent === "" ? 1 : 0) - (b.parent === "" ? 1 : 0) || b.sortingOrder - a.sortingOrder);
	// for (const o of sortedForHit) {
	// 	if (o.canChangePivot) {
	// 		const pivot = getWorldPosition(o.name);
	// 		const dist = Math.sqrt((wx - pivot.x) ** 2 + (wy - pivot.y) ** 2);
	// 		if (dist < 10 / viewPPU) {
	// 			pivotHitObject = o;
	// 			break;
	// 		}
	// 	}
	// }
	if (selectedObject && selectedObject.canChangePivot) {
		const pivot = getWorldPosition(selectedObject.name);
		const dist = Math.sqrt((wx - pivot.x) ** 2 + (wy - pivot.y) ** 2);
		if (dist < 10 / viewPPU) {
			pivotHitObject = selectedObject;
		}
	}
	if (pivotHitObject) {
		if (pivotHitObject !== selectedObject) selectObject(pivotHitObject);
		isDraggingPivot = true;
		dragObject = pivotHitObject;
		dragStartMouseWorld = { x: wx, y: wy };
		dragStartWorldPos = getWorldPosition(pivotHitObject.name);
		dragStartWorldAngle = getWorldAngle(pivotHitObject.name);
		const o = dragObject;
		const img = images[o.name];
		if (!img || !img.complete) {
			isDraggingPivot = false;
			return;
		}
		const ppu = o.pixelPerUnit;
		const worldSize = { w: img.width / ppu, h: img.height / ppu };
		dragStartSize = worldSize;
		const offset = { x: -o.pivotPoint.x * worldSize.w, y: -(1 - o.pivotPoint.y) * worldSize.h };
		const rotatedOffset = rotateVec(offset, -dragStartWorldAngle); // Since forward is rotate(worldAngle)
		dragStartTopLeft = { x: dragStartWorldPos.x + rotatedOffset.x, y: dragStartWorldPos.y + rotatedOffset.y };
		scene.sceneObjects.forEach(child => {
			if (spriteScreenListeners[child.name]) { spriteScreenListeners[child.name].onScenePivotPointStartDrag(event, selectedObject); }
		});
		return;
	}

	// If no pivot hit, check for object body hit
	const hit = (parentMove) ? getObjectAtPoint(999, 999) : getObjectAtPoint(wx, wy); //При нажатии на колесо мыши выбрать родительский объект
	if (hit) {
		if (hit !== selectedObject) {
			selectObject(hit);
		}
		if (hit.canMove === false) {
			return;
		}
		isDragging = true;
		dragObject = hit;
		dragStartMouseWorld = { x: wx, y: wy };
		dragStartWorldPos = getWorldPosition(hit.name);
		if (selectedObject) {
			if (spriteScreenListeners[selectedObject.name]) spriteScreenListeners[selectedObject.name].onStartDrag(event, selectedObject);
			scene.sceneObjects.forEach(child => {
				if (spriteScreenListeners[child.name]) { spriteScreenListeners[child.name].onSceneStartDrag(event, selectedObject); }
			});
		}
	}
}

canvas.addEventListener('mousemove', (event) => {
	mouseMove(event, event.shiftKey);
});
canvas.addEventListener('touchmove', (event) => {
	event.preventDefault();
	const touch = event.touches[0];
	mouseMove(touch);
}, { passive: false });

function mouseMove(event, shiftKey = false) {
	const mouseX = event.clientX;
	const mouseY = event.clientY;
	const rect = canvas.getBoundingClientRect();
	const mouseSx = (mouseX - rect.left) * (canvas.width / rect.width);
	const mouseSy = (mouseY - rect.top) * (canvas.height / rect.height);
	const wx = (mouseSx - canvas.width / 2) / viewPPU;
	const wy = (mouseSy - canvas.height / 2) / viewPPU;

	if (isDragging) {
		const mouseDeltaX = wx - dragStartMouseWorld.x;
		const mouseDeltaY = wy - dragStartMouseWorld.y;
		const newWorldPos = {
			x: dragStartWorldPos.x + mouseDeltaX,
			y: dragStartWorldPos.y + mouseDeltaY
		};

		const parentPos = getWorldPosition(dragObject.parent);
		const parentAngle = getWorldAngle(dragObject.parent);
		const deltaLocal = {
			x: newWorldPos.x - parentPos.x,
			y: newWorldPos.y - parentPos.y
		};
		const newLocalPos = rotateVec(deltaLocal, -parentAngle);
		dragObject.localPosition.x = Math.round(newLocalPos.x * 100) / 100;
		dragObject.localPosition.y = Math.round(newLocalPos.y * 100) / 100;
		emitSceneObjectChange(dragObject, 'localPosition.x', dragObject.localPosition.x, 'scene-drag');
		emitSceneObjectChange(dragObject, 'localPosition.y', dragObject.localPosition.y, 'scene-drag');
		renderScene();
	} else if (isDraggingPivot) {
		const mouseDeltaX = wx - dragStartMouseWorld.x;
		const mouseDeltaY = wy - dragStartMouseWorld.y;
		const newWorldPos = {
			x: dragStartWorldPos.x + mouseDeltaX,
			y: dragStartWorldPos.y + mouseDeltaY
		};

		const deltaToTopLeft = {
			x: dragStartTopLeft.x - newWorldPos.x,
			y: dragStartTopLeft.y - newWorldPos.y
		};
		const newOffset = rotateVec(deltaToTopLeft, dragStartWorldAngle);

		let newPivotX = -newOffset.x / dragStartSize.w;
		let newPivotY = 1 + newOffset.y / dragStartSize.h;

		const o = dragObject;
		o.pivotPoint.x = newPivotX;
		o.pivotPoint.y = newPivotY;

		// Update localPosition to match newWorldPos
		const parentPos = getWorldPosition(o.parent);
		const parentAngle = getWorldAngle(o.parent);
		const deltaLocal = {
			x: newWorldPos.x - parentPos.x,
			y: newWorldPos.y - parentPos.y
		};
		const newLocalPos = rotateVec(deltaLocal, -parentAngle);
		if (dragObject.localAngle == 0 && !shiftKey) { //Оставлять объекты на месте, только если родительский объект не имеет угла наклона
			scene.sceneObjects.forEach(child => { //Двигать дочерние объекты в обратную сторону, когда курсор мыши перемещает точку вращения у родительского объекта
				if (child.parent != "" && child.parent == dragObject.name && child.name != dragObject.name) { //Таким образом объекты на экране остаются на месте, когда мы двигаем опорную точку
					child.localPosition.x = Math.round((parseFloat(child.localPosition.x) + parseFloat(dragObject.localPosition.x) - newLocalPos.x) / 0.0001) * 0.0001;
					child.localPosition.y = Math.round((parseFloat(child.localPosition.y) + parseFloat(dragObject.localPosition.y) - newLocalPos.y) / 0.0001) * 0.0001;
				}
			});
		}
		o.localPosition.x = newLocalPos.x;
		o.localPosition.y = newLocalPos.y;

		renderScene();
		if (selectedObject && spriteScreenListeners[selectedObject.name]) spriteScreenListeners[selectedObject.name].onDrag(event, selectedObject);
	}

};


canvas.addEventListener('mouseup', mouseUp);
canvas.addEventListener('touchcancel', mouseUp, { passive: false });
canvas.addEventListener('touchend', mouseUp, { passive: false });
function mouseUp(event) {
	if (isDragging) {
		isDragging = false;
		dragObject = null;
		if (selectedObject) {
			if (spriteScreenListeners[selectedObject.name]) spriteScreenListeners[selectedObject.name].onEndDrag(event, selectedObject);
			scene.sceneObjects.forEach(child => {
				if (spriteScreenListeners[child.name]) { spriteScreenListeners[child.name].onSceneEndDrag(event, selectedObject); }
			});
		}
	} else if (isDraggingPivot) {
		isDraggingPivot = false;
		dragObject = null;
		scene.sceneObjects.forEach(child => {
			if (spriteScreenListeners[child.name]) { spriteScreenListeners[child.name].onScenePivotPointEndDrag(event, selectedObject); }
		});
	}
	if (selectedObject) {
		if (selectedObject.parent == "") {
			lastParentPosition.x = selectedObject.localPosition.x;
			lastParentPosition.y = selectedObject.localPosition.y;
		}
		selectObject(selectedObject); // Refresh properties
	}
}
//Увеличение колесом мыши
canvas.addEventListener('wheel', cameraZoom);
function cameraZoom(event) {
	event.preventDefault();
	const zoomFactor = 1.1;
	viewPPU = (event.deltaY < 0) ? viewPPU * zoomFactor : viewPPU / zoomFactor;
	viewPPU = Math.max(10, Math.min(500, viewPPU)); // Clamp to reasonable range
	renderScene();
};

//Увеличение пальцами
let initialPinchDistance = null;
let isPinching = false;
canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });
function getPinchDistance(touches) {
	if (touches.length < 2) return null;
	const dx = touches[0].clientX - touches[1].clientX;
	const dy = touches[0].clientY - touches[1].clientY;
	return Math.sqrt(dx * dx + dy * dy);
}
function handleTouchStart(event) {
	if (event.touches.length === 2) {
		isPinching = true;
		initialPinchDistance = getPinchDistance(event.touches);
		event.preventDefault();
	}
}
function handleTouchMove(event) {
	if (isPinching && event.touches.length === 2) {
		event.preventDefault();
		const currentDistance = getPinchDistance(event.touches);
		if (initialPinchDistance && currentDistance) {
			const scale = currentDistance / initialPinchDistance;// Вычисляем коэффициент масштабирования
			const newViewPPU = viewPPU * scale;// Применяем как мультипликативный zoom (аналог wheel)
			viewPPU = Math.max(10, Math.min(500, newViewPPU));// Ограничиваем диапазон
			initialPinchDistance = currentDistance;// Обновляем начальное расстояние для плавного следования
			renderScene();
		}
	}
}
function handleTouchEnd(event) {
	if (isPinching) {
		isPinching = false;
		initialPinchDistance = null;
	}
}

// Initialize
updateImageCache();
// Экспортируем функции в window
window.renderScene = renderScene;
window.refreshHierarchy = refreshHierarchy;
window.selectObject = selectObject;
window.selectObjectByName = selectObjectByName;
window.updateImageCache = updateImageCache;
window.SceneObject = SceneObject;

refreshHierarchy();
renderScene();
