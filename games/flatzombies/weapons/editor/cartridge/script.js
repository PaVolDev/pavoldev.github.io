// script.js — Чистая версия без JSON-вывода на страницу
document.addEventListener("DOMContentLoaded", renderFields);

function renderFields() {
	const container = document.getElementById("settings");
	container.innerHTML = "";

	fields.forEach(field => {
		if (field.type === "space") {
			const space = document.createElement("div");
			space.className = "field-row";
			space.style.height = `${field.height || 10}px`;
			container.appendChild(space);
			return;
		}

		const row = document.createElement("div");
		row.className = "field-row";

		const labelDiv = createLabel(field);
		const controlDiv = createControl(field);

		row.appendChild(labelDiv);
		row.appendChild(controlDiv);
		container.appendChild(row);
	});
}

function createLabel(field) {
	const labelDiv = document.createElement("div");
	labelDiv.className = "field-label";

	const name = document.createElement("div");
	name.className = "name";
	name.textContent = field.field;
	labelDiv.appendChild(name);

	if (field.comment) {
		const comment = document.createElement("div");
		comment.className = "comment";
		comment.textContent = field.comment;
		labelDiv.appendChild(comment);
	}

	return labelDiv;
}

function createControl(field) {
	const controlDiv = document.createElement("div");
	controlDiv.className = "field-control";

	switch (field.type) {
		case "string":
			return createStringControl(field, controlDiv);
		case "int":
		case "float":
			return createNumberControl(field, controlDiv);
		case "bool":
			return createBoolControl(field, controlDiv);
		case "enum":
			return createEnumControl(field, controlDiv);
		case "Sprite":
			return createSpriteControl(field, controlDiv);
		case "array":
			return createArrayControl(field, controlDiv);
		case "struct":
			return createStructControl(field, controlDiv);
		default:
			return controlDiv;
	}
}
function createStringControl(field, parent) {
	const input = document.createElement("input");
	input.type = field.type === "string" ? "text" : "number";
	input.value = field.value !== null ? field.value : "";
	input.placeholder = field.type;
	input.oninput = () => {
		field.value = input.value;
	};
	parent.appendChild(input);
	return parent;
}

function createNumberControl(field, parent) {
	const container = document.createElement("div");
	container.style = "display: grid;grid-template-columns: 65% 30%;align-items: center;justify-content: space-between;"

	const isFloat = field.type === "float";
	const isInt = field.type === "int";
	const hasRange = Array.isArray(field.range) && field.range.length === 2;

	let minValue = hasRange ? field.range[0] : (isInt ? -2147483648 : -Infinity);
	let maxValue = hasRange ? field.range[1] : (isInt ? 2147483647 : Infinity);
	let step = isFloat ? 0.01 : 1;

	let value = parseFloat(field.value);
	if (isNaN(value)) value = isFloat ? 0.0 : 0;
	value = Math.min(Math.max(value, minValue), maxValue);
	field.value = value;

	const numberInput = document.createElement("input");
	numberInput.type = "number";
	numberInput.value = value;
	numberInput.min = minValue;
	numberInput.max = maxValue;
	numberInput.step = step;
	numberInput.placeholder = field.type;

	if (hasRange) {
		const rangeInput = document.createElement("input");
		rangeInput.type = "range";
		rangeInput.min = minValue;
		rangeInput.max = maxValue;
		rangeInput.step = step;
		rangeInput.value = value;

		rangeInput.oninput = () => {
			const val = isInt ? Math.round(rangeInput.value) : parseFloat(rangeInput.value);
			numberInput.value = val;
			field.value = val;
		};

		numberInput.oninput = () => {
			const val = numberInput.value === "" ? 0 : parseFloat(numberInput.value);
			if (isNaN(val)) return;
			const clamped = Math.min(Math.max(val, minValue), maxValue);
			field.value = isInt ? Math.round(clamped) : clamped;
			rangeInput.value = field.value;
		};

		container.appendChild(rangeInput);
	}

	numberInput.onchange = () => {
		const val = numberInput.value === "" ? 0 : parseFloat(numberInput.value);
		if (isNaN(val)) return;
		const clamped = Math.min(Math.max(val, minValue), maxValue);
		field.value = isInt ? Math.round(clamped) : clamped;
		numberInput.value = field.value;
	};

	container.appendChild(numberInput);
	parent.appendChild(container);
	return parent;
}

