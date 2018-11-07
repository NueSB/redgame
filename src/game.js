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
    tilemap: document.querySelector('#t'),

    setBgColor: function(color)
    {
      bgctx.fillStyle = color;
      bgctx.fillRect(0,0,360,240);
    }
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
    direction: 0,

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

      if (this.owner.up && GLOBAL.GRAVITY > 0 ||
         (this.owner.up && GLOBAL.GRAVITY < 0 && !this.owner.grounded))
      {
        offset = 0;
        direction = 180;
      }
      if (this.owner.down && !this.owner.grounded || 
         (GLOBAL.GRAVITY < 0 && this.owner.down))
      {
        offset = 0;
        direction = 360;
      }
      
      this.direction = direction;
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
      
      let rotated = (this.direction == 360 || (this.direction == 180));
      if (rotated)
      {
        let origin = 0;
        let pos = [this.x,this.y];
        if (this.owner.facing === 1) 
        {
          pos = [this.x + this.sprite.w, this.y];
          origin = -this.sprite.w
        }
        ctx.translate(pos[0], pos[1]);
        let amt = this.direction + 90 + (180 * this.owner.facing);
        if (GLOBAL.GRAVITY < 0)
        {
          //amt -= 180;
        }
        ctx.rotate(amt * Math.PI/180);
        this.sprite.draw(origin, 0,
          this.sprite.w * this.size, this.sprite.h * this.size);
        ctx.rotate(-amt * Math.PI/180);
        ctx.translate(-pos[0], -pos[1]);
        if (this.owner.facing === 1)
        {
          this.x -= this.sprite.w;
        }
        return;
      }
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

      if (keyDown("SHIFT") && keyPressed("L"))
      {
        loadLevel(GLOBAL.LEVELS[Math.min(GLOBAL.LEVELINDEX+1, GLOBAL.LEVELS.length-1)]);
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
      else if (!this.out && this.w < 0) arrayRemove(this, camera.guiObjects);
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
      scale: 36,
      parent: null,
      centerScale: 25,

      draw: function(progress, timer)
      {
        let size = this.scale * Easings.easeInOutCubic(progress);
        GLOBAL.LEVEL.color = `rgb(${progress * 255},0,${progress * 110})`;
        GLOBAL.LEVEL.setBgColor(`rgb(${progress * 170/4},0,${progress * 140/5})`);
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(this.x + Math.sin(size * 15 * Math.PI/180) * size/2, this.y + Math.cos(size * 16 * Math.PI/180) * size/2, size, 0, 2 * Math.PI, false);
        if (true) {} else {
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

function ElevatorPlatform(x, y, w, h)
{
  let obj = {
    x: x,
    y: y,
    xscale: w,
    yscale: h,
    type: "Object",
    weight: 1,
    speed: 0.5,

    update: function()
    {
      this.y -= this.speed;
      this.draw();
    },

    draw: function()
    {
      ctx.fillStyle = GLOBAL.LEVEL.color;
      ctx.fillRect(this.x, this.y, this.xscale, this.yscale);
    }
  }

  GLOBAL.OBJECTS.push(obj);
  return obj;
}

function SlideDoor(x, y, w, h, heavy=0, side=0, sprite)
{
  let obj = {
    x: x,
    y: y,
    xscale: w,
    yscale: h,
    maxxs: w,
    maxys: h,
    sprite: undefined,
    // ^ need a solution for door sprites in level data
    heavy: heavy,
    activated: false,
    animDuration: 30,
    progress: 0,
    type: "Object",

    open: function() 
    { this.opening = true; this.progress = this.animDuration; this.activated = true; },

    close: function() 
    { this.opening = false; this.progress = 0; this.activated = true; },

    update: function()
    {
      if (keyPressed("I"))
      {
        if (this.opening)
          this.close();
        else this.open();
      }
      if (this.activated)
      {
        if (this.opening)
          this.progress--;
        else this.progress++;
        let anim = Easings.easeInOutQuad(clamp(this.progress / this.animDuration, 0, 1));
        if (this.side == 1) this.xscale = this.maxxs * anim;
        else this.yscale = this.maxys * anim;
        if (this.progress >= this.animDuration)
        {
          this.activated = false;
        }
      }
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
  new Weapon("testpistol", null, true, 1, [0, 0], 1,
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
  GLOBAL.LEVEL.bg.imageSmoothingEnabled = false;
  incLoader();
};

bgsheet.onload = incLoader();
playersheet.onload = incLoader();
enemysheet.onload = incLoader();
tilesheet.onload = function()
{
  loadLevel(GLOBAL.LEVELS[0]);
  incLoader();
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
  
  let xmove = camera.x,
      ymove = camera.y;
    
  ctx.clearRect(0,0,canvas.width, canvas.height);
  bgctx.drawImage(GLOBAL.LEVEL.bg, 0, 0, GLOBAL.LEVEL.bg.width, GLOBAL.LEVEL.bg.height, 0, 0, canvas.width, canvas.height);
  
  ctx.translate(-xmove, -ymove);
 
  if (GLOBAL.LEVEL.tilemap.width >= 16)
    ctx.drawImage(GLOBAL.LEVEL.tilemap, xmove, ymove, canvas.width, canvas.height, xmove, ymove, canvas.width, canvas.height); 

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

  if (obj === Player)
  {
    player = new Player(...arg);
    return player;
  } else if (obj === Camera)
  {
    camera = new Camera(player);
    return camera;
  }
  if (obj === null)
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
  GLOBAL.LEVELINDEX = GLOBAL.LEVELS.indexOf(level);

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
    //  (optional) width, height (repeat tiles)
    //  that's it i guess

    let tileData = tilemap[i].split(',');
    let tile = parseTile(tileData[0]);
    if (tileData.length > 3)
    {
      const STARTX = parseInt(tileData[1]),
            STARTY = parseInt(tileData[2]),
            ENDX = STARTX + parseInt(tileData[3]),
            ENDY = STARTY + parseInt(tileData[4]);

      for(let x = STARTX; x < ENDX; x+=16)
      {
        for(let y = STARTY; y < ENDY; y+=16)
        {
          tmap.drawImage(tilesheet, tile.x, tile.y, 16, 16, x, y, 16, 16);
        }
      }
      continue;
    }
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
  GLOBAL.LEVELS = [`#000000|#AA11FF|460|240|-1|---|0,64,176|1|2,0,0,16,240,1|2,16,224,320,16,1|2,16,0,336,16,1|2,320,16,16,128,1|2,0,-96,336,176,1|2,448,-112,16,352,1|11,352,224,80,16|2,320,240,144,16,1|2,432,0,16,16,1|2,112,176,16,16,1|2,160,176,16,16,1|2,336,-80,112,16|---|1,16,224,304,16|2,320,224|5,0,80,16,144|4,0,224|7,16,64,304,16|4,0,0,320,64|4,320,0|4,448,0|6,432,0|8,336,0|5,320,16,16,128|3,448,16,16,224|0,352,224|2,416,224|1,368,224,48,16|4,0,64|`,`0,1,0|#6A00FF|360|240|0|---|0,20,90|1|7,290,30,16,128|2,0,144,32,128|2,0,0,32,80|2,304,176,80,128|2,304,-48,80,112|2,32,64,16,16|2,32,144,16,16|8,400,70,40,120,1|---|9,0,140|`,`1,1,0|#AA11FF|360|240|1|---|0,32,32|1|2,0,0,368,16|2,0,224,368,48|2,-16,16,16,208|2,352,16,16,128|8,352,120,300,120|12,352,120,16,96|---|18,0,0,120,240|19,120,0,140,240|20,240,0,120,240|`,`1,1,0|#6A00FF|820|240|1|---|0,96,128|1|2,0,208,592,144|2,0,0,784,32|2,576,32,16,32|2,784,0,112,352|2,608,208,160,16|2,-16,16,16,208|---||`,`#000021|#000011|1280|720|0|---|0,368,224|1|2,240,256,272,192,1|6,368,130,0|---|1,256,256,240,16|0,240,256|2,496,256|5,496,272,16,176|3,240,272,16,176|4,256,272,240,176|`];
})()
// bg bgsx bgsy | col | w | h | overlay |---| objs |---|tiles|
