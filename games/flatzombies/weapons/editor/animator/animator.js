//Скрипт для работы с ключевыми кадрами анимации.

// Данные анимации из Unity AnimationClip JSON
let animationData = { curves: [], events: [], sprites: [] }; // Основной объект данных анимации: содержит кривые (curves), события (events), спрайты (sprites), метаданные
// Экспортируем в global для доступа из animation-scene-binding.js
window.animationData = animationData;
window.timelineAnimationData = animationData;

// Объект конфигурации: хранит настройки воспроизведения, масштаб, текущее время и состояние анимации
let config = {
	fps: 30, // Будет установится из JSON
	duration: 0, // Будет установлено из JSON в секундах
	offsetSeconds: 0, // Смещение времени в секундах
	scale: 400, // Пикселей на секунду
	playing: false,
	currentTime: 0, // в секундах
	animationId: null
};
//Список анимируемых свойств, которые следует убрать при загрузки клипа из файла, т.к. эти свойства не используются в игре
const propertyNameIgnoreFilter = ["localEulerAnglesRaw.y", "localEulerAnglesRaw.x"];
let sourceAnimationCurves = []; // Полный список кривых анимации без фильтра поиска.
let filteredAnimationCurves = []; // Временный список кривых, подходящих под текущий поиск.
let currentTimelineSearchText = ""; // Текущий текст поиска по списку свойств.
// Экспортируем в global для доступа из animation-scene-binding.js
window.config = config;

//Массив выделенных ключей: [{trackId, keyIndex}]
let selectedKeyframes = []; // массив выделенных ключей: [{trackId, keyIndex}] — хранит выбранные ключевые кадры для редактирования
let selectedMasterTimes = []; // массив выделенных master-ключей (время) — хранит выбранные временные метки мастер-трека
let selectedEventIndexes = []; // Массив выделенных событий — хранит индексы выбранных событий анимации для редактирования

//Функция для снятия выделения со всех ключевых кадров
function deselectAllKeyframes() { // начало функции для снятия выделения со всех ключевых кадров
	selectedKeyframes = []; // очищаем массив выделенных ключевых кадров
	selectedMasterTimes = []; // очищаем выделение master-ключей
	renderTracks(); // перерисовываем треки
}

function cleanupSelectionState() {
	const validSelection = [];
	const validMasterTimes = new Set();

	selectedKeyframes.forEach(selection => {
		const curve = getCurveById(selection.trackId);
		const keyIndex = Number(selection.keyIndex);
		if (!curve || !curve.keys || !curve.keys[keyIndex]) return;

		validSelection.push({
			trackId: selection.trackId,
			keyIndex
		});
		validMasterTimes.add(snapTimeToFrame(curve.keys[keyIndex].time));
	});

	selectedKeyframes = validSelection;
	selectedMasterTimes = Array.from(validMasterTimes).sort((a, b) => a - b);
	selectedEventIndexes = selectedEventIndexes.filter(index => animationData?.events?.[index]);
}

function refreshTimelineAfterKeyframeChange(options = {}) {
	const {
		preserveSelection = false,
		restoreScene = false,
		hideInspector = true
	} = options;

	if (preserveSelection) {
		cleanupSelectionState();
	} else {
		selectedKeyframes = [];
		selectedMasterTimes = [];
	}

	if (hideInspector && selectedEventIndexes.length === 0) {
		inspectorPanelEl.style.display = "none";
	}

	if (restoreScene && window.AnimationBinding?.resetSceneState) {
		window.AnimationBinding.resetSceneState();
	}

	config.forceAnimationRefresh = true; // флаг принудительного обновления сцены после изменения ключей
	updateRulers();
	renderTracks();
	updatePlayhead();
}

function deleteSelectedKeyframes() {
	if (!animationData?.curves || selectedKeyframes.length === 0) return false;

	const groupedSelection = new Map();
	selectedKeyframes.forEach(selection => {
		if (!groupedSelection.has(selection.trackId)) {
			groupedSelection.set(selection.trackId, new Set());
		}
		groupedSelection.get(selection.trackId).add(Number(selection.keyIndex));
	});

	let removedCount = 0;
	animationData.curves.forEach(curve => {
		const trackId = getTrackId(curve);
		const selectedIndexes = groupedSelection.get(trackId);
		if (!selectedIndexes || !curve.keys?.length) return;

		curve.keys = curve.keys.filter((_, keyIndex) => {
			const shouldKeep = !selectedIndexes.has(keyIndex);
			if (!shouldKeep) removedCount++;
			return shouldKeep;
		});
	});

	if (removedCount === 0) return false;

	refreshTimelineAfterKeyframeChange({
		preserveSelection: false,
		restoreScene: true
	});
	return true;
}

//Флаги для обработки drag-and-drop
let isDraggingKeyframe = false; // Флаг, активна ли операция перетаскивания (для keyframe и event-marker)
let dragStartX = 0; // Начальная X-координата курсора при начале перетаскивания — используется для вычисления смещения
let dragStartActualTime = 0; // Фактическое время активного элемента в начале перетаскивания — начальная временная метка
let dragStartAllKeyTimes = new Map(); // Карта для хранения начальных времен всех выделенных ключей — сохраняет состояние до перетаскивания
let dragStartAllEventTimes = new Map(); // Карта для хранения начальных времен выделенных событий — сохраняет время событий до перетаскивания
let activeDragSession = null; // Текущая сессия перетаскивания (type: keyframe | event) — хранит информацию о типе и параметрах текущей операции drag

//Отображаемые секунды (видимая область)
let displaySeconds = 10; // Количество секунд, отображаемых в видимой области таймлайна
let displayFrames = 0; // Будет вычислено из displaySeconds * fps — общее количество кадров в видимой области

// DOM элементы
const timelinePanel = document.getElementById("timeline-panel"); // Основная панель таймлайна, содержит все элементы управления
const fpsInput = document.getElementById("fps-input"); // Поле ввода для установки FPS (кадров в секунду)
const playBtn = document.getElementById("play-btn"); // Кнопка воспроизведения/паузы анимации
const currentTimeEl = document.getElementById("current-time"); // Элемент отображения текущего времени и номера кадра
const playheadEl = document.getElementById("playhead"); // Вертикальная линия (указатель) текущей позиции воспроизведения
const propertyListEl = document.getElementById("property-list"); // Список свойств/треков для выбора
const tracksEl = document.getElementById("tracks"); // Контейнер для отрисовки треков с ключевыми кадрами
const masterTrackEl = document.getElementById("master-track"); // Мастер-трек для группировки ключей по времени
const eventsTrackEl = document.getElementById("events-track"); // Трек для отображения событий анимации
const inspectorPanelEl = document.getElementById("inspector-panel"); // Панель инспектора для редактирования событий
const eventDetailsContentEl = document.getElementById("event-details-content"); // Контейнер содержимого деталей событий
const frameRulerEl = document.getElementById("frame-ruler"); // Шкала отображения номеров кадров
const timeRulerEl = document.getElementById("time-ruler"); // Шкала отображения времени в секундах
const timelineHeaderEl = document.querySelector(".timeline-header"); // Заголовок таймлайна для перемещения playhead
const tracksContainerEl = document.querySelector(".tracks-container"); // Контейнер для всех треков
const keyframeValueInput = document.getElementById("keyframe-value"); // Поле ввода значения ключевого кадра
const keyframeTimeInput = document.getElementById("keyframe-time"); // Поле ввода времени ключевого кадра
const timelineSearchInput = document.getElementById("timeline-search"); // Поле поиска и фильтрации списка свойств таймлайна.

//Вспомогательные функции - преобразование времени и кадров
const timeToFrame = (time) => time * config.fps;
const frameToTime = (frame) => frame / config.fps;
const timeToPx = (time) => (time - config.offsetSeconds) * config.scale;
const pxToTime = (px) => px / config.scale + config.offsetSeconds;
const frameToPx = (frame) => frameToTime(frame) * config.scale - config.offsetSeconds * config.scale;

function getTimelineFrameRate() {
	const frameRate = Number(animationData?.frameRate);
	if (Number.isFinite(frameRate) && frameRate > 0) return frameRate;
	if (Number.isFinite(config.fps) && config.fps > 0) return config.fps;
	return 30;
}

function snapTimeToFrame(time) {
	const fps = getTimelineFrameRate();
	return Math.round(time * fps) / fps;
}

function clampAndSnapTime(time, maxTime = config.duration) {
	const normalizedMaxTime = Number.isFinite(maxTime) ? Math.max(0, maxTime) : Math.max(0, config.duration);
	const clampedTime = Math.max(0, Math.min(normalizedMaxTime, time));
	return snapTimeToFrame(clampedTime);
}

//Получение уникального ID трека
function getTrackId(track) {
	return `${track.path}|${track.propertyName}`;
}

