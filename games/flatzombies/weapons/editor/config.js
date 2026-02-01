//Функции для работы с точками в окне предпросмотра
class SpriteScreenListener {
	onSelect(spriteRender) { }
	onRender(spriteRender) { }
	onInactive(spriteRender) { }
	onSyncSceneToParams(spriteRender) { }
	onSyncParamsToScene(spriteRender) { }
}

//Обновлять fingerPoint при вращении объекта, который используется как точка с рендером пальцев от игрового персонажа
//Внутрь объекта с пальцами помещаем дочерний объект riflePoint, который будет использоваться для преобразования координат
//При вращении пальцев получаем глобальную точку от riflePoint и вычисляем разницу между точкой вращения кисти
class HandRenderListener extends SpriteScreenListener {
	rifleX; rifleY; //Записать координаты смещения оружия от точки вращения кисти
	riflePoint;
	constructor(rifleX, rifleY) {
		super(); // Необходимо вызвать конструктор родительского класса
		this.rifleX = rifleX; this.rifleY = rifleY;
	}
	onSelect(spriteRender) {

	}
	onRender(spriteRender) { this.onSyncSceneToParams(spriteRender); }

	//Копирование параметров ИЗ сцены
	onSyncSceneToParams(spriteRender) {
		const sceneParent = sceneObjects.find(s => s.parent == '');
		const point = getWorldPosition('riflePoint');
		const x = -(this.rifleX - (point.x - sceneParent.localPosition.x));
		const y = (this.rifleY - (point.y - sceneParent.localPosition.y));
		const paramId = editedParams.findIndex(p => p.startFieldPath == spriteRender.parameter);
		if (paramId == -1) { console.warn('HandRenderListener: paramId == -1 - ' + spriteRender.parameter); return; } //Параметр должен быть найден
		editedParams[paramId].value = '(' + x.toFixed(3) + ', ' + y.toFixed(3) + ')'; //Меняем координаты в парамтерах. Для обновления угла используются настройки из массива editedPoint
		//sceneObjects.find(s => s.name == 'bolt').localPosition = { x: point.x, y: point.y }; //Тестирование
	}
	//Копирование параметров В сцену
	onSyncParamsToScene(spriteRender) {
		spriteRender.localPosition.x = 0;
		spriteRender.localPosition.y = 0;
		sceneObjects.push({
			name: 'riflePoint',
			parent: spriteRender.name,
			texture: '',
			localPosition: { x: this.rifleX, y: this.rifleY }, localAngle: 0,
			sortingOrder: 1000,
			pixelPerUnit: 100,
			pivotPoint: { x: 0.5, y: 0.5 },
			enabled: true, isActive: true,
			canChangePivot: false, canChangeLocalAngle: false,
			parameter: ''
		});
	}
	onInactive(spriteRender) {
		spriteRender.localPosition.x = 0;
		spriteRender.localPosition.y = 0;
		renderEditedParams();
	}
}

//Объекты для анимации. Меняем и возвращаем координаты спрайтов для предпросмотра
class MagazineInsertListener extends SpriteScreenListener {
	magazineName;
	returnLastPosition;
	constructor(sceneObjName, returnLastPosition) {
		super(); // Необходимо вызвать конструктор родительского класса
		this.lastMagazPoint = { x: 0, y: 0, angle: 0 };
		this.magazineName = sceneObjName;
		this.returnLastPosition = returnLastPosition;
	}
	onSelect(spriteRender) {
		const magazine = sceneObjects.find(s => s.name == this.magazineName) || sceneObjects.find(s => s.name == editedParams.find(f => f.fieldPath == this.magazineName)?.value);
		if (!magazine) return;
		if (this.lastMagazPoint.x == 0 && this.lastMagazPoint.y == 0) { this.lastMagazPoint.x = magazine.localPosition.x; this.lastMagazPoint.y = magazine.localPosition.y; this.lastMagazPoint.angle = magazine.localAngle; }
		magazine.localPosition.x = spriteRender.localPosition.x;
		magazine.localPosition.y = spriteRender.localPosition.y;
		magazine.localAngle = spriteRender.localAngle;
	}
	onRender(spriteRender) { this.onSelect(spriteRender); }
	onInactive(spriteRender) {
		if (!this.returnLastPosition) return;
		const magazine = sceneObjects.find(s => s.name == this.magazineName) || sceneObjects.find(s => s.name == editedParams.find(f => f.fieldPath == this.magazineName)?.value);
		if (!magazine) return;
		magazine.localPosition.x = this.lastMagazPoint.x; magazine.localPosition.y = this.lastMagazPoint.y; magazine.localAngle = this.lastMagazPoint.angle;
		this.lastMagazPoint = { x: 0, y: 0, angle: 0 };
	}
}




const weapons = new Array();

const editedPoint = [ //Окно предпросмотра имеет функцию для вращения точки и нужно указать в какой параметр записывать вращение объекта
	{ name: 'flashlight', angle: null, parent: 'WeaponSilencerMod.bolt' }, //Для отображения фонаря и глушителя нужно взять его родительский объект из списка параметров
	{ name: 'WeaponSilencerMod.localPoint', angle: null, parent: 'WeaponSilencerMod.bolt' },
	{ name: 'laserPosition', angle: null, parent: null },
	{ name: 'magazineDrop.position', angle: 'magazineDrop.angleRotation', parent: null },
	{ name: '.magazineInsert', angle: '.magazineInsertAngle', parent: null },
	{ name: 'WeaponHandPoints.fingerPoint', angle: 'WeaponHandPoints.fingerAngle', parent: null },
	{ name: 'coverMove.movePosition', angle: 'WeaponHandPoints.coverMove.movePosition.z', parent: null },
	{ name: 'coverMove.startPosition', angle: 'WeaponHandPoints.coverMove.startPosition.z', parent: null },
	{ name: 'boltMove.movePosition', angle: 'WeaponHandPoints.boltMove.movePosition.z', parent: null },
	{ name: 'boltMove.startPosition', angle: 'WeaponHandPoints.boltMove.startPosition.z', parent: null },
	{ name: 'handleMove.movePosition', angle: 'WeaponHandPoints.handleMove.movePosition.z', parent: null },
	{ name: 'handleMove.startPosition', angle: 'WeaponHandPoints.handleMove.startPosition.z', parent: null },
	{ name: 'handleMove.movePosition', angle: 'WeaponHandPoints.handleMove.movePosition.z', parent: null },
	{ name: 'handleMove.startPosition', angle: 'WeaponHandPoints.handleMove.startPosition.z', parent: null },
	{ name: 'position', angle: 'angle', parent: null },
]
const ignoreIconSprites = ['gunFlash', ".player", ".player.man"]; //Имена спрайтов, которые следует убрать при генерации иконки оружия для интрфейса
const ignoreImportFields = ['storeInfo.iconBase64', 'storeInfo.silencerPosition', 'storeInfo.magazineSize', 'targetVersion', 'version'];
const ignoreExportFields = ['.gunFlash.SpriteRenderer.', '.gunFlash2.SpriteRenderer.', 'weapon.gameObject.SetActive', 'weapon.WeaponHandPoints.WeaponAnimation',
	"weapon.player.Transform.localPosition",
	"weapon.player.man.Transform.localPosition",
	"weapon.player.man.body.Transform.localPosition",
	"weapon.player.man.body.head.Transform.localPosition",
	"weapon.player.man.body.weaponParent.Transform.localPosition",
	"weapon.player.man.body.weaponParent.arm.Transform.localPosition",
	"weapon.player.man.body.weaponParent.arm2.Transform.localPosition",
	"weapon.player.man.body.weaponParent.arm3.Transform.localPosition",
	"weapon.player.man.thigh.Transform.localPosition",
	"weapon.player.man.thigh.shin.Transform.localPosition",
	"weapon.player.man.thigh.shin.foot.Transform.localPosition",
	"weapon.player.man.thigh2.Transform.localPosition",
	"weapon.player.man.thigh2.shin2.Transform.localPosition",
	"weapon.player.man.thigh2.shin2.foot2.Transform.localPosition",
	"weapon.player.man.body.weaponParent.arm.Transform.localPosition",
	"weapon.player.man.body.weaponParent.arm.forearm.Transform.localPosition",
	"weapon.player.man.body.weaponParent.arm.forearm.fingers.Transform.localPosition",
	"weapon.player.man.body.weaponParent.arm.forearm.fingers.render.Transform.localPosition",
	"weapon.player.man.body.weaponParent.arm.forearm.fingers.magazine.Transform.localPosition",
	"weapon.player.man.body.weaponParent.arm2.Transform.localPosition",
	"weapon.player.man.body.weaponParent.arm2.forearm2.Transform.localPosition",
	"weapon.player.man.body.weaponParent.arm2.forearm2.fingers2.Transform.localPosition",
	"weapon.player.man.body.weaponParent.arm2.forearm2.fingers2.magazine2.Transform.localPosition",
	"weapon.player.man.body.weaponParent.arm2.forearm2.fingers2.girth2.Transform.localPosition",
	"weapon.player.man.body.weaponParent.arm3.Transform.localPosition",
	"weapon.player.man.body.weaponParent.arm3.forearm3.Transform.localPosition",
	"weapon.player.man.body.weaponParent.arm3.forearm3.fingers3.Transform.localPosition",
	"weapon.Transform.localEulerAngles.z",
	"weapon.player.Transform.localEulerAngles.z",
	"weapon.player.man.Transform.localEulerAngles.z",
	"weapon.player.man.body.Transform.localEulerAngles.z",
	"weapon.player.man.body.head.Transform.localEulerAngles.z",
	"weapon.player.man.body.weaponParent.Transform.localEulerAngles.z",
	"weapon.player.man.body.weaponParent.arm.Transform.localEulerAngles.z",
	"weapon.player.man.body.weaponParent.arm2.Transform.localEulerAngles.z",
	"weapon.player.man.body.weaponParent.arm3.Transform.localEulerAngles.z",
	"weapon.player.man.thigh.Transform.localEulerAngles.z",
	"weapon.player.man.thigh.shin.Transform.localEulerAngles.z",
	"weapon.player.man.thigh.shin.foot.Transform.localEulerAngles.z",
	"weapon.player.man.thigh2.Transform.localEulerAngles.z",
	"weapon.player.man.thigh2.shin2.Transform.localEulerAngles.z",
	"weapon.player.man.thigh2.shin2.foot2.Transform.localEulerAngles.z",
	"weapon.player.man.body.weaponParent.arm.Transform.localEulerAngles.z",
	"weapon.player.man.body.weaponParent.arm.forearm.Transform.localEulerAngles.z",
	"weapon.player.man.body.weaponParent.arm.forearm.fingers.Transform.localEulerAngles.z",
	"weapon.player.man.body.weaponParent.arm.forearm.fingers.render.Transform.localEulerAngles.z",
	"weapon.player.man.body.weaponParent.arm.forearm.fingers.magazine.Transform.localEulerAngles.z",
	"weapon.player.man.body.weaponParent.arm2.Transform.localEulerAngles.z",
	"weapon.player.man.body.weaponParent.arm2.forearm2.Transform.localEulerAngles.z",
	"weapon.player.man.body.weaponParent.arm2.forearm2.fingers2.Transform.localEulerAngles.z",
	"weapon.player.man.body.weaponParent.arm2.forearm2.fingers2.magazine2.Transform.localEulerAngles.z",
	"weapon.player.man.body.weaponParent.arm2.forearm2.fingers2.girth2.Transform.localEulerAngles.z",
	"weapon.player.man.body.weaponParent.arm3.Transform.localEulerAngles.z",
	"weapon.player.man.body.weaponParent.arm3.forearm3.Transform.localEulerAngles.z",
	"weapon.player.man.body.weaponParent.arm3.forearm3.fingers3.Transform.localEulerAngles.z",
	"weapon.player.gameObject.SetActive",
	"weapon.player.man.gameObject.SetActive",
	"weapon.player.man.body.gameObject.SetActive",
	"weapon.player.man.body.head.gameObject.SetActive",
	"weapon.player.man.body.weaponParent.gameObject.SetActive",
	"weapon.player.man.body.weaponParent.arm.gameObject.SetActive",
	"weapon.player.man.body.weaponParent.arm2.gameObject.SetActive",
	"weapon.player.man.body.weaponParent.arm3.gameObject.SetActive",
	"weapon.player.man.thigh.gameObject.SetActive",
	"weapon.player.man.thigh.shin.gameObject.SetActive",
	"weapon.player.man.thigh.shin.foot.gameObject.SetActive",
	"weapon.player.man.thigh2.gameObject.SetActive",
	"weapon.player.man.thigh2.shin2.gameObject.SetActive",
	"weapon.player.man.thigh2.shin2.foot2.gameObject.SetActive",
	"weapon.player.man.body.weaponParent.arm.gameObject.SetActive",
	"weapon.player.man.body.weaponParent.arm.forearm.gameObject.SetActive",
	"weapon.player.man.body.weaponParent.arm.forearm.fingers.gameObject.SetActive",
	"weapon.player.man.body.weaponParent.arm.forearm.fingers.render.gameObject.SetActive",
	"weapon.player.man.body.weaponParent.arm.forearm.fingers.magazine.gameObject.SetActive",
	"weapon.player.man.body.weaponParent.arm2.gameObject.SetActive",
	"weapon.player.man.body.weaponParent.arm2.forearm2.gameObject.SetActive",
	"weapon.player.man.body.weaponParent.arm2.forearm2.fingers2.gameObject.SetActive",
	"weapon.player.man.body.weaponParent.arm2.forearm2.fingers2.magazine2.gameObject.SetActive",
	"weapon.player.man.body.weaponParent.arm2.forearm2.fingers2.girth2.gameObject.SetActive",
	"weapon.player.man.body.weaponParent.arm3.gameObject.SetActive",
	"weapon.player.man.body.weaponParent.arm3.forearm3.gameObject.SetActive",
	"weapon.player.man.body.weaponParent.arm3.forearm3.fingers3.gameObject.SetActive",
	"weapon.player.SpriteRenderer.sortingOrder",
	"weapon.player.man.SpriteRenderer.sortingOrder",
	"weapon.player.man.body.SpriteRenderer.sortingOrder",
	"weapon.player.man.body.head.SpriteRenderer.sortingOrder",
	"weapon.player.man.body.weaponParent.SpriteRenderer.sortingOrder",
	"weapon.player.man.body.weaponParent.arm.SpriteRenderer.sortingOrder",
	"weapon.player.man.body.weaponParent.arm2.SpriteRenderer.sortingOrder",
	"weapon.player.man.body.weaponParent.arm3.SpriteRenderer.sortingOrder",
	"weapon.player.man.thigh.SpriteRenderer.sortingOrder",
	"weapon.player.man.thigh.shin.SpriteRenderer.sortingOrder",
	"weapon.player.man.thigh.shin.foot.SpriteRenderer.sortingOrder",
	"weapon.player.man.thigh2.SpriteRenderer.sortingOrder",
	"weapon.player.man.thigh2.shin2.SpriteRenderer.sortingOrder",
	"weapon.player.man.thigh2.shin2.foot2.SpriteRenderer.sortingOrder",
	"weapon.player.man.body.weaponParent.arm.SpriteRenderer.sortingOrder",
	"weapon.player.man.body.weaponParent.arm.forearm.SpriteRenderer.sortingOrder",
	"weapon.player.man.body.weaponParent.arm.forearm.fingers.SpriteRenderer.sortingOrder",
	"weapon.player.man.body.weaponParent.arm.forearm.fingers.render.SpriteRenderer.sortingOrder",
	"weapon.player.man.body.weaponParent.arm.forearm.fingers.magazine.SpriteRenderer.sortingOrder",
	"weapon.player.man.body.weaponParent.arm2.SpriteRenderer.sortingOrder",
	"weapon.player.man.body.weaponParent.arm2.forearm2.SpriteRenderer.sortingOrder",
	"weapon.player.man.body.weaponParent.arm2.forearm2.fingers2.SpriteRenderer.sortingOrder",
	"weapon.player.man.body.weaponParent.arm2.forearm2.fingers2.magazine2.SpriteRenderer.sortingOrder",
	"weapon.player.man.body.weaponParent.arm2.forearm2.fingers2.girth2.SpriteRenderer.sortingOrder",
	"weapon.player.man.body.weaponParent.arm3.SpriteRenderer.sortingOrder",
	"weapon.player.man.body.weaponParent.arm3.forearm3.SpriteRenderer.sortingOrder",
	"weapon.player.man.body.weaponParent.arm3.forearm3.fingers3.SpriteRenderer.sortingOrder",
	"weapon.player.SpriteRenderer.enabled",
	"weapon.player.man.SpriteRenderer.enabled",
	"weapon.player.man.body.SpriteRenderer.enabled",
	"weapon.player.man.body.head.SpriteRenderer.enabled",
	"weapon.player.man.body.weaponParent.SpriteRenderer.enabled",
	"weapon.player.man.body.weaponParent.arm.SpriteRenderer.enabled",
	"weapon.player.man.body.weaponParent.arm2.SpriteRenderer.enabled",
	"weapon.player.man.body.weaponParent.arm3.SpriteRenderer.enabled",
	"weapon.player.man.thigh.SpriteRenderer.enabled",
	"weapon.player.man.thigh.shin.SpriteRenderer.enabled",
	"weapon.player.man.thigh.shin.foot.SpriteRenderer.enabled",
	"weapon.player.man.thigh2.SpriteRenderer.enabled",
	"weapon.player.man.thigh2.shin2.SpriteRenderer.enabled",
	"weapon.player.man.thigh2.shin2.foot2.SpriteRenderer.enabled",
	"weapon.player.man.body.weaponParent.arm.SpriteRenderer.enabled",
	"weapon.player.man.body.weaponParent.arm.forearm.SpriteRenderer.enabled",
	"weapon.player.man.body.weaponParent.arm.forearm.fingers.SpriteRenderer.enabled",
	"weapon.player.man.body.weaponParent.arm.forearm.fingers.render.SpriteRenderer.enabled",
	"weapon.player.man.body.weaponParent.arm.forearm.fingers.magazine.SpriteRenderer.enabled",
	"weapon.player.man.body.weaponParent.arm2.SpriteRenderer.enabled",
	"weapon.player.man.body.weaponParent.arm2.forearm2.SpriteRenderer.enabled",
	"weapon.player.man.body.weaponParent.arm2.forearm2.fingers2.SpriteRenderer.enabled",
	"weapon.player.man.body.weaponParent.arm2.forearm2.fingers2.magazine2.SpriteRenderer.enabled",
	"weapon.player.man.body.weaponParent.arm2.forearm2.fingers2.girth2.SpriteRenderer.enabled",
	"weapon.player.man.body.weaponParent.arm3.SpriteRenderer.enabled",
	"weapon.player.man.body.weaponParent.arm3.forearm3.SpriteRenderer.enabled",
	"weapon.player.man.body.weaponParent.arm3.forearm3.fingers3.SpriteRenderer.enabled",
];
const prefixHide = ['weapon.RifleWithMagazine.', 'weapon.Musket.', 'weapon.Shotgun.', 'weapon.MeleeWeapon.', 'weapon.WeaponArrowBow.', 'weapon.'];
const prefixExport = 'weapon.'; //Вернуть приставку при экспорте

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
	'TextureSprite': [
		'pivotPoint',
		'pixelPerUnit',
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
	'WeaponHandPoints': [
		'weaponType',
		"buttstockPoint",
		"buttstockReload",
		"handguardPoint",
		"magazinePoint",
		"magazineInsert",
		"magazineInsertAngle",
		"boltPoint",
		"boltMovePoint",
		"handInsertPoint",
		"bulletPoint",
		"closedCoverPoint",
		"openCoverPoint",
		"boltMove.render",
		"boltMove.startPosition",
		"boltMove.movePosition",
		"coverMove.render",
		"coverMove.startPosition",
		"coverMove.movePosition",
		"handleMove.render",
		"handleMove.startPosition",
		"handleMove.movePosition",
	],
	'WeaponHandPoints.fingerPoint': [
		'WeaponHandPoints.fingerPoint',
		'WeaponHandPoints.fingerAngle'
	],
	'weapon.caliber': [
		'cartridgeList',
	]
};

