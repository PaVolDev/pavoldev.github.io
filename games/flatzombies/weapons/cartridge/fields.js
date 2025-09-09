// fields.js
var fields = [
	{
		field: "id",
		comment: "Идентификатор патрона, чтобы отличать его от всех остальных",
		type: "string",
		value: "5.45x39A"
	},
	{
		field: "caliberName",
		comment: "Название калибра. Разные типы патрона одного калибра должны иметь одинаковое название",
		type: "string",
		value: "5.45x39"
	},
	{
		field: "iconButtonSprite",
		comment: "Иконка оружия для кнопки в интерфейсе",
		type: "Sprite",
		value: ""
	},
	{
		field: "iconListSprite",
		comment: "Иконка оружия для отображения в списке с магазином из автоматической винтовки",
		type: "Sprite",
		value: ""
	},
	{
		field: "shellSkin",
		comment: "Текстура для гильзы",
		type: "Sprite",
		value: ""
	},
	
	
	{
		type: "space",
		height: 10
	},
	{
		field: "bullets",
		comment: "Кол-во пуль при одном выстреле",
		type: "int",
		value: 1
	},
	{
		field: "damage",
		comment: "Наносимый общий урон\nБудет распределен между всеми пулями",
		type: "float",
		value: 1.0
	},
	{
		field: "angleRandom",
		comment: "Максимальное отклонение пули в градусах, для создания разброса",
		type: "float",
		value: 0.0,
		range: [0, 180]
	},
	{
		field: "angleSpread",
		comment: "Равномерное распределение пуль",
		type: "float",
		value: 0.0,
		range: [0, 1]
	},
	{
		field: "stopPower",
		comment: "Останавливающий эффект\nСущество само решает как реагировать на этот параметр",
		type: "float",
		value: 0.2,
		range: [0, 1]
	},
	{
		field: "noiseVolume",
		comment: "Громкость шума/выстрела",
		type: "float",
		value: 1.0
	},
	{
		field: "impulse",
		comment: "Импульс ForceMode2D.Impulse\nБудет распределен между всеми пулями",
		type: "float",
		value: 5.0
	},
	{
		field: "velocityMax",
		comment: "Ограничение скорости тела после импульса, чтобы тело не улетало далеко",
		type: "float",
		value: 15
	},
	{
		field: "angularMax",
		comment: "Ограничение скорости вращения тела после импульса, чтобы тело не улетало далеко",
		type: "float",
		value: 2000.0
	},
	{
		field: "distance",
		comment: "Дистанция луча",
		type: "float",
		value: 24
	},
	{
		field: "penetration",
		comment: "Параметры проникновения для одной пули",
		type: "struct",
		struct: "HitsBullet",
		value: {
			modeHit: "FIRST",
			minHits: 1,
			maxHits: 1,
			minDist: 0,
			maxDist: 0,
			findExitPoint: false
		},
		nested: [
			{
				field: "modeHit",
				comment: "• FIRST - Фиксировать все попадания пули, начиная с первого;\n• RANDOM_ONCE - выбрать только одно попадание в диапазоне [minDist - maxDist], например для взрыва;\n• RANDOM_FIRST - случайно выбрать первое попадание, а затем фиксировать все остальные проникающие попадания в триггеры с одинаковым материалом в диапазоне [minDist - maxDist], это подходит для мощных снайперских патронов;",
				type: "enum",
				options: ["FIRST", "RANDOM_ONCE", "RANDOM_FIRST"],
				value: "FIRST"
			},
			{
				field: "minHits",
				comment: "Сколько минимум попаданий фиксировать для одной пули",
				type: "int",
				value: 1
			},
			{
				field: "maxHits",
				comment: "Сколько максимум попаданий фиксировать для одной пули",
				type: "int",
				value: 1
			},
			{
				field: "minDist",
				comment: "Расстояние, на котором фиксировать второе попадание",
				type: "float",
				value: 0
			},
			{
				field: "maxDist",
				comment: "Расстояние, после которого больше не фиксировать другие попадания",
				type: "float",
				value: 0
			},
			{
				field: "findExitPoint",
				comment: "Для каждого попадания вычислить точку выхода пули из тела после сквозного проникновения",
				type: "bool",
				value: false
			}
		]
	},
	{
		field: "penetrationDamage",
		comment: "Изменение урона после прохождения пули сквозь тела при попадании в разные материалы.\n• scaleFirst - умножить урон для пули при попадании в материал\n• scaleThrough - ещё раз умножить урон для следующего попадания, если maxHits >= 2 (когда пуля имеет возможность пробивать несколько тел)\n• stopBulletDamage - остановить пулю, если урон стал слишком низким после прохождения несольких тел",
		type: "array",
		itemType: "struct",
		struct: "PhysicsMaterialMultiply",
		items: [],
		itemTemplate: [
			{
				field: "material",
				comment: "Материал физ. фигуры",
				type: "enum",
				options: ["skin", "armor", "metal"],
				value: "skin"
			},
			{
				field: "scaleFirst",
				comment: "Множитель для снижения урона",
				type: "float",
				value: 1.0
			},
			{
				field: "scaleThrough",
				comment: "Множитель для снижения урона",
				type: "float",
				value: 1.0
			},
			{
				field: "stopBulletDamage",
				comment: "Остановить пулю, если сила удара пули (first × through × first) < stopBulletDamage",
				type: "float",
				value: 0.0
			}
		]
	},
	{
		field: "skillObjectTags",
		comment: "Способности/метки у оружия\nНапример патроны с повышенной пробиваемостью могут быть сгруппированы в одну категорию для запуска особых эффектов крови",
		type: "array",
		itemType: "string",
		items: []
	},
	{
		field: "hitEffects",
		comment: "Эффекты при попадании",
		type: "string",
		value: null
	}
];