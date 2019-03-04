phina.globalize();

/**
 * TODO
 *   重すぎてスマホでうごかせない
 * 
 * 　新機能
 * 　　マップ上での話す、チェック、グッズ、PSIの実装
 * 　　回復の実装
 * 　　戦闘の会話送り
 * 　　装備の実装
 * 　
 * 　微調整
 *     敵のランダム（ガチャと同じ感じにして、フィールドによって出る敵を管理する）
 * 
 *   考察
 * 　　マップの移動後の位置はもっと最適かしたい。（マップを変えるとずれる）
 */

//-------------------------
// 設定
//-------------------------
var
PLAYER_SPEED    =  5,
FPS             = 60,
BOX_WIDTH       = 32,
BOX_HEIGHT      = 32,
COLUMNS_COUNT_X = 20,
COLUMNS_COUNT_Y = 30,

DIRECTION = {
  UP   : 0,
  RIGHT: 1,
  DOWN : 2,
  LEFT : 3,
},

ASSETS = {
  image: {
    'player': '/mother/images/player.png',
  },
};

//-------------------------
// タイトルシーン
//-------------------------
phina.define('TitleScene', {
  superClass: 'DisplayScene',
  
  /**
   * コンストラクタ
   */
  init: function(options) {
    this.superInit(options);
    var title = Label({
      text: 'MOTHER',
      x: 320,
      y: 400,
    }).addChildTo(this);
    
    // データ初期化
    tmpDate.playerInfo = null;
    tmpDate.nextMapLabel = null;
    tmpDate.nowMapLabel = null;
    tmpDate.layer1 = null;
    tmpDate.layer2 = null;
    tmpDate.mapMoveDate = null;
  },
  onclick: function() {
    this.exit('MapScene');
  }
});

