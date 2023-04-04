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

//////////////////////////////////////////////////////////////////


// Create and insert in the scene graph the models of the 3D scene
function load3DObjects(sceneGraph) {

    // ************************** //
    // Create a ground plane
    // ************************** //
    const planeSize = new THREE.Vector2(6, 6);
    const subdivisions = 8;

    // create teh array to store the tiles
    const tiles = [];
    sceneElements.tiles = tiles;

    const planeGeometry = new THREE.PlaneGeometry(planeSize.x, planeSize.y, subdivisions - 1, subdivisions - 1);
    const planeMaterial = new THREE.MeshPhongMaterial({ color: 'rgb(200, 200, 200)', side: THREE.DoubleSide });
    const planeObject = new THREE.Mesh(planeGeometry, planeMaterial);

    for (let i = 0; i < subdivisions; i++) {

        // create the vertical lines that separate the tiles
        const verticalLineGeometry = new THREE.BufferGeometry().setFromPoints([ // connects two points
            new THREE.Vector3(-planeSize.x / 2 + i * (planeSize.x / subdivisions), planeSize.y / 2, -0.02), // first point
            new THREE.Vector3(-planeSize.x / 2 + i * (planeSize.x / subdivisions), -planeSize.y / 2, -0.02) // second point
        ]);
        const verticalLineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
        const verticalLine = new THREE.Line(verticalLineGeometry, verticalLineMaterial);
        planeObject.add(verticalLine);

        // create the horizontal lines that separate the tiles
        const horizontalLineGeometry = new THREE.BufferGeometry().setFromPoints([ // connects two points
            new THREE.Vector3(-planeSize.x / 2, -planeSize.y / 2 + i * (planeSize.y / subdivisions), -0.02), // first point
            new THREE.Vector3(planeSize.x / 2, -planeSize.y / 2 + i * (planeSize.y / subdivisions), -0.02) // second point
        ]);
        const horizontalLineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
        const horizontalLine = new THREE.Line(horizontalLineGeometry, horizontalLineMaterial);
        planeObject.add(horizontalLine);

        // create the tiles and add them to the tiles array
        for (let j = 0; j < subdivisions; j++) {
            const squareGeometry = new THREE.PlaneGeometry(planeSize.x / subdivisions, planeSize.y / subdivisions);
            const squareMaterial = new THREE.MeshPhongMaterial({ color: 'rgb(255, 255, 255)', side: THREE.DoubleSide });
            const single_tile = new THREE.Mesh(squareGeometry, squareMaterial);
            single_tile.position.x = -planeSize.x / 2 + j * (planeSize.x / subdivisions) + (planeSize.x / subdivisions) / 2;
            single_tile.position.y = -planeSize.y / 2 + i * (planeSize.y / subdivisions) + (planeSize.y / subdivisions) / 2;
            single_tile.position.z = -0.01;
            tiles.push(single_tile);
            planeObject.add(single_tile);
        }
    }
    tiles.forEach((tile, index) => {
        tile.addEventListener('click', () => {
        console.log(`Tile ${index} was clicked at position (${tile.position.x}, ${tile.position.y})`);
        });
    });

    
    sceneGraph.add(planeObject);

    // Change orientation of the plane using rotation
    planeObject.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);
    // Set shadow property
    planeObject.receiveShadow = true;


    // ************************** //
    // Create a cube
    // ************************** //
    // Cube center is at (0,0,0)
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cubeMaterial = new THREE.MeshPhongMaterial({ color: 'rgb(255,0,0)' });
    const cubeObject = new THREE.Mesh(cubeGeometry, cubeMaterial);
    sceneGraph.add(cubeObject);

    // Set position of the cube
    // The base of the cube will be on the plane 
    cubeObject.translateY(0.5);

    // Set shadow property
    cubeObject.castShadow = true;
    cubeObject.receiveShadow = true;

    // Name
    cubeObject.name = "cube";

    // ************************** //
    // Create a sphere
    // ************************** //
    // Sphere center is at (0,0,0)
    const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const sphereMaterial = new THREE.MeshPhongMaterial({ color: 'rgb(180,180,255)' });
    const sphereObject = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sceneGraph.add(sphereObject);

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
    sceneGraph.add(cylinderObject);

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
// Create a raycast to check for mouse clicks on objects
// ************************** //
const pointer = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

const onMouseMove = (event) => {
    // calculate pointer position in normalized device coordinates
    // (-1 to +1) for both components
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(pointer, sceneElements.camera);
    const intersects = raycaster.intersectObjects(sceneElements.tiles);

    // for (let i = 0; i < intersects.length; i++) {
    //   console.log(intersects);
    // }

    // change color of objects intersecting the raycaster
    // for (let i = 0; i < intersects.length; i++) {
    //   intersects[i].object.material.color.set(0xff0000);
    // }

    // change color of the closest object intersecting the raycaster
    if (intersects.length > 0) {
    intersects[0].object.material.color.set(0xff0000);
    }

};

window.addEventListener('mousemove', onMouseMove);


// Displacement value

var delta = 0.1;

var dispX = 0.2, dispZ = 0.2;

function computeFrame(time) {

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