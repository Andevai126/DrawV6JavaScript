//go to https://www.google.com/chrome/canary/
//download chrome canary
//go to chrome://flags/#enable-unsafe-webgpu
//enable unsafe webgpu

if (!navigator.gpu) {
  console.log("WebGPU is supported")
}


//key variables
var keys = [];

//gamemode, can be toggled only on rising edge between free, grounded or rolling because of gamemodecheck
var gamemode = "free";
var gs = false;

//variables for rolling-gamemode
var wentabove = true;
var floatheight;

//position of player (line with x=127 to 325 & y=84 is good for testing)
var xplayer = 0.1;
var yplayer = 0.2;
var zplayer = 0.3;

//speed and direction of player
var xpower = 0;
var ypower = 0;
var zpower = 0;

//player horizontal and vertical direction
var hxdir = 0;
var hydir = 0;
var hdir = 0;
var vdir = 0;

//size of canvas, width and height of ingame screen, distance to point B and renderdistance
var width =  window.innerWidth;
var height = window.innerHeight;
var xFOV = 45;
var yFOV = xFOV*(height/width);
// console.log(yFOV);
var renderdistance = 150;

//counts  which frame it is now, used when a function only needs to run once per few frames
var framenumber = 0;

var freeze = false;

/*
console.log("test1");
var renderdistance = 100;
xFOV = 45;//j
yFOV = 22.5;//i
//gscop(x, y, z, px, py, pz, hd, vd)
var heyo = gscop(1, 1, 1, 1, 0, 2, 5, 0.5);
console.log("test2");
*/
// var asdf = [];
// console.log(asdf);
// asdf = [1, 3, 4];
// console.log(asdf);
// asdf.length = 0;
// console.log(asdf);


var allchunks = [];

function findchunkids(x, y, z){
  //find coordinates of chunks on their relative numberline
  var x1 = Math.floor(x/1000);
  var y1 = Math.floor(y/1000);
  var z1 = Math.floor(z/1000);  
  var x2 = Math.floor((x % 1000)/100);
  var y2 = Math.floor((y % 1000)/100);
  var z2 = Math.floor((z % 1000)/100);
  var x3 = Math.floor((x % 100)/10);
  var y3 = Math.floor((y % 100)/10);
  var z3 = Math.floor((z % 100)/10);
  //all subchunkid's are relative to their parent, thus everything is positve
  if (x < 0){
    x2 += 10;
    x3 += 10;
  }
  if (y < 0){
    y2 += 10;
    y3 += 10;
  }
  if (z < 0){
    z2 += 10;
    z3 += 10;
  }
  //fix negative zeroes
  if (x1 == -0){x1 = 0;}
  if (y1 == -0){y1 = 0;}
  if (z1 == -0){z1 = 0;}
  if (x2 == -0){x2 = 0;}
  if (y2 == -0){y2 = 0;}
  if (z2 == -0){z2 = 0;}
  if (x3 == -0){x3 = 0;}
  if (y3 == -0){y3 = 0;}
  if (z3 == -0){z3 = 0;}
  return {x1, y1, z1, x2, y2, z2, x3, y3, z3};
}

function add(x1, y1, z1, x2, y2, z2, x3, y3, z3){
  var chunkids = findchunkids(x3, y3, z3);

  //check if there is a large chunk for the new values. if not, create one
  var largechunkexists = false;
  var i = 0;
  while (allchunks[i] != undefined && largechunkexists == false){
    if (allchunks[i][0] == chunkids.x1 && allchunks[i][1] == chunkids.y1 && allchunks[i][2] == chunkids.z1){
      largechunkexists = true;
      i -= 2;
    }
    i += 2;
  }
  if (largechunkexists == false){
    allchunks[i] = new Array();
    allchunks[i][0] = chunkids.x1;
    allchunks[i][1] = chunkids.y1;
    allchunks[i][2] = chunkids.z1;
    allchunks[i+1] = new Array();
  }

  //check if there is a medium chunk for the new values. if not, create one
  var mediumchunkexists = false;
  var j = 0;
  while (allchunks[i+1][j] != undefined && mediumchunkexists == false){
    if (allchunks[i+1][j][0] == chunkids.x2 && allchunks[i+1][j][1] == chunkids.y2 && allchunks[i+1][j][2] == chunkids.z2){
      mediumchunkexists = true;
      j -= 2;
    }
    j += 2;
  }
  if (mediumchunkexists == false){
    allchunks[i+1][j] = new Array();
    allchunks[i+1][j][0] = chunkids.x2;
    allchunks[i+1][j][1] = chunkids.y2;
    allchunks[i+1][j][2] = chunkids.z2;
    allchunks[i+1][j+1] = new Array();
  }

  //check if there is a small chunk for the new values. if not, create one
  var smallchunkexists = false;
  var k = 0;
  while (allchunks[i+1][j+1][k] != undefined && smallchunkexists == false){
    if (allchunks[i+1][j+1][k][0] == chunkids.x3 && allchunks[i+1][j+1][k][1] == chunkids.y3 && allchunks[i+1][j+1][k][2] == chunkids.z3){
      smallchunkexists = true;
      k -= 2;
    }
    k += 2;
  }
  if (smallchunkexists == false){
    allchunks[i+1][j+1][k] = new Array();
    allchunks[i+1][j+1][k][0] = chunkids.x3;
    allchunks[i+1][j+1][k][1] = chunkids.y3;
    allchunks[i+1][j+1][k][2] = chunkids.z3;
    allchunks[i+1][j+1][k+1] = new Array();
  }

  //loop through small chunk until an empty spot is found
  var m = 0;
  while (allchunks[i+1][j+1][k+1][m+6] != undefined && allchunks[i+1][j+1][k+1][m+6] != null){
    m += 9;
  }

  //fix negative zeroes
  if (x1 == -0){x1 = 0;}
  if (y1 == -0){y1 = 0;}
  if (z1 == -0){z1 = 0;}
  if (x2 == -0){x2 = 0;}
  if (y2 == -0){y2 = 0;}
  if (z2 == -0){z2 = 0;}
  if (x3 == -0){x3 = 0;}
  if (y3 == -0){y3 = 0;}
  if (z3 == -0){z3 = 0;}

  //add values to small chunk
  allchunks[i+1][j+1][k+1][m] = x1;
  allchunks[i+1][j+1][k+1][m+1] = y1;
  allchunks[i+1][j+1][k+1][m+2] = z1;
  allchunks[i+1][j+1][k+1][m+3] = x2;
  allchunks[i+1][j+1][k+1][m+4] = y2;
  allchunks[i+1][j+1][k+1][m+5] = z2;
  allchunks[i+1][j+1][k+1][m+6] = x3;
  allchunks[i+1][j+1][k+1][m+7] = y3;
  allchunks[i+1][j+1][k+1][m+8] = z3;
}