//-------------------------
// マップシーン
//-------------------------
phina.define('MapScene', {
  superClass: 'DisplayScene',

  /**
   * コンストラクタ
   */
  init: function(options) {
    this.superInit(options);
    
    //背景色
    this.backgroundColor = '#aaa';
    
    //X軸のグリッドを作成
    this.stageX = Grid({
      width  : this.gridX.width,
      columns: COLUMNS_COUNT_X,
      offset : BOX_WIDTH / 2,
    });
    
    //Y軸のグリッドを作成
    this.stageY = Grid({
      width  : this.gridY.width,
      columns: COLUMNS_COUNT_Y,
      offset : BOX_WIDTH / 2,
    });
    
    //ステージ生成
    this.setStage();
    
    //敵が出るフラグ
    this.isEnemy = true;
    if (tmpDate.nowMapLabel === 'shop') {
      this.isEnemy = false;
    }
    
    //タッチポイント
    this.touchPointX = null;
    this.touchPointY = null;
    this.touchCircle = null;
  },
  
  /**
   * ステージ作成
   */
  setStage: function() {
    var stageX = this.stageX;
    var stageY = this.stageY;
    
    //マップのレイヤー
    var layer2 = DisplayElement().addChildTo(this);//当たり判定のあるもの

    //他の画面から来た時用にシェードを用意
    this.offShade();
    
    //プレイヤー生成
    var player = Player().addChildTo(this);
    
    //マップデータ上のプレイヤーの初期位置の保存用変数
    var mapPlayerPosition = {x: null, y: null};
    
    //表示するマップのラベルを準備
    var stage = STAGE.main;
    tmpDate.nowMapLabel = 'main';
    if (tmpDate.mapMoveDate != null) {
      //遷移後のマップラベルがあればそれを表示
      stage = STAGE[tmpDate.mapMoveDate.nextMapLabel];
      tmpDate.nowMapLabel = tmpDate.mapMoveDate.nextMapLabel;
      mapPlayerPosition.x = tmpDate.mapMoveDate.x;
      mapPlayerPosition.y = tmpDate.mapMoveDate.y;
    }
    
    if (tmpDate.layer2 != null) {
      //マップの位置データがあった場合はそれを使う
      layer2.children = tmpDate.layer2;
    } else {
      //ステージ情報を元にマップチップを配置
      for (var i = 0; i < stage.length; i += 1) {
        for (var j = 0; j < stage[i].length; j +=1) {
          var item = stage[i][j];
          
          if (item === 1) {
            //1に壁
            WallBlock().addChildTo(layer2).setPosition(stageX.span(j), stageY.span(i));
          }
          if (item === 2) {
            BlackBox().addChildTo(layer2).setPosition(stageX.span(j), stageY.span(i));
          }
          if (item === 5) {
            //5にメインフィールドへの移動ブロック
            MoveBlock(mapMoveDate.caveEntry).addChildTo(layer2).setPosition(stageX.span(j), stageY.span(i));
          }
          if (item === 6) {
            //6に洞窟への移動ブロック
            MoveBlock(mapMoveDate.caveExit).addChildTo(layer2).setPosition(stageX.span(j), stageY.span(i));
          }
          if (item === 7) {
            //7にメインフィールドへの移動ブロック
            MoveBlock(mapMoveDate.shopEntry).addChildTo(layer2).setPosition(stageX.span(j), stageY.span(i));
          }
          if (item === 8) {
            //8にショップへの移動ブロック
            MoveBlock(mapMoveDate.shopExit).addChildTo(layer2).setPosition(stageX.span(j), stageY.span(i));
          }
          if (mapPlayerPosition.x == null && mapPlayerPosition.y == null) {
            if (item === 9) {
              //9はマップ上の主人公の位置なので保存する
              mapPlayerPosition.x = stageX.span(j);
              mapPlayerPosition.y = stageY.span(i);
            }
          }
        }
      }
      
      //マップデータ上の９だった場所が中心になるようにマップを移動
      layer2.children.each(function(block) {
        block.x += stageX.span(COLUMNS_COUNT_X / 2) - mapPlayerPosition.x;
        block.y += stageY.span(COLUMNS_COUNT_Y / 2) - mapPlayerPosition.y;
      });
      this.mapPlayerPosition = mapPlayerPosition;
    }
  
    if (tmpDate.playerInfo !== null) {
      //プレイヤーの向きデータが保存されていた向きを調整
      player.direction = tmpDate.playerInfo.direction;
    }
    
    //プレイヤーはいつだって真ん中
    player.setPosition(stageX.span(COLUMNS_COUNT_X / 2), stageY.span(COLUMNS_COUNT_Y / 2));
    
    //この画面に来る前のデータがあった場合は初期化
    tmpDate.playerInfo = null;
    tmpDate.nextMapLabel = null;
    tmpDate.layer2 = null;
    
    //クラス内で参照できるようにする
    this.player = player;
    this.layer2 = layer2;
  },
  
  /**
   * x軸のあたり判定
   */
  collisionX: function() {
    var player = this.player;
    
    if (player.vx == 0) {
        return;
    }
    
    var newx = player.left + player.vx;
    var rect = Rect(newx, player.top, player.width, player.height);
    var hit = false;
    
    //ブロックとの衝突判定
    this.layer2.children.some(function(block) {
      if (Collision.testRectRect(block, rect)) {
        if (block.className === 'MoveBlock') {
          //画面遷移ブロックに当たったら遷移後のマップラベルを保存し、
          //画面を遷移する
          this.update = null;
          tmpDate.mapMoveDate = block.mapMoveDate;
          this.nextScene('MapScene');
        }
        if (player.vx > 0) {
          //右に移動中に衝突
          player.right = block.left;
          player.vx = 0;
        } else {
          //左に移動中に衝突
          if (player.vx < 0) {
            player.left = block.right;
            player.vx = 0;
          }
        }
        hit = true;
      }
    }.bind(this));
    if (!hit) {
      //マップチップを動かす
      this.layer2.children.each(function(block) {
        block.x += -this.player.vx;
      }, this);
    }
  },
  
  /**
   * y軸のあたり判定
   */
  collisionY: function() {
    var player = this.player;
    
    if (player.vy == 0) {
        return;
    }
    
    var newy = player.top + player.vy;
    var rect = Rect(player.left, newy, player.width, player.height);
    var hit = false;
    
    //ブロックとの衝突判定
    this.layer2.children.some(function(block) {
      if (Collision.testRectRect(block, rect)) {
        if (block.className === 'MoveBlock') {
          //画面遷移ブロックに当たったら遷移後のマップラベルを保存し、
          //画面を遷移する
          this.update = null;
          tmpDate.mapMoveDate = block.mapMoveDate;
          this.nextScene('MapScene');
        }
        if (player.vy > 0) {
          //上に移動中に衝突
          player.bottom = block.top;
          player.vy = 0;
        } else {
          if (player.vy < 0) {
            //下に移動中に衝突
            player.top = block.bottom;
            player.vy = 0;
          }
        }
        hit = true;
      }
    }.bind(this));
    if (!hit) {
      //マップチップを動かす
      this.layer2.children.each(function(block) {
        block.y += -this.player.vy;
      }, this);
    }
  },
  
  /**
   * プライヤーの動作
   */
  movePlayer: function(app) {
    var player = this.player;
    var key = app.keyboard;
    
    var isXMove = false;
    var isYMove = false;
    
    //上下
    if (key.getKey('up')) {
      if (player.direction !== DIRECTION.UP) {
        player.isMoveStart = false;
      }
      
      player.vy = -PLAYER_SPEED;
      player.direction = DIRECTION.UP;
      player.isMove = true;
      isYMove = true;
      
    } else if (key.getKey('down')) {
      if (player.direction !== DIRECTION.DOWN) {
        player.isMoveStart = false;
      }
      
      player.vy = PLAYER_SPEED;
      player.direction = DIRECTION.DOWN;
      player.isMove = true;
      isYMove = true;
      
    } else {
      player.vy = 0;
    }
    
    //左右
    if (key.getKey('left')) {
      player.vx = -PLAYER_SPEED;
      player.isMove = true;
      isXMove = true;
      
      if (!isYMove) {
        if (player.direction !== DIRECTION.LEFT) {
          player.isMoveStart = false;
          player.direction = DIRECTION.LEFT
        }
      }
      
    } else if (key.getKey('right')) {
      player.vx = PLAYER_SPEED;
      player.isMove = true;
      isXMove = true;
      
      if (!isYMove) {
        if (player.direction !== DIRECTION.RIGHT) {
          player.isMoveStart = false;
          player.direction = DIRECTION.RIGHT;
        }
      }
      
    } else {
      player.vx = 0;
    }
    
    
        //タッチを取得して保存
    var p = app.pointer;
    if (p.getPointingStart()) {
      this.touchPointX = p.x;
      this.touchPointY = p.y;
      this.touchMark(p.x, p.y);
    }
    
    if (p.getPointingEnd()) {
      this.touchPointX = null;
      this.touchPointY = null;
      if (this.touchCircle != null) {
        this.touchCircle.remove();
      }
    }
    
    if (this.touchPointX != null && this.touchPointY != null) {
      var OFFSET = 30;
      if (this.touchPointY - OFFSET > p.y) {
        if (player.direction !== DIRECTION.UP) {
          player.isMoveStart = false;
        }
        
        player.vy = -PLAYER_SPEED;
        player.direction = DIRECTION.UP;
        player.isMove = true;
        isYMove = true;
      } else if (this.touchPointY + OFFSET < p.y) {
        if (player.direction !== DIRECTION.DOWN) {
          player.isMoveStart = false;
        }
        
        player.vy = PLAYER_SPEED;
        player.direction = DIRECTION.DOWN;
        player.isMove = true;
        isYMove = true;
      } else {
        player.vy = 0;
      }
      
      if (this.touchPointX - OFFSET > p.x) {
        player.vx = -PLAYER_SPEED;
        player.isMove = true;
        isXMove = true;
        
        if (!isYMove) {
          if (player.direction !== DIRECTION.LEFT) {
            player.isMoveStart = false;
            player.direction = DIRECTION.LEFT
          }
        }
      } else if (this.touchPointX + OFFSET < p.x) {
        player.vx = PLAYER_SPEED;
        player.isMove = true;
        isXMove = true;
        
        if (!isYMove) {
          if (player.direction !== DIRECTION.RIGHT) {
            player.isMoveStart = false;
            player.direction = DIRECTION.RIGHT;
          }
        }
      } else {
        player.xy = 0;
      }
    }
    
    if (player.vx === 0 && player.vy === 0) {
      player.isMove = false;
      player.isMoveStart = false;
    }
    
    if (key.getKeyDown('b')) {
      this.plungeButtle();
    }
    if (key.getKeyDown('s')) {
      //ステータスを確認
      this.nextScene('TitleScene')
    }
  },
  
  touchMark: function(x, y) {
    this.touchCircle = CircleShape({
      fill: '#fff',
      stroke: 0,
      radius: 50,
      alpha : 0.2,
    }).addChildTo(this);
    this.touchCircle.x = x;
    this.touchCircle.y = y;
    
    this.touchCircle.tweener
    .to({
      alpha: 0.2,
    }, 100)
    .to({
      alpha: 0.5,
    }, 100)
    .setLoop(true);
    
    this.touchCircle.tweener
    .to({
      radius: 45,
    }, 200)
    .to({
      radius: 50,
    }, 200)
    .setLoop(true);
  },
  
  /**
   * 引数のラベルの画面へ遷移
   */
  nextScene: function(nextLabel) {
    var self = this;
    
    //動き方を決める
    var easing = 'easeOutExpo';
    if (nextLabel === 'ButtleScene') {
      easing = 'easeInOutBounce';
    }

    //シェードを開いた後に画面遷移
    this.onShade(function() {
      self.exit(nextLabel);
    }, easing);
  },
  
  /**
   * シェードが開く
   */
  onShade: function(collback, easing) {
    var circle = CircleShape({
      fill: '#000',
      stroke: 0,
      radius: 1,
    }).addChildTo(this);
    circle.x = this.stageX.center() + 15;
    circle.y = this.stageY.center();
    
    circle.tweener
    .by({
      radius: 600
    }, 400, easing)
    .call(function() {
      if (typeof collback === 'function') {
        collback();
      }
    });
  },
  
  /**
   * シェードが閉じる
   */
  offShade: function() {
    var circle = CircleShape({
      fill: '#000',
      stroke: 0,
      radius: 600,
    }).addChildTo(this);
    circle.x = this.stageX.center() + 15;//微調整
    circle.y = this.stageY.center();
    
    circle.tweener
    .to({
      radius: 1
    }, 600, 'easeOutExpo')
    .call(function() {
     this.remove();
    });
  },
  
  /**
   * ランダムでバトルに突入
   */
  randomButtle: function() {
    var r = Random.randint(1, 400);
    if (r === 400) {
      this.plungeButtle();
    }
  },
  
  /**
   * バトル突入
   */
   plungeButtle: function() {
    //更新を止める
    this.update = null;
      
    //バトル後に戻って来る情報を保存
    tmpDate.playerInfo = this.player;
    tmpDate.layer2 = this.layer2.children;
    
    //バトル画面に遷移
    this.nextScene('ButtleScene');
   },
  
  /**
   * 更新
   */
  update: function(app) {
    //キャラクターの動作
    this.movePlayer(app);
    
    //y軸のあたり判定
    this.collisionY();
    
    //x軸のあたり判定
    this.collisionX();
    
    if (this.player.isMove && this.isEnemy) {
      //移動中は一定の確率でバトルに突入
      this.randomButtle();
    }
  }
});

