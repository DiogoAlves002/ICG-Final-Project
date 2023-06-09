"use strict";




//  Adapted from Daniel Rohmer tutorial
//
// 		https://imagecomputing.net/damien.rohmer/teaching/2019_2020/semester_1/MPRI_2-39/practice/threejs/content/000_threejs_tutorial/index.html
//
//  And from an example by Pedro Iglésias
//
// 		J. Madeira - April 2021


// To store the scene graph, and elements usefull to rendering the scene
const sceneElements = {
    isStartMenuOn : true,
    startMenu : [],

    isGamePaused : false,
    pauseBlurPlane : null,
    pauseMenu : null,

    sceneGraph: null,
    camera: null,
    control: null,
    renderer: null,

    tiles : null,
    ground : null,

    endingTile : null,
    path : [],

    towers : [],
    selectionMenu : [],
    selectedTowerType : null,

    enemies : [],
    torches : [],
    lightUp : false,

    torchesMenu : [],
    settingsMenu : [],

    playerHealth : 10,
    playerCoins : 5,
    towersCost : {},
};


// Functions are called
//  1. Initialize the empty scene
//  2. Add elements within the scene
//  3. Animate
helper.initEmptyScene(sceneElements);
loadStartMenu(sceneElements.sceneGraph);

// HANDLING EVENTS

// Event Listeners

window.addEventListener('resize', resizeWindow);

//To keep track of the keyboard - WASD
let keyD = false, keyA = false, keyS = false, keyW = false;
document.addEventListener('keydown', onDocumentKeyDown, false);
document.addEventListener('keyup', onDocumentKeyUp, false);

// Update render image size and camera aspect when the window is resized
function resizeWindow(eventParam) {
    const width = window.innerWidth;
    const height = window.innerHeight;

    sceneElements.camera.aspect = width / height;
    sceneElements.camera.updateProjectionMatrix();

    sceneElements.renderer.setSize(width, height);
}

function onDocumentKeyDown(event) {
    switch (event.keyCode) {
        case 68: //d
            keyD = true;
            break;
        case 83: //s
            keyS = true;
            break;
        case 65: //a
            keyA = true;
            break;
        case 87: //w
            keyW = true;
            break;
    }
}
function onDocumentKeyUp(event) {
    switch (event.keyCode) {
        case 68: //d
            keyD = false;
            break;
        case 83: //s
            keyS = false;
            break;
        case 65: //a
            keyA = false;
            break;
        case 87: //w
            keyW = false;
            break;
        case 27: //esc
            sceneElements.isGamePaused = ! sceneElements.isGamePaused; // toggle
            break;
    }
}


function newCube(x, y, z, size, color) {
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cubeMaterial = new THREE.MeshPhongMaterial({ color: color });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

    cube.position.set(x, y, z);
    cube.scale.set(size, size, size);

    cube.castShadow = true;
    cube.receiveShadow = true;

    return cube;
}

function newTower(x, y, z, type, menu){
    let tower = null;
    switch(type){
        case 'small':
            tower =  newTowerSmall(x, y, z);
            tower.damage = 0.005;
            tower.cost = 1;
            tower.type = 'small';
            break;
        case 'medium':
            tower = newTowerMedium(x, y, z);
            tower.damage = 0.02;
            tower.cost = 3;
            tower.type = 'medium';
            break;
        case 'big':
            tower = newTowerBig(x, y, z);
            tower.damage = 0.04;
            tower.cost = 5;
            tower.type = 'big';
            break;
    }

    tower.orientation = 0;
    tower.rotateOnAxis(new THREE.Vector3(1, 0, 0), -Math.PI / 2);

    if (menu){ // this tower is part of the selection menu
        sceneElements.selectionMenu.push(tower);
    }else{ // this tower is part of the game
        sceneElements.towers.push(tower);
    }
    return tower;
}

function newTowerSmall(x, y, z){
    const size = 0.3;
    const position_y = size/2;


    return newArrow(x, position_y, z, size, 0x58CFFD);
}

function newTowerMedium(x, y, z){
    const size = 0.5;
    const position_y = size/2;

    return newArrow(x, position_y, z, size, 0x7FB366);
}

function newTowerBig(x, y, z){
    const size = 0.7;
    const position_y = size/2;

    return newArrow(x, position_y, z, size, 0x0f4ede);
}



function newArrow(x, y, z, size, color){
    const arrowGeometry = new THREE.ConeGeometry(size, 1, 4);
    const arrowMaterial = new THREE.MeshPhongMaterial({ color: color });
    const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);

    arrow.position.set(x, y, z);
    arrow.scale.set(size, size, size);

    arrow.castShadow = true;
    arrow.receiveShadow = true;

    return arrow;
}



function newTorch(x, y, z){
    const size = 0.2;
    const position_y = size/2;

    let torch = new THREE.Group();

    // Torch Handle
    const handleHeight = 0.2;
    const handleWidth = 0.04;
    const torchHandleGeometry = new THREE.CylinderGeometry(handleWidth, handleWidth, handleHeight, 32);
    const torchHandleMaterial = new THREE.MeshPhongMaterial({ color: 0xb37120 });
    const torchHandle = new THREE.Mesh(torchHandleGeometry, torchHandleMaterial);

    torchHandle.position.set(x, position_y+size/2, y+size);

    torchHandle.castShadow = true;
    torchHandle.receiveShadow = true;


    // Torch Head
    const headHeight = 0.04;
    const litColor = new THREE.Color(0xffd700);
    const notLitColor = new THREE.Color(0x5c5a54);
    const torchHeadGeometry = new THREE.CylinderGeometry(headHeight, headHeight, headHeight, 32);
    const torchHeadMaterial = new THREE.MeshPhongMaterial({ color: 0x5c5a54 });
    
    torchHeadMaterial.emissive = (sceneElements.lightUp) ? litColor : notLitColor; // object color dispite the scene not having light
    const torchHead = new THREE.Mesh(torchHeadGeometry, torchHeadMaterial);

    torchHead.notLitColor = notLitColor;
    torchHead.litColor = litColor;

    torchHead.position.set(x, torchHandle.position.y+handleHeight/2+headHeight/2, y+size);

    torchHead.castShadow = true;
    torchHead.receiveShadow = true;



    // light
    const light = new THREE.PointLight(0xffd700, 1, 1.5);
    light.position.set(x, position_y + size + size/10, y+size);
    light.castShadow = true;
    light.shadow.mapSize.width = 512/8;  // default
    light.shadow.mapSize.height = 512/8; // default
    light.intensity = (sceneElements.lightUp) ? 1 : 0;

    torch.add(torchHandle);
    torch.add(torchHead);
    torch.add(light);

    // raycaster doesnt work with groups
    sceneElements.torchesMenu.push(torchHandle);
    sceneElements.torchesMenu.push(torchHead);

    torch.lit = (sceneElements.lightUp) ? true : false;


    return torch;
}


