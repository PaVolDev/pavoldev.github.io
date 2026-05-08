//Добавление объектов персонажа в сцену
//Объект "man" - корневой объект персонажа
let newBody  = new SceneObject("man");
newBody.parent = "";
newBody.texture = "";
newBody.localPosition = { x: -1, y: 1 };
newBody.localAngle = -15;
newBody.sortingOrder = 10;
newBody.pixelPerUnit = 50;
newBody.pivotPoint = { x: 0.5, y: 0.5 };
newBody.enabled = true;
newBody.isActive = true;
newBody.canChangePivot = false;
newBody.canChangeLocalAngle = true;
newBody.canMove = true;
scene.addObject(newBody);

//Объект  "body" - тело персонажа
let body = new SceneObject("body");
body.parent = "man";
body.texture = "images/body.png";
body.localPosition = { x: 0, y: 0 };
body.localAngle = 0;
body.sortingOrder = 10;
body.pixelPerUnit = 50;
body.pivotPoint = { x: 0.45, y: 0.085 };
body.enabled = true;
body.isActive = true;
body.canChangePivot = false;
body.canChangeLocalAngle = true;
body.canMove = false;
scene.addObject(body);

//Объект  "head" - голова персонажа
let head = new SceneObject("head");
head.parent = "body";
head.texture = "images/head.png";
head.localPosition = { x: 0.1, y: -1.88 };
head.localAngle = 0;
head.sortingOrder = 15;
head.pixelPerUnit = 50;
head.pivotPoint = { x: 0.385, y: 0.135 };
head.enabled = true;
head.isActive = true;
head.canChangePivot = false;
head.canChangeLocalAngle = true;
head.canMove = false;
scene.addObject(head);

//Объект  "weaponParent" - родитель оружия
let weaponParent = new SceneObject("weaponParent");
weaponParent.parent = "body";
weaponParent.texture = "images/weaponParent.png";
weaponParent.localPosition = { x: -0.2, y: -1.54 };
weaponParent.localAngle = 15;
weaponParent.sortingOrder = 10;
weaponParent.pixelPerUnit = 50;
weaponParent.pivotPoint = { x: 0.5, y: 0.5 };
weaponParent.enabled = true;
weaponParent.isActive = true;
weaponParent.canChangePivot = false;
weaponParent.canChangeLocalAngle = true;
weaponParent.canMove = false;
scene.addObject(weaponParent);

//Объект  "arm" - рука (плечо)
let arm = new SceneObject("arm");
arm.parent = "weaponParent";
arm.texture = "images/arm.png";
arm.localPosition = { x: 0, y: 0 };
arm.localAngle = 0;
arm.sortingOrder = 19;
arm.pixelPerUnit = 50;
arm.pivotPoint = { x: 0.183, y: 0.5 };
arm.enabled = true;
arm.isActive = true;
arm.canChangePivot = false;
arm.canChangeLocalAngle = true;
arm.canMove = false;
scene.addObject(arm);

//Объект  "forearm" - предплечье
let forearm = new SceneObject("forearm");
forearm.parent = "arm";
forearm.texture = "images/forearm.png";
forearm.localPosition = { x: 0.8, y: 0 };
forearm.localAngle = 0;
forearm.sortingOrder = 21;
forearm.pixelPerUnit = 50;
forearm.pivotPoint = { x: 0.18, y: 0.45 };
forearm.enabled = true;
forearm.isActive = true;
forearm.canChangePivot = false;
forearm.canChangeLocalAngle = true;
forearm.canMove = false;
scene.addObject(forearm);

//Объект  "fingers" - пальцы
let fingers = new SceneObject("fingers");
fingers.parent = "forearm";
fingers.texture = "images/fingers.png";
fingers.localPosition = { x: 0.75, y: 0 };
fingers.localAngle = 0;
fingers.sortingOrder = 20;
fingers.pixelPerUnit = 50;
fingers.pivotPoint = { x: 0.2, y: 0.4 };
fingers.enabled = true;
fingers.isActive = true;
fingers.canChangePivot = false;
fingers.canChangeLocalAngle = true;
fingers.canMove = false;
scene.addObject(fingers);

//Объект "man/body/weaponParent/arm/forearm/fingers/оружие" - оружие
let weapon = new SceneObject("оружие");
weapon.parent = "fingers";
weapon.texture = "images/weapon.png";
weapon.localPosition = { x: 0.33, y: -0.12 };
weapon.localAngle = 0;
weapon.sortingOrder = 18;
weapon.pixelPerUnit = 100;
weapon.pivotPoint = { x: 0.35, y: 0.47 };
weapon.enabled = true;
weapon.isActive = true;
weapon.canChangePivot = true;
weapon.canChangeLocalAngle = true;
weapon.canMove = true;
scene.addObject(weapon);

//Объект  "magazine" - магазин
let magazine = new SceneObject("magazine");
magazine.parent = "оружие";
magazine.texture = "";
magazine.localPosition = { x: 0, y: 0 };
magazine.localAngle = 0;
magazine.sortingOrder = 17;
magazine.pixelPerUnit = 100;
magazine.pivotPoint = { x: 0.5, y: 0.5 };
magazine.enabled = true;
magazine.isActive = true;
magazine.canChangePivot = false;
magazine.canChangeLocalAngle = true;
magazine.canMove = false;
scene.addObject(magazine);

