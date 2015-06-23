

var renderer = PIXI.autoDetectRenderer(800, 600);
document.body.appendChild(renderer.view);
var stage = new PIXI.Container();

// add a shiny background...
var background = PIXI.Sprite.fromImage('tausta.png');
stage.addChild(background);

var question = new PIXI.Container();
question.position.y = 32;
stage.addChild(question);
var answers = new PIXI.Container();
answers.position.y = 320;
stage.addChild(answers);


var style = {
    font : "32px 'Fjalla One'",
    fill : '#e5d37e', //fae484',
    //stroke : '#4a1850',
    strokeThickness : 0,
    //dropShadow : true,
    //dropShadowColor : '#000000',
    //dropShadowAngle : Math.PI / 6,
    //dropShadowDistance : 6,
    wordWrap : true,
    wordWrapWidth : 440
};

function createBricks(words) {
  console.log('create bricks');
console.trace();
  var y = 0;
  for (var i=0; i<words.length; i++) {
    var w = new PIXI.Text(words[i], style);

    var brick = new PIXI.Graphics();
    brick.addChild(w);

    function drawBrick(brick, hover) {
      var b = brick.getChildAt(0).getBounds();
      // draw a rounded rectangle
      brick.clear();
      brick.lineStyle(2, 0xFF00FF, 1);
      brick.beginFill(0xFF00BB, hover? 0.7: 0.25);
      brick.drawRoundedRect(0, 0, b.width + 12 , b.height + 8, 15);
      //brick.set
      brick.endFill();
    }
    drawBrick(brick, false);  

    brick.interactive = true;
    brick
      .on('mousedown', onButtonDown)
      .on('touchstart', onButtonDown)
      .on('mouseover', function(){ drawBrick(this, true); })
      .on('mouseout', function(){ drawBrick(this, false); });

    w.position.x = 6;
    w.position.y = 4;
    brick.position.y = y;
    brick.position.x = 800 + Math.random()*20;
    brick.t0 = Date.now();
    brick.rel_x =  80*Math.random();

    answers.addChild(brick);
    y += brick.getBounds().height + 6;
  }
}



function removeBricks() {
/*
  for (var i=0; i<answers.children.length; i++) {
    answers.getChildAt(i).interactive = false;
    answers.getChildAt(i).alpha = 0;
  }
*/
  while(answers.children.length) {
    answers.removeChildAt(answers.children.length - 1).destroy(true);
  }
}


function createQuestion(q) {
  if (question.children.length)
    question.removeChildAt(0);

  if ('dir' in q) {
    var w = new PIXI.Text(q.q, {
      font : "38px 'Fjalla One'",
      fill : '#000000',
      strokeThickness : 0,
      wordWrap : true,
      wordWrapWidth : 440
    });
    var buble = new PIXI.Graphics();
    buble.addChild(w);
    var b = buble.getChildAt(0).getBounds();

    // draw an ellipse
    buble.clear();
    buble.lineStyle(0, 0xFfffff, 1);
    buble.beginFill(0xffffff, 1);
    buble.drawEllipse(0, 0, b.width-40 , b.height);
    w.position.x = 0;//0.7*b.width;
    w.position.y = 0;//b.height;
    w.anchor.x = 0.5;
    w.anchor.y = 0.5;
    buble.endFill();
    buble.position.x = 400;//(800 - buble.getBounds().width)/2;
    buble.position.y = 100; //(300 - buble.getBounds().height)/2;
    buble.anchor = [.5, .5];

    buble.beginFill(0xffffff, 1);
    buble.moveTo(-40,0);
    buble.lineTo(q.dir=='>'?-200:200, b.height+20);
    buble.lineTo(40,0);
    buble.endFill();
    question.addChild(buble);
  }
  if ('color' in q) {
    var w = new PIXI.Text(q.q, {
      font : "38px 'Fjalla One'",
      fill : '#000000',
      strokeThickness : 0,
      wordWrap : true,
      wordWrapWidth : 440
    });
    var buble = new PIXI.Graphics();
    buble.addChild(w);
    var b = buble.getChildAt(0).getBounds();

    // draw an ellipse
    buble.clear();
    buble.lineStyle(0, 0xFfffff, 1);
    buble.beginFill(0xffffff, 1);
    buble.drawRoundedRect(-120, -b.height*2/3, b.width+100 , b.height+20, 15);
    w.position.x = 0;//0.7*b.width;
    w.position.y = 0;//b.height;
    w.anchor.x = 0.5;
    w.anchor.y = 0.5;
    buble.endFill();
    buble.position.x = 400;//(800 - buble.getBounds().width)/2;
    buble.position.y = 100; //(300 - buble.getBounds().height)/2;
    buble.anchor = [.5, .5];

    buble.lineStyle(2, 0x000000, 1);
    buble.beginFill(parseInt(q.color.substring(1), 16), 1);
    buble.drawCircle(-80, 0, 20);
    buble.endFill();
    


    question.addChild(buble);
  }

}

