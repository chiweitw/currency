var COEFF = 6,
    DAMPING = 0.6,
    GRAVITY = 0.6,
    SPEED = 0.3,
    FILTER = 5, //the corrsponded USD for 1 Target currency
    CANVASWIDTH = 400,
    CANVASHEIGHT = 400,
    theta = Math.atan((CANVASWIDTH - FILTER)/CANVASHEIGHT);

var canvas, ctx, TWO_PI = Math.PI * 2, balls = [];

window.requestAnimFrame = window.requestAnimationFrame;

window.onload = function () {
    canvas = document.getElementById('myCanvas');
    ctx = canvas.getContext('2d');  
    canvas.width = CANVASWIDTH;
    canvas.height = CANVASHEIGHT;
    getAllCurrency();
    update();
}


///Gata Data drom API///
function getAllCurrency() {
    var request = new XMLHttpRequest();
    request.open('GET','http://www.apilayer.net/api/live?access_key=fb1ecebbd1b7da06cb66ade116d20658&format=1');
    request.onload = function() {
        var data = JSON.parse(this.response).quotes;
        ['USDXAU', 'USDBTC','USDCLF','USDXAG'].forEach(e => delete data[e]);
        var country = Object.keys(data);
        var currencyUSDUarget = Object.values(data);
        var currencyTargetUSD = currencyUSDUarget.map(function(element) {

            return (COEFF*Math.sqrt(1/element)); 
        });
        for (i=0; i<currencyTargetUSD.length; i++) {
            add_ball(currencyTargetUSD[i], country[i].slice(3, 6));
        }
    }
    request.send();
}

/// Update Callback///
var update = function() {
    var delta = SPEED;
    var i = balls.length;
    while ( i-- ) {
      balls[i].apply_force(delta);
      balls[i].verlet();
    }  
    resolve_collisions();
    check_walls();
    showResults();
    beautify();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var i = balls.length;
    while (i--) balls[i].draw(ctx); 
    requestAnimFrame(update);
}

///plot results///

function showResults() {
    var canvas = document.getElementById('data');
    var ctx = canvas.getContext('2d'); 
    canvas.width = CANVASWIDTH + 200;
    canvas.height = CANVASHEIGHT + 200;
    var count = 0;
    for (i=0; i<balls.length; i++) {
        
        if (balls[i].radius > FILTER) {
            var text = balls[i].id.toUpperCase() + ": " + balls[i].radius.toFixed(3);
            ctx.beginPath();
            ctx.moveTo(balls[i].x, balls[i].y);
            ctx.lineTo(CANVASWIDTH+30, (count+1)*20);
            ctx.strokeStyle="rgba(0,0,0,0.4)";
            ctx.stroke();
            ctx.font = "14px Helvetica";
            ctx.fillText(text, CANVASWIDTH+30, (count+1)*20);
            count++; 
        }
    } 
}


///Ball Object///
var Ball = function(x, y, radius, id) {
    this.x = x;
    this.y = y;
    this.px = x;
    this.py = y;
    this.fx = 0;
    this.fy = 0;
    this.radius = radius;
    this.id = id.toLowerCase();
};

var add_ball = function (r, id) {
      var x = Math.random() * (canvas.width - 60) + 30,
          y = 30,
          r = r,
          s = true,
          i = balls.length,
          id = id;
  
      if (s) balls.push(new Ball(x, y, r, id));
}

Ball.prototype.draw = function(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, TWO_PI);
    ctx.shadowBlur=20;
    ctx.shadowColor="yellow";
    ctx.fillStyle = 'rgba(255,255,255,1)';
    ctx.fill();
    ctx.font = "12px helvetica";
    ctx.beginPath();
    ctx.fillStyle = 'rgba(0,0,0, 0.8)';
    var text = this.id;
    ctx.fillText(text, this.x-ctx.measureText(text).width/2, this.y);
};

Ball.prototype.apply_force = function(delta) {

    this.fy += GRAVITY;

    this.x += this.fx * delta;
    this.y += this.fy * delta;

    this.fx = this.fy = 0;
};

Ball.prototype.verlet = function() {

    var nx = (this.x * 2) - this.px;
    var ny = (this.y * 2) - this.py;

    this.px = this.x;
    this.py = this.y;

    this.x = nx;
    this.y = ny;
};

