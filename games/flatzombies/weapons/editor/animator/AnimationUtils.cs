using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using EditorAttributes;
using UnityEngine;
using UnityEditor;
using UnityEngine.AddressableAssets;

namespace FlatZombies {
	//Инструменты для работы с анимациями 
	public class AnimationUtils {

	
		//Оптимизация анимации
		//Функция удалит лишние ключевые кадры, которые не влияют на форму кривой, что может быть полезно для оптимизации анимаций в Unity.
		public static void OptimizeCurve(ref AnimationCurve curve) {
			if (curve == null || curve.length <= 2) return;
			Keyframe[] keys = curve.keys;
			var optimizedKeys = new System.Collections.Generic.List<Keyframe>();
			optimizedKeys.Add(keys[0]);// Добавляем первый ключевой кадр
			for (int i = 1; i < keys.Length - 1; i++) {// Проверяем, отличается ли значение текущего ключевого кадра от предыдущего и следующего
				if (!Mathf.Approximately(keys[i].value, keys[i - 1].value) || !Mathf.Approximately(keys[i].value, keys[i + 1].value)) {
					optimizedKeys.Add(keys[i]);
				}
			}
			optimizedKeys.Add(keys[keys.Length - 1]);// Добавляем последний ключевой кадр
			curve = new AnimationCurve(optimizedKeys.ToArray());// Создаем новую кривую с оптимизированными ключевыми кадрами
		}



		//Выпрямить кривые //LinearCurve
		public static AnimationCurve LinearCurve(AnimationCurve curve) {
			Keyframe[] keys = curve.keys;
			Keyframe keyframe;
			for (int a = 1; a < keys.Length - 1; a++) { //Первый и последний кадр остаются плавными
				keyframe = keys[a];
				keyframe.weightedMode = WeightedMode.Both;
				keyframe.inWeight = 1f;
				keyframe.outWeight = 1f;
				keyframe.inTangent = (keys[a].value - keys[a - 1].value) / (keys[a].time - keys[a - 1].time);
				keyframe.outTangent = (keys[a].value - keys[a + 1].value) / (keys[a].time - keys[a + 1].time);
				keys[a] = keyframe; //property.curve.MoveKey(a, keyframe); //, keyframe.inTangent, keyframe.outTangent, keyframe.inWeight, keyframe.outWeight
			}
			curve.keys = keys;
			// for (int d = 0; d < curve.keys.Length; d++) {
			// 	AnimationUtility.SetKeyLeftTangentMode(curve, d, AnimationUtility.TangentMode.Linear);
			// 	AnimationUtility.SetKeyRightTangentMode(curve, d, AnimationUtility.TangentMode.Linear);
			// }
			return curve;
		}







#if UNITY_EDITOR
		//Оптимизация анимации
		//Функция удалит лишние ключевые кадры, которые не влияют на форму кривой, что может быть полезно для оптимизации анимаций в Unity.
		public static void OptimizeClip(AnimationClip clip, string[] objectNameToOptimize) {
			if (clip == null) { Debug.LogWarning("OptimizeAnimationClip: AnimationClip is null"); return; }
			EditorCurveBinding[] bindings = AnimationUtility.GetCurveBindings(clip); // Получаем все кривые из AnimationClip
			foreach (var binding in bindings) {
				string objectName = binding.path.Split('/').Last<string>();
				if (Array.Exists(objectNameToOptimize, item => item == objectName || item == binding.propertyName) == false) continue;
				//Debug.Log("OptimizeClip: "+clip.name+":"+ objectName+"%"+ binding.propertyName);
				AnimationCurve curve = AnimationUtility.GetEditorCurve(clip, binding);
				if (curve == null || curve.length <= 2) continue;
				Keyframe[] optimizedKeyframes = new Keyframe[curve.length]; // Создаем новый список ключевых кадров
				int optimizedIndex = 0;
				optimizedKeyframes[optimizedIndex++] = curve[0]; // Добавляем первый ключевой кадр
				for (int i = 1; i < curve.length - 1; i++) {
					// Проверяем, является ли текущий ключевой кадр лишним
					if (!Mathf.Approximately(curve[i].value, curve[i - 1].value) || !Mathf.Approximately(curve[i].value, curve[i + 1].value)) {
						optimizedKeyframes[optimizedIndex++] = curve[i];
					}
				}
				optimizedKeyframes[optimizedIndex++] = curve[curve.length - 1]; // Добавляем последний ключевой кадр
				AnimationCurve optimizedCurve = new AnimationCurve(); // Создаем новую кривую с оптимизированными ключевыми кадрами
				for (int i = 0; i < optimizedIndex; i++) {
					optimizedCurve.AddKey(optimizedKeyframes[i]);
				}
				AnimationUtility.SetEditorCurve(clip, binding, optimizedCurve); // Применяем оптимизированную кривую обратно к AnimationClip
			}
		}


