

const weapons = new Array();
const editedPoint = [ //Окно предпросмотра имеет функцию для вращения точки и нужно указать в какой параметр записывать вращение объекта
	{ name: 'pointTip', angle: null, parent: 'render' }, //Для отображения фонаря и глушителя нужно взять его родительский объект из списка параметров
	{ name: 'WeaponSilencerMod.localPoint', angle: null, parent: 'WeaponSilencerMod.bolt' },
	{ name: 'handleMove.movePosition', angle: 'WeaponHandPoints.handleMove.movePosition.z', parent: null },
	{ name: 'handleMove.startPosition', angle: 'WeaponHandPoints.handleMove.startPosition.z', parent: null },
	{ name: '.position', angle: '.angle', parent: null },
]
viewPPU = 70; //Изменить увеличение камеры для предпросмотра
const mainIconHeight = 600; //Размеры иконки для генерации
const mainIconWidth = 600; //Размеры иконки для генерации
const mainIconSceneScale = 0.5;
const ignoreIconSprites = ['gunFlash']; //Имена спрайтов, которые следует убрать при генерации иконки оружия для интрфейса
const ignoreImportFields = ['targetVersion', 'version', 'selspriteupd']; //'storeInfo.iconBase64', 
const ignoreExportFields = [
	"player.SpriteRenderer.sprite", "player.Transform.localPosition", "player.gameObject.SetActive", "player.SpriteRenderer.enabled", "player.Transform.localEulerAngles.z",
	"player.SpriteRenderer.sortingOrder", "player.SpriteRenderer.sprite.pixelPerUnit", "player.SpriteRenderer.sprite.pivotPoint",
	"player.gameObject.SetActive",
	"player.Transform.localPosition",
	"player.man.gameObject.SetActive",
	"player.man.Transform.localPosition",
	"player.SpriteRenderer.sortingOrder",
	"player.Transform.localEulerAngles.z",
	"player.man.body.gameObject.SetActive",
	"player.man.thigh.gameObject.SetActive",
	"player.man.thigh2.gameObject.SetActive",
	"player.man.Transform.localEulerAngles.z",
	"player.man.body.head.gameObject.SetActive",
	"player.man.thigh.shin.gameObject.SetActive",
	//"player.man.body.Transform.localEulerAngles.z",
	"player.man.thigh2.shin2.gameObject.SetActive",
	"player.man.thigh.shin.Transform.localPosition",
	//"player.man.thigh.Transform.localEulerAngles.z",
	//"player.man.thigh2.Transform.localEulerAngles.z",
	"player.man.body.head.Transform.localPosition",
	"player.man.thigh.shin.foot.gameObject.SetActive",
	"player.man.thigh2.shin2.Transform.localPosition",
	//"player.man.body.head.Transform.localEulerAngles.z",
	"player.man.body.weaponParent.gameObject.SetActive",
	"player.man.thigh.shin.foot.Transform.localPosition",
	//"player.man.thigh.shin.Transform.localEulerAngles.z",
	"player.man.thigh2.shin2.foot2.gameObject.SetActive",
	//"player.man.thigh2.shin2.Transform.localEulerAngles.z",
	"player.man.body.weaponParent.arm.gameObject.SetActive",
	"player.man.body.weaponParent.arm.gameObject.SetActive",
	"player.man.thigh2.shin2.foot2.Transform.localPosition",
	"player.man.body.weaponParent.arm2.gameObject.SetActive",
	"player.man.body.weaponParent.arm2.gameObject.SetActive",
	"player.man.body.weaponParent.arm3.gameObject.SetActive",
	"player.man.body.weaponParent.arm3.gameObject.SetActive",
	//"player.man.thigh.shin.foot.Transform.localEulerAngles.z",
	"player.man.body.weaponParent.arm.Transform.localPosition",
	"player.man.body.weaponParent.arm.Transform.localPosition",
	"player.man.body.weaponParent.arm2.Transform.localPosition",
	"player.man.body.weaponParent.arm2.Transform.localPosition",
	"player.man.body.weaponParent.arm3.Transform.localPosition",
	"player.man.body.weaponParent.arm3.Transform.localPosition",
	//"player.man.body.weaponParent.Transform.localEulerAngles.z",
	//"player.man.thigh2.shin2.foot2.Transform.localEulerAngles.z",
	"player.man.body.weaponParent.arm.forearm.gameObject.SetActive",
	// "player.man.body.weaponParent.arm.Transform.localEulerAngles.z",
	// "player.man.body.weaponParent.arm.Transform.localEulerAngles.z",
	// "player.man.body.weaponParent.arm2.Transform.localEulerAngles.z",
	// "player.man.body.weaponParent.arm2.Transform.localEulerAngles.z",
	// "player.man.body.weaponParent.arm3.Transform.localEulerAngles.z",
	// "player.man.body.weaponParent.arm3.Transform.localEulerAngles.z",
	"player.man.body.weaponParent.arm2.forearm2.gameObject.SetActive",
	"player.man.body.weaponParent.arm3.forearm3.gameObject.SetActive",
	"player.man.body.weaponParent.arm.forearm.Transform.localPosition",
	"player.man.body.weaponParent.arm2.forearm2.Transform.localPosition",
	"player.man.body.weaponParent.arm3.forearm3.Transform.localPosition",
	"player.man.body.weaponParent.arm.forearm.fingers.gameObject.SetActive",
	// "player.man.body.weaponParent.arm.forearm.Transform.localEulerAngles.z",
	"player.man.body.weaponParent.arm.forearm.fingers.SpriteRenderer.enabled",
	// "player.man.body.weaponParent.arm2.forearm2.Transform.localEulerAngles.z",
	// "player.man.body.weaponParent.arm3.forearm3.Transform.localEulerAngles.z",
	"player.man.body.weaponParent.arm.forearm.fingers.Transform.localPosition",
	"player.man.body.weaponParent.arm2.forearm2.fingers2.gameObject.SetActive",
	"player.man.body.weaponParent.arm3.forearm3.fingers3.gameObject.SetActive",
	"player.man.body.weaponParent.arm2.forearm2.fingers2.Transform.localPosition",
	"player.man.body.weaponParent.arm3.forearm3.fingers3.Transform.localPosition",
	"player.man.body.weaponParent.arm.forearm.fingers.render.gameObject.SetActive",
	// "player.man.body.weaponParent.arm.forearm.fingers.Transform.localEulerAngles.z",
	"player.man.body.weaponParent.arm.forearm.fingers.render.Transform.localPosition",
	"player.man.body.weaponParent.arm2.forearm2.fingers2.girth2.gameObject.SetActive",
	"player.man.body.weaponParent.arm2.forearm2.fingers2.girth2.SpriteRenderer.enabled",
	// "player.man.body.weaponParent.arm2.forearm2.fingers2.Transform.localEulerAngles.z",
	// "player.man.body.weaponParent.arm3.forearm3.fingers3.Transform.localEulerAngles.z",
	"player.man.body.weaponParent.arm2.forearm2.fingers2.girth2.Transform.localPosition",
	"player.man.body.weaponParent.arm.forearm.fingers.render.Transform.localEulerAngles.z",
	// "player.man.body.weaponParent.arm2.forearm2.fingers2.girth2.Transform.localEulerAngles.z",
	//"player.man.body.Transform.localPosition",
	//"player.man.body.weaponParent.Transform.localPosition",
	//"player.man.thigh.Transform.localPosition",
	// "player.man.SpriteRenderer.sortingOrder",
	// "player.man.body.SpriteRenderer.sortingOrder",
	// "player.man.body.head.SpriteRenderer.sortingOrder",
	// "player.man.body.weaponParent.SpriteRenderer.sortingOrder",
	// "player.man.body.weaponParent.arm.SpriteRenderer.sortingOrder",
	// "player.man.body.weaponParent.arm2.SpriteRenderer.sortingOrder",
	// "player.man.body.weaponParent.arm3.SpriteRenderer.sortingOrder",
	// "player.man.thigh.SpriteRenderer.sortingOrder",
	// "player.man.thigh.shin.SpriteRenderer.sortingOrder",
	// "player.man.thigh.shin.foot.SpriteRenderer.sortingOrder",
	// "player.man.thigh2.SpriteRenderer.sortingOrder",
	// "player.man.thigh2.shin2.SpriteRenderer.sortingOrder",
	// "player.man.thigh2.shin2.foot2.SpriteRenderer.sortingOrder",
	// "player.man.body.weaponParent.arm.SpriteRenderer.sortingOrder",
	// "player.man.body.weaponParent.arm.forearm.SpriteRenderer.sortingOrder",
	// "player.man.body.weaponParent.arm.forearm.fingers.SpriteRenderer.sortingOrder",
	// "player.man.body.weaponParent.arm.forearm.fingers.render.SpriteRenderer.sortingOrder",
	// "player.man.body.weaponParent.arm2.SpriteRenderer.sortingOrder",
	// "player.man.body.weaponParent.arm2.forearm2.SpriteRenderer.sortingOrder",
	// "player.man.body.weaponParent.arm2.forearm2.fingers2.SpriteRenderer.sortingOrder",
	// "player.man.body.weaponParent.arm2.forearm2.fingers2.girth2.SpriteRenderer.sortingOrder",
	// "player.man.body.weaponParent.arm3.SpriteRenderer.sortingOrder",
	// "player.man.body.weaponParent.arm3.forearm3.SpriteRenderer.sortingOrder",
	// "player.man.body.weaponParent.arm3.forearm3.fingers3.SpriteRenderer.sortingOrder",
	// "player.SpriteRenderer.enabled",
	// "player.man.SpriteRenderer.enabled",
	// "player.man.body.SpriteRenderer.enabled",
	// "player.man.body.head.SpriteRenderer.enabled",
	// "player.man.body.weaponParent.SpriteRenderer.enabled",
	// "player.man.body.weaponParent.arm.SpriteRenderer.enabled",
	// "player.man.body.weaponParent.arm2.SpriteRenderer.enabled",
	// "player.man.body.weaponParent.arm3.SpriteRenderer.enabled",
	// "player.man.thigh.SpriteRenderer.enabled",
	// "player.man.thigh.shin.SpriteRenderer.enabled",
	// "player.man.thigh.shin.foot.SpriteRenderer.enabled",
	// "player.man.thigh2.SpriteRenderer.enabled",
	// "player.man.thigh2.shin2.SpriteRenderer.enabled",
	// "player.man.thigh2.shin2.foot2.SpriteRenderer.enabled",
	// "player.man.body.weaponParent.arm.SpriteRenderer.enabled",
	// "player.man.body.weaponParent.arm.forearm.SpriteRenderer.enabled",
	// "player.man.body.weaponParent.arm.forearm.fingers.SpriteRenderer.enabled",
	// "player.man.body.weaponParent.arm.forearm.fingers.render.SpriteRenderer.enabled",
	// "player.man.body.weaponParent.arm2.SpriteRenderer.enabled",
	// "player.man.body.weaponParent.arm2.forearm2.SpriteRenderer.enabled",
	// "player.man.body.weaponParent.arm2.forearm2.fingers2.SpriteRenderer.enabled",
	// "player.man.body.weaponParent.arm3.SpriteRenderer.enabled",
	// "player.man.body.weaponParent.arm3.forearm3.SpriteRenderer.enabled",
	// "player.man.body.weaponParent.arm3.forearm3.fingers3.SpriteRenderer.enabled",

];
const prefixHide = ['player.'];
const prefixExport = 'player.'; //Вернуть приставку при экспорте



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

