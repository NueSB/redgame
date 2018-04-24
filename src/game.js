// version 158

/************
   Controls:
   
 Z   -   Jump
 X   -   Shoot
 C   -   Reverse gravity
*************/
'use strict';

var spritesheet = new Image();
var fontsheet = new Image();

//
// game
//
var canvas = document.getElementById('c');
var ctx = canvas.getContext("2d");

//
//
//

var TIME = {
  frame: 0
};

var GLOBAL = {
  OBJECTS: [],
  KEYS: new Map(),
  GRAVITY: 1.0,
  FONT: new Sprite(),
  ROOM:
  {
    width: 1280,
    height: 720,
    bg: "#000000"
  }
};

// classes //
function Sprite(src, x, y, w, h)
{
  return {
    src: src,
    x: x,
    y: y,
    w: w,
    h: h,
    
    draw: function(xpos, ypos, xscale, yscale)
    {
      ctx.drawImage(this.src,
                    this.x,
                    this.y,
                    this.w,
                    this.h,
                    xpos,
                    ypos,
                    xscale,
                    yscale);
    }
  };
}

function AnimatedSprite(src, x, y, w, h,
                        frame, frames, time, offset)
{
  let a = new Sprite(src, x, y, w, h);
  a.ticks = 1;
  a.time = time;
  a.frame = frame;
  a.frames = frames;
  a.offset = offset;
  a.type = "AnimatedSprite";
  
  a.update = function()
  {
    a.ticks++;
    if (a.ticks > a.time)
    {
      a.ticks = 0;
      a.frame++;
      if (a.frame > a.frames)
      {
        a.frame = 0;
      }
    }
  };
  
  a.draw = function(xpos, ypos, xscale, yscale)
  {
    ctx.drawImage(a.src,
                  a.x + (a.w * a.frame) + a.offset,
                  a.y,
                  a.w,
                  a.h,
                  xpos,
                  ypos,
                  xscale,
                  yscale);
  };
  
  GLOBAL.OBJECTS.push(a);
  return a;
}

function Projectile(x, y, w, h, speed, dir, sprite)
{
  var a = {
    x: x,
    y: y,
    w: w,
    h: h,
    spd: speed,
    angle: dir,
    sprite: sprite,
    type: "Projectile",
    
    update: function()
    {
      if (this.x > GLOBAL.ROOM.width ||
          this.x < 0 ||
          this.y < 0 ||
          this.y > GLOBAL.ROOM.height)
      {
        arrayRemove(this, GLOBAL.OBJECTS);
      }
      
            
      for(let i = 0; i < GLOBAL.OBJECTS.length; i++)
      {
        let obj = GLOBAL.OBJECTS[i];
        if (obj.type === "Object")
        {
        
        if (boxIntersect(this.x + speed * Math.cos(this.angle * Math.PI/180),
                         this.y + speed * Math.cos(this.angle * Math.PI/180),
                         this.w, this.h,
                         obj.x, obj.y,
                         obj.xscale, obj.yscale))
          {
            arrayRemove(this, GLOBAL.OBJECTS);
          }
        }
      }
      this.x += speed * Math.sin(this.angle * Math.PI/180);
      this.y += speed * Math.cos(this.angle * Math.PI/180);
      this.draw();
    },
    
    draw: function()
    {
      this.sprite.draw(this.x, this.y, this.w, this.h);
    }
  };
  
  GLOBAL.OBJECTS.push(a);
  
  return a;
  
}

function Weapon(name, owner, auto, delay, offset, projectile, sprite, size)
{
  let a = {
    x: 50,
    y: 50,
    name: (name ? name : "h"),
    owner: owner,
    auto: auto,
    delay: delay,
    offset: offset,
    projectile: projectile,
    sprite: sprite,
    size: size,
    // private (not actually)
    timer: delay,
    origspritex: sprite.x,
    facing: 1,
    
    update: function()
    {
      this.timer = Math.max(0, this.timer - 1);
      this.x = this.owner.x + this.owner.xscale/2 + this.offset[0];
      this.x -= this.owner.facing * this.sprite.w * this.size;
      this.y = this.owner.y + this.owner.yscale/2 + this.offset[1];
      this.sprite.x = this.origspritex + (this.owner.facing == 1 ? this.sprite.w : 0); 
      
      if ((this.auto ? keyDown("X") : keyPressed("X")) && this.timer === 0)
      {
        this.timer = this.delay;

        let p = this.projectile;
        let direction = 180 * owner.facing + 90;
        let offset = (this.owner.facing == 0 ? 1 :-1);
        if (this.owner.up)
        {
          offset = 0;
          direction = 180;
        }
        
        new Projectile(this.x + this.sprite.w * this.size * offset, this.y,
                      p.w, p.h, p.spd, direction, p.sprite);
      }
      this.draw();
    },
    
    draw: function()
    {
      ctx.textStyle = "14px monospace";
      this.sprite.draw(this.x, this.y,
                       this.sprite.w * this.size, this.sprite.h * this.size);
    }
  };
  
  return a;
}


