/** The API for game internals. The point is that we want to store
 * state of our learning.
 *
 * In big picture we want to know what is our "current knowledge",
 * that is, how many words or things we have learned. (Statistics page
 * will be in later phase).
 *
 * In big picture it is also about the "level". What is level? It may
 * be something like - how many vocabularies you can manage?
 * E.g. adjectives, numbers, or discussions how to order pizza etc.
 *
 * The API should be fast enough. There is internal and external
 * part. We want to keep storage to be able to continue our progress
 * but at the same time we want to 
 *
 * But your vocabulary set is just something.
 */

/* Well actually this is the memory/brain model. There is external
 * thing which tells us available vocabularies - some JSON api. Ok,
 * game view is only small view. The point is that we want it to tell
 * us the logical things if things did go wrong or not.
 */ 

/* We renew the words by some time. If there was many errors we try to
 * renew the word sooner, if not we put the word far away.  We need to
 * store the t0 of time when the word has been learned first time.  If
 * success double the renewal time + random. In case of error the
 * renewal time is much smaller.
 */

function shuffle(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}

function API(game) {
  this.game = game;

  // localStorage[0...inf] is for different words
  // localStorage['adj.colors.1'] contains JSON list of ints

  // get 
  var _level = localStorage['level'] || 1;
  var _idx = localStorage['index'] || 0;
  this._from = localStorage['from'] || 'en';
  this._to = localStorage['to'] || 'es';

  /* "adjectives.sizes" => 
   */ 
  this._learnedVocabs = {};

  /* [0..1] => word
   * 0.91 => 'el perro'
   * 0.92 => 'y tu'
   */
  var _memory2vocab = {};

  /* Next renewal time of word.
   */
  var _idx2time = {};

  this._vocabs = {};
  this._level2vocabs = {};
  

  function loadStuff(self){
    jQuery.getJSON('data/vocabs.json', function(data){
      var deferrer = [];
      jQuery.each(data, function(key, obj){
        self._level2vocabs[obj.level] = obj.vocabs;

        jQuery.each(obj.vocabs, function(idx, vocab){
          var d = jQuery.getJSON('data/'+vocab+'.json', function(words){
            self._vocabs[vocab] = words;
          });
          deferrer.push(d);
        });
      });
      $.when.apply(this, deferrer).then(function(){
        self.game.levelUp(); //gameOn();
      });
    });
  }

  loadStuff(this);


  this._active = {
    level: (localStorage['level'] || 1),
    vocabulary: undefined,
    words: [],
    iteration: 0,
    idx: 0,
  };

  this.timeUps = 0;
}

API.prototype.constructor = API;

API.prototype.getLevel = function() {
  return this._active.level;
};

// "level up", 
API.prototype.getTask = function() {
  return this._task;
};



API.prototype.next = function() {
console.log('next', this._level2vocabs[this._active.level]);
  var vocabs = this._level2vocabs[this._active.level];
  if (this._active.vocabulary === undefined) {
    vocabs = shuffle(vocabs);
    for (var i=0; i<vocabs.length; i++) {
      if (this._learnedVocabs[vocabs[i]] === undefined) {
        this._active.vocabulary = vocabs[i];
        this._active.words = this._vocabs[vocabs[i]];
        this._active.iteration = 0;
        this._active.idx = 0;
        this.game.gameOn();
      }
    }
    // if we don't find vocabularies that we need to learn we go to
    // NEXT LEVEL!!!
    if (this._active.vocabulary === undefined) {
      this._active.level++;
      this.game.levelUp();
    }
  } else { // we have started our vocabulary learning already!
    if (this._active.idx >= this._active.words.length) {
      if (this._active.iteration == 0) {
        this._active.iteration++;
        this._active.idx = 0;
        this.game.halfway();
      } else {
        this._learnedVocabs[this._active.vocabulary] = true;
        this._active.vocabulary = undefined;
        this.game.allway();
      }
    } else {
      this.game.gameOn();
    }
  }
}
API.prototype.getQuestion = function() {
  var from = this._active.iteration? this._to: this._from;
  var ret = {
    'q': this._active.words[this._active.idx][from],
  };
  var self = this;
  jQuery.each(['dir', 'color'], function(idx, item) {
    if (item in self._active.words[self._active.idx])
				ret[item] = self._active.words[self._active.idx][item];
  });
  return ret;
}
// @return [String]
API.prototype.getAnswers = function() {
  var to = this._active.iteration? this._from: this._to;

  var available = shuffle(this._active.words.slice(0)); // clone
  var ret = [ this._active.words[this._active.idx][to] ];
  while (ret.length < 4) {
    var a = available.pop();
    if (ret.indexOf(a[to]) < 0)
      ret.push(a[to]);
  }
  return shuffle(ret);
}

// return true if correct
API.prototype.answer = function(word) {
  var to = this._active.iteration? this._from: this._to;
  var ok = this._active.words[this._active.idx][to] == word;
  if (ok) {
    this._active.idx++;
    this.next();
    //this.game.halfway();
  } else { // NOK
    return false;
  }

}


API.prototype.timeUp = function() {
  console.log('timeup');
  this.timeUps++;
  this.next();
}
