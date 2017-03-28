/*
 * libs/Tabs.js
 */

/**
 * Tabs
 *
 * @class
 * @classdesc タブアニメーションクラス
 */
export default class Tabs {

  /**
   * タブインスタンスを返却
   *
   * @constructor
   * @param {Object} canvas キャンバス
   */
  constructor(canvas) {
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
      onRemove: () => {},
    };

    this.init();
  }

  /**
   * 表示
   *
   * @public
   * @param {number} number タブ数
   */
  show(number) {
    this.destroyAll();
    this.add(number);
  }

  /**
   * 指定されたタブを削除
   *
   * @public
   * @param {number} align 方向
   * @param {function(Object)} onRemove リムーブイベントハンドラ
   */
  removeAll(align, onRemove) {
    align = align || this.REMOVE.LEFT_TO_RIGHT;
    this.callbacks.onRemove = onRemove;

    this.removeTargetTabLength = this.stage.children.length;
    this.removed = 0;

    this.stage.children.forEach((tab, i) => {
      let time = this.REMOVE.LEFT_TO_RIGHT === align
        ? i
        : this.stage.children.length - i;

      createjs.Tween.get(tab)
        .wait(time * 100)
        .set({
          regX: Math.floor(this.tabWidth / 2),
          regY: Math.floor(this.tabHeight / 2),
        })
        .to({
          alpha: 0.0,
          rotation: this.getRandomRotation(),
          scaleX: 0,
          scaleY: 0,
          x: this.getRandomX(),
          y: this.getRandomY(),
        }, this.getRandomInt(500, 1000), createjs.Ease.cubicOut)
        .call(this.onRemove.bind(this), [tab]);
    });
  }

  /**
   * 初期化
   *
   * @private
   */
  init() {
    this.width = this.canvas.clientWidth - (this.PADDING * 2);
    this.height = this.canvas.clientHeight - (this.PADDING * 2);

    this.stage = new createjs.Stage(this.canvas);

    createjs.Ticker.setFPS(60);
    createjs.Ticker.addEventListener('tick', this.stage);
  }

  /**
   * タブインスタンスを返却
   *
   * @private
   * @param {number} width 幅
   * @param {number} height 高さ
   * @return {Object} タブインスタンス
   */
  getTabInstance(width, height) {
    let tab = new createjs.Container();

    tab.shadow = new createjs.Shadow('#fff', 0, 0, 2);

    let round = Math.floor(width / 10);

    let g = new createjs.Graphics();
    g.beginFill('#ffffff')
      .drawRoundRectComplex(0, 0, width, height, round, round, 2, 2)
      .endFill();

    let s = new createjs.Shape(g);
    tab.addChild(s);

    return tab;
  }

  /**
   * 指定された数のタブを追加
   *
   * @private
   * @param {number} number タブ数
   */
  add(number) {
    this.tabWidth = 150 - (this.PADDING / 2);
    this.tabHeight = 50 - (this.PADDING / 2);

    let tabX = Math.floor(this.width / 2)
      - Math.floor(this.tabWidth / 2)
      + this.PADDING;

    let tabY = Math.floor(this.height / 2)
      - Math.floor(this.tabHeight / 2)
      + this.PADDING;

    for (let i = number - 1; i >= 0; i--) {
      let tab = this.getTabInstance(this.tabWidth, this.tabHeight);
      tab.x = tabX;
      tab.y = tabY;
      this.stage.addChild(tab);
    }
  }

  /**
   * リムーブイベントハンドラ
   *
   * @private
   * @param {Object} tab タブオブジェクト
   */
  onRemove(tab) {
    this.destroy(tab);
    this.removed++;

    if (this.callbacks.onRemove
      && this.removeTargetTabLength === this.removed
    ) {
      this.callbacks.onRemove(this.removed);
    }
  }

  /**
   * 指定されたタブを削除
   *
   * @private
   * @param {Object} tab タブオブジェクト
   */
  destroy(tab) {
    this.stage.removeChild(tab);
  }

  /**
   * 全てのタブを削除
   *
   * @private
   */
  destroyAll() {
    this.stage.children.forEach((tab) => {
      this.destroy(tab);
    });
  }

  /**
   * min から max までの乱数を返却
   *
   * @private
   * @param {number} min 最小値
   * @param {number} max 最大値
   * @return {number} 乱数
   */
  getRandomInt(min, max) {
    return Math.floor( Math.random() * (max - min + 1) ) + min;
  }

  /**
   * ランダムな角度を取得
   *
   * @private
   * @return {number} 角度
   */
  getRandomRotation() {
    return this.getRandomInt(520, 2160);
  }

  /**
   * ランダムなX値を取得
   *
   * @private
   * @return {number} X値
   */
  getRandomX() {
    return this.getRandomInt(0, this.width);
  }

  /**
   * ランダムなY値を取得
   *
   * @private
   * @return {number} Y値
   */
  getRandomY() {
    return this.getRandomInt(0, this.height);
  }
}