//Получение кривой по ID
function getCurveById(trackId) {
	return animationData.curves.find(c => getTrackId(c) === trackId);
}

function getFullAnimationCurves() { // Возвращает полный список кривых для внешних систем и предпросмотра.
	if (Array.isArray(sourceAnimationCurves) && sourceAnimationCurves.length > 0) {
		return sourceAnimationCurves;
	}
	return Array.isArray(animationData?.curves) ? animationData.curves : [];
}

function updateGlobalAnimationCurveReferences() { // Синхронизирует глобальные ссылки на полные и отфильтрованные curves.
	if (!window.animationData || window.animationData === animationData) {
		window.animationData = {
			...animationData,
			curves: getFullAnimationCurves()
		};
	} else {
		window.animationData.curves = getFullAnimationCurves();
		window.animationData.events = animationData.events;
		window.animationData.sprites = animationData.sprites;
		window.animationData.frameRate = animationData.frameRate;
		window.animationData.length = animationData.length;
		window.animationData.clipName = animationData.clipName;
	}

	window.timelineAnimationData = {
		...animationData,
		curves: Array.isArray(filteredAnimationCurves) ? filteredAnimationCurves : animationData.curves
	};
}

//Получение трека по trackId
function getTrack(trackId) {
	const [path, propertyName] = trackId.split('|');
	return { path, propertyName };
}

function syncFilteredCurvesBackToSource() { // Сохраняет изменения из отфильтрованного списка обратно в полный список кривых.
	if (!Array.isArray(sourceAnimationCurves) || sourceAnimationCurves.length === 0) return;
	if (!Array.isArray(animationData?.curves) || animationData.curves.length === 0) return;

	const sourceCurveById = new Map(); // Карта полных кривых по trackId.
	sourceAnimationCurves.forEach(curve => {
		sourceCurveById.set(getTrackId(curve), curve);
	});

	animationData.curves.forEach(curve => {
		const sourceCurve = sourceCurveById.get(getTrackId(curve));
		if (!sourceCurve) return;
		sourceCurve.keys = curve.keys;
	});
}

function syncSourceCurvesIntoVisibleList(visibleCurves) { // Переносит актуальные данные из полного списка в отображаемый список кривых.
	if (!Array.isArray(visibleCurves)) return;
	if (!Array.isArray(sourceAnimationCurves) || sourceAnimationCurves.length === 0) return;

	const sourceCurveById = new Map(); // Карта исходных кривых по trackId.
	sourceAnimationCurves.forEach(curve => {
		sourceCurveById.set(getTrackId(curve), curve);
	});

	visibleCurves.forEach(curve => {
		const sourceCurve = sourceCurveById.get(getTrackId(curve));
		if (!sourceCurve) return;
		curve.keys = sourceCurve.keys;
	});
}

function getFilteredCurvesBySearch(searchText) { // Возвращает список кривых, совпадающих с текущим текстом поиска.
	if (!Array.isArray(sourceAnimationCurves)) return [];
	const normalizedSearchText = (searchText || "").trim().toLowerCase(); // Нормализованный текст поиска.
	if (!normalizedSearchText) {
		return sourceAnimationCurves;
	}

	return sourceAnimationCurves.filter(curve => {
		const fileName = (curve.path || "").split('/').pop();
		const searchableText = `${curve.path || ""} ${fileName} ${curve.propertyName || ""}`.toLowerCase();
		return searchableText.includes(normalizedSearchText);
	});
}

function applyTimelineSearchFilter(searchText = "") { // Применяет поиск к списку редактируемых кривых таймлайна.
	syncFilteredCurvesBackToSource();
	currentTimelineSearchText = searchText;
	filteredAnimationCurves = getFilteredCurvesBySearch(searchText); // Кривые, подходящие под активный фильтр поиска.
	syncSourceCurvesIntoVisibleList(filteredAnimationCurves);
	animationData.curves = filteredAnimationCurves;
	updateGlobalAnimationCurveReferences();
	cleanupSelectionState();
	renderPropertyList();
	renderTracks();
	updatePlayhead();
}

// Вычисление шага для шкалы кадров в зависимости от зума
function getSecondsStep() {
	if (config.scale >= 100) return 1;
	if (config.scale >= 50) return 0.5;
	if (config.scale >= 25) return 0.2;
	return 0.1;
}

//Интерполяция значения между ключевыми кадрами (Linear)
function interpolateValue(keys, time) {
	if (!keys || keys.length === 0) return 0;

	// Если время до первого ключа
	if (time <= keys[0].time) return keys[0].value;

	// Если время после последнего ключа
	if (time >= keys[keys.length - 1].time) return keys[keys.length - 1].value;

	// Поиск интервала
	for (let i = 0; i < keys.length - 1; i++) {
		if (time >= keys[i].time && time <= keys[i + 1].time) {
			const t0 = keys[i].time;
			const t1 = keys[i + 1].time;
			const v0 = keys[i].value;
			const v1 = keys[i + 1].value;

			// Линейная интерполяция
			const t = (time - t0) / (t1 - t0);
			return v0 + t * (v1 - v0);
		}
	}

	return keys[keys.length - 1].value;
}

//Обход всех ключей и получение значения в заданное время
function getKeyValueAtTime(trackId, time) {
	const curve = getCurveById(trackId);
	if (!curve) return 0;

	const keys = curve.keys;
	if (!keys || keys.length === 0) return 0;

	for (let i = 0; i < keys.length; i++) {
		if (Math.abs(keys[i].time - time) < 0.001) {
			return keys[i].value;
		}
	}

	return interpolateValue(keys, time);
}

// Обновление шкал (фреймов и времени)
function updateRulers() {
	frameRulerEl.innerHTML = "";
	timeRulerEl.innerHTML = "";

	const step = getSecondsStep();
	const startSec = Math.floor(config.offsetSeconds / step) * step;
	const endSec = Math.ceil((config.offsetSeconds + displaySeconds) / step) * step;

	for (let t = startSec; t <= endSec; t += step) {
		const leftPx = timeToPx(t);

		// Шкала кадров
		const frameSpan = document.createElement("span");
		const frameNum = Math.round(t * config.fps);
		frameSpan.textContent = frameNum;
		frameSpan.style.left = `${leftPx}px`;
		frameRulerEl.appendChild(frameSpan);

		// Шкала времени
		const timeSpan = document.createElement("span");
		timeSpan.textContent = t.toFixed(2);
		timeSpan.style.left = `${leftPx}px`;
		timeRulerEl.appendChild(timeSpan);
	}
}

// Обновление позиции playhead
function updatePlayhead() {
	const leftPx = timeToPx(config.currentTime);
	playheadEl.style.left = `${leftPx}px`;
	const frame = Math.round(config.currentTime * config.fps);
	currentTimeEl.textContent = `Frame: ${frame} | Time: ${config.currentTime.toFixed(2)}s`;

	// Применяем анимацию к сцене
	if (window.AnimationBinding) {
		window.AnimationBinding.applyAnimationToScene();
	}
}
// Экспортируем функции в window для доступа из animation-scene-binding.js
window.updatePlayhead = updatePlayhead;
window.renderTracks = renderTracks;
window.renderPropertyList = renderPropertyList;

// Рендер списка свойств ( треков)
function renderPropertyList() {
	propertyListEl.innerHTML = "";

	if (!animationData || !animationData.curves) {
		return;
	}

	animationData.curves.forEach((curve, index) => {
		const trackId = getTrackId(curve);
		const li = document.createElement("li");
		const fileName = curve.path.split('/').pop();
		li.textContent = fileName + "." + curve.propertyName;
		li.dataset.trackId = trackId;
		li.dataset.trackIndex = index;
		li.dataset.path = curve.path;
		li.dataset.property = curve.propertyName;

		li.addEventListener("click", () => {
			document.querySelectorAll("#property-list li").forEach(el => el.classList.remove("selected"));
			li.classList.add("selected");
		});

		propertyListEl.appendChild(li);
	});

	if (propertyListEl.firstElementChild) {
		propertyListEl.firstElementChild.classList.add("selected");
	}
}

//Получение всех уникальных путей из кривых (не используется, но оставил на случай)
function getAllPaths() {
	const paths = {};
	animationData.curves.forEach(curve => {
		paths[curve.path] = (paths[curve.path] || 0) + 1;
	});
	return Object.keys(paths);
}