function toggleLights(){
    // TODO: add lights to towers
    for (let i = 0; i < sceneElements.torches.length; i++){
        if (sceneElements.torches[i].lit){
            sceneElements.torches[i].children[1].material.emissive = sceneElements.torches[i].children[1].notLitColor; // torch head color
            sceneElements.torches[i].children[2].intensity = 0; // torch light
            sceneElements.torches[i].lit = false;
            sceneElements.lightUp = false;
        }else{
            sceneElements.torches[i].children[1].material.emissive = sceneElements.torches[i].children[1].litColor; // torch head color
            sceneElements.torches[i].children[2].intensity = 1; // torch light
            sceneElements.torches[i].lit = true;
            sceneElements.lightUp = true;
        }
    }
}


let cenas = 0;
function newEnemy(x, y, z, type){
    let enemyWithTorch = new THREE.Group();
    let enemy = null;
    let torch = newTorch(x, y, z);


    switch(type){
        case 'small':
            enemy =  newEnemySmall(x, y, z);
            enemy.damage = 0.1;
            enemy.health = 1;
            enemy.coins = 1;
            break;
        case 'medium':
            enemy = newEnemyMedium(x, y, z);
            enemy.damage = 0.2;
            enemy.health = 2;
            enemy.coins = 3;
            torch.position.z = 0.1;
            torch.position.y = 0.2;
            break;
        case 'big':
            enemy = newEnemyBig(x, y, z);
            enemy.damage = 0.4;
            enemy.health = 4;
            enemy.coins = 5;
            torch.position.z = 0.2;
            torch.position.y = 0.4;
            break;
    }

    enemy.currentTile = sceneElements.path[0]; // this is used to calculate its movement
    enemy.tileUnder = sceneElements.path[0]; // this is used to calculate if its being shot
    enemy.currentPathTileIndex = sceneElements.path[0].pathIndex;
    enemyWithTorch.add(enemy);
    enemyWithTorch.add(torch);
    
    sceneElements.sceneGraph.add(enemyWithTorch);
    sceneElements.torches.push(torch);
    return enemyWithTorch;

}

function newEnemySmall(x, y, z){
    const size = 0.3;
    const position_y = size/2;

    return newCube(x, position_y, y, size, 'rgb(063, 136, 143)');
}

function newEnemyMedium(x, y, z){
    const size = 0.5;
    const position_y = size/2;

    return newCube(x, position_y, y, size, 'rgb(044, 085, 069)');
}

function newEnemyBig(x, y, z){
    const size = 0.7;
    const position_y = size/2;

    return newCube(x, position_y, y, size, 'rgb(037, 040, 080)');
}



function decreasePlayerHealth(value){
    let health = sceneElements.playerHealth;
    let healthBar = sceneElements.sceneGraph.getObjectByName("playerHealthBar");
    let healthBarScale = healthBar.scale;


    if (health - value * 10 <= 0){ // game over
        sceneElements.playerHealth = 0;

        healthBarScale.x = 0;
        let healthBarCase= sceneElements.sceneGraph.getObjectByName("playerHealthBarCase");
        let healthBarCaseScale = healthBarCase.scale.x;
 
        healthBar.position.x = -healthBarCaseScale - healthBarCaseScale/2 ;
        return;
    }

    
    sceneElements.playerHealth -= value * 10;

    healthBarScale.x -= value;
    healthBar.position.x -= value*1.5;
}











//***************************//
// load start menu
//***************************//
function loadStartMenu(sceneGraph){

    // title
    const color = 'rgb(255, 255, 255)';
    const titleCube = newCube(0, 1, 0, 0.8, color);
    titleCube.scale.x = 4.5;
    titleCube.name = "titleCube";

    sceneGraph.add(titleCube);
    sceneElements.startMenu.push(titleCube);

    // titleText

    const fontLoader = new THREE.FontLoader();
    fontLoader.load('./font.json', function (droidFont) {
        const textGeometry = new THREE.TextGeometry('Tower Defense Game', {
            font: droidFont,
            size: 0.3,
            height: 0.1,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.03,
            bevelSize: 0.02,
            bevelSegments: 5
        });
        const textMaterial = new THREE.MeshPhongMaterial({ color: 'rgb(0, 0, 0)' });
        const text = new THREE.Mesh(textGeometry, textMaterial);

        text.position.set(-2, 0.85, 0.3);

        text.name = "titleText";
        text.button = titleCube;
        sceneGraph.add(text);
        sceneElements.startMenu.push(text);
    });




    // startGameButton
    
    const startButton = newCube(-0.8, 0, 0, 0.8, color);
    startButton.scale.x = 2.5;
    startButton.name = "startButton";
    startButton.originalColor = color;

    sceneGraph.add(startButton);
    sceneElements.startMenu.push(startButton);

    // startGameText
    //const fontLoader = new THREE.FontLoader();
    fontLoader.load('./font.json', function (droidFont) {
        const textGeometry = new THREE.TextGeometry('Start Game', {
            font: droidFont,
            size: 0.3,
            height: 0.1,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.03,
            bevelSize: 0.02,
            bevelSegments: 5
        });
        const textMaterial = new THREE.MeshPhongMaterial({ color: 'rgb(0, 0, 0)' });
        const text = new THREE.Mesh(textGeometry, textMaterial);

        text.position.set(-1.8, -0.15, 0.3);

        text.name = "startButtonText"
        text.button = startButton;
        sceneGraph.add(text);
        sceneElements.startMenu.push(text);
    });



    // githubButton
    const githubButton = newCube(1.3, 0, 0, 0.8, color);
    githubButton.scale.x = 1.5;
    githubButton.name = "githubButton";
    githubButton.originalColor = color;

    sceneGraph.add(githubButton);
    sceneElements.startMenu.push(githubButton);

    // githubText
    fontLoader.load('./font.json', function (droidFont) {
        const textGeometry = new THREE.TextGeometry('Github', {
            font: droidFont,
            size: 0.3,
            height: 0.1,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.03,
            bevelSize: 0.02,
            bevelSegments: 5
        });
        const textMaterial = new THREE.MeshPhongMaterial({ color: 'rgb(0, 0, 0)' });
        const text = new THREE.Mesh(textGeometry, textMaterial);

        text.position.set(0.7, -0.15, 0.3);

        text.name = "githubButtonText"
        text.button = githubButton;
        sceneGraph.add(text);
        sceneElements.startMenu.push(text);
    });




}










