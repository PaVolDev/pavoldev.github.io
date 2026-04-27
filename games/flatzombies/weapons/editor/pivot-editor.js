//——— ФУНКЦИИ РЕДАКТОРА ТОЧКИ ВРАЩЕНИЯ ———
//Показать редактор точки вращения
function showPivotPointEditor(pivotParamPath, spriteParamPath) {
	pivotEditorParam = pivotParamPath; //Сохраняем путь к параметру
	const pivotParam = findByPath(pivotParamPath);
	if (!pivotParam) {
		console.error('showPivotPointEditor: параметр не найден - ' + pivotParamPath);
		return;
	}
	//Парсим текущие координаты точки вращения
	const pivotValue = pivotParam.value || '(0.5, 0.5)';
	const coords = parseVector(pivotValue);
	pivotPoint = { x: coords[0], y: coords[1] };
	//Находим связанный параметр спрайта для получения Base64 изображения
	const spriteParam = findByPath(spriteParamPath);
	if (!spriteParam || !spriteParam.value) {
		console.error('showPivotPointEditor: не удалось найти спрайт для параметра ' + pivotParamPath);
		alert('Не удалось найти изображение для редактирования точки вращения');
		return;
	}
	//Загружаем изображение из Base64
	pivotEditorImage = new Image();
	pivotEditorImage.onload = function () {
		initPivotCanvas();
	};
	pivotEditorImage.src = spriteParam.value;
	//Показываем панель редактора
	document.getElementById('pivotPointEditor').classList.remove('hidden');
	document.getElementById('pivotPointEditor').style.display = 'flex';
	//Обновляем поля ввода координат
	document.getElementById('pivotX').value = pivotPoint.x.toFixed(2);
	document.getElementById('pivotY').value = pivotPoint.y.toFixed(2);
}

//Инициализация canvas для редактора
function initPivotCanvas() {
	const canvas = document.getElementById('pivotCanvas'); //Холст редактора pivot.
	const ctx = canvas.getContext('2d'); //Контекст рисования холста.
	const container = canvas.parentElement; //Контейнер холста для отслеживания мыши вне границ изображения.
	const targetWidth = 600; //Базовая ширина области предпросмотра.
	const targetHeight = 400; //Базовая высота области предпросмотра.
	let canvasWidth = targetWidth; //Рабочая ширина холста.
	let canvasHeight = targetHeight; //Рабочая высота холста.
	const imageRatio = pivotEditorImage.naturalWidth / pivotEditorImage.naturalHeight; //Соотношение сторон изображения.
	const canvasRatio = canvasWidth / canvasHeight; //Соотношение сторон базовой области.

	if (imageRatio > canvasRatio) {
		canvasHeight = canvasWidth / imageRatio;
	} else {
		canvasWidth = canvasHeight * imageRatio;
	}
	canvas.width = canvasWidth;
	canvas.height = canvasHeight;
	canvas.style.width = canvasWidth + 'px';
	//canvas.style.height = canvasHeight + 'px';
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(pivotEditorImage, 0, 0, canvas.width, canvas.height);
	drawPivotPoint(ctx, canvas.width, canvas.height);
	canvas.onmousedown = onPivotCanvasMouseDown;
	canvas.onmousemove = onPivotCanvasMouseMove;
	canvas.onmouseup = onPivotCanvasMouseUp;
	canvas.onmouseleave = null;
	container.onmousemove = onPivotCanvasContainerMouseMove;
	container.onmouseup = onPivotCanvasMouseUp;
	container.onmouseleave = onPivotCanvasMouseUp;
	canvas.ontouchstart = onPivotCanvasTouchStart;
	canvas.ontouchmove = onPivotCanvasTouchMove;
	canvas.ontouchend = onPivotCanvasTouchEnd;
	canvas.ontouchcancel = onPivotCanvasTouchEnd;
	container.ontouchmove = onPivotCanvasContainerTouchMove;
	container.ontouchend = onPivotCanvasTouchEnd;
	container.ontouchcancel = onPivotCanvasTouchEnd;
}