		/// <summary>
		/// Импортирует данные из JSON-строки в существующий анимационный клип.
		/// </summary>
		/// <param name="json">Строка JSON с данными анимации.</param>
		/// <param name="clip">Существующий анимационный клип для импорта данных.</param>
		public static void ImportFromJSON(string json, AnimationClip clip) {
			if (clip == null) { Debug.LogWarning("clip == NULL"); return; }
			json = json.Replace("\"Infinity\"", "Infinity");
			AnimationClipData clipData = JsonUtility.FromJson<AnimationClipData>(json); //Десериализуем JSON-строку в объект данных клипа
			if (clipData == null || clipData.curves == null) {
				Debug.LogError("Invalid or empty JSON data.");
				return;
			}
			AnimationUtility.SetEditorCurves(clip, new EditorCurveBinding[0], new AnimationCurve[0]); //Очищаем клип от всех предыдущих кривых
			AnimationUtility.SetAnimationEvents(clip, new AnimationEvent[0]); //Очищаем события анимации
			///Проходим по всем данным кривых из JSON
			foreach (var curveBindingData in clipData.curves) {
				// Проверяем, что все необходимые данные присутствуют
				if (string.IsNullOrEmpty(curveBindingData.propertyName) ||
					string.IsNullOrEmpty(curveBindingData.path) ||
					string.IsNullOrEmpty(curveBindingData.type)) {
					Debug.LogError($"Invalid curve binding data: propertyName={curveBindingData.propertyName}, path={curveBindingData.path}, type={curveBindingData.type}");
					continue;
				}
				System.Type type = System.Type.GetType(curveBindingData.type); //Преобразуем строку типа обратно в System.Type
				if (type == null) {
					Debug.LogError($"Failed to resolve type from string: {curveBindingData.type}");
					continue;
				}
				// Создаем новую привязку
				EditorCurveBinding binding = new EditorCurveBinding {
					propertyName = curveBindingData.propertyName,
					path = curveBindingData.path,
					type = type
				};
				AnimationCurve curve = new AnimationCurve(); //Создаем новую кривую
				foreach (var keyData in curveBindingData.keys) {
					if (keyData == null) {
						Debug.LogError("Invalid key data found in curve.");
						continue;
					}
					curve.AddKey(new Keyframe {
						time = keyData.time,
						value = keyData.value,
						inTangent = keyData.inTangent,
						outTangent = keyData.outTangent
					});
				}
				AnimationUtility.SetEditorCurve(clip, binding, curve); //Применяем кривую к клипу через SetEditorCurve
			}
			// Импорт событий анимации
			if (clipData.events != null) {
				var events = new List<AnimationEvent>();
				foreach (var eventData in clipData.events) {
					AnimationEvent animationEvent = new AnimationEvent {
						time = eventData.time,
						functionName = eventData.functionName,
						stringParameter = eventData.stringParameter,
						floatParameter = eventData.floatParameter,
						intParameter = eventData.intParameter
					};
					// Загружаем ссылку на объект, если она указана
					if (!string.IsNullOrEmpty(eventData.objectReferenceParameter)) {
						animationEvent.objectReferenceParameter = AssetDatabase.LoadAssetAtPath<UnityEngine.Object>(eventData.objectReferenceParameter);
					}
					events.Add(animationEvent);
				}
				AnimationUtility.SetAnimationEvents(clip, events.ToArray()); //Применяем события к клипу
			}
			EditorUtility.SetDirty(clip); //Помечаем клип как измененный и сохраняем изменения
			AssetDatabase.SaveAssets();
		}