//Одно поле для редактирования без заголовка
const typeLightForm = {};

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
	{ fieldPath: "sprite", "comment": "Спрайт, PNG-файл", type: "Sprite", value: "" },
	{ fieldPath: "pivotPoint", "comment": "Точка вращения для спрайта", type: "Vector2", value: "(0.5, 0.5)" },
	{ fieldPath: "pixelPerUnit", "comment": "Плотность пикселей", type: "float", value: 100 }
];

const frameArrayMetaData = [
	{ fieldPath: "texture", "comment": "Спрайт, PNG-файл", type: "Sprite", value: "" },
	{ fieldPath: "pivotPoint", "comment": "Точка вращения для спрайта", type: "Vector2", value: "(0.5, 0.5)" },
	{ fieldPath: "pixelPerUnit", "comment": "Плотность пикселей", type: "float", value: 100 }
];

const physicsMaterialMultiplyMetaData = [
	{ fieldPath: "materialName", "comment": "Материал тела", type: "string", value: "skin", options: ['armor', 'skin', 'metal'] },
	{ fieldPath: "scaleFirst", "comment": "Умножить урон при попадании в материал", type: "float", value: 1 },
	{ fieldPath: "scaleThrough", "comment": "Ещё раз умножить урон для следующего попадания, если maxHits >= 2 (когда пуля имеет возможность пробивать несколько тел)", type: "float", value: 0.5 },
	{ fieldPath: "stopBulletDamage", "comment": "Остановить пулю, если урон стал слишком низким после прохождения нескольких тел", type: "float", value: 0 }
];


