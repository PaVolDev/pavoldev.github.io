// sceneData.js
let sceneObjects = [
    {
        name: "body",
        parent: "",
        texture: "images/test.png",
        localPosition: { x: 0.4, y: 0.2 },
        localAngle: 0,
        pixelPerUnit: 100,
        pivotPoint: { x: 0.5, y: 0.5 },
		enabled: true
    },
    {
        name: "hand",
        parent: "body",
        texture: "images/test.png",
        localPosition: { x: 0.1, y: 0.2 },
        localAngle: 0,
        pixelPerUnit: 100,
        pivotPoint: { x: 0.5, y: 0.5 },
		enabled: true
    },
    {
        name: "leg",
        parent: "body",
        texture: "images/test.png",
        localPosition: { x: 0, y: 0.5 },
        localAngle: 0,
        pixelPerUnit: 100,
        pivotPoint: { x: 0.5, y: 0.9 },
		enabled: true
    },
    {
        name: "fingers",
        parent: "hand",
        texture: "images/test.png",
        localPosition: { x: 0, y: 0.5 },
        localAngle: 0,
        pixelPerUnit: 100,
        pivotPoint: { x: 0.5, y: 0.9 },
		enabled: true
    },
];