//-------------------------
// 戦闘シーン
//-------------------------
phina.define('ButtleScene', {
  superClass: 'DisplayScene',
  
  /**
   * コンストラクタ
   */
  init: function() {
    this.superInit();
    
    //背景
    this.backgroundColor = '#000';
    
    //X軸のグリッドを作成
    var stageX = Grid({
      width  : this.gridX.width,
      columns: 20,
      offset : BOX_WIDTH / 2,
    });
    this.stageX = stageX;
    
    //Y軸のグリッドを作成
    var stageY = Grid({
      width  : this.gridY.width,
      columns: 30,
      offset : BOX_WIDTH / 2,
    });
    this.stageY = stageY;
    
    //フェーズ管理
    this.isCommondPhase = true;
    this.isButtlePhase = false;
    this.isResultPhase = false;
    
    //プレイヤー情報読み込み
    this.playerDate = playerDate;
    
    //ランダムで敵情報読み込み
    this.enemyDate = copyArray(enemyDate['enemy'+Random.randint(1, 2)]);
    
    //敵を表示
    this.enemy = RectangleShape({
      width: 80,
      height: 80,
      fill: this.enemyDate.color,
      stroke: null,
      x: stageX.center(),
      y: stageY.center(),
      cornerRadius: 2,
    }).addChildTo(this);
    
    //上のダイアログ
    this.msgBox = RectangleShape({
      width: this.gridX.width - 40,
      height: 250,
      fill: '#000',
      stroke: "#fff",
      strokeWidth: 30,
      x: stageX.center(),
      y: 145,
      cornerRadius: 2,
    }).addChildTo(this);
    
    var message = Label({
      fill: '#fff',
      x: 0,
      y: 0,
    }).addChildTo(this.msgBox);
    this.message = message;
    this.updateButtleComment(this.enemyDate.name + 'が現れた！');
    
    //ステータスダイアログ
    this.statusBox = RectangleShape({
      width: this.gridX.width - 40,
      height: 50,
      fill: '#000',
      stroke: "#fff",
      strokeWidth: 30,
      x: stageX.center(),
      y: stageY.center() + 220,
      cornerRadius: 2,
    }).addChildTo(this);
    
    var name = Label({
      text: 'プレイヤー',
      fill: '#fff',
      align: 'left',
      x: -285,
      y: 0,
    }).addChildTo(this.statusBox);
    
    var hpLabel = Label({
      text: 'HP',
      fill: '#fff',
      align: 'left',
      x: -30,
      y: 0,
    }).addChildTo(this.statusBox);
    
    var hp = Label({
      text: this.playerDate.hp[0],
      fill: '#fff',
      align: 'right',
      x: 100,
      y: 0,
    }).addChildTo(this.statusBox);
    this.hp = hp;
    
    var ppLabel = Label({
      text: 'PP',
      fill: '#fff',
      align: 'left',
      x: 150,
      y: 0,
    }).addChildTo(this.statusBox);
    
    var pp = Label({
      text: this.playerDate.pp[0],
      fill: '#fff',
      align: 'right',
      x: 290,
      y: 0,
    }).addChildTo(this.statusBox);
    
    //下のボタン
    this.buttleBtn = RectangleShape({
      width: this.gridX.width - 40,
      height: 185,
      fill: '#000',
      stroke: "#fff",
      strokeWidth: 30,
      x: stageX.center(),
      y: stageY.center() + 365,
      cornerRadius: 2,
    }).addChildTo(this);
    this.buttleBtn.setInteractive(true);
    this.buttleBtn.blendMode = "source-atop";
    
    var label3 = Label({
      text: 'たたかう',
      fill: '#fff',
      x: 0,
      y: 0,
    }).addChildTo(this.buttleBtn);
  },
  
  /**
   * 敵ダメージアニメーション
   */
  enemyDamageAnime: function(self, collback) {
    self.tweener
    .clear()
    .by({alpha: -1}, 20)
    .by({alpha: 1}, 20)
    .by({x:10}, 50)
    .by({alpha: -1}, 20)
    .by({alpha: 1}, 20)
    .by({x:-10}, 50)
    .by({alpha: -1}, 20)
    .by({alpha: 1}, 20)
    .by({x:10}, 50)
    .by({alpha: -1}, 20)
    .to({alpha: 1}, 20)
    .to({
      x: this.stageX.center(),
    }, 50)
    .call(function() {
      if (typeof collback === 'function') {
        collback();
      }
    });
  },
  
  /**
   * 主人公ダメージアニメーション
   */
  playerDamageAnime: function(self, collback) {
    self.tweener
    .clear()
    .by({alpha: -1}, 20)
    .by({alpha: 1}, 20)
    .by({x:10}, 50)
    .by({alpha: -1}, 20)
    .by({alpha: 1}, 20)
    .by({x:-10}, 50)
    .by({alpha: -1}, 20)
    .by({alpha: 1}, 20)
    .by({x:10}, 50)
    .by({alpha: -1}, 20)
    .to({alpha: 1}, 20)
    .to({
      x: this.stageX.center(),
    }, 50)
    .call(function() {
      if (typeof collback === 'function') {
        collback();
      }
    });
  },
  
  /**
   * コマンドフェーズ
   */
  commondPhase: function(app) {
    var p = app.pointer;
    
    this.buttleBtn.on('click', function() {
      if (this.isCommondPhase) {
        this.pointCircle(this.buttleBtn, p.x, p.y);
        this.isCommondPhase = false;
        this.isButtlePhase = true;
      }
    }.bind(this));
  },
  
  /**
   * バトルフェーズ
   */
  buttlePhase: function() {
    this.isButtlePhase = false;
    var self = this;
    
    if (self.playerDate.spd[0] > self.enemyDate.spd[0]) {
      //主人公の方が早い場合
      self.playerOfe().then(function() {
        setTimeout(function() {
          if (self.enemyDate.hp[0] <= 0) {
            self.enemy.remove();
            self.isCommondPhase = false;
            self.isButtlePhase = false;
            self.isResultPhase = true;
            return;
          }
          self.enemyOfe().then(function() {
          if (self.playerDate.hp[0] <= 0) {
            self.isCommondPhase = false;
            self.isButtlePhase = false;
            self.isResultPhase = true;
            return;
          }
            self.updateButtleComment('コマンドを入力してください');
            self.isCommondPhase = true;
            self.isButtlePhase = false;
            self.isResultPhase = false;
          });
        }, 400);
      });
    } else {
      //相手の方が早い場合
      self.enemyOfe().then(function() {
        setTimeout(function() {
          if (self.playerDate.hp[0] <= 0) {
            self.isCommondPhase = false;
            self.isButtlePhase = false;
            self.isResultPhase = true;
            return;
          }
          self.playerOfe().then(function() {
            if (self.enemyDate.hp[0] <= 0) {
              self.enemy.remove();
              self.isCommondPhase = false;
              self.isButtlePhase = false;
              self.isResultPhase = true;
              return;
            }
            self.updateButtleComment('コマンドを入力してください');
            self.isCommondPhase = true;
            self.isButtlePhase = false;
            self.isResultPhase = false;
          });
        }, 400);
      });
    }
  },
  
  /**
   * リザルトフェーズ
   */
  resultPhase: function() {
    var self = this;
    
    //更新を止める
    self.update = null;
    
    var isWinPlayer = false;
    if (self.playerDate.hp[0] <= 0) {
      self.updateButtleComment('戦いに敗れた......');
    } else {
      self.updateButtleComment('戦いに勝利した！');
      isWinPlayer = true;
    }
    
    if (isWinPlayer) {
      //勝った場合は経験値を取得
      playerDate.exp += self.enemyDate.exp;
      self.addButtleComment('\n' + self.enemyDate.exp + 'の経験値を手に入れた！')
    }
    
    self.on('click', function() {
      var nextScene = 'MapScene';
      if (!isWinPlayer) {
        //負けた場合はタイトルへ
        nextScene = 'TitleScene';
      }
      self.exit({nextLabel: nextScene});
    });
  },
  
  /**
   * プレイヤーの攻撃
   */
  playerOfe: function() {
    var self = this;
    self.updateButtleComment('プレイヤーの攻撃！');
    return new Promise(function(resolve, reject) {
      setTimeout(function() {
        var damage = self.enemyDate.def[0] - self.playerDate.ofe[0];
        if (damage >= 0) {
          self.addButtleComment('\nダメージを与えられない！');
          resolve();
        } else {
          self.enemyDamageAnime(self.enemy, function(){
            self.enemyDate.hp[0] += damage;
            self.addButtleComment('\n相手に' + Math.abs(damage) + 'のダメージを与えた！');
            setTimeout(function() {
              resolve();
            }, 500);
          });
        }
      }, 500);
    });
  },
  
  /**
   * 敵の攻撃
   */
  enemyOfe: function() {
    var self = this;
    self.updateButtleComment('相手の攻撃！');
    return new Promise(function(resolve, reject) {
      setTimeout(function() {
        var damage = self.playerDate.def[0] - self.enemyDate.ofe[0];
        if (damage >= 0) {
          self.addButtleComment('\nダメージを受けなかった！');
          resolve();
        } else {
          self.playerDamageAnime(self.statusBox);
          self.playerDamageAnime(self.buttleBtn);
          self.playerDamageAnime(self.msgBox, function(){
            self.playerDate.hp[0] += damage;
            self.hp.text = self.playerDate.hp[0];
            self.addButtleComment('\n主人公に' + Math.abs(damage) + 'のダメージ！');
            setTimeout(function() {
              resolve();
            }, 500);
          });
        }
      }, 500);
    });
  },
  
  /**
   * コメント更新
   */
  updateButtleComment: function(text) {
    this.message.alpha = 0;
    this.message.x = 0;
    this.message.y = 20;
    
    this.message.text = text;
    
    this.message.tweener
    .clear()
    .to({
      y: 0,
      alpha: 1,
    }, 300);
  },
  
  /**
   * コメント追加
   */
  addButtleComment: function(text) {
    this.message.text += text;
  },
  
  pointCircle: function(self, x, y) {
    var circle = CircleShape({
      fill  : '#fff',
      stroke: 0,
      radius: 100,
    }).addChildTo(self);
    circle.alpha = 0.5;
    circle.x = 0;
    circle.y = 0;
    circle.renderChildBySelf = true;
    circle.blendMode = "source-atop";
    
    circle.tweener
    .to({
      radius: 400,
      alpha : 0,
    }, 300)
    .call(function() {
      circle.remove();
    });
  },
  
  update: function(app) {
    if (this.isCommondPhase) {
      this.commondPhase(app);
    }
    
    if (this.isButtlePhase) {
      this.buttlePhase();
    }
    
    if (this.isResultPhase) {
      this.resultPhase();
    }
   }
});