function remove(x1, y1, z1, x2, y2, z2, x3, y3, z3){
	var chunkids = findchunkids(x3, y3, z3);
  
  //find indices of chunks
  var i = 0;
  while (!(allchunks[i][0] == chunkids.x1 && allchunks[i][1] == chunkids.y1 && allchunks[i][2] == chunkids.z1)){
  	i += 2;
  }
  var j = 0;
  while (!(allchunks[i+1][j][0] == chunkids.x2 && allchunks[i+1][j][1] == chunkids.y2 && allchunks[i+1][j][2] == chunkids.z2)){
  	j += 2;
  }
  var k = 0;
  while (!(allchunks[i+1][j+1][k][0] == chunkids.x3 && allchunks[i+1][j+1][k][1] == chunkids.y3 && allchunks[i+1][j+1][k][2] == chunkids.z3)){
    k += 2;
  }
  i++;
  j++;
  k++;
  
  //find indices of values and remove them
  var m = 0;
  while (!(
  	allchunks[i][j][k][m] == x1 &&
    allchunks[i][j][k][m+1] == y1 &&
    allchunks[i][j][k][m+2] == z1 &&
    allchunks[i][j][k][m+3] == x2 &&
    allchunks[i][j][k][m+4] == y2 &&
    allchunks[i][j][k][m+5] == z2 &&
    allchunks[i][j][k][m+6] == x3 &&
    allchunks[i][j][k][m+7] == y3 &&
    allchunks[i][j][k][m+8] == z3
  )){
    m += 9;
  }
  
  allchunks[i][j][k][m] = null;
  allchunks[i][j][k][m+1] = null;
  allchunks[i][j][k][m+2] = null;
  allchunks[i][j][k][m+3] = null;
  allchunks[i][j][k][m+4] = null;
  allchunks[i][j][k][m+5] = null;
  allchunks[i][j][k][m+6] = null;
  allchunks[i][j][k][m+7] = null;
  allchunks[i][j][k][m+8] = null;

  //if needed remove unused chunks and reorder them, values in small chunk are also if needed reordered
  if (allchunks[i][j][k][m+9+6] != null && allchunks[i][j][k][m+9+6] != undefined){
    while (allchunks[i][j][k][m+9+6] != null && allchunks[i][j][k][m+9+6] != undefined){
      allchunks[i][j][k][m]   = allchunks[i][j][k][m+9];
      allchunks[i][j][k][m+1] = allchunks[i][j][k][m+9+1];
      allchunks[i][j][k][m+2] = allchunks[i][j][k][m+9+2];
      allchunks[i][j][k][m+3] = allchunks[i][j][k][m+9+3];
      allchunks[i][j][k][m+4] = allchunks[i][j][k][m+9+4];
      allchunks[i][j][k][m+5] = allchunks[i][j][k][m+9+5];
      allchunks[i][j][k][m+6] = allchunks[i][j][k][m+9+6];
      allchunks[i][j][k][m+7] = allchunks[i][j][k][m+9+7];
      allchunks[i][j][k][m+8] = allchunks[i][j][k][m+9+8];
      m += 9;
    }
    allchunks[i][j][k][m] = null;
    allchunks[i][j][k][m+1] = null;
    allchunks[i][j][k][m+2] = null;
    allchunks[i][j][k][m+3] = null;
    allchunks[i][j][k][m+4] = null;
    allchunks[i][j][k][m+5] = null;
    allchunks[i][j][k][m+6] = null;
    allchunks[i][j][k][m+7] = null;
    allchunks[i][j][k][m+8] = null;
  }else{
    if (m == 0){
      allchunks[i][j][k-1] = null;
      allchunks[i][j][k] = null;
      if (allchunks[i][j][k-1+2] != null && allchunks[i][j][k-1+2] != undefined){
        while (allchunks[i][j][k-1+2] != null && allchunks[i][j][k-1+2] != undefined){
          allchunks[i][j][k-1] = allchunks[i][j][k-1+2];
          allchunks[i][j][k] = allchunks[i][j][k+2];
          k += 2;
        }
        allchunks[i][j][k-1] = null;
        allchunks[i][j][k] = null;
      }else{
        if (k-1 == 0){
          allchunks[i][j-1] = null;
          allchunks[i][j] = null;
          if (allchunks[i][j-1+2] != null && allchunks[i][j-1+2] != undefined){
            while(allchunks[i][j-1+2] != null && allchunks[i][j-1+2] != undefined){
              allchunks[i][j-1] = allchunks[i][j-1+2];
              allchunks[i][j] = allchunks[i][j+2];
              j += 2;
            }
            allchunks[i][j-1] = null;
            allchunks[i][j] = null;
          }else{
            if (j-1 == 0){
              allchunks[i-1] = null;
              allchunks[i] = null;
              if (allchunks[i-1+2] != null && allchunks[i-1+2] != undefined){
                while(allchunks[i-1+2] != null && allchunks[i-1+2] != undefined){
                  allchunks[i-1] = allchunks[i-1+2];
                  allchunks[i] = allchunks[i+2];
                  i += 2;
                }
                allchunks[i-1] = null;
                allchunks[i] = null;
              }
            }
          }
        }
      }
    }
  }
}