const availableByField = {
	'WeaponHandPoints.coverMove.render': { parent: 'WeaponHandPoints.weaponType', value: 'machinegun' },
	'WeaponHandPoints.coverMove.startPosition': { parent: 'WeaponHandPoints.weaponType', value: 'machinegun' },
	'WeaponHandPoints.coverMove.movePosition': { parent: 'WeaponHandPoints.weaponType', value: 'machinegun' },
	'WeaponHandPoints.openCoverPoint': { parent: 'WeaponHandPoints.weaponType', value: 'machinegun' },
	'WeaponHandPoints.closedCoverPoint': { parent: 'WeaponHandPoints.weaponType', value: 'machinegun' },
	'WeaponHandPoints.bulletPoint': { parent: 'WeaponHandPoints.weaponType', value: ['machinegun', 'shotgun', 'shotgun+leftBolt', 'barrettM99', 'dp12', 'grizzly85', 'ksg', 'mossberg590', 'mr27'] },
}

//Перемещение спрайтов за точкой, когда она находится в выбранном состоянии
spriteScreenListeners = {
	'magazineDrop.position': new MagazineInsertListener('magazine', true),
	'magazineInsert': new MagazineInsertListener('magazine', true),
	'boltMove.movePosition': new MagazineInsertListener('WeaponHandPoints.boltMove.render', true),
	'boltMove.startPosition': new MagazineInsertListener('WeaponHandPoints.boltMove.render', false),
	'coverMove.movePosition': new MagazineInsertListener('WeaponHandPoints.coverMove.render', true),
	'coverMove.startPosition': new MagazineInsertListener('WeaponHandPoints.coverMove.render', false),
	'handleMove.movePosition': new MagazineInsertListener('WeaponHandPoints.handleMove.render', true),
	'handleMove.startPosition': new MagazineInsertListener('WeaponHandPoints.handleMove.render', false),
	'fingerRender': new HandRenderListener(-0.35, 0.13),
};

const defaultAddedFields = [ //Добавить некоторые параметры сразу в список, если их значений НЕ равно defaultAddedFields[x][1]
	["nameFull", 123456],
	["author", 123456],
	["authorURL", 123456],
	["SpriteRenderer.sprite", ""],
	["bolt", ""],
	["flashlight", "(0, 0, 0)"],
	["laserPosition", "(0, 0)"],
	["shellDrop.position", "(0, 0)"],
	["magazineDrop.position", "(0, 0)"],
	["WeaponSilencerMod.localPoint", "(0, 0)"],
	["silencerGroup", ""],
	["recoilSteps", ""],
	["recoilMax", ""],
	["recoilDecrease", ""],
	["audioShot", 123456],
	["shotAudioList", ""],
	["fireRateInMinute", ""],
	["Musket.chamberSize", 0],
	["weapon.chamberSize", 1],
	["weapon.chamberSize", 0],
	["shellDrop.quantity", 1],
	["shellDrop.quantity", 0],
	["shellDrop.patronOrderSize", ""],
	["shellDrop.patronListSpaceStep", ""],
	["shellDrop.patronListSpaceStep", ""],
	["addBulletsReload", ""],
	["magazineMax", ""],
	["delayBullet", 0],
	["automat", 123456],
	["caliber", 123456],
	["magazineStep", 0], //Добавить magazineStep сразу в список, если он НЕ равен нулю
	["magazineStep", 1], //Добавить magazineStep сразу в список, если он НЕ равен еденице
	["chamberAnimationStep", 0],
	["chamberAnimationStep", 1],
	["AnimationSpriteRenderer.sprites", ""],
	["magazine.AnimationSpriteRenderer.sprites", ""],
	["gameObject.SetActive", true],
	["WeaponHandPoints.coverMove.sprites", ""],
	["WeaponHandPoints.fingerPoint", ""], //(0, 0, 0)
	["WeaponHandPoints.fingerAngle", ""],
	//["shotAnimations", ""], v209
	["shotAnimations[0].animation", ""],
	["WeaponHandPoints.weaponType", "", "weapon.WeaponHandPoints.WeaponAnimation"],
	["WeaponHandPoints.clip", ""]
];

//idHTMLInput - взять значение из HTML-элемента по его id
//sourceFieldPath - взять значение из другого параметра по его fieldPath
//value - указать сразу своё значение
var mainParams = [ //Список важных параметров для записи в итоговый файл. Показать ошибку, если параметр не указан
	{ fieldPath: "id", idHTMLInput: "idWeapon", lowerCase: true },
	{ fieldPath: "idTemplate", idHTMLInput: "idTemplate" },
	{ fieldPath: "type", value: "weapon" }, //Указать сразу своё значение 
	{ fieldPath: "weapon.caliber", sourceFieldPath: "caliber" }, //Патрон/калибр оружия
	{ fieldPath: "storeInfo.nameFull", idHTMLInput: "idWeapon" }, //Название оружия в интерфейсе
	{ fieldPath: "storeInfo.magazineSize", sourceFieldPath: "magazineMax" },
	{ fieldPath: "storeInfo.magazineSize", sourceFieldPath: "chamberSize" },
];