function Enemy(x, y, w, h, sprite)
{
  let obj = {
    x: x,
    y: y,
    xscale: w,
    yscale: h,
    sprite: sprite,
    vx: 0,
    vy: 3,
    merge: false,
    type: "Enemy",
    
    update: function()
    {
      this.vy += 0.1 * GLOBAL.GRAVITY;
      this.vx += (player.x > this.x) ? 0.01 : -0.01; 
      
            for(let i = 0; i < GLOBAL.OBJECTS.length; i++)
      			{
             
     			   let obj = GLOBAL.OBJECTS[i];
             if (obj === this) continue;
        if (["Object", "Player", "Enemy"].includes(obj.type))
        {
          if (boxIntersect(this.x, this.y,
                           this.xscale, this.yscale,
                           obj.x, obj.y,
                           obj.xscale, obj.yscale))
            {
             if (obj.type === "Enemy")
              {
                if (!this.merge) break;
                this.xscale += obj.xscale;
                this.yscale += obj.yscale;
                arrayRemove(obj, GLOBAL.OBJECTS);
              }
              this.vy = 5 * -GLOBAL.GRAVITY;
              if (obj.type === "Player") obj.damage(1);
            }
      }
      }
      this.x += this.vx;
      this.y += this.vy;
      this.draw();
    },
    
    draw: function()
    {
      this.sprite.draw(this.x, this.y, this.xscale, this.yscale);
    }
  };
  
  
  GLOBAL.OBJECTS.push(obj);
  return obj;
}

function DeathScreen()
{
  var a = {
    timer: 0,
    timerEvents: {},
    
    update: function()
    {
      this.timer++;
    }
  };
  GLOBAL.OBJECTS.push(a);
  return a;
}