// Create and insert in the scene graph the models of the 3D scene
function load3DObjects(sceneGraph) {

    const spotLight = sceneGraph.getObjectByName("light");
    sceneElements.sceneGraph.remove(spotLight);



    // ************************** //
    // Create a ground plane
    // ************************** //

    // create the array to store the ground colors
    const ground = [
        [0, 0, 0, 0, 0, 0],
        [1, 2, 0, 0, 0, 0],
        [0, 3, 4, 0, 10, 11],
        [0, 0, 5, 0, 9, 0],
        [0, 0, 6, 7, 8, 0],
        [0, 0, 0, 0, 0, 0],
      ];
    /* const ground = [
        [0, 0, 0, 0, 0],
        [1, 2, 3, 4, 5],
        [0, 0, 0, 0, 6],
        [0, 0, 9, 8, 7],
        [0, 0, 10, 11, 12]
        
      ]; */
    sceneElements.ground = ground;


    const subdivisions = ground.length;
    const planeSize = new THREE.Vector2(subdivisions, subdivisions);
    const tileSize = 1;

    // create the array to store the tiles
    const tiles = [];
    sceneElements.tiles = tiles;
    
    

    var plane = new THREE.Group();


    for (let row = 0; row < subdivisions; row++) {

        // create the vertical lines that separate the tiles
        const verticalLineGeometry = new THREE.BufferGeometry().setFromPoints([ // connects two points
            new THREE.Vector3(-planeSize.x / 2 + row * tileSize, planeSize.y / 2, -0.02), // first point
            new THREE.Vector3(-planeSize.x / 2 + row * tileSize, -planeSize.y / 2, -0.02) // second point
        ]);
        const verticalLineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
        const verticalLine = new THREE.Line(verticalLineGeometry, verticalLineMaterial);
        plane.add(verticalLine);

        // create the horizontal lines that separate the tiles
        const horizontalLineGeometry = new THREE.BufferGeometry().setFromPoints([ // connects two points
            new THREE.Vector3(-planeSize.x / 2, -planeSize.y / 2 + row * (planeSize.y / subdivisions), -0.02), // first point
            new THREE.Vector3(planeSize.x / 2, -planeSize.y / 2 + row * (planeSize.y / subdivisions), -0.02) // second point
        ]);
        const horizontalLineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
        const horizontalLine = new THREE.Line(horizontalLineGeometry, horizontalLineMaterial);
        plane.add(horizontalLine);

        // create the tiles and add them to the tiles array
        for (let col = 0; col < subdivisions; col++) {
            const tileGeometry = new THREE.PlaneGeometry(tileSize, planeSize.y / subdivisions);
            // lambert material
            //const tileMaterial = new THREE.MeshLambertMaterial({  });
            const tileMaterial = new THREE.MeshPhongMaterial({  });
            const single_tile = new THREE.Mesh(tileGeometry, tileMaterial);
            single_tile.position.x = -planeSize.x / 2 + col * tileSize + tileSize / 2;
            single_tile.position.y = -planeSize.y / 2 + row * tileSize + tileSize / 2;
            single_tile.position.z = -0.01 ;

            switch (sceneElements.ground[row][col]) {
                case 0:// grass
                    tileMaterial.color.set(0x2e9c03); // set to green
                    tileMaterial.originalColor = 0x2e9c03;

                    tileMaterial.typeOfGround = 0;
                    break;

                case 1: // starting
                    tileMaterial.color.set(0x4287f5); // set to blue
                    tileMaterial.originalColor = 0x4287f5;

                    tileMaterial.typeOfGround = 1;

                    single_tile.pathIndex = 0;
                    sceneElements.path.push(single_tile);
                    break;

                default: // path
                    tileMaterial.color.set(0xA98307); // set to yellow
                    tileMaterial.originalColor = 0xC6A664;

                    tileMaterial.typeOfGround = 3;

                    sceneElements.endingTile = single_tile;

                    single_tile.pathIndex = sceneElements.ground[row][col] - 1;
                    sceneElements.path.push(single_tile);
                    break;
            }

            single_tile.castShadow = true;
            single_tile.receiveShadow = true;

            // rotate the tile so its facing up
            single_tile.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI);

            single_tile.index = tiles.length;
            single_tile.towerType = null;
            tiles.push(single_tile);
            plane.add(single_tile)
        }
    }

    // sort the path tiles by pathIndex
    sceneElements.path.sort((a, b) => a.pathIndex - b.pathIndex);

    // set the ending tile
    const endingTile = sceneElements.path[sceneElements.path.length - 1];
    endingTile.material.color.set(0xfc6900); // set to orange
    endingTile.material.originalColor = 0xfc6900;


    // set each tile's neighbors
    let currentTile = null;
    let tileNeighbours = [null, null, null, null];
    let tileAbove = null; let tileBelow = null;
    let tileLeft = null; let tileRight = null;

    for (let row = 0; row < subdivisions; row++) {
        for (let col = 0; col < subdivisions; col++) {
            currentTile = tiles[row * subdivisions + col];
            tileNeighbours = [null, null, null, null];

            // follows the order of the towers orientation: 0, 1, 2, 3 
            tileAbove = row > 0 ? tiles[(row - 1) * subdivisions + col] : null;
            tileLeft = col > 0 ? tiles[row * subdivisions + col - 1] : null;
            tileBelow = row < subdivisions - 1 ? tiles[(row + 1) * subdivisions + col] : null;
            tileRight = col < subdivisions - 1 ? tiles[row * subdivisions + col + 1] : null;

            if (tileAbove) tileNeighbours[0] = tileAbove;
            if (tileLeft) tileNeighbours[1] = tileLeft;
            if (tileBelow) tileNeighbours[2] = tileBelow;
            if (tileRight) tileNeighbours[3] = tileRight;

            currentTile.neighbours = tileNeighbours; 
        }
    }

    
    //sceneGraph.add(planeObject);
    sceneGraph.add(plane);

    // rotate the plane so its facing up
    plane.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);





    // ************************** //
    // Create a wooden board
    // ************************** //

    var board = new THREE.Group();
    sceneGraph.add(board);

    const edgeSize = planeSize.x / subdivisions / 2;
    const baseSize = planeSize.x + edgeSize * 2; // the size of the map + half a tile for each side

    // base
    const boardBaseGeometry = new THREE.BoxGeometry(baseSize, 0.2, baseSize);
    const boardBaseMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513, side: THREE.DoubleSide });
    const boardBaseObject = new THREE.Mesh(boardBaseGeometry, boardBaseMaterial);
    boardBaseObject.position.y = -0.5;
    board.add(boardBaseObject);


    // i could probably do this with a loop but its kinda tricky and this works
    const sideHeight = plane.position.y - boardBaseObject.position.y;

    // left
    const boardSideGeometry = new THREE.BoxGeometry(baseSize, sideHeight, edgeSize);
    const boardSideMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513, side: THREE.DoubleSide });
    const boardSideLeftObject = new THREE.Mesh(boardSideGeometry, boardSideMaterial);

    boardSideLeftObject.position.y = board.position.y - sideHeight / 2;
    boardSideLeftObject.position.x = -baseSize / 2 + edgeSize / 2;

    boardSideLeftObject.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI / 2 * 1);
    board.add(boardSideLeftObject);

    // right

    const boardSideRightObject = new THREE.Mesh(boardSideGeometry, boardSideMaterial);
    boardSideRightObject.position.y = board.position.y - sideHeight / 2;
    boardSideRightObject.position.x = baseSize / 2 - edgeSize / 2;

    boardSideRightObject.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI / 2 * 1);
    board.add(boardSideRightObject);


    // back
    const boardSidebackObject = new THREE.Mesh(boardSideGeometry, boardSideMaterial);

    boardSidebackObject.position.y = board.position.y - sideHeight / 2;
    boardSidebackObject.position.z = -baseSize / 2 + edgeSize / 2;

    board.add(boardSidebackObject);


    // front
    const boardSidefrontObject = new THREE.Mesh(boardSideGeometry, boardSideMaterial);

    boardSidefrontObject.position.y = board.position.y - sideHeight / 2;
    boardSidefrontObject.position.z = baseSize / 2 - edgeSize / 2;

    board.add(boardSidefrontObject);




    // ************************** //
    // create a tower selection menu
    // ************************** //

    const towerSelectionMenu = new THREE.Group();
    sceneGraph.add(towerSelectionMenu);

    // base
    const towerSelectionMenuGeometry = new THREE.BoxGeometry(tileSize*2, baseSize-tileSize*2, 0.1);
    const towerSelectionMenuMaterial = new THREE.MeshPhongMaterial({
        color: 0x8B4513
    });
    const towerSelectionMenuObject = new THREE.Mesh(towerSelectionMenuGeometry, towerSelectionMenuMaterial);
    towerSelectionMenuObject.position.x = baseSize - edgeSize;
    towerSelectionMenuObject.position.y = 0;
    towerSelectionMenuObject.position.z = 0;
    towerSelectionMenuObject.receiveShadow = true;

    towerSelectionMenu.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);
    towerSelectionMenu.add(towerSelectionMenuObject);


    // small tower
    const smallTower = newTower(baseSize - edgeSize, 0, 0, "small", true);
    smallTower.position.y = -1.2;
    smallTower.position.z = -0.2;
    towerSelectionMenu.add(smallTower);
    sceneElements.towersCost["small"] = smallTower.cost;

    // medium tower
    const mediumTower = newTower(baseSize - edgeSize, 0, 0, "medium", true);
    mediumTower.position.y = 0;
    mediumTower.position.z = -0.3;
    towerSelectionMenu.add(mediumTower);
    sceneElements.towersCost["medium"] = mediumTower.cost;

    // big tower
    const bigTower = newTower(baseSize - edgeSize, 0, 0, "big", true);
    bigTower.position.y = 1.3;
    bigTower.position.z = -0.4;
    towerSelectionMenu.add(bigTower);
    sceneElements.towersCost["big"] = bigTower.cost;


    // ************************** //
    // Create a "settings" menu
    // ************************** //

    const settingsSelectionMenu = new THREE.Group();
    sceneGraph.add(settingsSelectionMenu);

    // base
    const settingsSelectionMenuGeometry = new THREE.BoxGeometry(tileSize*2, baseSize-tileSize*2, 0.1);
    const settingsSelectionMenuMaterial = new THREE.MeshPhongMaterial({
        color: 0x8B4513
    });
    const settingsSelectionMenuObject = new THREE.Mesh(settingsSelectionMenuGeometry, settingsSelectionMenuMaterial);
    settingsSelectionMenuObject.position.x = - baseSize + edgeSize;
    settingsSelectionMenuObject.position.y = 0;
    settingsSelectionMenuObject.position.z = 0;
    settingsSelectionMenuObject.receiveShadow = true;

    settingsSelectionMenu.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);
    settingsSelectionMenu.add(settingsSelectionMenuObject);


    // torch
    const menuTorch = newTorch(0, 0, 0);
    menuTorch.name = "toggleTorches";
    menuTorch.rotateOnAxis(new THREE.Vector3(1, 0, 0), - Math.PI / 2);
    menuTorch.position.x = -baseSize + edgeSize;
    menuTorch.position.z = 0.05;
    
    settingsSelectionMenu.add(menuTorch);
    sceneElements.torches.push(menuTorch);


    // sun
    const menuSun = day_night_cycle.newSun(0, 0, 0, false);
    menuSun.name = "toggleDay";
    menuSun.position.x = -baseSize + edgeSize;
    menuSun.position.y = -1.5;
    menuSun.position.z = -0.5;

    settingsSelectionMenu.add(menuSun);
    sceneElements.settingsMenu.push(menuSun);


    // moon
    const menuMoon = day_night_cycle.newMoon(0, 0, 0);
    menuMoon.name = "toggleNight";
    menuMoon.position.x = -baseSize + edgeSize;
    menuMoon.position.y = -0.4;
    menuMoon.position.z = -0.3;

    settingsSelectionMenu.add(menuMoon);
    sceneElements.settingsMenu.push(menuMoon);
    










    // ************************** //
    // Create a health bar
    // ************************** //

    const healthBarGeometry = new THREE.BoxGeometry(3, 0.2, 0.2);
    const healthBarMaterial = new THREE.MeshPhongMaterial({ color: 'rgb(255, 0, 0)', side: THREE.DoubleSide });
    const healthBarObject = new THREE.Mesh(healthBarGeometry, healthBarMaterial);
    healthBarObject.position.x = 0;
    healthBarObject.position.y = 2.8;
    healthBarObject.position.z = 0;
    healthBarObject.name = 'playerHealthBar';
    sceneGraph.add(healthBarObject);

    const healthBarCaseGeometry = new THREE.BoxGeometry(3.1, 0.3, 0.3);
    const healthBarCaseMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xffffff,
        opacity: 0.5,
        transparent: true,
        side: THREE.DoubleSide 
    });
    const healthBarCaseObject = new THREE.Mesh(healthBarCaseGeometry, healthBarCaseMaterial);
    healthBarCaseObject.position.x = 0;
    healthBarCaseObject.position.y = 2.8;
    healthBarCaseObject.position.z = 0;
    healthBarCaseObject.name = 'playerHealthBarCase';
    sceneGraph.add(healthBarCaseObject);



    // ************************** //
    // Create a sun and moon
    // ************************** //

    const sunAndMoon = day_night_cycle.newSunAndMoon(0, baseSize/2+edgeSize*2 , 0);
    sunAndMoon.name = 'sunAndMoon';
    sceneGraph.add(sunAndMoon);



    // ************************** //
    // Just testing stuff
    // ************************** //

    const loader = new THREE.GLTFLoader();
    
    // load a glb file
    loader.load(
      'model.glb',
      function (gltf) {
    
        const loadscene = gltf.scene; // get the loaded scene
        loadscene.position.x = 0;
        loadscene.scale.set(0.00001, 0.00001, 0.00001);
        loadscene.position.y = -0.2;
        loadscene.name= "nothingToSeeHere";
        sceneGraph.add(loadscene); // add the scene to your scene graph
      },
      function (xhr) {
        // called while loading is progressing
      },
      function (error) {
        // called if an error occurs while loading
        console.error('An error happened', error);
      }
    );
        
        
    


    // ************************** //
    // NEW - Create a CONVEX HULL
    // ************************** //

    /* const vertices = []

    vertices.push(new THREE.Vector3(-1, 0, 1));
    vertices.push(new THREE.Vector3(0, 0, 1));
    vertices.push(new THREE.Vector3(0, 0, 2));
    vertices.push(new THREE.Vector3(-1, 0, 2));
    vertices.push(new THREE.Vector3(-0.5, 2.5, 1.5));

    const meshMaterial = new THREE.MeshLambertMaterial({
        color: 0xffffff,
        opacity: 0.5,
        transparent: true
    });
    const meshGeometry = new THREE.ConvexGeometry(vertices);

    const convexHull = new THREE.Mesh(meshGeometry, meshMaterial);

    //sceneGraph.add(convexHull);

    convexHull.castShadow = true; */



    // ***************************************** //
    // Add a wooden board to the pause menu
    // ***************************************** //

    const woodenBoardGeometry = new THREE.BoxGeometry(1, 1, 0.1);
    const woodenBoardMaterial = new THREE.MeshPhongMaterial({
        color: 0x8B4513
    });
    const woodenBoardObject = new THREE.Mesh(woodenBoardGeometry, woodenBoardMaterial);

    // ************************** //
    // create a pause plane
    // ************************** //
    
    //const pauseGroup = new THREE.Group();    
    //pauseGroup.add(pausePlane)

    const pauseBlurPlane = new THREE.Mesh(
        new THREE.PlaneGeometry( 2, 2, 2, 2 ),
        new THREE.MeshBasicMaterial( {color: 0x606060} )
    );
    pauseBlurPlane.name= "pauseBlurPlane";
    pauseBlurPlane.material.transparent = true;
    pauseBlurPlane.material.opacity = 0.8;
    sceneElements.pauseBlurPlane = pauseBlurPlane;
}



