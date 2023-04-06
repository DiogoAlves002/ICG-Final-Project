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
    sceneGraph: null,
    camera: null,
    control: null,
    renderer: null,

    tiles : null,
    ground : null,

    /* startingTile : null, */
    endingTile : null,
    path : [],

    enemies : [],
};


// Functions are called
//  1. Initialize the empty scene
//  2. Add elements within the scene
//  3. Animate
helper.initEmptyScene(sceneElements);
load3DObjects(sceneElements.sceneGraph);
requestAnimationFrame(computeFrame);

// HANDLING EVENTS

// Event Listeners

window.addEventListener('resize', resizeWindow);

//To keep track of the keyboard - WASD
var keyD = false, keyA = false, keyS = false, keyW = false;
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

function newEnemy(x, y, z, type){
    let enemy = null;
    switch(type){
        case 'small':
            enemy =  newEnemySmall(x, y, z);
            break;
        case 'medium':
            enemy = newEnemyMedium(x, y, z);
            break;
        case 'big':
            enemy = newEnemyBig(x, y, z);
            break;
    }

    enemy.currentTile = sceneElements.path[0];
    enemy.currentPathTileIndex = sceneElements.path[0].pathIndex;
    return enemy;

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




//////////////////////////////////////////////////////////////////


// Create and insert in the scene graph the models of the 3D scene
function load3DObjects(sceneGraph) {

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
    sceneElements.ground = ground;

    const planeSize = new THREE.Vector2(6, 6);
    const subdivisions = ground.length;
    const tileSize = planeSize.x / subdivisions;

    // create the array to store the tiles
    const tiles = [];
    sceneElements.tiles = tiles;


    

    const planeGeometry = new THREE.PlaneGeometry(planeSize.x, planeSize.y, subdivisions - 1, subdivisions - 1);
    const planeMaterial = new THREE.MeshPhongMaterial({ color: 'rgb(200, 200, 200)', side: THREE.DoubleSide });
    const planeObject = new THREE.Mesh(planeGeometry, planeMaterial);

    for (let row = 0; row < subdivisions; row++) {

        // create the vertical lines that separate the tiles
        const verticalLineGeometry = new THREE.BufferGeometry().setFromPoints([ // connects two points
            new THREE.Vector3(-planeSize.x / 2 + row * tileSize, planeSize.y / 2, -0.02), // first point
            new THREE.Vector3(-planeSize.x / 2 + row * tileSize, -planeSize.y / 2, -0.02) // second point
        ]);
        const verticalLineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
        const verticalLine = new THREE.Line(verticalLineGeometry, verticalLineMaterial);
        planeObject.add(verticalLine);

        // create the horizontal lines that separate the tiles
        const horizontalLineGeometry = new THREE.BufferGeometry().setFromPoints([ // connects two points
            new THREE.Vector3(-planeSize.x / 2, -planeSize.y / 2 + row * (planeSize.y / subdivisions), -0.02), // first point
            new THREE.Vector3(planeSize.x / 2, -planeSize.y / 2 + row * (planeSize.y / subdivisions), -0.02) // second point
        ]);
        const horizontalLineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
        const horizontalLine = new THREE.Line(horizontalLineGeometry, horizontalLineMaterial);
        planeObject.add(horizontalLine);

        // create the tiles and add them to the tiles array
        for (let col = 0; col < subdivisions; col++) {
            const tileGeometry = new THREE.PlaneGeometry(tileSize, planeSize.y / subdivisions);
            const tileMaterial = new THREE.MeshPhongMaterial({ color: 'rgb(255, 255, 255)', side: THREE.DoubleSide });
            const single_tile = new THREE.Mesh(tileGeometry, tileMaterial);
            single_tile.position.x = -planeSize.x / 2 + col * tileSize + tileSize / 2;
            single_tile.position.y = -planeSize.y / 2 + row * tileSize + tileSize / 2;
            single_tile.position.z = -0.01;

            switch (sceneElements.ground[row][col]) {
                case 0:// grass
                    tileMaterial.color.set(0x00ff00); // set to green
                    tileMaterial.originalColor = 0x00ff00;

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
                    /* tileMaterial.color.set(0xfc6900); // set to orange
                    tileMaterial.originalColor = 0xfc6900; */

                    tileMaterial.typeOfGround = 3;

                    sceneElements.endingTile = single_tile;

                    single_tile.pathIndex = sceneElements.ground[row][col] - 1;
                    sceneElements.path.push(single_tile);
                    break;
            }

            // ---------- TODO fix aliasing problem --------- // 
            /* single_tile.castShadow = true;
            single_tile.receiveShadow = true; */

            single_tile.index = tiles.length;
            tiles.push(single_tile);
            planeObject.add(single_tile);
        }
    }

    // sort the path tiles by pathIndex
    sceneElements.path.sort((a, b) => a.pathIndex - b.pathIndex);

    // set the ending tile
    const endingTile = sceneElements.path[sceneElements.path.length - 1];
    endingTile.material.color.set(0xfc6900); // set to orange
    endingTile.material.originalColor = 0xfc6900;

    
    sceneGraph.add(planeObject);

    // Change orientation of the plane using rotation
    planeObject.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);
    // Set shadow property
    planeObject.receiveShadow = true;


    // ************************** //
    // Create a cube
    // ************************** //
    // Cube center is at (0,0,0)

    const cubeObject = newCube(0, 0.5, 0, 1, 'rgb(255,0,0)');
    sceneGraph.add(cubeObject);

    // Set position of the cube
    // The base of the cube will be on the plane 
    //cubeObject.translateY(0.5);

    // Set shadow property
    /* cubeObject.castShadow = true;
    cubeObject.receiveShadow = true; */

    // Name
    cubeObject.name = "cube";

    // ************************** //
    // Create a sphere
    // ************************** //
    // Sphere center is at (0,0,0)
    const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const sphereMaterial = new THREE.MeshPhongMaterial({ color: 'rgb(180,180,255)' });
    const sphereObject = new THREE.Mesh(sphereGeometry, sphereMaterial);
    //sceneGraph.add(sphereObject);

    // Set position of the sphere
    // Move to the left and away from (0,0,0)
    // The sphere touches the plane
    sphereObject.translateX(-1.2).translateY(0.5).translateZ(-0.5);

    // Set shadow property
    sphereObject.castShadow = true;


    // ************************** //
    // Create a cylinder
    // ************************** //
    const cylinderGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 25, 1);
    const cylinderMaterial = new THREE.MeshPhongMaterial({ color: 'rgb(200,255,150)' });
    const cylinderObject = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    //sceneGraph.add(cylinderObject);

    // Set position of the cylinder
    // Move to the right and towards the camera
    // The base of the cylinder is on the plane
    cylinderObject.translateX(0.5).translateY(0.75).translateZ(1.5);

    // Set shadow property
    cylinderObject.castShadow = true;

    ///// NEW /////
    // ************************** //
    // NEW - Create a CONVEX HULL
    // ************************** //

    const vertices = []

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

    sceneGraph.add(convexHull);

    convexHull.castShadow = true;

}



