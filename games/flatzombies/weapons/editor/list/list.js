const server = 'aHR0cHM6Ly9oNTEzNTguc3J2NS50ZXN0LWhmLnJ1L21vZHMvdXNlci1saXN0LnBocA';
document.getElementById('loginblock').addEventListener('submit', async function (e) {
	e.preventDefault();

	const login = document.getElementById('login').value.trim();
	const password = document.getElementById('password').value.trim();

	if (!login || !password) return;

	// Скрываем форму и ошибку, показываем анимацию
	document.getElementById('loginblock').classList.add('hidden');
	document.getElementById('authError').classList.add('hidden');
	document.getElementById('authorizationStatus').classList.remove('hidden');

	try {
		const response = await fetch(atob(server), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				action: 'login',
				login: login,
				password: password
			})
		});

		const data = await response.json();

		if (data.success) {
			// Сохраняем логин+пароль в память
			currentUser.login = login;
			currentUser.password = password;
			showWeaponsList(data.weapons);
		} else {
			showError(data.message || 'Неверный логин или пароль');
		}

	} catch (error) {
		showError('Ошибка соединения с сервером');
		console.error(error);
	}
});

// Храним в памяти после успешного входа
let currentUser = {
	login: null,
	password: null
};


function showWeaponsList(weapons) {
	document.getElementById('authorizationStatus').classList.add('hidden');

	const list = document.getElementById('list');

	if (!weapons || weapons.length === 0) {
		list.innerHTML = '<p style="text-align:center; color:#aaa;">Файлы не найдены</p>';
		return;
	}

	let html = '<div class="gallery">';
	weapons.forEach(weapon => {
		const id = weapon.id;
		const modType = weapon.modType ?? '';
		const icon = weapon.iconBase64 ?? '';
		const fileUrl = weapon.fileUrl ?? '';
		const likes = weapon.likes ?? 0;
		const dislikes = weapon.dislikes ?? 0;
		const rating = weapon.raiting ?? 0;
		const report = weapon.report ?? 0;

		const reportHtml = report >= 1 ? `<img src="images/warning.png" alt="Жалоба"><span class="count">${report}</span>` : '';
		html += `
            <div class="item">
                <img src="${icon}"
                     alt="Иконка ${escapeHtml(String(id))}"
                     id="image${escapeHtml(String(id))}"
                     class="preview">

                <div class="filename">${escapeHtml(String(id))}</div>

                <div class="info">
                    <span class="rating-item">
                        <img src="images/plays.png" alt="Рейтинг">
                        <span class="count">${rating}</span>
                    </span>
                    <span class="rating-item">
                        <img src="images/like.png" alt="Лайк">
                        <span class="count">${likes}</span>
                    </span>
                    <span class="rating-item">
                        ${reportHtml}
                    </span>
                    <span class="rating-item">
                        <img src="images/dislike.png" alt="Дизлайк">
                        <span class="count">${dislikes}</span>
                    </span>
                </div>

                <div class="actions" id="actions${id}">
                    <select name="options" onchange="handleSelectChange(this)" modname="${escapeHtml(String(id))}" modtype="${escapeHtml(modType)}">
                        <option value="action">Действия...</option>
                        <option value="download" data-url="${escapeHtml(fileUrl)}">📄 Файл</option>
                        <option value="edit"     data-url="${escapeHtml(fileUrl)}">📝 Редактировать</option>
                        <option value="remove">❌ Удалить</option>
                    </select>
                </div>
            </div>
        `;
	});

	html += '</div>';
	list.innerHTML = html;
}


function showError(message) {
	// Скрываем анимацию, возвращаем форму
	document.getElementById('authorizationStatus').classList.add('hidden');
	document.getElementById('loginblock').classList.remove('hidden');

	// Показываем блок ошибки с текстом
	const errorEl = document.getElementById('authError');
	errorEl.textContent = '⚠ ' + message;
	errorEl.classList.remove('hidden');
}


// Защита от XSS
function escapeHtml(str) {
	if (!str) return '';
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}



//url - Путь к вашему файлу - 'https://api.example.com/data.json'
//Объем localStorage ограничен примерно 5 МБ. Если ваш JSON-файл больше (например, огромный список товаров), используйте IndexedDB.
async function downloadAndSaveJSON(modName, url, localStorageKey, openURL) {
	try {
		const image = document.getElementById("image" + modName);
		const lastImage = image ? image.src : null;
		if (image) image.src = 'images/loading.png';
		// 1. Скачиваем файл
		const response = await fetch(url);
		if (image && lastImage) image.src = lastImage;
		if (!response.ok) {
			console.error(`Ошибка загрузки: ${response.status}`);
			alert(`Ошибка загрузки: ${response.status}`);
			return false;
		}
		// 2. Получаем данные в формате JSON (объекта)
		const data = await response.json();
		localStorage.setItem(localStorageKey, JSON.stringify(data)); // 3 и 4. Превращаем в строку и записываем в localStorage
		if (openURL) {
			window.open(openURL, "_blank");
		}
		return true;
	} catch (error) {
		console.error('Произошла ошибка:', error);
		alert('Произошла ошибка:', error);
		return false;
	}
}



function handleSelectChange(select) {
	var selectedValue = select.value;

	if (selectedValue === "action") return;

	var selectedOption = select.options[select.selectedIndex];
	var url = selectedOption.getAttribute("data-url");
	var modName = select.getAttribute("modname");
	var modType = select.getAttribute("modtype");

	if (selectedValue === "download") {
		if (url) window.open(url, "_blank");

	} else if (selectedValue === "edit") {
		if (!url) { select.value = "action"; return; }

		if (modType === "weapon") {
			downloadAndSaveJSON(modName, url, 'editedWeapon', window.location.href.replace('/list', ''));
		} else if (modType === "cartridge") {
			downloadAndSaveJSON(modName, url, 'editedWeapon', window.location.href.replace('/list', '/ammo'));
		} else {
			alert("Error #811: " + modType);
		}

	} else if (selectedValue === "remove") {
		const confirmed = confirm("Удалить мод '" + modName + "'?!");
		if (!confirmed) {
			select.value = "action";
			return;
		}

		// Проверяем что credentials есть в памяти
		if (!currentUser.login || !currentUser.password) {
			alert("Ошибка: данные авторизации потеряны. Перезагрузите страницу.");
			select.value = "action";
			return;
		}

		const image = document.getElementById("image" + modName);
		const lastImage = image ? image.src : null;
		if (image) image.src = 'images/loading.png';

		// Отправляем POST с логином+паролем и действием
		fetch(atob(server), {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				action: 'remove',
				login: currentUser.login,
				password: currentUser.password,
				id: modName
			})
		}).then(response => {
			if (!response.ok) {
				return response.json().then(data => {
					throw new Error(data.message || 'Ошибка сервера');
				});
			}
			return response.json();
		}).then(data => {
			if (data.success) {
				if (image) image.src = 'images/removed.png';
				document.getElementById("status" + modName).innerHTML = '❌';
				document.getElementById("actions" + modName).style.display = 'none';
			} else {
				if (image && lastImage) image.src = lastImage;
				alert("Ошибка: " + (data.message || 'Неизвестная ошибка'));
			}
		})
			.catch(error => {
				if (image && lastImage) image.src = lastImage;
				alert("Ошибка браузера:\n" + error.message);
			});
	}

	select.value = "action";
}