// Рендер треков
function renderTracks() {
	tracksEl.innerHTML = "";
	tracksEl.style.width = `${displaySeconds * config.scale}px`;

	if (!animationData || !animationData.curves) {
		return;
	}

	// Поиск максимального времени для ширины
	let maxTime = 0;

	animationData.curves.forEach((curve, trackIndex) => {
		const trackId = getTrackId(curve);
		const row = document.createElement("div");
		row.className = "track-row";
		row.dataset.trackId = trackId;
		row.dataset.trackIndex = trackIndex;

		// Отображаем только пути с ключами, отличными от дефолтных (по желанию)
		const hasActiveKeys = curve.keys.some(k =>
			Math.abs(k.value) > 0.01 || Math.abs(k.time) < config.duration - 0.01
		);

		// always render, because all curves are important
		curve.keys.forEach((key, keyIndex) => {
			const time = snapTimeToFrame(parseFloat(key.time));
			const leftPx = timeToPx(time);
			if (time > maxTime) maxTime = time; //обновить длительность анимации
			if (leftPx < -20 || leftPx > displaySeconds * config.scale + 20) return; // пропуск ключей за пределами видимой области
			const keyframeEl = document.createElement("div");
			keyframeEl.className = "keyframe";
			keyframeEl.style.left = `${leftPx}px`;
			keyframeEl.dataset.trackId = trackId;
			keyframeEl.dataset.trackIndex = trackIndex;
			keyframeEl.dataset.keyIndex = parseInt(keyIndex);
			keyframeEl.dataset.time = time;
			keyframeEl.dataset.value = key.value;
			keyframeEl.title = `${curve.propertyName}: t=${time.toFixed(3)}s, v=${key.value}`;

			// Проверка выделения
			const isSelected = selectedKeyframes.some(s => s.trackId == trackId && s.keyIndex == keyIndex);
			if (isSelected) {
				keyframeEl.classList.add("selected");
			} else {
				keyframeEl.classList.remove("selected");
			}

			keyframeEl.addEventListener("mousedown", e => {
				if (e.button !== 0) return; // Только ЛКМ
				if (e.shiftKey === false && selectedKeyframes.length <= 1) deselectAllKeyframes();
				e.stopPropagation();
				e.preventDefault();
				// Вызываем функцию перетаскивания
				startDraggingKeyframe(keyframeEl, curve, keyIndex, e);
			});
			row.appendChild(keyframeEl);
		});

		tracksEl.appendChild(row);
	});

	config.duration = maxTime;
	if (animationData) {
		animationData.length = config.duration;
	}
	displaySeconds = config.duration + 1;

	// Рендер master-track (общие ключи по времени)
	renderMasterTrack();
	renderEventsTrack();
}

// Создаём обработчик клика
function frameClickHandler(e) {
	e.stopPropagation();
	if (e.shiftKey) {
		// Удаление ключа
		curve.keys.splice(e.target.dataset.keyIndex, 1);
		renderTracks();
	}
};


// Рендер Events-track
function renderEventsTrack() {
	eventsTrackEl.innerHTML = "";
	eventsTrackEl.style.width = `${displaySeconds * config.scale}px`;

	if (!animationData || !animationData.events) {
		return;
	}

	// Группируем события по времени
	const timeMap = {};
	animationData.events.forEach((event, index) => {
		const t = snapTimeToFrame(event.time);
		if (!timeMap[t]) timeMap[t] = [];
		timeMap[t].push({ event, index });
	});

	const times = Object.keys(timeMap).sort((a, b) => parseFloat(a) - parseFloat(b));

	times.forEach(timeStr => {
		const time = parseFloat(timeStr);
		const eventsInFrame = timeMap[timeStr];
		const leftPx = timeToPx(time);

		const eventMarkerEl = document.createElement("div");
		eventMarkerEl.className = "event-marker";
		eventMarkerEl.style.left = `${leftPx}px`;
		eventMarkerEl.title = `Time: ${time.toFixed(3)}s (${eventsInFrame.length} events)`;
		eventMarkerEl.dataset.time = time;
		eventMarkerEl.dataset.eventIndexes = eventsInFrame.map(entry => entry.index).join(',');

		if (eventsInFrame.some(entry => selectedEventIndexes.includes(entry.index))) {
			eventMarkerEl.classList.add('selected');
		}

		eventMarkerEl.addEventListener("mousedown", (e) => {
			if (e.button !== 0) return;
			e.stopPropagation();
			e.preventDefault();

			const markerEventIndexes = eventsInFrame.map(entry => entry.index);
			const shouldResetSelection = !e.shiftKey && selectedEventIndexes.length <= markerEventIndexes.length;
			if (shouldResetSelection) {
				selectedEventIndexes = [];
			}

			const selectedSet = new Set(selectedEventIndexes);
			markerEventIndexes.forEach(index => selectedSet.add(index));
			selectedEventIndexes = Array.from(selectedSet).sort((a, b) => a - b);

			selectedKeyframes = [];
			selectedMasterTimes = [];
			updateKeyframeSelectionVisuals();
			updateMasterSelectionVisuals();
			updateEventSelectionVisuals();
			showEventDetails(getSelectedEventsForInspector());

			startDraggingEventMarker(eventMarkerEl, selectedEventIndexes, e);
		});
		eventsTrackEl.appendChild(eventMarkerEl);
	});
}

//Рендер master-track (показывает группы ключей в одно время)
function renderMasterTrack() {
	masterTrackEl.innerHTML = "";
	masterTrackEl.style.width = `${displaySeconds * config.scale}px`;

	if (!animationData || !animationData.curves) {
		return;
	}

	// Группируем ключи по времени
	const timeMap = {};
	animationData.curves.forEach((curve, trackIndex) => {
		curve.keys.forEach((key, keyIndex) => {
			const t = snapTimeToFrame(key.time);
			if (!timeMap[t]) timeMap[t] = [];
			timeMap[t].push({ trackId: getTrackId(curve), trackIndex, keyIndex, key });
		});
	});

	// Сортируем время
	const times = Object.keys(timeMap).sort((a, b) => parseFloat(a) - parseFloat(b));

	times.forEach(timeStr => {
		const time = parseFloat(timeStr);
		const entries = timeMap[timeStr];
		const leftPx = timeToPx(time);

		const masterKeyEl = document.createElement("div");
		masterKeyEl.className = "master-keyframe";
		masterKeyEl.style.left = `${leftPx}px`;
		masterKeyEl.title = `t=${time.toFixed(3)}s (${entries.length} keys)`;
		masterKeyEl.dataset.time = time;

		const isSelected = selectedMasterTimes.some(t => Math.abs(t - time) < 0.001);
		masterKeyEl.classList.toggle("selected", isSelected);

		masterKeyEl.addEventListener("mousedown", e => {
			if (e.button !== 0) return;
			e.stopPropagation();
			e.preventDefault();

			const clickedTime = snapTimeToFrame(time);
			const alreadySelected = selectedMasterTimes.some(t => Math.abs(t - clickedTime) < 0.001);

			if (!e.shiftKey && !alreadySelected) {
				selectedMasterTimes = [clickedTime];
			} else {
				const selectedSet = new Set(selectedMasterTimes.map(t => snapTimeToFrame(t)));
				selectedSet.add(clickedTime);
				selectedMasterTimes = Array.from(selectedSet).sort((a, b) => a - b);
			}

			selectedKeyframes = [];
			selectedMasterTimes.forEach(selectedTime => {
				selectedKeyframes.push(...collectKeyframesByTime(selectedTime));
			});
			const uniqueSelection = new Map(selectedKeyframes.map(s => [`${s.trackId}|${s.keyIndex}`, s]));
			selectedKeyframes = Array.from(uniqueSelection.values());
			selectedEventIndexes = [];

			updateKeyframeSelectionVisuals();
			updateMasterSelectionVisuals();
			updateEventSelectionVisuals();
			updateSelectedKeyframeInputs();

			startDraggingMasterKeys(e);
		});

		masterTrackEl.appendChild(masterKeyEl);
	});
}

//Функция для проверки, попадает ли элемент в прямоугольник выделения
function isElementInRect(element, rect) {
	const elementRect = element.getBoundingClientRect();
	return !(
		elementRect.right < rect.left ||
		elementRect.left > rect.right ||
		elementRect.bottom < rect.top ||
		elementRect.top > rect.bottom
	);
}


function updateKeyframeSelectionVisuals() {
	const selectedSet = new Set(selectedKeyframes.map(s => `${s.trackId}|${s.keyIndex}`));
	document.querySelectorAll('.keyframe').forEach(keyEl => {
		const keyId = `${keyEl.dataset.trackId}|${keyEl.dataset.keyIndex}`;
		keyEl.classList.toggle('selected', selectedSet.has(keyId));
	});
}

function updateEventSelectionVisuals() {
	const selectedSet = new Set(selectedEventIndexes);
	document.querySelectorAll('.event-marker').forEach(eventEl => {
		const indexes = (eventEl.dataset.eventIndexes || "")
			.split(',')
			.filter(Boolean)
			.map(v => parseInt(v, 10));
		const isSelected = indexes.some(index => selectedSet.has(index));
		eventEl.classList.toggle('selected', isSelected);
	});
}