var tempvalues = [];
var tempdistances = [];
var tempsorteddistances = [];
function retrieve(renderdistance){
  //distance from player to middle of chunk or distance from player to value
  var distance;
  //distance from middle to chunk to corner
  var largediagonal = Math.sqrt((500**2)*3);
  var mediumdiagonal = Math.sqrt((50**2)*3);
  var smalldiagonal = Math.sqrt((5**2)*3);
  
  //find all values inside the renderdistance, push them in tempvalues and push their distance to the player in tempdistances
  var i = 0;
  while (allchunks[i] != null && allchunks[i] != undefined){
  	var lcx = allchunks[i][0]*1000;
    var lcy = allchunks[i][1]*1000;
    var lcz = allchunks[i][2]*1000;
  	distance = Math.sqrt((lcx+500-xplayer)**2+(lcy+500-yplayer)**2+(lcz+500-zplayer)**2);
    if (distance < renderdistance+largediagonal){
      var j = 0;
    	while (allchunks[i+1][j] != null && allchunks[i+1][j] != undefined){
      	var mcx = allchunks[i+1][j][0]*100;
        var mcy = allchunks[i+1][j][1]*100;
        var mcz = allchunks[i+1][j][2]*100;
  	    distance = Math.sqrt((lcx+mcx+50-xplayer)**2+(lcy+mcy+50-yplayer)**2+(lcz+mcz+50-zplayer)**2);
        if (distance < renderdistance+mediumdiagonal){
          var k = 0;
          while (allchunks[i+1][j+1][k] != null && allchunks[i+1][j+1][k] != undefined){
          	var scx = allchunks[i+1][j+1][k][0]*10;
            var scy = allchunks[i+1][j+1][k][1]*10;
            var scz = allchunks[i+1][j+1][k][2]*10;
  	        distance = Math.sqrt((lcx+mcx+scx+5-xplayer)**2+(lcy+mcy+scy+5-yplayer)**2+(lcz+mcz+scz+5-zplayer)**2);
            if (distance < renderdistance+smalldiagonal){
       		    var m = 0;
              while (allchunks[i+1][j+1][k+1][m+6] != null && allchunks[i+1][j+1][k+1][m+6] != undefined){
                if (allchunks[i+1][j+1][k+1][m] != null){
                  var middlex = (allchunks[i+1][j+1][k+1][m] + allchunks[i+1][j+1][k+1][m+3] + allchunks[i+1][j+1][k+1][m+6])/3;
                  var middley = (allchunks[i+1][j+1][k+1][m+1] + allchunks[i+1][j+1][k+1][m+4] + allchunks[i+1][j+1][k+1][m+7])/3;
                  var middlez = (allchunks[i+1][j+1][k+1][m+2] + allchunks[i+1][j+1][k+1][m+5] + allchunks[i+1][j+1][k+1][m+8])/3;
                  distance = Math.sqrt((middlex-xplayer)**2+(middley-yplayer)**2+(middlez-zplayer)**2);
                }else{
                  distance = Math.sqrt((allchunks[i+1][j+1][k+1][m+6]-xplayer)**2+(allchunks[i+1][j+1][k+1][m+7]-yplayer)**2+(allchunks[i+1][j+1][k+1][m+8]-zplayer)**2);
                }
                
          			if (distance < renderdistance){
                  tempvalues.push(allchunks[i+1][j+1][k+1][m]);
                  tempvalues.push(allchunks[i+1][j+1][k+1][m+1]);
                  tempvalues.push(allchunks[i+1][j+1][k+1][m+2]);
                  tempvalues.push(allchunks[i+1][j+1][k+1][m+3]);
                  tempvalues.push(allchunks[i+1][j+1][k+1][m+4]);
                  tempvalues.push(allchunks[i+1][j+1][k+1][m+5]);
                  tempvalues.push(allchunks[i+1][j+1][k+1][m+6]);
                  tempvalues.push(allchunks[i+1][j+1][k+1][m+7]);
                  tempvalues.push(allchunks[i+1][j+1][k+1][m+8]);
                  tempdistances.push(distance);
                }
              	m += 9;
              }
        	  }
            k += 2;
          } 
    	  }
    	  j += 2;
      }
    }
    i += 2;
  }
}

//function to load in txt files in var txtcontent
var txtcontent;
function readTextFile(file) {
  txtcontent = "";
  var rawFile = new XMLHttpRequest();
  rawFile.open("GET", file, false);
  rawFile.onreadystatechange = function () {
    if (rawFile.readyState === 4) {
      if (rawFile.status === 200 || rawFile.status == 0) {
        var allText = rawFile.responseText;
        txtcontent = allText;
      }
    }
  }
  rawFile.send(null);
}