		///<summary>
		///Экспортирует анимационный клип в формат JSON.
		///</summary>
		///<param name="clip">Анимационный клип для экспорта.</param>
		///<returns>Строка JSON с данными анимационного клипа.</returns>
		public static string ExportToJson(AnimationClip clip) {
			var curvesData = new List<CurveBindingData>(); //Создаем список для хранения данных всех кривых анимации
			EditorCurveBinding[] bindings = AnimationUtility.GetCurveBindings(clip); //Получаем все привязки кривых редактора для данного клипа
																					 // Проходим по каждой привязке и извлекаем соответствующую кривую
			foreach (var binding in bindings) {
				AnimationCurve curve = AnimationUtility.GetEditorCurve(clip, binding); //Получаем кривую анимации для текущей привязки
																					   //OptimizeCurve(ref curve); //Оптимизация //Убрать лишние ключевые кадры
				var curveKeyData = new List<CurveData>(); //Создаем список для хранения данных ключей кривой
				///Проходим по всем ключам кривой и сохраняем их данные
				foreach (var key in curve.keys) {
					curveKeyData.Add(new CurveData {
						time = key.time,
						value = key.value,
						inTangent = key.inTangent,
						outTangent = key.outTangent
					});
				}

				// Сохраняем данные привязки и кривой
				curvesData.Add(new CurveBindingData {
					propertyName = binding.propertyName,
					path = binding.path,
					type = binding.type.AssemblyQualifiedName, // Полное имя типа с указанием сборки
					keys = curveKeyData
				});
			}

			AnimationEvent[] events = AnimationUtility.GetAnimationEvents(clip); //Экспорт событий анимации
			var eventsData = new List<AnimationEventData>();
			foreach (var animationEvent in events) {
				eventsData.Add(new AnimationEventData {
					time = animationEvent.time,
					functionName = animationEvent.functionName,
					stringParameter = animationEvent.stringParameter,
					floatParameter = animationEvent.floatParameter,
					intParameter = animationEvent.intParameter,
					objectReferenceParameter = animationEvent.objectReferenceParameter != null ? AssetDatabase.GetAssetPath(animationEvent.objectReferenceParameter) : null
				});
			}

			// Преобразуем данные в JSON-строку
			string json = JsonUtility.ToJson(new AnimationClipData {
				clipName = clip.name,
				length = clip.length,
				frameRate = clip.frameRate,
				curves = curvesData,
				events = eventsData
			}, true);
			json = json.Replace("Infinity", "\"Infinity\"");
			return json;
		}
#endif