function updateMasterSelectionVisuals() {
	document.querySelectorAll('.master-keyframe').forEach(masterEl => {
		const masterTime = parseFloat(masterEl.dataset.time || 0);
		const isSelected = selectedMasterTimes.some(t => Math.abs(t - masterTime) < 0.001);
		masterEl.classList.toggle('selected', isSelected);
	});
}

function collectKeyframesByTime(time, eps = 0.001) {
	const result = [];
	if (!animationData || !animationData.curves) return result;

	animationData.curves.forEach(curve => {
		const trackId = getTrackId(curve);
		curve.keys.forEach((key, keyIndex) => {
			if (Math.abs(parseFloat(key.time) - parseFloat(time)) < eps) {
				result.push({ trackId, keyIndex });
			}
		});
	});

	return result;
}

//Обработка выделения прямоугольником (для tracks/master/events)
let isSelecting = false; // Флаг активного выделения прямоугольником — true во время рисования рамки выделения
let selectionRect = null; // DOM-элемент прямоугольника выделения — визуальная рамка, отображаемая при выделении
let selectStartX = 0, selectStartY = 0; // Начальные координаты X и Y для рисования прямоугольника выделения
let selectionContext = null; // { containerEl, mode } — контекст выделения: контейнер и режим (tracks/master/events)
let selectionHadDrag = false; // Флаг наличия значимого перемещения при выделении — отличает клик от выделения рамкой

function startRectSelection(e, containerEl, mode) {
	if (e.button !== 0) return; // Только ЛКМ
	if (isDraggingKeyframe || isPanning || isDraggingPlayhead) return;

	if (mode === 'tracks' && (e.target.closest('.keyframe') || e.target.closest('.master-keyframe'))) return;
	if (mode === 'master' && e.target.closest('.master-keyframe')) return;
	if (mode === 'events' && e.target.closest('.event-marker')) return;

	const rect = containerEl.getBoundingClientRect();
	selectStartX = e.clientX - rect.left;
	selectStartY = e.clientY - rect.top;
	isSelecting = true;
	selectionHadDrag = false;
	selectionContext = { containerEl, mode };
}

tracksContainerEl.addEventListener("mousedown", e => startRectSelection(e, tracksContainerEl, 'tracks'));
masterTrackEl.addEventListener("mousedown", e => startRectSelection(e, masterTrackEl, 'master'));
eventsTrackEl.addEventListener("mousedown", e => startRectSelection(e, eventsTrackEl, 'events'));

tracksContainerEl.addEventListener("click", e => { // Отслеживаем событие клика на tracksContainerEl
	if (e.button === 0 && !isDraggingKeyframe && !e.target.closest('.keyframe') && !e.target.closest('.master-keyframe') && !e.target.closest('.track-row')) {
		// deselectAllKeyframes();
	}
});

function getTimelineTimeFromClientX(clickClientX, timelineElement) {
	const timelineRect = timelineElement.getBoundingClientRect();
	const clickTime = pxToTime(clickClientX - timelineRect.left);
	const maxAddableTime = Math.max(config.duration, config.offsetSeconds + displaySeconds);
	return clampAndSnapTime(clickTime, maxAddableTime);
}

function addKeyframeToCurve(curve, time, value) {
	if (!curve) return;

	curve.keys.push({
		time,
		value,
		inTangent: 0,
		outTangent: 0
	});

	curve.keys.sort((a, b) => a.time - b.time);
	mergeOverlappingKeyframes(curve, time);
}

function finalizeTimelineAfterKeyframeInsert() {
	config.forceAnimationRefresh = true;
	renderTracks();
	updateRulers();
	updatePlayhead();
}

function addKeyframeAtTimelinePosition(targetTrackId, clickClientX, timelineElement) {
	if (!targetTrackId) {
		console.error("Не удалось определить targetTrackId для добавления ключевого кадра.");
		return;
	}

	const curve = getCurveById(targetTrackId);
	if (!curve) return;

	const newTime = getTimelineTimeFromClientX(clickClientX, timelineElement);
	addKeyframeToCurve(curve, newTime, 0);
	finalizeTimelineAfterKeyframeInsert();
}

function addMasterKeyframeAtTimelinePosition(clickClientX, timelineElement) {
	if (!animationData?.curves?.length) return;

	const newTime = getTimelineTimeFromClientX(clickClientX, timelineElement);
	const insertedSelections = [];
	const insertedSnapshots = [];
	const interpolatedValuesByTrack = new Map();

	animationData.curves.forEach(curve => {
		const trackId = getTrackId(curve);
		interpolatedValuesByTrack.set(trackId, getKeyValueAtTime(trackId, newTime));
	});

	animationData.curves.forEach(curve => {
		const trackId = getTrackId(curve);
		const interpolatedValue = interpolatedValuesByTrack.get(trackId) ?? 0;
		addKeyframeToCurve(curve, newTime, interpolatedValue);

		const insertedIndex = curve.keys.findIndex(key => {
			return Math.abs(key.time - newTime) < 0.001 && Math.abs(key.value - interpolatedValue) < 0.000001;
		});
		if (insertedIndex === -1) return;

		insertedSelections.push({ trackId, keyIndex: insertedIndex });
		insertedSnapshots.push({
			trackId,
			time: newTime,
			value: interpolatedValue
		});
	});

	selectedMasterTimes = [newTime];
	selectedKeyframes = insertedSelections;

	finalizeTimelineAfterKeyframeInsert();
	rebuildSelectionAfterKeyframeMerge(insertedSnapshots);
	updateSelectedKeyframeInputs();
}

tracksContainerEl.addEventListener("dblclick", e => { // Отслеживаем двойной клик на tracksContainerEl
	const clickedElement = e.target.closest('.track-row'); // Ищем track-row, на который был двойной клик
	let targetTrackId = null;

	if (clickedElement) { // Если двойной клик был по конкретному track-row
		targetTrackId = clickedElement.dataset.trackId;
	} else { // Если двойной клик был в пустое место tracksContainerEl
		const selectedPropertyLi = document.querySelector("#property-list li.selected");
		if (!selectedPropertyLi) {
			alert("Выберите трек в списке свойств для добавления ключевого кадра.");
			return;
		}
		targetTrackId = selectedPropertyLi.dataset.trackId; // Берем trackId из выбранного элемента
	}

	addKeyframeAtTimelinePosition(targetTrackId, e.clientX, tracksEl);
});

masterTrackEl.addEventListener("dblclick", e => {
	if (e.target.closest('.master-keyframe')) return;
	addMasterKeyframeAtTimelinePosition(e.clientX, masterTrackEl);
});

window.addEventListener("mousemove", e => {
	if (!isSelecting || !selectionContext) return;

	const { containerEl, mode } = selectionContext;
	const rect = containerEl.getBoundingClientRect();
	const currentX = e.clientX - rect.left;
	const currentY = e.clientY - rect.top;

	const hasMeaningfulMove = mode === 'tracks'
		? (Math.abs(currentX - selectStartX) > 5 || Math.abs(currentY - selectStartY) > 5)
		: (Math.abs(currentX - selectStartX) > 5);

	if (!selectionRect && hasMeaningfulMove) {
		selectionRect = document.createElement("div");
		selectionRect.className = "selection-rect";
		containerEl.appendChild(selectionRect);
		selectionHadDrag = true;
	}

	if (!selectionRect) return;

	const width = Math.abs(currentX - selectStartX);
	const left = Math.min(selectStartX, currentX);
	selectionRect.style.left = `${left}px`;
	selectionRect.style.width = `${width}px`;

	if (mode === 'tracks') {
		const height = Math.abs(currentY - selectStartY);
		const top = Math.min(selectStartY, currentY);
		selectionRect.style.top = `${top}px`;
		selectionRect.style.height = `${height}px`;

		const newSelection = [];
		containerEl.querySelectorAll('.keyframe').forEach(keyEl => {
			if (isElementInRect(keyEl, selectionRect.getBoundingClientRect())) {
				const trackId = keyEl.dataset.trackId;
				const keyIndex = parseInt(keyEl.dataset.keyIndex, 10);
				newSelection.push({ trackId, keyIndex });
			}
		});
		selectedKeyframes = newSelection;
		updateKeyframeSelectionVisuals();
		selectedEventIndexes = [];
		updateEventSelectionVisuals();
		return;
	}

	const fixedHeight = 10;
	const fixedTop = Math.max(0, (rect.height - fixedHeight) / 2);
	selectionRect.style.top = `${fixedTop}px`;
	selectionRect.style.height = `${fixedHeight}px`;

	if (mode === 'master') {
		const selectedTimes = [];
		masterTrackEl.querySelectorAll('.master-keyframe').forEach(masterEl => {
			if (isElementInRect(masterEl, selectionRect.getBoundingClientRect())) {
				const time = snapTimeToFrame(parseFloat(masterEl.dataset.time));
				selectedTimes.push(time);
			}
		});

		selectedMasterTimes = Array.from(new Set(selectedTimes)).sort((a, b) => a - b);
		const newSelection = [];
		selectedMasterTimes.forEach(time => {
			newSelection.push(...collectKeyframesByTime(time));
		});
		const unique = new Map(newSelection.map(s => [`${s.trackId}|${s.keyIndex}`, s]));
		selectedKeyframes = Array.from(unique.values());
		selectedEventIndexes = [];
		updateKeyframeSelectionVisuals();
		updateMasterSelectionVisuals();
		updateEventSelectionVisuals();
		updateSelectedKeyframeInputs();
		return;
	}

	if (mode === 'events') {
		const eventSet = new Set();
		eventsTrackEl.querySelectorAll('.event-marker').forEach(eventEl => {
			if (isElementInRect(eventEl, selectionRect.getBoundingClientRect())) {
				(eventEl.dataset.eventIndexes || "")
					.split(',')
					.filter(Boolean)
					.forEach(v => eventSet.add(parseInt(v, 10)));
			}
		});
		selectedEventIndexes = Array.from(eventSet).sort((a, b) => a - b);
		updateEventSelectionVisuals();
	}
});