const importReplace = [
	{ fieldPath: "storeInfo.autor", newPath: "storeInfo.author" },
	{ fieldPath: "storeInfo.autorURL", newPath: "storeInfo.authorURL" },
];

const audioClipMetaData = [
	{ "fieldPath": "audio", "comment": "Звук", "type": "string", "value": "" },
];
const typeFullForm = { //Полная форма для редактирования набора данных с заголовком и комментарием
	'WeaponCartridge[]': function (param, idx) { return renderJsonArray(param, idx); },
	'AudioClip[]': function (param, idx) { return renderFileArray(param, idx, ".wav"); },
	'Sprite[]': function (param, idx) { return renderSpriteArray(param, idx, spriteArrayMetaData); }, //renderObjectArray(param, idx, spriteArrayMetaData);
	'AnimationSprite[]': function (param, idx) { return renderAnimationSprite(param, idx, frameArrayMetaData); },
	'NameAnimationFire[]': function (param, idx) { return renderObjectArray(param, idx, shotAnimationMetaData); },
}
const typeLightForm = { //Одно поле для редактирования без заголовка
	'WeaponCartridge': function (param, idx) { return renderWeaponCartridge(param, idx); }
}

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

//{ "fieldPath": "имяПоля", "comment": "Текст из [Tooltip]", "type": "типПоля", "value": "значениПоУмолчанию" },
const shotAnimationMetaData = [
	{ "fieldPath": "animation", "comment": "Имя анимации", "type": "string", "value": "", options: ["fire", "LabelShotFire"] },
	{ "fieldPath": "fire", "comment": "Анимация огня/дыма", "type": "Transform", "value": "gunFlash" },
	{ "fieldPath": "audioTimeRandom", "comment": "Сдвигать звук для следующего выстрела", "type": "float", "value": 0.05 },
	{ "fieldPath": "chamberStep", "comment": "Число выстрелов для анимации", "type": "int", "value": 0 },
	{ "fieldPath": "magazineStep", "comment": "Число выстрелов для анимации", "type": "int", "value": 0 },
	{ "fieldPath": "timeFreeze", "comment": "Задержка/заморозка оружия при работе анимации", "type": "float", "value": 0 },
	{ "fieldPath": "playWhenEmpty", "comment": "Показать анимацию после последнего выстрела перед запуском перезарядки. Например для помповых дробовиков следует отключить параметр", "type": "bool", "value": false }
];


