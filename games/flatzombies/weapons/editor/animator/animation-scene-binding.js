// Скрипт-посредник для синхронизации анимации (animator.js) и объектов сцены (render.js)

(function() {
	'use strict';

	// Конфигурация привязок
	const bindingConfig = {
		// Маппинг propertyName из Unity JSON к свойствам объектов сцены
		propertyMappings: {
			// Unity Transform свойства
			'localEulerAnglesRaw.z': 'localAngle', // Основной угол поворота в Unity 2D
			'm_LocalPosition.x': 'localPosition.x',
			'm_LocalPosition.y': 'localPosition.y',
			'enabled': 'enabled',
			'm_IsActive': 'isActive',
			'sortingOrder': 'sortingOrder',
		}
	};
	

	// Внутреннее состояние
	let isRecordingKeyframes = true; // Флаг записи ключевых кадров при изменении UI
	let lastAppliedTime = -1; // Последнее применённое время анимации
	const sceneDefaults = new Map(); // Базовые значения свойств сцены для отката при удалении кривых/ключей
	const spriteDefaults = new Map(); // Базовые значения sprite-объектов для обновления после импорта
	const trackedPropertyPaths = ['localAngle', 'localPosition.x', 'localPosition.y', 'enabled', 'isActive']; // свойства, изменения которых нужно записывать в анимацию
	const lastRecordedValuesByObject = new Map(); // последние записанные значения свойств для отслеживания изменений
	const allowedRecordSources = new Set(['properties-panel', 'scene-drag']); // источники изменений, которые разрешено записывать в анимацию

	/**
	 * Получить объект сцены по пути из анимации
	 * @param {string} path - Путь из кривой анимации (например, "man/body/weaponParent")
	 * @returns {SceneObject|null}
	 */
	function getSceneObjectByPath(path) {
		if (!window.scene || !window.scene.sceneObjects) {
			console.warn('[AnimationBinding] Scene not initialized');
			return null;
		}

		// Путь из Unity JSON имеет формат "man/body/weaponParent"
		// Это означает: объект "weaponParent" имеет родителя "body", который имеет родителя "man"
		const parts = path.split('/').filter(p => p.trim());
		if (parts.length === 0) return null;

		// Ищем объект по имени (последняя часть пути)
		const objectName = parts[parts.length - 1];
		
		// Находим все объекты с таким именем
		const candidates = window.scene.sceneObjects.filter(obj => obj.name === objectName);
		if (candidates.length === 0) {
			console.log(`[AnimationBinding] No object found with name: ${objectName}`);
			return null;
		}
		
		// Если путь состоит из одной части, возвращаем первый найденный объект
		if (parts.length === 1) {
			return candidates[0];
		}
		
		// Если путь содержит несколько частей, нужно найти объект с правильной иерархией
		// Для этого строим цепочку родителей для каждого кандидата и сравниваем с путём из JSON
		for (const candidate of candidates) {
			const builtPath = buildObjectPath(candidate);
			if (builtPath === path) {
				return candidate;
			}
		}
		
		// Если не нашли точное совпадение, возвращаем первый кандидат
		console.log(`[AnimationBinding] Path mismatch for ${path}, using first candidate: ${objectName}`);
		return candidates[0];
	}
	
	/**
	 * Построить полный путь объекта до корня
	 * @param {SceneObject} obj - Объект сцены
	 * @returns {string} Путь в формате "man/body/weaponParent"
	 */
	function buildObjectPath(obj) {
		const parts = [];
		let current = obj;
		
		// Собираем цепочку от объекта к корню
		while (current) {
			parts.unshift(current.name);
			if (!current.parent) break;
			current = window.scene.sceneObjects.find(o => o.name === current.parent);
		}
		
		return parts.join('/');
	}

	/**
	 * Применить значение к свойству объекта
	 * @param {SceneObject} obj - Объект сцены
	 * @param {string} propertyName - Имя свойства
	 * @param {number|boolean} value - Значение
	 */
	function applyPropertyToObject(obj, propertyName, value) {
		if (!obj || !propertyName) return;

		const normalizedValue = typeof value === 'number' && (propertyName === 'isActive' || propertyName === 'enabled')
			? value >= 0.5 // нормализованное булево значение для Unity bool-кривых
			: value;
		const props = propertyName.split('.');
		if (props.length === 1) {
			// Простое свойство
			if (propertyName in obj) {
				obj[propertyName] = normalizedValue;
			}
		} else if (props.length === 2) {
			// Вложенное свойство (например, localPosition.x)
			const parentProp = props[0];
			const childProp = props[1];
			if (parentProp in obj && typeof obj[parentProp] === 'object') {
				obj[parentProp][childProp] = normalizedValue;
			}
		}
	}

	function getEffectiveFps() {
		const fps = Number(window.config?.fps ?? window.animationData?.frameRate);
		return Number.isFinite(fps) && fps > 0 ? fps : 30;
	}

	function snapTimeToFrame(time) {
		const fps = getEffectiveFps();
		return Math.round(time * fps) / fps;
	}

	function getFrameIndex(time) {
		const fps = getEffectiveFps();
		return Math.round(time * fps);
	}

	function isConstantKeyframe(key) { // Проверяет, использует ли ключ stepped/constant интерполяцию Unity.
		return key?.inTangent === 'Infinity' || key?.inTangent === Infinity;
	}

	function evaluateCurveValue(keys, time) { // Вычисляет значение кривой с поддержкой constant и linear интерполяции.
		if (!keys || keys.length === 0) return undefined;

		const exactKey = keys.find(key => Math.abs(time - key.time) < 0.000001); // ключ точно в текущем времени
		if (exactKey) return exactKey.value;
		if (time <= keys[0].time) return keys[0].value;
		if (time >= keys[keys.length - 1].time) return keys[keys.length - 1].value;

		for (let i = 0; i < keys.length - 1; i++) {
			const currentKey = keys[i];
			const nextKey = keys[i + 1];
			if (time <= currentKey.time || time >= nextKey.time) continue;
			if (isConstantKeyframe(nextKey)) return currentKey.value;

			const segmentDuration = nextKey.time - currentKey.time;
			if (segmentDuration <= 0) return nextKey.value;

			const t = (time - currentKey.time) / segmentDuration;
			return currentKey.value + t * (nextKey.value - currentKey.value);
		}

		return keys[keys.length - 1].value;
	}

	const selectedObjectControlRefs = {
		angleInput: document.getElementById('propAngle'), // поле угла выбранного объекта
		angleSlider: document.getElementById('propAngleSlider'), // слайдер угла выбранного объекта
		posXInput: document.getElementById('propPosX'), // поле позиции X выбранного объекта
		posYInput: document.getElementById('propPosY'), // поле позиции Y выбранного объекта
		enabledCheckbox: document.getElementById('propRenderEnabled'), // чекбокс видимости рендера выбранного объекта
		isActiveCheckbox: document.getElementById('propGameObjActive') // чекбокс активности выбранного объекта
	};

	function syncSelectedAngleControl(nextValue) { // Синхронизирует угол выбранного объекта в UI.
		const numericAngle = Number(nextValue); // числовое значение угла для UI
		if (!Number.isFinite(numericAngle)) return;

		if (selectedObjectControlRefs.angleInput) {
			selectedObjectControlRefs.angleInput.value = `${numericAngle}`;
		}
		if (selectedObjectControlRefs.angleSlider) {
			selectedObjectControlRefs.angleSlider.value = `${Math.round(numericAngle)}`;
		}
	}

	function syncSelectedEnabledControl(nextValue) { // Синхронизирует чекбокс видимости рендера выбранного объекта.
		if (!selectedObjectControlRefs.enabledCheckbox) return;
		selectedObjectControlRefs.enabledCheckbox.checked = Boolean(nextValue);
	}

	function syncSelectedIsActiveControl(nextValue) { // Синхронизирует чекбокс активности выбранного объекта.
		if (!selectedObjectControlRefs.isActiveCheckbox) return;
		selectedObjectControlRefs.isActiveCheckbox.checked = Boolean(nextValue);
	}

	function syncSelectedPosXControl(nextValue) { // Синхронизирует позицию X выбранного объекта в UI.
		const numericPosX = Number(nextValue); // числовое значение позиции X для UI
		if (!Number.isFinite(numericPosX) || !selectedObjectControlRefs.posXInput) return;
		selectedObjectControlRefs.posXInput.value = `${numericPosX}`;
	}

	function syncSelectedPosYControl(nextValue) { // Синхронизирует позицию Y выбранного объекта в UI.
		const numericPosY = Number(nextValue); // числовое значение позиции Y для UI
		if (!Number.isFinite(numericPosY) || !selectedObjectControlRefs.posYInput) return;
		selectedObjectControlRefs.posYInput.value = `${-numericPosY}`;
	}

	const selectedObjectControlSyncMap = {
		localAngle: syncSelectedAngleControl,
		enabled: syncSelectedEnabledControl,
		isActive: syncSelectedIsActiveControl,
		'localPosition.x': syncSelectedPosXControl,
		'localPosition.y': syncSelectedPosYControl
	};

	function syncSelectedObjectControls(sceneObj, propertyName, value) { // Синхронизирует UI выбранного объекта во время проигрывания анимации.
		if (!sceneObj || window.selectedObject !== sceneObj) return;

		const syncControl = selectedObjectControlSyncMap[propertyName]; // обработчик синхронизации конкретного свойства
		if (!syncControl) return;

		syncControl(value);
	}

	/**
	 * Получить значение свойства объекта
	 * @param {SceneObject} obj - Объект сцены
	 * @param {string} propertyName - Имя свойства
	 * @returns {number|boolean|undefined}
	 */
	function getPropertyFromObject(obj, propertyName) {
		if (!obj || !propertyName) return undefined;

		const props = propertyName.split('.');
		if (props.length === 1) {
			return obj[propertyName];
		} else if (props.length === 2) {
			const parentProp = props[0];
			const childProp = props[1];
			if (parentProp in obj && typeof obj[parentProp] === 'object') {
				return obj[parentProp][childProp];
			}
		}
		return undefined;
	}

	function getUnityPropertyName(scenePropertyName) {
		const propertyEntry = Object.entries(bindingConfig.propertyMappings).find(([, mappedProperty]) => mappedProperty === scenePropertyName); // запись маппинга для свойства сцены
		return propertyEntry ? propertyEntry[0] : null;
	}

	function arePropertyValuesEqual(previousValue, nextValue) {
		if (typeof previousValue === 'number' || typeof nextValue === 'number') {
			return Math.abs(Number(previousValue) - Number(nextValue)) < 0.000001;
		}

		return previousValue === nextValue;
	}

	function rememberRecordedPropertyValue(sceneObj, propertyName, value) { // Запоминает последнее записанное значение свойства объекта.
		if (!sceneObj || !propertyName) return;

		const objectState = lastRecordedValuesByObject.get(sceneObj.name) || {}; // кэш записанных свойств конкретного объекта
		objectState[propertyName] = value;
		lastRecordedValuesByObject.set(sceneObj.name, objectState);
	}

	function recordTrackedPropertyIfChanged(sceneObj, propertyName) { // Записывает ключ в анимацию при изменении отслеживаемого свойства объекта.
		if (!isRecordingKeyframes || !sceneObj || !propertyName) return;

		const unityPropertyName = getUnityPropertyName(propertyName); // имя свойства в формате Unity JSON
		if (!unityPropertyName) return;

		const nextValue = getPropertyFromObject(sceneObj, propertyName); // текущее значение свойства объекта
		if (nextValue === undefined) return;

		const objectState = lastRecordedValuesByObject.get(sceneObj.name) || {}; // кэш записанных свойств конкретного объекта
		if (Object.prototype.hasOwnProperty.call(objectState, propertyName) && arePropertyValuesEqual(objectState[propertyName], nextValue)) {
			return;
		}

		const objectPath = buildObjectPath(sceneObj); // полный путь объекта для кривой анимации
		const currentTime = window.config?.currentTime ?? 0; // текущее время анимации для нового ключа
		const wasAdded = addKeyframe(objectPath, unityPropertyName, currentTime, nextValue); // результат записи ключа в анимацию
		if (!wasAdded) return;

		rememberRecordedPropertyValue(sceneObj, propertyName, nextValue);
	}

	function captureTrackedPropertyState(sceneObj) { // Сохраняет текущее состояние отслеживаемых свойств объекта.
		if (!sceneObj) return;

		trackedPropertyPaths.forEach(propertyName => {
			const propertyValue = getPropertyFromObject(sceneObj, propertyName); // текущее значение свойства для кэша
			if (propertyValue === undefined) return;
			rememberRecordedPropertyValue(sceneObj, propertyName, propertyValue);
		});
	}

	function handleSceneObjectChanged(event) { // Обрабатывает пользовательские изменения сцены и записывает ключи анимации.
		if (!isRecordingKeyframes) return;

		const detail = event?.detail || {}; // данные события изменения объекта сцены
		if (!allowedRecordSources.has(detail.source)) return;
		if (!detail.objectName || !detail.propertyName) return;
		if (!trackedPropertyPaths.includes(detail.propertyName)) return;

		const sceneObj = window.scene?.sceneObjects?.find(obj => obj.name === detail.objectName); // объект сцены из события
		if (!sceneObj) return;

		recordTrackedPropertyIfChanged(sceneObj, detail.propertyName);
	}

	function captureSceneDefaults() {
		if (!window.scene?.sceneObjects?.length) return;

		window.scene.sceneObjects.forEach(obj => {
			Object.entries(bindingConfig.propertyMappings).forEach(([unityProperty, mappedProperty]) => {
				const value = mappedProperty === 'localAngle'
					? obj.localAngle
					: getPropertyFromObject(obj, mappedProperty);
				if (value === undefined) return;

				const defaultsForObject = sceneDefaults.get(obj.name) || {};
				defaultsForObject[unityProperty] = value;
				sceneDefaults.set(obj.name, defaultsForObject);
			});
		});
	}

	// Применить спрайты из JSON к объектам сцены
	function applySpritesToScene(sprites) {
		if (!window.scene || !Array.isArray(window.scene.sceneObjects)) return;
		if (!Array.isArray(sprites)) return;

		sprites.forEach(spriteData => {
			if (!spriteData || !spriteData.name) return;

			let sceneObj = window.scene.sceneObjects.find(obj => obj.name === spriteData.name); // Объект сцены для обновления или создания
			if (!sceneObj) {
				sceneObj = new SceneObject(
					spriteData.name,
					spriteData.parent || '',
					spriteData.texture || '',
					Number(spriteData.localPositionX) || 0,
					Number(spriteData.localPositionY) || 0,
					Number(spriteData.localAngle) || 0,
					0,
					Number(spriteData.pixelPerUnit) || 100,
					Number(spriteData.pivotPointX ?? 0.5),
					Number(spriteData.pivotPointY ?? 0.5),
					true,
					true,
					true,
					true,
					true
				);
				window.scene.addObject(sceneObj);
			} else if (!spriteDefaults.has(sceneObj.name)) {
				spriteDefaults.set(sceneObj.name, {
					parent: sceneObj.parent,
					texture: sceneObj.texture,
					pixelPerUnit: sceneObj.pixelPerUnit,
					pivotPointX: sceneObj.pivotPoint?.x,
					pivotPointY: sceneObj.pivotPoint?.y,
					localPositionX: sceneObj.localPosition?.x,
					localPositionY: sceneObj.localPosition?.y,
					localAngle: sceneObj.localAngle
				});
			}

			sceneObj.parent = spriteData.parent || '';
			sceneObj.texture = spriteData.texture || '';
			sceneObj.pixelPerUnit = Number(spriteData.pixelPerUnit) || 100;
			sceneObj.pivotPoint.x = Number(spriteData.pivotPointX ?? 0.5);
			sceneObj.pivotPoint.y = Number(spriteData.pivotPointY ?? 0.5);
			sceneObj.localPosition.x = Number(spriteData.localPositionX) || 0;
			sceneObj.localPosition.y = Number(spriteData.localPositionY) || 0;
			sceneObj.localAngle = Number(spriteData.localAngle) || 0;
		});

		if (typeof window.updateImageCache === 'function') {
			window.updateImageCache();
		}
		if (typeof window.refreshHierarchy === 'function') {
			window.refreshHierarchy();
		}
		if (typeof window.renderScene === 'function') {
			window.renderScene();
		}
	}

	function resetSceneState() {
		if (!window.scene?.sceneObjects?.length) return;

		window.scene.sceneObjects.forEach(obj => {
			const defaultsForObject = sceneDefaults.get(obj.name);
			if (!defaultsForObject) return;

			Object.entries(defaultsForObject).forEach(([unityProperty, value]) => {
				const mappedProperty = bindingConfig.propertyMappings[unityProperty];
				if (!mappedProperty) return;

				if (mappedProperty === 'localAngle') {
					obj.localAngle = value;
				} else {
					applyPropertyToObject(obj, mappedProperty, value);
				}
			});
		});

		lastAppliedTime = -1;
	}

	/**
	 * Применить текущее состояние анимации к сцене
	 * Вызывается при изменении playhead или во время воспроизведения
	 */
	function applyAnimationToScene() {
		// Отладка: проверяем наличие данных
		if (!window.animationData) {
			console.warn('[AnimationBinding] window.animationData is not available');
			return;
		}
		if (!window.animationData.curves) {
			console.warn('[AnimationBinding] window.animationData.curves is not available');
			return;
		}
		if (!window.scene) {
			console.warn('[AnimationBinding] window.scene is not available');
			return;
		}

		const currentTime = window.config?.currentTime ?? 0; // текущее время анимации
		const forceApply = window.config?.forceAnimationRefresh === true; // флаг принудительного обновления сцены

		// Пропускаем если время не изменилось (оптимизация)
		if (!forceApply && currentTime === lastAppliedTime) {
			return;
		}
		lastAppliedTime = currentTime;
		if (forceApply && window.config) {
			window.config.forceAnimationRefresh = false;
		}

		let sceneChanged = false;
		let appliedCount = 0;

		// Проходим по всем кривым анимации
		window.animationData.curves.forEach(curve => {
			const path = curve.path;
			const propertyName = curve.propertyName;
			const keys = curve.keys;

			if (!keys || keys.length === 0) return;

			// Получим интерполированное значение для текущего времени
			const value = evaluateCurveValue(keys, currentTime); // вычисленное значение текущей кривой

			if (value === undefined) return;

			// Получаем маппинг свойства
			const mappedProperty = bindingConfig.propertyMappings[propertyName];
			if (!mappedProperty) {
				// Тихо пропускаем неизвестные свойства
				return;
			}

			// Применяем к объекту сцены
			const sceneObj = getSceneObjectByPath(path);
			if (sceneObj) {
				// Для углов Unity использует Z-ось в 2D
				if (mappedProperty === 'localAngle') {
					sceneObj.localAngle = value;
					syncSelectedObjectControls(sceneObj, mappedProperty, value);
				} else {
					applyPropertyToObject(sceneObj, mappedProperty, value);
					syncSelectedObjectControls(sceneObj, mappedProperty, getPropertyFromObject(sceneObj, mappedProperty));
				}
				sceneChanged = true;
				appliedCount++;
			}
		});
		// Отладка: выводим количество применённых кривых
		//if (appliedCount > 0) console.log(`[AnimationBinding] Applied ${appliedCount} curves at time ${currentTime.toFixed(3)}s`);
		// Перерисовываем сцену если были изменения
		if (sceneChanged && typeof window.renderScene === 'function') {
			window.renderScene();
		}

	}

	/**
	 * Добавить ключевой кадр в анимацию
	 * @param {string} objectPath - Путь объекта (например, "man/body" или просто "body")
	 * @param {string} propertyName - Имя свойства (например, "localEulerAnglesRaw.z")
	 * @param {number} time - Время в секундах
	 * @param {number|boolean} value - Значение
	 */
	function addKeyframe(objectPath, propertyName, time, value) {
		if (!window.animationData || !window.animationData.curves) {
			console.warn('[AnimationBinding] No animation data to add keyframe');
			return false;
		}

		// Если objectPath не содержит '/', возможно это просто имя объекта
		// Нужно найти полный путь в сцене
		let fullPath = objectPath;
		if (!objectPath.includes('/')) {
			// Пытаемся найти объект по имени и построить его полный путь
			const sceneObj = window.scene?.sceneObjects?.find(obj => obj.name === objectPath);
			if (sceneObj) {
				fullPath = buildObjectPath(sceneObj);
				console.log(`[AnimationBinding] Resolved path: ${objectPath} -> ${fullPath}`);
			}
		}

		// Ищем существующую кривую по пути и имени свойства
		let curve = window.animationData.curves.find(c =>
			c.path === fullPath && c.propertyName === propertyName
		);

		// Если кривой нет - создаём новую
		if (!curve) {
			curve = {
				path: fullPath,
				propertyName: propertyName,
				keys: [],
				classID: 4,
				script: null,
				flags: 0
			};
			window.animationData.curves.push(curve);
			if (typeof window.renderPropertyList === 'function') {
				window.renderPropertyList();
			}
			console.log(`[AnimationBinding] Created new curve: ${fullPath}|${propertyName}`);
		}

		const snappedTime = snapTimeToFrame(time);
		const targetFrame = getFrameIndex(snappedTime);

		// Удаляем существующий ключ в том же кадре (если есть)
		curve.keys = curve.keys.filter(k => getFrameIndex(k.time) !== targetFrame);

		// Добавляем новый ключ
		curve.keys.push({
			time: snappedTime,
			value: value,
			inTangent: 0,
			outTangent: 0,
			inWeight: 0,
			outWeight: 0,
			weightedMode: 0
		});

		// Сортируем ключи по времени
		curve.keys.sort((a, b) => a.time - b.time);

		// Перерисовываем треки если есть функция renderTracks
		if (typeof window.renderTracks === 'function') {
			window.renderTracks();
		}

		if (typeof window.updatePlayhead === 'function') {
			window.updatePlayhead();
		}

		const trackId = `${fullPath}|${propertyName}`;
		console.log(`[AnimationBinding] Keyframe added: ${trackId} at ${snappedTime.toFixed(3)}s = ${value}`);
		return true;
	}

	/**
	 * Инициализация привязок
	 * Экспортирует публичные функции в глобальную область
	 */
	function initialize() {
		console.log('[AnimationBinding] Initializing...');
		
		// Проверка доступности глобальных объектов после загрузки всех скриптов
		const checks = {
			window: typeof window !== 'undefined',
			animationData: window.animationData !== undefined,
			config: window.config !== undefined,
			scene: window.scene !== undefined,
			sceneObjectsCount: window.scene?.sceneObjects?.length || 0,
			renderScene: typeof window.renderScene === 'function',
			curvesCount: window.animationData?.curves?.length || 0
		};
		console.log('[AnimationBinding] Global objects:', checks);

		captureSceneDefaults();
		window.scene?.sceneObjects?.forEach(sceneObj => {
			captureTrackedPropertyState(sceneObj);
		});
		window.addEventListener('scene-object-changed', handleSceneObjectChanged);

		// Экспортируем публичные функции в глобальную область
		window.AnimationBinding = {
			applyAnimationToScene,
			applySpritesToScene,
			addKeyframe,
			resetSceneState,
			setRecordingEnabled: (enabled) => { isRecordingKeyframes = enabled; },
			isRecordingEnabled: () => isRecordingKeyframes
		};

		console.log('[AnimationBinding] Setup complete. Use AnimationBinding.applyAnimationToScene() to sync.');
	}

	// Запускаем инициализацию
	initialize();

})();
