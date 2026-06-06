const server = 'aHR0cHM6Ly9oNTEzNTguc3J2NS50ZXN0LWhmLnJ1L21vZHMvd2VhcG9uLWVkaXRvci9saXN0L3VzZXItbGlzdC5waHA=';
const ITEMS_PER_PAGE = 8; // Количество модов на странице
const VISIBLE_PAGES = 5; // Количество видимых кнопок страниц
const AllowedMods = [
	{ type: "playerskin", editor: "player", title: "Игровой персонаж" },
	{ type: "cartridge", editor: "ammo", title: "Патроны" },
	{ type: "weapon", editor: "", title: "Оружия" },
]

let token = localStorage.getItem('session'); // Токен сессии пользователя
let modIds = []; // Список идентификаторов модов пользователя
let currentPage = 1; // Текущая страница списка
let recentMods = []; // Последние моды для выпадающего списка
let pageCache = {}; // Кэш загруженных страниц
let selectedRecentModId = ''; // Идентификатор мода из верхнего списка
let isPageLoading = false; // Признак активной загрузки страницы
let recentModCache = {}; // Кэш загруженных модов из выпадающего списка
let selectedModsType = getSelectedModsTypeFromUrl(); // Тип модов из GET-параметра

const statusTooltip = {
	'✅': 'Опубликовано',
	'👮': 'Мод в процессе рассмотрения',
	'📵': 'Приватное тестирование'
};

// Функция инициализации интерфейса страницы.
document.addEventListener('DOMContentLoaded', async function () {
	bindPaginationEvents();
	bindRecentModsEvents();
	renderModsTypeSelectOptions();
	bindModsTypeEvents();
	applyModsTypeSelectValue();
	if (!token) {
		hideLoadingNewWeapon();
		resetRecentModsSelect();
		clearSelectedRecentMod();
		return;
	}
	showLoadingNewWeapon();
	try {
		const data = await requestServer({
			action: 'auto_login',
			token: token,
			modType: selectedModsType
		});
		if (data.success) {
			handleAuthSuccess(data);
		} else {
			localStorage.removeItem('session');
			token = null;
			console.warn('Автовход не удался: ' + data.message);
		}
	} catch (error) {
		console.error('Автовход не удался:', error);
	} finally {
		hideLoadingNewWeapon();
	}
});

// Функция входа по логину и паролю.
document.getElementById('loginblock').addEventListener('submit', async function (e) {
	e.preventDefault();
	const login = document.getElementById('login').value.trim(); // Логин из формы
	const password = document.getElementById('password').value.trim(); // Пароль из формы
	if (!login || !password) {
		return;
	}
	doLogin(login, password);
});

// Функция авторизации пользователя на сервере.
async function doLogin(login, password) {
	document.getElementById('loginblock').classList.add('hidden');
	document.getElementById('authError').classList.add('hidden');
	showLoadingNewWeapon();
	try {
		const data = await requestServer({
			action: 'login',
			login: login,
			password: password,
			modType: selectedModsType
		});
		if (data.success) {
			handleAuthSuccess(data);
		} else {
			showError(data.message || 'Неверный логин или пароль');
		}
	} catch (error) {
		showError('Ошибка соединения с сервером');
		console.error(error);
	} finally {
		hideLoadingNewWeapon();
	}
}

// Функция обработки успешной авторизации.
function handleAuthSuccess(data) {
	token = data.token;
	localStorage.setItem('session', data.token);
	document.getElementById('loginblock').classList.add('hidden');
	document.getElementById('loginActions').classList.remove('hidden');
	showToolbar();
	setModIds(data.modIds);
	setRecentMods(data.recentMods);
	clearSelectedRecentMod();
	loadPage(1, true);
}

