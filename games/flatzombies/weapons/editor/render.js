let sceneObjects = [
	// {
	// 	name: "body",
	// 	parent: "",
	// 	texture: "images/test.png",
	// 	localPosition: { x: 0.4, y: 0.2 },
	// 	localAngle: 0,
	// 	pixelPerUnit: 100,
	// 	pivotPoint: { x: 0.5, y: 0.5 },
	// 	enabled: true, isActive: true
	// }
];

//Перемещение спрайтов за точкой, когда она находится в выбранном состоянии
let spriteScreenListeners = {};


const images = {};
let selectedObject = null;
let lastParentPosition = { x: 0, y: 0 };
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
let viewPPU = 146.41; // Pixels per world unit for view

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

function preloadImages() {
	const uniqueTextures = [...new Set(sceneObjects.map(o => o.texture))];
	uniqueTextures.forEach(tex => {
		if (!images[tex]) {
			const img = new Image();
			img.src = tex;
			img.onload = () => renderScene();
			images[tex] = img;
		}
	});
}


function getByName() {
	return sceneObjects.reduce((acc, o) => ({ ...acc, [o.name]: o }), {});
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

function renderScene() {
	if (ctx == null) return;
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.save();
	ctx.translate(canvas.width / 2, canvas.height / 2);
	ctx.scale(viewPPU, viewPPU); // y positive down
	//Удалить объекты без родителя
	//sceneObjects = sceneObjects.filter(obj => !obj.parent || sceneObjects.some(p => p.name === obj.parent));
	if (selectedObject != null && !sceneObjects.find(obj => obj.name == selectedObject.name)) selectedObject = null;
	//Соритровка для рендера
	const sortedObjects = [...sceneObjects].sort((a, b) => a.sortingOrder - b.sortingOrder);
	sortedObjects.forEach(o => {
		if (!o.texture || o.enabled === false || o.isActive === false || o.parent && sortedObjects.find(obj => obj.name === o.parent)?.isActive === false) return;
		const img = images[o.texture];
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
		const img = images[selectedObject.texture];
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
	sceneObjects.forEach(o => {
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
	const parentSprite = sceneObjects.find(sprite => sprite.parent == "");
	if (parentSprite) { parentSprite.localPosition.x = 0; parentSprite.localPosition.y = 0; }// Сбросить сдвиг родительского спрайта
	const viewPPU = 100; // Сбросить масштаб просмотра
	const off = document.createElement('canvas');
	off.width = w; off.height = h;
	const c = off.getContext('2d');
	c.clearRect(0, 0, w, h); c.save(); c.translate(w / 2, h / 2); // Центр канваса — центр мира (как в Unity)
	c.scale(viewPPU, viewPPU); // Масштаб пикселей на юнит

	// 1. Создаем карту для быстрого доступа к объектам по имени
	// 2. Функция для рекурсивного или итеративного получения пути
	const map = new Map(sceneObjects.map(obj => [obj.name, obj]));
	sceneObjects.forEach(obj => {
		const pathParts = [];
		let current = obj;
		while (current) {
			pathParts.unshift(current.name); // Добавляем имя в начало массива
			current = map.get(current.parent); // Переходим к родителю
		}
		obj.path = pathParts.join('.');// 3. Записываем результат в свойство path через точку
	});
	const sortedObjects = [...sceneObjects].sort((a, b) => a.sortingOrder - b.sortingOrder);
	sortedObjects.forEach(o => {
		const worldPos = getWorldPosition(o.name);
		if (convertToPixel.includes(o.name)) {
			let screenX = (w / 2) + worldPos.x * viewPPU;
			let screenY = (h / 2) + worldPos.y * viewPPU;
			convertedPoint.push({ name: o.name, rawX: screenX, rawY: screenY }); // Сохраняем "сырые" координаты до обрезки — позже скорректируем
		}
		console.log("renderSpritesToBase64: "+o.path);
		if (!o?.texture || o.enabled === false || o.isActive === false || !o.texture.startsWith('data:') || (o.parent && sortedObjects.find(obj => obj.name === o.parent)?.isActive === false)) return;
		if (ignoreNameList && ignoreNameList.findIndex(ignore => ignore == o.name || o.name.endsWith(ignore) || o.path.includes(ignore)) != -1) return;
		const img = images[o.texture];
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

//ignoreNameList - имена объектов, которые убрать из рендера
/* function renderSpritesToBase64(ignoreNameList = [], convertToPixel = [], alphaThreshold = 1) {
	convertedPoint = new Array();
	// Подготовка offscreen-canvas
	const w = canvas.width * 2;
	const h = canvas.height * 2;
	const parentSprite = sceneObjects.find(sprite => sprite.parent == "");
	parentSprite.localPosition.x = 0; parentSprite.localPosition.y = 0; //Сбросить сдвиг родительского спрайта
	const viewPPU = 100; //Сбросить масштаб просмотра
	const off = document.createElement('canvas');
	off.width = w;
	off.height = h;
	const c = off.getContext('2d');
	// Прозрачный фон
	c.clearRect(0, 0, w, h);
	c.save();
	c.translate(w / 2, h / 2);
	c.scale(viewPPU, viewPPU); // y positive down
	const sortedObjects = [...sceneObjects].sort((a, b) => a.sortingOrder - b.sortingOrder);
	sortedObjects.forEach(o => {
		if (!o?.texture || o.enabled === false || o.isActive === false || !o.texture.startsWith('data:') || o.parent && sortedObjects.find(obj => obj.name === o.parent)?.isActive === false) return;
		if (ignoreNameList && ignoreNameList.findIndex(ignore => ignore == o.name || o.name.endsWith(ignore)) != -1) return;
		const img = images[o.texture];
		if (!img || !img.complete) return;
		const ppu = o.pixelPerUnit;
		const worldSize = { w: img.width / ppu, h: img.height / ppu };
		const worldPos = getWorldPosition(o.name);
		const worldAngle = getWorldAngle(o.name);
		c.save();
		c.translate(worldPos.x, worldPos.y);
		c.rotate(-worldAngle * Math.PI / 180);
		c.drawImage(
			img,
			-o.pivotPoint.x * worldSize.w,
			-(1 - o.pivotPoint.y) * worldSize.h,
			worldSize.w,
			worldSize.h
		);
		c.restore();
	});
	c.restore();
	// Поиск границ непустых пикселей по альфа-каналу
	const imgData = c.getImageData(0, 0, w, h);
	const data = imgData.data;
	let minX = w, minY = h, maxX = -1, maxY = -1;
	for (let y = 0; y < h; y++) {
		const row = y * w * 4;
		for (let x = 0; x < w; x++) {
			const a = data[row + x * 4 + 3]; // альфа
			if (a >= alphaThreshold) {
				if (x < minX) minX = x;
				if (y < minY) minY = y;
				if (x > maxX) maxX = x;
				if (y > maxY) maxY = y;
			}
		}
	}
	// Если всё прозрачно — вернуть 1x1 прозрачный PNG
	if (maxX < minX || maxY < minY) {
		const empty = document.createElement('canvas');
		empty.width = empty.height = 1;
		return empty.toDataURL('image/png').split(',')[1];
	}
	const cropW = maxX - minX + 1;
	const cropH = maxY - minY + 1;
	const out = document.createElement('canvas'); // Обрезка в новый canvas
	out.width = cropW;
	out.height = cropH;
	const outCtx = out.getContext('2d');
	outCtx.drawImage(off, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
	return {base64: out.toDataURL('image/png'), points: convertedPoint};  // Превращаем PNG в BASE64  // "data:image/png;base64,XXXX"
} */


function getObjectAtPoint(wx, wy) {
	lastMouseClickPoint.x = wx; lastMouseClickPoint.y = wy;
	const sortedForHit = [...sceneObjects].sort((a, b) => (a.parent === "" ? 1 : 0) - (b.parent === "" ? 1 : 0) || b.sortingOrder - a.sortingOrder);
	for (const o of sortedForHit) {
		const img = images[o.texture];
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
	return sceneObjects.find(o => o.parent == "");
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
	if (sceneObjects.length != 0) {//Указать позицию родителя, если список объектов был очищен и заново сделан
		const parent = sceneObjects.find(obj => obj.parent == "");
		if (parent) {
			parent.localPosition.x = lastParentPosition.x;
			parent.localPosition.y = lastParentPosition.y;
		}
	}
}

function buildTree() {
	const byName = {};
	const tree = [];
	sceneObjects.forEach(o => {
		byName[o.name] = { ...o, children: [] };
	});
	sceneObjects.forEach(o => {
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
propertyInputs.posX.addEventListener('input', () => { if (selectedObject) { sceneObjects[objectId].localPosition.x = parseFloat(propertyInputs.posX.value); renderScene(); } });
propertyInputs.posY.addEventListener('input', () => { if (selectedObject) { sceneObjects[objectId].localPosition.y = -parseFloat(propertyInputs.posY.value); renderScene(); } });
propertyInputs.angle.addEventListener('input', () => { if (selectedObject) { sceneObjects[objectId].localAngle = parseFloat(propertyInputs.angle.value); propertyInputs.angleSlider.value = sceneObjects[objectId].localAngle; renderScene(); } });
propertyInputs.angleSlider.addEventListener('input', () => { if (selectedObject) { sceneObjects[objectId].localAngle = Math.round(parseFloat(propertyInputs.angleSlider.value)); propertyInputs.angle.value = sceneObjects[objectId].localAngle; renderScene(); } });
propertyInputs.sortingOrder.addEventListener('input', () => { if (selectedObject) { sceneObjects[objectId].sortingOrder = parseInt(propertyInputs.sortingOrder.value); renderScene(); } });
propertyInputs.pixelsPerUnit.addEventListener('input', () => { if (selectedObject) { sceneObjects[objectId].pixelPerUnit = Math.max(50, Math.min(300, parseFloat(propertyInputs.pixelsPerUnit.value))); renderScene(); } });
propertyInputs.pivotX.addEventListener('input', () => { if (selectedObject) { sceneObjects[objectId].pivotPoint.x = parseFloat(propertyInputs.pivotX.value); renderScene(); } });
propertyInputs.pivotY.addEventListener('input', () => { if (selectedObject) { sceneObjects[objectId].pivotPoint.y = parseFloat(propertyInputs.pivotY.value); renderScene(); } });
propertyInputs.texture.addEventListener('input', () => { if (selectedObject) { sceneObjects[objectId].texture = propertyInputs.texture.value; renderScene(); } });
propertyInputs.enabled.addEventListener('input', () => { if (selectedObject) { sceneObjects[objectId].enabled = propertyInputs.enabled.checked; renderScene(); } });
propertyInputs.isActive.addEventListener('input', () => { if (selectedObject) { sceneObjects[objectId].isActive = propertyInputs.isActive.checked; renderScene(); } });

document.getElementById('sceneFileInput').addEventListener('input', (fileEvent) => {
	const file = fileEvent.target.files[0];
	if (!file) return;
	const reader = new FileReader();
	reader.onload = e => {
		const base64 = e.target.result;
		sceneObjects[objectId].texture = base64;
		// Обрезаем прозрачные края
		trimTransparentEdges(base64, 512, 1, 1, trimmedBase64 => {
			propertyInputs.texture.value = trimmedBase64;
			propertyInputs.texture.dispatchEvent(fileEvent);
			console.log("fileEvent: " + fileEvent.type);
			preloadImages(); //Перезагрузка кэша с изображениями
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
					if (a(getCoord === 'x' ? i : j, getCoord === 'x' ? j : i) !== 0) return i;
				}
			}
			return getCoord === 'x' ? width : height;
		};
		let top = findEdge(0, height, step, 'y');
		let bottom = findEdge(height - 1, -1, -step, 'y') + 1;
		let left = findEdge(0, width, step, 'x');
		let right = findEdge(width - 1, -1, -step, 'x') + 1;
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
	if (!obj) { propertiesDiv.style.display = 'none'; return; }
	objectId = sceneObjects.indexOf(obj);
	if (objectId == -1) objectId = sceneObjects.findIndex(item => item.name == obj.name);
	if (objectId == -1) console.warn("selectObject: NULL - объект не найден");
	selectedObject = sceneObjects[objectId];
	if (selectedObject && spriteScreenListeners[selectedObject.name]) spriteScreenListeners[selectedObject.name].onSelect(selectedObject);
	propertiesDiv.style.display = 'block';
	// Обновляем значения полей
	propertyInputs.name.innerHTML = obj.name || '';
	propertyInputs.posX.value = parseFloat(obj.localPosition?.x).toFixed(3) || 0;
	propertyInputs.posY.value = -parseFloat(obj.localPosition?.y).toFixed(3) || 0;
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
	objectId = sceneObjects.findIndex(obj => path.endsWith(obj.name));
	if (objectId != -1) { selectObject(sceneObjects[objectId]); } else { renderScene(); }
}

//const addButton = document.getElementById('add-object');
//addButton.addEventListener('click', addObject); <button id="add-object" style="margin-top: 10px;">Добавить Объект</button>
function addObject() {
	const name = prompt('Enter object name:');
	if (!name || sceneObjects.find(o => o.name === name)) {
		alert('Invalid or duplicate name.');
		return;
	}
	const parent = prompt('Enter parent name (or empty for root):');
	sceneObjects.push({
		name,
		parent: parent || '',
		texture: '',
		localPosition: { x: 0, y: 0 },
		localAngle: 0,
		sortingOrder: 0,
		pixelPerUnit: 100,
		pivotPoint: { x: 0.5, y: 0.5 },
		enabled: true
	});
	preloadImages();
	refreshHierarchy();
	renderScene();
}


canvas.addEventListener('mousedown', (e) => {
	startMove(e.clientX, e.clientY, e.button == 1);
});
canvas.addEventListener('touchstart', (e) => {
	e.preventDefault();
	const touch = e.touches[0];
	startMove(touch.clientX, touch.clientY, 2 <= e.touches.length);
}, { passive: false });

function startMove(mouseX, mouseY, parentMove) {
	const rect = canvas.getBoundingClientRect();
	const mouseSx = (mouseX - rect.left) * (canvas.width / rect.width);
	const mouseSy = (mouseY - rect.top) * (canvas.height / rect.height);
	const wx = (mouseSx - canvas.width / 2) / viewPPU;
	const wy = (mouseSy - canvas.height / 2) / viewPPU;
	let pivotHitObject = null;// Check for pivot hit on any object
	// const sortedForHit = [...sceneObjects].sort((a, b) => (a.parent === "" ? 1 : 0) - (b.parent === "" ? 1 : 0) || b.sortingOrder - a.sortingOrder);
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
		const img = images[o.texture];
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
		return;
	}

	// If no pivot hit, check for object body hit
	const hit = (parentMove) ? getObjectAtPoint(999, 999) : getObjectAtPoint(wx, wy); //При нажатии на колесо мыши выбрать родительский объект
	if (hit) {
		if (hit !== selectedObject) {
			selectObject(hit);
		}
		isDragging = true;
		dragObject = hit;
		dragStartMouseWorld = { x: wx, y: wy };
		dragStartWorldPos = getWorldPosition(hit.name);
	}
}

canvas.addEventListener('mousemove', (e) => {
	mouseMove(e.clientX, e.clientY, e.shiftKey);
});
canvas.addEventListener('touchmove', (e) => {
	e.preventDefault();
	const touch = e.touches[0];
	mouseMove(touch.clientX, touch.clientY);
}, { passive: false });

function mouseMove(mouseX, mouseY, shiftKey) {
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
		dragObject.localPosition.x = newLocalPos.x.toFixed(3);
		dragObject.localPosition.y = newLocalPos.y.toFixed(3);
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
			sceneObjects.forEach(child => { //Двигать дочерние объекты в обратную сторону, когда курсор мыши перемещает точку вращения у родительского объекта
				if (child.parent != "" && child.parent == dragObject.name && child.name != dragObject.name) { //Таким образом объекты на экране остаются на месте, когда мы двигаем опорную точку
					child.localPosition.x = Math.round((parseFloat(child.localPosition.x) + parseFloat(dragObject.localPosition.x) - newLocalPos.x) / 0.0001) * 0.0001;
					child.localPosition.y = Math.round((parseFloat(child.localPosition.y) + parseFloat(dragObject.localPosition.y) - newLocalPos.y) / 0.0001) * 0.0001;
				}
			});
		}
		o.localPosition.x = newLocalPos.x;
		o.localPosition.y = newLocalPos.y;

		renderScene();
	}

};


canvas.addEventListener('mouseup', mouseUp);
canvas.addEventListener('touchcancel', mouseUp, { passive: false });
canvas.addEventListener('touchend', mouseUp, { passive: false });
function mouseUp() {
	if (isDragging) {
		isDragging = false;
		dragObject = null;
	} else if (isDraggingPivot) {
		isDraggingPivot = false;
		dragObject = null;
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
function handleTouchStart(e) {
	if (e.touches.length === 2) {
		isPinching = true;
		initialPinchDistance = getPinchDistance(e.touches);
		e.preventDefault();
	}
}
function handleTouchMove(e) {
	if (isPinching && e.touches.length === 2) {
		e.preventDefault();
		const currentDistance = getPinchDistance(e.touches);
		if (initialPinchDistance && currentDistance) {
			const scale = currentDistance / initialPinchDistance;// Вычисляем коэффициент масштабирования
			const newViewPPU = viewPPU * scale;// Применяем как мультипликативный zoom (аналог wheel)
			viewPPU = Math.max(10, Math.min(500, newViewPPU));// Ограничиваем диапазон
			initialPinchDistance = currentDistance;// Обновляем начальное расстояние для плавного следования
			renderScene();
		}
	}
}
function handleTouchEnd(e) {
	if (isPinching) {
		isPinching = false;
		initialPinchDistance = null;
	}
}

// Initialize
preloadImages();
refreshHierarchy();
renderScene();
