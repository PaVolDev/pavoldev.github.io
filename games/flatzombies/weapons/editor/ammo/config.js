

const weapons = new Array();

const editedPoint = [ //Окно предпросмотра имеет функцию для вращения точки и нужно указать в какой параметр записывать вращение объекта
	{ name: 'pointTip', angle: null, parent: 'render' }, //Для отображения фонаря и глушителя нужно взять его родительский объект из списка параметров
	{ name: 'WeaponSilencerMod.localPoint', angle: null, parent: 'WeaponSilencerMod.bolt' },
	{ name: 'handleMove.movePosition', angle: 'WeaponHandPoints.handleMove.movePosition.z', parent: null },
	{ name: 'handleMove.startPosition', angle: 'WeaponHandPoints.handleMove.startPosition.z', parent: null },
	{ name: '.position', angle: '.angle', parent: null },
]
const ignoreIconSprites = ['gunFlash']; //Имена спрайтов, которые следует убрать при генерации иконки оружия для интрфейса
const ignoreImportFields = ['storeInfo.iconBase64', 'storeInfo.silencerPosition'];
const ignoreExportFields = ['storeInfo.iconBase64', 'gunFlash.SpriteRenderer.', 'gunFlash2.SpriteRenderer.'];
const prefixHide = ['cartridge.'];
const prefixExport = 'cartridge.'; //Вернуть приставку при экспорте

const typeDependencies = { //Для параметров указаного типа добавить остальные связаные параметры в общий список отредактрованных
	'Sprite': [ //При импорте нужно, чтобы в json имел параметр с указаным типом
		'SpriteRenderer.sprite.pivotPoint',
		'SpriteRenderer.sprite.pixelPerUnit',
		'SpriteRenderer.sortingOrder',
		'Transform.localEulerAngles.z',
		'SpriteRenderer.enabled',
		'gameObject.SetActive',
		'Transform.localPosition'
	],
	'Renderer': [
		'SpriteRenderer.sprite.pivotPoint',
		'SpriteRenderer.sprite.pixelPerUnit',
		'SpriteRenderer.sortingOrder',
		'Transform.localEulerAngles.z',
		'SpriteRenderer.enabled',
		'gameObject.SetActive',
		'Transform.localPosition'
	],
	'TextureSprite': [
		'pivotPoint',
		'pixelPerUnit',
	]
};

const typeLightForm = { //Одно поле для редактирования без заголовка
	// 'HitsBullet': function (param, index) {
	// 	return getInputForType(param, index);
	// }
};

var hitMetaData = [
	{ fieldPath: "modeHit", comment: "• FIRST - Фиксировать все попадания пули, начиная с первого;<br>• RANDOM_FIRST - случайно выбрать первое попадание, а затем фиксировать все остальные проникающие попадания в триггеры с одинаковым материалом в диапазоне [minDist - maxDist], это подходит для стрельбы дробью;", type: "string", value: "FIRST", options: ["FIRST", "RANDOM_FIRST"] },
	{ fieldPath: "minHits", comment: "Сколько минимум попаданий фиксировать для одной пули", type: "int", value: 1 },
	{ fieldPath: "maxHits", comment: "Сколько максимум попаданий фиксировать для одной пули", type: "int", value: 1 },
	{ fieldPath: "minDist", comment: "Расстояние, на котором фиксировать второе попадание", type: "float", value: 0 },
	{ fieldPath: "maxDist", comment: "Расстояние, после которого больше не фиксировать другие попадания", type: "float", value: 0 },
	{ fieldPath: "findExitPoint", comment: "Для каждого попадания вычислить точку выхода пули из тела после сквозного проникновения", type: "bool", value: false },
]