//-------------------------
// プレイヤークラス
//-------------------------
phina.define('Player', {
  superClass: 'RectangleShape',
  
  /**
   * 初期化 
   */
  init: function() {
    this.superInit({
      width : BOX_WIDTH * 0.5,//ちょっとだけ小さめに
      height: BOX_HEIGHT * 0.5,//ちょっとだけ小さめに
      fill  : 'red',
      stroke: null,
    });
    
    //キャラクターへのタッチを許可
    this.setInteractive(true);
    
    //プレイヤー画像
    this.playerImg = Sprite('player', 16, 16).addChildTo(this);
    this.playerImg.setScale(4);
    this.playerImg.x = 0;
    this.playerImg.y = -16;
    this.playerImg.frameIndex = 2;
    
    //向き
    this.direction = DIRECTION.DOWN;
    
    //画像の向き
    this.playerImg.frameIndex = DIRECTION.DOWN;
    
    //移動フラグ
    this.isMove = false;
    
    //移動開始フラグ
    this.isMoveStart = false;
  },
  
  /**
   * 更新
   */
  update: function(app) {
    //this.directionAnime(app);
    this.directionAnime(app);
  },
  
  /**
   * 向きに合わせたアニメーション
   */
  directionAnime: function(app) {
    if (this.isMove) {
      if (!this.isMoveStart) {
        this.playerImg.frameIndex = this.direction;
        this.isMoveStart = true;
      }
      if (app.frame % 8 === 0) {
        if (this.playerImg.frameIndex > 3) {
          this.playerImg.frameIndex = this.direction;
          this.playerImg.y = -15;
        } else {
          this.playerImg.frameIndex += 4;
          this.playerImg.y = -11;
        }
      }
    }
  },
});