// Функция выхода пользователя.
document.getElementById('logout').addEventListener('click', logout);
async function logout() {
	const currentToken = localStorage.getItem('session'); // Текущий токен для выхода
	await fetch(atob(server), {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			action: 'logout',
			token: currentToken
		})
	});
	localStorage.removeItem('session');
	token = null;
	modIds = [];
	recentMods = [];
	pageCache = {};
	selectedRecentModId = '';
	currentPage = 1;
	isPageLoading = false;
	recentModCache = {};
	document.getElementById('loginblock').classList.remove('hidden');
	document.getElementById('loginActions').classList.add('hidden');
	hideToolbar();
	resetRecentModsSelect();
	clearSelectedRecentMod();
	document.getElementById('list').innerHTML = '';
}

function showLoadingNewWeapon() {
	document.getElementById('loading').classList.remove('hidden');
}

function hideLoadingNewWeapon() {
	document.getElementById('loading').classList.add('hidden');
}

// Функция унифицированного запроса к серверу списка модов.
async function requestServer(payload) {
	const response = await fetch(atob(server), {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
	return response.json();
}

// Функция сохранения списка идентификаторов модов.
function setModIds(ids) {
	modIds = Array.isArray(ids) ? ids : [];
	currentPage = 1;
	pageCache = {};
}

// Функция сохранения списка последних модов.
function setRecentMods(mods) {
	recentMods = Array.isArray(mods) ? mods : [];
	renderRecentModsSelect();
}

// Функция отображения панели инструментов.
function showToolbar() {
	document.getElementById('listToolbar').classList.remove('hidden');
}

// Функция скрытия панели инструментов.
function hideToolbar() {
	document.getElementById('listToolbar').classList.add('hidden');
}

// Функция загрузки страницы модов по требованию.
async function loadPage(page, forceReload) {
	const totalPages = getTotalPages(); // Общее количество доступных страниц
	if (isPageLoading && !forceReload) {
		return;
	}
	if (totalPages === 0) {
		renderEmptyList();
		return;
	}
	if (!Number.isFinite(page) || page < 1 || page > totalPages) {
		return;
	}
	currentPage = page;
	const idsForPage = getPageIds(page); // Идентификаторы модов текущей страницы
	if (idsForPage.length === 0) {
		renderEmptyList();
		return;
	}
	const cacheKey = String(page); // Ключ страницы в кэше
	if (pageCache[cacheKey] && !forceReload) {
		renderWeaponsList(pageCache[cacheKey]);
		return;
	}
	isPageLoading = true;
	renderListLoading();
	try {
		const data = await requestServer({
			action: 'get_mod_page',
			token: token,
			ids: idsForPage,
			modType: selectedModsType
		});
		if (!data.success) {
			showError(data.message || 'Не удалось загрузить список модов');
			return;
		}
		pageCache[cacheKey] = Array.isArray(data.weapons) ? data.weapons : [];
		renderWeaponsList(pageCache[cacheKey]);
	} catch (error) {
		console.error(error);
		showInlineError('Ошибка загрузки списка модов');
	} finally {
		isPageLoading = false;
		updatePaginationControls(getTotalPages());
	}
}

// Функция загрузки одного мода из выпадающего списка.
async function loadRecentMod(modId) {
	if (!modId || isPageLoading) {
		return;
	}
	selectedRecentModId = String(modId);
	if (recentModCache[selectedRecentModId]) {
		renderSelectedRecentMod(recentModCache[selectedRecentModId]);
		updateRecentModsSelection();
		return;
	}
	renderSelectedRecentModLoading();
	try {
		const data = await requestServer({
			action: 'get_mod_page',
			token: token,
			ids: [selectedRecentModId],
			modType: selectedModsType
		});
		if (!data.success || !Array.isArray(data.weapons) || data.weapons.length === 0) {
			clearSelectedRecentMod();
			return;
		}
		recentModCache[selectedRecentModId] = data.weapons[0];
		renderSelectedRecentMod(data.weapons[0]);
		updateRecentModsSelection();
	} catch (error) {
		console.error(error);
		showSelectedRecentModError('Ошибка загрузки выбранного мода');
	}
}

// Функция получения идентификаторов модов для страницы.
function getPageIds(page) {
	const startIndex = (page - 1) * ITEMS_PER_PAGE; // Начальный индекс страницы
	return modIds.slice(startIndex, startIndex + ITEMS_PER_PAGE);
}

// Функция отрисовки пустого списка.
function renderEmptyList() {
	document.getElementById('list').innerHTML = '<p style="text-align:center; color:#aaa;">Файлы не найдены</p>';
}

// Функция отрисовки индикатора загрузки списка.
function renderListLoading() {
	const totalPages = getTotalPages(); // Общее число страниц при загрузке
	document.getElementById('list').innerHTML = `
		<div class="list-loading">Загрузка страницы...</div>
		${renderPagination(totalPages)}
	`;
	updatePaginationControls(totalPages);
}

// Функция отрисовки сообщения об ошибке внутри списка.
function showInlineError(message) {
	const totalPages = getTotalPages(); // Общее число страниц при ошибке
	document.getElementById('list').innerHTML = `
		<div class="list-inline-error">${escapeHtml(message)}</div>
		${renderPagination(totalPages)}
	`;
	updatePaginationControls(totalPages);
}

// Функция отрисовки списка модов текущей страницы.
function renderWeaponsList(weapons) {
	const list = document.getElementById('list');
	if (!Array.isArray(weapons) || weapons.length === 0) {
		renderEmptyList();
		return;
	}
	const totalPages = getTotalPages(); // Общее число страниц списка
	let html = '<div class="gallery">';
	weapons.forEach(function (weapon) {
		html += renderWeaponCard(weapon);
	});
	html += '</div>';
	html += renderPagination(totalPages);
	list.innerHTML = html;
	updatePaginationControls(totalPages);
}

// Функция генерации карточки мода для основного списка.
function renderWeaponCard(weapon) {
	const id = weapon.id; // Идентификатор мода
	const modType = weapon.modType ?? ''; // Тип мода
	const icon = weapon.iconBase64 ?? ''; // Иконка мода
	const fileUrl = weapon.fileUrl ?? ''; // Ссылка на json-файл мода
	const likes = weapon.likes ?? 0; // Количество лайков
	const dislikes = weapon.dislikes ?? 0; // Количество дизлайков
	const rating = weapon.raiting ?? 0; // Количество запусков
	const status = weapon.status == 'publish' ? '✅' : weapon.status == 'review' ? '👮' : '📵'; // Статус модификации
	return `
		<div class="item">
			<img src="${icon}" alt="Иконка ${escapeHtml(String(id))}" id="image${escapeHtml(String(id))}" class="preview">
			<div class="actions" id="actions${escapeHtml(String(id))}">
				<select name="options" onchange="handleSelectChange(this)" modname="${escapeHtml(String(id))}" modtype="${escapeHtml(modType)}">
					<option value="action">${tr('Действия...')}</option>
					<option value="download" data-url="${escapeHtml(fileUrl)}">📄 ${tr('Скачать файл')}</option>
					<option value="edit" data-url="${escapeHtml(fileUrl)}">📝 ${tr('Редактировать')}</option>
					<option value="remove">❌ ${tr('Удалить')}</option>
				</select>
			</div>
			<div class="filename">${escapeHtml(String(id))}</div>
			<div class="info">
				<span class="rating-item" data-tooltip="${rating} ${tr('этажей было сыграно')}">
					<img src="images/plays.png">
					<span class="count">${rating}</span>
				</span>
				<span class="rating-item">
					<img src="images/like.png" alt="Лайк">
					<span class="count">${likes}</span>
				</span>
				<span class="rating-item" data-tooltip=" ${tr(statusTooltip[status])}">
					${status}
				</span>
				<span class="rating-item">
					<img src="images/dislike.png" alt="Дизлайк">
					<span class="count">${dislikes}</span>
				</span>
			</div>
		</div>
	`;
}

// Функция генерации карточки мода для верхнего блока выбора.
function renderRecentModCard(weapon) {
	const id = weapon.id; // Идентификатор выбранного мода
	const modType = weapon.modType ?? ''; // Тип выбранного мода
	const icon = weapon.iconBase64 ?? ''; // Иконка выбранного мода
	const fileUrl = weapon.fileUrl ?? ''; // Ссылка на json-файл выбранного мода
	const likes = weapon.likes ?? 0; // Количество лайков выбранного мода
	const dislikes = weapon.dislikes ?? 0; // Количество дизлайков выбранного мода
	const rating = weapon.raiting ?? 0; // Количество запусков выбранного мода
	const status = weapon.status == 'publish' ? '✅' : weapon.status == 'review' ? '👮' : '📵'; // Статус выбранного мода
	return `
		<div class="recent-selected-card">
			<div class="recent-selected-preview-block">
				<img src="${icon}" alt="Иконка ${escapeHtml(String(id))}" id="image${escapeHtml(String(id))}" class="preview recent-selected-preview">
				<div class="filename filename-highlight">${escapeHtml(String(id))}</div>
			</div>
			<div class="recent-selected-content">
				<div class="actions recent-selected-actions" id="actions${escapeHtml(String(id))}">
					<select name="options" onchange="handleSelectChange(this)" modname="${escapeHtml(String(id))}" modtype="${escapeHtml(modType)}">
						<option value="action">${tr('Действия...')}</option>
						<option value="download" data-url="${escapeHtml(fileUrl)}">📄 ${tr('Скачать файл')}</option>
						<option value="edit" data-url="${escapeHtml(fileUrl)}">📝 ${tr('Редактировать')}</option>
						<option value="remove">❌ ${tr('Удалить')}</option>
					</select>
				</div>
				<div class="info recent-selected-info">
					<span class="rating-item" data-tooltip="${rating} ${tr('этажей было сыграно')}">
						<img src="images/plays.png">
						<span class="count">${rating}</span>
					</span>
					<span class="rating-item">
						<img src="images/like.png" alt="Лайк">
						<span class="count">${likes}</span>
					</span>
					<span class="rating-item" data-tooltip=" ${tr(statusTooltip[status])}">
						${status}
					</span>
					<span class="rating-item">
						<img src="images/dislike.png" alt="Дизлайк">
						<span class="count">${dislikes}</span>
					</span>
				</div>
			</div>
		</div>
	`;
}

// Функция отображения выбранного мода из верхнего списка.
function renderSelectedRecentMod(weapon) {
	const block = document.getElementById('selectedRecentMod'); // Контейнер отдельного блока выбранного мода
	if (!block) {
		return;
	}
	block.innerHTML = renderRecentModCard(weapon);
}

// Функция очистки блока выбранного мода.
function clearSelectedRecentMod() {
	const block = document.getElementById('selectedRecentMod'); // Контейнер отдельного блока выбранного мода
	if (!block) {
		return;
	}
	selectedRecentModId = '';
	block.innerHTML = '';
	updateRecentModsSelection();
}

// Функция отображения состояния загрузки выбранного мода.
function renderSelectedRecentModLoading() {
	const block = document.getElementById('selectedRecentMod'); // Контейнер отдельного блока выбранного мода
	if (!block) {
		return;
	}
	block.innerHTML = '<div class="selected-recent-loading">Загрузка выбранного мода...</div>';
}

// Функция отображения ошибки выбранного мода.
function showSelectedRecentModError(message) {
	const block = document.getElementById('selectedRecentMod'); // Контейнер отдельного блока выбранного мода
	if (!block) {
		return;
	}
	block.innerHTML = `<div class="selected-recent-error">${escapeHtml(message)}</div>`;
}

// Функция расчёта общего числа страниц.
function getTotalPages() {
	if (!Array.isArray(modIds) || modIds.length === 0) {
		return 0;
	}
	return Math.ceil(modIds.length / ITEMS_PER_PAGE);
}

// Функция генерации HTML пагинации.
function renderPagination(totalPages) {
	if (totalPages <= 1) {
		return '';
	}
	const pageItems = buildPaginationItems(totalPages); // Элементы списка пагинации
	let buttonsHtml = '';
	pageItems.forEach(function (item) {
		if (item === 'ellipsis') {
			buttonsHtml += '<span class="pagination-ellipsis">...</span>';
			return;
		}
		const activeClass = item === currentPage ? ' active' : ''; // Класс активной кнопки
		buttonsHtml += `<button type="button" class="pagination-button${activeClass}" data-page="${item}">${item}</button>`;
	});
	return `
		<div class="pagination" id="paginationPanel">
			<button type="button" class="pagination-nav" id="paginationPrev">◄</button>
			<div class="pagination-pages">${buttonsHtml}</div>
			<button type="button" class="pagination-nav" id="paginationNext">►</button>
			<div class="pagination-jump">
				<input type="number" id="pageNumberInput" min="1" max="${totalPages}" placeholder="${currentPage}">
				<button type="button" class="pagination-show-button" id="pageShowButton">Показать</button>
			</div>
		</div>
	`;
}

// Функция построения номеров страниц и многоточий.
function buildPaginationItems(totalPages) {
	if (totalPages <= VISIBLE_PAGES + 2) {
		return buildRange(1, totalPages);
	}
	const pages = [1]; // Список страниц для вывода
	let start = Math.max(2, currentPage - 1); // Начало центрального диапазона
	let end = Math.min(totalPages - 1, currentPage + 1); // Конец центрального диапазона
	while ((end - start + 1) < VISIBLE_PAGES - 2) {
		if (start > 2) {
			start--;
		} else if (end < totalPages - 1) {
			end++;
		} else {
			break;
		}
	}
	if (start > 2) {
		pages.push('ellipsis');
	}
	for (let index = start; index <= end; index++) {
		pages.push(index);
	}
	if (end < totalPages - 1) {
		pages.push('ellipsis');
	}
	pages.push(totalPages);
	return pages;
}

// Функция создания последовательности номеров страниц.
function buildRange(start, end) {
	const range = []; // Диапазон кнопок страниц
	for (let value = start; value <= end; value++) {
		range.push(value);
	}
	return range;
}

// Функция подключения событий интерфейса пагинации.
function bindPaginationEvents() {
	document.addEventListener('click', function (event) {
		const pageButton = event.target.closest('[data-page]'); // Нажатая кнопка номера страницы
		if (pageButton) {
			goToPage(Number(pageButton.dataset.page));
			return;
		}
		if (event.target.id === 'paginationPrev') {
			goToPage(currentPage - 1);
			return;
		}
		if (event.target.id === 'paginationNext') {
			goToPage(currentPage + 1);
			return;
		}
		if (event.target.id === 'pageShowButton') {
			goToInputPage();
		}
	});
	document.addEventListener('keydown', function (event) {
		if (event.target.id === 'pageNumberInput' && event.key === 'Enter') {
			event.preventDefault();
			goToInputPage();
		}
	});
}

// Функция перехода на выбранную страницу.
function goToPage(page) {
	const totalPages = getTotalPages(); // Общее число страниц для перехода
	if (!Number.isFinite(page)) {
		return;
	}
	if (page < 1 || page > totalPages || isPageLoading) {
		return;
	}
	loadPage(page, false);
	window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Функция перехода на страницу из поля ввода.
function goToInputPage() {
	const input = document.getElementById('pageNumberInput'); // Поле ручного ввода страницы
	if (!input) {
		return;
	}
	const targetPage = Number(input.value); // Номер страницы из поля ввода
	if (!Number.isInteger(targetPage)) {
		input.focus();
		return;
	}
	goToPage(targetPage);
	input.value = '';
}

// Функция обновления состояния элементов пагинации.
function updatePaginationControls(totalPages) {
	const prevButton = document.getElementById('paginationPrev'); // Кнопка назад
	const nextButton = document.getElementById('paginationNext'); // Кнопка вперёд
	const pageInput = document.getElementById('pageNumberInput'); // Поле перехода на страницу
	if (!prevButton || !nextButton || !pageInput) {
		return;
	}
	prevButton.disabled = currentPage <= 1 || isPageLoading;
	nextButton.disabled = currentPage >= totalPages || isPageLoading;
	pageInput.max = String(totalPages);
	pageInput.placeholder = String(currentPage);
	pageInput.disabled = isPageLoading;
	const showButton = document.getElementById('pageShowButton'); // Кнопка перехода по номеру страницы
	if (showButton) {
		showButton.disabled = isPageLoading;
	}
}

// Функция подключения событий выпадающего списка последних модов.
function bindRecentModsEvents() {
	document.getElementById('recentModsSelect').addEventListener('change', function () {
		const selectedId = this.value; // Выбранный идентификатор мода
		if (!selectedId) {
			clearSelectedRecentMod();
			return;
		}
		loadRecentMod(selectedId);
	});
}

// Функция получения типа модов из URL.
function getSelectedModsTypeFromUrl() {
	const urlParams = new URLSearchParams(window.location.search); // Параметры текущего URL
	const modsType = urlParams.get('type'); // Значение параметра типа модов
	const allowedModTypes = AllowedMods.map(function (mod) {
		return mod.type;
	}); // Допустимые типы модов из конфигурации
	if (!modsType || !allowedModTypes.includes(modsType)) {
		return '';
	}
	return modsType;
}

// Функция отрисовки вариантов типов модов.
function renderModsTypeSelectOptions() {
	const select = document.getElementById('modsTypeSelect'); // Выпадающий список типов модов
	if (!select) {
		return;
	}
	let optionsHtml = '<option value="">Все моды</option>';
	AllowedMods.forEach(function (mod) {
		optionsHtml += `<option value="${escapeHtml(String(mod.type))}">${escapeHtml(String(mod.title))}</option>`;
	});
	select.innerHTML = optionsHtml;
}

// Функция применения выбранного типа модов в выпадающем списке.
function applyModsTypeSelectValue() {
	const select = document.getElementById('modsTypeSelect'); // Выпадающий список типов модов
	if (!select) {
		return;
	}
	select.value = selectedModsType;
}

// Функция обновления URL при смене типа модов.
function updateModsTypeInUrl(modsType) {
	const currentUrl = new URL(window.location.href); // Текущий URL страницы
	if (modsType) {
		currentUrl.searchParams.set('type', modsType);
	} else {
		currentUrl.searchParams.delete('type');
	}
	window.location.href = currentUrl.toString();
}

// Функция подключения событий выпадающего списка типов модов.
function bindModsTypeEvents() {
	const select = document.getElementById('modsTypeSelect'); // Выпадающий список типов модов
	if (!select) {
		return;
	}
	select.addEventListener('change', function () {
		const modsType = this.value; // Новый выбранный тип модов
		updateModsTypeInUrl(modsType);
	});
}

// Функция отрисовки списка последних модов.
function renderRecentModsSelect() {
	const select = document.getElementById('recentModsSelect'); // Выпадающий список последних модов
	if (!select) {
		return;
	}
	let optionsHtml = '<option value="">Недавние</option>';
	recentMods.forEach(function (modId) {
		optionsHtml += `<option value="${escapeHtml(String(modId))}">${escapeHtml(String(modId))}</option>`;
	});
	select.innerHTML = optionsHtml;
	select.disabled = recentMods.length === 0;
	updateRecentModsSelection();
}

// Функция синхронизации выбранного пункта списка последних модов.
function updateRecentModsSelection() {
	const select = document.getElementById('recentModsSelect'); // Выпадающий список последних модов
	if (!select) {
		return;
	}
	select.value = selectedRecentModId && recentMods.includes(selectedRecentModId) ? selectedRecentModId : '';
}

// Функция сброса списка последних модов.
function resetRecentModsSelect() {
	const select = document.getElementById('recentModsSelect'); // Выпадающий список для очистки
	if (!select) {
		return;
	}
	select.innerHTML = '<option value="">Недавние</option>';
	select.disabled = true;
}

function showError(message) {
	hideLoadingNewWeapon();
	document.getElementById('loginblock').classList.remove('hidden');
	document.getElementById('loginActions').classList.add('hidden');
	hideToolbar();
	clearSelectedRecentMod();
	const errorEl = document.getElementById('authError');
	errorEl.textContent = '⚠ ' + message;
	errorEl.classList.remove('hidden');
}

function escapeHtml(str) {
	if (!str) {
		return '';
	}
	return String(str).replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"');
}

async function downloadAndSaveJSON(modName, url, localStorageKey, openURL) {
	try {
		const image = document.getElementById('image' + modName); // Превью мода для индикации загрузки
		const lastImage = image ? image.src : null; // Сохранённое превью до загрузки
		if (image) {
			image.src = 'images/loadingblack.png';
		}
		const response = await fetch(url);
		if (image && lastImage) {
			image.src = lastImage;
		}
		if (!response.ok) {
			console.error(`Ошибка загрузки: ${response.status}`);
			alert(`Ошибка загрузки: ${response.status}`);
			return false;
		}
		const data = await response.json(); // Загруженные данные json-файла
		localStorage.setItem(localStorageKey, JSON.stringify(data));
		if (openURL) {
			window.open(openURL, '_blank');
		}
		return true;
	} catch (error) {
		console.error('Произошла ошибка:', error);
		alert('Произошла ошибка:', error);
		return false;
	}
}

function handleSelectChange(select) {
	var selectedValue = select.value; // Выбранное действие пользователя
	if (selectedValue === 'action') {
		return;
	}
	var selectedOption = select.options[select.selectedIndex]; // Выбранный пункт списка действий
	var url = selectedOption.getAttribute('data-url'); // Адрес json-файла мода
	var modName = select.getAttribute('modname'); // Идентификатор мода
	var modType = select.getAttribute('modtype'); // Тип мода

	if (selectedValue === 'download') {
		const link = document.createElement('a'); // Временная ссылка для скачивания
		link.href = url;
		link.download = url.split('/').pop();
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	} else if (selectedValue === 'edit') {
		if (!url) {
			select.value = 'action';
			return;
		}
		const selectedModConfig = AllowedMods.find(function (mod) {
			return mod.type === modType;
		}); // Конфигурация выбранного типа мода
		if (!selectedModConfig) {
			alert('Error #811: ' + modType);
			select.value = 'action';
			return;
		}
		downloadAndSaveJSON(modName, url, 'editedWeapon', window.location.href.replace('/list', '/' + selectedModConfig.editor));
	} else if (selectedValue === 'remove') {
		const confirmed = confirm(modName + ' - ' + tr('Удалить мод?')); // Подтверждение удаления мода
		if (!confirmed) {
			select.value = 'action';
			return;
		}
		if (!token) {
			alert('Ошибка: данные авторизации потеряны. Перезагрузите страницу.');
			select.value = 'action';
			return;
		}
		const image = document.getElementById('image' + modName); // Превью удаляемого мода
		const lastImage = image ? image.src : null; // Сохранённое превью удаляемого мода
		if (image) {
			image.src = 'images/loadingblack.png';
		}
		fetch(atob(server), {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				action: 'remove',
				token: token,
				id: modName
			})
		}).then(function (response) {
			if (!response.ok) {
				return response.json().then(function (data) {
					throw new Error(data.message || 'Ошибка сервера');
				});
			}
			return response.json();
		}).then(function (data) {
			if (data.success) {
				modIds = modIds.filter(function (id) {
					return String(id) !== String(modName);
				});
				recentMods = recentMods.filter(function (id) {
					return String(id) !== String(modName);
				});
				delete recentModCache[String(modName)];
				if (selectedRecentModId === String(modName)) {
					clearSelectedRecentMod();
				}
				pageCache = {};
				renderRecentModsSelect();
				const totalPages = getTotalPages(); // Общее число страниц после удаления
				if (totalPages === 0) {
					renderEmptyList();
					return;
				}
				if (currentPage > totalPages) {
					currentPage = totalPages;
				}
				loadPage(currentPage, true);
			} else {
				if (image && lastImage) {
					image.src = lastImage;
				}
				alert('Ошибка: ' + (data.message || 'Неизвестная ошибка'));
			}
		}).catch(function (error) {
			if (image && lastImage) {
				image.src = lastImage;
			}
			alert('Ошибка браузера:\n' + error.message);
		});
	}

	select.value = 'action';
}