		//AnimationClip.SetCurve в рантайме игнорирует все типы и свойства, не входящие в список поддерживаемых Unity (в основном — Transform, Renderer, Light и несколько других). Это ограничение движка, а не вашего кода.
		/*
		Если вы попытаетесь анимировать кастомный компонент:
		- Кривая будет добавлена в AnimationClip.
		- Но при воспроизведении значение не обновится.
		- Ошибки не будет — просто "тихий провал".
		*/
		public static AnimationClipInfo GetFromJSON(string json, string cacheId = "") {
			if (cache.ContainsKey(cacheId)) return cache[cacheId];
			json = json.Replace("\"Infinity\"", "Infinity");
			var clipData = JsonUtility.FromJson<AnimationClipData>(json);
			if (clipData == null) return null;
			var clip = new AnimationClip {
				name = clipData.clipName,
				frameRate = clipData.frameRate,
				legacy = true // важно для рантайма
			};
			var clipInfo = new AnimationClipInfo(clip);

			foreach (var curveBinding in clipData.curves) {
				// Пытаемся загрузить тип из AssemblyQualifiedName
				System.Type runtimeType = System.Type.GetType(curveBinding.type);
				if (runtimeType == null) {
					Debug.LogWarning($"Не удалось загрузить тип из строки: {curveBinding.type}");
					continue;
				}
				var keys = new Keyframe[curveBinding.keys.Count];
				for (int i = 0; i < curveBinding.keys.Count; i++) {
					var kd = curveBinding.keys[i];
					keys[i] = new Keyframe(kd.time, kd.value, kd.inTangent, kd.outTangent);
				}
				var curve = new AnimationCurve(keys);
				// Применяем кривую — Unity сам решит, поддерживается ли тип/свойство в рантайме
				clip.SetCurve(curveBinding.path, runtimeType, curveBinding.propertyName, curve);
				clipInfo.AddPropertyInfo(curveBinding, curve);
			}

			// Обработка событий
			var events = new List<AnimationEvent>();
			foreach (var eventData in clipData.events) {
				var animEvent = new AnimationEvent {
					time = eventData.time,
					functionName = eventData.functionName,
					stringParameter = eventData.stringParameter,
					floatParameter = eventData.floatParameter,
					intParameter = eventData.intParameter
				};
				// Загрузка objectReferenceParameter через Addressables (в рантайме)
				string assetName = eventData.objectReferenceParameter;
				if (!string.IsNullOrEmpty(assetName)) {
					try {
						animEvent.objectReferenceParameter = LoadByPartialName(assetName, animEvent.objectReferenceParameter);
					} catch (System.Exception ex) {
						Debug.LogError($"Ошибка загрузки Addressables({assetName}):\n {ex.Message}");
					}
				}
				events.Add(animEvent);
			}
			clip.events = events.ToArray();
			clipInfo.UpdateKeyframes(clip.events);
			return clipInfo;
		}

		public static Dictionary<string, AnimationClipInfo> cache = new();
		//Поиск через ResourceLocators (для адресов)
		public static UnityEngine.Object LoadByPartialName(string partialName, UnityEngine.Object defaltValue) {
			Addressables.InitializeAsync().WaitForCompletion();// 1. Обязательная инициализация (если не сделана ранее)
			var assetList = Addressables.ResourceLocators.SelectMany(locator => locator.Keys).OfType<string>().ToList();
			assetList.ForEach(key => key = Path.GetFileNameWithoutExtension(key));
			var searchFileName = Path.GetFileNameWithoutExtension(partialName);
			var fullKey = assetList.FirstOrDefault(assetName => searchFileName == assetName); // 2. Поиск ключа в локаторах (это происходит в памяти, мгновенно)
			if (string.IsNullOrEmpty(fullKey)) fullKey = assetList.FirstOrDefault(assetName => assetName.Contains(searchFileName));
			if (string.IsNullOrEmpty(fullKey)) return defaltValue;
			if (Addressables.LoadResourceLocationsAsync(fullKey).WaitForCompletion().Count > 0) { //Проверка существования
				var assets = Addressables.LoadAssetsAsync<UnityEngine.Object>(fullKey).WaitForCompletion(); // 3. Синхронная загрузка ассета
				return assets[0];
			} else {
				Debug.LogWarning($"Addressables: не удалось найти объект по ключу '{fullKey}'\n");
				return defaltValue;
			}
		}
	}



	// Вспомогательные классы для сериализации данных
	[System.Serializable]
	public class AnimationEventData {
		public float time;                      // Время события
		public string functionName;             // Имя функции
		public string stringParameter;          // Строковый параметр
		public float floatParameter;            // Числовой параметр
		public int intParameter;                // Целочисленный параметр
		public string objectReferenceParameter; // Путь к объекту в ассетах
	}

	[System.Serializable]
	public class AnimationClipData {
		public string clipName;                   // Имя клипа
		public float length;                      // Длина клипа
		public float frameRate;                   // Частота кадров
		public List<CurveBindingData> curves;     // Данные всех кривых
		public List<AnimationEventData> events;   // Данные всех событий
	}