//Рисование точки вращения
function drawPivotPoint(ctx, canvasWidth, canvasHeight) {
	//Преобразуем координаты из нормализованных (0-1) в пиксели
	//Начало координат в нижнем правом углу
	const pixelX = canvasWidth * pivotPoint.x;
	const pixelY = canvasHeight * (1 - pivotPoint.y); //Инвертируем Y для нижнего начала координат

	//Фиксированные размеры точки вращения (не зависят от размера изображения)
	const circleRadius = 12; //Радиус круга
	const crossSize = 20; //Размер перекрестия
	const centerDotRadius = 4; //Радиус центральной точки
	const lineWidth = 2; //Толщина линии

	//Рисуем круг
	ctx.beginPath();
	ctx.arc(pixelX, pixelY, circleRadius, 0, Math.PI * 2);
	ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
	ctx.fill();
	ctx.lineWidth = lineWidth;
	ctx.strokeStyle = '#ff0000';
	ctx.stroke();

	//Рисуем перекрестие
	ctx.beginPath();
	ctx.moveTo(pixelX - crossSize, pixelY);
	ctx.lineTo(pixelX + crossSize, pixelY);
	ctx.moveTo(pixelX, pixelY - crossSize);
	ctx.lineTo(pixelX, pixelY + crossSize);
	ctx.strokeStyle = '#ffffff';
	ctx.stroke();

	//Рисуем центр
	ctx.beginPath();
	ctx.arc(pixelX, pixelY, centerDotRadius, 0, Math.PI * 2);
	ctx.fillStyle = '#ffffff';
	ctx.fill();
}

//Получить координаты мыши относительно canvas
function getMousePos(canvas, event) {
	const rect = canvas.getBoundingClientRect(); //Границы холста на экране.
	const scaleX = canvas.width / rect.width; //Масштаб X между CSS-размером и внутренним буфером canvas.
	const scaleY = canvas.height / rect.height; //Масштаб Y между CSS-размером и внутренним буфером canvas.
	return {
		x: (event.clientX - rect.left) * scaleX,
		y: (event.clientY - rect.top) * scaleY
	};
}

//Перерисовка canvas редактора pivot
function redrawPivotCanvas(canvas) { //Обновляет изображение и pivot-точку на холсте.
	const ctx = canvas.getContext('2d'); //Контекст рисования холста.
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(pivotEditorImage, 0, 0, canvas.width, canvas.height);
	drawPivotPoint(ctx, canvas.width, canvas.height);
}

//Обновление pivot-точки по позиции указателя
function updatePivotPointFromEvent(canvas, event) { //Ограничивает pivot в пределах изображения даже вне canvas.
	const pos = getMousePos(canvas, event); //Координаты указателя относительно холста.
	pivotPoint.x = Math.max(0, Math.min(1, pos.x / canvas.width));
	pivotPoint.y = Math.max(0, Math.min(1, 1 - pos.y / canvas.height));
	document.getElementById('pivotX').value = pivotPoint.x.toFixed(2);
	document.getElementById('pivotY').value = pivotPoint.y.toFixed(2);
	redrawPivotCanvas(canvas);
}

//Обработка нажатия мыши на canvas
function onPivotCanvasMouseDown(event) {
	const canvas = event.target;
	const pos = getMousePos(canvas, event);
	//Проверяем, попали ли в точку вращения
	const pixelX = canvas.width * pivotPoint.x;
	const pixelY = canvas.height * (1 - pivotPoint.y);
	const distance = Math.sqrt((pos.x - pixelX) ** 2 + (pos.y - pixelY) ** 2);
	//if (distance <= 20) {
	isDragSpritePivot = true;
	canvas.style.cursor = 'move';
}

//Обработка движения мыши над canvas
function onPivotCanvasMouseMove(event) {
	const canvas = document.getElementById('pivotCanvas'); //Холст редактора pivot.
	const pos = getMousePos(canvas, event); //Координаты указателя относительно холста.
	if (isDragSpritePivot) {
		updatePivotPointFromEvent(canvas, event);
	} else {
		const pixelX = canvas.width * pivotPoint.x; //Позиция pivot по X в пикселях.
		const pixelY = canvas.height * (1 - pivotPoint.y); //Позиция pivot по Y в пикселях.
		const distance = Math.sqrt((pos.x - pixelX) ** 2 + (pos.y - pixelY) ** 2); //Расстояние от курсора до pivot-точки.
		canvas.style.cursor = (distance <= 20) ? 'move' : 'crosshair';
	}
}