window.addEventListener("mouseup", () => {
	if (!isSelecting) return;

	const mode = selectionContext?.mode;
	isSelecting = false;

	if (selectionRect && selectionContext?.containerEl?.contains(selectionRect)) {
		selectionContext.containerEl.removeChild(selectionRect);
	}
	selectionRect = null;

	if (!selectionHadDrag && !isDraggingKeyframe) {
		if (mode === 'tracks' && selectedKeyframes.length > 0) {
			deselectAllKeyframes();
		} else if (mode === 'master' && selectedMasterTimes.length > 0) {
			selectedMasterTimes = [];
			selectedKeyframes = [];
			updateMasterSelectionVisuals();
			updateKeyframeSelectionVisuals();
		} else if (mode === 'events' && selectedEventIndexes.length > 0) {
			selectedEventIndexes = [];
			updateEventSelectionVisuals();
			inspectorPanelEl.style.display = "none";
		}
	}

	if (mode === 'tracks' || mode === 'master') {
		updateSelectedKeyframeInputs();
	}

	if (mode === 'events' && selectedEventIndexes.length > 0) {
		const eventsInFrame = getSelectedEventsForInspector();
		if (eventsInFrame.length > 0) {
			showEventDetails(eventsInFrame);
		}
	}

	selectionContext = null;
	selectionHadDrag = false;
});

// Перетаскивание элементов таймлайна (keyframe / event-marker)
function startDraggingTimelineItems(options, mouseEvent) {
	if (mouseEvent.button !== 0) return;
	isDraggingKeyframe = true;
	dragStartX = mouseEvent.clientX;
	dragStartActualTime = options.startTime;
	activeDragSession = options;
	document.addEventListener("mousemove", onTimelineItemDrag);
	document.addEventListener("mouseup", onTimelineItemDragEnd);
}

//Перетаскивание выделенных ключей
function startDraggingKeyframe(keyEl, curve, keyIndex, mouseEvent) {
	const trackId = keyEl.dataset.trackId;
	document.querySelectorAll("#property-list li").forEach(el => el.classList.remove("selected"));
	const propLi = document.querySelector(`#property-list li[data-track-id="${trackId}"]`);
	if (propLi) propLi.classList.add("selected");

	selectKeyframes(keyEl);
	selectedMasterTimes = [];
	updateMasterSelectionVisuals();
	dragStartAllKeyTimes.clear();
	selectedKeyframes.forEach(s => {
		const dragCurve = getCurveById(s.trackId);
		if (dragCurve && dragCurve.keys[s.keyIndex]) {
			dragStartAllKeyTimes.set(`${s.trackId}|${s.keyIndex}`, dragCurve.keys[s.keyIndex].time);
		}
	});

	startDraggingTimelineItems({
		type: "keyframe",
		startTime: parseFloat(keyEl.dataset.time)
	}, mouseEvent);
}

function startDraggingEventMarker(eventMarkerEl, eventIndexes, mouseEvent) {
	dragStartAllEventTimes.clear();
	eventIndexes.forEach(index => {
		if (animationData?.events?.[index]) {
			dragStartAllEventTimes.set(index, animationData.events[index].time);
		}
	});

	const startTime = parseFloat(eventMarkerEl.dataset.time || 0);
	startDraggingTimelineItems({
		type: "event",
		startTime,
		eventIndexes: [...eventIndexes]
	}, mouseEvent);
}

function getSelectedEventsForInspector() {
	return selectedEventIndexes.filter(index => animationData?.events?.[index]).map(index => ({ event: animationData.events[index], index }));
}

// Добавляем текущий keyframe в selectedKeyframes, если его там нет
function selectKeyframes(keyEl) {
	const trackId = keyEl.dataset.trackId; // trackId выбранного ключевого кадра
	const keyIndex = Number(keyEl.dataset.keyIndex); // keyIndex выбранного ключевого кадра
	const existsIdx = selectedKeyframes.findIndex(s => s.trackId == trackId && Number(s.keyIndex) === keyIndex); // индекс уже выделенного ключа
	if (existsIdx === -1) {
		selectedKeyframes.push({ trackId, keyIndex });
	}
	showEditValue(keyEl);
}

function onTimelineItemDrag(e) {
	if (!activeDragSession) return;
	e.preventDefault();
	const currentX = e.clientX;
	const deltaX = currentX - dragStartX;
	const deltaTime = deltaX / config.scale;

	if (activeDragSession.type === "keyframe" || activeDragSession.type === "master") {
		const maxDragTime = Math.max(config.duration, config.offsetSeconds + displaySeconds);
		selectedKeyframes.forEach(s => {
			const dragCurve = getCurveById(s.trackId);
			const initialTime = dragStartAllKeyTimes.get(`${s.trackId}|${s.keyIndex}`);
			if (dragCurve && dragCurve.keys[s.keyIndex] !== undefined && initialTime !== undefined) {
				let newTime = initialTime + deltaTime;
				newTime = clampAndSnapTime(newTime, maxDragTime);
				dragCurve.keys[s.keyIndex].time = newTime;
			}
		});

		if (activeDragSession.type === "master" && activeDragSession.masterStartTimes) {
			selectedMasterTimes = activeDragSession.masterStartTimes
				.map(startTime => clampAndSnapTime(startTime + deltaTime, maxDragTime));
			selectedMasterTimes = Array.from(new Set(selectedMasterTimes)).sort((a, b) => a - b);

			if (activeDragSession.eventIndexes?.length) {
				activeDragSession.eventIndexes.forEach(index => {
					const initialTime = dragStartAllEventTimes.get(index);
					if (animationData?.events?.[index] && initialTime !== undefined) {
						let newTime = initialTime + deltaTime;
						newTime = clampAndSnapTime(newTime, maxDragTime);
						animationData.events[index].time = newTime;
					}
				});
			}
		}

		// Во время drag не сортируем ключи, чтобы индексы выбранных keyframe
		// оставались стабильными и не происходило преждевременное "затирание" ключей.
		// Сортировка и merge выполняются только при завершении drag (mouseup) в onTimelineItemDragEnd.
		config.forceAnimationRefresh = true; // флаг принудительного обновления сцены во время drag ключей
		renderTracks();
		renderMasterTrack();
		renderEventsTrack();
		updatePlayhead();
		return;
	}

	if (activeDragSession.type === "event") {
		activeDragSession.eventIndexes.forEach(index => {
			const initialTime = dragStartAllEventTimes.get(index);
			if (animationData?.events?.[index] && initialTime !== undefined) {
				let newTime = initialTime + deltaTime;
				newTime = clampAndSnapTime(newTime);
				animationData.events[index].time = newTime;
			}
		});
		renderEventsTrack();
		updatePlayhead();
	}
}

