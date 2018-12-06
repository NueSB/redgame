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
var gl = canvas.getContext("webgl2", {antialias: false});
let posBuffer = gl.createBuffer();
var TIME = {
  frame: 0
};

var GLOBAL = {
  OBJECTS: [],
  KEYS: new Map(),
  GRAVITY: 1.0,
  //FONT: new Sprite(),
  LEVELINDEX: 0,
  LEVEL:
  {
    width: 1280,
    height: 720,
    color: new Color({hex: "#AA11FF"}),
    bgColor: "",
    bgscroll: [0,0],
    bg: document.querySelector('#bg'),
    tilemap: document.querySelector('#t'),
    
    entrances:
    [
      
    ],

    setBgColor: function(color)
    {
      bgctx.fillStyle = color.type===typeof(Color) ? color.toString() : color;
      bgctx.fillRect(0,0,360,240);
    }
  }
};

let graphics = 
{
  drawColor: new Color({r:255,g:255,b:255,a:255}),
  tintColor: new Color({r:255,g:255,b:255,a:0}),
  bgTint: new Color({r:0,g:0,b:0,a:0}),
  globalTransform: 0,

  rect: function(x,y,w,h)
  {
    let matrix = this.mat3.multiply(this.globalTransform, this.mat3.translation(x,y));
    let scale = this.mat3.scale(w, h);
    matrix = this.mat3.multiply(matrix, scale);
    gl.uniformMatrix3fv(this.shader.vars['uMatrix'].location, false, matrix);
  },
  
  drawRect: function(x, y, w, h)
  {
    this.rect(x,y,w,h);
    
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  },

  fillRect: function(x, y, w, h)
  {
    this.setShader(0);
    gl.uniform4f(this.shader.vars['uColor'].location, 
    this.drawColor.r / 255, this.drawColor.g / 255, this.drawColor.b / 255, this.drawColor.a / 255); 
    this.drawRect(x,y,w,h);
  },

  setShader: function(shader)
  {
    this.shader = this.programs[shader];
    gl.useProgram(this.shader.program)
  },

  drawImage: function(texture, sx = 0, sy = 0, sw, sh, dx, dy, dw, dh)
  {
    this.setShader(1);
    if (dw === undefined) 
    {
      dw = texture.width;
    }
    if (dh === undefined)
    {
      dh = texture.height;
    } 
    if (sx === undefined) sx = 0;
    if (sy === undefined) sy = 0;
    if (sw === undefined) sw = texture.width;
    if (sh === undefined) sh = texture.height;
    
 
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture.texture);

    gl.uniform2f(this.shader.vars['uResolution'].location, gl.canvas.width, gl.canvas.height);
    gl.uniform1i(this.shader.vars['uTexture'].location, 0);
    gl.uniform4f(this.shader.vars['uTint'].location,
    this.tintColor.r / 255,
    this.tintColor.g / 255,
    this.tintColor.b / 255,
    this.tintColor.a / 255);

    let texmatrix = this.mat3.translation(sx / texture.width, sy / texture.height);
    texmatrix = this.mat3.multiply(texmatrix, this.mat3.scale(sw / texture.width, sh / texture.height));
    gl.uniformMatrix3fv(this.shader.vars['uTexMatrix'].location, false, texmatrix);


    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    this.drawRect(dx, dy, dw, dh);
  },

  loadTexture: function(src, name)
{
  let tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  let textureObj = {
    width: 1,
    height: 1,
    texture: tex
  };

  if (typeof(src) === String)
  {
    let img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    console.log('loadimage, src='+src);

    img.onload = function()
    {
      textureObj.width = img.width,
      textureObj.height = img.height;

      gl.bindTexture(gl.TEXTURE_2D, textureObj.texture);
    
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.generateMipmap(gl.TEXTURE_2D);
      this.textures[name] = textureObj;
      //incLoader();
    }
  } else 
  {
    textureObj.width = src.width,
    textureObj.height = src.height;

    gl.bindTexture(gl.TEXTURE_2D, textureObj.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    //gl.generateMipmap(gl.TEXTURE_2D);
    this.textures[name] = textureObj;
  }
  console.log(textureObj);
  return textureObj;
},

  translate: function(x, y)
  {
    this.globalTransform = this.mat3.multiply(this.globalTransform, this.mat3.translation(x, y));
  },

  rotate: function(radAngle)
  {
    this.globalTransform = this.mat3.multiply(this.globalTransform, this.mat3.rotation(radAngle))
  },
  
  mat3: {
    identity: function()
    {
      return [
        1, 0, 0,
        0, 1, 0,
        0, 0, 1
      ];
    },

    translation: function(x, y)
    {
      return [
        1, 0, 0,
        0, 1, 0,
        x, y, 1
      ];
    },

    rotation: function(radAngle)
    {
      let s = Math.sin(radAngle),
          c = Math.cos(radAngle);
      return [
        c, -s, 0,
        s,  c, 0,
        0,  0, 1
      ];
    },

    scale: function(x, y)
    {
      return [
        x, 0, 0,
        0, y, 0,
        0, 0, 1
      ];
    },

    multiply: function(a, b) { // TODO: beautify me
      var a00 = a[0 * 3 + 0];
      var a01 = a[0 * 3 + 1];
      var a02 = a[0 * 3 + 2];
      var a10 = a[1 * 3 + 0];
      var a11 = a[1 * 3 + 1];
      var a12 = a[1 * 3 + 2];
      var a20 = a[2 * 3 + 0];
      var a21 = a[2 * 3 + 1];
      var a22 = a[2 * 3 + 2];
      var b00 = b[0 * 3 + 0];
      var b01 = b[0 * 3 + 1];
      var b02 = b[0 * 3 + 2];
      var b10 = b[1 * 3 + 0];
      var b11 = b[1 * 3 + 1];
      var b12 = b[1 * 3 + 2];
      var b20 = b[2 * 3 + 0];
      var b21 = b[2 * 3 + 1];
      var b22 = b[2 * 3 + 2];
      return [
        b00 * a00 + b01 * a10 + b02 * a20,
        b00 * a01 + b01 * a11 + b02 * a21,
        b00 * a02 + b01 * a12 + b02 * a22,
        b10 * a00 + b11 * a10 + b12 * a20,
        b10 * a01 + b11 * a11 + b12 * a21,
        b10 * a02 + b11 * a12 + b12 * a22,
        b20 * a00 + b21 * a10 + b22 * a20,
        b20 * a01 + b21 * a11 + b22 * a21,
        b20 * a02 + b21 * a12 + b22 * a22,
      ];
    }
  },

  shader: null,
  
  shaders: [
    {
      name: "baseColor",
      vert: `#version 300 es
      in vec2 pos;
      uniform vec2 uResolution;
      uniform mat3 uMatrix;
    
      void main()
      {
        vec2 position = (uMatrix * vec3(pos.xy, 1)).xy;
        // pixels -> 0 <-> 1
        vec2 zerotoone = position / uResolution;
    
        vec2 zeroto2 = zerotoone * 2.0;
        // 0 <-> 2 --> -1 <-> 1 (clipspace)
        vec2 clipSpace = zeroto2 - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
      }`,
    
      frag: `#version 300 es
      precision mediump float;
      
      uniform vec4 uColor;
      out vec4 col;
      void main()
      {
        col = uColor;
      }`,
    },

    {
      name: "texture",
      vert: `#version 300 es
      in vec2 aPos;
      in vec2 aTexcoord;
      
      uniform vec2 uResolution;
      uniform mat3 uMatrix;
      uniform mat3 uTexMatrix;
      out vec2 vTexcoord;
      
      void main()
      {
        vec2 position = (uMatrix * vec3(aPos.xy, 1)).xy;
        // pixels -> 0 <-> 1
        vec2 zerotoone = position / uResolution;
    
        vec2 zeroto2 = zerotoone * 2.0;
        // 0 <-> 2 --> -1 <-> 1 (clipspace)
        vec2 clipSpace = zeroto2 - 1.0;

        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        vTexcoord = (uTexMatrix * vec3(aTexcoord, 1)).xy;
      }`,

      frag: `#version 300 es
      precision mediump float;
      
      in vec2 vTexcoord;
      uniform sampler2D uTexture;
      out vec4 outCol;
      uniform vec4 uTint;

      void main()
      {
        outCol = texture(uTexture, vTexcoord);
        outCol.rgb = mix(outCol.rgb, uTint.rgb, uTint.a);
      }`
    }
  ],

  programs: [],

  textures: {}
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

    draw: function(xpos, ypos, xscale, yscale, canvas=graphics)
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
    graphics.drawImage(a.src,
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

function Color(obj)
{
  let r = 0, g = 0, b = 0, a = 255;  // :puke:
  a = (obj.a !== undefined ? obj.a : 255);
  if (obj.hex)
  {
    let cols = obj.hex.slice(1).match(/.{1,2}/g).map(x=>parseInt(x, 16));
    r = cols[0], g = cols[1], b = cols[2]; 
  }
  return {
    r: obj.r || r,
    g: obj.g || g,
    b: obj.b || b,
    a: obj.a || a,
    hex: obj.hex || null,
    toString: function() 
    {
      return `rgba(${this.r},${this.g},${this.b},${this.a})`;
    }
  }
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
        graphics.translate(pos[0], pos[1]);
        let amt = this.direction + 90 + (180 * this.owner.facing);
        if (GLOBAL.GRAVITY < 0)
        {
          amt -= 180;
        }
        graphics.rotate(-amt * Math.PI/180);
        this.sprite.draw(origin, 0,
          this.sprite.w * this.size, this.sprite.h * this.size);
        graphics.rotate(amt * Math.PI/180);
        graphics.translate(-pos[0], -pos[1]);
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
    solid: true,
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
    timerEvents: {
      1: function()
      {
        console.log("it is done");
      }
    },

    update: function()
    {
      if (typeof(this.timerEvents[++this.timer]) === typeof(Function))
      {
        this.timerEvents[this.timer]();
      }
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
    sprite: new Sprite(graphics.textures.playersheet, 0, 41, 10, 18),
    TMPsprite: new Sprite(graphics.textures.spritesheet, 0, 0, 5, 9),
    walkSprite: new AnimatedSprite(graphics.textures.playersheet, 1, 0, 12, 20, 0, 5, 4, 0, true),
    walkSpriteB: new AnimatedSprite(graphics.textures.playersheet, 72, 0, 12, 20, 0, 5, 4, 0, true),
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
      if (this.hp <= 0) this.die();
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

      if (keyDown("SHIFT"))
      {
        if (keyPressed("L")) loadLevel(GLOBAL.LEVELS[Math.min(GLOBAL.LEVELINDEX+1, GLOBAL.LEVELS.length-1)]);
        if (keyPressed("O")) saveGame(0);
        if (keyPressed("P")) loadGame(0);
      }
       
    },

    update: function()
    {
      this.interacted = false;
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
            if (obj.solid != undefined && obj.solid &&
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
          if (obj.solid != undefined && obj.solid)
          {
            if (boxIntersect(this.x, this.y + sign(this.vy),
                this.xscale, this.yscale,
                obj.x, obj.y,
                obj.xscale, obj.yscale))
            {
              this.vy = 0;
              collision = true;
              this.grounded = true;
              break;
            }
            this.grounded = false;
          }
        }
        if (collision) break;
        this.y += sign(this.vy);
      }

      // ground collision
      for (let o = 0; o < GLOBAL.OBJECTS.length; o++)
      {
        let obj = GLOBAL.OBJECTS[o];
        if (obj.solid != undefined && obj.solid &&
          boxIntersect(this.x, this.y + GLOBAL.GRAVITY,
            this.xscale, this.yscale,
            obj.x, obj.y,
            obj.xscale, obj.yscale))
        {
          this.grounded = true;
          if (obj.interactable && this.grounded && keyPressed("D")) 
          {
            obj.interact();
            this.interacted = true;
          }
          if (obj.vy != undefined)
            this.vy = obj.vy*2;
          break;
        }
        this.grounded = false;
      }
      if (this.grounded && keyPressed("D") && !this.interacted) new hmm(this.x+2, this.y+2);

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
    solid: true,
    update: function() { this.draw() },
    draw: function()
    {
      if (this.invis)
      {
        return;
      }
       graphics.drawColor = GLOBAL.LEVEL.color;
       //bgctx.fillText(graphics.drawColor, this.x, this.y)
       graphics.fillRect(this.x, this.y, this.xscale, this.yscale);
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
      //console.log(this.overlay);
      if (this.overlay != null) 
      {
        this.overlay.draw(x, y, GLOBAL.LEVEL.bg.width, GLOBAL.LEVEL.bg.height);
      }
      graphics.drawImage(graphics.textures.spritesheet, 31, 0, 73, 11, x + 1, y, 73, 11);
      if (this.target.type === "Player")
      { 
        graphics.drawColor = GLOBAL.LEVEL.color;
        graphics.fillRect(x + 3, y+3, 73 * (this.target.hp / 3)-4, 4);
        for(let i = GLOBAL.WEAPONS[player.weaponIndex]; i < GLOBAL.WEAPONS.length; i++)
        {
          let wep = GLOBAL.WEAPONS[i].sprite;
          wep.draw(x, y+i*9+64, 16, 16);
        }

      }
      
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

function SlideTransition(speed, out, lvl, entranceID=0)
{
  let obj = {
    x: 0,
    y: 0,
    w: out ? 0 : canvas.width,
    h: canvas.width,
    out: out,
    timer: 0,
    level: lvl,
    entranceID: entranceID,
    type: "Transition",
    
    update: function(){ },
    
    draw: function()
    {
      this.timer += (this.out ? 1 : -1);
      this.x = camera.x;
      this.y = camera.y;
      this.w += this.timer;
      graphics.drawColor = new Color({hex: "#000000"});
      graphics.fillRect(this.x, this.y, this.w, this.h);
      
      if (this.out && this.w >= canvas.width) 
      {
        loadLevel(this.level, this.entranceID);
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

        GLOBAL.LEVEL.color = new Color({r: progress * 255,
                                        b: progress * 110});

        GLOBAL.LEVEL.setBgColor(new Color({r: progress * 170/4,
                                           b: progress * 140/5}));
        graphics.drawColor = new Color({hex: "#FFFFFF"});
        //ctx.beginPath();
        //ctx.arc(this.x + Math.sin(size * 15 * Math.PI/180) * size/2, this.y + Math.cos(size * 16 * Math.PI/180) * size/2, size, 0, 2 * Math.PI, false);
        if (true) {} else {
          this.x = player.x,
          this.y = player.y;

          let distance = dist([this.x, this.y], [this.parent.x, this.parent.y]);
          if (distance > this.parent.scale - this.centerScale * 2)
          {
            this.x = this.parent.x + ((this.x - this.parent.x) * (this.centerScale / distance));
            this.y = this.parent.y + ((this.y - this.parent.y) * (this.centerScale / distance));
          }
          //ctx.arc(this.x, this.y, size, 0, 2 * Math.PI, false);
        }
        //ctx.fill();
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
      //ctx.beginPath();
      graphics.drawColor = GLOBAL.LEVEL.color;
      //ctx.arc(this.x, this.y, this.scale * Easings.easeInOutCubic(this.animProgress), 0, 2 * Math.PI, false);
      //ctx.fill();
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
    sprite: new Sprite(graphics.textures.enemysheet, 0, 0, 76, 172),
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
        this.xscale = 0; this.yscale = 0;
      }
      this.sprite = new Sprite(graphics.textures.enemysheet, 152, 0, 76, 172);
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
      if (this.dead)
      {
        graphics.bgTint = new Color({r: Math.sin(TIME.frame/30)*255, g: 0.01, a: Math.sin(TIME.frame/300)*255});
  GLOBAL.LEVEL.color = new Color({r: Math.sin(TIME.frame/30)*15, g: 0, b:0});
      }
      this.dFlash.current = max(this.dFlash.current-1, 0);
      this.dFlash.shakeCur = max(this.dFlash.shakeCur-1, 0);
      this.draw();
    },

    draw: function()
    {
      let c = graphics.tintColor;
      
      if (!this.dead)
      {
        if (this.dFlash.current > 0) 
        {
          graphics.tintColor = new Color({hex: "#FFFFFF"});
        }
      } else graphics.tintColor = GLOBAL.LEVEL.color;
      this.sprite.draw(this.x, this.y, this.sprite.w, this.sprite.h);
      graphics.tintColor = c;
    }
  }
  GLOBAL.OBJECTS.push(obj);
  return obj;
}

function CollisionRoomChanger(x,y,w,h,level=GLOBAL.LEVELINDEX+1,entranceID=0)
{
  let a = {
    x: x,
    y: y,
    xscale: w, 
    yscale: h,
    level: GLOBAL.LEVELS[level],
    check: false,
    type: "CollisionRoomChanger",
    entranceID: entranceID,
    update: function()
    {
      if (collideType(this, "Player"))
      {
        new SlideTransition(0, true, this.level, this.entranceID);
      }
      //ctx.strokeStyle = "#FF0000";
      //ctx.strokeRect(this.x, this.y, this.xscale, this.yscale);
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
    sprite: new AnimatedSprite(graphics.textures.spritesheet, 181, 49, 15, 15, 0, 5, 3, 0, false),
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
    solid: true,
    weight: 1,
    triggered: false,
    speed: 0.5,
    vx: 0,
    vy: 0.5,

    update: function()
    {
      this.y -= this.vy;

      this.draw();
    },

    draw: function()
    {
      graphics.drawColor = GLOBAL.LEVEL.color;
      graphics.fillRect(this.x, this.y, this.xscale, this.yscale);
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
    solid: true,

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
        graphics.drawColor = GLOBAL.LEVEL.color;
        graphics.fillRect(this.x, this.y, this.xscale, this.yscale)
      } else this.sprite.draw(this.x, this.y, this.xscale, this.yscale);
    }
  }
  GLOBAL.OBJECTS.push(obj);
  return obj;
}

function SaveStation(x, y)
{
  let obj = {
    x: x,
    y: y,
    sprite: new Sprite(graphics.textures.spritesheet,0,44,44,20),
    xscale: 0,
    yscale: 0,
    solid: true,
    interactable: true,
    type: "SaveStation",

    update: function()
    {
      this.sprite.draw(this.x, this.y, this.xscale, this.yscale);
      // TODO: ADD SAVE FUNCTIONS
    },
    
    interact: function()
    {
      saveGame(0);
      player.vy += 10 * -GLOBAL.GRAVITY;
    }
  };
  obj.xscale = obj.sprite.w;
  obj.yscale = obj.sprite.h;
  GLOBAL.OBJECTS.push(obj);
  return obj;
}

function hmm(x, y)
{
  let obj = {
    x: x,
    y: y,
    time: 0,
    xscale: 0, yscale: 0,
    sprite: new Sprite(graphics.textures.playersheet, 21, 41, 4, 7),
    update: function()
    {
      ++this.time;
      if (this.time < 7) this.y -= Easings.easeInOutQuad(this.time / 7) * this.time;
      this.sprite.draw(this.x, this.y, this.sprite.w, this.sprite.h);
      if (this.time >= 60) arrayRemove(this, GLOBAL.OBJECTS);
    }
  }
  GLOBAL.OBJECTS.push(obj);
  return obj;
}

var player = new Player(0, 0),
    camera = new Camera(player);


// init //
function incLoader()
{
  console.log('load');
  loadProgress++;
  if (loadProgress >= 5) 
  {
    let x = [spritesheet, bgsheet, enemysheet, tilesheet, playersheet];
    for(let i = 0; i < x.length; i++)
    {
      //console.log(x[i].crossOrigin);
      graphics.loadTexture(x[i], x[i].src.split('/').slice(-1)[0].replace(/\..+/g, ''));
    }
    GLOBAL.LEVEL.bg.imageSmoothingEnabled = false;
    glSetup();

    GLOBAL.WEAPONS = [
      new Weapon("testpistol", null, true, 1, [0, 0], 1,
        new TestPistolProjectile(0, 0, 10, 10, 8, 0,
          new Sprite(graphics.textures.spritesheet, 0, 21, 8, 4), 100),
        new Sprite(graphics.textures.spritesheet, 10, 22, 10, 6),
        1, 0),
      new Weapon("pesttistol", null, false, 5, [0, 0], 6,
        new PumpProjectile(0, 0, 7.5, 7.5, 5, 10,
          new Sprite(graphics.textures.spritesheet, 0, 21, 8, 4), 600),
        new Sprite(graphics.textures.spritesheet, 177, 0, 17, 7),
        1, 10)
      // Weapon(name, owner, auto, delay, offset, shots, projectile, sprite, size, kickback)
      // Projectile(x, y, xscale, yscale, spd, dir, sprite, deathTime)
    ];
    if (localStorage.save0 != undefined)
      loadGame(0);
    else loadLevel(GLOBAL.LEVELS[0]);
    update();
  }
}

//
// ---------------------------------------------------
//

function glSetup()
{
  for(let i = 0; i < graphics.shaders.length; i++)
  {
    graphics.programs.push(generateProgram(i));
    console.log(graphics.programs);
  }
  graphics.setShader(0);
  gl.uniform2f(graphics.programs[0].vars['uResolution'].location, canvas.width, canvas.height);
  gl.uniform4f(graphics.programs[0].vars['uColor'].location, 1, 1, 1, 1);

  if (graphics.globalTransform == 0)    graphics.globalTransform = graphics.mat3.identity();
  console.log(graphics.tintColor.toString());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0, 0,
      0, 1,
      1, 1,
      1, 1,
      1, 0,
      0, 0
    ]), gl.STATIC_DRAW);
}

function createShader(gl, type, src)
{
  let shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  let woke = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (woke) return shader;

  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
}

function createProgram(gl, vert, frag)
{
  let program = gl.createProgram();
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  let woke = gl.getProgramParameter(program, gl.LINK_STATUS)
  if (woke) return program;

  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
}

function generateProgram(index)
{
  let vertShader = createShader(gl, gl.VERTEX_SHADER, graphics.shaders[index].vert);
  let fragShader = createShader(gl, gl.FRAGMENT_SHADER, graphics.shaders[index].frag);

  let program = createProgram(gl, vertShader, fragShader);


  let posBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);

  let vertArray = gl.createVertexArray();
  gl.bindVertexArray(vertArray);
  let vars = {};
  // start finding vars...
  let vertstr = graphics.shaders[index].vert;
  let fragstr = graphics.shaders[index].frag;

  let vertvars = vertstr.slice(15, vertstr.indexOf('void')).split('\n').map(x => x.trim().slice(0,-1)).filter(y => y != '').map(z => z.split(' '));
  let fragvars = fragstr.slice(15, fragstr.indexOf('void')).split('\n').map(x => x.trim().slice(0,-1)).filter(y => y != '').map(z => z.split(' '));
  // god
    let curVar = null,
        varLocation = null;
        buffers = [],
        vertArrays = [];

  for (let x = 0; x < vertvars.length; x++)
  {
    curVar = vertvars[x];
    if (curVar[0] === 'out') continue;
    else if (curVar[0] == 'uniform')
    {
      varLocation = gl.getUniformLocation(program, curVar[2]);
    }
      else if (curVar[0] == 'attribute' || curVar[0] == 'in')
    {
      varLocation = gl.getAttribLocation(program, curVar[2]);
      gl.enableVertexAttribArray(varLocation);
      gl.vertexAttribPointer(varLocation, 2, gl.FLOAT, false, 0, 0);
    }

    vars[curVar[2]] = {
      location: varLocation,
      type: curVar[1],
      };
  }
  for (x = 0; x < fragvars.length; x++) 
  {
    curVar = fragvars[x];
    if (curVar[0] === 'out') continue;
    else if (curVar[0] === 'uniform') 
      varLocation = gl.getUniformLocation(program, curVar[2]);
    else if (curVar[0] === 'attribute' || curVar[0] === 'in')
      varLocation = gl.getAttribLocation(program, curVar[2]);

      vars[curVar[2]] = {
        location: varLocation,
        type: curVar[1],
        };
  }
  return {program: program, vars: vars, vertArrays};
}


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
  //lets get shit VISUAL before we start gamestuff
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(graphics.bgTint.r/255,
   graphics.bgTint.g/255,
   graphics.bgTint.b/255, 
   graphics.bgTint.a/255);
  gl.clear(gl.COLOR_BUFFER_BIT);

  
  let xmove = camera.x,
      ymove = camera.y;
  
  bgctx.drawImage(GLOBAL.LEVEL.bg, 0, 0, GLOBAL.LEVEL.bg.width, GLOBAL.LEVEL.bg.height, 0, 0, canvas.width, canvas.height);
  
  graphics.translate(-xmove, -ymove);
 
  if (GLOBAL.LEVEL.tilemap.width >= 16)
    graphics.drawImage(graphics.textures.tilemap, xmove, ymove, 360, 240, xmove, ymove, 360, 240);

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
  graphics.translate(xmove, ymove);
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