function createBoolControl(field, parent) {
	const checkbox = document.createElement("input");
	checkbox.type = "checkbox";
	checkbox.checked = !!field.value;
	checkbox.onchange = () => {
		field.value = checkbox.checked;
	};
	parent.appendChild(checkbox);
	return parent;
}

function createEnumControl(field, parent) {
	const select = document.createElement("select");
	field.options.forEach(opt => {
		const option = document.createElement("option");
		option.value = opt;
		option.textContent = opt;
		if (opt === field.value) option.selected = true;
		select.appendChild(option);
	});
	select.onchange = () => {
		field.value = select.value;
	};
	parent.appendChild(select);
	return parent;
}

function createSpriteControl(field, parent) {
	const container = document.createElement("div");
	container.className = "sprite-input-container";

	const input = document.createElement("input");
	input.type = "text";
	input.value = field.value || "";
	input.placeholder = "BASE64 изображения";
	input.className = "setting-input"; // можно оставить класс для стилей
	input.oninput = () => {
		field.value = input.value;
	};

	// Создаём label-обёртку
	const label = document.createElement("label");
	label.className = "file-input-label";

	const fileInput = document.createElement("input");
	fileInput.type = "file";
	fileInput.accept = "image/png, image/jpeg"; // можно оставить .png или добавить .jpg
	fileInput.className = "file-input";
	fileInput.onchange = (e) => {
		const file = e.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = () => {
				input.value = reader.result; //base64
				field.value = reader.result; //base64
			};
			reader.readAsDataURL(file);
		}
	};

	const buttonSpan = document.createElement("span");
	buttonSpan.className = "file-input-button";
	buttonSpan.textContent = "Выбрать файл";

	// Собираем структуру
	label.appendChild(fileInput);
	label.appendChild(buttonSpan);

	// Добавляем в контейнер: текстовое поле + label с кнопкой
	container.appendChild(input);
	container.appendChild(label);

	parent.appendChild(container);
	return parent;
}

function createArrayControl(field, parent) {
	const arrayItems = document.createElement("div");
	arrayItems.className = "array-items";
	arrayItems.id = `array-items-${field.field}`;

	const actions = document.createElement("div");
	actions.className = "row-actions";

	const addButton = document.createElement("button");
	addButton.textContent = "Добавить";
	addButton.className = "add";
	addButton.onclick = () => {
		const item = field.itemType === "string"
			? ""
			: Object.fromEntries(field.itemTemplate.map(sub => [sub.field, sub.value]));
		field.items.push(item);
		renderArrayItem(field, field.items.length - 1, arrayItems);
	};

	actions.appendChild(addButton);
	parent.appendChild(actions);
	parent.appendChild(arrayItems);

	field.items.forEach((_, i) => renderArrayItem(field, i, arrayItems));
	return parent;
}

