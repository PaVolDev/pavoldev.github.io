using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEditor;
using System.Reflection;

public class AnimatorRangeClip : MonoBehaviour {
	public const string EMPTY = "emptyAnimation";
	//Воспроизводить звук в пределах трёх кадров
	public const int SoundRange = 3;
	[HideInInspector, Tooltip("Источник звука")]
	public AudioSource audioSource = null;
	[Tooltip("Стандартный клип с анимацей")]
	public AnimationClip clip = null;
	[Tooltip("Множитель скорости анимаций")]
	public float timeScale = 1f;
	//Второй множитель для избежания ошибок, когда множитель меняется в одном месте и он не возвращается обратно должным образом из-за ошибок в коде
	internal float moveScale = 1f;
	[Tooltip("Когда обновлять кадр (пока в разработке)\nПри Disabled обновлять кадр вручную из другого компонента")]
	public ModeUpdate modeUpdate = ModeUpdate.LateUpdate;
	public enum ModeUpdate { Disabled, LateUpdate };
	[Tooltip("Текущий диапозон анимации")]
	public KeyframeTimeRange range = new KeyframeTimeRange(AnimatorRangeClip.EMPTY, 0, 9999);
	public string rangeName { get { return range.name; } }

	internal GameObject parent = null;
	internal float timeline = 0; //Текущее время во всем клипе, во всей временной шкале
	internal bool isPlaying = false;
	public bool isComplete { get { return timeline == clip.length || timeline == range.last && range.start < range.last; } }
	public int frame { get { return Mathf.RoundToInt(timeline * clip.frameRate); } }
	//В секундах
	internal List<KeyframeTimeRange> keyframes = new List<KeyframeTimeRange>();
	//Текущий кадр в текущем диапозоне [range.start; range.last]
	internal float rangeTime = 0;
	//Текущий кадр в процентах от текущий анимации
	internal float normalizedTime = 0f;

	void Awake() {
		moveScale = 1f;
		if (audioSource == null) audioSource = this.gameObject.GetComponentInParent<AudioSource>();
		if (parent == null) parent = this.gameObject;
		if (clip == null) return;
		this.SwitchClip(clip, rangeName, parent);
	}
	//Start is called before the first frame update
	void Start() {

	}
	//Update is called once per frame
	public void LateUpdate() {
		if (isPlaying && modeUpdate == ModeUpdate.LateUpdate) this.UpdateFrame(Time.deltaTime);
	}

	public void UpdateFrame(float deltaTime) {
		if (!isPlaying && deltaTime != 0f) return;
		timeline += deltaTime * timeScale * moveScale;
		if (timeline < range.last) {
			this.SetFrame(timeline);
		} else {
			this.GotoAndStop(range.last);
		}
	}

	[ContextMenu("Обновить кадр")]
	public void UpdateFrame() {
		this.UpdateFrame(0f);
	}

	public void Play() {
		//Debug.Log(this.name + "<AnimatorRangeClip>.Play()", this);
		if (range.start != range.last) {
			isPlaying = true;
			return;
		}
		this.Stop();
	}
	public void Stop() {
		//Debug.Log(this.name + "<AnimatorRangeClip>.Stop()", this);
		isPlaying = false;
	}
	//aFrame - новый кадр от 0
	public void GotoAndStop(float time) {
		//Debug.Log(this.name + ".GotoAndStop(" + time + ")", this);
		this.SetFrame(time);
		Stop();
	}
	//aFrame - новый кадр от 0
	public void GotoAndPlay(float time) {
		//Debug.Log(this.name + ".GotoAndPlay(" + time + ")", this);
		this.SetFrame(time);
		Play();
	}

	public bool HasCurrentRange(string keyframeName) {
		bool result = keyframes.Exists(item => item.start <= timeline && timeline <= item.last && item.name == keyframeName);
		//Debug.Log(this.name + ".HasCurrentRange(" + keyframeName + ", " + timeline + ") == " + result, this);
		return result;
	}

	public bool HasKeyframe(string keyframeName) {
		//Debug.Log(this.name + ".HasKeyframe(" + keyframeName + ") : " + keyframes.Exists(item => item.name == keyframeName), this);
		return keyframes.Exists(item => item.name == keyframeName);
	}

