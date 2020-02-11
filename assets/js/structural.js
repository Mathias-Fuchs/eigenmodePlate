THREE.Object3D.DefaultUp.set(0, 0, 1);
var camera, scene, renderer;
var geometry, LineSegments;
var controls;
var extx = 10;
var exty = 3;
var extz = 4;
// non-indexed buffer geometry
var bgeometry = new THREE.Geometry();
var equilibGeometries = [];

var ntheta = 50;
var nr = 15;

var M = new THREE.Geometry();
var axis_divisions = ntheta;
var height_divisions = nr;
for (var th = 0; th < axis_divisions; th++) {
	var alpha = 2.0 * Math.PI * th / axis_divisions;
	for (var h = 0; h < height_divisions; h++) {
		var z = (0.1 + h / (height_divisions - 1)) / 1.1;
		M.vertices.push(circleToSquare(z, alpha));
	}
}

for (th = 0; th < axis_divisions; th++) {
	for (h = 1; h < height_divisions; h++) {
		M.faces.push(
			new THREE.Face3(
				((th + 0) % axis_divisions) * height_divisions + (h - 1),
				((th + 1) % axis_divisions) * height_divisions + (h - 1),
				((th + 0) % axis_divisions) * height_divisions + (h + 0)
			));

		M.faces.push(
			new THREE.Face3(
				((th + 1) % axis_divisions) * height_divisions + (h - 1),
				((th + 1) % axis_divisions) * height_divisions + (h + 0),
				((th + 0) % axis_divisions) * height_divisions + (h + 0)
			));
	}
}
var basicUnit = new THREE.LineSegments(new THREE.WireframeGeometry(M), new THREE.LineBasicMaterial({ color: "white" }));

basicUnit.material.depthTest = true;
basicUnit.material.opacity = 0.85;
basicUnit.material.transparent = true;


basicUnit.geometry.computeBoundingBox();

// C is for the column
var bgeometryC = new THREE.LineSegments(new THREE.BoxGeometry(0.3, 0.3, extz, 20, 20, 20), new THREE.LineBasicMaterial({ color: "green", linewidth: 50 }));
bgeometryC.applyMatrix(new THREE.Matrix4().makeTranslation(extx / 2, exty / 2, 0));
bgeometryC.geometry.computeBoundingBox();


var nx = 2;
var ny = 2;
var nz = 2;
function circleToSquare(r, phi) {
	var u = r * Math.cos(phi);
	var v = r * Math.sin(phi);
	var x = 1 / 2 * Math.sqrt(2 + 2 * Math.SQRT2 * u + u * u - v * v) - 1 / 2 * Math.sqrt(2 - 2 * Math.SQRT2 * u + u * u - v * v);
	var y = 1 / 2 * Math.sqrt(2 + 2 * Math.SQRT2 * v - u * u + v * v) - 1 / 2 * Math.sqrt(2 - 2 * Math.SQRT2 * v - u * u + v * v);
	return new THREE.Vector3(extx / 2 * (x + 1), exty / 2 * (y + 1), 0);
}
function generateGeometries() {
	var boxes = [];
	//boxes.push(basicUnit.clone()); // remove this
	//return; // remove this
	for (var ii = 0; ii < nx; ii++) {
		for (var jj = 0; jj < ny; jj++) {
			for (var kk = 0; kk < nz; kk++) {
				var boxClone = basicUnit.clone();
				boxClone = basicUnit.clone();
				boxClone.applyMatrix(new THREE.Matrix4().makeTranslation(extx * ii - extx / 2 * nx, exty * jj - exty / 2 * ny, extz * kk));
				boxes.push(boxClone);
			}
		}
	}

	// now for the columns
	for (ii = 0; ii < nx; ii++) {
		for (jj = 0; jj < ny; jj++) {
			for (kk = 0; kk < nz; kk++) {
				boxClone = bgeometryC.clone();
				boxClone.applyMatrix(new THREE.Matrix4().makeTranslation(extx * ii - extx / 2 * nx, exty * jj - exty / 2 * ny, extz * kk));
				boxes.push(boxClone);
			}
		}
	}
	equilibGeometries = [];
	for (var iii = 0; iii < boxes.length / 2; iii++) {
		// https://stackoverflow.com/questions/35563529/how-to-copy-typedarray-into-another-typedarray
		var dg = boxes[iii].clone();
		// dg.geometry.attributes.position.array = new Float32Array(boxes[iii].geometry.attributes.position.array.length);
		//dg.geometry.attributes.position.array.set(boxes[iii].geometry.attributes.position.array);
		equilibGeometries.push(dg);
	}
	for (iii = boxes.length / 2; iii < boxes.length; iii++) {
		equilibGeometries.push(boxes[iii].clone());
	}
	return boxes;
}

var fancymaterial = new THREE.MeshPhongMaterial({
	side: THREE.DoubleSide,
	vertexColors: THREE.VertexColors
});

function resetScene() {
	while (scene.children.length > 0) {
		scene.remove(scene.children[0]);
	}
	var g = generateGeometries();
	scene.add(...g);
}

init();
animate();

function init() {

	scene = new THREE.Scene();
	generateGeometries();
	geometry = basicUnit;
	//scene.add(basicUnit);
	//scene.add(bgeometryC);
	renderer = new THREE.WebGLRenderer({ antialias: false });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setClearColor("black");

	camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 100);
	camera.position.x = 1;
	camera.position.y = 10;
	camera.position.z = 9;

	controls = new THREE.OrbitControls(camera, renderer.domElement);
	document.body.appendChild(renderer.domElement);
	
	nx = 2;
	ny = 2;
	resetScene();

	window.addEventListener('resize', onWindowResize, false);
	controls.autoRotate = true;

	controls.update();
	renderer.render(scene, camera);
}
var ii = 0;

function animate() {

	ii = ii + 1;
	requestAnimationFrame(animate);
	controls.update();

	if (typeof scene.children[1] !== 'undefined') {
		var nslabs = equilibGeometries.length / 2;
		for (var l = 0; l < nslabs; l++) {
			var a = scene.children[l].geometry.attributes.position.array;
			var b = equilibGeometries[l].geometry.attributes.position.array;

			var nv = a.length / 3;

			var xtot = nx * extx;
			var ytot = ny * exty;

			for (var i = 0; i < nv; i++) {
				var equilibx = b[3 * i];
				var equiliby = b[3 * i + 1];

				var summand = Math.sin(ii / 30) * Math.sin(4 * (equilibx + xtot / 2) / xtot * Math.PI) *
					Math.sin((equiliby + ytot / 2) / ytot * Math.PI) / 2;


				a[3 * i + 2] = Math.sin(ii / 30)/2 * Math.sin(4 * (b[3 * i + 1] + ytot / 2) / ytot * Math.PI) * Math.sin(4 * (b[3 * i] + xtot / 2) / xtot * Math.PI);
				
			}
			scene.children[l].geometry.attributes.position.needsUpdate = true;
			scene.children[l].geometry.verticesNeedsUpdate = true;
			
		}

		scene.autoUpdate = true;
	}
	renderer.render(scene, camera);
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