function onTimelineItemDragEnd() {
	if (!activeDragSession) return;

	const dragType = activeDragSession.type;
	const movedSnapshots = [];

	if (dragType === "keyframe" || dragType === "master") {
		selectedKeyframes.forEach(selection => {
			const curve = getCurveById(selection.trackId);
			const keyframe = curve?.keys?.[selection.keyIndex];
			if (!curve || !keyframe) return;

			movedSnapshots.push({
				trackId: selection.trackId,
				time: snapTimeToFrame(keyframe.time),
				value: keyframe.value
			});
		});
	}

	isDraggingKeyframe = false;
	document.removeEventListener("mousemove", onTimelineItemDrag);
	document.removeEventListener("mouseup", onTimelineItemDragEnd);

	if (dragType === "keyframe" || dragType === "master") {
		const preferredKeysByTrack = new Map();
		selectedKeyframes.forEach(selection => {
			const curve = getCurveById(selection.trackId);
			const keyframe = curve?.keys?.[selection.keyIndex];
			if (!curve || !keyframe) return;

			if (!preferredKeysByTrack.has(selection.trackId)) {
				preferredKeysByTrack.set(selection.trackId, []);
			}
			preferredKeysByTrack.get(selection.trackId).push(keyframe);
		});

		animationData.curves.forEach(curve => {
			const trackId = getTrackId(curve);
			const preferredKeys = preferredKeysByTrack.get(trackId) || [];

			// После drag ключи могут быть в несортированном порядке,
			// а интерполяция в applyAnimationToScene предполагает сортировку по времени.
			curve.keys.sort((a, b) => a.time - b.time);

			const uniqueTimes = Array.from(new Set(curve.keys.map(key => snapTimeToFrame(key.time))));
			uniqueTimes.forEach(time => {
				mergeOverlappingKeyframes(curve, time, preferredKeys);
			});

			// Повторная сортировка гарантирует корректный порядок даже после merge.
			curve.keys.sort((a, b) => a.time - b.time);
		});
		rebuildSelectionAfterKeyframeMerge(movedSnapshots);
		renderTracks();
		renderMasterTrack();
		updateSelectedKeyframeInputs();
		updatePlayhead();
	}

	if (dragType === "event") {
		renderEventsTrack();
		const eventsInFrame = getSelectedEventsForInspector();
		if (eventsInFrame.length > 0) {
			showEventDetails(eventsInFrame);
		}
	}

	activeDragSession = null;
}

//Перетаскивание выбранных master-ключей
function startDraggingMasterKeys(mouseEvent) {
	if (mouseEvent.button !== 0) return;
	if (!selectedMasterTimes.length) return;

	selectedKeyframes = [];
	selectedMasterTimes.forEach(time => {
		selectedKeyframes.push(...collectKeyframesByTime(time));
	});
	const uniqueSelection = new Map(selectedKeyframes.map(s => [`${s.trackId}|${s.keyIndex}`, s]));
	selectedKeyframes = Array.from(uniqueSelection.values());

	dragStartAllKeyTimes.clear();
	selectedKeyframes.forEach(s => {
		const dragCurve = getCurveById(s.trackId);
		if (dragCurve && dragCurve.keys[s.keyIndex]) {
			dragStartAllKeyTimes.set(`${s.trackId}|${s.keyIndex}`, dragCurve.keys[s.keyIndex].time);
		}
	});

	dragStartAllEventTimes.clear();
	const selectedMasterTimeSet = new Set(selectedMasterTimes.map(time => snapTimeToFrame(time))); // набор времён выделенных master-ключей
	const linkedEventIndexes = []; // события, привязанные ко времени выбранных master-ключей
	(animationData?.events || []).forEach((event, index) => {
		const eventTime = snapTimeToFrame(event.time); // время события для сравнения
		if (!selectedMasterTimeSet.has(eventTime)) return;
		dragStartAllEventTimes.set(index, event.time);
		linkedEventIndexes.push(index);
	});

	startDraggingTimelineItems({
		type: "master",
		startTime: selectedMasterTimes[0],
		masterStartTimes: [...selectedMasterTimes],
		eventIndexes: linkedEventIndexes
	}, mouseEvent);
}

//Объединение ключей в том же времени
function mergeOverlappingKeyframes(curve, targetTime, preferredKeys = []) {
	const eps = 0.001;
	const duplicates = curve.keys.filter(k => Math.abs(k.time - targetTime) < eps);

	if (duplicates.length > 1) {
		const preferredMatch = preferredKeys.find(preferredKey => {
			return duplicates.includes(preferredKey);
		});
		const survivor = preferredMatch || duplicates[0];
		const unique = curve.keys.filter(k => Math.abs(k.time - targetTime) >= eps || k === survivor);
		curve.keys = unique.sort((a, b) => a.time - b.time);
	}
}

function showEventDetails(eventsInFrame) {
	inspectorPanelEl.style.display = "block"; // Показываем инспектор
	eventDetailsContentEl.innerHTML = ""; // Очищаем содержимое инспектора

	eventsInFrame.forEach((eventEntry, idx) => {
		const event = eventEntry.event;
		const originalIndex = eventEntry.index;

		const eventDiv = document.createElement("div");
		eventDiv.classList.add("event-detail-item");
		eventDiv.innerHTML = `
				<div style="display: grid; grid-template-columns: 1fr 1fr;">
	           		<h4>Event ${idx + 1}</h4><button class="delete-event-btn" data-original-index="${originalIndex}">Delete</button>
			   </div>
	           <label for="functionName-${originalIndex}">Function Name:</label>
	           <input type="text" id="functionName-${originalIndex}" value="${event.functionName}" data-original-index="${originalIndex}" data-field="functionName">

	           <label for="time-${originalIndex}">Time:</label>
	           <input type="number" id="time-${originalIndex}" value="${event.time.toFixed(3)}" step="0.01" data-original-index="${originalIndex}" data-field="time">

	           <label for="objectReferenceParameter-${originalIndex}">Sound clip:</label>
			   <div style="display: grid; grid-template-columns: 1fr 32px;">
					<input type="text" id="objectReferenceParameter-${originalIndex}" value="${event.objectReferenceParameter}" data-original-index="${originalIndex}" data-field="objectReferenceParameter">
					<button type="button" id="fileUpload-${originalIndex}" onclick="handleEventFileUpload(${originalIndex})">📂</button>
			   </div>
			   
	           <label for="data-${originalIndex}">String Parameter:</label>
	           <input type="text" id="data-${originalIndex}" value="${event.stringParameter || ''}" data-original-index="${originalIndex}" data-field="stringParameter">

	           <label for="float-${originalIndex}">Float Parameter:</label>
	           <input type="number" id="float-${originalIndex}" value="${event.floatParameter || 0}" step="0.01" data-original-index="${originalIndex}" data-field="floatParameter">

	           <label for="int-${originalIndex}">Int Parameter:</label>
	           <input type="number" id="int-${originalIndex}" value="${event.intParameter || 0}" step="1" data-original-index="${originalIndex}" data-field="intParameter">
	           
	           <hr/>
	       `;
		eventDetailsContentEl.appendChild(eventDiv);

		eventDiv.querySelectorAll("input").forEach(input => {
			input.addEventListener("change", updateEventData);
		});


		eventDiv.querySelector(".delete-event-btn").addEventListener("click", deleteEvent);
	});
}

function handleEventFileUpload(originalIndex) {
	const hiddenFileInput = document.createElement("input");
	hiddenFileInput.type = "file";
	hiddenFileInput.accept = "*/*";
	hiddenFileInput.style.display = "none";
	document.body.appendChild(hiddenFileInput);

	hiddenFileInput.addEventListener("change", changeEvent => {
		const selectedFile = changeEvent.target.files && changeEvent.target.files[0];
		if (!selectedFile) {
			document.body.removeChild(hiddenFileInput);
			return;
		}

		const reader = new FileReader();
		reader.onload = readerEvent => {
			const base64Value = typeof readerEvent.target.result === "string" ? readerEvent.target.result : "";
			const objectReferenceInput = document.getElementById(`objectReferenceParameter-${originalIndex}`);
			if (!objectReferenceInput) {
				document.body.removeChild(hiddenFileInput);
				return;
			}

			objectReferenceInput.value = base64Value;
			objectReferenceInput.dispatchEvent(new Event("change", { bubbles: true }));
			document.body.removeChild(hiddenFileInput);
		};
		reader.onerror = () => {
			alert("Ошибка чтения файла");
			document.body.removeChild(hiddenFileInput);
		};
		reader.readAsDataURL(selectedFile);
	}, { once: true });

	hiddenFileInput.click();
}

function updateEventData(e) {
	const input = e.target;
	const originalIndex = parseInt(input.dataset.originalIndex);
	const field = input.dataset.field;
	let value = input.value;

	if (field === "time" || field === "floatParameter" || field === "intParameter") {
		value = parseFloat(value);
		if (isNaN(value)) value = 0; // Default to 0 if invalid number
	}

	if (animationData && animationData.events[originalIndex]) {
		if (field === "time") {
			value = clampAndSnapTime(value);
			input.value = value.toFixed(3);
		}
		animationData.events[originalIndex][field] = value;
		// Re-sort events if time changed
		if (field === "time") {
			animationData.events.sort((a, b) => a.time - b.time);
			renderEventsTrack();
		}
	}
}

function deleteEvent(e) {
	const originalIndex = parseInt(e.target.dataset.originalIndex);
	if (animationData && animationData.events.hasOwnProperty(originalIndex)) {
		animationData.events.splice(originalIndex, 1);
		selectedEventIndexes = [];
		renderEventsTrack();
		inspectorPanelEl.style.display = "none"; // Скрываем инспектор после удаления
	}
}