	public bool IsHitFrame(float frame) {
		return frame / clip.frameRate <= timeline && (timeline - frame / clip.frameRate) <= 0.05f; //1f/25f = 0.04f
	}
	public bool IsHitFrame(int[] frames) {
		if (frames.Length == 0) return false;
		for (int a = 0; a < frames.Length; a++) {
			if (IsHitFrame(frames[a])) return true;
		}
		return false;
	}

	public bool IsHitRange(float frame) {
		return Mathf.Abs(rangeTotalTime * clip.frameRate - frame) <= 0.04f; //1f/25f = 0.04f
	}


	public float GetStartTime(string keyframeName) {//Debug.Log(this.name + ".GetStartFrame(" + keyframeName + ")", this);
		return keyframes.Find(item => item.name == keyframeName || item.name == EMPTY).start;
	}

	private string lastStartKeyframe = string.Empty; //Записать последние значение для кэширования работы функции
	private float lastStartValue = 0f; //Записать последние значение для кэширования работы функции
	public float GetStartTime(string keyframeName, float defaultValue) {//Debug.Log(this.name + ".GetStartFrame(" + keyframeName + ")", this);
		if (lastStartKeyframe == keyframeName) return lastStartValue;
		lastStartKeyframe = keyframeName;
		int index = keyframes.FindIndex(item => item.name == keyframeName);
		if (index != -1) defaultValue = keyframes[index].start;
		lastStartValue = defaultValue;
		return defaultValue;
	}

	public float GetLastTime(string keyframeName, float defaultValue) {//Debug.Log(this.name + ".GetLastFrame(" + keyframeName + ")", this);
		int index = keyframes.FindIndex(item => item.name == keyframeName);
		if (index != -1) defaultValue = keyframes[index].last;
		return defaultValue;
	}
	public float GetLastTime(string keyframeName) {
		return this.GetLastTime(keyframeName, clip.length);
	}

	public float GetTimeLength(string keyframeName) {//Debug.Log(this.name + ".GetTimeLength(" + keyframeName + ")", this);
		return keyframes.Find(item => item.name == keyframeName || item.name == EMPTY).timeLength;
	}


	public static float GetTimeLength(AnimationClip clip, string keyframeName) {
		AnimationEvent first = Array.Find<AnimationEvent>(clip.events, item => item.functionName == keyframeName);
		if (first == null) {
			Debug.LogWarning("GetTimeLength: анимация не найдена <" + keyframeName + ">, используем clip.length=" + clip.length);
			return clip.length;
		}
		AnimationEvent last = Array.FindLast<AnimationEvent>(clip.events, item => item.functionName == keyframeName && first.time < item.time);
		if (last == null) {
			Debug.LogWarning("GetTimeLength: отсутствует второй ключевой кадр для диапазона <" + keyframeName + ">, используем clip.length=" + clip.length);
			return clip.length;
		}
		Debug.Log("static.GetTimeLength(" + keyframeName + ") = " + (last.time - first.time));
		return last.time - first.time;
	}

	public static bool HasKeyframe(AnimationClip clip, string keyframeName) {
		return Array.Exists<AnimationEvent>(clip.events, item => item.functionName == keyframeName);
	}

	public static float GetStartTime(AnimationClip clip, string keyframeName) {
		AnimationEvent keyframe = Array.Find<AnimationEvent>(clip.events, item => item.functionName == keyframeName);
		if (keyframe == null) return 0;
		return keyframe.time;
	}

	public static float GetLastTime(AnimationClip clip, string keyframeName) {
		AnimationEvent first = Array.Find<AnimationEvent>(clip.events, item => item.functionName == keyframeName);
		if (first == null) {
			Debug.LogWarning("GetLastFrame: не удалось найти ключевой кадр <" + keyframeName + ">");
			return clip.length;
		}
		AnimationEvent last = Array.FindLast<AnimationEvent>(clip.events, item => item.functionName == keyframeName && first.time < item.time);
		if (last == null) {
			Debug.LogWarning("GetLastFrame: отсутствует второй ключевой кадр для диапазона <" + keyframeName + ">");
			return clip.length;
		}
		return last.time;
	}



