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
    color: "#AA11FF",
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
  frame, frames, time, offset, loop)
{
  let a = new Sprite(src, x, y, w, h);
  a.ticks = 1;
  a.time = time;
  a.frame = frame;
  a.frames = frames;
  a.offset = offset;
  a.loop = loop;
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
    ctx.fillStyle = "rgb(255,255,255)";
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

function Projectile(x, y, w, h, speed, dir, sprite, destructTime)
{
  var a = {
    x: x,
    y: y,
    w: w,
    h: h,
    spd: speed,
    angle: dir,
    sprite: sprite,
    time: 0,
    destroyTime: destructTime,
    type: "Projectile",

    update: function()
    {
      this.time++;
      if (this.time >= this.destroyTime)
      {
        if (this.sprite.type === "AnimatedSprite") arrayRemove(this.sprite, GLOBAL.OBJECTS);
        arrayRemove(this, GLOBAL.OBJECTS);
      }


      for (let i = 0; i < GLOBAL.OBJECTS.length; i++)
      {
        let obj = GLOBAL.OBJECTS[i];
        if (obj.type === "Object")
        {

          if (boxIntersect(this.x + speed * Math.cos(this.angle * Math.PI / 180),
              this.y + speed * Math.cos(this.angle * Math.PI / 180),
              this.w, this.h,
              obj.x, obj.y,
              obj.xscale, obj.yscale))
          {
            arrayRemove(this, GLOBAL.OBJECTS);
          }
        }
      }
      this.x += speed * Math.sin(this.angle * Math.PI / 180);
      this.y += speed * Math.cos(this.angle * Math.PI / 180);
      this.draw();
    },

    draw: function()
    {
      ctx.fillStyle = "rgb(255,255,255)";
      //ctx.fillText(`${this.time}\n${this.destroyTime}`, this.x, this.y -64);
      this.sprite.draw(this.x, this.y, this.w, this.h);
    }
  };

  GLOBAL.OBJECTS.push(a);

  return a;
}

function TestPistolProjectile(x, y, w, h, speed, dir, sprite, destructTime)
{
  var a = new Projectile(x, y, w, h, speed, dir, sprite, destructTime);
  a.type = "Object";
  a.origSpd = speed;
  a.update = function()
  {
    this.time++;
    if (this.time >= this.destroyTime) arrayRemove(this, GLOBAL.OBJECTS);
    if (this.time > 25) this.spd *= 0.75;
    // this.w *= this.spd / this.origSpd;
    for (let i = 1; i < GLOBAL.OBJECTS.length; i++)
    {
      let obj = GLOBAL.OBJECTS[i];
      if (obj.type === "Object")
      {

        if (boxIntersect(this.x + this.spd * Math.cos(this.angle * Math.PI / 180),
            this.y + this.spd * Math.cos(this.angle * Math.PI / 180),
            this.w, this.h,
            obj.x, obj.y,
            obj.xscale, obj.yscale))
        {
          arrayRemove(this, GLOBAL.OBJECTS);
        }
      }
    }
    this.x += this.spd * Math.sin(this.angle * Math.PI / 180);
    this.y += this.spd * Math.cos(this.angle * Math.PI / 180);
    this.draw();
  }

  return a;
}

function PumpProjectile(x, y, w, h, speed, dir, sprite, destructTime)
{
  var a = new Projectile(x, y, w, h, speed, dir, sprite, destructTime);
  a.origSpd = speed;
  a.origW = w;
  a.run = false;
  a.update = function()
  {
    if (!this.run)
    {
      this.run = true;
      this.x += Math.random() * 20;
      this.y += (Math.random() - 0.5) * 40;
    }
    this.time++;
    if (this.time >= this.destroyTime) arrayRemove(this, GLOBAL.OBJECTS);
    if (this.time > 15)
    {
      this.spd *= 0.92;
      this.w *= 0.95;
      this.h *= 0.95;
      if (this.w <= 0.01)
      {
        arrayRemove(this, GLOBAL.OBJECTS);
      }
    }
    for (let i = 1; i < GLOBAL.OBJECTS.length; i++)
    {
      let obj = GLOBAL.OBJECTS[i];
      if (obj.type === "Object")
      {

        if (boxIntersect(this.x + this.spd * Math.cos(this.angle * Math.PI / 180),
            this.y + this.spd * Math.cos(this.angle * Math.PI / 180),
            this.w, this.h,
            obj.x, obj.y,
            obj.xscale, obj.yscale))
        {
          arrayRemove(this, GLOBAL.OBJECTS);
        }
      }
    }
    this.x += this.spd * Math.sin(this.angle * Math.PI / 180);
    this.y += this.spd * Math.cos(this.angle * Math.PI / 180);
    this.draw();
  }

  return a;
}

function Weapon(name, owner, auto, delay, offset, shots, projectile, sprite, size, kickback)
{
  let a = {
    x: 0,
    y: 0,
    name: name,
    owner: owner,
    auto: auto,
    delay: delay,
    offset: offset,
    projectile: projectile,
    sprite: sprite,
    size: size,
    shots: shots,
    kickback: kickback || 0,
    // private (not actually)
    timer: delay,
    origspritex: sprite.x,
    facing: 1,

    update: function()
    {
      this.timer = Math.max(0, this.timer - 1);
      this.x = this.owner.x + this.owner.xscale / 2 + this.offset[0];
      this.x -= this.owner.facing * this.sprite.w * this.size;
      this.y = this.owner.y + this.owner.yscale / 2 + this.offset[1];
      this.sprite.x = this.origspritex + (this.owner.facing == 1 ? this.sprite.w : 0);

      if ((this.auto ? keyDown("X") : keyPressed("X")) && this.timer === 0)
      {
        this.timer = this.delay;

        let p = this.projectile;
        let direction = 180 * this.owner.facing + 90;
        let offset = (this.owner.facing == 0 ? 1 : -1);
        if (this.owner.up)
        {
          offset = 0;
          direction = 180;
        }
        if (this.owner.down && !this.owner.grounded)
        {
          offset = 0;
          direction = 360;
        }
        switch (direction)
        {
          case 270:
            this.owner.vx += this.kickback;
            break;

          case 90:
            this.owner.vx -= this.kickback;
            break;

          case 180:
            this.owner.vy += this.kickback;
            break;

          case 360:
            this.owner.vy -= this.kickback;
            break;
        }

        let sprite = p.sprite;
        if (p.sprite.type === "AnimatedSprite")
        {
          // puke emoji
          sprite = new AnimatedSprite(p.sprite.src, p.sprite.x, p.sprite.y, p.sprite.w, p.sprite.h, 0, p.sprite.frames, p.sprite.time, p.sprite.offset);
        }

        for (let i = 0; i < shots; i++)
        {
          let x = this.x + this.sprite.w * this.size * offset,
            y = this.y - (p.w / 2),
            w = p.w,
            h = p.h,
            spd = p.spd,
            destructTime = p.destroyTime;

          let t = new Projectile(x, y, w, h, spd, direction, sprite, destructTime);
          t.update = p.update;


        }
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

      for (let i = 0; i < GLOBAL.OBJECTS.length; i++)
      {

        let obj = GLOBAL.OBJECTS[i];
        if (obj === this) continue;
        if (["Object", "Player", "Enemy"].includes(obj.type))
        {

          //if (boxIntersect(this.x, this.y))

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
            if (obj.type === "Player") obj.damage(1, -this.vx);
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
    timerEvents:
    {},

    update: function()
    {
      this.timer++;
    }
  };
  GLOBAL.OBJECTS.push(a);
  return a;
}

// main objs //
function Player(x, y)
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
    down: false,
    speed: 4.6,
    jumpTime: 0,
    grounded: false,
    jumping: false,
    hp: 3,
    sprite: new Sprite(spritesheet, 0, 0, 5, 9),
    TMPsprite: new AnimatedSprite(spritesheet, 0, 46, 13, 18, 0, 7, 10, 0, true),
    weapon: null,
    weaponIndex: 0,
    weapons: [],
    type: "Player",
    // weapon //
    weaponSpriteOffset: (this.weapon ? this.weapon.sprite.h : 10),
    // damage //
    invincibilityFrames: 180,
    dTimerRun: false,
    damageTimer: 0,
    damageFlash: false,
    damageFlashTimer: 0,
    damageFlashDelay:
    {
      orig: 30,
      current: 0
    },
    // life (or death)
    dead: false,

    unequip: function()
    {
      if (this.weapon != null)
      {
        this.weapon.owner = null;
        this.weapon = null;
      }
      this.weaponSpriteOffset = 0;
    },

    equip: function(weapon)
    {
      if (this.weapon != null) this.unequip();
      this.weapon = weapon;
      weapon.owner = this;
      this.weaponSpriteOffset = weapon.sprite.h;
      if (!this.weapons.includes(weapon)) this.weapons.push(weapon);
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
      let left = boolInt(keyDown("ARROWLEFT")),
        right = boolInt(keyDown("ARROWRIGHT"));
      wepSwitch = [keyPressed("A"), keyPressed("S")];

      this.up = boolInt(keyDown("ARROWUP"));
      this.down = boolInt(keyDown("ARROWDOWN"));
      this.vx = clamp(this.vx +
        (this.speed / 8 * right) -
        this.speed / 8 * left, -this.speed, this.speed);
      if (!left && !right || left && right && this.grounded) this.vx *= 0.7;
      if (left != 0) this.facing = 1;
      if (right != 0) this.facing = 0;
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
        this.vy = clamp(this.vy + (1.7 - this.jumpTime) * -GLOBAL.GRAVITY, -this.maxvy / 2, this.maxvy / 2);
      }

      if (keyPressed("C"))
      {
        GLOBAL.GRAVITY *= -1;
        this.sprite.y = GLOBAL.GRAVITY < 0 ? 10 : 0;
        if (this.weapon != null) this.weapon.sprite.y += (GLOBAL.GRAVITY < 0 ? this.weaponSpriteOffset : -this.weaponSpriteOffset);

      }

      if (wepSwitch[0] || wepSwitch[1] && this.weapon != null)
      {
        let dir = (wepSwitch[0] ? -1 : 1);
        this.weapon.sprite.y -= (GLOBAL.GRAVITY < 0 ? this.weaponSpriteOffset : 0);
        this.weaponIndex = (this.weaponIndex + dir) % this.weapons.length;
        if (this.weaponIndex === -1) this.weaponIndex = this.weapons.length - 1;
        this.weapon.owner = null;
        this.weapon = this.weapons[this.weaponIndex];
        this.weapon.owner = this;
      }

      ////////////////////

      if (keyPressed("B"))
      {
        new Enemy(this.x, this.y - 128, this.xscale / 2, this.yscale / 2, this.TMPsprite);
      }

      this.sprite.x = 12 * this.facing;

      if (keyPressed("R"))
      {
        this.vx = 0;
        this.vy = 0;
        this.x = 0;
        this.y = 0;
        loadLevel(GLOBAL.LEVELS[0]);
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

      for (i = 0, collision = false; i < Math.floor(Math.abs(this.vx)); i++)
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

      for (i = 0, collision = false; i < Math.floor(Math.abs(this.vy)); i++)
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

      // damage flash
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
    },
  };
}

function Wall(x, y, w, h)
{
  return {
    x: x,
    y: y,
    xscale: w,
    yscale: h,
    type: "Object",
    update: function() { this.draw() },
    draw: function(){ ctx.fillStyle = GLOBAL.ROOM.color; ctx.fillRect(this.x, this.y, this.xscale, this.yscale); }
    
  }
}

function Camera(target)
{
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
      ctx.drawImage(spritesheet, 31, 0, 73, 11, x + 1, y, 73*3, 11*3);
      ctx.fillStyle = GLOBAL.ROOM.color;
      if (target.type === "Player") ctx.fillRect(x + 7, y + 7, 73*3 * (target.hp / 3) - 12, 14);
      for(let i = 0; i < GLOBAL.OBJECTS.length; i++)
      {
        if (GLOBAL.OBJECTS[i].type === "Transition") GLOBAL.OBJECTS[i].draw();
      }
    }
  };
}


function SlideTransition(speed, out, lvl)
{
  let obj = {
    x: 0,
    y: 0,
    w: this.out ? 0 : canvas.width,
    h: canvas.width,
    out: out,
    timer: 0,
    type: "Transition",
    
    update: function(){ },
    
    draw: function()
    {
      this.timer += (this.out ? 1 : -1);
      this.x = camera.x;
      this.y = camera.y;
      this.w += this.timer;
      ctx.fillStyle = "#000000";
      ctx.fillRect(this.x, this.y, this.w, this.h);
      
      if (this.out && this.w >= canvas.width) 
      {
        loadLevel(lvl);
        arrayRemove(this, GLOBAL.OBJECTS);
      }
      else if (!this.out && this.w < 0) arrayRemove(this, GLOBAL.OBJECTS)
    }
  };
  GLOBAL.OBJECTS.push(obj);
  return obj;
}

let player = new Player(0, 0),
  camera = new Camera(player);

GLOBAL.WEAPONS = [
  new Weapon("testpistol", null, true, 5, [0, 0], 1,
    new TestPistolProjectile(0, 0, 20, 20, 5, 0,
      new Sprite(spritesheet, 0, 21, 8, 4), 600),
    new Sprite(spritesheet, 10, 22, 10, 6),
    2, 0),
  new Weapon("pesttistol", null, false, 5, [0, 0], 6,
    new PumpProjectile(0, 0, 30, 30, 5, 10,
      new Sprite(spritesheet, 0, 21, 8, 4), 600),
    new Sprite(spritesheet, 177, 0, 16, 7),
    2, 20)
  // Weapon(name, owner, auto, delay, offset, shots, projectile, sprite, size, kickback)
  // Projectile(x, y, xscale, yscale, spd, dir, sprite, deathTime)
];

// init //
spritesheet.onload = function()
{
  ctx.imageSmoothingEnabled = false;
  loadLevel(GLOBAL.LEVELS[0]);
  update();
};

// main loop //
function update()
{
  ++TIME.frame;
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
    if (GLOBAL.WEAPONS[j].owner != null) GLOBAL.WEAPONS[j].update();
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

//
// levels, saves, etc
//

/***********
    IDS:
0 - Player
1 - Camera
2 - (generic) Wall
3 - TestPistol
4 - PestTistol
5 - (generic) Enemy

Params:
 0  1  2  3  4
id, x, y, w, h

************/


function parseID(params)
{
  switch (params[0])
  {
    case 0:
      player = new Player(params[1], params[2]);
      return player;
    case 1:
      camera = new Camera(player);
      return camera;
    case 2:
      return new Wall(params[1], params[2], params[3], params[4]);
    case 3:
      break; // skipping weapons for now
    case 4:
      break;
    case 5:
      return new Enemy(params[1], params[2], params[3], params[4], player.TMPsprite);
    default:
      console.log(`ERROR: Unknown object found with params ${params}`);
      return null;
  }
}


function loadLevel(level)
{
  GLOBAL.OBJECTS = [];
  GLOBAL.GRAVITY = 1;
  
  player.TMPsprite = new AnimatedSprite(spritesheet, 0, 46, 13, 18, 0, 7, 10, 0);

  // reload (weapon) animated sprites to readd them to GLOBAL.OBJECTS
  for (let i = 0; i < GLOBAL.WEAPONS.length; i++)
  {
    let wep = GLOBAL.WEAPONS[i];
    if (wep.owner != null && wep.owner.type === "Player")
    {}
    if (wep.projectile.sprite.type === "AnimatedSprite")
    {
      GLOBAL.OBJECTS.push(wep.projectile.sprite);
    }
  }

  let lvl = level.split('|');
  for (let i = 0; i < lvl.length; i++)
  {
    let chunk = lvl[i].split(',');
    let params = [];
    for (let j = 0; j < chunk.length; j++)
    {
      params.push(parseInt(chunk[j]));
    }
    var obj = null;
    if (!isNaN(params[0])) obj = parseID(params);
    if (obj != null) GLOBAL.OBJECTS.push(obj);
  }
  new SlideTransition(0, false, 0);
}

//
// utils
//

function instantiate(obj, x, y)
{
  return Object.assign(
  {}, obj);
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

function max(x, y)
{
  return (x >= y ? x : y);
}

function min(x, y)
{
  return (x <= y ? x : y);
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

// data section
// sorry for the mess! :p

(function()
{
  spritesheet.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAABACAYAAAD1Xam+AAAFMklEQVR4Xu2d65ojERCG41LnyuZSex+GrAhdRR9o3vzYzXTKoV7l042IefnXtm2bMcaE/0vXtXYhvZC/zS415W9PwBhj37l/eJUJbK+fQ0FkXr/mjDye2EYuuNJeaIWgdL3GNu78MZyQfyjaF/dEfpfV2QojAqDDazuvef1+GG+vn1d6LZebt3MCUGGfK+uRQn25AOSGeARADmwEQGb0HmAQAD2sxBIBaEZ3bUIEQM83Hr3tiB5e0ogeRv89IUlrkcs/zUdf8/6WtwtANPq/nzJ4BPgOBARA3zlSAbDP9C64FHMDwbbWvlSmvtZjWLpJv7QqYTLwyus+b1c8AoAAHO0OobPHHfponlL6HmVKdar9HAGoJXaTPXcAN4FevJghBGDxNii6zyqAPjJ6jMY9ytQT0Vm+5wDipb+99/E+gSPveQTYbyDuAHQBHJ7dw4RfPCHHHIDMcIS1SzYDZdqJ0V8O3mDBKoCe1de8nlNQvwtQ877GNi6stIMw3Am0uzBtyhHE+RFw2QjU3kyXzwEEUYmrmCwFtteelBDwy33sBGwLhcsFQNgJ2FZrUkEgIqB51t8DtvR3ATrvAyCQIQCBjgR67wTs6DpFQwACtwuARc4cAIEHgTEIIABjtAO1gEAXAghAF+wUCoExCLzXmrUn/WjtgnulfQNjuE8tILA2ATabrN3+eL84AQRg8QDA/bUJZDcCpUiYtV87SPB+XgJVAiDtuNLsqLrzwIZ5mw3PIHAOAbUASKemak9XffL5aecgJxcIjEPgkAAkByT+X1GIzmIrfEmDuYdxYoCaLEygSQBCx9fczkenpjjM3AEsHG24PhwBtQD4zusOENV0/NTTGY5PGq71qBAEDhLgVvwgQJJD4MkEqgTgyCh+JO2TAVN3CIxMQC0AuXPXNI8CzAGM3PzUbXUCTQIQoLEKsHr44P/TCRwSgNh59gE8PRSo/4oE1AIQrwKUQLETcMUQwucnE6gSgCc7St0hAIFvAs0CoJnV19jQKBCAQD8ChwTAbvMt7ewLqwbs/OvXuJQMAYkAAiAR4nMITEwAAZi4cXENAhKBwwLgVwc+vh+QbhrSbBiSKsrnEIDA+QQQgPOZkiMEHkPgFAGI7wLSg0OYBHxMLFDRBQkgAAs2Oi5DIBBoFgA/6rvzAewrfs6Pzw7k+Z9gg8C4BA4JwLhuUTMIQEBDAAHQUMIGApMSQAAmbVjcgoCGwJcAxL/lFzLIXYszr01Tym+vnNoy3BzFtm3pj5qc7UupnL3re1yl+mkaFRsIaAl8CIANvlLC0q8DkeZPaO7gpm1U7CCgJYAAJKTu6swt5WgbFTsIaAkgAAiANlawm5AAAoAATBjWuKQlgAAgANpYwW5CAggAAjBhWOOSlkBWAIwxdmb7nYf92+32zbz8stWHvTPeSeNX6L5yq00T6llaoUjLif2SVjVSBt6nIoMScKmcNJ3AQNuu2EFARcAF9N6MdMglF8hSutrgv6uTxWRy+wT2yNVyqLXfY6BqUYwgUEHgdgGQRKPUAaR0LR0tV9bZ5bTUa+eOpqJpMYWATKBZAKSO0tqRW9O1dLQzBKCFg5QGAZADF4tzCKh+Hrylo7R25DPTSR0t93ijSRN30Kvtz2lmcoFAngAC8Ddh+Z7cu7pD1+ZP4ELgSgIIAAJwZXyR9+AEmucArF/SaHbWc/mdZdX6JNm3PD4xBzB4r5moemwEShqz5Us6d6WZKO5wZRACCAACMEgoUo0eBMQDQTQHVKQ2pMkfRpI2cAu3HkFCmfMS+AelCc+MAArAYQAAAABJRU5ErkJggg==";
  GLOBAL.LEVELS = [
  `0,864,768|1|2,-192,-320,32,32|2,672,800,448,352|2,-160,-320,32,32|2,1120,480,352,672|2,-128,-352,32,32|2,192,480,480,672|2,192,224,1280,256|2,1504,480,32,32|`];
})();