function renderArrayItem(field, index, parent) {
	const item = document.createElement("div");
	item.className = "array-item";
	item.dataset.index = index;

	const head = document.createElement("div");
	head.className = "array-item-head";

	const title = document.createElement("div");
	title.className = "array-item-title";
	title.textContent = `${field.field}[${index}]`;
	head.appendChild(title);

	const removeBtn = document.createElement("button");
	removeBtn.textContent = "Удалить";
	removeBtn.className = "btn btn-danger";
	removeBtn.onclick = () => {
		field.items.splice(index, 1);
		parent.removeChild(item);
		reindexArrayItems(field, parent);
	};
	head.appendChild(removeBtn);
	item.appendChild(head);

	if (field.itemType === "string") {
		const input = document.createElement("input");
		input.type = "text";
		input.value = field.items[index];
		input.oninput = e => {
			field.items[index] = e.target.value;
		};
		item.appendChild(input);
	} else if (field.itemType === "struct") {
		const innerGrid = document.createElement("div");
		innerGrid.className = "grid-in-object";

		field.itemTemplate.forEach(sub => {
			const row = document.createElement("div");
			row.className = "field-row";

			const label = document.createElement("div");
			label.className = "field-label";

			const name = document.createElement("div");
			name.className = "name";
			name.textContent = sub.field;
			label.appendChild(name);

			if (sub.comment) {
				const comment = document.createElement("div");
				comment.className = "comment";
				comment.textContent = sub.comment;
				label.appendChild(comment);
			}

			row.appendChild(label);

			const control = document.createElement("div");
			control.className = "field-control";

			// === Обработка разных типов, включая enum ===
			switch (sub.type) {
				case "string":
				case "int":
				case "float": {
					const inp = document.createElement("input");
					inp.type = sub.type === "string" ? "text" : "number";
					inp.value = sub.type === "int" || sub.type === "float"
						? parseFloat(field.items[index][sub.field]) || 0
						: field.items[index][sub.field] || "";
					inp.oninput = e => {
						const val = e.target.value;
						field.items[index][sub.field] = sub.type === "int"
							? parseInt(val) || 0
							: sub.type === "float"
								? parseFloat(val) || 0
								: val;
					};
					control.appendChild(inp);
					break;
				}
				case "bool": {
					const chk = document.createElement("input");
					chk.type = "checkbox";
					chk.checked = !!field.items[index][sub.field];
					chk.onchange = () => {
						field.items[index][sub.field] = chk.checked;
					};
					control.appendChild(chk);
					break;
				}
				case "enum": {
					const sel = document.createElement("select");
					sub.options.forEach(opt => {
						const option = document.createElement("option");
						option.value = opt;
						option.textContent = opt;
						if (opt === field.items[index][sub.field]) {
							option.selected = true;
						}
						sel.appendChild(option);
					});
					sel.onchange = () => {
						field.items[index][sub.field] = sel.value;
					};
					control.appendChild(sel);
					break;
				}
				default: {
					const inp = document.createElement("input");
					inp.type = "text";
					inp.disabled = true;
					inp.value = `Unsupported type: ${sub.type}`;
					control.appendChild(inp);
				}
			}

			row.appendChild(control);
			innerGrid.appendChild(row);
		});

		item.appendChild(innerGrid);
	}

	parent.appendChild(item);
}

function reindexArrayItems(field, parent) {
	Array.from(parent.children).forEach((el, i) => {
		el.dataset.index = i;
		el.querySelector(".array-item-title").textContent = `${field.field}[${i}]`;
	});
}

function createStructControl(field, parent) {
	const details = document.createElement("details");
	details.className = "object";
	details.open = true;

	const summary = document.createElement("summary");
	summary.textContent = field.struct || "Структура";
	details.appendChild(summary);

	const body = document.createElement("div");
	body.className = "object-body";

	const innerGrid = document.createElement("div");
	innerGrid.className = "grid-in-object";

	field.nested.forEach(subField => {
		const subRow = document.createElement("div");
		subRow.className = "field-row";

		const subLabel = document.createElement("div");
		subLabel.className = "field-label";

		const subName = document.createElement("div");
		subName.className = "name";
		subName.textContent = subField.field;
		subLabel.appendChild(subName);

		if (subField.comment) {
			const subComment = document.createElement("div");
			subComment.className = "comment";
			subComment.textContent = subField.comment;
			subLabel.appendChild(subComment);
		}

		const subControl = document.createElement("div");
		subControl.className = "field-control";

		switch (subField.type) {
			case "string":
			case "int":
			case "float":
				const inp = document.createElement("input");
				inp.type = subField.type === "string" ? "text" : "number";
				inp.value = subField.value;
				inp.oninput = e => {
					subField.value = inp.value;
				};
				subControl.appendChild(inp);
				break;
			case "bool":
				const chk = document.createElement("input");
				chk.type = "checkbox";
				chk.checked = subField.value;
				chk.onchange = () => {
					subField.value = chk.checked;
				};
				subControl.appendChild(chk);
				break;
			case "enum":
				const sel = document.createElement("select");
				subField.options.forEach(opt => {
					const optEl = document.createElement("option");
					optEl.value = opt;
					optEl.textContent = opt;
					if (opt === subField.value) optEl.selected = true;
					sel.appendChild(optEl);
				});
				sel.onchange = () => {
					subField.value = sel.value;
				};
				subControl.appendChild(sel);
				break;
		}

		subRow.appendChild(subLabel);
		subRow.appendChild(subControl);
		innerGrid.appendChild(subRow);
	});

	body.appendChild(innerGrid);
	details.appendChild(body);
	parent.appendChild(details);
	return parent;
}

