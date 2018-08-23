var spritesheet = new Image();
var playersheet = new Image();
var tilesheet = new Image();

//
// game
//
var canvas = document.getElementById('c');
var ctx = canvas.getContext("2d");

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
    bg: "#000000",
    tilemap: document.querySelector('#t')
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
          this.spd = 0;
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
      this.y += Math.random() * (10 - -10) + -10;
      this.x += Math.random() * (10 - -10) + -10;
      this.angle += Math.random() * (10 - -10) + -10;
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
          this.spd *= -1;
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

function Enemy(x, y, w, h, hp, sprite)
{
  let obj = {
    x: x,
    y: y,
    xscale: w,
    yscale: h,
    hp: 1,
    sprite: sprite,
    vx: 0,
    vy: 3,
    merge: false,
    type: "Enemy",

    damage: function(dmg, force)
    {
      this.hp -= dmg;
      this.vx -= force;
      if (this.hp <= 0)
      {
        // planned:
        // flash, smoke, kaboom, raddaradda
        // for now let's just make it disappear
        arrayRemove(this, GLOBAL.OBJECTS);
      }
    },

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
          if (boxIntersect(this.x, this.y,
              this.xscale, this.yscale,
              obj.x, obj.y,
              obj.xscale, obj.yscale))
          {
            switch(obj.type)
            {
              case "Player":
                obj.damage(1, -this.vx);
                break;

              case "Object":
                if (boxIntersect(this.x + this.vx, this.y - 6, this.xscale, this.yscale, obj.x, obj.y, obj.xscale, obj.yscale))
                  this.vx *= -1;
                break;
              
              case "Projectile":
                this.damage(obj.dmg)
                break;

              case "Enemy":
                if (!this.merge) break;
                this.xscale += obj.xscale;
                this.yscale += obj.yscale;
                this.hp += obj.hp;
                arrayRemove(obj, GLOBAL.OBJECTS);
                break;

              default: break;
            }
            let x = -1;
            if (boxIntersect(this.x, this.y-this.vy, 1, this.yscale, obj.x, obj.y, obj.xscale, obj.yscale)) x = 1;
            this.vy = 5 * GLOBAL.GRAVITY * x;
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
function Player(x, y)
{
  return {
    x: x,
    y: y,
    vx: 0,
    vy: 10,
    maxvy: 12,
    xscale: 10,
    yscale: 18,
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
    walkSprite: new AnimatedSprite(playersheet, 1, 0, 12, 20, 0, 5, 4, 0, true),
    walkSpriteB: new AnimatedSprite(playersheet, 72, 0, 12, 20, 0, 5, 4, 0, true),
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
        new Enemy(this.x, this.y - 128, this.xscale / 2, this.yscale / 2, 1, this.TMPsprite);
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
        if (this.facing === 1) this.walkSpriteB.draw(this.x, this.y, this.walkSprite.w, this.walkSprite.h);
        else this.walkSprite.draw(this.x, this.y, this.walkSprite.w, this.walkSprite.h);
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
    offsetX: 0,
    offsetY: 0,
    lerpspeed: 0.7,
    target: target,
    type: "Camera",
    update: function()
    {
      this.x = clamp(lerp(this.x, this.target.x - canvas.width/2 + this.offsetX, this.lerpspeed), 0, GLOBAL.ROOM.width - canvas.width);
      this.y = clamp(lerp(this.y, this.target.y - canvas.height/2 + this.offsetY, this.lerpspeed), 0, GLOBAL.ROOM.height - canvas.height);
    },

    drawGUI: function(x, y)
    {
      ctx.drawImage(spritesheet, 31, 0, 73, 11, x + 1, y, 73, 11);
      ctx.fillStyle = GLOBAL.ROOM.color;
      if (target.type === "Player") ctx.fillRect(x + 3, y + 1, 73 * (target.hp / 3)-5, 6);
      for(let i = 0; i < GLOBAL.OBJECTS.length; i++)
      {
        if (GLOBAL.OBJECTS[i].type === "EyeGiver") 
        {          
          this.offsetY = -50; // not final. needs to be smoother
        }
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

function EyeGiver(x, y)
{
  let obj = {
    x: x,
    y: y,
    scale: 64,
    // animation bits
    start: true,
    timer: 1,
    animDuration: 170,
    animProgress: 0,
    type: "EyeGiver",
    eye: {
      x: x,
      y: y,
      scale: 48,
      parent: null,
      centerScale: 16,

      draw: function(progress, timer)
      {
        let size = this.scale * Easings.easeInOutCubic(progress);
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        if (progress < 1) ctx.arc(this.x + Math.sin(size * 14  * Math.PI/180) * size/3, this.y + Math.cos(size * 14 * Math.PI/180) * size/3, size, 0, 2 * Math.PI, false);
        else {
          this.x = player.x,
          this.y = player.y;

          let distance = dist([this.x, this.y], [this.parent.x, this.parent.y]);
          if (distance > this.parent.scale - this.centerScale * 2)
          {
            this.x = this.parent.x + ((this.x - this.parent.x) * (this.centerScale / distance));
            this.y = this.parent.y + ((this.y - this.parent.y) * (this.centerScale / distance));
          }
          ctx.arc(this.x, this.y, size, 0, 2 * Math.PI, false);
        }
        ctx.fill();
      }
    },

    update: function()
    {
      if (this.start === true)
      {
        this.timer = min(this.animDuration, this.timer + 1);
        this.animProgress = this.timer / this.animDuration;
      }

      this.draw();
      this.eye.draw(this.animProgress, this.timer);
    },

    draw: function()
    {
      ctx.fillStyle = GLOBAL.ROOM.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.scale * Easings.easeInOutCubic(this.animProgress), 0, 2 * Math.PI, false);
      ctx.fill();
    }
  }

  obj.eye.parent = obj;
  GLOBAL.OBJECTS.push(obj);
  return obj;
}

let player = new Player(0, 0),
  camera = new Camera(player);

GLOBAL.WEAPONS = [
  new Weapon("testpistol", null, true, 5, [0, 0], 1,
    new TestPistolProjectile(0, 0, 10, 10, 5, 0,
      new Sprite(spritesheet, 0, 21, 8, 4), 600),
    new Sprite(spritesheet, 10, 22, 10, 6),
    1, 0),
  new Weapon("pesttistol", null, false, 5, [0, 0], 6,
    new PumpProjectile(0, 0, 7.5, 7.5, 5, 10,
      new Sprite(spritesheet, 0, 21, 8, 4), 600),
    new Sprite(spritesheet, 177, 0, 16, 7),
    1, 20)
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
    tilesheet.onload = function()
    {
      update();
    }
  }
};

// main loop //

// what??

// i said
// /\ "-./  \   /\  __ \   /\ \   /\ "-.\ \      /\ \       /\  __ \   /\  __ \   /\  == \ 
// \ \ \-./\ \  \ \  __ \  \ \ \  \ \ \-.  \     \ \ \____  \ \ \/\ \  \ \ \/\ \  \ \  _-/ 
//  \ \_\ \ \_\  \ \_\ \_\  \ \_\  \ \_\\"\_\     \ \_____\  \ \_____\  \ \_____\  \ \_\   
//   \/_/  \/_/   \/_/\/_/   \/_/   \/_/ \/_/      \/_____/   \/_____/   \/_____/   \/_/   
//

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
  ctx.drawImage(GLOBAL.ROOM.tilemap, xmove, ymove, GLOBAL.ROOM.width, GLOBAL.ROOM.height, xmove, ymove, GLOBAL.ROOM.width, GLOBAL.ROOM.height);
   // FIXME: make the region not 500 miles wide and only render the visible tiles
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

/****************\
    IDS:
0 - Player
1 - Camera
2 - (generic) Wall
3 - TestPistol
4 - PestTistol
5 - (generic) Enemy
6 - EyeGiver

Params:
 0  1  2  3  4
id, x, y, w, h
/******************/

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
      return new Enemy(params[1], params[2], params[3], params[4], 1, player.TMPsprite);
    default:
      console.log(`ERROR: Unknown object found with params ${params}`);
      return null;
  }
}

function parseTile(id)
{
  return {
    x: id % 3 * 16,
    y: Math.floor(id / 3) * 16
  };
}

function loadLevel(level)
{
  GLOBAL.OBJECTS = [];
  GLOBAL.ROOM.tilemap = document.querySelector('#t');
  GLOBAL.GRAVITY = 1;

  level = level.split('---');
  let lvl = level[0].split('|');
  let tiles = level[1].split('|');

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
  new EyeGiver(player.x, player.y - 64);
  
  player.TMPsprite = new AnimatedSprite(spritesheet, 0, 46, 13, 18, 0, 7, 10, 0);
  player.equip(GLOBAL.WEAPONS[0]);
  player.equip(GLOBAL.WEAPONS[1]);
  new SlideTransition(0, false, 0);

  loadTileMap(tiles);
}

function loadTileMap(tilemap)
{
  GLOBAL.ROOM.tilemap.width = GLOBAL.ROOM.width;
  GLOBAL.ROOM.tilemap.height = GLOBAL.ROOM.height;
  let tmap = document.querySelector('#t').getContext('2d');
  tmap.clearRect(0, 0, GLOBAL.ROOM.width, GLOBAL.ROOM.height);
  for(let i = 0; i < tilemap.length; i++)
  {
    // params:
    //  ID: tile id. number
    //  x pos, y pos
    //  that's it i guess

    let tileData = tilemap[i].split(',');
    let tile = parseTile(tileData[0]);
    //tmap.drawImage(tilesheet, 0, 0, 48, 48, tileData[1], tileData[2], 48, 48);
    tmap.drawImage(tilesheet, tile.x, tile.y, 16, 16, tileData[1], tileData[2], 16, 16);
  }
  // draw the loaded tilemap to the offscreen canvas.
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

var Easings = {
  easeInQuad: function (t) { return t*t },
  // decelerating to zero velocity
  easeOutQuad: function (t) { return t*(2-t) },
  // acceleration until halfway, then deceleration
  easeInOutQuad: function (t) { return t<.5 ? 2*t*t : -1+(4-2*t)*t },
  // accelerating from zero velocity 
  easeInCubic: function (t) { return t*t*t },
  // decelerating to zero velocity 
  easeOutCubic: function (t) { return (--t)*t*t+1 },
  // acceleration until halfway, then deceleration 
  easeInOutCubic: function (t) { return t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1 },
  // accelerating from zero velocity 
  easeInQuart: function (t) { return t*t*t*t },
  // decelerating to zero velocity 
  easeOutQuart: function (t) { return 1-(--t)*t*t*t },
  // acceleration until halfway, then deceleration
  easeInOutQuart: function (t) { return t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t },
  // accelerating from zero velocity
  easeInQuint: function (t) { return t*t*t*t*t },
  // decelerating to zero velocity
  easeOutQuint: function (t) { return 1+(--t)*t*t*t*t },
  // acceleration until halfway, then deceleration 
  easeInOutQuint: function (t) { return t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t }
};

// data section
// sorry for the mess! :p

(function()
{
  spritesheet.src = "data:image/png;base64,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";
  playersheet.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJIAAABSCAYAAAC/k406AAAETElEQVR4Xu2c4bKbIBCF4/O20z5LO+3z2km8WoMIe3AloF/+dDrZrGfPfhAgXoeHw2scx/GZZhiG4flv+P/wEmq8KvHs/BY9qgY13qJhHXN2/lfjj75UkWq8qk/Nr8Zb9Kg51XiLhiMgqXqiIFmTzHF7Rc0z1Py+Gh9+LjfjnZnf6klprar2Wnpyns/13hokpXm1GqcOSmujlVrXyxOrnjeQzr5Yz/l71l4ChlovICUWG+uvZtXYu8UDEiC9HDi6ngUkQAKko6NI+fpRYmusSVrTw4zEjPS5GSk3GpazheCkO3eIVjrDqHpKznpy11C1H/Xo03rCet9+0rA2OlfEUZPURtfQc/Y1vPPXBrtJkLxN9QC7NU2t6QEkpzXSUVhbA0PV4wfS8HPycvy1tCY8vv/4V+ffL4nfckqm95UDySRIEW+qgVdYc18gBQYfBi/RsBcYhaZatvNuIOVqUDcwuZqderCdkQyjJzqe/0z3JD2+T/ckWV7j48d0H9Pjt3QMETZtWZzv5Au1LKMt17RnE77qiY7QxCz8dk3Bmz1PdmvIGB0uujd5Yp79Gcdxb9beAW/bwFKQLOQYY9Rp1Zh2E5ZsWtD8HEi5hpVq3PvcqR4lwN/zLD17CCPJ26h1PusoPVPDkrsRT0wzSxVDposAkmo2IEUdAyRAUh0AJBfHmJHyIL0WcCy2J6NYbEd34MnF9tsOoBSkgpHK9n87uK0bC69dW/R6pdt/VVRuKzzbkz1gdDoMk86FnofvLZ9s5862ujmQTCwkkmDwE8m0DY412jDLuwzmSO9KT/NVPX6/tcWKUEdPo/HP0lRj7xYPSIYZGJD2TZpn4CZBmmXnRnV2DRbUXxrfI0gfubGtxcZZmncEDCW/GmuJN29ICgfD2SBFb7VVQbpjvHV2vKM3r03GGnjMeh/+yo1t6gxwtXhAclpsXw0MdVIBJEB6O/8q/WoGJEACpJpfJ+pUf7d4HrQlzkitPNhqBrUVPbcGKVwPpJrSWuNq6bGCav6Lj8TA3TzFNiwy/KxqQurasffU/Gq8RY+aU423aIgd7VjBUPUAktoRY7zaCDXeKGMJOzu/C0hqUcRfz4ENSClyz6b6evbepyJAuk+vT610Acly7mGJOVUtyZt1AJCabU1fwgCpr341qxaQmm1NX8IAqa9+NasWkJptTV/CAKmvfjWrFpCabU1fwobc2dBczvPHPiW2LxtQe9QBCQ5AOmr3dT8PSNftbdXKAKmq3de9GCBdt7dVKwOkqnZf92L/t/97DztfP4lt56ls1qeMXddGKgMkGHBxAJBcbCQJIMGAiwP8ROJiI0nYtcGAiwOA5GIjSQAJBlwcACQXG0kCSDDg4gAgudhIErb/MODiACC52EgSQIIBFwcAycVGkgASDLg4AEguNpKE5yPBgIsDgORiI0l4hiQMuDgASC42kgSQYMDFAUBysZEkgAQDLg4AkouNJPkHyUSey4N2CM0AAAAASUVORK5CYII=";
  tilesheet.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAABD0lEQVRoBe1aQQ7CMAxrJ/7/5aBUGAWtFzMh4sm7BCpc2bF9YnOMEUP4eST3CE0Nc85xCC9/UV8OQEQqUnhqYuQdWAJUNl/TAc4zIgJf6g8UPmeUThGq+YKIX59duf/tQF6i4gS45jw5gK2rzPsIQHyu5PFbLIsD10yJO/DvrrgD1QE2y8CyOHcAm+sw3YHqAptlYFmcO4DNdZjuQHWBzTKwLM4dwOY6THegusBmGVgW5w5gcx2mO1BdYLMMLItzB7C5DtMdqC6wWQaWxbkD2FyH6Q5UF9gsA8vith3AZUozhR9Qs9tCVzHgmtxXB3DQlfCOFzjfp8Q7lQpnH//UwxYF4uAoH6F8OULzVZWXBU833396hhaRdwAAAABJRU5ErkJggg==";

  GLOBAL.LEVELS = [`0,640,480|1|2,520,640,240,640---0,520,640|3,520,656|3,520,672|3,520,688|3,520,704|1,536,640|4,536,656|4,536,672|4,536,688|4,536,704|1,552,640|4,552,656|4,552,672|4,552,688|4,552,704|1,568,640|4,568,656|4,568,672|4,568,688|4,568,704|1,584,640|4,584,656|4,584,672|4,584,688|4,584,704|1,600,640|4,600,656|4,600,672|4,600,688|4,600,704|1,616,640|4,616,656|4,616,672|4,616,688|4,616,704|1,632,640|4,632,656|4,632,672|4,632,688|4,632,704|1,648,640|4,648,656|4,648,672|4,648,688|4,648,704|1,664,640|4,664,656|4,664,672|4,664,688|4,664,704|1,680,640|4,680,656|4,680,672|4,680,688|4,680,704|1,696,640|4,696,656|4,696,672|4,696,688|4,696,704|1,712,640|4,712,656|4,712,672|4,712,688|4,712,704|1,728,640|4,728,656|4,728,672|4,728,688|4,728,704| 2,744,640|5,744,656|5,744,672|5,744,688|5,744,704|`];
})();