function deleteSelectedEvents() {
	if (!animationData?.events || selectedEventIndexes.length === 0) return false;

	const uniqueIndexes = Array.from(new Set(selectedEventIndexes))
		.filter(index => Number.isInteger(index) && index >= 0 && index < animationData.events.length)
		.sort((a, b) => b - a);
	if (uniqueIndexes.length === 0) return false;

	uniqueIndexes.forEach(index => {
		animationData.events.splice(index, 1);
	});

	selectedEventIndexes = [];
	renderEventsTrack();
	inspectorPanelEl.style.display = "none";
	updatePlayhead();
	return true;
}

// Функция для получения выделенных ключевых кадров для редактирования
function getSelectedKeyframeEntries() { // Возвращает актуальные ссылки на выбранные ключевые кадры
	const entries = []; // массив найденных выделенных ключей

	selectedKeyframes.forEach(selection => {
		const curve = getCurveById(selection.trackId); // кривая для выделенного ключа
		const keyIndex = Number(selection.keyIndex); // индекс выделенного ключа
		const keyframe = curve?.keys?.[keyIndex]; // ссылка на ключевой кадр
		if (!curve || !keyframe) return;

		entries.push({
			trackId: selection.trackId,
			keyIndex,
			curve,
			keyframe
		});
	});

	return entries;
}

// Функция для обновления полей инспектора ключевых кадров
function updateSelectedKeyframeInputs() { // Синхронизирует keyframe-value и keyframe-time с выделением
	const selectedEntries = getSelectedKeyframeEntries(); // список выделенных ключей для инспектора
	if (selectedEntries.length === 0) {
		keyframeValueInput.type = "number";
		keyframeTimeInput.type = "number";
		keyframeValueInput.value = "";
		keyframeTimeInput.value = "";
		return;
	}

	const firstValue = selectedEntries[0].keyframe.value; // первое значение для сравнения
	const firstTime = snapTimeToFrame(selectedEntries[0].keyframe.time); // первое время для сравнения
	const hasDifferentValue = selectedEntries.some(entry => Math.abs(entry.keyframe.value - firstValue) >= 0.000001); // признак разных value
	const hasDifferentTime = selectedEntries.some(entry => Math.abs(snapTimeToFrame(entry.keyframe.time) - firstTime) >= 0.000001); // признак разного времени

	keyframeValueInput.type = hasDifferentValue ? "text" : "number";
	keyframeTimeInput.type = hasDifferentTime ? "text" : "number";
	keyframeValueInput.value = hasDifferentValue ? "- -" : `${firstValue}`;
	keyframeTimeInput.value = hasDifferentTime ? "- -" : firstTime.toFixed(3);
}

// Редактирование значения
function showEditValue(keyframeEl) { // Обновляет поля редактирования по текущему выделению
	if (!keyframeEl) return; // Если keyframeEl не передан, выходим

	const trackId = keyframeEl.dataset.trackId; // trackId выбранного ключевого кадра
	const keyIndex = parseInt(keyframeEl.dataset.keyIndex, 10); // keyIndex выбранного ключевого кадра
	const existsIdx = selectedKeyframes.findIndex(s => s.trackId == trackId && Number(s.keyIndex) === keyIndex); // индекс ключа в выделении

	if (existsIdx === -1) {
		selectedKeyframes.push({ trackId, keyIndex });
	}

	updateSelectedKeyframeInputs();
}

// Функция для обновления данных выбранных ключевых кадров
function updateKeyframeData(type) { // Обновляет value или time только у selectedKeyframes
	const selectedEntries = getSelectedKeyframeEntries(); // список выделенных ключей для изменения
	if (selectedEntries.length === 0) return;

	if (type === 'value') {
		const parsedValue = parseFloat(keyframeValueInput.value); // новое значение ключевых кадров
		if (!Number.isFinite(parsedValue)) return;

		selectedEntries.forEach(entry => {
			entry.keyframe.value = parsedValue;
		});
		keyframeValueInput.type = "number";
		config.forceAnimationRefresh = true; // флаг принудительного обновления сцены после изменения value
		refreshTimelineAfterKeyframeChange({ preserveSelection: true });
		return;
	}

	if (type === 'time') {
		const parsedTime = parseFloat(keyframeTimeInput.value); // новое время ключевых кадров
		if (!Number.isFinite(parsedTime)) return;

		const newTime = clampAndSnapTime(parsedTime); // нормализованное время для выделенных ключей
		selectedEntries.forEach(entry => {
			entry.keyframe.time = newTime;
		});
		keyframeTimeInput.type = "number";
		keyframeTimeInput.value = newTime.toFixed(3);

		const touchedCurves = new Set(); // набор изменённых кривых
		selectedEntries.forEach(entry => {
			touchedCurves.add(entry.curve);
		});
		Array.from(touchedCurves).forEach(curve => {
			curve.keys.sort((a, b) => a.time - b.time);
			mergeOverlappingKeyframes(curve, newTime);
		});

		config.forceAnimationRefresh = true; // флаг принудительного обновления сцены после изменения time
		refreshTimelineAfterKeyframeChange({ preserveSelection: true });
	}
}

keyframeValueInput.oninput = () => updateKeyframeData('value');
keyframeTimeInput.oninput = () => updateKeyframeData('time');

function rebuildSelectionAfterKeyframeMerge(movedSnapshots = []) {
	const movedSelection = [];
	const movedMasterTimes = new Set();

	movedSnapshots.forEach(snapshot => {
		const curve = getCurveById(snapshot.trackId);
		if (!curve?.keys?.length) return;

		const matchedKeyIndex = curve.keys.findIndex(key => {
			return Math.abs(key.time - snapshot.time) < 0.001 && Math.abs(key.value - snapshot.value) < 0.000001;
		});
		if (matchedKeyIndex === -1) return;

		movedSelection.push({
			trackId: snapshot.trackId,
			keyIndex: matchedKeyIndex
		});
		movedMasterTimes.add(snapTimeToFrame(curve.keys[matchedKeyIndex].time));
	});

	selectedKeyframes = movedSelection;
	selectedMasterTimes = Array.from(movedMasterTimes).sort((a, b) => a - b);
}

// Воспроизведение анимации
function togglePlayback() {
	if (config.playing && config.animationId) {
		cancelAnimationFrame(config.animationId);
		config.animationId = null;
	}

	config.playing = !config.playing;
	playBtn.textContent = config.playing ? "⏸️ Pause" : "▶️ Play";

	if (config.playing) {
		const playbackStartTimestamp = performance.now(); // время старта текущего цикла воспроизведения
		const playbackStartTime = clampAndSnapTime(config.currentTime); // стартовая позиция воспроизведения
		const clipDuration = Math.max(0, Number(config.duration) || 0); // актуальная длительность клипа после пересчёта таймлайна

		const animate = (now) => {
			if (!config.playing) return;
			const elapsed = (now - playbackStartTimestamp) / 1000; // прошедшее время с начала воспроизведения
			if (clipDuration <= 0) {
				config.currentTime = 0;
			} else {
				const nextTime = playbackStartTime + elapsed; // следующая позиция playhead до нормализации
				config.currentTime = nextTime % clipDuration;
			}
			updatePlayhead();
			config.animationId = requestAnimationFrame(animate);
		};
		config.animationId = requestAnimationFrame(animate);
	} else {
		config.animationId = null;
	}
}

// Перемещение playhead
let isDraggingPlayhead = false; // Флаг перетаскивания указателя воспроизведения (playhead) — активен при перемещении playhead мышью
let playheadDragFreeMode = false; // Режим свободного перемещения playhead (без снапа к кадру), активируется через Shift

timelineHeaderEl.addEventListener("mousedown", e => {
	if (e.target.closest('.keyframe') || e.target.closest('.master-keyframe')) return;
	isDraggingPlayhead = true;
	playheadDragFreeMode = e.shiftKey === true;
	updatePlayheadFromMouse(e, { smooth: playheadDragFreeMode });
	if (config.playing) togglePlayback();
});

window.addEventListener("mousemove", e => {
	if (isDraggingPlayhead) {
		updatePlayheadFromMouse(e, { smooth: playheadDragFreeMode });
	}
});

window.addEventListener("mouseup", () => {
	if (isDraggingPlayhead) {
		isDraggingPlayhead = false;
		playheadDragFreeMode = false;
	}
});

function updatePlayheadFromMouse(e, options = {}) {
	const rect = timelineHeaderEl.getBoundingClientRect();
	const x = e.clientX - rect.left;
	const time = pxToTime(x);
	const clampedTime = Math.max(0, Math.min(config.duration, time));
	const smooth = options.smooth === true;
	config.currentTime = smooth ? clampedTime : snapTimeToFrame(clampedTime);
	updatePlayhead();
}