// === ЭКСПОРТ В ФАЙЛ (в нужном формате) ===
window.exportToJSON = function () {
	const result = {};

	fields.forEach(field => {
		if (field.type === "space") return;

		switch (field.type) {
			case "string":
			case "Sprite":
				result[field.field] = field.value || "";
				break;
			case "int":
				result[field.field] = parseInt(field.value) || 0;
				break;
			case "float":
				result[field.field] = parseFloat(field.value) || 0;
				break;
			case "bool":
				result[field.field] = !!field.value;
				break;
			case "enum":
				result[field.field] = field.value;
				break;
			case "array":
				result[field.field] = field.items.map(item => {
					if (field.itemType === "string") return item;
					if (field.itemType === "struct" && typeof item === "object") {
						const obj = {};
						field.itemTemplate.forEach(sub => {
							obj[sub.field] = sub.type === "int"
								? parseInt(item[sub.field]) || 0
								: sub.type === "float"
									? parseFloat(item[sub.field]) || 0
									: item[sub.field] !== undefined ? item[sub.field] : "";
						});
						return obj;
					}
					return item;
				});
				break;
			case "struct":
				result[field.field] = {};
				field.nested.forEach(sub => {
					const val = sub.type === "int"
						? parseInt(sub.value) || 0
						: sub.type === "float"
							? parseFloat(sub.value) || 0
							: sub.type === "bool"
								? !!sub.value
								: sub.value;
					result[field.field][sub.field] = val;
				});
				break;
		}
	});

	const dataStr = JSON.stringify(result, null, 2);
	const blob = new Blob([dataStr], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = "weapon-config.json";
	a.click();
	URL.revokeObjectURL(url);
};

// === ИМПОРТ: два режима — массив fields или объект значений ===
window.importFromJSON = function () {
	const input = document.createElement("input");
	input.type = "file";
	input.accept = ".json";
	input.onchange = (e) => {
		const file = e.target.files[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			try {
				const parsed = JSON.parse(event.target.result);

				if (Array.isArray(parsed)) {
					// Режим 1: Полная замена массива fields
					window.fields = parsed;
					renderFields();
					alert("✅ Полная замена: настройки загружены.");
				} else if (typeof parsed === "object" && parsed !== null) {
					// Режим 2: Применить значения к текущему fields
					applyJsonObjectToFields(parsed);
					renderFields();
					alert("✅ Частичное обновление: значения применены.");
				} else {
					alert("❌ Неподдерживаемый формат JSON.");
				}
			} catch (err) {
				alert("❌ Ошибка парсинга JSON: " + err.message);
			}
		};
		reader.readAsText(file);
	};
	input.click();
};

// === Применение объекта к существующим полям ===
function applyJsonObjectToFields(obj) {
	fields.forEach(field => {
		if (!(field.field in obj) || field.type === "space") return;

		const value = obj[field.field];

		switch (field.type) {
			case "string":
			case "Sprite":
			case "int":
			case "float":
			case "bool":
			case "enum":
				field.value = value;
				break;

			case "array":
				if (Array.isArray(value)) {
					field.items = value.map(item => {
						if (field.itemType === "string") return item;
						if (field.itemType === "struct" && typeof item === "object") {
							const filled = {};
							field.itemTemplate.forEach(sub => {
								filled[sub.field] = item[sub.field] !== undefined ? item[sub.field] : sub.value;
							});
							return filled;
						}
						return item;
					});
				}
				break;

			case "struct":
				if (typeof value === "object" && value !== null) {
					field.nested.forEach(subField => {
						if (value[subField.field] !== undefined) {
							subField.value = value[subField.field];
						}
					});
				}
				break;
		}
	});
}