let types = [Player, Camera, Wall, null, null, Enemy, EyeGiver, GuardEye, CollisionRoomChanger, BulletFlash, BackgroundImage, ElevatorPlatform, SlideDoor, SaveStation];

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

function loadLevel(level, entrance=0)
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
  GLOBAL.LEVEL.color = new Color({hex: settings[1]}); 
  console.log(GLOBAL.LEVEL.color);
  GLOBAL.LEVEL.width = settings[2]; GLOBAL.LEVEL.height = settings[3];

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
  console.log(settings);
  if (settings[4] != '-1' && settings[4] != '') camera.overlay = loadOverlay(settings[4]);

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
  

  
  GLOBAL.LEVEL.entrances = settings[5].split(',').map(x => x.split('\'').map(y => parseInt(y)));
  GLOBAL.LEVEL.entrances.splice(0, 0, [player.x, player.y]);
  if (Number.isNaN(GLOBAL.LEVEL.entrances[GLOBAL.LEVEL.entrances.length - 1][0])) 
  {
    GLOBAL.LEVEL.entrances.pop();
  }

  player.equip(GLOBAL.WEAPONS[0]);
  player.equip(GLOBAL.WEAPONS[1]);
  player.x = GLOBAL.LEVEL.entrances[entrance][0];
  player.y = GLOBAL.LEVEL.entrances[entrance][1];
  new SlideTransition(0, false, 0);

  loadTileMap(tiles);
  graphics.loadTexture(GLOBAL.LEVEL.tilemap, 'tilemap');
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
  return new Sprite(graphics.textures.bgsheet, GLOBAL.LEVEL.bg.width, GLOBAL.LEVEL.bg.height * index, 360, 240);
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

