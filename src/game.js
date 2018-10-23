var spritesheet = new Image(),
    playersheet = new Image(),
    tilesheet = new Image(),
    enemysheet = new Image(),
    bgsheet = new Image(),
    loadProgress = 0;

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
  LEVELINDEX: 0,
  LEVEL:
  {
    width: 1280,
    height: 720,
    color: "#AA11FF",
    bgColor: "",
    bgscroll: [0,0],
    bg: document.querySelector('#bg'),
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

    draw: function(xpos, ypos, xscale, yscale, canvas=ctx)
    {
      canvas.drawImage(this.src,
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
  let a = {
    x: x,
    y: y,
    w: w,
    h: h,
    spd: speed,
    angle: dir,
    sprite: sprite,
    time: 0,
    collisionObjects: ["Object"],
    destroyTime: destructTime,
    type: "Projectile",

    onCollision: function(obj)
    {
      arrayRemove(this, GLOBAL.OBJECTS);
    },
        
    cUpdate: function()
    {

    },

    destroy: function()
    {
      new BulletFlash(this.x, this.y);
      if (this.sprite.type === "AnimatedSprite") arrayRemove(this.sprite, GLOBAL.OBJECTS);
      arrayRemove(this, GLOBAL.OBJECTS);
    },

    update: function()
    {
      this.time++;
      this.cUpdate();
      if (this.time >= this.destroyTime) this.destroy();

      for (let i = 0; i < GLOBAL.OBJECTS.length; i++)
      {
        let obj = GLOBAL.OBJECTS[i];
        if (this.collisionObjects.includes(obj.type) && 
        boxIntersect(this.x + this.spd * Math.cos(this.angle * Math.PI / 180),
              this.y + this.spd * Math.cos(this.angle * Math.PI / 180),
              this.w, this.h,
              obj.x, obj.y,
              obj.xscale, obj.yscale))
        {
            this.onCollision(obj);
            break;
         }
        
      }
      this.x += this.spd * Math.sin(this.angle * Math.PI / 180);
      this.y += this.spd * Math.cos(this.angle * Math.PI / 180);
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
  let a = new Projectile(x, y, w, h, speed, dir, sprite, destructTime);
  a.collisionObjects = ["Object", "Enemy"];

  a.onCollision = function(obj)
  {
    switch(obj.type)
    {
      case "Object":
        this.destroy();
        break;
      
      case "Enemy":
        obj.damage(1);
        arrayRemove(this, GLOBAL.OBJECTS);
        break;
    }
  }

  a.cUpdate = function()
  {
    if (this.time > 25)
    {
      this.spd *= 0.99;
    }
  };
  return a;
}

function PumpProjectile(x, y, w, h, speed, dir, sprite, destructTime)
{
  var a = new Projectile(x, y, w, h, speed, dir, sprite, destructTime);
  a.run = false;
  a.collisionObjects = ["Object", "Enemy"];

  a.cUpdate = function()
  {
    if (!this.run)
    {
      this.run = true;
      this.y += Math.random() * (10 - -10) + -10;
      this.x += Math.random() * (10 - -10) + -10;
      this.angle += Math.random() * (10 - -10) + -10;
    }
    if (this.time > 15)
    {
      this.spd *= 0.92;
      this.w *= 0.95;
      this.h *= 0.95;
      if (this.w <= 0.01)
      {
        this.destroy();
      }
    }
  };

  a.onCollision = function(obj)
  {
    switch(obj.type)
    {
      case "Object":
        this.spd *= -1;
        break;
      case "Enemy":
        arrayRemove(this, GLOBAL.OBJECTS);
        obj.damage(1);
        break;
    }
  };

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
    origsprite: [sprite.x, sprite.y],
    facing: 1,

    update: function()
    {
      this.timer = Math.max(0, this.timer - 1);
      this.x = this.owner.x + this.owner.xscale / 2 + this.offset[0];
      this.x -= this.owner.facing * this.sprite.w * this.size;
      this.y = lerp(this.y, this.owner.y + this.owner.yscale / 2 + this.offset[1], 0.83);
      this.sprite.x = this.origsprite[0] + (this.owner.facing == 1 ? this.sprite.w : 0);
      this.sprite.y = this.origsprite[1] + (GLOBAL.GRAVITY < 0 ? this.sprite.h : 0);

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

      if ((this.auto ? keyDown("X") : keyPressed("X")) && this.timer === 0)
      {
        this.timer = this.delay;

        let p = this.projectile;

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
          t.cUpdate = p.cUpdate;
          t.onCollision = p.onCollision;
          t.collisionObjects = p.collisionObjects;
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
  let obj = {
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
      }

      if (wepSwitch[0] || wepSwitch[1] && this.weapon != null)
      {
        let dir = (wepSwitch[0] ? -1 : 1);
        this.weapon.sprite.x = this.weapon.origsprite[0];
        this.weapon.sprite.y = this.weapon.origsprite[1];
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
  GLOBAL.OBJECTS.push(obj);
  return obj;
}

function Wall(x, y, w, h, i = false)
{
  let obj = {
    x: x,
    y: y,
    xscale: w,
    yscale: h,
    invis: i,
    type: "Object",
    update: function() { this.draw() },
    draw: function()
    {
      if (this.invis)
      {
        return;
      }
       ctx.fillStyle = GLOBAL.LEVEL.color;
       ctx.fillRect(this.x, this.y, this.xscale, this.yscale);
    }
  }
  GLOBAL.OBJECTS.push(obj);
  return obj;
}

function Camera(target)
{
  let obj = {
    x: 0,
    y: 0,
    offsetX: 0,
    offsetY: 0,
    lerpspeed: 0.7,
    target: target,
    type: "Camera",
    guiObjects: [],
    update: function()
    {
      this.x = clamp(lerp(this.x, this.target.x - canvas.width/2 + this.offsetX, this.lerpspeed), 0, GLOBAL.LEVEL.width - canvas.width);
      this.y = clamp(lerp(this.y, this.target.y - canvas.height/2 + this.offsetY, this.lerpspeed), 0, GLOBAL.LEVEL.height - canvas.height);

    },

    drawGUI: function(x, y)
    {
      if (this.overlay != null) this.overlay.draw(x, y, GLOBAL.LEVEL.bg.width, GLOBAL.LEVEL.bg.height);
      ctx.drawImage(spritesheet, 31, 0, 73, 11, x + 1, y, 73, 11);
      ctx.fillStyle = GLOBAL.LEVEL.color;
      if (target.type === "Player") ctx.fillRect(x + 3, y + 1, 73 * (target.hp / 3)-5, 6);
      
      
      for(let i = 0; i < GLOBAL.OBJECTS.length; i++)
      {
        if (GLOBAL.OBJECTS[i].type === "EyeGiver") 
        {          
          this.offsetY = -50; // moveme: to EyeGiver
        }
      }  // removeme: this entire loop

      for(let i = 0; i < this.guiObjects.length; i++)
        this.guiObjects[i].draw();
    }
  };
  GLOBAL.OBJECTS.push(obj);
  return obj;
}

function SlideTransition(speed, out, lvl)
{
  let obj = {
    x: 0,
    y: 0,
    w: out ? 0 : canvas.width,
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
        arrayRemove(this, camera.guiObjects);
      }
      else if (!this.out && this.w < 0) arrayRemove(this, GLOBAL.OBJECTS)
    }
  };
  camera.guiObjects.push(obj);
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
        this.timer = min(this.animDuration, this.timer + 0.5);
        this.animProgress = this.timer / this.animDuration;
      }

      this.draw();
      this.eye.draw(this.animProgress, this.timer);
    },

    draw: function()
    {
      ctx.fillStyle = GLOBAL.LEVEL.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.scale * Easings.easeInOutCubic(this.animProgress), 0, 2 * Math.PI, false);
      ctx.fill();
    }
  }
  obj.eye.parent = obj;
  GLOBAL.OBJECTS.push(obj);
  return obj;
}

function GuardEye(x, y, w, h)
{
  let obj = {
    x: x,
    y: y,
    ogX: x,
    ogY: y,
    xscale: w,
    yscale: h,
    sprite: new Sprite(enemysheet, 0, 0, 76, 172),
    dFlash: {
      amt: 40,
      current: 0,
      shakeAmt: 120,
      shakeCur: 0
    },
    type: "Enemy",
    hp: 20,
    dead: false,

    damage: function(amt)
    {
      if (this.dead) return;
      this.hp -= amt;
      this.dFlash.current = this.dFlash.amt;
      this.dFlash.shakeCur = this.dFlash.shakeAmt;
      for(let i = 0; i < 10; i++)
      {
        let b = GLOBAL.WEAPONS[1].projectile;
        let c = new Projectile(this.x, this.y + this.yscale/1.5, b.w * 2, b.h * 2, randrange(3,5), randrange(90, 360), b.sprite, randrange(60,75)).cUpdate = b.cUpdate;;

        // needs smoke sprites
      }
      if (this.hp < 0)
      {
        this.die();
      }
    },

    die: function()
    {
      this.dead = true;
      for(let i = 0; i < 60; i++)
      {
        let b = GLOBAL.WEAPONS[1].projectile;
        let c = new Projectile(this.x, this.y + this.yscale/1.5, b.w * 2, b.h * 2, randrange(5,9), randrange(90, 360), b.sprite, randrange(60,75)).cUpdate = b.cUpdate;
      }
      this.sprite = new Sprite(enemysheet, 152, 0, 76, 172);
      //arrayRemove(this, GLOBAL.OBJECTS);
    },

    update: function()
    {
      this.x = this.ogX, this.y = this.ogY;
      if (this.dFlash.shakeCur > 0)
      {
        let count = this.dFlash.shakeCur / this.dFlash.shakeAmt * 10;
        this.y += randrange(count, -count);
        this.x += randrange(count, -count);
      }

      this.dFlash.current = max(this.dFlash.current-1, 0);
      this.dFlash.shakeCur = max(this.dFlash.shakeCur-1, 0);
      this.draw();
    },

    draw: function()
    {
      if (!this.dead)
      {
      if (this.dFlash.current > 0) 
      {
        this.sprite.x = 76;
      } else this.sprite.x = 0; 
      }
      this.sprite.draw(this.x, this.y, this.sprite.w, this.sprite.h);
      
    }
  }
  GLOBAL.OBJECTS.push(obj);
  return obj;
}

function CollisionRoomChanger(x,y,w,h,level=GLOBAL.LEVELINDEX+1)
{
  let a = {
    x: x,
    y: y,
    xscale: w, 
    yscale: h,
    level: GLOBAL.LEVELS[level],
    check: false,
    type: "CollisionRoomChanger",
    update: function()
    {
      if (collideType(this, "Player"))
      {
        new SlideTransition(0, true, this.level);
        GLOBAL.LEVELINDEX = level;
      }
      ctx.strokeStyle = "#FF0000";
      ctx.strokeRect(this.x, this.y, this.xscale, this.yscale);
    }

    }
  GLOBAL.OBJECTS.push(a);
  return a;
}

function BulletFlash(x, y)
{
  let obj = {
    x: x,
    y: y,
    xscale: 15,
    yscale: 15,
    tick: 0,
    sprite: new AnimatedSprite(spritesheet, 181, 49, 15, 15, 0, 5, 3, 0, false),
    update: function()
    {
       this.sprite.draw(this.x, this.y, this.xscale, this.yscale);
       if (++this.tick > this.sprite.frames * this.sprite.time) arrayRemove(this, GLOBAL.OBJECTS);
    }
  }
  GLOBAL.OBJECTS.push(obj);
  return obj;
}

function BackgroundImage(x, y, xscr, yscr, bg)
{
  let obj = {
    xoffset: x,
    yoffset: y,
    xscroll: xscr,
    yscroll: yscr,
    bg: bg,
    xstart: x,
    ystart: y,

    update: function()
    {
      this.x = camera.x + this.xoffset;
      this.y = camera.y + this.yoffset;
      this.xoffset += this.xscroll;
      this.yoffset += this.yscroll;
      if (boxIntersect(this.x + this.xoffset, this.y, 360, 240, this.x + 360*2, 0, 360, 240))
      {
        this.xoffset = -360; // need to come up with a formula for Accurate Resetting:tm:
        this.yoffset = 0;
      }
      this.bg.draw(this.x, this.y, 360, 240, bgctx);
    }
  }

  GLOBAL.OBJECTS.push(obj);
}

function ElevatorPlatform(x, y, w, h, weight, downspd)
{

}

function SlideDoor(x, y, w, h, sprite, heavy=false)
{
  let obj = {
    x: x,
    y: y,
    xscale: w,
    yscale: h,
    sprite: undefined,
    // ^ need a solution for door sprites in level data
    heavy: heavy,
    activated: false,
    type: "Object",

    open: function() { this.activated = true; },

    close: function() { this.activated = false; },

    update: function()
    {
      if (this.sprite === undefined)
      {
        ctx.fillStyle = GLOBAL.LEVEL.color;
        ctx.fillRect(this.x, this.y, this.xscale, this.yscale)
      } else this.sprite.draw(this.x, this.y, this.xscale, this.yscale);
    }
  }
  GLOBAL.OBJECTS.push(obj);
  return obj;
}

let player = new Player(0, 0),
  camera = new Camera(player);

GLOBAL.WEAPONS = [
  new Weapon("testpistol", null, true, 5, [0, 0], 1,
    new TestPistolProjectile(0, 0, 10, 10, 8, 0,
      new Sprite(spritesheet, 0, 21, 8, 4), 100),
    new Sprite(spritesheet, 10, 22, 10, 6),
    1, 0),
  new Weapon("pesttistol", null, false, 5, [0, 0], 6,
    new PumpProjectile(0, 0, 7.5, 7.5, 5, 10,
      new Sprite(spritesheet, 0, 21, 8, 4), 600),
    new Sprite(spritesheet, 177, 0, 17, 7),
    1, 10)
  // Weapon(name, owner, auto, delay, offset, shots, projectile, sprite, size, kickback)
  // Projectile(x, y, xscale, yscale, spd, dir, sprite, deathTime)
];

// init //
function incLoader()
{
  loadProgress++;
  if (loadProgress >= 5) update();
}

spritesheet.onload = function()
{
  ctx.imageSmoothingEnabled = false;
  loadLevel(GLOBAL.LEVELS[0]);
  GLOBAL.LEVEL.bg.imageSmoothingEnabled = false;
  incLoader();
};

bgsheet.onload = incLoader();
playersheet.onload = incLoader();
enemysheet.onload = incLoader();
tilesheet.onload = incLoader();

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
  
  let xmove = camera.x,
      ymove = camera.y;
    
  ctx.clearRect(0,0,canvas.width, canvas.height);
  bgctx.drawImage(GLOBAL.LEVEL.bg, 0, 0, GLOBAL.LEVEL.bg.width, GLOBAL.LEVEL.bg.height, 0, 0, canvas.width, canvas.height);
  
  ctx.translate(-xmove, -ymove);
 
  if (GLOBAL.LEVEL.tilemap.width >= 16)
    ctx.drawImage(GLOBAL.LEVEL.tilemap, xmove, ymove, canvas.width, canvas.height, xmove, ymove, canvas.width, canvas.height); // TODO: MOVE TILEMAP DOWN ONE LAYER

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

/****************\
    IDS:

Params:
 0  1  2  3  4  5
id, x, y, w, h  EXTRA
/******************/

let types = [Player, Camera, Wall, null, null, Enemy, EyeGiver, GuardEye, CollisionRoomChanger, BulletFlash, BackgroundImage, ElevatorPlatform, SlideDoor];

function parseID(params)
{
  let obj = types[params[0]],
      arg = params.slice(1);
  if (obj === Player || obj === Camera)
  {
    if (obj === Player)
    {
      
      player = new Player(...arg);
      return player;
    }
    camera = new Camera(player);
    return camera;
  }

  if (types[params[0]] === null)
  {
    console.error(`INVALID OBJECT: PARAMS\n${params}`);
    return null;
  } 
  return new obj(...arg);
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
  GLOBAL.LEVEL.tilemap = document.querySelector('#t');
  GLOBAL.GRAVITY = 1;

  level = level.split('---');
  let settings = level[0].split('|');
  let lvl = level[1].split('|');
  let tiles = level[2].split('|');

  loadBG(settings[0]);
  GLOBAL.LEVEL.color = settings[1]; GLOBAL.LEVEL.width = settings[2]; GLOBAL.LEVEL.height = settings[3];

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
    //if (obj != null) GLOBAL.OBJECTS.push(obj);
  }
  camera.overlay = null;
  if (settings[4] != "") camera.overlay = loadOverlay(settings[4]);

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
  
  player.TMPsprite = new AnimatedSprite(spritesheet, 0, 46, 13, 18, 0, 7, 10, 0);
  player.equip(GLOBAL.WEAPONS[0]);
  player.equip(GLOBAL.WEAPONS[1]);
  new SlideTransition(0, false, 0);

  loadTileMap(tiles);
}