const availableByField = {}

const importReplace = [
	{ fieldPath: "storeInfo.autor", newPath: "storeInfo.author" },
	{ fieldPath: "storeInfo.autorURL", newPath: "storeInfo.authorURL" },
];
const exportReplace = [];

const defaultAddedFields = [ //Добавить некоторые параметры сразу в список, если их значений НЕ равно defaultAddedFields[x][1]
	["arrowsPerShot", ""],
	["distHitArrow", ""],
	["author", 123456],
	["authorURL", 123456],
	["uiName", 123456],
	["player.height", 123456],
];

//Список параметров, которые должны быть отредактированы
var standrtParams = [];
var standrtPoints = [];

var mainParams = [ //Список важных параметров для записи в итоговый файл
	{ fieldPath: "id", idHTMLInput: "idWeapon", lowerCase: true }, //<- вернуть обратно эти параметры
	{ fieldPath: "idTemplate", idHTMLInput: "idTemplate" },
	{ fieldPath: "type", value: "playerskin" }, //Указать сразу своё значение 
];

var baseParams = [  //Список параметров, доступные для редактирования у всех оружий
	{ fieldPath: "author", "comment": "Автор модификации. Никнейм для отображения в интерфейсе (необязательно)", type: "string", value: "" },
	{ fieldPath: "authorURL", "comment": "Ссылка на вашу страницу в социальных сетях (необязательно)", type: "string", value: "" },
	{ fieldPath: "uiName", "comment": "Имя короткое для отображения в интерфейсе", type: "string", value: "" },
	{ fieldPath: "player.height", "comment": "Рост персонажа", type: "int", value: 170, min: 160, max: 190 },
	{ fieldPath: "interface.desciption", "comment": "Описание (необязательно)", type: "TextFile", value: "" },
	{ fieldPath: "storeInfo.iconBase64", comment: "Иконка для интерфейса, размер около 200x300<br>Используйте PPU для масштабирования.<br>Если не указано, то иконка будет сгенерирована автоматически.", type: "TextureSprite", value: "" },
	{ fieldPath: "storeInfo.iconBase64.pivotPoint", comment: "Точка вращения для спрайта", type: "Vector2", value: "(0.5, 0.5)" },
	{ fieldPath: "storeInfo.iconBase64.pixelPerUnit", comment: "Плотность пикселей", type: "float", value: 100 },

	// { fieldPath: "player.SpriteRenderer.sprite", "comment": "Основной спрайт/текстура для оружия, PNG-файл", type: "Sprite", suffix: "SpriteRenderer.sprite", value: "" },
	// { fieldPath: "player.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", type: "Vector2", value: "(0.5, 0.5)" },
	// { fieldPath: "player.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", type: "float", value: 100 },
	// { fieldPath: "player.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", type: "int", value: 0 },
	// { fieldPath: "player.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", type: "bool", value: true },
	// { fieldPath: "player.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", type: "bool", value: true },
	// { fieldPath: "player.Transform.localPosition", "comment": "Координаты объекта для расположения", type: "Vector3", value: "(1.1, 0.2, 0)" },
	// { fieldPath: "player.Transform.localEulerAngles.z", "comment": "Угол наклона", type: "float", value: 0 },

]