// main objs //
function Player(x, y, wep) 
{
return {
  x: x,
  y: y,
  vx: 0,
  vy: 10,
  maxvy: 12,
  xscale: 16,
  yscale: 32,
  facing: 1,
  up: false,
  speed: 4.6,
  jumpTime: 0,
  grounded: false,
  jumping: false,
  hp: 3,
  sprite: new Sprite(spritesheet, 0, 0, 5, 9),
  TMPsprite: new AnimatedSprite(spritesheet, 0, 46, 13, 18, 0, 7, 10, 0),
  weapon: wep,
  weapons: [wep],
  type: "Player",
  // weapon //
  weaponSpriteOffset: (this.weapon ? this.weapon.sprite.h : 10),
  // damage //
  invincibilityFrames: 180,
  dTimerRun: false,
  damageTimer: 0,
  damageFlash: false,
  damageFlashTimer: 0,
  damageFlashDelay: {orig: 30, current: 0},
  // life (or death)
  dead: false,
  
  equip: function(weapon)
  {
    this.weapon = weapon;
    this.weaponSpriteOffset = weapon.sprite.h;
    //if (!this.weapons.includes(weapon))
  },
  
  damage: function(dmg, force)
  {
    if (this.damageTimer != 0) return;
    this.hp -= dmg;
    this.damageFlash = !this.damageFlash;
    this.dTimerRun = true;
  },
  
  die: function()
  {
    this.dead = true;
    new DeathScreen();
  },
  
  input: function()
  {
    let left = boolInt(keyDown("ARROWLEFT"));
    let right = boolInt(keyDown("ARROWRIGHT"));
    this.up = boolInt(keyDown("ARROWUP"));
    let down = boolInt(keyDown("ARROWDOWN"));
    this.vx = clamp(this.vx + 
    (this.speed / 8 * right) -
     this.speed / 8 * left, -this.speed, this.speed);
    if (!left && !right || left && right && this.grounded) this.vx *= 0.7;
    if (left != 0) this.facing = 1;
    else if (right != 0) this.facing = 0;
    if (keyDown("Z"))
    {
      if (this.grounded) this.jumping = true;
    }
    else
    {
      this.jumping = false;
      this.jumpTime = 0;
    }
    
    if (this.jumping)
    {
      this.jumpTime = clamp(this.jumpTime + 0.12, 0, 1.7);
      this.vy = clamp(this.vy + (1.7 - this.jumpTime) * -GLOBAL.GRAVITY, 
                     -this.maxvy / 2, this.maxvy / 2);
    }
    
    if (keyPressed("C"))
    {
      GLOBAL.GRAVITY *= -1;
      this.sprite.y = GLOBAL.GRAVITY < 0 ? 10 : 0;
      this.weapon.sprite.y += (GLOBAL.GRAVITY < 0 ? this.weaponSpriteOffset : -this.weaponSpriteOffset);
      
    }
    
    if (keyPressed("B"))
    {
      new Enemy(this.x, this.y - 128, this.xscale/2, this.yscale/2, this.sprite);
    }
    
    this.sprite.x = 12 * this.facing;
    
    if (keyPressed("R"))
    {
      this.vx = 0;
      this.vy = 0;
      this.x = 0;
      this.y = 0;
    }
    
    if (keyPressed("SHIFT") && keyPressed("L"))
    {
      loadLevel(GLOBAL.LEVELS[1]);
    }
  },
  
  update: function()
  {
    this.input();
    
    if (!this.grounded) this.vy = clamp(this.vy + GLOBAL.GRAVITY * (this.jumping ? 0.16 : 0.32), -this.maxvy, this.maxvy);
    
    // collision hell
    // horizontal
    
    let i = 0;
    let collision = false;
    
    for (i=0, collision=false; i < Math.floor(Math.abs(this.vx)); i++)
    {
      for (let z in GLOBAL.OBJECTS)
      {
        let obj = GLOBAL.OBJECTS[z];
        if (obj != this)
        {
            if (obj.type === "Object" &&
                boxIntersect(this.x + sign(this.vx), this.y,
                             this.xscale, this.yscale, 
                             obj.x, obj.y,
                             obj.xscale, obj.yscale))
                {
                  this.vx = 0;
                  collision = true;
                  break;
                }
              
          }
      }
      
        if (collision) break;
        this.x += sign(this.vx);
    }
    
    // vertical
    
    for (i=0, collision=false; i < Math.floor(Math.abs(this.vy)); i++)
    {
      for (let z in GLOBAL.OBJECTS)
      {
        let obj = GLOBAL.OBJECTS[z];
        if (obj.type === "Object")
        {
          if (boxIntersect(this.x, this.y + sign(this.vy),
                           this.xscale, this.yscale, 
                           obj.x, obj.y,
                           obj.xscale, obj.yscale))
            {
              this.vy = 0;
              collision = true;
              break;
            }
              
          }
        }
        if (collision) break;
        this.y += sign(this.vy);
     }
    
    // ground collision
    for (let o = 0; o < GLOBAL.OBJECTS.length; o++)
    {
      let obj = GLOBAL.OBJECTS[o];
      if (obj.type === "Object" && 
      boxIntersect(this.x, this.y + GLOBAL.GRAVITY,
                       this.xscale, this.yscale,
                       obj.x, obj.y,
                       obj.xscale, obj.yscale))
      {
        this.grounded = true;
        break;
      }
      this.grounded = false;

    }
    
    // <\collision>
    
    // damage timer
    if (this.dTimerRun)
    {
      this.damageTimer++;
      
      if (this.damageFlashDelay.current <= this.damageFlashTimer)
      {
        this.damageFlash = !this.damageFlash;
        this.damageFlashTimer = 0;
        this.damageFlashDelay.current = Math.min(this.damageFlashDelay.orig, this.damageFlashDelay.current + 0.25);
      }
      
      this.damageFlashTimer++;
      
      if (this.damageTimer - this.invincibilityFrames === 0) 
      {
        this.dTimerRun = false;
        this.damageTimer = 0;
        this.damageFlashTimer = 0;
        this.damageFlash = false;
        this.damageFlashDelay.current = 0;
      }
    }
    // e
    
    if (!this.damageFlash) this.draw();
  },
  
    
  draw: function()
  {
    this.sprite.draw(this.x, this.y, this.xscale, this.yscale);
    ctx.textStyle = "14px Times New Roman white";
  },
};
}

