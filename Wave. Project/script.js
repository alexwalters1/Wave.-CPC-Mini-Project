//Importing a simplex noise function to a variable to be called later, this will contain all the data to manipulate the 2D surfaces of the planes in the scene.
var noise = new SimplexNoise();
var vizInit = function () {

    //This defines variables, 4 of which call an element directly matching 'thefile' and 'audio'.
    var file = document.getElementById("thefile");
    var audio = document.getElementById("audio");
    //.querySelector is used to return the first element in the document that matched "label.file"
    var fileLabel = document.querySelector("label.file");
    //Upon loading the document, an event is started when an audio file is uploaded, oncew loaded it will play.
    document.onload = function (e) {
        console.log(e);
        audio.play();
        play();
    }
    //If the file is changed whilst one is playing, then the new audio file will be active file and will be displayed to the user.
    file.onchange = function () {
        fileLabel.classList.add('normal');
        audio.classList.add('active');
        var files = this.files;
        //Creating a URL for the audio source allows it to be called later via a string, which will be initialised later.
        audio.src = URL.createObjectURL(files[0]);
        audio.load();
        audio.play();
        play();
    }
    //When the audio is played, this function is executed. Creating a new 'AudioContext' object creates an audio-processing graph from the user's uploaded audio.
    function play() {
        var context = new AudioContext();
        //This allows the audio to be manipulated by giving it values.
        var src = context.createMediaElementSource(audio);
        //The analyser then analyses the audio data.
        var analyser = context.createAnalyser();
        src.connect(analyser);
        analyser.connect(context.destination);
        //.fftsize refers to an unsigned long value (an extended size variable for number storage) which collects time domain data repeatedly, then stores it. 
        analyser.fftSize = 512;
        //.frequencyBinCount returns a value which is half the size of the .fftSize which is assigned to a variable called bufferLength.
        var bufferLength = analyser.frequencyBinCount;
        //Unit8Array represents the intergers from buferLength and are intilised to 0, and called when the createObjectURL function is used.
        var dataArray = new Uint8Array(bufferLength);
        //These define a scene, group and camera variable, which are self explanatory.
        var scene = new THREE.Scene();
        var group = new THREE.Group();
        //This sets the values of the perspective camera, to best represent the way the human eye sees. The FOV is set to 65, a fairly wide angle, and the width and height of the window are returned in pixels
        //depending on the size of the window - this value will change, hence why an absolute value is not used.
        //While I do not fully understand the use of the near and far plane constructors, I set these as the minimum and max camera distance.
        var camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 0, 100);
        //The camera will be focussed on the scene and then added to it.
        camera.lookAt(scene.position);
        scene.add(camera);
        //Defining a renderer variable, which creates a renderer to display the drawings, which is again set to the width and height of the window, to render the whole scene.
        var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        //This set refers to the size of the top and bottom planes in the scene, the planeGeometry is set once and called rather than typing out the same values over and over for the height and width. 
        var planeGeometry = new THREE.PlaneGeometry(800, 800, 20, 20);
        //Assigning the material as MeshLambertMaterial, as this is used in maya projects. And making the wireframe visible for aesthetics.
        var planeMaterial = new THREE.MeshLambertMaterial({
            color: 0x6904ce,
            side: THREE.DoubleSide,
            wireframe: true
        });
        //Here the top and bottom (plane2) planes are created. Using the same geometry as each other, they are both rotated to be flat, while one is set to be +30 and the other -30 to create space
        //in the middle of the scene for the ball.
        var plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = -0.5 * Math.PI;
        plane.position.set(0, 30, 0);
        group.add(plane);
        //Then added to a group called plane for the top plane.
        var plane2 = new THREE.Mesh(planeGeometry, planeMaterial);
        plane2.rotation.x = -0.5 * Math.PI;
        plane2.position.set(0, -30, 0);
        group.add(plane2);
        //Plane2 group created for the bottom plane.
        //icosahedronGeometry is a class used to create isosahedrons (a polghedron with 20 faces), the radius is set to 10 so it is not too large in the scene while music is not playing, and the detail is set to 3 (5 being the max)
        //as I liked how this looked the most - again the wireframe is shown due to stylisitic choice (and helping me visualise what I am doing) and a colour is assigned to the material of the ball.
        var icosahedronGeometry = new THREE.IcosahedronGeometry(10, 3);
        var lambertMaterial = new THREE.MeshLambertMaterial({
            color: 0xff00ee,
            wireframe: true
        });
        //The ball is created with the icosahedronGeometry and lambertMaterial previously defined. Then added to a group called 'ball'.
        var ball = new THREE.Mesh(icosahedronGeometry, lambertMaterial);
        ball.position.set(0, 0, 0);
        group.add(ball);
        //Ambient light is added, as suggest by three.js documentation, this is assigned a white colour, producing a soft white light in the scene which it is then added to.
        var ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);
        //This light was lack luster, so i decided to add a spotlight which allows much more customisation to my knowledge. It's focussed on the 'ball' with the .lookat command, and was moved around
        // until I liked it's position. Shadows are casted also, again for stylistic reasons, and is then added to the scene so it is rendered.
        var spotLight = new THREE.SpotLight(0xffffff);
        spotLight.intensity = 0.9;
        spotLight.position.set(-10, 40, 20);
        spotLight.lookAt(ball);
        spotLight.castShadow = true;
        scene.add(spotLight);
        scene.add(group);
        //This gets an element by the direct ID and when gotten, it adds a node to the end of the children in the specified node 'out' and moves it to a new position.
        document.getElementById('out').appendChild(renderer.domElement);
        //With the window as the target (where the function .addEventListener is assigned), when the event is delivered to the target, the function will be called when the window is resized. 
        //Then causing the onWindowResize function to run. The window size will not be reported/displayed as I want that to be hidden from the user, hence 'false'.
        window.addEventListener('resize', onWindowResize, false);
        //Scene then gets rendered to be displayed to the user:
        render();
        //In this render I have created a half and upper array, this will allow me to manipulate the ball in two halves. This is important as I do not want the ball to interfere with the top and
        //bottom plane when it is vibrating to the music played.
        function render() {
            //The frequency data is obtained from the buffer length I defined earlier under 'dataArray'.  
            analyser.getByteFrequencyData(dataArray);
            //This seperates the data found from the Uint8Array into two sections for the upper and lower arrays. 
            var lowerHalfArray = dataArray.slice(0, (dataArray.length / 2) - 1);
            var upperHalfArray = dataArray.slice((dataArray.length / 2) - 1, dataArray.length - 1);
            //The below variables are made to easily calculate the max frequency that can be used upon the surface of the ball, as well as the average frequency that occurs.
            var overallAvg = avg(dataArray);
            var lowerMax = max(lowerHalfArray);
            var lowerAvg = avg(lowerHalfArray);
            var upperMax = max(upperHalfArray);
            var upperAvg = avg(upperHalfArray);
            //This is repeated except for the overall average (to be used ipon the ball surface), due to the existance of the lower and upper arrays.
            var lowerMaxFr = lowerMax / lowerHalfArray.length;
            var lowerAvgFr = lowerAvg / lowerHalfArray.length;
            var upperMaxFr = upperMax / upperHalfArray.length;
            var upperAvgFr = upperAvg / upperHalfArray.length;
            //As the scene is rendering now, the planes have to be drawn, using the data from the two plane groups made earlier
            //Below you will see the makeGround function and makeBall functions which are declared and defined later. These functions draw geometry to make the ball.
            makeGround(plane, modulate(upperAvgFr, 0, 1, 0.5, 4));
            makeGround(plane2, modulate(lowerMaxFr, 0, 1, 0.5, 4));
            makeBall(ball, modulate(Math.pow(lowerMaxFr, 0.8), 0, 1, 0, 8), modulate(upperAvgFr, 0, 1, 0, 4));
            //This rotates the whole group slowly around the centre point, as I found it boring static.
            group.rotation.y += 0.001;
            renderer.render(scene, camera);
            requestAnimationFrame(render);
        }
        //onWindowResize() updates the camera when the window size changes, in conjucntion with the event listener, this function is used when the window resizes - as mentioned earlier.
        //The function calculates the aspect ratio for the camera by dividing the width by the height of the window, which is updated and re-rendered.
        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
        //The makeBall function defines 5 variables within it. It is made with the bass frequency and the treble frequency constructing the mesh.
        //offset = composed of a triangular polygon mesh, which has plotted verticies and a radius to make it a sphere.
        //amp = Amplitude, how reactive I want the surface to be, this is the maximum extent of the vibration.
        //time = Time, this returns a millisecond time stamp for the data recorded at that point.
        //the vertex is then 'normalized' as previously it was a mesh generated by verticies.
        //rf = Radio Frequency, the rate of the vibration occuring on the surfaces.
        //finally the distance variable pulls this all together, the offset and bass frequencies are added together to get the starting shape of the ball.
        //then the noise variable is called (stated at the start of the script document) which allows me to utilise Simplex Noise to sample the noise from the audio file, this is added to
        //the shape of the ball, as it's 3D I will use the .noise3D operator which requires a staring position (the centre of the ball in this case) adjusted by the window size
        //which multiplied by the rf value to move the verticies alongisde the treFr and bassFr in accordance to the music. 
        function makeBall(mesh, bassFr, treFr) {
            mesh.geometry.vertices.forEach(function (vertex, i) {
                var offset = mesh.geometry.parameters.radius;
                var amp = 8;
                var time = window.performance.now();
                vertex.normalize();
                var rf = 0.00001;
                var distance = (offset + bassFr) + noise.noise3D(vertex.x + time * rf * 7, vertex.y + time * rf * 8, vertex.z + time * rf * 9) * amp * treFr;
                vertex.multiplyScalar(distance);
            });
            //This is constantly updated with the repetitive data collection from the audio.
            mesh.geometry.verticesNeedUpdate = true;
            mesh.geometry.normalsNeedUpdate = true;
            mesh.geometry.computeVertexNormals();
            mesh.geometry.computeFaceNormals();
        }
        //Similarly to the makeBall function, makeGround draws the position of each vertice based off 2D rather than 3D noise from the Simplex noise operation.
        //Instead I used a variable called distortionFr (Distortion Frequency) rather than rf.
        function makeGround(mesh, distortionFr) {
            mesh.geometry.vertices.forEach(function (vertex, i) {
                var amp = 2;
                var time = Date.now();
                var distance = (noise.noise2D(vertex.x + time * 0.0003, vertex.y + time * 0.0001) + 0) * distortionFr * amp;
                vertex.z = distance;
            });
            //This is constantly updated with the repetitive data collection from the audio.
            mesh.geometry.verticesNeedUpdate = true;
            mesh.geometry.normalsNeedUpdate = true;
            mesh.geometry.computeVertexNormals();
            mesh.geometry.computeFaceNormals();
        }
        audio.play();
    };
}
//This loads the initialiser function.
window.onload = vizInit();
//This allows the music to be played after it is paused.
document.body.addEventListener('touchend', function (ev) { context.resume(); });

function fractionate(val, minVal, maxVal) {
    return (val - minVal) / (maxVal - minVal);
}
//The idea of this project is aroudn this function here, modulating the sphere's size based off the beat signature of the .mp3 and deform the size based off the vocals (higher frequencies)
//To make is more of a visual experience the noise is also added to add physical texture to the ball, using audio data as an input.
function modulate(val, minVal, maxVal, outMin, outMax) {
    var fr = fractionate(val, minVal, maxVal);
    var delta = outMax - outMin;
    return outMin + (fr * delta);
}
//This calculates the average value of an array and returns it.
function avg(arr) {
    var total = arr.reduce(function (sum, b) { return sum + b; });
    return (total / arr.length);
}
//This calculates the maximum value of an array and returns it.
function max(arr) {
    return arr.reduce(function (a, b) { return Math.max(a, b); })
}