//Объект  "arm2" - вторая рука (плечо)
let arm2 = new SceneObject("arm2");
arm2.parent = "weaponParent";
arm2.texture = "images/arm.png";
arm2.localPosition = { x: 0.45, y: 0 };
arm2.localAngle = 0;
arm2.sortingOrder = 0;
arm2.pixelPerUnit = 50;
arm2.pivotPoint = { x: 0.183, y: 0.5 };
arm2.enabled = true;
arm2.isActive = true;
arm2.canChangePivot = false;
arm2.canChangeLocalAngle = true;
arm2.canMove = false;
scene.addObject(arm2);

//Объект  "forearm2" - второе предплечье
let forearm2 = new SceneObject("forearm2");
forearm2.parent = "arm2";
forearm2.texture = "images/forearm.png";
forearm2.localPosition = { x: 0.85, y: 0 };
forearm2.localAngle = 0;
forearm2.sortingOrder = 0;
forearm2.pixelPerUnit = 50;
forearm2.pivotPoint = { x: 0.18, y: 0.45 };
forearm2.enabled = true;
forearm2.isActive = true;
forearm2.canChangePivot = false;
forearm2.canChangeLocalAngle = true;
forearm2.canMove = false;
scene.addObject(forearm2);

//Объект  "fingers2" - вторые пальцы
let fingers2 = new SceneObject("fingers2");
fingers2.parent = "forearm2";
fingers2.texture = "images/fingers.png";
fingers2.localPosition = { x: 0.8, y: 0 };
fingers2.localAngle = 0;
fingers2.sortingOrder = -1;
fingers2.pixelPerUnit = 50;
fingers2.pivotPoint = { x: 0.2, y: 0.4 };
fingers2.enabled = true;
fingers2.isActive = true;
fingers2.canChangePivot = false;
fingers2.canChangeLocalAngle = true;
fingers2.canMove = false;
scene.addObject(fingers2);

//Объект  "magazine2" - второй магазин
let magazine2 = new SceneObject("magazine2");
magazine2.parent = "fingers2";
magazine2.texture = "";
magazine2.localPosition = { x: 0, y: 0 };
magazine2.localAngle = 0;
magazine2.sortingOrder = 0;
magazine2.pixelPerUnit = 100;
magazine2.pivotPoint = { x: 0.5, y: 0.5 };
magazine2.enabled = true;
magazine2.isActive = true;
magazine2.canChangePivot = false;
magazine2.canChangeLocalAngle = true;
magazine2.canMove = true;
scene.addObject(magazine2);

//ОРУЖИЕ
//Объект  "man/body/weaponParent/arm3" - вторая рука (плечо)
let arm3 = new SceneObject("arm3");
arm3.parent = "weaponParent";
arm3.texture = "";
arm3.localPosition = { x: 0, y: 0 };
arm3.localAngle = 0;
arm3.sortingOrder = 19;
arm3.pixelPerUnit = 50;
arm3.pivotPoint = { x: 0.183, y: 0.5 };
arm3.enabled = true;
arm3.isActive = true;
arm3.canChangePivot = false;
arm3.canChangeLocalAngle = true;
arm3.canMove = false;
scene.addObject(arm3);

//Объект  "forearm3" - предплечье
let forearm3 = new SceneObject("forearm3");
forearm3.parent = "arm3";
forearm3.texture = "";
forearm3.localPosition = { x: 0.8, y: 0 };
forearm3.localAngle = 0;
forearm3.sortingOrder = 21;
forearm3.pixelPerUnit = 50;
forearm3.pivotPoint = { x: 0.18, y: 0.45 };
forearm3.enabled = true;
forearm3.isActive = true;
forearm3.canChangePivot = false;
forearm3.canChangeLocalAngle = true;
forearm3.canMove = false;
scene.addObject(forearm3);

//Объект  "fingers3" - пальцы
let fingers3 = new SceneObject("fingers3");
fingers3.parent = "forearm3";
fingers3.texture = "";
fingers3.localPosition = { x: 0.75, y: 0 };
fingers3.localAngle = 0;
fingers3.sortingOrder = 20;
fingers3.pixelPerUnit = 50;
fingers3.pivotPoint = { x: 0.2, y: 0.4 };
fingers3.enabled = true;
fingers3.isActive = true;
fingers3.canChangePivot = false;
fingers3.canChangeLocalAngle = true;
fingers3.canMove = false;
scene.addObject(fingers3);

//Объект  "man/body/weaponParent/arm3/forearm3/fingers3/оружие3"
let weapon3 = new SceneObject("оружие3");
weapon3.parent = "fingers3";
weapon3.texture = null;
weapon3.localPosition = { x: 0.33, y: -0.12 };
weapon3.localAngle = 0;
weapon3.sortingOrder = 0;
weapon3.pixelPerUnit = 100;
weapon3.pivotPoint = { x: 0.5, y: 0.5 };
weapon3.enabled = true;
weapon3.isActive = true;
weapon3.canChangePivot = true;
weapon3.canChangeLocalAngle = true;
weapon3.canMove = true;
scene.addObject(weapon3);

//Объект  "magazine3" в третьей руке
let magazine3 = new SceneObject("magazine3");
magazine3.parent = "оружие3";
magazine3.texture = "";
magazine3.localPosition = { x: 0, y: 0 };
magazine3.localAngle = 0;
magazine3.sortingOrder = 0;
magazine3.pixelPerUnit = 100;
magazine3.pivotPoint = { x: 0.5, y: 0.5 };
magazine3.enabled = true;
magazine3.isActive = true;
magazine3.canChangePivot = false;
magazine3.canChangeLocalAngle = true;
magazine3.canMove = true;
scene.addObject(magazine3);



updateImageCache();
refreshHierarchy();
renderScene();