// ************************** //
// Check for mouseover
// ************************** //

const mouseMove = new THREE.Vector2();
const mouseClick = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
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

    // pulse the hovered tile
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
};


// ************************** //
// Check for mouse click
// ************************** //

const onMouseClick = (event) => {
    mouseClick.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouseClick.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouseClick, sceneElements.camera);
    const intersects = raycaster.intersectObjects(sceneElements.tiles);

    if (intersects.length > 0) {
        const tile = intersects[0].object;

        if (tile.material.typeOfGround != 0){ // if the tile is not a grass tile
            return;
        }

        tile.material.color.set(0x0700db);

        const tileSize = tile.geometry.parameters.width - 0.2;
        
        // the plane is rotated 90 degrees so the y and z coordinates are swapped
        const tilePosition_X = tile.position.x;
        const tilePosition_Y = tile.position.z + 0.5 - 0.1; // 0.5 because the cube is set at its center and we need to set it at the bottom of the tile, 0.1 because the cube is 0.2 smaller than the tile
        const tilePosition_Z = tile.position.y ;


        // create a new cube
        const cube = newCube(tilePosition_X, tilePosition_Y, tilePosition_Z, tileSize, 0x293133);
        sceneElements.sceneGraph.add(cube);

    }


};

window.addEventListener('mousemove', onMouseMove);
window.addEventListener('click', onMouseClick);


// Displacement value

var delta = 0.1;

var dispX = 0.2, dispZ = 0.2;

var TEST_assert_one_enemy_only = 0; //
const step = 0.01;
function computeFrame(time) {

    
    // THE ENEMIES
    if (TEST_assert_one_enemy_only === 0 & (time % 2000 < 20)) { // every 2 seconds
        const startingPosition = sceneElements.path[0].position;


        const enemy = newEnemy(startingPosition.x, startingPosition.y, startingPosition.z, 'small');
        sceneElements.sceneGraph.add(enemy);
        sceneElements.enemies.push(enemy);
        TEST_assert_one_enemy_only = 1;
    }

    // MOVING THE ENEMIES TOWARDS THE ENDING TILE
    for (let i = 0; i < sceneElements.enemies.length; i++) {
        const enemy = sceneElements.enemies[i];

        //const currentTileIndex = enemy.currentTile.index;
        
        const nextPathTileIndex = enemy.currentPathTileIndex + 1;
        if (nextPathTileIndex >= sceneElements.path.length) { // the enemy has reached the end of the path
            // TODO remove the enemy from the scene and decrease health
            continue;
        }
        const nextPathTile = sceneElements.path[nextPathTileIndex];
        
        const direction_x = nextPathTile.position.x - enemy.position.x;
        const direction_z = nextPathTile.position.y - enemy.position.z;

        /* step = 0.01; */

        if (direction_x.toFixed(2) > 0) {
            enemy.translateX(step);
        } 
        else if (direction_x.toFixed(2) < 0) {
            enemy.translateX(-step);
        }
        if (direction_z.toFixed(2) > 0) {
            enemy.translateZ(step);
        }
        else if (direction_z.toFixed(2) < 0) {
            enemy.translateZ(-step);
        }

        // check if the enemy has reached the center of the next tile
        if (direction_x.toFixed(2) == 0 && direction_z.toFixed(2) == 0) {
            enemy.currentPathTileIndex++;
        }



    }






    // THE SPOT LIGHT

    // Can extract an object from the scene Graph from its name
    const light = sceneElements.sceneGraph.getObjectByName("light");

    // Apply a small displacement

    if (light.position.x >= 10) {
        delta *= -1;
    } else if (light.position.x <= -10) {
        delta *= -1;
    }
    light.translateX(delta);

    // CONTROLING THE CUBE WITH THE KEYBOARD

    const cube = sceneElements.sceneGraph.getObjectByName("cube");

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
    }

    // Rendering
    helper.render(sceneElements);

    // NEW --- Update control of the camera
    sceneElements.control.update();

    // Call for the next frame
    requestAnimationFrame(computeFrame);
}