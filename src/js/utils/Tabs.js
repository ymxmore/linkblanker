/**
 * utils/Tabs.js
 */

/**
 * Tabs active instance.
 */
var _this;

/**
 * Constructor
 */
function Tabs (canvas) {
  this.PADDING = 5;
  this.REMOVE = {
    LEFT_TO_RIGHT: 1,
    RIGHT_TO_LEFT: 2,
  };

  this.canvas = canvas;
  this.stage = null;
  this.width = 0;
  this.height = 0;
  this.tabWidth = 0;
  this.tabHeight = 0;
  this.removeTargetTabLength = 0;
  this.removed = 0;
  this.callbacks = {
    onRemove: function () {}
  };

  initialize.apply(this);
}

function initialize () {
  _this = this;

  _this.width = _this.canvas.clientWidth - (_this.PADDING * 2);
  _this.height = _this.canvas.clientHeight - (_this.PADDING * 2);

  _this.stage = new createjs.Stage(_this.canvas);

  createjs.Ticker.setFPS(60);
  createjs.Ticker.addEventListener('tick', _this.stage);
}

function getTabInstance (width, height) {
  var tab = new createjs.Container();

  tab.shadow = new createjs.Shadow('#fff', 0, 0, 2);

  var round = Math.floor(width / 10);

  var g = new createjs.Graphics();
  g.beginFill('#ffffff')
    .drawRoundRectComplex(0, 0, width, height, round, round, 2, 2)
    .endFill();

  var s = new createjs.Shape(g);
  tab.addChild(s);

  return tab;
}

Tabs.prototype.show = function (number) {
  _this.destroyAll();
  _this.add(number);
};

Tabs.prototype.add = function (number) {
  this.tabWidth = 150 - (this.PADDING / 2);
  this.tabHeight = 50 - (this.PADDING / 2);

  var tabX = Math.floor(this.width / 2) - Math.floor(this.tabWidth / 2) + this.PADDING;
  var tabY = Math.floor(this.height / 2) - Math.floor(this.tabHeight / 2) + this.PADDING;

  for (var i = number - 1; i >= 0; i--) {
    var tab = getTabInstance(this.tabWidth, this.tabHeight);
    tab.x = tabX;
    tab.y = tabY;
    this.stage.addChild(tab);
  }
};

Tabs.prototype.removeAll = function (align, onRemove) {
  align = align || _this.REMOVE.LEFT_TO_RIGHT;
  this.callbacks.onRemove = onRemove;

  this.removeTargetTabLength = this.stage.children.length;
  this.removed = 0;

  this.stage.children.forEach(function (tab, i) {
    var time = _this.REMOVE.LEFT_TO_RIGHT === align ? i : _this.stage.children.length - i;

    createjs.Tween.get(tab)
      .wait(time * 100)
      .set({
        regX: Math.floor(_this.tabWidth / 2),
        regY: Math.floor(_this.tabHeight / 2)
      })
      .to({
        alpha: 0.0,
        rotation: _this.getRandomRotation(),
        scaleX: 0,
        scaleY: 0,
        x: _this.getRandomX(),
        y: _this.getRandomY()
      }, _this.getRandomInt(500, 1000), createjs.Ease.cubicOut)
      .call(_this.onRemove.bind(_this), [tab]);
  });
};

Tabs.prototype.onRemove = function (tab) {
  this.destroy(tab);
  this.removed++;

  if (this.callbacks.onRemove && this.removeTargetTabLength === this.removed) {
    this.callbacks.onRemove(this.removed);
  }
};

Tabs.prototype.destroy = function (tab) {
  this.stage.removeChild(tab);
};

Tabs.prototype.destroyAll = function (tab) {
  this.stage.children.forEach(function (tab) {
    _this.destroy(tab);
  });
};

// min から max までの乱整数を返す関数
Tabs.prototype.getRandomInt = function (min, max) {
  return Math.floor( Math.random() * (max - min + 1) ) + min;
};

Tabs.prototype.getRandomRotation = function () {
  return this.getRandomInt(520, 2160);
};

Tabs.prototype.getRandomX = function () {
  return this.getRandomInt(0, _this.width);
};

Tabs.prototype.getRandomY = function () {
  return this.getRandomInt(0, _this.height);
};

/**
 * Export the constructor.
 */
module.exports = Tabs;