var resolve_collisions = function(ip) {
    var i = balls.length;
    while (i--) {
      var ball_1 = balls[i];
      var n = balls.length; 
      while (n--) {
            if (n == i) continue;
            var ball_2 = balls[n];
            var diff_x = ball_1.x - ball_2.x;
            var diff_y = ball_1.y - ball_2.y;
            var length    = diff_x * diff_x + diff_y * diff_y;
            var dist      = Math.sqrt(length);
            var real_dist = dist - (ball_1.radius + ball_2.radius);
            if (real_dist < 0) {
                var depth_x = diff_x * (real_dist / dist);
                var depth_y = diff_y * (real_dist / dist);
                ball_1.x -= depth_x * 0.5;
                ball_1.y -= depth_y * 0.5;
                ball_2.x += depth_x * 0.5;
                ball_2.y += depth_y * 0.5;
            }
      }
    }
}

var check_walls = function() {
    var i = balls.length;

    while (i--) {
        var ball = balls[i];
        var d = ball.x*Math.cos(theta)-ball.y*Math.sin(theta)-ball.radius;
        var d2 = (CANVASWIDTH-ball.x)*Math.cos(theta)-ball.y*Math.sin(theta)-ball.radius;
        var d3 = ball.x*Math.cos(theta)-(CANVASHEIGHT-ball.y)*Math.sin(theta)-ball.radius;
        var d4 = (CANVASWIDTH-ball.x)*Math.cos(theta)-(CANVASHEIGHT-ball.y)*Math.sin(theta)-ball.radius;
        var hc = 0.5*CANVASHEIGHT - (ball.radius - 0.5*FILTER*Math.cos(theta))/Math.sin(theta);

        if (ball.y < CANVASHEIGHT*0.5){
            if (d<=0) {
                var vel_x = ball.px - ball.x;
                ball.x -= d*Math.cos(theta);
                ball.px = ball.x - vel_x * DAMPING;
                var vel_y = ball.py - ball.y;
                ball.y -= d*Math.sin(theta);
                ball.py = ball.y - vel_y * DAMPING;
            }
            if (d2<=0) {
                var vel_x = ball.px - ball.x;
                ball.x += d2*Math.cos(theta);
                ball.px = ball.x - vel_x * DAMPING;
                var vel_y = ball.py - ball.y;
                ball.y -= d2*Math.sin(theta);
                ball.py = ball.y - vel_y * DAMPING;
            }
        } else {
            if (d3<=0) {
                var vel_x = ball.px - ball.x;
                ball.x -= d3*Math.cos(theta);
                ball.px = ball.x - vel_x * DAMPING;
                var vel_y = ball.py - ball.y;
                ball.y += d3*Math.sin(theta);
                ball.py = ball.y - vel_y * DAMPING;
            }
            if (d4<=0) {
                var vel_x = ball.px - ball.x;
                ball.x += d4*Math.cos(theta);
                ball.px = ball.x - vel_x * DAMPING;
                var vel_y = ball.py - ball.y;
                ball.y += d4*Math.sin(theta);
                ball.py = ball.y - vel_y * DAMPING;
            }
        }

       
        while (ball.y > hc && ball.radius > FILTER) {
                var diff = ball.y - hc;
                var vel_y = ball.py - ball.y;
                ball.y -= diff ; 
                ball.py = ball.y - vel_y * DAMPING;
        }


        if (ball.x < ball.radius) {
            var vel_x = ball.px - ball.x;
            ball.x = ball.radius;
            ball.px = ball.x - vel_x * DAMPING;
        } else if (ball.x + ball.radius > canvas.width) {
            var vel_x = ball.px - ball.x;
            ball.x = canvas.width - ball.radius;
            ball.px = ball.x - vel_x * DAMPING;
        }
        if (ball.y < ball.radius) {
            var vel_y = ball.py - ball.y;
            ball.y = ball.radius;
            ball.py = ball.y - vel_y * DAMPING;
        } else if (ball.y + ball.radius > canvas.height) {
            var vel_y = ball.py - ball.y;
            ball.y = canvas.height - ball.radius;
            ball.py = ball.y - vel_y * DAMPING;
        }      
    }
}


///Derecorating///
function beautify() {
    var canvas = document.getElementById('data');
    var ctx = canvas.getContext('2d'); 
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.lineTo(CANVASWIDTH*0.5-FILTER*0.5, CANVASHEIGHT*0.5);
    ctx.lineTo(0, CANVASHEIGHT);


    ctx.moveTo(CANVASWIDTH,0);
    ctx.lineTo(CANVASWIDTH*0.5+FILTER*0.5, CANVASHEIGHT*0.5);
    ctx.lineTo(CANVASWIDTH, CANVASHEIGHT);
    ctx.strokeStyle="transparent";
    ctx.stroke();

    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fill();
}