// Zoom и панорамирование
let isPanning = false; // Флаг активного панорамирования — true во время перемещения таймлайна средней кнопкой мыши
let panStartX = 0; // Начальная X-координата курсора при начале панорамирования — используется для вычисления смещения
let panStartOffset = 0; // Начальное смещение (offsetSeconds) при начале панорамирования — базовое значение для расчёта нового offset

timelinePanel.addEventListener("mousedown", e => {
	if (isPanning || isDraggingPlayhead || isSelecting) return;
	if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
		isPanning = true;
		panStartX = e.clientX;
		panStartOffset = config.offsetSeconds;
		timelinePanel.style.cursor = "grabbing";
		e.preventDefault();
	}
});

window.addEventListener("mousemove", e => {
	if (isPanning) {
		const deltaX = e.clientX - panStartX;
		const deltaSeconds = -deltaX / config.scale;
		config.offsetSeconds = panStartOffset + deltaSeconds;
		if (config.offsetSeconds < 0) config.offsetSeconds = 0;
		updateRulers();
		renderTracks();
		updatePlayhead();
	}
});

window.addEventListener("mouseup", () => {
	if (isPanning) {
		isPanning = false;
		timelinePanel.style.cursor = "";
	}
});
timelineHeaderEl.addEventListener("wheel", e => {
	e.preventDefault();

	if (e.shiftKey) {
		// Горизонтальная прокрутка (панорамирование)
		const deltaSeconds = -e.deltaY / config.scale;
		config.offsetSeconds += deltaSeconds;
		if (config.offsetSeconds < 0) config.offsetSeconds = 0;
		updateRulers();
		renderTracks();
		updatePlayhead();
	} else {
		// Zoom
		const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
		const mouseX = e.clientX - timelinePanel.getBoundingClientRect().left;
		const timeAtMouse = pxToTime(mouseX);

		config.scale *= zoomFactor;
		config.scale = Math.min(10000, Math.max(5, config.scale));
		console.log(config.scale);

		const newMouseX = (timeAtMouse - config.offsetSeconds) * config.scale;
		config.offsetSeconds = timeAtMouse - newMouseX / config.scale;
		if (config.offsetSeconds < 0) config.offsetSeconds = 0;

		updateRulers();
		renderTracks();
		updatePlayhead();
	}
});

// Обработка FPS
fpsInput.addEventListener("change", () => {
	const newFps = Math.max(1, Math.min(120, parseInt(fpsInput.value) || 30));
	config.fps = newFps;
	if (animationData) {
		animationData.frameRate = newFps;
	}
	fpsInput.value = newFps;
	updateRulers();
	renderTracks();
	updatePlayhead();
});

function isEditingTextField(target) {
	if (!target) return false;
	const tagName = target.tagName;
	return tagName === 'INPUT' || tagName === 'TEXTAREA' || target.isContentEditable;
}

window.addEventListener("keydown", e => {
	if (e.key !== "Delete") return;
	if (isEditingTextField(e.target)) return;

	if (selectedEventIndexes.length > 0) {
		e.preventDefault();
		deleteSelectedEvents();
		return;
	}

	if (selectedKeyframes.length === 0 && selectedMasterTimes.length === 0) return;

	e.preventDefault();
	deleteSelectedKeyframes();
});

// Кнопка воспроизведения
playBtn.addEventListener("click", togglePlayback);

//Сохранение JSON в файл
function saveAnimationJson(filename) {
	if (!animationData) {
		alert("Нет данных для сохранения!");
		return;
	}

	// Копируем данные, чтобы не mutate исходный объект
	const exportData = JSON.parse(JSON.stringify(animationData));
	const ignoredPropertyNames = new Set(propertyNameIgnoreFilter); // Набор игнорируемых имён свойств для фильтрации при сохранении

	// Очищаем browser-специфичные свойства
	delete exportData.__metadata__;

	if (Array.isArray(exportData.curves)) {
		exportData.curves = exportData.curves.filter(curve => !ignoredPropertyNames.has(curve?.propertyName));
	}

	const jsonString = JSON.stringify(exportData, null, 2);

	// Создаём Blob и ссылку для скачивания
	const blob = new Blob([jsonString], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename || "animation_export.json";
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);

	console.log("Animation saved:", filename || "animation_export.json");
}

//Загрузка JSON файла
function loadAnimationJson(file) {
	const reader = new FileReader(); // Читатель файла JSON анимации
	reader.onload = function (e) {
		try {
			const parsedAnimationData = JSON.parse(e.target.result); // Распарсенные данные анимации из JSON
			const ignoredPropertyNames = new Set(propertyNameIgnoreFilter); // Набор игнорируемых имён свойств для фильтрации при загрузке
			const filteredCurves = Array.isArray(parsedAnimationData?.curves)
				? parsedAnimationData.curves.filter(curve => !ignoredPropertyNames.has(curve?.propertyName))
				: [];
			animationData = {
				...parsedAnimationData,
				curves: filteredCurves,
				events: Array.isArray(parsedAnimationData?.events) ? parsedAnimationData.events : [],
				sprites: Array.isArray(parsedAnimationData?.sprites) ? parsedAnimationData.sprites : []
			};
			sourceAnimationCurves = filteredCurves.map(curve => ({ ...curve, keys: curve.keys }));
			filteredAnimationCurves = sourceAnimationCurves.map(curve => ({ ...curve, keys: curve.keys }));
			currentTimelineSearchText = "";
			initializeFromJson();
			console.log("Animation loaded:", animationData);
		} catch (err) {
			console.error("Error parsing JSON:", err);
			alert("Ошибка при загрузке JSON файла: " + err.message);
		}
	};
	reader.onerror = function () {
		alert("Ошибка чтения файла");
	};
	reader.readAsText(file);
}

//Инициализация из JSON
function initializeFromJson() {
	animationData.curves = Array.isArray(animationData.curves) ? animationData.curves : [];
	animationData.events = Array.isArray(animationData.events) ? animationData.events : [];
	animationData.sprites = Array.isArray(animationData.sprites) ? animationData.sprites : [];
	sourceAnimationCurves = Array.isArray(sourceAnimationCurves) && sourceAnimationCurves.length > 0
		? sourceAnimationCurves
		: animationData.curves.map(curve => ({ ...curve, keys: curve.keys }));
	filteredAnimationCurves = animationData.curves.map(curve => ({ ...curve, keys: curve.keys }));
	config.fps = animationData.frameRate || 30;
	config.duration = animationData.length || 10;
	config.offsetSeconds = 0;
	config.currentTime = 0;
	displaySeconds = config.duration + 1;

	// Обновляем глобальные ссылки
	window.animationData = animationData;
	window.config = config;
	updateGlobalAnimationCurveReferences();

	if (window.AnimationBinding?.applySpritesToScene) {
		window.AnimationBinding.applySpritesToScene(animationData.sprites);
	}

	applyTimelineSearchFilter(currentTimelineSearchText);
	renderEventsTrack();

	console.log('[Animator] Animation loaded:', {
		clipName: animationData.clipName,
		curvesCount: animationData.curves?.length || 0,
		eventsCount: animationData.events?.length || 0,
		spritesCount: animationData.sprites?.length || 0,
		duration: config.duration
	});
}

// Загрузка файла по клику на кнопку в HTML
const loadJsonBtn = document.getElementById("load-json-btn"); // Кнопка загрузки JSON-файла анимации
const saveJsonBtn = document.getElementById("save-json-btn"); // Кнопка сохранения отредактированной анимации в JSON-файл
const fileInput = document.getElementById("json-file-input"); // Скрытый input элемент для выбора файла анимации

if (loadJsonBtn && fileInput) {
	loadJsonBtn.addEventListener("click", () => fileInput.click());

	fileInput.addEventListener("change", e => {
		const file = e.target.files[0];
		if (file) {
			loadAnimationJson(file);
		}
	});
}

// Сохранение файла по клику на кнопку
if (saveJsonBtn) {
	saveJsonBtn.addEventListener("click", () => {
		if (!animationData) {
			alert("Нет данных для сохранения! Сначала загрузите JSON файл.");
			return;
		}

		syncFilteredCurvesBackToSource();
		updateGlobalAnimationCurveReferences();

		// Предлагаем имя файла на основе clipName или дефолтное
		const defaultName = (animationData.clipName || "animation") + "_edited.json";
		saveAnimationJson(defaultName);
	});
}

if (timelineSearchInput) {
	timelineSearchInput.addEventListener("input", e => {
		applyTimelineSearchFilter(e.target.value || "");
	});
}

// Инициализация (пустое состояние)
applyTimelineSearchFilter("");

window.addEventListener("resize", () => {
	renderTracks();
	updatePlayhead();
});