function Camera(target) {

return {
  x: 0,
  y: 0,
  type: "Camera",
  update: function()
  {
    this.x = (target.x - canvas.width / 2) * 0.99;
    this.y = (target.y - canvas.height / 2) * 0.99;
  },
  
  drawGUI: function(x, y)
  {
    ctx.drawImage(spritesheet, 32, 0, 96, 32,
                  x+1, y+1, 215, 32);
    
    ctx.fillStyle = "#ff0055";
    if (target.type === "Player") ctx.fillRect(x+3, y+9, 209 * (target.hp / 3), 14);
  }
};
}



let player = new Player(0, 0),
    camera = new Camera(player);


let o = new Enemy(64,64);


GLOBAL.WEAPONS = [
  new Weapon("testpistol", player, true, 5, [0, 0], 
             new Projectile(0, 0, 12, 12, 20, 0, player.sprite),
             new Sprite(spritesheet, 10, 22, 10, 6), 
             2)
  // Weapon(name, owner, auto, delay, offset, projectile, sprite, size)
  // Projectile(x, y, xscale, yscale, spd, dir, sprite)
];

/// debug!
player.equip(GLOBAL.WEAPONS[0]);

// main loop //
function update()
{
  ++TIME.frame;
 // ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = GLOBAL.ROOM.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  let xmove = camera.x,
      ymove = camera.y;
  ctx.translate(-xmove, -ymove);
  for (var i = 0; i < GLOBAL.OBJECTS.length; i++)
  {
    var obj = GLOBAL.OBJECTS[i];
    obj.update();
  }
  
  for (var j = 0; j < GLOBAL.WEAPONS.length; j++)
  {
    GLOBAL.WEAPONS[j].update();
  }
  
  camera.drawGUI(xmove, ymove);
  window.requestAnimationFrame(update);
  ctx.translate(xmove, ymove);
}
document.addEventListener('keydown', (key) =>
{
  const keyName = key.key.toUpperCase();
  // alert(keyName);
  GLOBAL.KEYS.set(keyName, true);
});
document.addEventListener('keyup', (key) =>
{
  const keyName = key.key.toUpperCase();
  GLOBAL.KEYS.set(keyName, false);
});
// init //
spritesheet.onload = function()
{
  ctx.imageSmoothingEnabled = false;
  loadLevel(GLOBAL.LEVELS[0]);
  update();
};
//
// levels, saves, etc
//
function loadLevel(level)
{
  GLOBAL.OBJECTS = [player, camera];
  
  level = JSONfn.parse(String.raw`${atob(level)}`);
  
  for(let i in level.objs)
  {
    let obj = level.objs[i];
    GLOBAL.OBJECTS.push(obj);
  }
  
}


//
// utils
//

function instantiate(obj, x, y)
{
  return Object.assign({}, obj);
}
function keyDown(keyName)
{
  return GLOBAL.KEYS.get(keyName);
}
function keyUp(keyName)
{
  return !GLOBAL.KEYS.get(keyName);
}
function keyPressed(keyName)
{
  var pressed = keyDown(keyName);
  if (pressed)
  {
    GLOBAL.KEYS.set(keyName, false);
  }
  return pressed;
}
function boxIntersect(x, y, xscl, yscl, dx, dy, dxscl, dyscl)
{
  return Math.abs((x + xscl / 2) - (dx + dxscl / 2)) * 2 < (xscl + dxscl) &&
    Math.abs((y + yscl / 2) - (dy + dyscl / 2)) * 2 < (yscl + dyscl);
}

// helpers

