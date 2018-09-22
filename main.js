var DAMPING = 0.2,
    GRAVITY = 0.5,
    MOUSE_SIZE = 100,
    SPEED = 0.2;

var canvas, ctx, TWO_PI = Math.PI * 2, balls = [];

window.requestAnimFrame =
    window.requestAnimationFrame;



window.onload = function () {
    canvas = document.getElementById('myCanvas');
    ctx = canvas.getContext('2d');  
    canvas.width = 800;
    canvas.height = 800;
    getAllCurrency();
    update();
}



// Data Loading and produce balls
function getAllCurrency() {
    var request = new XMLHttpRequest();
    request.open('GET','http://www.apilayer.net/api/live?access_key=fb1ecebbd1b7da06cb66ade116d20658&format=1');
    request.onload = function() {
        var data = JSON.parse(this.response).quotes;
        ['USDXAU', 'USDBTC'].forEach(e => delete data[e]);
        var country = Object.keys(data);
        var currencyUSDUarget = Object.values(data);
        var currencyTargetUSD = currencyUSDUarget.map(function(element) {
            return (30*Math.sqrt(1/element));
        });
        for (i=0; i<currencyTargetUSD.length; i++) add_ball(currencyTargetUSD[i], country[i]);
    }
    request.send();
}









var Ball = function(x, y, radius, id) {

    this.x = x;
    this.y = y;

    this.px = x;
    this.py = y;

    this.fx = 0;
    this.fy = 0;

    this.radius = radius;

    this.id = id;
};

var add_ball = function (r, id) {
      var x = Math.random() * (canvas.width - 60) + 30,
          y = Math.random() * (canvas.height - 60) + 30,
          r = r,
          s = true,
          i = balls.length,
          id = id;
  
      if (s) balls.push(new Ball(x, y, r, id));
}

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

Ball.prototype.draw = function(ctx) {

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, TWO_PI);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fill();
    ctx.font = "8px helvetica";
    ctx.beginPath();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillText(this.id, this.x, this.y);
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
                var vel_x1 = ball_1.x - ball_1.px;
                var vel_y1 = ball_1.y - ball_1.py;
                var vel_x2 = ball_2.x - ball_2.px;
                var vel_y2 = ball_2.y - ball_2.py;
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

var update = function() {
    var delta = SPEED;
    var i = balls.length;
    while ( i-- ) {
      balls[i].apply_force(delta);
      balls[i].verlet();
    }
  
    resolve_collisions();
    check_walls();
    
  
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var i = balls.length;
    while (i--) balls[i].draw(ctx);
  
    requestAnimFrame(update);
}