//-------------------------
// メニュークラス
//-------------------------
phina.define('Menu', {
  superClass: 'RectangleShape',
  
  init: function() {
    this.superInit({
      width : 200,
      height: 250,
      fill  : '#000',
      stroke: '#000',
      cornerRadius: 2,
    });
    
    this.x = 110;
    this.y = 134;
    
    this.isView = false;
    
    this.stroke = RectangleShape({
      width: 183,
      height: 233,
      fill: '#000',
      stroke: '#fff',
      cornerRadius: 1,
      strokeWidth: 40,
    }).addChildTo(this);
    
    this.talk = Label({
      text: 'はなす',
      fill: '#fff',
    }).addChildTo(this);
    this.talk.y = -75;
    
    this.check = Label({
      text: 'チェック',
      fill: '#fff',
    }).addChildTo(this);
    this.check.x = 18;
    this.check.y = -25;
    
    this.psi = Label({
      text: 'PSI',
      fill: '#fff',
    }).addChildTo(this);
    this.psi.x = -18;
    this.psi.y = 25;
    
    this.goods = Label({
      text: 'グッズ',
      fill: '#fff',
    }).addChildTo(this);
    this.goods.y = 75;
    
    this.hide();
  },
});

//-------------------------
// 壁クラス
//-------------------------
phina.define('WallBlock', {
  superClass: 'RectangleShape',
  
  init: function() {
    this.superInit({
      width : BOX_WIDTH,
      height: BOX_HEIGHT,
      fill  : '#888',
      stroke: null,
    });
  },
});