//load PerlinNoisePoints.txt into var temp
readTextFile("./PerlinNoisePoints.txt");
var temp = [];
temp = txtcontent.split(", ");
//make numbers of all "?" in array
for (var i = 0; i < temp.length; i++) {
  temp[i] = Number(temp[i]);
}
// load temp into allchunks
for (var i = 0; i < temp.length; i+=3){
  //main point (x,y)
  var x1 = temp[i];
  var y1 = temp[i+1];
  var z1 = (temp[i+2]*3);

  //point on diagonal opposite side (x+1, y+1)
  var x2 = temp[i+256*3+3];
  var y2 = temp[i+256*3+3+1];
  var z2 = (temp[i+256*3+3+2]*3);

  //point at right side (x+1, y)
  var x3 = temp[i+3];
  var y3 = temp[i+3+1];
  var z3 = (temp[i+3+2]*3);

  //point below (x, y+1)
  var x4 = temp[i+256*3];
  var y4 = temp[i+256*3+1];
  var z4 = (temp[i+256*3+2]*3);

  //add two triangles to allchunks with three few exeptions
  if (!(x1 == 255*5 || x1 == 254*5 || x2 == undefined)){
    add(x3, y3, z3, x2, y2, z2, x1, y1, z1);
    add(x4, y4, z4, x2, y2, z2, x1, y1, z1);
  }

}
console.log("loaded PerlinNoisePoints into allchunks");

//load other lines, triangles and points into allchunks
add(null, null, null, -10, 0, 0, -20, 0, 0);
add(null, null, null, -10, 0, 0, -10, -10, 0);
add(null, null, null, -20, 0, 0, -20, -10, 0);
add(null, null, null, -10, -10, 0, -20, -10, 0);
add(null, null, null, -10, 0, 10, -20, 0, 10);
add(null, null, null, -10, 0, 10, -10, -10, 10);
add(null, null, null, -20, 0, 10, -20, -10, 10);
add(null, null, null, -10, -10, 10, -20, -10, 10);
add(null, null, null, -15, 0, 15, -15, -10, 15);

add(-30, -30, 0, -40, -30, 0, -30, -30, 10);
add(-40, -30, 10, -40, -30, 0, -30, -30, 10);
add(-30, -30, 0, -40, -30, 0, -40, -40, 0);
add(-30, -30, 0, -30, -40, 0, -40, -40, 0);

// add(65, 65, 21, 125, 65, 22, 125, 125, 23);
// add(65, 65, 21, 65, 125, 22, 125, 125, 23);

// add(7, 7, 7, 14, 7, 7, 14, 14, 7);
// add(7, 7, 7, 7, 14, 7, 14, 14, 7);
// add(7, 7, 7, 14, 7, 7, 14, 7, 14);
// add(7, 7, 7, 7, 7, 14, 14, 7, 14);
// add(7, 7, 7, 7, 14, 7, 7, 14, 14);
// add(7, 7, 7, 7, 7, 14, 7, 14, 14);

// add(14, 14, 14, 14, 7, 7, 14, 14, 7);
// add(14, 14, 14, 7, 14, 7, 14, 14, 7);
// add(14, 14, 14, 14, 7, 7, 14, 7, 14);
// add(14, 14, 14, 7, 7, 14, 14, 7, 14);
// add(14, 14, 14, 7, 14, 7, 7, 14, 14);
// add(14, 14, 14, 7, 7, 14, 7, 14, 14);

add(null, null, null, null, null, null, 10, -10, 10);
add(null, null, null, null, null, null, 20, -10, 10);
add(null, null, null, null, null, null, 10, 0, 10);
add(null, null, null, null, null, null, 20, 0, 10);
add(null, null, null, null, null, null, 10, -10, 20);
add(null, null, null, null, null, null, 20, -10, 20);
add(null, null, null, null, null, null, 10, 0, 20);
add(null, null, null, null, null, null, 20, 0, 20);
console.log("loaded manual written values into allchunks");

var dynamicValues = []
for (i = 0; i < 9*5; i++){
  dynamicValues.push(25);
}
//null, null, null, 0, 0, 0, 0, 50, 20, null, null, null, 0, 0, 0, 50, 0, 10, null, null, null, null, null, null, 0, 50, 20, null, null, null, null, null, null, 0, 0, 20];
var dynamicVelocities = [];
var dynamicDistances = [];
console.log("loaded manual written dynamic values into dynamicValues");

// console.log(allchunks);

//here is the start where the game will be updating forever and keychecks are initialised
function KeyDetection() {
  //1000ms/50fps=20ms per refresh
  setInterval(game, 20);

  //check if keys are pressed or not pressed
  window.addEventListener('keydown', function (e) { keys[e.keyCode] = true; })
  window.addEventListener('keyup', function (e) { keys[e.keyCode] = false; })
}
//cursor variables
var mousex = 0;
var mousey = 0;
var mousexx = 0;
var mouseyy = 0;
//request pointer lock
document.getElementById("myCanvas").onclick = function () {
  document.getElementById("myCanvas").requestPointerLock();
}
document.addEventListener('pointerlockchange', lockChangeAlert, false);
//react to pointer lock status change
function lockChangeAlert() {
  if (document.pointerLockElement === document.getElementById("myCanvas")) {
    //console.log('The pointer lock status is now locked');
    document.addEventListener("mousemove", canvasLoop, false);
  } else {
    //console.log('The pointer lock status is now unlocked');
    document.removeEventListener("mousemove", canvasLoop, false);
  }
}
//function that handles mouse move events
function canvasLoop(e) {
  var mousex = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
  var mousey = e.movementY || e.mozMovementY || e.webkitMovementY || 0;

  //x is negative because h is inverted, y is negative because screen y goes from top to bottom
  mousexx -= mousex / 1000;
  mouseyy -= mousey / 1000;
  if (mouseyy > Math.PI / 2) {
    mouseyy = Math.PI / 2 - 0.00001;
  }
  if (mouseyy < -Math.PI / 2) {
    mouseyy = -Math.PI / 2 + 0.00001;
  }
  //document.getElementById("testdiv").innerHTML = "X position: " + mousexx + ', Y position: ' + mouseyy;
}