function loadBG(index)
{
  bgctx = GLOBAL.LEVEL.bg.getContext('2d');
  if(index[0] === "#") 
  {
    GLOBAL.LEVEL.bgColor = index;
    bgctx.fillStyle = index;
    bgctx.fillRect(0, 0, bg.width, bg.height);
  } else
  {
    let scrollers = index.split(',').map(x => parseInt(x));
    if (scrollers.length > 1)
    {
      GLOBAL.LEVEL.bgscroll = [scrollers[1], scrollers[2]];
    }
    new BackgroundImage(1, 0, scrollers[1], scrollers[2], new Sprite(bgsheet, 0, GLOBAL.LEVEL.bg.height * scrollers[0], GLOBAL.LEVEL.bg.width, GLOBAL.LEVEL.bg.height));
    new BackgroundImage(-360, 0, scrollers[1], scrollers[2], new Sprite(bgsheet, 0, GLOBAL.LEVEL.bg.height * scrollers[0], GLOBAL.LEVEL.bg.width, GLOBAL.LEVEL.bg.height));
  }
}

function loadOverlay(index)
{
  return new Sprite(bgsheet, GLOBAL.LEVEL.bg.width, GLOBAL.LEVEL.bg.height * index, GLOBAL.LEVEL.bg.width, GLOBAL.LEVEL.bg.height);
}