const typeFullForm = { //Форма для редактирования набора данных
	'HitsBullet': function (param, index) {
		return `<strong data-tooltip="${param.startFieldPath}">${param.fieldPath}</strong><br>
			<small>${param.comment || ''}</small><br>
			<div class="grid-in-object">
			${getInputForType(param, index, null, hitMetaData)}
			</div>`;
	},
	'AudioClip[]': function (param, idx) { return renderFileArray(param, idx, ".wav"); },
	'Sprite[]': function (param, idx) { return renderSpriteArray(param, idx, spriteArrayMetaData); }, //renderObjectArray(param, idx, spriteArrayMetaData);
	'AnimationSprite[]': function (param, idx) { return renderAnimationSprite(param, idx, frameArrayMetaData); },
	'PhysicsMaterialMultiply[]': function (param, idx) { return renderObjectArray(param, idx, physicsMaterialMultiplyMetaData); },
};

const spriteArrayMetaData = [
	{ "fieldPath": "sprite", "comment": "Спрайт, PNG-файл", "type": "Sprite", "value": "" },
	{ "fieldPath": "pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": 100 }
];

const frameArrayMetaData = [
	{ "fieldPath": "texture", "comment": "Спрайт, PNG-файл", "type": "Sprite", "value": "" },
	{ "fieldPath": "pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": 100 }
];

const physicsMaterialMultiplyMetaData = [
	{ "fieldPath": "materialName", "comment": "Материал тела", "type": "string", "value": "skin", options: ['armor', 'skin', 'metal'] },
	{ "fieldPath": "scaleFirst", "comment": "Умножить урон при попадании в материал", "type": "float", "value": 1 },
	{ "fieldPath": "scaleThrough", "comment": "Ещё раз умножить урон для следующего попадания, если maxHits >= 2 (когда пуля имеет возможность пробивать несколько тел)", "type": "float", "value": 0.5 },
	{ "fieldPath": "stopBulletDamage", "comment": "Остановить пулю, если урон стал слишком низким после прохождения нескольких тел", "type": "float", "value": 0 }
];


const availableByField = {}

const importReplace = [
	{ fieldPath: "storeInfo.autor", newPath: "storeInfo.author" },
	{ fieldPath: "storeInfo.autorURL", newPath: "storeInfo.authorURL" },
];

const defaultAddedFields = [ //Добавить некоторые параметры сразу в список, если их значений НЕ равно defaultAddedFields[x][1]
	["arrowsPerShot", ""],
	["distHitArrow", ""],
];

var mainParams = [ //Список важных параметров для записи в итоговый файл
	{ fieldPath: "id", idHTMLInput: "idWeapon", lowerCase: true },
	{ fieldPath: "idTemplate", idHTMLInput: "idTemplate" },
	{ fieldPath: "type", value: "cartridge" }, //Указать сразу своё значение 
	{ fieldPath: "iconButtonSprite", idHTMLInput: "iconButtonSprite" },
	{ fieldPath: "iconListSprite", idHTMLInput: "iconListSprite" },
	{ fieldPath: "caliberName", idHTMLInput: "caliberName" },
	{ fieldPath: "uiName", idHTMLInput: "uiName" },
];