function arrayRemove(obj, array)
{
  let index = array.indexOf(obj);
  if (index === -1) return array;
  return array.splice(index, 1);
}
function lerp(x, y, amt)
{
  return x * (1 - amt) + y * amt;
}
function slerp(x, target)
{
  return x + (target - x) * 0.2;
}
function min(x, y)
{
  return x <= y ? x : y;
}
function clamp(val, min, max)
{
  if (val > max) return max;
  return (val > min) ? val : min;
}
function boolInt(bool)
{
  return bool ? 1 : 0;
}
function sign(int)
{
  return int > 1 ? 1 : -1;
}
function range(begin, end)
{
  return Array(end - begin + 1).fill().map((x, i) => i + begin);
}
function dot(a, b)
{
  for (var i = 0, r = []; i < ((a.length <= b.length) ? a.length : b.length); i++)
    r.push(a[i] * b[i]);
  return r.reduce((x, y) => x + y);
}
function dist(a, b)
{
  for (var i = 0, r = []; i < ((a.length <= b.length) ? a.length : b.length); i++)
    r.push(Math.pow(a[i] - b[i], 2));
  return Math.sqrt(r.reduce((x, y) => x + y));
}
//
var JSONfn;
if (!JSONfn) 
{
    JSONfn = {};
}
(function () 
{
  JSONfn.stringify = function(obj) 
  {
    
    return (JSONfn.stringifix(JSON.stringify(obj,function(key, value)
    {
      return (typeof value === 'function' ) ? 
      value.toString() : value;
    })));
  }
  JSONfn.parse = function(str) 
  {
    return JSON.parse(str,function(key, value)
    {
        if(typeof value != 'string') return value;
        return ( value.substring(0,8) == 'function') ? 
        eval('('+value+')') : value;
    });
  }
  
      
  JSONfn.stringifix = function(str)
  {
    return str.replace(/\\n/g, "").replace(/\\"/g, "\\\"");
  }
}());


// data section
// sorry for the mess! :p

