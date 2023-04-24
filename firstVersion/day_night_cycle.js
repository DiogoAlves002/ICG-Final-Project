

const day_night_cycle = {

    newSpaceBall: function(size, starting_coords, type){

        var spaceBallGeometry = new THREE.SphereGeometry(size/10, 32, 32);
        var spaceBallMaterial = null;

        if (type == "sun"){
            spaceBallMaterial = new THREE.MeshBasicMaterial({color: 0xffdd00});
        }
        else if (type == "moon"){
            spaceBallMaterial = new THREE.MeshBasicMaterial({color: 0xffffff});
        }

        var spaceBall = new THREE.Mesh(spaceBallGeometry, spaceBallMaterial);
        
        spaceBall.position.set(starting_coords[0], starting_coords[1], starting_coords[2]);

        return spaceBall;
    },


    newSun: function(x, y, z){
        var  sunObj =  day_night_cycle.newSpaceBall(5, [x, y, z], "sun");

        var sunLight = new THREE.PointLight(0xffffff, 1, 100);
        sunLight.position.set(0, 5, 0);
        sunLight.castShadow = true;

        sunLight.shadow.mapSize.width = 2**12; // 4096
        sunLight.shadow.mapSize.height = 2**12; // 4096

        sunObj.add(sunLight);

        return sunObj;

    },

    newMoon: function(x, y, z){
        return day_night_cycle.newSpaceBall(3, [x, -y, z], "moon");
    },


    newSunAndMoon: function(x, y, z){
        var sun = day_night_cycle.newSun(x, y, z);
        var moon = day_night_cycle.newMoon(x, y, z);

        var sunAndMoon = new THREE.Group();
        sunAndMoon.add(sun);
        sunAndMoon.add(moon);

        return sunAndMoon;
    },

}