var baseParams = [  //Список параметров, доступные для редактирования у всех оружий
	{ "fieldPath": "storeInfo.nameFull", "comment": "Название оружия в интерфейсе", "type": "string", "value": "" },
	{ "fieldPath": "storeInfo.author", "comment": "Автор модификации. Никнейм для отображения в интерфейсе (необязательно)", "type": "string", "value": "", placeholder: "pavoldev" },
	{ "fieldPath": "storeInfo.authorURL", "comment": "Ссылка на вашу страницу в социальных сетях (необязательно)", "type": "string", "value": "https://", placeholder: "https://youtube.com/@pavoldev" },
	{ "fieldPath": "storeInfo.donateURL", "comment": "Ссылка для доната.<br>При выборе оружия рядом с кнопкой 'лайк' появится кнопка для доната", "type": "string", "value": "https://", placeholder: "https://" },
	{ "fieldPath": "weapon.WeaponHandPoints.WeaponAnimation", suffix: ".WeaponAnimation", "comment": "Настройка анимации оружия", "type": "WeaponHandPoints", "value": "", displayName: "WeaponAnimation" },
	//{ "fieldPath": "storeInfo.iconBase64", "comment": "Текстура оружия для интерфейса (необязательно)<br>Если не указано, то текстура будет сгенерирована автоматически", "type": "Image", "value": "" },
	{ "fieldPath": "weapon.SpriteRenderer.sprite", "comment": "Основной спрайт/текстура для оружия, PNG-файл", "type": "Sprite", suffix: "SpriteRenderer.sprite", "value": "" },
	{ "fieldPath": "weapon.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "weapon.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": 100 },
	{ "fieldPath": "weapon.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", "type": "bool", "value": true },
	{ "fieldPath": "weapon.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },
	{ "fieldPath": "weapon.Transform.localPosition", "comment": "Координаты объекта для расположения", "type": "Vector3", "value": "(1.1, 0.2, 0)" },
	{ "fieldPath": "weapon.Transform.localEulerAngles.z", "comment": "Угол наклона", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.caliber", "comment": "Калибр оружия. Основной тип патрона<br>Все настройки для урона находятся в патроне", "type": "WeaponCartridge", "value": "", "options": ["9x19", "45ACP", "9x39", "10.3x77", "10x22", "12.7x99", "12.7x99P", "12.7x55", "12x70", "40mm", "44Mag", "5.56x45", "5.7x28", "7.62x39", "7.62x51", "7.62x51Sniper", "7.62x54", "7.62x67", "8.6x70", "arrows", "axe", "katana", "shovel"] }, //
	{ "fieldPath": "cartridgeList", "comment": "Список разных видов патронов.<br>Создайте патрон в отдельном <a href='ammo/' target='_blank' title='Открыть в новой вкладке'>Редакторе патронов</a><br>В редакторе нажмите Экспорт файла и загрузите его в список:", "type": "WeaponCartridge[]", "value": "" },
	{ "fieldPath": "luaScriptBase64", "comment": "Дополнительный скрипт на языке LUA.", "type": "LuaScript", "value": "" },
	{ "fieldPath": "storeInfo.silencerGroup", "comment": "Из какой категории брать глушители", "type": "string", "value": "", "options": ["pistol", "rifle", "shotgun", "seg12", "mr27", "sniper"] },
	{ "fieldPath": "storeInfo.patronListSpaceStep", "comment": "Отступ в интерфейсе на экране со списком патронов", "type": "int", "value": 0 },
	{ "fieldPath": "storeInfo.patronOrderSize", "comment": "Размер списка с патронами для двуствольного ружья", "type": "int", "value": 0 },
]


var sampleParams = [ //Список всех параметров, относящиеся только к оружию в руках
	{ "fieldPath": "weapon.laserSight.Transform.localPosition", "comment": "Координаты объекта для расположения", "type": "Vector3", "value": "(1.1, 0.2, 0)" },
	{ "fieldPath": "weapon.laserSight.Transform.localEulerAngles.z", "comment": "Угол наклона", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.laserSight.SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", "type": "Sprite", suffix: ".SpriteRenderer.sprite", "value": "" },
	{ "fieldPath": "weapon.laserSight.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "weapon.laserSight.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": 100 },
	{ "fieldPath": "weapon.laserSight.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.laserSight.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", "type": "bool", "value": true },
	{ "fieldPath": "weapon.laserSight.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },
	{ "fieldPath": "weapon.magazine.SpriteRenderer.sprite", "comment": "Магазин оружия, спрайт/текстура, PNG-файл", "type": "Sprite", suffix: ".SpriteRenderer.sprite", "value": "" },
	{ "fieldPath": "weapon.magazine.bullet.SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", "type": "Sprite", suffix: ".SpriteRenderer.sprite", "value": "" },
	{ "fieldPath": "weapon.boltRender.Transform.localPosition", "comment": "Координаты объекта для расположения", "type": "Vector3", "value": "(1.1, 0.2, 0)" },
	{ "fieldPath": "weapon.boltRender.Transform.localEulerAngles.z", "comment": "Угол наклона", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.boltRender.SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", "type": "Sprite", suffix: ".SpriteRenderer.sprite", "value": "" },
	{ "fieldPath": "weapon.boltRender.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "weapon.boltRender.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": 100 },
	{ "fieldPath": "weapon.boltRender.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.boltRender.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", "type": "bool", "value": true },
	{ "fieldPath": "weapon.boltRender.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },
	{ "fieldPath": "weapon.boltHandle.Transform.localPosition", "comment": "Координаты объекта для расположения", "type": "Vector3", "value": "(1.1, 0.2, 0)" },
	{ "fieldPath": "weapon.boltHandle.Transform.localEulerAngles.z", "comment": "Угол наклона", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.boltHandle.SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", "type": "Sprite", suffix: ".SpriteRenderer.sprite", "value": "" },
	{ "fieldPath": "weapon.boltHandle.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "weapon.boltHandle.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": 100 },
	{ "fieldPath": "weapon.boltHandle.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.boltHandle.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", "type": "bool", "value": true },
	{ "fieldPath": "weapon.boltHandle.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },
	{ "fieldPath": "weapon.sight.Transform.localPosition", "comment": "Координаты объекта для расположения", "type": "Vector3", "value": "(1.1, 0.2, 0)" },
	{ "fieldPath": "weapon.sight.Transform.localEulerAngles.z", "comment": "Угол наклона", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.sight.SpriteRenderer.sprite", "comment": "Прицел на оружии, PNG-файл", "type": "Sprite", suffix: ".SpriteRenderer.sprite", "value": "" },
	{ "fieldPath": "weapon.sight.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "weapon.sight.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": 100 },
	{ "fieldPath": "weapon.sight.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.sight.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", "type": "bool", "value": true },
	{ "fieldPath": "weapon.sight.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },
	{ "fieldPath": "weapon.boltRender.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },
	{ "fieldPath": "weapon.boltRender.SpriteRenderer.sprite", "comment": "Рукоятка, PNG-файл", "type": "Sprite", suffix: ".SpriteRenderer.sprite", "value": "" },
	{ "fieldPath": "weapon.handgrip.Transform.localPosition", "comment": "Координаты объекта для расположения", "type": "Vector3", "value": "(1.1, 0.2, 0)" },
	{ "fieldPath": "weapon.handgrip.Transform.localEulerAngles.z", "comment": "Угол наклона", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.handgrip.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },
	{ "fieldPath": "weapon.handgrip.SpriteRenderer.sprite", "comment": "Рукоятка. Может использоваться для дополнительного отображения пальцев.", "type": "Sprite", suffix: ".SpriteRenderer.sprite", "value": "" },
	{ "fieldPath": "weapon.handgrip.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "weapon.handgrip.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": 100 },
	{ "fieldPath": "weapon.handgrip.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.handgrip.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", "type": "bool", "value": true },
	{ "fieldPath": "weapon.handgrip.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },
	{ "fieldPath": "weapon.cover.Transform.localPosition", "comment": "Координаты объекта для расположения", "type": "Vector3", "value": "(1.1, 0.2, 0)" },
	{ "fieldPath": "weapon.cover.Transform.localEulerAngles.z", "comment": "Угол наклона", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.cover.SpriteRenderer.sprite", "comment": "Крышка пулемёта, PNG-файл", "type": "Sprite", suffix: ".SpriteRenderer.sprite", "value": "" },
	{ "fieldPath": "weapon.cover.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "weapon.cover.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": 100 },
	{ "fieldPath": "weapon.cover.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.cover.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", "type": "bool", "value": true },
	{ "fieldPath": "weapon.cover.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },
	{ "fieldPath": "weapon.cover.sight.Transform.localPosition", "comment": "Координаты объекта для расположения", "type": "Vector3", "value": "(1.1, 0.2, 0)" },
	{ "fieldPath": "weapon.cover.sight.Transform.localEulerAngles.z", "comment": "Угол наклона", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.cover.sight.SpriteRenderer.sprite", "comment": "Прицел на оружии, PNG-файл", "type": "Sprite", suffix: ".SpriteRenderer.sprite", "value": "" },
	{ "fieldPath": "weapon.cover.sight.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "weapon.cover.sight.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": 100 },
	{ "fieldPath": "weapon.cover.sight.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.cover.sight.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", "type": "bool", "value": true },
	{ "fieldPath": "weapon.cover.sight.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },
	{ "fieldPath": "weapon.lasersight.Transform.localPosition", "comment": "Координаты объекта для расположения", "type": "Vector3", "value": "(1.1, 0.2, 0)" },
	{ "fieldPath": "weapon.lasersight.Transform.localEulerAngles.z", "comment": "Угол наклона", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.lasersight.SpriteRenderer.sprite", "comment": "Лазер на оружии, PNG-файл", "type": "Sprite", suffix: ".SpriteRenderer.sprite", "value": "" },
	{ "fieldPath": "weapon.lasersight.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "weapon.lasersight.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": 100 },
	{ "fieldPath": "weapon.lasersight.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.lasersight.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", "type": "bool", "value": true },
	{ "fieldPath": "weapon.lasersight.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },
	{ "fieldPath": "weapon.boltHandle.bolt.Transform.localPosition", "comment": "Координаты объекта для расположения", "type": "Vector3", "value": "(1.1, 0.2, 0)" },
	{ "fieldPath": "weapon.boltHandle.bolt.Transform.localEulerAngles.z", "comment": "Угол наклона", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.boltHandle.boltRender.SpriteRenderer.sprite", "comment": "Рукоятка затвора, PNG-файл", "type": "Sprite", suffix: ".SpriteRenderer.sprite", "value": "" },
	{ "fieldPath": "weapon.boltHandle.boltRender.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "weapon.boltHandle.boltRender.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": 100 },
	{ "fieldPath": "weapon.boltHandle.boltRender.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.boltHandle.boltRender.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", "type": "bool", "value": true },
	{ "fieldPath": "weapon.boltHandle.boltRender.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },
	{ "fieldPath": "weapon.sight.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },
	{ "fieldPath": "weapon.audioShot", "comment": "Звук выстрела, PCM 16-bit 44100Hz", "type": "AudioClip", "value": "" },
	{ "fieldPath": "weapon.WeaponSilencerMod.localPoint", "comment": "Координаты глушителя на стволе", "type": "Vector3", "value": "(0, 0, 0)", "spritePreview": "images/silencer.png", "spritePivotPoint": { x: 0, y: 0.5 }, "spritePixelPerUnit": 100 },
	{ "fieldPath": "weapon.laserPosition", "comment": "Позиция лазера от точки вращения оружия", "type": "Vector2", "value": "(0, 0)", "spritePreview": "images/laser.png", "spritePivotPoint": { x: 0, y: 0.5 }, "spritePixelPerUnit": 100, "sortingOrder": 1 },
	{ "fieldPath": "weapon.gunFlash.SpriteRenderer.sprite", "comment": "Огонь от выстрела", "type": "Renderer", "value": "", suffix: ".SpriteRenderer.sprite" },
	{ "fieldPath": "weapon.gunFlash.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "weapon.gunFlash.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": 100 },
	{ "fieldPath": "weapon.gunFlash.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.gunFlash.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", "type": "bool", "value": true },
	{ "fieldPath": "weapon.gunFlash.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },
	{ "fieldPath": "weapon.gunFlash.Transform.localPosition", "comment": "Координаты огня от выстрела", "type": "Vector3", "value": "(1.1, 0.2, 0)" },
	{ "fieldPath": "weapon.gunFlash.Transform.localEulerAngles.z", "comment": "Угол наклона", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.gunFlash.AnimatorSprite.animations", "comment": "Список анимаций", "type": "AnimationSprite[]", "value": "" },
	//{ "fieldPath": "weapon.shotAnimations", "comment": "Анимация выстрела", "type": "NameAnimationFire[]", "value": "" },
	{ "fieldPath": "weapon.shotAnimations[0].animation", "comment": "Анимация выстрела", "type": "string", "value": "fire", options: ["fire", "LabelShotFire"] },
	{ "fieldPath": "weapon.strikeAnimations[0]", "comment": "Анимация выстрела", "type": "string", "value": "fire", options: ["fire", "LabelShotFire"] },
	// { "fieldPath": "weapon.gunFlash.AnimatorSprite.initialAnimation", "comment": "Имя текущей анимации", "type": "string", "value": "" },
	// { "fieldPath": "weapon.gunFlash.AnimatorSprite.playStart", "comment": "Воспроизвести при старте", "type": "bool", "value": true },
	// { "fieldPath": "weapon.gunFlash.AnimatorSprite.animations", "comment": "Список анимаций", "type": "AnimationSprite[]", "value": "" },
	// { "fieldPath": "weapon.gunFlash.AnimatorSprite.timeScale", "comment": "Множитель скорости анимаций", "type": "float", "value": 0 },
	// { "fieldPath": "weapon.gunFlash.AnimatorSprite.speed", "comment": "Скорость/Частота кадров в секунду", "type": "float", "value": 0 },
	// { "fieldPath": "weapon.gunFlash.AnimatorSprite.reverse", "comment": "Воспроизвести в обратном порядке", "type": "bool", "value": true },
	// { "fieldPath": "weapon.gunFlash.AnimatorSprite.loop", "comment": "Проигрывать повторно", "type": "bool", "value": true },
	// { "fieldPath": "weapon.gunFlash.WeaponShotEffect.randomRotate", "comment": "Случайный поворот", "type": "bool", "value": true },
	// { "fieldPath": "weapon.gunFlash.WeaponShotEffect.flipX", "comment": "Отражать случайно по горизонтали/вертикали", "type": "bool", "value": true },
	// { "fieldPath": "weapon.gunFlash.WeaponShotEffect.flipY", "comment": "Отражать случайно по горизонтали/вертикали", "type": "bool", "value": true },
	// { "fieldPath": "weapon.gunFlash.WeaponShotEffect.direction", "comment": "Направление движения", "type": "float", "value": 0 },
	// { "fieldPath": "weapon.gunFlash.WeaponShotEffect.directionRange", "comment": "Отклонение по обе стороны от направления ", "type": "float", "value": 0 },
	// { "fieldPath": "weapon.gunFlash.WeaponShotEffect.speedMin", "comment": "Скорость, метр/секунду", "type": "float", "value": 0 },
	// { "fieldPath": "weapon.gunFlash.WeaponShotEffect.speedMax", "comment": "Макси скорость, метр/секунду", "type": "float", "value": 0 },
	// { "fieldPath": "weapon.gunFlash.WeaponShotEffect.nextEffectShot", "comment": "Передать событие следующему эффекту ", "type": "WeaponShotEffect", "value": "" },
	// { "fieldPath": "weapon.gunFlash2.Transform.localPosition", "comment": "Координаты объекта для расположения", "type": "Vector3", "value": "(1.1, 0.2, 0)" },
	// { "fieldPath": "weapon.gunFlash2.Transform.localEulerAngles.z", "comment": "Угол наклона", "type": "float", "value": 0 },
	// { "fieldPath": "weapon.gunFlash2.AnimatorSprite.initialAnimation", "comment": "Имя текущей анимации", "type": "string", "value": "" },
	// { "fieldPath": "weapon.gunFlash2.AnimatorSprite.playStart", "comment": "Воспроизвести при старте", "type": "bool", "value": true },
	// { "fieldPath": "weapon.gunFlash2.AnimatorSprite.animations", "comment": "Список анимаций", "type": "AnimationSprite[]", "value": "" },
	// { "fieldPath": "weapon.gunFlash2.AnimatorSprite.timeScale", "comment": "Множитель скорости анимаций", "type": "float", "value": 0 },
	// { "fieldPath": "weapon.gunFlash2.AnimatorSprite.speed", "comment": "Скорость/Частота кадров в секунду", "type": "float", "value": 0 },
	// { "fieldPath": "weapon.gunFlash2.AnimatorSprite.reverse", "comment": "Воспроизвести в обратном порядке", "type": "bool", "value": true },
	// { "fieldPath": "weapon.gunFlash2.AnimatorSprite.loop", "comment": "Проигрывать повторно", "type": "bool", "value": true },
	// { "fieldPath": "weapon.gunFlash2.WeaponShotEffect.randomRotate", "comment": "Случайный поворот", "type": "bool", "value": true },
	// { "fieldPath": "weapon.gunFlash2.WeaponShotEffect.flipX", "comment": "Отражать случайно по горизонтали/вертикали", "type": "bool", "value": true },
	// { "fieldPath": "weapon.gunFlash2.WeaponShotEffect.flipY", "comment": "Отражать случайно по горизонтали/вертикали", "type": "bool", "value": true },
	// { "fieldPath": "weapon.gunFlash2.WeaponShotEffect.direction", "comment": "Направление движения", "type": "float", "value": 0 },
	// { "fieldPath": "weapon.gunFlash2.WeaponShotEffect.directionRange", "comment": "Отклонение по обе стороны от направления ", "type": "float", "value": 0 },
	// { "fieldPath": "weapon.gunFlash2.WeaponShotEffect.speedMin", "comment": "Скорость, метр/секунду", "type": "float", "value": 0 },
	// { "fieldPath": "weapon.gunFlash2.WeaponShotEffect.speedMax", "comment": "Макси скорость, метр/секунду", "type": "float", "value": 0 },
	// { "fieldPath": "weapon.gunFlash2.WeaponShotEffect.nextEffectShot", "comment": "Передать событие следующему эффекту ", "type": "WeaponShotEffect", "value": "" },
	// { "fieldPath": "weapon.gunFlash2.SpriteRenderer.sprite", "comment": "Спрайт/текстура выстрела, PNG-файл", "type": "Sprite", suffix: ".SpriteRenderer.sprite", "value": "" },
	// { "fieldPath": "weapon.gunFlash2.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	// { "fieldPath": "weapon.gunFlash2.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": 100 },
	// { "fieldPath": "weapon.gunFlash2.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", "type": "int", "value": 0 },
	// { "fieldPath": "weapon.gunFlash2.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", "type": "bool", "value": true },
	// { "fieldPath": "weapon.gunFlash2.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },
	{ "fieldPath": "weapon.boltRender.fingers.Transform.localPosition", "comment": "Координаты объекта для расположения", "type": "Vector3", "value": "(1.1, 0.2, 0)" },
	{ "fieldPath": "weapon.boltRender.fingers.Transform.localEulerAngles.z", "comment": "Угол наклона", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.boltRender.fingers.SpriteRenderer.sprite", "comment": "Спрайт/текстура пальцев, PNG-файл", "type": "Sprite", suffix: ".SpriteRenderer.sprite", "value": "" },
	{ "fieldPath": "weapon.boltRender.fingers.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "weapon.boltRender.fingers.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": 100 },
	{ "fieldPath": "weapon.boltRender.fingers.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.boltRender.fingers.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", "type": "bool", "value": true },
	{ "fieldPath": "weapon.boltRender.fingers.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },
	{ "fieldPath": "weapon.boltBox.Transform.localPosition", "comment": "Координаты объекта для расположения", "type": "Vector3", "value": "(1.1, 0.2, 0)" },
	{ "fieldPath": "weapon.boltBox.Transform.localEulerAngles.z", "comment": "Угол наклона", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.boltBox.SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", "type": "Sprite", suffix: ".SpriteRenderer.sprite", "value": "" },
	{ "fieldPath": "weapon.boltBox.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "weapon.boltBox.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": 100 },
	{ "fieldPath": "weapon.boltBox.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.boltBox.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", "type": "bool", "value": true },
	{ "fieldPath": "weapon.boltBox.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },
	{ "fieldPath": "weapon.boltHandle.fingers.Transform.localPosition", "comment": "Координаты объекта для расположения", "type": "Vector3", "value": "(1.1, 0.2, 0)" },
	{ "fieldPath": "weapon.boltHandle.fingers.Transform.localEulerAngles.z", "comment": "Угол наклона", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.boltHandle.fingers.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },
	{ "fieldPath": "weapon.boltHandle.fingers.SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", "type": "Sprite", suffix: ".SpriteRenderer.sprite", "value": "" },
	{ "fieldPath": "weapon.boltHandle.fingers.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "weapon.boltHandle.fingers.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": 100 },
	{ "fieldPath": "weapon.boltHandle.fingers.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.boltHandle.fingers.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", "type": "bool", "value": true },
	{ "fieldPath": "weapon.boltHandle.fingers.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },
	{ "fieldPath": "weapon.barrel.Transform.localPosition", "comment": "Координаты объекта для расположения", "type": "Vector3", "value": "(1.1, 0.2, 0)" },
	{ "fieldPath": "weapon.barrel.Transform.localEulerAngles.z", "comment": "Угол наклона", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.barrel.SpriteRenderer.sprite", "comment": "Спрайт/текстура ствола, PNG-файл", "type": "Sprite", suffix: ".SpriteRenderer.sprite", "value": "" },
	{ "fieldPath": "weapon.barrel.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "weapon.barrel.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": 100 },
	{ "fieldPath": "weapon.barrel.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.barrel.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", "type": "bool", "value": true },
	{ "fieldPath": "weapon.barrel.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },
	{ "fieldPath": "weapon.boltRender.handgrip.SpriteRenderer.sprite", "comment": "Рукоятка. Может использоваться для дополнительного отображения пальцев.", "type": "Sprite", suffix: ".SpriteRenderer.sprite", "value": "" },
	{ "fieldPath": "weapon.boltRender.handgrip.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "weapon.boltRender.handgrip.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": 100 },
	{ "fieldPath": "weapon.boltRender.handgrip.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.boltRender.handgrip.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", "type": "bool", "value": true },
	{ "fieldPath": "weapon.boltRender.handgrip.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },
	{ "fieldPath": "weapon.lasersight.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },
	{ "fieldPath": "weapon.laserSight.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },
	{ "fieldPath": "weapon.barrel.lasersight.Transform.localPosition", "comment": "Координаты объекта для расположения", "type": "Vector3", "value": "(1.1, 0.2, 0)" },
	{ "fieldPath": "weapon.barrel.lasersight.Transform.localEulerAngles.z", "comment": "Угол наклона", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.barrel.lasersight.SpriteRenderer.sprite", "comment": "Лазер на оружии, PNG-файл", "type": "Sprite", suffix: ".SpriteRenderer.sprite", "value": "" },
	{ "fieldPath": "weapon.barrel.lasersight.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "weapon.barrel.lasersight.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": 100 },
	{ "fieldPath": "weapon.barrel.lasersight.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.barrel.lasersight.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", "type": "bool", "value": true },
	{ "fieldPath": "weapon.barrel.lasersight.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },
	{ "fieldPath": "weapon.boltRender.fingers.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },

	{ "fieldPath": "weapon.strikeAnimations", "comment": "Случайная анимация выстрела", "type": "String[]", "value": "" },
	{ "fieldPath": "weapon.delayBullet", "comment": "Задержка перед запуском пули после нажатия на курок, в скндх.", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.boltParentName", "comment": "Родительский объект для запуска пули", "type": "string", "value": "" },
	{ "fieldPath": "weapon.bloodySkinManager", "comment": "Следы крови на оружии после удачных попаданий", "type": "ListDamagesSprites", "value": "" },
	{ "fieldPath": "weapon.boltRender.handgrip.Transform.localPosition", "comment": "Координаты объекта для расположения", "type": "Vector3", "value": "(1.1, 0.2, 0)" },
	{ "fieldPath": "weapon.boltRender.handgrip.Transform.localEulerAngles.z", "comment": "Угол наклона", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.cartridge.id", "comment": "Идентификатор патрона, чтобы отличать его от всех остальных", "type": "string", "value": "" },
	{ "fieldPath": "weapon.cartridge.damage", "comment": "Наносимый урон от всех пуль.<br>Будет распределен между всеми пулями", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.cartridge.stopPower", "comment": "Останавливающий эффект [0-1]<br>Зомби сам решает как реагировать на этот параметр", "type": "float", "value": 0, min: 0, max: 1 },
	//{ "fieldPath": "weapon.cartridge.noiseVolume", "comment": "Громкость шума/выстрела от патрона", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.cartridge.impulse", "comment": "Импульс ForceMode2D.Impulse.<br>Будет распределен между всеми пулями", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.cartridge.arrowsPerShot", "comment": "Кол-в во стрел/снарядов при одном выстреле", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.cartridge.angleScatter", "comment": "Максмлн отклонение пули в градусах, для создания разброса", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.cartridge.evenlySpread", "comment": "Равномерное распределение пуль", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.cartridge.timeTriggers", "comment": "Время активности триггеров для снаряда. За это время снаряд должен успеть попасть в цель и затем объекты будут отключены для оптимизации", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.cartridge.distHitArrow", "comment": "Дистанция, в пределах которой снаряд будет фиксировать попадание", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.cartridge.shellSkin", "comment": "Гильза для оружия", "type": "Image", "value": "" },
	{ "fieldPath": "weapon.cartridge.caliberName", "comment": "Название калибра. Разные типы патрона одного калибра должны иметь одинаковое название", "type": "string", "value": "" },
	{ "fieldPath": "weapon.cartridge.iconButtonSprite", "comment": "Иконка патрона для кнопки в интрфейсе", "type": "Image", "value": "" },
	{ "fieldPath": "weapon.cartridge.iconListSprite", "comment": "Иконка патрона для отображения в списке с магазином из автоматической винтовки", "type": "Image", "value": "" },
	{ "fieldPath": "weapon.cartridge.bullets", "comment": "Кол-в во пуль при одном выстреле", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.cartridge.angleRandom", "comment": "Максмлн отклонение пули в градусах, для создания разброса", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.cartridge.angleSpread", "comment": "Равномерное распределение пуль", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.cartridge.velocityMax", "comment": "Ограничение скорости тела после импульса, чтобы тело не улетало далёко", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.cartridge.angularMax", "comment": "Ограничение скорости вращения тела после импульса, чтобы тело не улетало далёко", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.cartridge.distance", "comment": "Дистанция пули для поиска столкновений", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.cartridge.penetration.modeHit", "comment": "• FIRST - Фиксировать все попадания пули, начиная с первого;<br>• RANDOM_ONCE - выбрать только одно попадание в диапазоне [minDist - maxDist], например для взрыва;<br>• RANDOM_FIRST - режим пули с дробью, выбрать любое попадание в диапазоне [minDist - maxDist], а затем фиксировать все остальные проникающие попадания в остальные объекты", "type": "ModeHit", "value": "" },
	{ "fieldPath": "weapon.cartridge.penetration.minHits", "comment": "Сколько минимум попаданий фиксировать для одной пули", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.cartridge.penetration.maxHits", "comment": "Сколько максимум попаданий фиксировать для одной пули", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.cartridge.penetration.minDist", "comment": "Расстояние, на котором фиксировать второе попадание", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.cartridge.penetration.maxDist", "comment": "Расстояние, после которого больше не фиксировать другие попадания", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.cartridge.penetration.findExitPoint", "comment": "Для каждого попадания вычислить точку выхода пули из тела после скозного проникновения", "type": "bool", "value": true },
	{ "fieldPath": "weapon.cartridge.penetration", "comment": "Параметры проникновения для одной пули. Запись попадания пули, если оно проиcходит в разные игровые объекты, которые находятся в разных родительских объектах", "type": "HitsBullet", "value": "" },
	{ "fieldPath": "weapon.cartridge.penetrationDamage", "comment": "Снижение урона после прохождения пули сквозь тела. Для первого попадания сохраняем урон, если оно будет проходить сквозь тела без остановки", "type": "PhysicsMaterialMultiply[]", "value": "" },
	{ "fieldPath": "weapon.cartridge.hitEffects", "comment": "Эффекты попадания", "type": "WeaponEffectsHits", "value": "" },
	{ "fieldPath": "weapon.reloadBoltStop", "comment": "Винтовка имеет затворную задержку. При перезарядке использовать две анимации reloadEmpty и reload", "type": "bool", "value": true },
	{ "fieldPath": "weapon.beltFeeder", "comment": "Оружие устроено как пулемёт с лентой патронов.<br>Сбрасывать патронник при перезарядке и использовать только одну анимацию reloadEmpty", "type": "bool", "value": true },

	{ "fieldPath": "weapon.addBulletsReload", "comment": "Добавление патронов в магазин после анимации перезарядки", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.magazinePlayStep", "comment": "Кол-во патронов из магазина для запуска анимации", "type": "int", "value": 0 },
	{ "fieldPath": "storeInfo.magazineSize", "comment": "Кол-во патронов в магазине", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.magazineMax", "comment": "Кол-во патронов в одном магазине", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.magazineStep", "comment": "Кол-во патронов из магазина для запуска анимации", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.magazineEmptyStep", "comment": "Запустить анимацию после полного опустошения одного отсека магазина", "type": "bool", "value": true },
	{ "fieldPath": "weapon.magazineDrop.position", "comment": "Выкидывать магазин при перезарядке. Локальные координаты", "type": "Vector2", "value": "(0, 0)", "spritePreview": "images/point.png" },
	{ "fieldPath": "weapon.magazineDrop.angleRotation", "comment": "Наклон объекта в локальных координатах", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.magazineDrop.angle", "comment": "Направление выброса в локальных координатах", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.magazineDrop.angleScatter", "comment": "Случаное отклонение от основного направления", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.magazineDrop.impulse.min", "comment": "Скорость выбрасывания", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.magazineDrop.impulse.max", "comment": "Скорость выбрасывания", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.magazineDrop.angleSpeed.min", "comment": "Скорость вращения в секунду", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.magazineDrop.angleSpeed.max", "comment": "Скорость вращения в секунду", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.magazineDrop.quantity", "comment": "Сколько гильз выбросить одновеременно", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.chamberAnimationStep", "comment": "Число выстрелов для анимации", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.timeFreezeShot", "comment": "Дополнительная задержка/заморозка оружия после выстрела на основе magazinePlayStep или chamberAnimationStep", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.playEmptyBoltAnimation", "comment": "Показать анимацию затвора перед запуском перезарядки. Например для помповых дробовиков лучше отключить параметр", "type": "bool", "value": true },
	{ "fieldPath": "weapon.shotAudioList", "comment": "Случайный звук выстрела, PCM 16-bit 44100Hz", "type": "AudioClip[]", "value": "" },
	{ "fieldPath": "weapon.shellDrop.position", "comment": "Гильза. Локальные координаты", "type": "Vector2", "value": "(0, 0)", "spritePreview": "images/shell.png", "spritePivotPoint": { x: 0.08, y: 0.5 }, "spritePixelPerUnit": 100 },
	{ "fieldPath": "weapon.shellDrop.angleRotation", "comment": "Наклон объекта в локальных координатах", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.shellDrop.angle", "comment": "Направление выброса в локальных координатах", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.shellDrop.angleScatter", "comment": "Случаное отклонение от основного направления для гильзы", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.shellDrop.impulse.min", "comment": "Скорость выбрасывания гильзы", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.shellDrop.impulse.max", "comment": "Скорость выбрасывания гильзы", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.shellDrop.angleSpeed.min", "comment": "Скорость вращения в секунду", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.shellDrop.angleSpeed.max", "comment": "Скорость вращения в секунду", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.shellDrop.quantity", "comment": "Сколько гильз выбросить одновеременно", "type": "int", "value": 0 },

	{ "fieldPath": "weapon.recoilSteps", "comment": "Скорость увеличения отдачи. Количесво шагов для достижения угла, указанного в recoilMax", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.recoilMax", "comment": "Максимальный угол отдачи, в градусах", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.recoilDecrease", "comment": "Скорость снижения отдачи до нуля, в градусы/секунду", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.shotDirection", "comment": "Угол отклонения после выстрела", "type": "float", "value": 0 },

	{ "fieldPath": "weapon.bolt", "comment": "Ствол. Точка где начинается ствол оружия.<br>Точка, где будет появляться пуля и откуда начинается поиск столкновений", "type": "Vector3", "value": "(0, 0, 0)", "spritePreview": "images/point.png" },
	{ "fieldPath": "weapon.flashlight", "comment": "Локальные координаты фонарика", "type": "Vector3", "value": "(0, 0, 0)", "spritePreview": "images/flashlight.png", "spritePivotPoint": { x: 0, y: 0.5 }, "spritePixelPerUnit": 100 },
	{ "fieldPath": "weapon.flashlightParent", "comment": "Родительский объект для фонарика<br>Для холодного оружия использовать плечо для фонарика, т.к. возникает баг, когда оружие вращается и движется во время анимации, фонарик будет вертеться вместе с оружием", "type": "Transform", "value": "" },
	{ "fieldPath": "weapon.scaleAngleScatter", "comment": "Множитель угола для разброса пуль, если ствол оружия длинный, то разброс должен быть меньше", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.damageScale", "comment": "Множитель урона", "type": "float", "value": 0, min: 0.8, max: 3 },
	{ "fieldPath": "weapon.animationClip", "comment": "Анимация оружия", "type": "AnimationClip", "value": "" },
	{ "fieldPath": "weapon.reloadScaleTime", "comment": "Множитель для скорости перезарядки [0.5 - 2]<br>Скорость анимации и время для перезарядки", "type": "float", "value": 0, min: 0.5, max: 2 },
	{ "fieldPath": "weapon.animationSounds", "comment": "Звуки перезарядки. Звуки меняются при вызове события AnimationEvent, чтобы один клип с анимацей на разных оружиях мог запускать разные звуки", "type": "WeaponSoundKeyValue[]", "value": "" },
	{ "fieldPath": "weapon.cameraSnake", "comment": "Дистанция для смещения камеры в одну сторону во время тряски при стрельбе", "type": "Vector3", "value": "(0, 0, 0)" },
	{ "fieldPath": "weapon.cameraShakeTime", "comment": "Длительность тряски (в секундах)", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.cameraSizeScale", "comment": "Размер камеры", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.playerScaleMove", "comment": "Множитель для скорости перемещения у игрока [0-1]", "type": "float", "value": 0, min: 0, max: 1 },
	{ "fieldPath": "weapon.automat", "comment": "Автоматическое оружие", "type": "bool", "value": true },
	{ "fieldPath": "weapon.fireRateInMinute", "comment": "Скорострельность<br>Кол-во выстрелов в минуту", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.chamberSize", "comment": "Кол-во патронов в патроннике внутри оружия", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.Musket.chamberSize", "comment": "Кол-во патронов в патроннике внутри оружия", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.WeaponSilencerMod.bolt", "comment": "Родительский объект для глушителя<br>Глушитель будет размещён в этом объекте", "type": "Transform", "value": "" },
	{ "fieldPath": "weapon.WeaponSilencerMod.smoke", "comment": "Дым от выстрела", "type": "WeaponShotEffect", "value": "" },
	{ "fieldPath": "weapon.WeaponSilencerMod.doublePistol", "comment": "Второй пистолет", "type": "Transform", "value": "" },
	//{ "fieldPath": "storeInfo.silencerPosition", "comment": "Координаты глушителя на иконке оружия в интерфейсе от верхнего угла.", "type": "Vector2", "value": "(0, 0)" },
	{ "fieldPath": "weapon.WeaponHandPoints.clip", "comment": "Базовая анимация для использования в качестве шаблона", "type": "string", "value": "" },
	{ "fieldPath": "weapon.WeaponHandPoints.weaponType", "comment": "Тип анимации<br><br>Список точек для создания анимации перезарядки оружия:", "type": "string", "value": "", "options": ['rifleAK', 'rifleLeftBolt', 'rifleAR15', 'shotgun', 'shotgunBullpupDP12', 'sniper', 'shotgun+magazine', 'shotgun+leftBolt', 'heavyRightBoltRifle', 'machinegun', 'aa12', 'ak12', 'ak74u', 'ak308', 'amb17', 'aug', 'axe', 'barretM107a', 'barrettM99', 'barrettMRAD', 'benelli-m4', 'bow', 'cougarms', 'czbren2', 'czEvo3A1', 'deagle', 'dp12', 'f2000', 'fd12', 'forigin12', 'g36c', 'galilace21', 'gm94', 'grizzly85', 'hk69', 'imbelai2', 'ksg', 'lr300', 'm110', 'm200', 'mossberg590', 'mp5', 'mr27', 'p90', 'pp19bizon', 'pp90m1', 'rem870dm', 'remR11rsass', 'rpk16', 'saiga12', 'scarh', 'scarlcqc', 'scarssr', 'shak12', 'sigmpx', 'six12', 'sr2veresk', 'sr3m', 'srm1212', 'sw686', 'ump45', 'vepr12', 'xtr12'] },
	{ "fieldPath": "weapon.WeaponHandPoints.parentName", "comment": "Куда поместить оружие. Имя дочернего объекта, рядом с которым будет размещено новое оружие. Если оружие имеет свой готовый клип, то следует вручную указать куда поместить оружие", "type": "string", "value": "" },
	{ "fieldPath": "weapon.WeaponHandPoints.weaponClipName", "comment": "Сменить имя объекта для работы анимации, если она была заранее указана в weapon.animationClip", "type": "string", "value": "" },
	{ "fieldPath": "weapon.WeaponHandPoints.buttstockPoint", "comment": "Приклад винтовки.<br>По этим координатам оружие будет прижато к плечам персонажа и таким образом размещаем объект в руках.<br>Локальные координаты относительно точки вращения", "type": "Vector2", "value": "(0, 0)", "spritePreview": "images/handpoint.png", "spritePivotPoint": { x: 0.5, y: 0.5 }, "spritePixelPerUnit": 200, "sortingOrder": 1500, "spriteName": "buttstockPoint" },
	{ "fieldPath": "weapon.WeaponHandPoints.buttstockReload", "comment": "Приклад винтовки при перезарядке", "type": "Vector2", "value": "(0, 0)", "spritePreview": "images/handpoint.png", "spritePivotPoint": { x: 0.5, y: 0.5 }, "spritePixelPerUnit": 200, "sortingOrder": 1500, "spriteName": "buttstockReload" },
	{ "fieldPath": "weapon.WeaponHandPoints.handguardPoint", "comment": "Цевьё. Локальные координаты относительно точки вращения", "type": "Vector2", "value": "(0, 0)", "spritePreview": "images/handpoint.png", "spritePivotPoint": { x: 0.5, y: 0.5 }, "spritePixelPerUnit": 200, "sortingOrder": 1500, "spriteName": "handguardPoint" },
	{ "fieldPath": "weapon.WeaponHandPoints.fingerPoint", "comment": "Сдвинуть оружие от указательного пальца<br>Координаты оружия относительно пальца", "type": "Vector2", "value": "(0, 0)", "spritePreview": "images/fingers.png", "spritePivotPoint": { x: 0.85, y: 0.75 }, "spritePixelPerUnit": 100, "sortingOrder": 100, "spriteName": "fingerRender" },
	{ "fieldPath": "weapon.WeaponHandPoints.fingerAngle", "comment": "Угол наклона для ладони. Если это ружьё, то оно имеет рукоять под наклоном", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.WeaponHandPoints.magazinePoint", "comment": "В каком месте хватать магазин при извлечении<br>Если не указано, взять координаты рендера магазина<br>Локальные координаты относительно точки вращения", "type": "Vector2", "value": "(0, 0)", "spritePreview": "images/handpoint.png", "spritePivotPoint": { x: 0.5, y: 0.5 }, "spritePixelPerUnit": 200, "sortingOrder": 1500, "spriteName": "magazinePoint" },
	{ "fieldPath": "weapon.WeaponHandPoints.magazineInsert", "comment": "Магазин при вставке. Локальные координаты магазина.", "type": "Vector2", "value": "(0, 0)", "spritePreview": "images/handpoint.png", "spritePivotPoint": { x: 0.5, y: 0.5 }, "spritePixelPerUnit": 200, "sortingOrder": 2500, "spriteName": "magazineInsert" },
	{ "fieldPath": "weapon.WeaponHandPoints.magazineInsertAngle", "comment": "Магазин. Угол наклона при вставке", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.WeaponHandPoints.handInsertPoint", "comment": "Координаты левой ладони при вставке магазина. Координаты указывают в каком месте хватать магазин, в какой части корпуса будет находиться рука<br>По умолчанию для левой руки используется точка вращения магазина", "type": "Vector2", "value": "(0, 0)", "spritePreview": "images/handpoint.png", "spritePivotPoint": { x: 0.5, y: 0.5 }, "spritePixelPerUnit": 200, "sortingOrder": 1500, "spriteName": "handInsertPoint" },
	{ "fieldPath": "weapon.WeaponHandPoints.bulletPoint", "comment": "Вставка патрона или другое движение рук<br>Локальные координаты относительно точки вращения", "type": "Vector2", "value": "(0, 0)", "spritePreview": "images/handpoint.png", "spritePivotPoint": { x: 0.5, y: 0.5 }, "spritePixelPerUnit": 200, "sortingOrder": 1500, "spriteName": "bulletPoint" },
	{ "fieldPath": "weapon.WeaponHandPoints.closedCoverPoint", "comment": "Закрытая крышка пулемёта - в каком месте хватать крышку, когда она ещё находится закрытой", "type": "Vector2", "value": "(0, 0)", "spritePreview": "images/handpoint.png", "spritePivotPoint": { x: 0.5, y: 0.5 }, "spritePixelPerUnit": 200, "sortingOrder": 1500, "spriteName": "closedCoverPoint" },
	{ "fieldPath": "weapon.WeaponHandPoints.openCoverPoint", "comment": "Открытая крышка пулемёта - в каком месте хватать крышку, когда она открыта", "type": "Vector2", "value": "(0, 0)", "spritePreview": "images/handpoint.png", "spritePivotPoint": { x: 0.5, y: 0.5 }, "spritePixelPerUnit": 200, "sortingOrder": 1500, "spriteName": "openCoverPoint" },
	{ "fieldPath": "weapon.WeaponHandPoints.boltPoint", "comment": "Затвор для задёргивания<br>Локальные координаты относительно точки вращения", "type": "Vector2", "value": "(0, 0)", "spritePreview": "images/handpoint.png", "spritePivotPoint": { x: 0.5, y: 0.5 }, "spritePixelPerUnit": 200, "sortingOrder": 1500, "spriteName": "boltPoint" },
	{ "fieldPath": "weapon.WeaponHandPoints.boltMovePoint", "comment": "Заднее положение затвора при взведении", "type": "Vector2", "value": "(0, 0)", "spritePreview": "images/handpoint.png", "spritePivotPoint": { x: 0.5, y: 0.5 }, "spritePixelPerUnit": 200, "sortingOrder": 1500, "spriteName": "boltMovePoint" },
	{ "fieldPath": "weapon.WeaponHandPoints.handleMove", "comment": "Затвор при стрельбе", "type": "WeaponAnimationDetail", "value": "" },
	{ "fieldPath": "weapon.WeaponHandPoints.handleMove.move", "comment": "Движение для предпросмотра [0-1]<br>Vector2.Lerp(startPosition, movePosition, move)", "type": "float", "value": 0, "spritePreview": "images/detailmovepoint.png", "spritePivotPoint": { x: 0.5, y: 0.5 }, "spritePixelPerUnit": 250, "sortingOrder": 3000 },
	{ "fieldPath": "weapon.WeaponHandPoints.handleMove.render", "comment": "Рукоятка затвора. Имя объекта для использования в качестве рендера", "type": "SpriteRenderer", "value": "" },
	{ "fieldPath": "weapon.WeaponHandPoints.handleMove.startPosition", "comment": "Рукоятка затвора в готовом положении.<br>Локальные координаты. Z - угол наклона", "type": "Vector3", "value": "(0, 0, 0)", "spritePreview": "images/detailmovepoint.png", "spritePivotPoint": { x: 0.5, y: 0.5 }, "spritePixelPerUnit": 250, "sortingOrder": 3000, "spriteName": "handleMove.startPosition" },
	{ "fieldPath": "weapon.WeaponHandPoints.handleMove.movePosition", "comment": "Рукоятка затвора в крайнем заднем положении.<br>Локальные координаты. Z - угол наклона", "type": "Vector3", "value": "(0, 0, 0)", "spritePreview": "images/detailmovepoint.png", "spritePivotPoint": { x: 0.5, y: 0.5 }, "spritePixelPerUnit": 250, "sortingOrder": 3000, "spriteName": "handleMove.movePosition" },
	{ "fieldPath": "weapon.WeaponHandPoints.handleMove.sprites", "comment": "Покадровая анимация с помощью спрайтов", "type": "Sprite[]", "value": "" },
	{ "fieldPath": "weapon.WeaponHandPoints.coverMove", "comment": "Крышка пулемёта", "type": "WeaponAnimationDetail", "value": "" },
	{ "fieldPath": "weapon.WeaponHandPoints.coverMove.move", "comment": "Движение для предпросмотра [0-1]<br>Vector2.Lerp(startPosition, movePosition, move)", "type": "float", "value": 0, "spritePreview": "images/detailmovepoint.png", "spritePivotPoint": { x: 0.5, y: 0.5 }, "spritePixelPerUnit": 250, "sortingOrder": 3000 },
	{ "fieldPath": "weapon.WeaponHandPoints.coverMove.render", "comment": "Крышка пулемёта. Имя объекта для использования в качестве рендера", "type": "SpriteRenderer", "value": "" },
	{ "fieldPath": "weapon.WeaponHandPoints.coverMove.startPosition", "comment": "Крышка пулемёта<br>Локальные координаты. Z - угол наклона", "type": "Vector3", "value": "(0, 0, 0)", "spritePreview": "images/detailmovepoint.png", "spritePivotPoint": { x: 0.5, y: 0.5 }, "spritePixelPerUnit": 250, "sortingOrder": 3000, "spriteName": "coverMove.startPosition" },
	{ "fieldPath": "weapon.WeaponHandPoints.coverMove.movePosition", "comment": "Крышка пулемёта в открытом состоянии<br>Локальные координаты. Z - угол наклона", "type": "Vector3", "value": "(0, 0, 0)", "spritePreview": "images/detailmovepoint.png", "spritePivotPoint": { x: 0.5, y: 0.5 }, "spritePixelPerUnit": 250, "sortingOrder": 3000, "spriteName": "coverMove.movePosition" },
	{ "fieldPath": "weapon.WeaponHandPoints.coverMove.sprites", "comment": "Покадровая анимация с помощью спрайтов", "type": "Sprite[]", "value": "" },
	{ "fieldPath": "weapon.WeaponHandPoints.boltMove", "comment": "Затворная рама при перезарядке", "type": "WeaponAnimationDetail", "value": "" },
	{ "fieldPath": "weapon.WeaponHandPoints.boltMove.move", "comment": "Движение для предпросмотра [0-1]<br>Vector2.Lerp(startPosition, movePosition, move)", "type": "float", "value": 0, "spritePreview": "images/detailmovepoint.png", "spritePivotPoint": { x: 0.5, y: 0.5 }, "spritePixelPerUnit": 250, "sortingOrder": 3000 },
	{ "fieldPath": "weapon.WeaponHandPoints.boltMove.render", "comment": "Затворная рама. Имя объекта для использования в качестве рендера", "type": "SpriteRenderer", "value": "" },
	{ "fieldPath": "weapon.WeaponHandPoints.boltMove.startPosition", "comment": "Затворная рама.<br>Локальные координаты. Z - угол наклона", "type": "Vector3", "value": "(0, 0, 0)", "spritePreview": "images/detailmovepoint.png", "spritePivotPoint": { x: 0.5, y: 0.5 }, "spritePixelPerUnit": 250, "sortingOrder": 3000, "spriteName": "boltMove.startPosition" },
	{ "fieldPath": "weapon.WeaponHandPoints.boltMove.movePosition", "comment": "Затворная рама в заднем положении.<br>Локальные координаты. Z - угол наклона", "type": "Vector3", "value": "(0, 0, 0)", "spritePreview": "images/detailmovepoint.png", "spritePivotPoint": { x: 0.5, y: 0.5 }, "spritePixelPerUnit": 250, "sortingOrder": 3000, "spriteName": "boltMove.movePosition" },
	{ "fieldPath": "weapon.WeaponHandPoints.boltMove.sprites", "comment": "Покадровая анимация с помощью спрайтов", "type": "Sprite[]", "value": "" },
	{ "fieldPath": "weapon.WeaponHandPoints.boltStop", "comment": "Остановить затвор в заднем положении для пустого оружия<br>Затвор будет возвращён, когда coverMove будет равен 1 в процессе перезарядки", "type": "bool", "value": true },
	{ "fieldPath": "weapon.WeaponHandPoints.clipFrameMove", "comment": "Сдвинуть кадры между двуми событиями. Сдвинуть ключевой кадр, находящийся под вторым событием", "type": "WeaponAnimationRange[]", "value": "" },

	{ "fieldPath": "weapon.magazine.Transform.localPosition", "comment": "Координаты объекта для расположения", "type": "Vector3", "value": "(1.1, 0.2, 0)" },
	{ "fieldPath": "weapon.magazine.Transform.localEulerAngles.z", "comment": "Угол наклона", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.magazine.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "weapon.magazine.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": 100 },
	{ "fieldPath": "weapon.magazine.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.magazine.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", "type": "bool", "value": true },
	{ "fieldPath": "weapon.magazine.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },
	{ "fieldPath": "weapon.AnimationSpriteRenderer.frame", "comment": "Текущий кадр [0-1]", "type": "float", "value": 0, min: 0, max: 1 },
	{ "fieldPath": "weapon.AnimationSpriteRenderer.sprites", "comment": "Покадровая анимация с использованием спрайтов.", "type": "Sprite[]", "value": "" },
	{ "fieldPath": "weapon.magazine.AnimationSpriteRenderer.frame", "comment": "Анимация магазина. Текущий кадр [0-1]", "type": "float", "value": 0, min: 0, max: 1 },
	{ "fieldPath": "weapon.magazine.AnimationSpriteRenderer.sprites", "comment": "Анимация магазина. Покадровая анимация с использованием спрайтов.", "type": "Sprite[]", "value": "" },

	{ "fieldPath": "weapon.cartridge.arrowSample.angleTipSpeed", "comment": "Скорость вращения стрелы внутри тела, когда кончик упирает в землю.<br>Скорость за 1 секунду", "type": "float", "value": "0" },
	{ "fieldPath": "weapon.cartridge.arrowSample.damage", "comment": "Урон один раз в процессе горения", "type": "float", "value": "0" },
	{ "fieldPath": "weapon.cartridge.arrowSample.distLivedEntity", "comment": "Радиус/Дистанция для попадания в живых существ.<br>Если в пределах этого расстояния нет живых, то фиксируем попадние в трупы", "type": "float", "value": "0" },
	{ "fieldPath": "weapon.cartridge.arrowSample.floor", "comment": "Уровень земли, что бы воткнуть стрелу поглубже в тело", "type": "float", "value": "0" },
	{ "fieldPath": "weapon.cartridge.arrowSample.floorWall", "comment": "Радиус/Дистанция для попадания в живых существ.<br>Если в пределах этого расстояния нет живых, то фиксируем попадние в трупы", "type": "PhysicsMaterial2D", "value": "" },
	{ "fieldPath": "weapon.cartridge.arrowSample.objectExplode.AnimatorSprite.animations[0].frames", "comment": "Эффект взрыва. Покадровая анимация с помощью спрайтов.", "type": "Sprite[]", "value": "" },
	{ "fieldPath": "weapon.cartridge.arrowSample.pointFrontTip", "comment": "Кончик стрелы, который будет упираться о землю", "type": "Vector2", "value": "(0, 0)" },
	{ "fieldPath": "weapon.cartridge.arrowSample.pointSpriteCheck", "comment": "Координаты для проверки спрайта. Отбрасываем стрелу, если в спрайте образуется дыра. Локальные координаты у стрелы", "type": "Vector2", "value": "(0, 0)" },
	{ "fieldPath": "weapon.cartridge.arrowSample.pointTip", "comment": "Кончик стрелы, который будет упираться о землю<br>А так же используем для поиска попадания", "type": "Vector2", "value": "(0, 0)" },
	{ "fieldPath": "weapon.cartridge.arrowSample.render.SpriteRenderer.sprite", "comment": "Спрайт со стрелой", "type": "Sprite", suffix: ".SpriteRenderer.sprite", "value": "" },

	{ "fieldPath": "weapon.cartridge.arrowSample.renderMaterialHit", "comment": "Радиус/Дистанция для попадания в живых существ.<br>Если в пределах этого расстояния нет живых, то фиксируем попадние в трупы", "type": "Material", "value": "" },
	{ "fieldPath": "weapon.cartridge.arrowSample.scaleGravity", "comment": "Действие гравитации во время полёта", "type": "float", "value": "0" },
	{ "fieldPath": "weapon.cartridge.arrowSample.scaleImpulse", "comment": "Множитель импульса, когда стрела ударяется об землю при падении тела", "type": "float", "value": "0" },
	{ "fieldPath": "weapon.cartridge.arrowSample.slideExplode", "comment": "Сдвиг объекта назад, относительно точки, в котором прозишло попадние", "type": "Vector2", "value": "(0, 0)" },
	{ "fieldPath": "weapon.cartridge.arrowSample.soundHit", "comment": "Звук взрыва при попадании", "type": "AudioClip", "value": "" },
	{ "fieldPath": "weapon.cartridge.arrowSample.speed", "comment": "Скорость полёта", "type": "float", "value": "0" },
	{ "fieldPath": "weapon.cartridge.arrowSample.speedMoveRotate", "comment": "Дистанция/Скорость для наклона на все 90 градусов", "type": "float", "value": "0" },
	{ "fieldPath": "weapon.cartridge.arrowSample.speedRotateFire", "comment": "Скорость вращения огня для достижения необходимого угла", "type": "float", "value": "0" },
	{ "fieldPath": "weapon.cartridge.arrowSample.spriteHit", "comment": "Показать спрайт при успешном попадании", "type": "Sprite", suffix: ".SpriteRenderer.sprite", "value": "" },
	{ "fieldPath": "weapon.cartridge.arrowSample.timerLive", "comment": "Время жизни снаряда во время полёта. Удалить снаряд, если время закончится - стрела улетела далеко за экран", "type": "float", "value": "0" },
	{ "fieldPath": "weapon.cartridge.arrowSample.timeSnake", "comment": "Тряска камеры. Длительность тряски", "type": "float", "value": "0" },
	{ "fieldPath": "weapon.cartridge.arrowSample.periodSnake", "comment": "Тряска камеры. Количество колебаний", "type": "int", "value": "0" },
	{ "fieldPath": "weapon.cartridge.arrowSample.distanceSnake", "comment": "Тряска камеры. Дистанция тряски в одну сторону", "type": "float", "value": "0" },
	{ "fieldPath": "weapon.cartridge.arrowSample.render", "comment": "Спрайт со стрелой", "type": "SpriteRenderer", "value": "" },
	{ "fieldPath": "weapon.cartridge.arrowSample.materialBody", "comment": "Материал для пробивания", "type": "PhysicsMaterial2D", "value": "" },
	{ "fieldPath": "weapon.cartridge.arrowSample.speed", "comment": "Скорость полёта", "type": "float", "value": "0" },
	{ "fieldPath": "weapon.cartridge.arrowSample.timerLive", "comment": "Время жизни во время полёта. Удалить стрелу, если время закончится - стрела улетела далеко за экран", "type": "float", "value": "0" },
	{ "fieldPath": "weapon.cartridge.arrowSample.scaleGravity", "comment": "Действие гравитации во время полёта", "type": "float", "value": "0" },
	{ "fieldPath": "weapon.cartridge.arrowSample.floor", "comment": "Уровень земли, что бы воткнуть стрелу поглубже в тело", "type": "float", "value": "0" },
	{ "fieldPath": "weapon.cartridge.arrowSample.pointTip", "comment": "Кончик стрелы, который будет упираться о землю<br>А так же используем для поиска попадания", "type": "Vector2", "value": "(0, 0)" },
	{ "fieldPath": "weapon.cartridge.arrowSample.pointFrontTip", "comment": "Кончик стрелы, который будет упираться о землю", "type": "Vector2", "value": "(0, 0)" },
	{ "fieldPath": "weapon.cartridge.arrowSample.pointSpriteCheck", "comment": "Координаты для проверки спрайта. Отбрасываем стрелу, если в спрайте образуется дыра. Локальные координаты у стрелы", "type": "Vector2", "value": "(0, 0)" },
	{ "fieldPath": "weapon.cartridge.arrowSample.angleTipSpeed", "comment": "Скорость вращения стрелы внутри тела, когда кончик упирает в землю.<br>Скорость за 1 секунду", "type": "float", "value": "0" },
	{ "fieldPath": "weapon.cartridge.arrowSample.spriteHit", "comment": "Спрайт/текстура, PNG-файл", "type": "Sprite", suffix: ".SpriteRenderer.sprite", "value": "" },
	{ "fieldPath": "weapon.cartridge.arrowSample.spriteHit.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "weapon.cartridge.arrowSample.spriteHit.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": "100" },
	{ "fieldPath": "weapon.cartridge.arrowSample.scaleImpulse", "comment": "Множитель импульса, когда стрела ударяется об землю при падении тела", "type": "float", "value": "0" },
	{ "fieldPath": "weapon.cartridge.arrowSample.render.Transform.localPosition", "comment": "Координаты объекта для расположения", "type": "Vector3", "value": "(1.1, 0.2, 0)" },
	{ "fieldPath": "weapon.cartridge.arrowSample.render.Transform.localEulerAngles.z", "comment": "Угол наклона", "type": "float", "value": "0" },
	{ "fieldPath": "weapon.cartridge.arrowSample.render.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": "true" },
	{ "fieldPath": "weapon.cartridge.arrowSample.render.SpriteRenderer.sprite", "comment": "Спрайт со стрелой, PNG-файл", "type": "Sprite", suffix: ".SpriteRenderer.sprite", "value": "" },
	{ "fieldPath": "weapon.cartridge.arrowSample.render.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "weapon.cartridge.arrowSample.render.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": "100" },
	{ "fieldPath": "weapon.cartridge.arrowSample.render.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", "type": "int", "value": "0" },
	{ "fieldPath": "weapon.cartridge.arrowSample.render.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", "type": "bool", "value": "true" },

	{ "fieldPath": "weapon.addedGameObjects", "comment": "Список добавленных объектов", "type": "string", "value": "" },
	{ "fieldPath": "weapon.addedComponents", "comment": "Список добавленных компонентов MonoBehaviour", "type": "string", "value": "" }, //в формате "child.SpriteRenderer, otherChild.Collider2D"
	{ "fieldPath": "weapon.removedGameObjects", "comment": "Список объектов для удаления", "type": "string", "value": "" },
	{ "fieldPath": "weapon.removedComponents", "comment": "Список компонентов MonoBehaviour для удаления", "type": "string", "value": "" },



	{ "fieldPath": "weapon.player.Transform.localPosition", "comment": "Координаты объекта для расположения", "type": "Vector3", "value": "(1.1, 0.2, 0)" },
	{ "fieldPath": "weapon.player.Transform.localEulerAngles.z", "comment": "Угол наклона", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.player.SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", "type": "Sprite", suffix: ".SpriteRenderer.sprite", "value": "" },
	{ "fieldPath": "weapon.player.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "weapon.player.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": 100 },
	{ "fieldPath": "weapon.player.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.player.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", "type": "bool", "value": true },
	{ "fieldPath": "weapon.player.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },

	{ "fieldPath": "weapon.player.man.Transform.localPosition", "comment": "Координаты объекта для расположения", "type": "Vector3", "value": "(1.1, 0.2, 0)" },
	{ "fieldPath": "weapon.player.man.Transform.localEulerAngles.z", "comment": "Угол наклона", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.player.man.SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", "type": "Sprite", suffix: ".SpriteRenderer.sprite", "value": "" },
	{ "fieldPath": "weapon.player.man.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "weapon.player.man.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": 100 },
	{ "fieldPath": "weapon.player.man.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.player.man.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", "type": "bool", "value": true },
	{ "fieldPath": "weapon.player.man.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },


	{ "fieldPath": "weapon.player.man.body.Transform.localPosition", "comment": "Координаты объекта для расположения", "type": "Vector3", "value": "(1.1, 0.2, 0)" },
	{ "fieldPath": "weapon.player.man.body.Transform.localEulerAngles.z", "comment": "Угол наклона", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.player.man.body.SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", "type": "Sprite", suffix: ".SpriteRenderer.sprite", "value": "" },
	{ "fieldPath": "weapon.player.man.body.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "weapon.player.man.body.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": 100 },
	{ "fieldPath": "weapon.player.man.body.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.player.man.body.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", "type": "bool", "value": true },
	{ "fieldPath": "weapon.player.man.body.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },

	{ "fieldPath": "weapon.player.man.body.head.Transform.localPosition", "comment": "Координаты объекта для расположения", "type": "Vector3", "value": "(1.1, 0.2, 0)" },
	{ "fieldPath": "weapon.player.man.body.head.Transform.localEulerAngles.z", "comment": "Угол наклона", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.player.man.body.head.SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", "type": "Sprite", suffix: ".SpriteRenderer.sprite", "value": "" },
	{ "fieldPath": "weapon.player.man.body.head.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "weapon.player.man.body.head.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": 100 },
	{ "fieldPath": "weapon.player.man.body.head.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.player.man.body.head.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", "type": "bool", "value": true },
	{ "fieldPath": "weapon.player.man.body.head.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },

	{ "fieldPath": "weapon.player.man.body.weaponParent.Transform.localPosition", "comment": "Координаты объекта для расположения", "type": "Vector3", "value": "(1.1, 0.2, 0)" },
	{ "fieldPath": "weapon.player.man.body.weaponParent.Transform.localEulerAngles.z", "comment": "Угол наклона", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.player.man.body.weaponParent.SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", "type": "Sprite", suffix: ".SpriteRenderer.sprite", "value": "" },
	{ "fieldPath": "weapon.player.man.body.weaponParent.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "weapon.player.man.body.weaponParent.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": 100 },
	{ "fieldPath": "weapon.player.man.body.weaponParent.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.player.man.body.weaponParent.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", "type": "bool", "value": true },
	{ "fieldPath": "weapon.player.man.body.weaponParent.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },


	{ "fieldPath": "weapon.player.man.body.weaponParent.arm.Transform.localPosition", "comment": "Координаты объекта для расположения", "type": "Vector3", "value": "(1.1, 0.2, 0)" },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm.Transform.localEulerAngles.z", "comment": "Угол наклона", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm.SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", "type": "Sprite", suffix: ".SpriteRenderer.sprite", "value": "" },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": 100 },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", "type": "bool", "value": true },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },

	{ "fieldPath": "weapon.player.man.body.weaponParent.arm.forearm.Transform.localPosition", "comment": "Координаты объекта для расположения", "type": "Vector3", "value": "(1.1, 0.2, 0)" },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm.forearm.Transform.localEulerAngles.z", "comment": "Угол наклона", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm.forearm.SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", "type": "Sprite", suffix: ".SpriteRenderer.sprite", "value": "" },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm.forearm.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm.forearm.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": 100 },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm.forearm.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm.forearm.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", "type": "bool", "value": true },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm.forearm.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },

	{ "fieldPath": "weapon.player.man.body.weaponParent.arm.forearm.fingers.Transform.localPosition", "comment": "Координаты объекта для расположения", "type": "Vector3", "value": "(1.1, 0.2, 0)" },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm.forearm.fingers.Transform.localEulerAngles.z", "comment": "Угол наклона", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm.forearm.fingers.SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", "type": "Sprite", suffix: ".SpriteRenderer.sprite", "value": "" },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm.forearm.fingers.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm.forearm.fingers.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": 100 },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm.forearm.fingers.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm.forearm.fingers.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", "type": "bool", "value": true },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm.forearm.fingers.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },

	{ "fieldPath": "weapon.player.man.body.weaponParent.arm.forearm.fingers.render.Transform.localPosition", "comment": "Координаты объекта для расположения", "type": "Vector3", "value": "(1.1, 0.2, 0)" },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm.forearm.fingers.render.Transform.localEulerAngles.z", "comment": "Угол наклона", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm.forearm.fingers.render.SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", "type": "Sprite", suffix: ".SpriteRenderer.sprite", "value": "" },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm.forearm.fingers.render.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm.forearm.fingers.render.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": 100 },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm.forearm.fingers.render.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm.forearm.fingers.render.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", "type": "bool", "value": true },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm.forearm.fingers.render.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },

	{ "fieldPath": "weapon.player.man.body.weaponParent.arm2.Transform.localPosition", "comment": "Координаты объекта для расположения", "type": "Vector3", "value": "(1.1, 0.2, 0)" },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm2.Transform.localEulerAngles.z", "comment": "Угол наклона", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm2.SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", "type": "Sprite", suffix: ".SpriteRenderer.sprite", "value": "" },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm2.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm2.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": 100 },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm2.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm2.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", "type": "bool", "value": true },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm2.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },

	{ "fieldPath": "weapon.player.man.body.weaponParent.arm2.forearm2.Transform.localPosition", "comment": "Координаты объекта для расположения", "type": "Vector3", "value": "(1.1, 0.2, 0)" },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm2.forearm2.Transform.localEulerAngles.z", "comment": "Угол наклона", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm2.forearm2.SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", "type": "Sprite", suffix: ".SpriteRenderer.sprite", "value": "" },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm2.forearm2.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm2.forearm2.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": 100 },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm2.forearm2.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm2.forearm2.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", "type": "bool", "value": true },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm2.forearm2.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },

	{ "fieldPath": "weapon.player.man.body.weaponParent.arm2.forearm2.fingers2.Transform.localPosition", "comment": "Координаты объекта для расположения", "type": "Vector3", "value": "(1.1, 0.2, 0)" },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm2.forearm2.fingers2.Transform.localEulerAngles.z", "comment": "Угол наклона", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm2.forearm2.fingers2.SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", "type": "Sprite", suffix: ".SpriteRenderer.sprite", "value": "" },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm2.forearm2.fingers2.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm2.forearm2.fingers2.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": 100 },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm2.forearm2.fingers2.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm2.forearm2.fingers2.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", "type": "bool", "value": true },
	{ "fieldPath": "weapon.player.man.body.weaponParent.arm2.forearm2.fingers2.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },

	{ "fieldPath": "weapon.player.man.thigh.Transform.localPosition", "comment": "Координаты объекта для расположения", "type": "Vector3", "value": "(1.1, 0.2, 0)" },
	{ "fieldPath": "weapon.player.man.thigh.Transform.localEulerAngles.z", "comment": "Угол наклона", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.player.man.thigh.SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", "type": "Sprite", suffix: ".SpriteRenderer.sprite", "value": "" },
	{ "fieldPath": "weapon.player.man.thigh.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "weapon.player.man.thigh.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": 100 },
	{ "fieldPath": "weapon.player.man.thigh.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.player.man.thigh.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", "type": "bool", "value": true },
	{ "fieldPath": "weapon.player.man.thigh.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },

	{ "fieldPath": "weapon.player.man.thigh2.Transform.localPosition", "comment": "Координаты объекта для расположения", "type": "Vector3", "value": "(1.1, 0.2, 0)" },
	{ "fieldPath": "weapon.player.man.thigh2.Transform.localEulerAngles.z", "comment": "Угол наклона", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.player.man.thigh2.SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", "type": "Sprite", suffix: ".SpriteRenderer.sprite", "value": "" },
	{ "fieldPath": "weapon.player.man.thigh2.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "weapon.player.man.thigh2.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": 100 },
	{ "fieldPath": "weapon.player.man.thigh2.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.player.man.thigh2.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", "type": "bool", "value": true },
	{ "fieldPath": "weapon.player.man.thigh2.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },

	{ "fieldPath": "weapon.player.man.thigh.shin.Transform.localPosition", "comment": "Координаты объекта для расположения", "type": "Vector3", "value": "(1.1, 0.2, 0)" },
	{ "fieldPath": "weapon.player.man.thigh.shin.Transform.localEulerAngles.z", "comment": "Угол наклона", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.player.man.thigh.shin.SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", "type": "Sprite", suffix: ".SpriteRenderer.sprite", "value": "" },
	{ "fieldPath": "weapon.player.man.thigh.shin.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "weapon.player.man.thigh.shin.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": 100 },
	{ "fieldPath": "weapon.player.man.thigh.shin.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.player.man.thigh.shin.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", "type": "bool", "value": true },
	{ "fieldPath": "weapon.player.man.thigh.shin.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },

	{ "fieldPath": "weapon.player.man.thigh2.shin2.Transform.localPosition", "comment": "Координаты объекта для расположения", "type": "Vector3", "value": "(1.1, 0.2, 0)" },
	{ "fieldPath": "weapon.player.man.thigh2.shin2.Transform.localEulerAngles.z", "comment": "Угол наклона", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.player.man.thigh2.shin2.SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", "type": "Sprite", suffix: ".SpriteRenderer.sprite", "value": "" },
	{ "fieldPath": "weapon.player.man.thigh2.shin2.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "weapon.player.man.thigh2.shin2.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": 100 },
	{ "fieldPath": "weapon.player.man.thigh2.shin2.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.player.man.thigh2.shin2.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", "type": "bool", "value": true },
	{ "fieldPath": "weapon.player.man.thigh2.shin2.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },

	{ "fieldPath": "weapon.player.man.thigh.shin.foot.Transform.localPosition", "comment": "Координаты объекта для расположения", "type": "Vector3", "value": "(1.1, 0.2, 0)" },
	{ "fieldPath": "weapon.player.man.thigh.shin.foot.Transform.localEulerAngles.z", "comment": "Угол наклона", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.player.man.thigh.shin.foot.SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", "type": "Sprite", suffix: ".SpriteRenderer.sprite", "value": "" },
	{ "fieldPath": "weapon.player.man.thigh.shin.foot.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "weapon.player.man.thigh.shin.foot.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": 100 },
	{ "fieldPath": "weapon.player.man.thigh.shin.foot.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.player.man.thigh.shin.foot.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", "type": "bool", "value": true },
	{ "fieldPath": "weapon.player.man.thigh.shin.foot.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },

	{ "fieldPath": "weapon.player.man.thigh2.shin2.foot2.Transform.localPosition", "comment": "Координаты объекта для расположения", "type": "Vector3", "value": "(1.1, 0.2, 0)" },
	{ "fieldPath": "weapon.player.man.thigh2.shin2.foot2.Transform.localEulerAngles.z", "comment": "Угол наклона", "type": "float", "value": 0 },
	{ "fieldPath": "weapon.player.man.thigh2.shin2.foot2.SpriteRenderer.sprite", "comment": "Спрайт/текстура, PNG-файл", "type": "Sprite", suffix: ".SpriteRenderer.sprite", "value": "" },
	{ "fieldPath": "weapon.player.man.thigh2.shin2.foot2.SpriteRenderer.sprite.pivotPoint", "comment": "Точка вращения для спрайта", "type": "Vector2", "value": "(0.5, 0.5)" },
	{ "fieldPath": "weapon.player.man.thigh2.shin2.foot2.SpriteRenderer.sprite.pixelPerUnit", "comment": "Плотность пикселей", "type": "float", "value": 100 },
	{ "fieldPath": "weapon.player.man.thigh2.shin2.foot2.SpriteRenderer.sortingOrder", "comment": "Порядок прорисовки для рендера", "type": "int", "value": 0 },
	{ "fieldPath": "weapon.player.man.thigh2.shin2.foot2.SpriteRenderer.enabled", "comment": "Показать/скрыть спрайт при рендеринге", "type": "bool", "value": true },
	{ "fieldPath": "weapon.player.man.thigh2.shin2.foot2.gameObject.SetActive", "comment": "Показать/скрыть объект вместе с дочерними спрайтами<br>object.gameObject.SetActive(false/true)", "type": "bool", "value": true },



];





for (let i = 0; i < window.sourceTextIds.length; i++) { // Перебираем все ключи из sourceText
	console.log(window.sourceTextIds[i]);
}