//function that gets called 50 times per second
function game() {
  if (framenumber < 50){
    framenumber++;
  }else{
    framenumber = 0;
  }
  // console.log(framenumber);

  // if (framenumber % 10 == 0){
    if (freeze == false){
      tempvalues.length = 0;
      tempdistances.length = 0;
      retrieve(renderdistance);
    }
    // console.log("retrieval of values triggered");
  // }

  //dynamic points function
  updateDA();

  tempdistances2 = [...tempdistances];
  tempsorteddistances = [...tempdistances2];
  tempsorteddistances.sort(function(a,b){return a-b;});

  //update collision and input
  updateCI();

  //paint new frame on screen
  updateCanvas();
}

function randomInt(max){
  return Math.floor(Math.random() * max);
}

function updateDA(){
  
  if (framenumber == 1){
    for (i = 0; i < dynamicValues.length; i++){ //dynamicValues.length
      dynamicVelocities[i] = ( 5+randomInt(30)-dynamicValues[i] ) / 50;
      // dynamicVelocities[i] = (randomInt(4)-1) / 50;
    }
    // dynamicVelocities[] = 10+randomInt(25);
    // dynamicValues[27+7] = randomInt(25);
  }
  // if (framenumber < 25){
  //   dynamicValues[6] += 1;
  //   dynamicValues[7] -= 1;
  // }else{
  //   dynamicValues[6] -= 1;
  //   dynamicValues[7] += 1;
  // }
  // dynamicValues[6] = 50+10*Math.cos(framenumber/7.958);
  // dynamicValues[7] = 50+10*Math.sin(framenumber/7.958);
  // dynamicValues[18+6] = 50+10*Math.cos(framenumber/7.958);
  // dynamicValues[18+7] = 50+10*Math.sin(framenumber/7.958);
  
  // dynamicValues[9+6] = framenumber;
  
  for (i = 0; i < dynamicValues.length; i++){
    dynamicValues[i] += dynamicVelocities[i];
  }
  

  //add dynamic values to temporary values so they will be rendered in the frame
  tempvalues = tempvalues.concat(dynamicValues);
  //calculate and add the distances to temporary distances so the triangles/lines/points will be rendered in the correct order
  dynamicDistances.length = 0;
  for (i = 0; i < dynamicValues.length/9; i++){
    dynamicDistances[i] = Math.sqrt((dynamicValues[i*9+6] - xplayer)**2 + (dynamicValues[i*9+7] - yplayer)**2 + (dynamicValues[i*9+8] - zplayer)**2);
  }
  tempdistances = tempdistances.concat(dynamicDistances);
}