// ************************** //
// Check for mouseover
// ************************** //

const mouseMove = new THREE.Vector2();
const mouseClick = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
let hoveredButton = null; // in the main menu, keep track of the currently hovered button
let hoveredTile = null; // keep track of the currently hovered tile
let tileColor = null;
let tile = null;

// set up pulsing effect
const pulseDuration = 0.5; // duration of one pulse cycle (in seconds)
const pulseScale = 1.2; // scale factor at the peak of the pulse
let pulseTween = null;

const onMouseMove = (event) => {
    // calculate mouseMove position in normalized device coordinates
    // (-1 to +1) for both components
    mouseMove.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouseMove.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouseMove, sceneElements.camera);


    if (sceneElements.isStartMenuOn == true){ // main menu

        const intersects = raycaster.intersectObjects(sceneElements.startMenu);
        
        // TODO sometimes overing over a text doesnt change the color of the button
        if (intersects.length > 0){
            const object = intersects[0].object;
            
            if (object.name == "FramesCounter"){ // if its the frames counter
                return;
            }

            let currentButton = object;
            if (object.button){ // its a text
                currentButton = object.button; // get the button
            }

            if (currentButton == hoveredButton){
                return;
            }

            if (currentButton.name != "titleCube"){ // ignore the title
                currentButton.material.color.set(0xff0000);
            }

            if (hoveredButton){
                const originalColor = hoveredButton.originalColor;
                hoveredButton.material.color.set(originalColor);
            }
            hoveredButton = currentButton;

        }else{
            // get object by name attribute
            if (hoveredButton){
                const originalColor = hoveredButton.originalColor;
                hoveredButton.material.color.set(originalColor);
            }
        }


    }else{ // game
        
        // check if its paused
        const intersectsPause = raycaster.intersectObject(sceneElements.pauseBlurPlane);
        if (intersectsPause.length > 0){
            return;
        }

        const intersects = raycaster.intersectObjects(sceneElements.tiles);
        // change color of the closest object intersecting the raycaster
        if (intersects.length > 0) {
            tile = intersects[0].object;
    
            if (tile !== hoveredTile) {
                if (hoveredTile) {
                    tileColor = hoveredTile.material.originalColor;
                    hoveredTile.material.color.set(tileColor);
                }
                if (tile.material.typeOfGround != 0){ // if the tile is not a grass tile
                    return;
                }
                hoveredTile = tile;
                hoveredTile.material.color.set(0xff0000);
            }
        } else {
            if (hoveredTile) {
                tileColor = hoveredTile.material.originalColor;
                hoveredTile.material.color.set(tileColor);
                hoveredTile = null;
            }
        }
    
        // pulse the hovered tile // TODO
        /* if (intersects.length > 0) {
            const tile = intersects[0].object;
            if (tile !== hoveredTile) {
                // cancel any existing pulse tween
                if (pulseTween && pulseTween.kill) pulseTween.kill(); // add a check for pulseTween.kill
                if (hoveredTile) {
                    const tileMaterial = hoveredTile.material;
                    const tileColor = tileMaterial.originalColor;
                    tileMaterial.color.set(tileColor);
                }
                hoveredTile = tile;
                pulseTween = new TWEEN.Tween(hoveredTile.material.color)
                    .to({r: 1, g: 1, b: 1}, 200)
                    .easing(TWEEN.Easing.Quadratic.Out)
                    .yoyo(true)
                    .repeat(Infinity)
                    .start();
            }
        } else {
            if (hoveredTile) {
                const tileMaterial = hoveredTile.material;
                const tileColor = tileMaterial.originalColor;
                if (pulseTween && pulseTween.kill) pulseTween.kill(); // add a check for pulseTween.kill
                new TWEEN.Tween(tileMaterial.color)
                    .to({r: ((tileColor >> 16) & 255) / 255, g: ((tileColor >> 8) & 255) / 255, b: (tileColor & 255) / 255}, 200)
                    .easing(TWEEN.Easing.Quadratic.Out)
                    .start();
                hoveredTile = null;
            }
        } */
    }
};