	public void SwitchClip(AnimationClip clip, string animation, GameObject parent) {
		Debug.Log(this.name + ".SwitchClip(" + animation + ")", this);
		this.clip = clip;
		this.parent = parent;
		keyframes.Clear(); //Обновить список ключевых кадров
		List<KeyValuePair<string, float>> clipEventList = new List<KeyValuePair<string, float>>(); //У некоторых событий есть строковой параметр и он будет использоваться для поиска ключевого кадра
		foreach (var clipEvent in clip.events) { //Записать события учитывая имя и строковой параметр
			clipEventList.Add(new KeyValuePair<string, float>(clipEvent.functionName, clipEvent.time));
			if (string.IsNullOrWhiteSpace(clipEvent.stringParameter)) continue;
			clipEventList.Add(new KeyValuePair<string, float>(clipEvent.stringParameter, clipEvent.time));
		}
		foreach (var eventTime in clipEventList) {
			if (keyframes.Exists(item => item.name == eventTime.Key && item.last == eventTime.Value)) continue; //Второй ключевой кадр уже был записан
			AnimationEvent nextEvent = Array.Find<AnimationEvent>(clip.events, item => item.functionName == eventTime.Key && eventTime.Value < item.time);
			if (nextEvent != null) {
				keyframes.Add(new KeyframeTimeRange(eventTime.Key, eventTime.Value, nextEvent.time));
			} else if (keyframes.Exists(item => item.name == eventTime.Key) == false) {
				keyframes.Add(new KeyframeTimeRange(eventTime.Key, eventTime.Value, clip.length));
			}
		}
		keyframes.Add(new KeyframeTimeRange(AnimatorRangeClip.EMPTY, 0, clip.length));
		if (string.IsNullOrEmpty(animation) || animation == AnimatorRangeClip.EMPTY) {
			this.ResetAnimation(0);
		} else {
			this.SwitchAnimation(animation);
		}
	}
	public void SwitchAnimation(string keyframe) {
#if UNITY_EDITOR
		if (!keyframes.Exists(item => item.name == keyframe)) {
			Debug.LogWarning("SwitchAnimation: анимация не найдена <" + keyframe + ">");
			return;
		}
#endif
		range = keyframes.Find(item => item.name == keyframe || item.name == EMPTY);
		this.SetFrame(range.start);
		if (isPlaying) {
			this.Play();
		} else {
			this.Stop();
		}
		Debug.Log(this.name + ".SwitchAnimation(" + keyframe + ")\nrange: [" + range.start + " - " + range.last + "]", this);
	}

	public void SwitchAnimation(string keyframe, float gotoAndPlayTime) {
		this.SwitchAnimation(keyframe);
		this.GotoAndPlay(gotoAndPlayTime);
	}


	public void ResetAnimation(float time) {
		Debug.Log(this.name + ".ResetAnimation(" + time + ")", this);
		this.range = keyframes.Find(item => item.name == EMPTY);
		this.SetFrame(time);
	}

	//frame - кадр от 0 на общей шкале 
	//Если анимтаор неактивен в сцене и выключен, то он не будет влиять на преобразование объектов
	public void SetFrame(float time) {
		time = Mathf.Clamp(time, this.range.start, this.range.last);
		this.rangeTime = Mathf.Clamp((time - range.start), 0, range.timeLength);
		this.timeline = time;
		this.normalizedTime = Mathf.Clamp01(rangeTime / rangeTotalTime);
		//Все параметры аниматора обновлены и если компонент выключен, то останавливаем функцию, чтобы не трогать объекты на сцене
		if (!enabled || !gameObject.activeInHierarchy) { Debug.Log(this.name + ".SetFrame(" + time + ") = RETURN", this); return; }
		clip.SampleAnimation(this.parent, time);
		this.InvokeEvents(clip.events, time, this.parent);
	}

	public void SetFrameRender(float time) {
		clip.SampleAnimation(this.parent, time);
		this.InvokeEvents(clip.events, time, this.parent);
	}

	private MonoBehaviour[] cacheComponents = new MonoBehaviour[0];
	private void InvokeEvents(AnimationEvent[] events, float time, GameObject parent) {
		if (cacheComponents == null || cacheComponents.Length == 0) cacheComponents = parent.GetComponents<MonoBehaviour>();
		InvokeEventsAtTime(events, time, cacheComponents);
	}