//Обработка движения мыши в контейнере canvas
function onPivotCanvasContainerMouseMove(event) { //Продолжает перетаскивание при выходе курсора за границы canvas.
	const canvas = document.getElementById('pivotCanvas'); //Холст редактора pivot.
	if (!isDragSpritePivot || event.target === canvas) {
		return;
	}
	updatePivotPointFromEvent(canvas, event);
}

//Обработка отпускания мыши
function onPivotCanvasMouseUp(event) {
	isDragSpritePivot = false;
	if (event.target) {
		event.target.style.cursor = 'crosshair';
	}
}

//Обработка касания для сенсорных устройств
function getPivotTouchPoint(event) {
	if (event.touches && event.touches.length > 0) {
		return event.touches[0];
	}
	if (event.changedTouches && event.changedTouches.length > 0) {
		return event.changedTouches[0];
	}
	return null;
}

function onPivotCanvasTouchStart(event) {
	event.preventDefault();
	const touch = getPivotTouchPoint(event); //Текущее касание на экране.
	const canvas = document.getElementById('pivotCanvas'); //Холст редактора pivot.
	if (!touch || !canvas) {
		return;
	}
	onPivotCanvasMouseDown({
		clientX: touch.clientX,
		clientY: touch.clientY,
		target: canvas
	});
}

function onPivotCanvasTouchMove(event) {
	event.preventDefault();
	const touch = getPivotTouchPoint(event); //Текущее касание на экране.
	const canvas = document.getElementById('pivotCanvas'); //Холст редактора pivot.
	if (!touch || !canvas) {
		return;
	}
	//Вычисления координат выполняются через onPivotCanvasMouseMove -> getMousePos,
	//чтобы поведение на touch полностью совпадало с mouse.
	onPivotCanvasMouseMove({
		clientX: touch.clientX,
		clientY: touch.clientY,
		target: canvas
	});
}

function onPivotCanvasContainerTouchMove(event) {
	event.preventDefault();
	const touch = getPivotTouchPoint(event); //Текущее касание на экране.
	const canvas = document.getElementById('pivotCanvas'); //Холст редактора pivot.
	if (!touch || !canvas) {
		return;
	}
	onPivotCanvasContainerMouseMove({
		clientX: touch.clientX,
		clientY: touch.clientY,
		target: event.target
	});
}

function onPivotCanvasTouchEnd(event) {
	event.preventDefault();
	const canvas = document.getElementById('pivotCanvas'); //Холст редактора pivot.
	onPivotCanvasMouseUp({ target: canvas });
}

//Обновление координат из полей ввода
function updatePivotFromInput() {
	const x = parseFloat(document.getElementById('pivotX').value); //Значение X из поля ввода.
	const y = parseFloat(document.getElementById('pivotY').value); //Значение Y из поля ввода.
	if (!isNaN(x) && !isNaN(y)) {
		pivotPoint.x = Math.max(0, Math.min(1, x));
		pivotPoint.y = Math.max(0, Math.min(1, y));
		const canvas = document.getElementById('pivotCanvas'); //Холст редактора pivot.
		redrawPivotCanvas(canvas);
	}
}

//Применить изменения точки вращения
function applyPivotPoint() {
	if (!pivotEditorParam) return;
	const param = findByPath(pivotEditorParam);
	if (param) {
		//Формируем новое значение в формате "(x, y)"
		const newValue = `(${pivotPoint.x.toFixed(2)}, ${pivotPoint.y.toFixed(2)})`;
		param.value = newValue;
		//Обновляем UI
		const pivotInputX = document.getElementById(pivotEditorParam + '.x');
		const pivotInputY = document.getElementById(pivotEditorParam + '.y');
		if (pivotInputX) pivotInputX.value = pivotPoint.x.toFixed(2);
		if (pivotInputY) pivotInputY.value = pivotPoint.y.toFixed(2);
		//Синхронизируем сценой
		if (typeof syncParamsToScene === 'function') {
			syncParamsToScene();
		}
	}
	closePivotPointEditor();
}

//Закрыть редактор точки вращения
function closePivotPointEditor() {
	document.getElementById('pivotPointEditor').classList.add('hidden');
	document.getElementById('pivotPointEditor').style.display = 'none';
	pivotEditorParam = null;
	pivotEditorImage = null;
	isDragSpritePivot = false;
}