//-------------------------
// 草クラス
//-------------------------
phina.define('GrassBlock', {
  superClass: 'RectangleShape',
  
  init: function() {
    this.superInit({
      width : BOX_WIDTH,
      height: BOX_HEIGHT,
      fill  : '#888',
      stroke: null,
    });
  },
});

//-------------------------
// ブラックボックスクラス
//-------------------------
phina.define('BlackBox', {
  superClass: 'RectangleShape',
  
  init: function() {
    this.superInit({
      width : BOX_WIDTH,
      height: BOX_HEIGHT,
      fill  : '#aaa',
      stroke: null,
    });
  },
});

//-------------------------
// 画面切り替えブロッククラス
//-------------------------
phina.define('MoveBlock', {
  superClass: 'RectangleShape',
  
  init: function(mapMoveDate) {
    this.superInit({
      width : BOX_WIDTH,
      height: BOX_HEIGHT,
      fill  : 'red',
      stroke: null,
    });
    
    //移動先のマップラベル
    this.mapMoveDate = mapMoveDate;
  },
});

//-------------------------
// アプリ起動
//-------------------------
phina.main(function() {
  var app = GameApp({
    assets: ASSETS,
    startLabel: 'TitleScene',
    scenes: scenes,
  });
  app.fps = FPS;
  app.enableStats();
  app.run();
});