//change movement and direction based on key presses
function updateCI() {

  //set horizontal and vertical direction to mouse movements
  hdir = mousexx;
  vdir = mouseyy;

  if (gamemode == "free") {
    //console.log("free");
    if (keys) {
      //change gamemode to grounded
      if(!keys[71]){ gs = true; }
      if (keys[71] && gs) { gamemode = "grounded"; gs = false;}

      //determine how x and y should change based on direction while keeping an even speed
      //left and right
      hxdir = Math.cos(hdir + Math.PI / 2);
      hydir = Math.sin(hdir + Math.PI / 2);
      if (keys[37] || keys[65]) { xplayer += hxdir * 1; yplayer += hydir * 1; }
      if (keys[39] || keys[68]) { xplayer -= hxdir * 1; yplayer -= hydir * 1; }

      //forwards and backwards
      hxdir = Math.cos(hdir);
      hydir = Math.sin(hdir);
      if (keys[38] || keys[87]) { xplayer += hxdir * 3; yplayer += hydir * 3; }
      if (keys[40] || keys[83]) { xplayer -= hxdir * 3; yplayer -= hydir * 3; }

      //up and down
      if (keys[81] || keys[32]) { zplayer += 2; }
      if (keys[69] || keys[16]) { zplayer -= 2; }

      //pov correction
      //if (keys[85]) { xratio += .1; }
      //if (keys[73]) { xratio -= .1; }
      //if (keys[79]) { yratio += .1; }
      //if (keys[80]) { yratio -= .1; }
    }

  } else if(gamemode == "grounded"){
    //console.log("grounded");

    //find closest triangle, not looking at z coordinate
    var shortestdistance = 99999;
    var loopvar = 0;
    var index = 0;
    while ( loopvar < tempdistances.length ){
      var horizontaldistance = Math.sqrt( (tempvalues[loopvar*9+6]-xplayer)**2 + (tempvalues[loopvar*9+7]-yplayer)**2 );
      if (shortestdistance > horizontaldistance && tempvalues[loopvar*9] != null){
        shortestdistance = horizontaldistance;
        index = loopvar*9;
      }
      loopvar++;
    }

    // console.log(tempvalues);

    //find z coordinate of the triangle
    var terrainheight = fzcot(tempvalues[index], tempvalues[index+1], tempvalues[index+2], tempvalues[index+3], tempvalues[index+4], tempvalues[index+5], tempvalues[index+6], tempvalues[index+7], tempvalues[index+8]);

    // console.log(index, tempvalues[index], terrainheight);

    //gravity
    zpower -= 0.1;

    //check if player is above or under terrain
    var standing = false;
    if (zplayer < terrainheight+15+2 ){
      zplayer = terrainheight+15-0.1;
      zpower = 0;
      standing = true;
    }

    //link for better collision
    //https://www.desmos.com/calculator/ic2j6ijago ?

    if (keys) {
      //change gamemode to rolling
      if(!keys[71]){ gs = true; }
      if (keys[71] && gs) { gamemode = "rolling"; gs = false;}
      
      //jump
      if (keys[32] && standing) { zpower += 2.4; }

      //left and right
      hxdir = Math.cos(hdir + Math.PI / 2);
      hydir = Math.sin(hdir + Math.PI / 2);
      if (keys[37] || keys[65]) { xplayer += hxdir * 2; yplayer += hydir * 2; }
      if (keys[39] || keys[68]) { xplayer -= hxdir * 2; yplayer -= hydir * 2; }

      //forwards and backwards
      hxdir = Math.cos(hdir);
      hydir = Math.sin(hdir);

      
      if (keys[38] || keys[87]) {
        //if shift is pressed, go faster and change fov
        if (keys[16]){
          xplayer += hxdir * 5; yplayer += hydir * 5;
          // if (xratio < 300){
          //   xratio += 15;
          //   yratio += 7.5;
          // }
        }else{
          xplayer += hxdir * 3; yplayer += hydir * 3;
          // if (xratio > 200){
          //   xratio -= 15;
          //   yratio -= 7.5;
          // }
        }
      }
      if (keys[40] || keys[83]) { xplayer -= hxdir * 3; yplayer -= hydir * 3; }
      
      
      
      // if (keys[85]){ xratio += 1; }
      // if (keys[73]){ xratio -= 1; }
      // if (keys[79]){ yratio += 1; }
      // if (keys[80]){ yratio -= 1; }

      
    }
    //update physics
    //xplayer += xpower;
    //yplayer += ypower;
    zplayer += zpower;

  
  }else{
    //console.log("rolling");

    // xplayerold = xplayer;
    // yplayerold = yplayer;
    // zplayerold = zplayer;

    //how far the player is floating above the ground, can be set to zero
    floatheight = 10;

    //find closest triangle, not looking at z coordinate
    var shortestdistance = 99999;
    var loopvar = 0;
    var index = 0;
    while ( loopvar < tempdistances.length ){
      var horizontaldistance = Math.sqrt( (tempvalues[loopvar*9+6]-xplayer)**2 + (tempvalues[loopvar*9+7]-yplayer)**2 );
      if (shortestdistance > horizontaldistance){
        shortestdistance = horizontaldistance;
        index = loopvar*9;
      }
      loopvar++;
    }
    //find z coordinate of the triangle
    var terrainheight = fzcot(tempvalues[index], tempvalues[index+1], tempvalues[index+2], tempvalues[index+3], tempvalues[index+4], tempvalues[index+5], tempvalues[index+6], tempvalues[index+7], tempvalues[index+8]);
    //find power values and other values of the triangle
    var bouncemath = bounce(tempvalues[index], tempvalues[index+1], tempvalues[index+2], tempvalues[index+3], tempvalues[index+4], tempvalues[index+5], tempvalues[index+6], tempvalues[index+7], tempvalues[index+8]);


    //apply bounce only if the player is under the surface and not multiple times
    if (zplayer-floatheight < terrainheight && wentabove == true){
      //set player to correct contactpoint on surface in line with it's trajectory
      xplayer = bouncemath.xpos;
      yplayer = bouncemath.ypos;
      zplayer = terrainheight+15;//10
      // terrainheight = fzcot(tempvalues[index], tempvalues[index+1], tempvalues[index+2], tempvalues[index+3], tempvalues[index+4], tempvalues[index+5], tempvalues[index+6], tempvalues[index+7], tempvalues[index+8]);
      // zplayer = terrainheight+15;

      //change powers corresponding to a bounce
      xpower = bouncemath.xpow;
      ypower = bouncemath.ypow;
      zpower = bouncemath.zpow;
    }

    //zplayer-floatheight == terrainheight might be a problem

    //determine if player has been above ground
    if (zplayer-floatheight > terrainheight){
      wentabove = true;

      //gravity
      zpower -= 0.1;

    }else{
      wentabove = false;

      //when player is under surface and bounce function hasn't correctly changed zpower
      zpower = Math.abs(zpower);
    }

    //airresistance
    xpower = xpower*0.99;
    ypower = ypower*0.99;
    zpower = zpower*0.99;

    if (keys) {
      //change gamemode to free
      if(!keys[71]){ gs = true; }
      if (keys[71] && gs) { gamemode = "free"; gs = false;}

      //left and right
      hxdir = Math.cos(hdir + Math.PI / 2);
      hydir = Math.sin(hdir + Math.PI / 2);
      if (keys[37] || keys[65]) { xpower += hxdir * 0.1; ypower += hydir * 0.1; }
      if (keys[39] || keys[68]) { xpower -= hxdir * 0.1; ypower -= hydir * 0.1; }

      //forwards and backwards
      hxdir = Math.cos(hdir);
      hydir = Math.sin(hdir);
      if (keys[38] || keys[87]) { xpower += hxdir * 0.2; ypower += hydir * 0.2; }
      if (keys[40] || keys[83]) { xpower -= hxdir * 0.2; ypower -= hydir * 0.2; }

      //jump
      if (zplayer-floatheight < terrainheight+1){
        if (keys[32]) { zpower += 2.4; }
      }
      
    }

    //update physics
    xplayer += xpower;
    yplayer += ypower;
    zplayer += zpower;
    //console.log(xpower, ypower, zpower);

  }

}