var sampleParams = [ //Список всех параметров, относящиеся только к оружию в руках
	// { fieldPath: "player.Transform.localPosition", "comment": "Координаты объекта для расположения", type: "Vector3", value: "(1.1, 0.2, 0)" },
	// { fieldPath: "player.Transform.localEulerAngles.z", "comment": "Угол наклона", type: "float", value: 0 },
	// { fieldPath: "player.SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", type: "Sprite", suffix: ".SpriteRenderer.sprite", value: "", canChangePivot: false, canChangePosition: false },
	// { fieldPath: "player.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", type: "Vector2", value: "(0.5, 0.5)" },
	// { fieldPath: "player.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", type: "float", value: 100 },
	// { fieldPath: "player.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", type: "int", value: 0 },
	// { fieldPath: "player.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", type: "bool", value: true },
	// { fieldPath: "player.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", type: "bool", value: true },
	{ fieldPath: "player.addedGameObjects", comment: "Список добавленных объектов", type: "string", value: "" },
	{ fieldPath: "player.addedComponents", comment: "Список добавленных компонентов MonoBehaviour", type: "string", value: "" }, //в формате "child.SpriteRenderer, otherChild.Collider2D"
	{ fieldPath: "player.removedGameObjects", comment: "Список объектов для удаления", type: "string", value: "" },
	{ fieldPath: "player.removedComponents", comment: "Список компонентов MonoBehaviour для удаления", type: "string", value: "" },

	{ showInList: false, fieldPath: "player.man.SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", type: "Sprite", suffix: ".SpriteRenderer.sprite", value: "" },
	{ showInList: false, fieldPath: "player.man.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", type: "Vector2", value: "(0.5, 0.5)" },
	{ showInList: false, fieldPath: "player.man.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", type: "float", value: 100 },
	{ showInList: false, fieldPath: "player.man.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", type: "int", value: 0 },
	{ showInList: false, fieldPath: "player.man.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", type: "bool", value: true },
	{ showInList: false, fieldPath: "player.man.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", type: "bool", value: true },
	{ showInList: false, fieldPath: "player.man.Transform.localPosition", "comment": "Координаты объекта для расположения", type: "Vector3", value: "(1.1, 0.2, 0)" },
	{ showInList: false, fieldPath: "player.man.Transform.localEulerAngles.z", "comment": "Угол наклона", type: "float", value: 0 },

	{ fieldPath: "player.man.body.Transform.localPosition", "comment": "Координаты объекта для расположения", type: "Vector3", value: "(1.1, 0.2, 0)" },
	{ fieldPath: "player.man.body.Transform.localEulerAngles.z", "comment": "Угол наклона", type: "float", value: 0 },
	{ fieldPath: "player.man.body.SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", type: "Sprite", suffix: ".SpriteRenderer.sprite", value: "", canChangePivot: false, canChangePosition: false },
	{ fieldPath: "player.man.body.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", type: "Vector2", value: "(0.5, 0.5)" },
	{ fieldPath: "player.man.body.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", type: "float", value: 100 },
	{ fieldPath: "player.man.body.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", type: "int", value: 0 },
	{ fieldPath: "player.man.body.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", type: "bool", value: true },
	{ fieldPath: "player.man.body.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", type: "bool", value: true },

	{ fieldPath: "player.man.body.head.Transform.localPosition", "comment": "Координаты объекта для расположения", type: "Vector3", value: "(1.1, 0.2, 0)" },
	{ fieldPath: "player.man.body.head.Transform.localEulerAngles.z", "comment": "Угол наклона", type: "float", value: 0 },
	{ fieldPath: "player.man.body.head.SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", type: "Sprite", suffix: ".SpriteRenderer.sprite", value: "", canChangePosition: false },
	{ fieldPath: "player.man.body.head.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", type: "Vector2", value: "(0.5, 0.5)" },
	{ fieldPath: "player.man.body.head.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", type: "float", value: 100 },
	{ fieldPath: "player.man.body.head.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", type: "int", value: 0 },
	{ fieldPath: "player.man.body.head.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", type: "bool", value: true },
	{ fieldPath: "player.man.body.head.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", type: "bool", value: true },

	{ fieldPath: "player.man.body.weaponParent.Transform.localPosition", "comment": "Координаты объекта для расположения", type: "Vector3", value: "(1.1, 0.2, 0)" },
	{ fieldPath: "player.man.body.weaponParent.Transform.localEulerAngles.z", "comment": "Угол наклона", type: "float", value: 0 },
	{ fieldPath: "player.man.body.weaponParent.SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", type: "Sprite", suffix: ".SpriteRenderer.sprite", value: "" },
	{ fieldPath: "player.man.body.weaponParent.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", type: "Vector2", value: "(0.5, 0.5)" },
	{ fieldPath: "player.man.body.weaponParent.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", type: "float", value: 100 },
	{ fieldPath: "player.man.body.weaponParent.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", type: "int", value: 0 },
	{ fieldPath: "player.man.body.weaponParent.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", type: "bool", value: true },
	{ fieldPath: "player.man.body.weaponParent.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", type: "bool", value: true },


	{ fieldPath: "player.man.body.weaponParent.arm.Transform.localPosition", "comment": "Координаты объекта для расположения", type: "Vector3", value: "(1.1, 0.2, 0)" },
	{ fieldPath: "player.man.body.weaponParent.arm.Transform.localEulerAngles.z", "comment": "Угол наклона", type: "float", value: 0 },
	{ fieldPath: "player.man.body.weaponParent.arm.SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", type: "Sprite", suffix: ".SpriteRenderer.sprite", value: "", canChangePivot: false, canChangePosition: false },
	{ fieldPath: "player.man.body.weaponParent.arm.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", type: "Vector2", value: "(0.5, 0.5)" },
	{ fieldPath: "player.man.body.weaponParent.arm.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", type: "float", value: 100 },
	{ fieldPath: "player.man.body.weaponParent.arm.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", type: "int", value: 0 },
	{ fieldPath: "player.man.body.weaponParent.arm.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", type: "bool", value: true },
	{ fieldPath: "player.man.body.weaponParent.arm.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", type: "bool", value: true },

	{ fieldPath: "player.man.body.weaponParent.arm.forearm.Transform.localPosition", "comment": "Координаты объекта для расположения", type: "Vector3", value: "(1.1, 0.2, 0)" },
	{ fieldPath: "player.man.body.weaponParent.arm.forearm.Transform.localEulerAngles.z", "comment": "Угол наклона", type: "float", value: 0 },
	{ fieldPath: "player.man.body.weaponParent.arm.forearm.SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", type: "Sprite", suffix: ".SpriteRenderer.sprite", value: "", canChangePivot: false, canChangePosition: false },
	{ fieldPath: "player.man.body.weaponParent.arm.forearm.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", type: "Vector2", value: "(0.5, 0.5)" },
	{ fieldPath: "player.man.body.weaponParent.arm.forearm.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", type: "float", value: 100 },
	{ fieldPath: "player.man.body.weaponParent.arm.forearm.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", type: "int", value: 0 },
	{ fieldPath: "player.man.body.weaponParent.arm.forearm.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", type: "bool", value: true },
	{ fieldPath: "player.man.body.weaponParent.arm.forearm.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", type: "bool", value: true },

	{ fieldPath: "player.man.body.weaponParent.arm.forearm.fingers.Transform.localPosition", "comment": "Координаты объекта для расположения", type: "Vector3", value: "(1.1, 0.2, 0)" },
	{ fieldPath: "player.man.body.weaponParent.arm.forearm.fingers.Transform.localEulerAngles.z", "comment": "Угол наклона", type: "float", value: 0 },
	{ fieldPath: "player.man.body.weaponParent.arm.forearm.fingers.SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", type: "Sprite", suffix: ".SpriteRenderer.sprite", value: "", canChangePivot: false, canChangePosition: false },
	{ fieldPath: "player.man.body.weaponParent.arm.forearm.fingers.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", type: "Vector2", value: "(0.5, 0.5)" },
	{ fieldPath: "player.man.body.weaponParent.arm.forearm.fingers.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", type: "float", value: 100 },
	{ fieldPath: "player.man.body.weaponParent.arm.forearm.fingers.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", type: "int", value: 0 },
	{ fieldPath: "player.man.body.weaponParent.arm.forearm.fingers.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", type: "bool", value: true },
	{ fieldPath: "player.man.body.weaponParent.arm.forearm.fingers.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", type: "bool", value: true },

	{ fieldPath: "player.man.body.weaponParent.arm.forearm.fingers.render.Transform.localPosition", "comment": "Координаты объекта для расположения", type: "Vector3", value: "(1.1, 0.2, 0)" },
	{ fieldPath: "player.man.body.weaponParent.arm.forearm.fingers.render.Transform.localEulerAngles.z", "comment": "Угол наклона", type: "float", value: 0 },
	{ fieldPath: "player.man.body.weaponParent.arm.forearm.fingers.render.SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", type: "Sprite", suffix: ".SpriteRenderer.sprite", value: "", canChangePivot: false, canChangePosition: false },
	{ fieldPath: "player.man.body.weaponParent.arm.forearm.fingers.render.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", type: "Vector2", value: "(0.5, 0.5)" },
	{ fieldPath: "player.man.body.weaponParent.arm.forearm.fingers.render.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", type: "float", value: 100 },
	{ fieldPath: "player.man.body.weaponParent.arm.forearm.fingers.render.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", type: "int", value: 0 },
	{ fieldPath: "player.man.body.weaponParent.arm.forearm.fingers.render.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", type: "bool", value: true },
	{ fieldPath: "player.man.body.weaponParent.arm.forearm.fingers.render.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", type: "bool", value: true },

	{ fieldPath: "player.man.body.weaponParent.arm2.Transform.localPosition", "comment": "Координаты объекта для расположения", type: "Vector3", value: "(1.1, 0.2, 0)" },
	{ fieldPath: "player.man.body.weaponParent.arm2.Transform.localEulerAngles.z", "comment": "Угол наклона", type: "float", value: 0 },
	{ fieldPath: "player.man.body.weaponParent.arm2.SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", type: "Sprite", suffix: ".SpriteRenderer.sprite", value: "", canChangePivot: false, canChangePosition: false },
	{ fieldPath: "player.man.body.weaponParent.arm2.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", type: "Vector2", value: "(0.5, 0.5)" },
	{ fieldPath: "player.man.body.weaponParent.arm2.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", type: "float", value: 100 },
	{ fieldPath: "player.man.body.weaponParent.arm2.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", type: "int", value: 0 },
	{ fieldPath: "player.man.body.weaponParent.arm2.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", type: "bool", value: true },
	{ fieldPath: "player.man.body.weaponParent.arm2.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", type: "bool", value: true },

	{ fieldPath: "player.man.body.weaponParent.arm2.forearm2.Transform.localPosition", "comment": "Координаты объекта для расположения", type: "Vector3", value: "(1.1, 0.2, 0)" },
	{ fieldPath: "player.man.body.weaponParent.arm2.forearm2.Transform.localEulerAngles.z", "comment": "Угол наклона", type: "float", value: 0 },
	{ fieldPath: "player.man.body.weaponParent.arm2.forearm2.SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", type: "Sprite", suffix: ".SpriteRenderer.sprite", value: "", canChangePivot: false, canChangePosition: false },
	{ fieldPath: "player.man.body.weaponParent.arm2.forearm2.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", type: "Vector2", value: "(0.5, 0.5)" },
	{ fieldPath: "player.man.body.weaponParent.arm2.forearm2.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", type: "float", value: 100 },
	{ fieldPath: "player.man.body.weaponParent.arm2.forearm2.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", type: "int", value: 0 },
	{ fieldPath: "player.man.body.weaponParent.arm2.forearm2.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", type: "bool", value: true },
	{ fieldPath: "player.man.body.weaponParent.arm2.forearm2.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", type: "bool", value: true },

	{ fieldPath: "player.man.body.weaponParent.arm2.forearm2.fingers2.Transform.localPosition", "comment": "Координаты объекта для расположения", type: "Vector3", value: "(1.1, 0.2, 0)" },
	{ fieldPath: "player.man.body.weaponParent.arm2.forearm2.fingers2.Transform.localEulerAngles.z", "comment": "Угол наклона", type: "float", value: 0 },
	{ fieldPath: "player.man.body.weaponParent.arm2.forearm2.fingers2.SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", type: "Sprite", suffix: ".SpriteRenderer.sprite", value: "", canChangePivot: false, canChangePosition: false },
	{ fieldPath: "player.man.body.weaponParent.arm2.forearm2.fingers2.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", type: "Vector2", value: "(0.5, 0.5)" },
	{ fieldPath: "player.man.body.weaponParent.arm2.forearm2.fingers2.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", type: "float", value: 100 },
	{ fieldPath: "player.man.body.weaponParent.arm2.forearm2.fingers2.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", type: "int", value: 0 },
	{ fieldPath: "player.man.body.weaponParent.arm2.forearm2.fingers2.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", type: "bool", value: true },
	{ fieldPath: "player.man.body.weaponParent.arm2.forearm2.fingers2.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", type: "bool", value: true },

	{ fieldPath: "player.man.body.weaponParent.arm2.forearm2.fingers2.girth2.Transform.localPosition", "comment": "Координаты объекта для расположения", type: "Vector3", value: "(1.1, 0.2, 0)" },
	{ fieldPath: "player.man.body.weaponParent.arm2.forearm2.fingers2.girth2.Transform.localEulerAngles.z", "comment": "Угол наклона", type: "float", value: 0 },
	{ fieldPath: "player.man.body.weaponParent.arm2.forearm2.fingers2.girth2.SpriteRenderer.sprite", "comment": "Пальцы на рукоятке оружия, PNG-файл", type: "Sprite", suffix: ".SpriteRenderer.sprite", value: "", canChangePivot: false, canChangePosition: false },
	{ fieldPath: "player.man.body.weaponParent.arm2.forearm2.fingers2.girth2.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", type: "Vector2", value: "(0.5, 0.5)" },
	{ fieldPath: "player.man.body.weaponParent.arm2.forearm2.fingers2.girth2.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", type: "float", value: 100 },
	{ fieldPath: "player.man.body.weaponParent.arm2.forearm2.fingers2.girth2.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", type: "int", value: 0 },
	{ fieldPath: "player.man.body.weaponParent.arm2.forearm2.fingers2.girth2.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", type: "bool", value: true },
	{ fieldPath: "player.man.body.weaponParent.arm2.forearm2.fingers2.girth2.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", type: "bool", value: true },


	{ fieldPath: "player.man.thigh.Transform.localPosition", "comment": "Координаты объекта для расположения", type: "Vector3", value: "(1.1, 0.2, 0)" },
	{ fieldPath: "player.man.thigh.Transform.localEulerAngles.z", "comment": "Угол наклона", type: "float", value: 0 },
	{ fieldPath: "player.man.thigh.SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", type: "Sprite", suffix: ".SpriteRenderer.sprite", value: "", canChangePivot: false, canChangePosition: false },
	{ fieldPath: "player.man.thigh.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", type: "Vector2", value: "(0.5, 0.5)" },
	{ fieldPath: "player.man.thigh.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", type: "float", value: 100 },
	{ fieldPath: "player.man.thigh.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", type: "int", value: 0 },
	{ fieldPath: "player.man.thigh.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", type: "bool", value: true },
	{ fieldPath: "player.man.thigh.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", type: "bool", value: true },

	{ fieldPath: "player.man.thigh2.Transform.localPosition", "comment": "Координаты объекта для расположения", type: "Vector3", value: "(1.1, 0.2, 0)" },
	{ fieldPath: "player.man.thigh2.Transform.localEulerAngles.z", "comment": "Угол наклона", type: "float", value: 0 },
	{ fieldPath: "player.man.thigh2.SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", type: "Sprite", suffix: ".SpriteRenderer.sprite", value: "", canChangePivot: false, canChangePosition: false },
	{ fieldPath: "player.man.thigh2.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", type: "Vector2", value: "(0.5, 0.5)" },
	{ fieldPath: "player.man.thigh2.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", type: "float", value: 100 },
	{ fieldPath: "player.man.thigh2.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", type: "int", value: 0 },
	{ fieldPath: "player.man.thigh2.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", type: "bool", value: true },
	{ fieldPath: "player.man.thigh2.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", type: "bool", value: true },

	{ fieldPath: "player.man.thigh.shin.Transform.localPosition", "comment": "Координаты объекта для расположения", type: "Vector3", value: "(1.1, 0.2, 0)" },
	{ fieldPath: "player.man.thigh.shin.Transform.localEulerAngles.z", "comment": "Угол наклона", type: "float", value: 0 },
	{ fieldPath: "player.man.thigh.shin.SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", type: "Sprite", suffix: ".SpriteRenderer.sprite", value: "", canChangePivot: false, canChangePosition: false },
	{ fieldPath: "player.man.thigh.shin.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", type: "Vector2", value: "(0.5, 0.5)" },
	{ fieldPath: "player.man.thigh.shin.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", type: "float", value: 100 },
	{ fieldPath: "player.man.thigh.shin.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", type: "int", value: 0 },
	{ fieldPath: "player.man.thigh.shin.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", type: "bool", value: true },
	{ fieldPath: "player.man.thigh.shin.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", type: "bool", value: true },

	{ fieldPath: "player.man.thigh2.shin2.Transform.localPosition", "comment": "Координаты объекта для расположения", type: "Vector3", value: "(1.1, 0.2, 0)" },
	{ fieldPath: "player.man.thigh2.shin2.Transform.localEulerAngles.z", "comment": "Угол наклона", type: "float", value: 0 },
	{ fieldPath: "player.man.thigh2.shin2.SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", type: "Sprite", suffix: ".SpriteRenderer.sprite", value: "", canChangePivot: false, canChangePosition: false },
	{ fieldPath: "player.man.thigh2.shin2.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", type: "Vector2", value: "(0.5, 0.5)" },
	{ fieldPath: "player.man.thigh2.shin2.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", type: "float", value: 100 },
	{ fieldPath: "player.man.thigh2.shin2.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", type: "int", value: 0 },
	{ fieldPath: "player.man.thigh2.shin2.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", type: "bool", value: true },
	{ fieldPath: "player.man.thigh2.shin2.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", type: "bool", value: true },

	{ fieldPath: "player.man.thigh.shin.foot.Transform.localPosition", "comment": "Координаты объекта для расположения", type: "Vector3", value: "(1.1, 0.2, 0)" },
	{ fieldPath: "player.man.thigh.shin.foot.Transform.localEulerAngles.z", "comment": "Угол наклона", type: "float", value: 0 },
	{ fieldPath: "player.man.thigh.shin.foot.SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", type: "Sprite", suffix: ".SpriteRenderer.sprite", value: "", canChangePivot: false, canChangePosition: false },
	{ fieldPath: "player.man.thigh.shin.foot.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", type: "Vector2", value: "(0.5, 0.5)" },
	{ fieldPath: "player.man.thigh.shin.foot.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", type: "float", value: 100 },
	{ fieldPath: "player.man.thigh.shin.foot.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", type: "int", value: 0 },
	{ fieldPath: "player.man.thigh.shin.foot.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", type: "bool", value: true },
	{ fieldPath: "player.man.thigh.shin.foot.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", type: "bool", value: true },

	{ fieldPath: "player.man.thigh2.shin2.foot2.Transform.localPosition", "comment": "Координаты объекта для расположения", type: "Vector3", value: "(1.1, 0.2, 0)" },
	{ fieldPath: "player.man.thigh2.shin2.foot2.Transform.localEulerAngles.z", "comment": "Угол наклона", type: "float", value: 0 },
	{ fieldPath: "player.man.thigh2.shin2.foot2.SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", type: "Sprite", suffix: ".SpriteRenderer.sprite", value: "", canChangePivot: false, canChangePosition: false },
	{ fieldPath: "player.man.thigh2.shin2.foot2.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", type: "Vector2", value: "(0.5, 0.5)" },
	{ fieldPath: "player.man.thigh2.shin2.foot2.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", type: "float", value: 100 },
	{ fieldPath: "player.man.thigh2.shin2.foot2.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", type: "int", value: 0 },
	{ fieldPath: "player.man.thigh2.shin2.foot2.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", type: "bool", value: true },
	{ fieldPath: "player.man.thigh2.shin2.foot2.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", type: "bool", value: true },

];

//Слушатель события
function onRemoveParameter(param) { }

//Добавить основные парамметры WeaponCartridge
baseParams.forEach(field => {
	if (field.type == "Sprite") {
		defaultAddedFields.push([field.fieldPath, "NULL"]);
	}
});
//Добавить параметры для наследумых классов от WeaponCartridge
sampleParams.forEach(field => {
	if (field.type == "Sprite") {
		defaultAddedFields.push([field.fieldPath, "NULL"]);
	}
});