//-------------------------
// データ管理
//-------------------------
var tmpDate = {
  playerInfo  : null,
  nowMapLabel : null,
  nextMapLabel: null,
  layer1      : null,
  layer2      : null,
  mapMoveDate : null,
}

//シーン管理
var scenes = [
  {
    label: 'TitleScene',
    className: 'TitleScene',
  },
  {
    label: 'MapScene',
    className: 'MapScene',
  },
  {
    label: 'ButtleScene',
    className: 'ButtleScene',
  },
]

//キャラクターのステータス
//[今の値, 最大値]
var playerDate = {
  lv :        1,//レベル
  hp : [30, 30],//ヒットポイント
  pp : [ 0,  0],//サイコポイント
  ofe: [20, 20],//攻撃力
  def: [10, 10],//防御力
  spd: [10, 10],//スピード
  fgt: [10, 10],//クリティカル率
  int: [10, 10],//賢さ
  phy: [10, 10],//体力
  fce: [10, 10],//フォース
  exp:        0,//経験値
}

//敵のステータス
var enemyDate = {
  enemy1: {
    name: 'ブルースクエア',
    lv :        1,
    hp : [10, 10],
    pp : [ 0,  0],
    ofe: [15, 15],
    def: [10, 10],
    spd: [ 5,  5],
    fgt: [ 5,  5],
    int: [ 5,  5],
    phy: [ 5,  5],
    fce: [ 5,  5],
    exp:        5,
    color: 'blue'
  },
  enemy2: {
    name: 'グリーンスクエア',
    lv :        2,
    hp : [20, 20],
    pp : [ 0,  0],
    ofe: [13, 13],
    def: [12, 12],
    spd: [15, 15],
    fgt: [ 5,  5],
    int: [ 5,  5],
    phy: [ 5,  5],
    fce: [ 5,  5],
    exp:        8,
    color: 'green'
  },
}