// ************************** //
// Check for mouse click
// ************************** //

const onMouseClick = (event) => {
    event.preventDefault(); // prevent right clicks from opening context menu

    mouseClick.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouseClick.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouseClick, sceneElements.camera);

    var startButton = sceneElements.startMenu[0];


    if (sceneElements.isStartMenuOn == true){ // main menu
        const intersects = raycaster.intersectObjects(sceneElements.startMenu);
        
        if (intersects.length > 0){
            const object = intersects[0].object;
            if (object.name == "startButton" || object.name == "startButtonText"){
                sceneElements.isStartMenuOn = false;

                for (let menuElement of sceneElements.startMenu){
                    sceneElements.sceneGraph.remove(menuElement);
                }
                sceneElements.startMenu = [];


                load3DObjects(sceneElements.sceneGraph);
            }else if (object.name == "githubButtonText" || object.name == "githubButton"){
                let url = "https://github.com/DiogoAlves002/ICG-Final-Project";
                window.open(url);
            }
        }

    }else{ // game
        
        // check if its paused
        const intersectsPause = raycaster.intersectObject(sceneElements.pauseBlurPlane);
        if (intersectsPause.length > 0){
            return;
        }

        // check if the user clicked on a tower on the map
        const intersectsTower = raycaster.intersectObjects(sceneElements.towers);
        if (intersectsTower.length > 0) {
            var tower = intersectsTower[0].object;
            
            if (event.button == 0){ // left click
                tower.rotateOnAxis(new THREE.Vector3(0, 0, 1), Math.PI / 2);
                tower.orientation = (tower.orientation + 1) % 4;
            }else if (event.button == 2){ // right click
                tower.rotateOnAxis(new THREE.Vector3(0, 0, 1), - Math.PI / 2);
                tower.orientation = (tower.orientation + 3) % 4;
            }
            return;
        }


        // check if the user clicked on a tower in the selection menu
        const intersectsTowerSelectionMenu = raycaster.intersectObjects(sceneElements.selectionMenu);
        if (intersectsTowerSelectionMenu.length > 0) {
            const selectedTower = intersectsTowerSelectionMenu[0].object;
            sceneElements.selectedTowerType = selectedTower.type;
            return;
        }


        // check if the user clicked on a torch 
        const torchSettings = raycaster.intersectObjects(sceneElements.torchesMenu);
        if (torchSettings.length > 0){
            toggleLights();
            return;
        }


        // check if the user clicked on a setting
        const settings = raycaster.intersectObjects(sceneElements.settingsMenu);
        if (settings.length > 0){
            const setting = settings[0].object;
            const sunAndMoon = sceneElements.sceneGraph.getObjectByName("sunAndMoon");
            
            if (setting.name == "toggleDay"){
                let day = Math.PI + Math.PI / 2;
                sunAndMoon.rotation.z = day;
                return;
            }

            if (setting.name == "toggleNight"){
                let night = Math.PI / 2;
                sunAndMoon.rotation.z = night;
                return;
            }

        }


        // check if the user clicked on a tile on the map
        const intersectsTile = raycaster.intersectObjects(sceneElements.tiles);

        if (intersectsTile.length > 0) {
            console.log("tile clicked");
            const tile = intersectsTile[0].object;

            if (tile.material.typeOfGround != 0){ // if the tile is not a grass tile
                return;
            }

            if (sceneElements.selectedTowerType == null){ // if no type of tower is selected
                return;
            }

            if (tile.towerType != null){ // if the tile already has a tower
                return; // TODO rotate the tower instead
            }

            let towerCost = sceneElements.towersCost[sceneElements.selectedTowerType];
            if (sceneElements.playerCoins < towerCost){
                return;
            }
            sceneElements.playerCoins -= towerCost;

            tile.material.color.set(0x0700db);

            //const tileSize = tile.geometry.parameters.width - 0.2;
            
            // the plane is rotated 90 degrees so the y and z coordinates are swapped
            const tilePosition_X = tile.position.x;
            const tilePosition_Y = tile.position.z;
            const tilePosition_Z = tile.position.y;


            tile.towerType = sceneElements.selectedTowerType; // flag the tile as having a tower

            const tower = newTower(tilePosition_X, tilePosition_Y, tilePosition_Z, sceneElements.selectedTowerType);
            tower.tile = tile;
            sceneElements.sceneGraph.add(tower);
        }



    }


};