var baseParams = [  //Список параметров, доступные для редактирования у всех оружий
	{ "fieldPath": "author", "comment": "Автор модификации. Никнейм для отображения в интерфейсе (необязательно)", "type": "string", "value": "" },
	{ "fieldPath": "authorURL", "comment": "Ссылка на вашу страницу в социальных сетях (необязательно)", "type": "string", "value": "" },
	{ "fieldPath": "uiName", "comment": "Имя короткое для отображения в интерфейсе", "type": "string", "value": "" },
	{ "fieldPath": "caliberName", "comment": "Название калибра. Разные типы патрона одного калибра должны иметь одинаковое название.<br>Строка используется как второй идентификатор для связи с оружием", "type": "string", "value": "" },
	{ "fieldPath": "shellSkin", "comment": "Гильза при стрельбе", "type": "TextureSprite", "value": "" },
	{ "fieldPath": "shellSkin.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "shellSkin.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": 100 },
	{ "fieldPath": "iconButtonSprite", "comment": "Изображение для кнопки в интерфейсе<br>Квадратное изображение 100x100 или длинный патрон с большой шириной", "type": "TextureSprite", "value": "" },
	{ "fieldPath": "iconButtonSprite.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "iconButtonSprite.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": 100 },
	{ "fieldPath": "iconListSprite", "comment": "Изображение патрона для интерфейса в списке заряженных патронов в магазин оружия", "type": "TextureSprite", "value": "" },
	{ "fieldPath": "iconListSprite.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "iconListSprite.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": 100 },
	{ "fieldPath": "bullets", "comment": "Кол-в во пуль при одном выстреле", "type": "int", "value": "0" },
	{ "fieldPath": "angleRandom", "comment": "Максимальное отклонение пули в градусах, для создания разброса", "type": "float", "value": "0", min: 0, max: 180 },
	{ "fieldPath": "angleSpread", "comment": "Равномерное распределение пуль", "type": "float", "value": "0", min: 0, max: 1 },
	{ "fieldPath": "damage", "comment": "Наносимый урон от всех пуль <br>Будет распределён между всеми пулями", "type": "float", "value": "0" },
	{ "fieldPath": "distance", "comment": "Дистанция пули для поиска столкновений", "type": "float", "value": "0" },
	{ "fieldPath": "impulse", "comment": "Импульс ForceMode2D.Impulse <br>Будет распределён между всеми пулями", "type": "float", "value": "0" },
	{ "fieldPath": "stopPower", "comment": "Останавливающий эффект<br>Существо само решает как реагировать на этот параметр", "type": "float", "value": "0", min: 0, max: 1 },
	//{ "fieldPath": "noiseVolume", "comment": "Громкость шума/выстрела", "type": "float", "value": "0", min: 0, max: 6 },
	{ "fieldPath": "penetration", "comment": "Параметры проникновения пули.", "type": "HitsBullet", "value": "" },
	{ "fieldPath": "penetrationDamage", "comment": "Снижение урона после прохождения пули сквозь тела.", "type": "PhysicsMaterialMultiply[]", "value": "" },
	//{ "fieldPath": "entityTag", "comment": "Тег игровых объектов существ, с которыми искать попадание пуль (необязательно)", "type": "string", "value": "" },
	//{ "fieldPath": "skillObjectTags", "comment": "Способности/метки у оружия<br>Например патроны с повышеной пробиваемостью могут быть сгруппированы в одну категорию для запуска особых эффектов крови", "type": "Object[]", "value": "" },
	//{ "fieldPath": "velocityMax", "comment": "Ограничение скорости тела после импульса, чтобы тело не улетало далёко", "type": "float", "value": "0" },
	//{ "fieldPath": "angularMax", "comment": "Ограничение скорости вращения тела после импульса, чтобы тело не улетало далёко", "type": "float", "value": "0" },

]


var sampleParams = [ //Список всех параметров, относящиеся только к оружию в руках
	{ "fieldPath": "angleScatter", "comment": "Максимальное отклонение пули в градусах, для создания разброса", "type": "float", "value": "0", min: 0, max: 180 },
	{ "fieldPath": "evenlySpread", "comment": "Равномерное распределение стрел/снарядов при выстреле", "type": "float", "value": "0", min: 0, max: 1 },

	{ "fieldPath": "timeTriggers", "comment": "Время активности триггеров для снаряда. За это время снаряд должен успеть попасть в цель", "type": "float", "value": "0" },
	{ "fieldPath": "distHitArrow", "comment": "Дистанция, в пределах которой снаряд будет фиксировать попадание", "type": "float", "value": "0" },
	{ "fieldPath": "arrowsPerShot", "comment": "Количество стрел/снарядов при одном выстреле", "type": "int", "value": "0" },


	{ "fieldPath": "arrowSample.WeaponArrow.speed", "comment": "Скорость полёта", "type": "float", "value": "0", displayName: "arrowSample.speed" },
	{ "fieldPath": "arrowSample.WeaponArrow.timerLive", "comment": "Время жизни во время полёта. Удалить стрелу, если время закончится - стрела улетела далеко за экран", "type": "float", "value": "0", displayName: "arrowSample.timerLive" },
	{ "fieldPath": "arrowSample.WeaponArrow.floor", "comment": "Уровень земли, что бы воткнуть стрелу поглубже в тело", "type": "float", "value": "0", displayName: "arrowSample.floor" },
	{ "fieldPath": "arrowSample.WeaponArrow.pointTip", "comment": "Кончик стрелы, который будет упираться о землю\nА так же используем для поиска попадания", "type": "Vector2", "value": "(0, 0)", displayName: "arrowSample.pointTip" },
	{ "fieldPath": "arrowSample.WeaponArrow.pointFrontTip", "comment": "Кончик стрелы, который будет упираться о землю", "type": "Vector2", "value": "(0, 0)", displayName: "arrowSample.pointFrontTip" },
	{ "fieldPath": "arrowSample.WeaponArrow.pointSpriteCheck", "comment": "Координаты для проверки спрайта. Отбрасываем стрелу, если в спрайте образуется дыра. Локальные координаты у стрелы", "type": "Vector2", "value": "(0, 0)", displayName: "arrowSample.pointSpriteCheck" },
	{ "fieldPath": "arrowSample.WeaponArrow.angleTipSpeed", "comment": "Скорость вращения стрелы внутри тела, когда кончик упирает в землю.\nСкорость за 1 секунду", "type": "float", "value": "0", displayName: "arrowSample.angleTipSpeed" },
	{ "fieldPath": "arrowSample.WeaponArrow.spriteHit", "comment": "Спрайт/текстура, PNG-файл", "type": "TextureSprite", "value": "", displayName: "arrowSample.spriteHit" },
	{ "fieldPath": "arrowSample.WeaponArrow.spriteHit.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)", displayName: "arrowSample.spriteHit.pivotPoint" },
	{ "fieldPath": "arrowSample.WeaponArrow.spriteHit.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": "100", displayName: "arrowSample.spriteHit.pixelPerUnit" },
	{ "fieldPath": "arrowSample.WeaponArrow.scaleImpulse", "comment": "Множитель импульса, когда стрела ударяется об землю при падении тела", "type": "float", "value": "0", displayName: "arrowSample.scaleImpulse" },
	{ "fieldPath": "arrowSample.arrowRender.Transform.localPosition", "comment": "Координаты объекта для расположения", "type": "Vector3", "value": "(1.1, 0.2, 0)" },
	{ "fieldPath": "arrowSample.arrowRender.Transform.localEulerAngles.z", "comment": "Угол наклона", "type": "float", "value": "0" },
	{ "fieldPath": "arrowSample.arrowRender.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": "true" },
	{ "fieldPath": "arrowSample.arrowRender.SpriteRenderer.sprite", "comment": "Спрайт со стрелой, PNG-файл", "type": "Sprite", suffix: ".SpriteRenderer.sprite", "value": "" },
	{ "fieldPath": "arrowSample.arrowRender.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "arrowSample.arrowRender.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": "100" },
	{ "fieldPath": "arrowSample.arrowRender.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", "type": "int", "value": "0" },
	{ "fieldPath": "arrowSample.arrowRender.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", "type": "bool", "value": "true" },
	{ "fieldPath": "arrowSample.AnimatorSprite.initialAnimation", "comment": "Имя текущей анимации", "type": "string", "value": "" },
	{ "fieldPath": "arrowSample.AnimatorSprite.playStart", "comment": "Воспроизвести при старте", "type": "bool", "value": "true" },
	{ "fieldPath": "arrowSample.AnimatorSprite.animations", "comment": "Список анимаций", "type": "AnimationSprite[]", "value": "" },
	{ "fieldPath": "arrowSample.AnimatorSprite.timeScale", "comment": "Множитель скорости анимаций", "type": "float", "value": "0" },
	{ "fieldPath": "arrowSample.AnimatorSprite.speed", "comment": "Скорость/Частота кадров в секунду", "type": "float", "value": "0" },
	{ "fieldPath": "arrowSample.AnimatorSprite.reverse", "comment": "Воспроизвести в обратном порядке", "type": "bool", "value": "true" },
	{ "fieldPath": "arrowSample.AnimatorSprite.loop", "comment": "Проигрывать повторно", "type": "bool", "value": "true" },
	{ "fieldPath": "arrowSample.WeaponFireRocket.speed", "comment": "Скорость полёта", "type": "float", "value": "0", displayName: "arrowSample.speed" },
	{ "fieldPath": "arrowSample.WeaponFireRocket.timerLive", "comment": "Время, в течении которого снаряд будет находится на сцене. За это время он должен успеть попасть и успеть отыграть анимации взрыва", "type": "float", "value": "0", displayName: "arrowSample.timerLive" },
	{ "fieldPath": "arrowSample.WeaponFireRocket.scaleGravity", "comment": "Множитель для изменения гравитации и скорости падения", "type": "float", "value": "0", displayName: "arrowSample.scaleGravity" },
	{ "fieldPath": "arrowSample.WeaponFireRocket.distLivedEntity", "comment": "Радиус/Дистанция для попадания в живых существ.\nЕсли в пределах этого расстояния нет живых, то фиксируем попадание в трупы", "type": "float", "value": "0", displayName: "arrowSample.distLivedEntity" },
	{ "fieldPath": "arrowSample.WeaponFireRocket.slideExplode", "comment": "Сдвиг объекта перед запуском пуль. Сдвиг с учётом угла наклона и относительно точки, в котором произошло пересечение снаряда", "type": "Vector2", "value": "(0, 0)", displayName: "arrowSample.slideExplode" },
	{ "fieldPath": "arrowSample.WeaponFireRocket.renderMaterialHit", "comment": "Шейдер при попадании", "type": "Material", "value": "", displayName: "arrowSample.renderMaterialHit" },
	{ "fieldPath": "arrowSample.WeaponFireRocket.floorWall", "comment": "Материал земли и стен. При попадании в него сразу отключаем огонь", "type": "PhysicsMaterial2D", "value": "", displayName: "arrowSample.floorWall" },
	{ "fieldPath": "arrowSample.WeaponFireRocket.damage", "comment": "Урон один раз в процессе горения", "type": "float", "value": "0", displayName: "arrowSample.damage" },
	{ "fieldPath": "arrowSample.WeaponFireRocket.speedMoveRotate", "comment": "Дистанция/Скорость для наклона на все 90 градусов", "type": "float", "value": "0", displayName: "arrowSample.speedMoveRotate" },
	{ "fieldPath": "arrowSample.WeaponFireRocket.speedRotateFire", "comment": "Скорость вращения огня для достижения необходимого угла", "type": "float", "value": "0", displayName: "arrowSample.speedRotateFire" },
	{ "fieldPath": "arrowSample.WeaponRocket.speed", "comment": "Скорость полёта", "type": "float", "value": "0", displayName: "arrowSample.speed" },
	{ "fieldPath": "arrowSample.WeaponRocket.timerLive", "comment": "Время, в течении которого снаряд будет находится на сцене. За это время он должен успеть попасть и успеть отыграть анимации взрыва", "type": "float", "value": "0", displayName: "arrowSample.timerLive" },
	{ "fieldPath": "arrowSample.WeaponRocket.scaleGravity", "comment": "Множитель для изменения гравитации и скорости падения", "type": "float", "value": "0", displayName: "arrowSample.scaleGravity" },
	{ "fieldPath": "arrowSample.WeaponRocket.distanceSnake", "comment": "Дистанция тряски в одну сторону", "type": "float", "value": "0", displayName: "arrowSample.distanceSnake" },
	{ "fieldPath": "arrowSample.WeaponRocket.timeSnake", "comment": "Длительность тряски", "type": "float", "value": "0", displayName: "arrowSample.timeSnake" },
	{ "fieldPath": "arrowSample.WeaponRocket.periodSnake", "comment": "Количество колебаний", "type": "int", "value": "0", displayName: "arrowSample.periodSnake" },
	{ "fieldPath": "arrowSample.WeaponRocket.soundHit", "comment": "Звук взрыва при попадании", "type": "AudioClip", "value": "", displayName: "arrowSample.soundHit" },
	{ "fieldPath": "arrowSample.WeaponRocket.slideExplode", "comment": "Сдвиг объекта назад, относительно точки, в котором произошло попадание", "type": "Vector2", "value": "(0, 0)", displayName: "arrowSample.slideExplode" },
	{ "fieldPath": "arrowSample.WeaponRocket.objectExplode.AnimatorSprite.initialAnimation", "comment": "Имя текущей анимации", "type": "string", "value": "", displayName: "arrowSample.objectExplode.initialAnimation" },
	{ "fieldPath": "arrowSample.WeaponRocket.objectExplode.AnimatorSprite.playStart", "comment": "Воспроизвести при старте", "type": "bool", "value": "true", displayName: "arrowSample.objectExplode.playStart" },
	{ "fieldPath": "arrowSample.WeaponRocket.objectExplode.AnimatorSprite.animations", "comment": "Анимация взрыва", "type": "AnimationSprite[]", "value": "", },
	{ "fieldPath": "arrowSample.WeaponRocket.objectExplode.AnimatorSprite.timeScale", "comment": "Множитель скорости анимаций", "type": "float", "value": "0", displayName: "arrowSample.objectExplode.timeScale" },
	{ "fieldPath": "arrowSample.WeaponRocket.objectExplode.AnimatorSprite.speed", "comment": "Скорость/Частота кадров в секунду", "type": "float", "value": "0", displayName: "arrowSample.objectExplode.speed" },
	{ "fieldPath": "arrowSample.WeaponRocket.objectExplode.AnimatorSprite.reverse", "comment": "Воспроизвести в обратном порядке", "type": "bool", "value": "true", displayName: "arrowSample.objectExplode.reverse" },
	{ "fieldPath": "arrowSample.WeaponRocket.objectExplode.AnimatorSprite.loop", "comment": "Проигрывать повторно", "type": "bool", "value": "true", displayName: "arrowSample.objectExplode.loop" },
	{ "fieldPath": "arrowSample.WeaponRocket.objectExplode.smoke.AnimatorSprite.animations", "comment": "Анимация дыма", "type": "AnimationSprite[]", "value": "", },
	{ "fieldPath": "arrowSample.WeaponRocket.objectExplode.smoke.AnimatorSprite.initialAnimation", "comment": "Имя текущей анимации", "type": "string", "value": "", displayName: "smoke.AnimatorSprite.animations.initialAnimation" },
	{ "fieldPath": "arrowSample.WeaponRocket.objectExplode.smoke.AnimatorSprite.playStart", "comment": "Воспроизвести при старте", "type": "bool", "value": "true", displayName: "smoke.AnimatorSprite.animations.playStart" },
	{ "fieldPath": "arrowSample.WeaponRocket.objectExplode.smoke.AnimatorSprite.speed", "comment": "Скорость/Частота кадров в секунду", "type": "float", "value": "0", displayName: "smoke.AnimatorSprite.animations.speed" },
	{ "fieldPath": "arrowSample.SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", "type": "Sprite", "value": "", suffix: ".SpriteRenderer.sprite" },
	{ "fieldPath": "arrowSample.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "arrowSample.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": "100" },
	{ "fieldPath": "arrowSample.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", "type": "int", "value": "0" },
	{ "fieldPath": "arrowSample.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", "type": "bool", "value": "true" },
	{ "fieldPath": "arrowSample.WeaponRocket.objectExplode.Transform.localScale", "comment": "Масштабировать размер взрыва", "type": "Vector3", "value": "(1, 1, 1)" }

];

//Добавить основные парамметры WeaponCartridge
baseParams.forEach(field => {
	defaultAddedFields.push([field.fieldPath, "NULL"]);
});
//Добавить параметры для наследумых классов от WeaponCartridge
sampleParams.forEach(field => {
	defaultAddedFields.push([field.fieldPath, "NULL"]);
});