(function(){
spritesheet.src = "data:image/png;base64,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"
//fontsheet.src = "data:image/png;base64,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";


GLOBAL.LEVELS = [

`eyJuYW1lIjoiYSIsIm9ianMiOlt7IngiOjAsInkiOjQxNiwiY29sb3IiOiIjRkYwMDMzIiwieHNjYWxlIjo3MzYsInlzY2FsZSI6OTYsInR5cGUiOiJPYmplY3QiLCJkcmF3IjoiZnVuY3Rpb24gKCkgICAgICAgIHsgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IHRoaXMuY29sb3I7ICAgICAgICAgIGN0eC5maWxsUmVjdCh0aGlzLngsIHRoaXMueSwgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnhzY2FsZSwgdGhpcy55c2NhbGUpOyAgICAgICAgfSIsInVwZGF0ZSI6ImZ1bmN0aW9uICgpICAgICAgICB7ICAgICAgICAgIHRoaXMuZHJhdygpOyAgICAgICAgfSJ9LHsieCI6LTMyLCJ5IjotMTYwLCJjb2xvciI6IiNGRjAwMzMiLCJ4c2NhbGUiOjMyLCJ5c2NhbGUiOjMyLCJ0eXBlIjoiT2JqZWN0IiwiZHJhdyI6ImZ1bmN0aW9uICgpICAgICAgICB7ICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSB0aGlzLmNvbG9yOyAgICAgICAgICBjdHguZmlsbFJlY3QodGhpcy54LCB0aGlzLnksICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy54c2NhbGUsIHRoaXMueXNjYWxlKTsgICAgICAgIH0iLCJ1cGRhdGUiOiJmdW5jdGlvbiAoKSAgICAgICAgeyAgICAgICAgICB0aGlzLmRyYXcoKTsgICAgICAgIH0ifSx7IngiOjAsInkiOi0xOTIsImNvbG9yIjoiI0ZGMDAzMyIsInhzY2FsZSI6MzIsInlzY2FsZSI6MzIsInR5cGUiOiJPYmplY3QiLCJkcmF3IjoiZnVuY3Rpb24gKCkgICAgICAgIHsgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IHRoaXMuY29sb3I7ICAgICAgICAgIGN0eC5maWxsUmVjdCh0aGlzLngsIHRoaXMueSwgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnhzY2FsZSwgdGhpcy55c2NhbGUpOyAgICAgICAgfSIsInVwZGF0ZSI6ImZ1bmN0aW9uICgpICAgICAgICB7ICAgICAgICAgIHRoaXMuZHJhdygpOyAgICAgICAgfSJ9LHsieCI6MzUyLCJ5IjoxOTIsImNvbG9yIjoiI0ZGMDAzMyIsInhzY2FsZSI6MTI4LCJ5c2NhbGUiOjIyNCwidHlwZSI6Ik9iamVjdCIsImRyYXciOiJmdW5jdGlvbiAoKSAgICAgICAgeyAgICAgICAgICBjdHguZmlsbFN0eWxlID0gdGhpcy5jb2xvcjsgICAgICAgICAgY3R4LmZpbGxSZWN0KHRoaXMueCwgdGhpcy55LCAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMueHNjYWxlLCB0aGlzLnlzY2FsZSk7ICAgICAgICB9IiwidXBkYXRlIjoiZnVuY3Rpb24gKCkgICAgICAgIHsgICAgICAgICAgdGhpcy5kcmF3KCk7ICAgICAgICB9In0seyJ4IjotMzIsInkiOi0xOTIsImNvbG9yIjoiI0ZGMDAzMyIsInhzY2FsZSI6MzIsInlzY2FsZSI6MzIsInR5cGUiOiJPYmplY3QiLCJkcmF3IjoiZnVuY3Rpb24gKCkgICAgICAgIHsgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IHRoaXMuY29sb3I7ICAgICAgICAgIGN0eC5maWxsUmVjdCh0aGlzLngsIHRoaXMueSwgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnhzY2FsZSwgdGhpcy55c2NhbGUpOyAgICAgICAgfSIsInVwZGF0ZSI6ImZ1bmN0aW9uICgpICAgICAgICB7ICAgICAgICAgIHRoaXMuZHJhdygpOyAgICAgICAgfSJ9XX0=`,

`eyJuYW1lIjoiYSIsIm9ianMiOlt7IngiOjMyMCwieSI6MTkyLCJ4c2NhbGUiOjMyLCJ5c2NhbGUiOjMyLCJ0eXBlIjoiT2JqZWN0IiwiZHJhdyI6ImZ1bmN0aW9uICgpICAgICAgICB7ICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBcIiNGRjAwMzNcIjsgICAgICAgICAgY3R4LmZpbGxSZWN0KHRoaXMueCwgdGhpcy55LCAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMueHNjYWxlLCB0aGlzLnlzY2FsZSk7ICAgICAgICB9IiwidXBkYXRlIjoiZnVuY3Rpb24gKCkgICAgICAgIHsgICAgICAgICAgdGhpcy5kcmF3KCk7ICAgICAgICB9In0seyJ4Ijo5NiwieSI6Mjg4LCJ4c2NhbGUiOjMyLCJ5c2NhbGUiOjMyLCJ0eXBlIjoiT2JqZWN0IiwiZHJhdyI6ImZ1bmN0aW9uICgpICAgICAgICB7ICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBcIiNGRjAwMzNcIjsgICAgICAgICAgY3R4LmZpbGxSZWN0KHRoaXMueCwgdGhpcy55LCAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMueHNjYWxlLCB0aGlzLnlzY2FsZSk7ICAgICAgICB9IiwidXBkYXRlIjoiZnVuY3Rpb24gKCkgICAgICAgIHsgICAgICAgICAgdGhpcy5kcmF3KCk7ICAgICAgICB9In0seyJ4IjoyMjQsInkiOjMyMCwieHNjYWxlIjozMiwieXNjYWxlIjozMiwidHlwZSI6Ik9iamVjdCIsImRyYXciOiJmdW5jdGlvbiAoKSAgICAgICAgeyAgICAgICAgICBjdHguZmlsbFN0eWxlID0gXCIjRkYwMDMzXCI7ICAgICAgICAgIGN0eC5maWxsUmVjdCh0aGlzLngsIHRoaXMueSwgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnhzY2FsZSwgdGhpcy55c2NhbGUpOyAgICAgICAgfSIsInVwZGF0ZSI6ImZ1bmN0aW9uICgpICAgICAgICB7ICAgICAgICAgIHRoaXMuZHJhdygpOyAgICAgICAgfSJ9LHsieCI6MCwieSI6LTE5MiwieHNjYWxlIjozMiwieXNjYWxlIjozMiwidHlwZSI6Ik9iamVjdCIsImRyYXciOiJmdW5jdGlvbiAoKSAgICAgICAgeyAgICAgICAgICBjdHguZmlsbFN0eWxlID0gXCIjRkYwMDMzXCI7ICAgICAgICAgIGN0eC5maWxsUmVjdCh0aGlzLngsIHRoaXMueSwgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnhzY2FsZSwgdGhpcy55c2NhbGUpOyAgICAgICAgfSIsInVwZGF0ZSI6ImZ1bmN0aW9uICgpICAgICAgICB7ICAgICAgICAgIHRoaXMuZHJhdygpOyAgICAgICAgfSJ9XX0=`
];})();