function loadTileMap(tilemap)
{
  GLOBAL.LEVEL.tilemap.width = GLOBAL.LEVEL.width;
  GLOBAL.LEVEL.tilemap.height = GLOBAL.LEVEL.height;
  let tmap = document.querySelector('#t').getContext('2d');
  tmap.clearRect(0, 0, GLOBAL.LEVEL.width, GLOBAL.LEVEL.height);
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

function collideType(objA, type)
{
  for(let i = 0; i < GLOBAL.OBJECTS.length; i++)
  {
    let obj = GLOBAL.OBJECTS[i];
    if (obj.type == type && boxIntersect(objA.x, objA.y, objA.xscale, objA.yscale,
    obj.x, obj.y, obj.xscale, obj.yscale))
    {
      return true;
    }
  }
  return false;
}

function findType(type)
{
  for(let i = 0; i < GLOBAL.OBJECTS.length; i++)
  {
    
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

function randrange(max, min)
{
  return Math.random() * (max - min) + min;
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
  spritesheet.src = "src/data/spritesheet.png";
  playersheet.src = "src/data/playersheet.png";
  enemysheet.src = "src/data/enemysheet.png";
  tilesheet.src = "src/data/tilesheet.png";
  bgsheet.src = "src/data/bgsheet.png";
  GLOBAL.LEVELS = [`0,1,0|#6A00FF|360|240|0|---|0,20,90|1|7,290,30,16,128|2,0,144,32,128|2,0,0,32,80|2,304,176,80,128|2,304,-48,80,112|2,32,64,16,16|2,32,144,16,16|8,400,70,40,120,1|---|9,0,140|`,`1,1,0|#FF00FF|360|240|1|---|0,32,32|1|2,0,0,368,16|2,0,224,368,48|2,-16,16,16,208|2,352,16,16,128|8,300,120,300,120|---|18,0,0|18,0,16|18,0,32|18,0,48|18,0,64|18,0,80|18,0,96|18,0,112|18,0,128|18,0,144|18,0,160|18,0,176|18,0,192|18,0,208|18,0,224|18,0,240|18,16,0|18,16,16|18,16,32|18,16,48|18,16,64|18,16,80|18,16,96|18,16,112|18,16,128|18,16,144|18,16,160|18,16,176|18,16,192|18,16,208|18,16,224|18,16,240|18,32,0|18,32,16|18,32,32|18,32,48|18,32,64|18,32,80|18,32,96|18,32,112|18,32,128|18,32,144|18,32,160|18,32,176|18,32,192|18,32,208|18,32,224|18,32,240|18,48,0|18,48,16|18,48,32|18,48,48|18,48,64|18,48,80|18,48,96|18,48,112|18,48,128|18,48,144|18,48,160|18,48,176|18,48,192|18,48,208|18,48,224|18,48,240|18,64,0|18,64,16|18,64,32|18,64,48|18,64,64|18,64,80|18,64,96|18,64,112|18,64,128|18,64,144|18,64,160|18,64,176|18,64,192|18,64,208|18,64,224|18,64,240|18,80,0|18,80,16|18,80,32|18,80,48|18,80,64|18,80,80|18,80,96|18,80,112|18,80,128|18,80,144|18,80,160|18,80,176|18,80,192|18,80,208|18,80,224|18,80,240|18,96,0|18,96,16|18,96,32|18,96,48|18,96,64|18,96,80|18,96,96|18,96,112|18,96,128|18,96,144|18,96,160|18,96,176|18,96,192|18,96,208|18,96,224|18,96,240|18,112,0|18,112,16|18,112,32|18,112,48|18,112,64|18,112,80|18,112,96|18,112,112|18,112,128|18,112,144|18,112,160|18,112,176|18,112,192|18,112,208|18,112,224|18,112,240|18,128,0|18,128,16|18,128,32|18,128,48|18,128,64|18,128,80|18,128,96|18,128,112|18,128,128|18,128,144|18,128,160|18,128,176|18,128,192|18,128,208|18,128,224|18,128,240|18,144,0|18,144,16|18,144,32|18,144,48|18,144,64|18,144,80|18,144,96|18,144,112|18,144,128|18,144,144|18,144,160|18,144,176|18,144,192|18,144,208|18,144,224|18,144,240|18,160,0|18,160,16|18,160,32|18,160,48|18,160,64|18,160,80|18,160,96|18,160,112|18,160,128|18,160,144|18,160,160|18,160,176|18,160,192|18,160,208|18,160,224|18,160,240|18,176,0|18,176,16|18,176,32|18,176,48|18,176,64|18,176,80|18,176,96|18,176,112|18,176,128|18,176,144|18,176,160|18,176,176|18,176,192|18,176,208|18,176,224|18,176,240|18,192,0|18,192,16|18,192,32|18,192,48|18,192,64|18,192,80|18,192,96|18,192,112|18,192,128|18,192,144|18,192,160|18,192,176|18,192,192|18,192,208|18,192,224|18,192,240|18,208,0|18,208,16|18,208,32|18,208,48|18,208,64|18,208,80|18,208,96|18,208,112|18,208,128|18,208,144|18,208,160|18,208,176|18,208,192|18,208,208|18,208,224|18,208,240|18,224,0|18,224,16|18,224,32|18,224,48|18,224,64|18,224,80|18,224,96|18,224,112|18,224,128|18,224,144|18,224,160|18,224,176|18,224,192|18,224,208|18,224,224|18,224,240|18,240,0|18,240,16|18,240,32|18,240,48|18,240,64|18,240,80|18,240,96|18,240,112|18,240,128|18,240,144|18,240,160|18,240,176|18,240,192|18,240,208|18,240,224|18,240,240|18,256,0|18,256,16|18,256,32|18,256,48|18,256,64|18,256,80|18,256,96|18,256,112|18,256,128|18,256,144|18,256,160|18,256,176|18,256,192|18,256,208|18,256,224|18,256,240|18,272,0|18,272,16|18,272,32|18,272,48|18,272,64|18,272,80|18,272,96|18,272,112|18,272,128|18,272,144|18,272,160|18,272,176|18,272,192|18,272,208|18,272,224|18,272,240|18,288,0|18,288,16|18,288,32|18,288,48|18,288,64|18,288,80|18,288,96|18,288,112|18,288,128|18,288,144|18,288,160|18,288,176|18,288,192|18,288,208|18,288,224|18,288,240|18,304,0|18,304,16|18,304,32|18,304,48|18,304,64|18,304,80|18,304,96|18,304,112|18,304,128|18,304,144|18,304,160|18,304,176|18,304,192|18,304,208|18,304,224|18,304,240|18,320,0|18,320,16|18,320,32|18,320,48|18,320,64|18,320,80|18,320,96|18,320,112|18,320,128|18,320,144|18,320,160|18,320,176|18,320,192|18,320,208|18,320,224|18,320,240|18,336,0|18,336,16|18,336,32|18,336,48|18,336,64|18,336,80|18,336,96|18,336,112|18,336,128|18,336,144|18,336,160|18,336,176|18,336,192|18,336,208|18,336,224|18,336,240|18,352,0|18,352,16|18,352,32|18,352,48|18,352,64|18,352,80|18,352,96|18,352,112|18,352,128|18,352,144|18,352,160|18,352,176|18,352,192|18,352,208|18,352,224|18,352,240|18,368,0|18,368,16|18,368,32|18,368,48|18,368,64|18,368,80|18,368,96|18,368,112|18,368,128|18,368,144|18,368,160|18,368,176|18,368,192|18,368,208|18,368,224|18,368,240
|`,`1,1,0|#AA11FF|820|240|1|---|0,96,128|1|2,0,208,592,144|2,0,0,784,32|2,576,32,16,32|2,784,0,112,352|2,608,208,160,16|2,-16,16,16,208|---||`,`#000000|#AA11FF|1280|720|---|0,640,480|1|2,520,640,240,640|6,640,416||---|0,520,640|3,520,656|3,520,672|3,520,688|3,520,704|1,536,640|4,536,656|4,536,672|4,536,688|4,536,704|1,552,640|4,552,656|4,552,672|4,552,688|4,552,704|1,568,640|4,568,656|4,568,672|4,568,688|4,568,704|1,584,640|4,584,656|4,584,672|4,584,688|4,584,704|1,600,640|4,600,656|4,600,672|4,600,688|4,600,704|1,616,640|4,616,656|4,616,672|4,616,688|4,616,704|1,632,640|4,632,656|4,632,672|4,632,688|4,632,704|1,648,640|4,648,656|4,648,672|4,648,688|4,648,704|1,664,640|4,664,656|4,664,672|4,664,688|4,664,704|1,680,640|4,680,656|4,680,672|4,680,688|4,680,704|1,696,640|4,696,656|4,696,672|4,696,688|4,696,704|1,712,640|4,712,656|4,712,672|4,712,688|4,712,704|1,728,640|4,728,656|4,728,672|4,728,688|4,728,704| 2,744,640|5,744,656|5,744,672|5,744,688|5,744,704|`];
})()
// bg bgsx bgsy | col | w | h | overlay |---| objs |---|tiles|