//find z coordinate on triangle
//see https://www.geogebra.org/3d/uupmdxxt for visualisation
function fzcot(a, b, c, d, e, f, g, h, i){

  var m = xplayer;
  var n = yplayer;

  //console.log(a, b, c, d, e, f, g, h, i, m , n);

  var l = ((n-b)*(d-a)-(m-a)*(e-b))/((h-b)*(d-a)-(g-a)*(e-b));
  var p;
  if (e-b != 0){
    p = (n-b-l*(h-b))/(e-b);
  }else{
    p = (m-a-l*(g-a))/(d-a);
  }
  // if (e-b == 0 && d-a == 0){console.log("shit, how");}
  // console.log("fzcot: ", e-b, d-a, p);

  var o = c+p*(f-c)+l*(i-c);

  return o;
}

//find new powers corresponding with a bounce with a triangle
//see https://www.geogebra.org/3d/nuzner3a and https://www.geogebra.org/3d/ejqutre2 for visualisation
function bounce(a, b, c, d, e, f, g, h, i){
  var m = xplayer;
  var n = yplayer;
  var o = zplayer-floatheight;

  var l = xpower;
  var p = ypower;
  var q = zpower;

  var r = d-a-((g-a)*(f-c))/(i-c);
  var s = e-b-((h-b)*(f-c))/(i-c);
  var t = ((n-b)*r-(m-a)*s+((o-c)*(s*(g-a)-r*(h-b)))/(i-c))/(p*r-l*s+(-q*(r*(h-b)-s*(g-a)))/(i-c));

  var w = o+t*(-q);
  var v = n+t*(-p);
  var u = m+t*(-l);

  var a1 = -(g-a)/(i-c);
  var b1 = -(e-b)/(f-c);
  var g1 = -((u-(m-l))/(a1)+(v-(n-p))/(b1)+w-(o-q))/(1/(a1**2)+1/(b1**2)+1);

  var c1 = u+g1/a1;
  var d1 = v+g1/b1;
  var e1 = w+g1;

  var f1 = c1-(m-l-c1);
  var i1 = d1-(n-p-d1);
  var k1 = e1-(o-q-e1);

  var l1 = Math.sqrt(l**2+p**2+q**2);
  var m1 = Math.sqrt((l1**2)/((f1-u)**2+(i1-v)**2+(k1-w)**2));

  var xpos = u;
  var ypos = v;
  var zpos = w;

  var xpow = m1*(f1-u);
  var ypow = m1*(i1-v);
  var zpow = m1*(k1-w);

  //console.log(r,s,t,w,v,u,a1,b1,g1,c1,d1,e1,f1,i1,k1,l1,m1);

  var heightdifference = o-w;

  //console.log(heightdifference);

  //return heightdifference between surface and player and new player powers and positions
  return { xpow, ypow, zpow, xpos, ypos, zpos, heightdifference };
}

//update canvas
function updateCanvas() {
  //clear the canvas
  clearcanvas();

  // renderpoint(300, 300, 0, 255, 0, 0.5, 10, 10);
  // renderline(100, 100, 200, 200, 255, 0, 0, 0.5, 5);
  // rendertriangle(400, 400, 400, 500, 500, 400, 0, 0, 255, 0.5);

  //calculate things that only need to be calculated once every frame
  var d; var e; var f; var o1; var p1; var q1; var r1; var s1; var j; var i;
  calculatecamera(hdir, vdir);

  //calculate and paint every triangle, line and point in renderdistance
  var chosenindex = tempsorteddistances.length-1;
  while (chosenindex > -1){
    var index = tempdistances2.indexOf(tempsorteddistances[chosenindex]);
    tempdistances2[index] = null;
    index *= 9;

    if (tempvalues[index] != null){
      var pointvalues1 = calculatepoint(xplayer, yplayer, zplayer, tempvalues[index], tempvalues[index+1], tempvalues[index+2]);
      var pointvalues2 = calculatepoint(xplayer, yplayer, zplayer, tempvalues[index+3], tempvalues[index+4], tempvalues[index+5]);
      var pointvalues3 = calculatepoint(xplayer, yplayer, zplayer, tempvalues[index+6], tempvalues[index+7], tempvalues[index+8]);

      //var dorender = rendercheck(pointvalues1, pointvalues2, pointvalues3);
      //if (dorender == true){}
      if (pointvalues1.infront == true || pointvalues2.infront == true || pointvalues3.infront == true){
        var pointHeight = ((tempvalues[index+8] + 69) / 138) * 255;
        var pointSlope = Math.abs(tempvalues[index+8] - tempvalues[index+5]) + Math.abs(tempvalues[index+8] - tempvalues[index+2]) + Math.abs(tempvalues[index+5] - tempvalues[index+2]);
        var pointDistance = 1 - (tempdistances[index/9] / renderdistance) ** 6;
        
        if (pointvalues1.inside == true || pointvalues2.inside == true || pointvalues3.inside == true){ //needs improvement
        rendertriangle(pointvalues1.xscreen, pointvalues1.yscreen, pointvalues2.xscreen, pointvalues2.yscreen, pointvalues3.xscreen, pointvalues3.yscreen, 255*pointSlope/9, Math.round(255-pointHeight), Math.round(pointHeight), pointDistance);
        }
      }
    }else if (tempvalues[index+3] != null){
      var pointvalues1 = calculatepoint(xplayer, yplayer, zplayer, tempvalues[index+3], tempvalues[index+4], tempvalues[index+5]);
      var pointvalues2 = calculatepoint(xplayer, yplayer, zplayer, tempvalues[index+6], tempvalues[index+7], tempvalues[index+8]);
      if (pointvalues1.infront == true || pointvalues2.infront == true){
        var pointDistance = 1 - (tempdistances[index/9] / renderdistance) ** 6;
        renderline(pointvalues1.xscreen, pointvalues1.yscreen, pointvalues2.xscreen, pointvalues2.yscreen, 255, 0, 0, pointDistance, 5);
      }
    }else{
      var pointvalues1 = calculatepoint(xplayer, yplayer, zplayer, tempvalues[index+6], tempvalues[index+7], tempvalues[index+8]);
      if (pointvalues1.infront == true){
        var pointDistance = 1 - (tempdistances[index/9] / renderdistance) ** 6;
        renderpoint(pointvalues1.xscreen, pointvalues1.yscreen, 0, 255, 0, pointDistance, 10, 10);
      }
    }

    chosenindex--;
  }

}