function createMessage(param) {
  if (question.children.length)
    question.removeChildAt(0).destroy(true);

  var style = {
    font : "96px 'Fjalla One'",
    fill : '#e5d37e',
    strokeThickness : 0,
  };

  if (typeof param === 'number') {
    var w = new PIXI.Text("0 %", style);
    w.data = { type: 'percentage', curr: 0, end: param};
  } else {
    var w = new PIXI.Text(param, style);
    w.data = { type: 'text' };
  }
  question.addChild(w);
  w.position.x = 400;
  w.position.y = 120;
  w.anchor.x = 0.5;
  w.anchor.y = 0.5;
}

var timeToGo = 8*1000;

function onButtonDown(elem) {
console.log("on button ", this, this.interactive);
  if (!this.interactive) return;
  this.interactive = false;
  var correct = api.answer(this.getChildAt(0).text);
  if (!correct) {
    this.alpha = 0;
  }
}

function moveWords() {
  var t1 = Date.now();
  var t0;
  for (i=0; i<answers.children.length; i++) {
    var w = answers.getChildAt(i);
    t0 = w.t0;
    if (t1-t0 > 2*timeToGo) {
      answers.removeChildAt(i--);
      w.destroy(true);
      continue;
    }

    w.position.x = 800 - ((t1-w.t0)/timeToGo)*800 + w.rel_x;
  }

  if ((t1-t0) > (timeToGo + 1*1000))
    api.timeUp();
}

function doHalfway() {
  if (!question.children.length) return;

  var w = question.getChildAt(0);
  if (w.data && w.data.type === 'percentage') {
    if (w.data.curr <= w.data.end) {
      w.text = (w.data.curr++)+" %";
    } else if (w.data.curr == w.data.end + 1) {
      w.data.curr++;
      w.data.t0 = Date.now();
    } else {
      if ((Date.now() - w.data.t0) > 2.5*1000)
        api.next();
    }
  }
  if (w.data && w.data.type === 'text') {
    if (w.data.t0 === undefined) {
      w.data.t0 = Date.now();
    } else {
      if ((Date.now() - w.data.t0) > 2.5*1000)
        api.next();
    }    
  }
}


function animate() {
  moveWords();
  doHalfway();
  renderer.render(stage);
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);


var gameAPI = {
  gameOn: function() {
    console.log('game on');
    console.trace();
    createBricks(api.getAnswers());
    createQuestion(api.getQuestion());
  },
  halfway: function() {
    console.log('halfway');
    removeBricks();
    createMessage(50);
  },
  allway: function() {
    console.log('allway');
    removeBricks();
    createMessage(100);
  },
  levelUp: function() {
    console.log('lvlup');
    removeBricks();
    createMessage("LEVEL "+api.getLevel());
  }
};

var api = new API(gameAPI);