function saveGame(index)
{
  console.log('test');
  localStorage['save'+index] = JSON.stringify(
    {
      level: GLOBAL.LEVELINDEX,
      x: player.x,
      y: player.y,
      hp: player.hp,
      vx: player.vx,
      vy: player.vy
    }
  );
}

function loadGame(index)
{
  let data = JSON.parse(localStorage['save'+index]);
  loadLevel(GLOBAL.LEVELS[data.level]);
  player.x = data.x,
  player.y = data.y,
  player.hp = data.hp,
  player.vx = data.vx,
  player.vy = data.vy;
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
  GLOBAL.LEVELS = [`#000000|#AA11FF|460|240|-1|90'-200|---|0,64,144|1|2,0,0,16,240,1|2,16,224,320,16,1|2,16,0,336,16,1|2,320,16,16,128,1|2,0,-96,336,176,1|2,448,-112,16,352,1|11,352,224,80,16|2,320,240,144,16,1|2,432,0,16,16,1|13,48,207|2,160,176,16,16,1|2,336,-80,112,16|---|1,16,224,304,16|2,320,224|5,0,80,16,144|4,0,224|7,16,64,304,16|4,0,0,320,64|4,320,0|4,448,0|6,432,0|8,336,0|5,320,16,16,128|3,448,16,16,224|0,352,224|2,416,224|1,368,224,48,16|4,0,64|`,`#000000|#7d0239|360|240|1|---|0,176,304|1|2,-16,208,144,144,1|2,0,0,16,224,1|2,352,0,16,224,1|2,-16,-192,144,208,1|2,240,208,144,144,1|2,240,-192,144,208,1|2,112,352,144,16,1|2,112,-192,144,16,1|2,144,336,80,16,1|2,224,0,16,16,1|2,128,0,16,16,1|---|0,240,208|2,112,208|1,16,208,96,16|1,256,208,96,16|5,128,0|3,224,0,16,16|7,240,0,112,16|7,16,0,112,16|3,352,16,16,192|5,0,16,16,192|4,352,208|4,352,0|4,0,0|4,-16,224,128,128|4,0,208,16,16|4,-128,224|3,240,224,16,112|5,112,224,16,128|4,256,224,112,112|`,`0,1,0|#6A00FF|360|240|0|---|0,20,90|1|7,290,30,16,128|2,0,144,32,128|2,0,0,32,80|2,304,176,80,128|2,304,-48,80,112|2,32,64,16,16|2,32,144,16,16|8,400,70,40,120|---|9,0,140|`,`1,1,0|#AA11FF|360|240|1|---|0,32,32|1|2,0,0,368,16|2,0,224,368,48|2,-16,16,16,208|2,352,16,16,128|8,352,120,300,120|12,352,120,16,96|---|18,0,0,120,240|19,120,0,140,240|20,240,0,120,240|`,`1,1,0|#6A00FF|820|240|1|---|0,96,128|1|2,0,208,592,144|2,0,0,784,32|2,576,32,16,32|2,784,0,112,352|2,608,208,160,16|2,-16,16,16,208|---||`,`#000021|#000011|1280|720|0|---|0,368,224|1|2,240,256,272,192,1|6,368,130,0|---|1,256,256,240,16|0,240,256|2,496,256|5,496,272,16,176|3,240,272,16,176|4,256,272,240,176|`];

  spritesheet.onload = incLoader();
  bgsheet.onload = incLoader();
  playersheet.onload = incLoader();
  enemysheet.onload = incLoader();
  tilesheet.onload = incLoader();

  console.log(GLOBAL.LEVELS);
})();