//マップチップ
var STAGE = {
 //メインフィールド
 main: [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
  [1,0,0,0,0,9,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,1,1,8,1,1,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,6,6,1,1,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
 ],
 //お店
 shop: [
  [2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1],
  [2,2,2,2,2,2,2,2,2,2,1,0,0,0,0,0,0,0,0,0,0,0,1],
  [2,2,2,2,2,2,2,2,2,1,0,0,0,0,0,7,0,0,0,0,0,0,0,1],
  [2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1],
  [2,2,2,2,2,2,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [2,2,2,2,2,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [2,2,2,2,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [2,2,2,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7],
  [2,2,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [2,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
 ],
 //洞窟
 cave: [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5],
  [1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
 ],
 //test
 test: [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,0,0,0,0,0,0,0,5],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
 ]
};

//マップ遷移データ
var mapMoveDate = {
  shopEntry: {
    nextMapLabel: 'main',
    x: 464,
    y: 300,
  },
  shopExit: {
    nextMapLabel: 'shop',
    x: 880,
    y: 240,
  },
  caveEntry: {
    nextMapLabel: 'main',
    x: 576,
    y: 550,
  },
  caveExit: {
    nextMapLabel: 'cave',
    x: 960,
    y: 68,
  },
}

//-------------------------
// 関数
//-------------------------

//LVをあげてステータスを更新する
function levelUp() {
  console.log('レベルアップ！');
}

//配列をコピーする
function copyArray(array) {
  return JSON.parse(JSON.stringify(array));
}