	private static List<AnimationEvent> eventsCalled = new List<AnimationEvent>();
	///<summary>
	///Вызывает метод из MonoBehaviour на основе данных из AnimationEvent.
	///</summary>
	///<param name="events">AnimationEvent, содержащий информацию о методе и параметрах.</param>
	///<param name="time">Время в секундах для проверки событий.</param>
	///<param name="target">Объект-цель, содержащий функции событий. Целевой MonoBehaviour, метод которого будет вызван</param>
	///<returns>True, если какие-либо события были вызваны, иначе false.</returns>
	public static void InvokeEventsAtTime(AnimationEvent[] events, float time, MonoBehaviour[] components) {
#if UNITY_EDITOR
		if (events == null || events.Length == 0) { Debug.LogError("Пустой список событий AnimationEvent[]\n\n"); return; }
		if (components.Length == 0) { Debug.LogError("Пустой список компонентов MonoBehaviour[]\n\n"); return; }
#endif
		//Получить все события из AnimationClip
		foreach (var animationEvent in events) { //Проверить, совпадает ли время события с указанным временем
			int cacheIndex = eventsCalled.FindIndex(item => item.functionName == animationEvent.functionName && item.time == animationEvent.time);
			if (animationEvent.time <= time && time - animationEvent.time <= 0.08f) { //Вызвать функцию события на целевом объекте
				if (cacheIndex != -1) continue;
				eventsCalled.Add(animationEvent); //Сразу записать событие в список вызванных, а будет оно сейчас выполнено или нет, это неважно
				foreach (var monoBehaviour in components) {
					MethodInfo methodInfo = monoBehaviour.GetType().GetMethod(animationEvent.functionName); //Получаем метод по имени
					if (methodInfo == null) continue; //{ Debug.LogWarning("Метод " + animationEvent.functionName + " не найден в компоненте " + monoBehaviour.GetType().Name, monoBehaviour); continue; }
					object[] parameters = null; //Определяем параметры для вызова метода
					if (methodInfo.GetParameters().Length != 0) {
						parameters = new object[1];
						var parameterInfo = methodInfo.GetParameters(); //Получаем параметры метода
						Type paramType = parameterInfo[0].ParameterType;//Получаем тип параметра //В зависимости от типа параметра, заполняем массив
						if (paramType == typeof(float)) {
							parameters[0] = animationEvent.floatParameter;
						} else if (paramType == typeof(string)) {
							parameters[0] = animationEvent.stringParameter;
						} else if (paramType == typeof(int)) {
							parameters[0] = (int)animationEvent.intParameter;
						} else { //if (paramType == typeof(UnityEngine.Object) && animationEvent.objectReferenceParameter != null) {
							parameters[0] = animationEvent.objectReferenceParameter; //Debug.LogWarning($"Метод '{animationEvent.functionName}'(<'{paramType}'>) с параметром не соответствует событию из анимации", monoBehaviour);
						}
					}
					methodInfo.Invoke(monoBehaviour, parameters); //Вызываем метод //Debug.Log("InvokeEventsAtTime: " + animationEvent.functionName + ":" + time, monoBehaviour);
					break;
				}
			} else if (cacheIndex != -1) {
				eventsCalled.RemoveAt(cacheIndex);
			}
		}
	}





	//Длительность в секундах текущего диапазона ключевого кадра
	public float rangeTotalTime {
		get {
			if (range.last == range.start) return 0.15f;
			return range.timeLength;
		}
	}

	//Всего кадров
	public float clipLength {
		get { return clip.length; }
	}



#if UNITY_EDITOR
	[ContextMenu("Сохранить клип в файл", true)]
	public bool CheckClipSaveToAsset() {
		return clip != null;
	}
	[ContextMenu("Сохранить клип в файл", false)]
	public void ClipSaveToAsset() {
		AssetDatabase.CreateAsset(clip, "Assets/" + clip.name + ".anim");
	}
#endif
}

[System.Serializable]
public struct KeyframeTimeRange {
	public string name;
	[Tooltip("Первый кадр. Время в секундах")]
	public float start;
	[Tooltip("Второй кадр. Время в секундах")]
	public float last;
	//Длительность
	public float timeLength { get { return last - start; } }


	public KeyframeTimeRange(string name, float startTime, float lastTime) {
		this.name = name;
		this.start = startTime;
		this.last = lastTime;
	}
}












































































































