window.addEventListener('mousemove', onMouseMove);

window.addEventListener('click', onMouseClick); // left click
window.addEventListener('contextmenu', onMouseClick); // right click
//window.addEventListener('touchstart', onMouseClick); // touch screen (mobile)


function newFramesCounter(frames){

    // remove the old frames counter if it exists
    let oldFramesCounter = sceneElements.sceneGraph.getObjectByName("FramesCounter");
    if (oldFramesCounter != null){
        sceneElements.sceneGraph.remove(oldFramesCounter);
    }

    // new frames counter
    const framesLoader = new THREE.FontLoader();
    framesLoader.load('./font.json', function (droidFont) {
        const framesGeometry = new THREE.TextGeometry('Frames ' + frames, {
            font: droidFont,
            size: 0.2,
            height: 0.1,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.03,
            bevelSize: 0.02,
            bevelOffset: 0,
            bevelSegments: 5
        });
        
        const framesMaterial = new THREE.MeshPhongMaterial({ color: 'rgb(0, 0, 0)' });
        let framesText = new THREE.Mesh(framesGeometry, framesMaterial);
        
        framesText.position.set(-5, 3, 0.3);

        framesText.name = "FramesCounter";
        
        sceneElements.sceneGraph.add(framesText);
        sceneElements.startMenu.push(framesText);
        framesText.lookAt(sceneElements.camera.position);
    });

}


