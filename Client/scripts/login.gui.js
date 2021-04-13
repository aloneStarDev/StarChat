

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 100 );

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );



var geometry = new THREE.PlaneGeometry(window.innerWidth,window.innerHeight, 32 );
uni = {
    time: { value: 1.0 },
    resolution: { value: new THREE.Vector2(window.innerWidth,window.innerHeight) },

};
var material = new THREE.ShaderMaterial( {
        uniforms: uni,
        // vertexShader: vertex,
        fragmentShader:document.getElementById("fragmentShader").innerText
    } );

var plane = new THREE.Mesh( geometry, material );
scene.add( plane );
camera.position.z = 40;
time = 0.05;

window.onresize = function(){
    
    renderer.setSize( window.innerWidth, window.innerHeight );
    uni.resolution.value=new THREE.Vector2(window.innerWidth,window.innerHeight);
};
function animate(){
    uni.time.value+=time;
	renderer.render( scene, camera );
    requestAnimationFrame(animate);
}
function login(){
    var username = document.getElementsByName("username")[0].value;
    var password = document.getElementsByName("password")[0].value;
    console.log(username);
    if(username === "star" && password === "star"){
        for(var i = 0;i<500;i++){
            setTimeout(()=>{
                time+= 0.001;
            },10*i);
        }
    }else{
        document.getElementsByClassName("dark-bg")[0].background ="red";
        for(var i = 0;i<500;i++){
            setTimeout(()=>{
                time-= 0.001;
            },10*i);
        }
        time = 0.05;
    }
}
animate();