var spritesheet = new Image();
var playersheet = new Image();

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
        if (["Object", "Player", "Enemy", "Projectile"].includes(obj.type))
        {

          //if (boxIntersect(this.x, this.y))

          if (boxIntersect(this.x, this.y,
              this.xscale, this.yscale,
              obj.x, obj.y,
              obj.xscale, obj.yscale))
          {
            switch(obj.type)
            {

            }
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
    sprite: new Sprite(playersheet, 0, 41, 10, 18),
    TMPsprite: new AnimatedSprite(spritesheet, 0, 46, 13, 18, 0, 7, 10, 0, true),
    walkSprite: new AnimatedSprite(playersheet, 0, 0, 12, 21, 0, 5, 7, 0, true),
    walkSpriteB: new AnimatedSprite(playersheet, 72, 0, 12, 21, 0, 5, 7, 0, true),
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
        this.sprite.y = GLOBAL.GRAVITY < 0 ? 59 : 41;
        this.walkSprite.y = GLOBAL.GRAVITY < 0 ? 20 : 0;
        this.walkSpriteB.y = GLOBAL.GRAVITY < 0 ? 20 : 0;
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

      this.sprite.x = this.facing === 0 ? 0 : this.sprite.w+1;

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
      if (this.vy === 0 && (this.vx < -1 || this.vx > 1))
      {
        if (this.facing === 1) this.walkSpriteB.draw(this.x, this.y-2, this.xscale*1.2, this.yscale*1.2);
        else this.walkSprite.draw(this.x, this.y-2, this.xscale*1.2, this.yscale*1.2);
      }
      else this.sprite.draw(this.x, this.y, this.xscale, this.yscale);
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
  playersheet.onload = function()
  {
    update();
  }
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

function sqrdist(a, b)
{
  for (var i = 0, r = []; i < ((a.length <= b.length) ? a.length : b.length); i++)
    r.push(Math.pow(a[i] - b[i], 2));
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
  spritesheet.src = "data:image/png;base64,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";
  playersheet.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJIAAABSCAYAAAC/k406AAAEVElEQVR4Xu1cbbKbMAwM522nPUvftOelkxB4QGyktSWw0b4/nQ5C1n5YGEMYHgZ/4ziOzzTDMAzPf/f/3w+BxqMleueX6vEeH82Pxkv4Usdfwtf+oYWi8Wh9aH4pXjre+kRB60f5fjWR1Enagee43MBzh5qPo/H786SO55Vfy0cpzrPyozpJfK/zhTaS1njaOBrpzcBZhKEz4+p48rJVYH+l+bi0kbA0YeSFRtowULpmo5FoJBpptR3jtUTgpe29/yURzI7EjsSO1HJHkmborN5+H0La6PJaw+zrQW/TJbxo3Sg/3vlr61kubRJR6EC18dZC19ZzNT+tGSk1MTfPxrQd42piezfG3epvtiPRqOkpXbpU8ObTzkjD7wn5+Ce5uPUGos7/713mD6n3Tsdh4bzz796ukFBk6zfW61ojJcDAwqHEegvtnT+FN2OKw4lwipEUhSVnwt/pnaTHz+mdJOlvfPya3mF6fH3EqzvMm9hlcX6Qc12POn+hMXLYc5jV9ezwvi4CSsxLTQqdkvUcTPylIy1CPDfoSo0kOQc4XkosSuph/Ez4XHdigliNV4oXoBQKlYwkPrT9GE3hXqjCwmBUMO0wtXlrz0c7lxaXWRyg//FlCEhkVnwikZdgnjXX5G4GL6A/jVSjuNO5NFJnxNYKVnv+bS9tr0UWF9uTvlxsb32+8kV2sb1ZpZcaCbieSretpXcx2g6hzs/b/28zaW7/1cTmNgBLNri4IYnvnHe1IXmwzjlry73a2BkMQ2GHUdfjnR/dybec+AlO15c4Pv0vmTg5o1oJ3Vn+Z7k0Eo20MFD6rLNZI83IpEtKKXAp7zx+K/m7ebGtNeG867HO7y20d3504ojP2qSZigK6Szx52W0pJd5C2DwiIWFpwsgLjbRhoLRD0kg0Eo3U8u/a0MVq7/HsSOxI7EhXdKR955C+2OU9U1upxxvnnF/i++zOrq1n2ZDcb+5qgXkT7G0kbX4tH7VCa4Xz5h3FmzXSwVOD5CF0YDT+6nrQetH4q/Gh46fiVT8dkgZCiUPjpfFLOyqaVxvfGj7vesw6kpZgxt2XgeyPE1PX6zOcfV+q742MRrq3vqehW4ykuRPQxJxWOQdqigEaqSk5+i2GRupXu6Yqp5GakqPfYmikfrVrqnIaqSk5+i2GRupXu6Yqp5GakqPfYgZpb2iG9tzpRmL7pYSVlzAAmYNGKqE4xjk0Ugyd3VHSSO4UxxiARoqhsztKGsmd4hgDfN/+5z78vf4SW+arbNovpcWgNCZKGimm7uaoaSRzSmMmpJFi6m6Omo9IzCmNmZB3bTF1N0dNI5lTGjMhjRRTd3PUNJI5pTET0kgxdTdHTSOZUxozIW//Y+pujppGMqc0ZkIaKabu5qhpJHNKYyakkWLqbo6aRjKnNGZCfh8ppu7mqGkkc0pjJjT5GGlM6oh6zQCNRD+YMEAjmdDIJDQSPWDCAI1kQiOT0Ej0gAkD/wHRVprLVf4LSgAAAABJRU5ErkJggg==";
  
  GLOBAL.LEVELS = [`0,864,760|1|2,-192,-320,32,32|2,672,800,448,352|2,-160,-320,32,32|2,1120,480,352,672|2,-128,-352,32,32|2,192,480,480,672|2,192,224,1280,256|2,1504,480,32,32|`];
})();