// Displacement value

let frames = 0;

var delta = 0.1;

var dispX = 0.2, dispZ = 0.2;

var TEST_assert_one_enemy_only = 0; //
const step = 0.01;
const STARTGAME = 0;
function computeFrame(time) {

    frames++;
    if (frames % 100 == 0 && sceneElements.isGamePaused == false){
        console.log("frames: " + frames/time*1000);
        console.log("Coins: " + sceneElements.playerCoins);
        newFramesCounter(Math.round(frames/time*1000));
    }

    

    if (sceneElements.isStartMenuOn == true){ // start menu

        // THE SPOT LIGHT
        const light = sceneElements.sceneGraph.getObjectByName("light");

        // Apply a small displacement

        if (light.position.x >= 10) {
            delta *= -1;
        } else if (light.position.x <= -10) {
            delta *= -1;
        }
        light.translateX(delta);

        // turn frames counter to the camera
        let framesCounter = sceneElements.sceneGraph.getObjectByName("FramesCounter");
        if (framesCounter != null){
            framesCounter.lookAt(sceneElements.camera.position);
        }

    } else { // game

        if (sceneElements.isGamePaused == true){


            // ***************************************** //
            // Add a translucid plane to "blur" the screen
            // ***************************************** //

            let pausePlane = sceneElements.pauseBlurPlane;

            // the pause plane is to "blur" the game, so it is always in front of the camera
            // we calculate the position of the center of the screen (it may vary because of the orbit controls)
            // and make a vector from the camera to that point
            // so if we place the plane in that vector it will always be in front of the camera dispite of where it is or where it is looking

            let cameraPosition = sceneElements.camera.position;

            const screenCenter = new THREE.Vector3(0, 0, -1); // Assuming the camera is looking along the negative z-axis
            screenCenter.unproject(sceneElements.camera); // Convert the screen center to world coordinates

            const direction = new THREE.Vector3();
            direction.subVectors(screenCenter, cameraPosition).normalize();

            const distanceFromCamera = 1;
            const planePosition = cameraPosition.clone().add(direction.multiplyScalar(distanceFromCamera));
            
            pausePlane.position.set(planePosition.x, planePosition.y, planePosition.z);
            pausePlane.lookAt(cameraPosition);

            sceneElements.sceneGraph.add(pausePlane);
            sceneElements.control.enabled = false;


            

            // Rendering
            helper.render(sceneElements);
    
            // NEW --- Update control of the camera
            sceneElements.control.update();

            // Call for the next frame
            requestAnimationFrame(computeFrame);
            return;
        }

        // remove the pause plane if it exists
        if (sceneElements.sceneGraph.getObjectByName("pauseBlurPlane") != null){
            sceneElements.sceneGraph.remove(sceneElements.sceneGraph.getObjectByName("pauseBlurPlane"));
            sceneElements.control.enabled = true;
        }



        // spawning enemies
        if (TEST_assert_one_enemy_only === 0 & (time % 2000 < 20) & (time % 5000 >= 20)) { // every 2 seconds
            const startingPosition = sceneElements.path[0].position;
    
    
            const enemy = newEnemy(startingPosition.x, startingPosition.y, startingPosition.z, 'small');
            sceneElements.sceneGraph.add(enemy);
            sceneElements.enemies.push(enemy);
            TEST_assert_one_enemy_only = 0;
        }

        if (TEST_assert_one_enemy_only === 0 & (time % 5000 < 20) & (time % 10000 >= 20)) { // every 5 seconds
            const startingPosition = sceneElements.path[0].position;

            const enemy = newEnemy(startingPosition.x, startingPosition.y, startingPosition.z, 'medium');
            sceneElements.sceneGraph.add(enemy);
            sceneElements.enemies.push(enemy);
            TEST_assert_one_enemy_only = 0;
        }

        if (TEST_assert_one_enemy_only === 0 & (time % 10000 < 20)) { // every 10 seconds
            const startingPosition = sceneElements.path[0].position;

            const enemy = newEnemy(startingPosition.x, startingPosition.y, startingPosition.z, 'big');
            sceneElements.sceneGraph.add(enemy);
            sceneElements.enemies.push(enemy);
            TEST_assert_one_enemy_only = 0;
        }
    
        // moving enemies towards the end of the path
        for (let i = 0; i < sceneElements.enemies.length; i++) {
            const enemyWithTorch = sceneElements.enemies[i];

            const enemy = enemyWithTorch.children[0];
            const torch = enemyWithTorch.children[1];
    
            
            const nextPathTileIndex = enemy.currentPathTileIndex + 1;
            if (nextPathTileIndex == sceneElements.path.length) { // the enemy has reached the end of the path
                decreasePlayerHealth(enemy.damage);
    
                sceneElements.enemies.splice(i, 1); // remove enemy
                sceneElements.sceneGraph.remove(enemyWithTorch);
                continue;
            }
            const nextPathTile = sceneElements.path[nextPathTileIndex];
            
            let direction_x = (nextPathTile.position.x - enemy.position.x).toFixed(2);
            let direction_z = (nextPathTile.position.y - enemy.position.z).toFixed(2);
    
    
            if (direction_x > 0) {
                enemy.position.x += step;
                torch.position.x += step;
            } 
            else if (direction_x < 0) {
                enemy.position.x -= step;
                torch.position.x -= step;
            }
            if (direction_z > 0) {
                enemy.position.z += step;
                torch.position.z += step;
            }
            else if (direction_z < 0) {
                enemy.position.z -= step;
                torch.position.z -= step;
            }
    
            // check if the enemy has reached the center of the next tile
            if (direction_x == 0 && direction_z == 0) {
                enemy.currentPathTileIndex++;
            }



            // set the tile they're on right now (for the towers to shoot at)
            const distanceBetweenTwoTiles = 1;
            const middleOfTwoTiles = (distanceBetweenTwoTiles/2).toFixed(2);
            (direction_x < 0) ? direction_x = -direction_x : direction_x = direction_x;
            (direction_z < 0) ? direction_z = -direction_z : direction_z = direction_z;
            if (direction_x == middleOfTwoTiles){ // it passed the middle of the tiles
                enemy.tileUnder = nextPathTile; 
                continue; // no need to check the z direction
            }

            if (direction_z == middleOfTwoTiles){ // it passed the middle of the tiles
                enemy.tileUnder = nextPathTile; 
            }
        }



        // TODO animate towers shooting
        for (let i = 0; i < sceneElements.towers.length; i++) {
            let tower = sceneElements.towers[i];
            let towerOrientation = tower.orientation;
            let towerTile = tower.tile;
            let tileFacing = towerTile.neighbours[towerOrientation];

            if (tileFacing == null) { // check if the tower is facing a tile
                continue;
            }

            let tileGroundType = tileFacing.material.typeOfGround;
            if (tileGroundType != 3 & tileGroundType != 1){ // if the tile is not part of the path 
                continue;
            }

            tileFacing.material.color = new THREE.Color(0x000f00);

            for (let enemyWithTorch of sceneElements.enemies) {
                let enemy = enemyWithTorch.children[0];
                if (enemy.tileUnder == tileFacing) {
                    let randomCOlor = Math.random() * 0xffffff;
                    enemy.material.color = new THREE.Color(randomCOlor);
                    enemy.health -= tower.damage;

                    if (enemy.health <= 0) {
                        sceneElements.playerCoins += enemy.coins;
                        sceneElements.enemies.splice(sceneElements.enemies.indexOf(enemyWithTorch), 1);
                        sceneElements.sceneGraph.remove(enemyWithTorch);
                    }
                }
            }
            



        }



        // sun and moon rotation
        const sunAndMoon = sceneElements.sceneGraph.getObjectByName("sunAndMoon");
        sunAndMoon.rotation.z += Math.PI/1440; // TODO change this to 1440
        sunAndMoon.rotation.z %= Math.PI*2;
        //console.log("sun ", sunAndMoon.rotation.z)
        //console.log("cenas ", sunAndMoon.rotation.z.toFixed(2), ( 2*Math.PI- Math.PI/4 ).toFixed(2), ( Math.PI/4 ).toFixed(2) )

        if (sunAndMoon.rotation.z.toFixed(2) == ( Math.PI/3 ).toFixed(2)){ // sunset (more or less)
            for (let i = 0; i < sceneElements.torches.length; i++) {
                let torch = sceneElements.torches[i];

                let torchhead = torch.children[1];
                torchhead.material.emissive = torchhead.litColor;

                let torchlight = torch.children[2];
                torchlight.intensity = 1;
            }
            sceneElements.lightUp = true;
        } 
        if (sunAndMoon.rotation.z.toFixed(2) == ( 2*Math.PI - Math.PI/3 ).toFixed(2)){ // sunrise (more or less)
            for (let i = 0; i < sceneElements.torches.length; i++) {
                let torch = sceneElements.torches[i];
                
                let torchhead = torch.children[1];
                torchhead.material.emissive = torchhead.notLitColor;

                let torchlight = torch.children[2];
                torchlight.intensity = 0;
            }
            sceneElements.lightUp = false;

        }



        // turn frames counter to the camera
        let framesCounter = sceneElements.sceneGraph.getObjectByName("FramesCounter");
        if (framesCounter != null){
            framesCounter.lookAt(sceneElements.camera.position);
        }
        
    }

    








    // CONTROLING THE CUBE WITH THE KEYBOARD

    /* const cube = sceneElements.sceneGraph.getObjectByName("cube");

    if (keyD && cube.position.x < 2.5) {
        cube.translateX(dispX);
    }
    if (keyW && cube.position.z > -2.5) {
        cube.translateZ(-dispZ);
    }
    if (keyA && cube.position.x > -2.5) {
        cube.translateX(-dispX);
    }
    if (keyS && cube.position.z < 2.5) {
        cube.translateZ(dispZ);
    } */

    // Rendering
    helper.render(sceneElements);
    

    // NEW --- Update control of the camera
    sceneElements.control.update();

    // Call for the next frame
    requestAnimationFrame(computeFrame);
}



//load3DObjects(sceneElements.sceneGraph);
requestAnimationFrame(computeFrame);