	/// <summary>
	/// Класс для хранения данных одного ключа кривой.
	/// </summary>
	[System.Serializable]
	public class CurveData {
		public float time;       // Время ключа
		public float value;      // Значение ключа
		public float inTangent;  // Входной тангенс
		public float outTangent; // Выходной тангенс
	}

	/// <summary>
	/// Класс для хранения данных одной привязки кривой.
	/// </summary>
	[System.Serializable]
	public class CurveBindingData {
		public string propertyName; // Имя свойства
		public string path;         // Путь к объекту
		public string type;         // Тип объекта
		public List<CurveData> keys; // Данные ключей кривой
	}


	[System.Serializable]
	public class AnimationClipInfo {
		[Tooltip("Основная базовая анимация")]
		public AnimationClip clip = null;
		[HideProperty, Tooltip("Структура анимации\nUnity не даёт доступа к кривым анимации в билде на устройстве, поэтому для работы с исходными ключевыми кадрами анимации нужно предварительно записать структуру анимаций")]
		public List<ClipPropertyCurve> propertyInfo = new();
		[HideProperty, Tooltip("Список ключевых кадров для перезарядки оружия")]
		public List<ClipWeightEventRange> keyframes = new();


		public AnimationClipInfo(AnimationClip clip) {
			this.clip = clip;
		}

		public void AddPropertyInfo(CurveBindingData binding, AnimationCurve curve) { //Запись клипов //Копировать кривые анимаии в файл, чтобы в сборке APK на устройстве иметь доступ к данным из клипов
			this.propertyInfo.Add(new ClipPropertyCurve(binding.path, binding.type, binding.propertyName, curve));
		}

		//Записать ключевые кадры с движениями магазина во время перезарядки для работы <Weapon>
		//Перебираем все события и записываем некоторые из них, которые относятся к оружию <Weapon>
		public void UpdateKeyframes(AnimationEvent[] events) {
			ClipWeightEventRange newEventRange = new ClipWeightEventRange();
			this.keyframes.Clear();
			for (int z = 0; z < events.Length; z++) {
				if (PlayerHands.EventIsKeyframe(events[z].functionName)) continue;
				if (this.keyframes.Exists(item => item.functionName == events[z].functionName)) continue;
				newEventRange.name = events[z].functionName;
				newEventRange.startTime = events[z].time;
				newEventRange.endTime = ClipWeightEventRange.GetEndTime(events[z], this.clip);
				newEventRange.functionName = events[z].functionName;
				this.keyframes.Add(newEventRange);
			}
		}
	}



	[System.Serializable]
	public struct ClipWeightEventRange {
		[Tooltip("Имя или любой идентификатор")]
		public string name;
		[Tooltip("Начало диапазона")]
		public float startTime;
		[Tooltip("Конец диапазона")]
		public float endTime;
		[Tooltip("Вызываемая функция")]
		public string functionName;
		//Длительность
		public float timeLength { get { return endTime - startTime; } }

		public bool HitTestTime(float time) {
			return startTime <= time && time <= endTime;
		}

		private static AnimationEvent[] events;
		public static float GetEndTime(AnimationEvent firstEvent, AnimationClip clip) {
			events = clip.events;
			for (int a = 0; a < events.Length; a++) {
				if (firstEvent.time < events[a].time && events[a].functionName == firstEvent.functionName) {
					return events[a].time;
				}
			}
			if (firstEvent.time != 0f) { //Показать сообщение об ошибке для событий, которые находятся в середине анимации
				Debug.LogWarning("ClipWeightEventRange: не удалось найти второе событие <" + firstEvent.functionName + "> для создания диапазона\nБудет использован последний кадр в качесте диапозона\nevent: " + firstEvent.functionName + ":  [" + firstEvent.time + " - " + clip.length + "];\n<AnimationClip>: " + clip.name + ";\n\n", clip);
			}
			return clip.length;
		}
	}
}






















