//clear canvas
function clearcanvas(){
  var id = document.getElementById("myCanvas");
  const context = id.getContext('2d');
  context.clearRect(0, 0, id.width, id.height);
}

//paint point on canvas
function renderpoint(x, y, r, g, b, a, width, height){
  var context = document.getElementById("myCanvas").getContext("2d");
  context.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  context.fillRect(x, y, width, height);
}

//paint line on canvas
function renderline(x1, y1, x2, y2, r, g, b, a, linewidth){
  var context = document.getElementById("myCanvas").getContext("2d");
  context.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  context.lineWidth = linewidth;
  context.beginPath();
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.stroke();
}

//paint triangle on canvas
function rendertriangle(x1, y1, x2, y2, x3, y3, r, g, b, a){
  var context = document.getElementById("myCanvas").getContext("2d");
  context.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  context.beginPath();
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.lineTo(x3, y3);
  context.closePath();
  context.fill();
}

// function rendercheck(pv1, pv2, pv3){
//   if (pv1.infront == true || pv2.infront == true || pv3.infront == true){
//       if (pv1.inside == true || pv2.inside == true || pv3.inside == true){
//         return true;
//       }else if(){

//       }
    
//   }
//   return false;
// }

//calculate points of camera
//see https://www.geogebra.org/3d/wnbpv4jv for visualisation
function calculatecamera(h, v){
  //calculate point B
  d = Math.cos(h) * Math.cos(v);
  e = Math.sin(h) * Math.cos(v);
  f = Math.sin(v);
  // console.log(d,e,f);

  //calculate point L and D
  o1 = Math.cos(h) * Math.cos(v + Math.PI/2);
  p1 = Math.sin(h) * Math.cos(v + Math.PI/2);
  q1 = Math.cos(v);
  // console.log(o1,p1,q1);

  //calculate point C and M
  r1 = Math.sin(h);
  s1 = Math.sin(h - Math.PI/2);
  // console.log(r1,s1);

  //set horizontal and vertical field of view
  j = xFOV;
  i = yFOV;
  // console.log(j,i);
}

//get screen coordinates of point
//see https://www.geogebra.org/3d/wnbpv4jv for visualisation
function calculatepoint(a, b, c, a1, b1, c1){

  //calculate point E
  var g = -1 * (d*(a-a1)+e*(b-b1)+f*(c-c1))/(d**2+e**2+f**2);
  var n2 = a + g * d;
  var o2 = b + g * e;
  var p2 = c + g * f;
  // console.log(g,n2,o2,p2);

  //check if point is in front of the player (can be improved d*0.01?) ae is later used as k
  var infront = false;
  var ae = Math.sqrt((g*d) ** 2 + (g*e) ** 2 + (g*f) ** 2);
  var be = Math.sqrt((d-g*d) ** 2 + (e-g*e) ** 2 + (f-g*f) ** 2);
  if (ae > be) {
    infront = true;
  }
  // console.log(ae,be,infront);

  //calculate point N and O and length AE
  var t1 = -1 * (r1*(n2-a1)+s1*(o2-b1))/(r1**2+s1**2);
  var u1 = -1 * (o1*(n2-a1)+p1*(o2-b1)+q1*(p2-c1))/(o1**2+p1**2+q1**2);
  var k = Math.sqrt((g*d) ** 2 + (g*e) ** 2 + (g*f) ** 2);
  // console.log(t1,u1,k);

  //calculate horizontal and vertical ratio
  var m = (Math.sqrt((t1*r1)**2+(t1*s1)**2))/(Math.tan(j/180*Math.PI)*k);
  var n = (Math.sqrt((u1*o1)**2+(u1*p1)**2+(u1*q1)**2))/(Math.tan(i/180*Math.PI)*k);
  // console.log(m,n);

  //calculate lengths CP, MP, DP and LP
  var cp = Math.sqrt((a-r1-a1)**2+(b-s1-b1)**2+(c-c1)**2);
  var mp = Math.sqrt((a+r1-a1)**2+(b+s1-b1)**2+(c-c1)**2);
  var dp = Math.sqrt((a-o1-a1)**2+(b-p1-b1)**2+(c-q1-c1)**2);
  var lp = Math.sqrt((a+o1-a1)**2+(b+p1-b1)**2+(c+q1-c1)**2);

  //add left/right and up/down information to ratio's
  if (cp < mp){
    m *= -1;
  }
  if (dp < lp){
    n *= -1;
  }
  // console.log(m, n);

  // set x and y coordinates, y is negative because screen y goes from top to bottom
  xscreen = width/2 + m*width/2;
  yscreen = height/2 - n*height/2;
  // console.log(xscreen,yscreen);

  // check if point is in camera-box
  var inside = false;
  if (Math.abs(m) < 1 && Math.abs(n) < 1){
    inside = true;
  }

  //return values
  return {infront, inside, xscreen, yscreen};
}
