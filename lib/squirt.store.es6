import _ from 'lodash';
// import Listener, Publisher from 'reflux';
import NylasStore from 'nylas-store';

export default class SquirtStore extends NylasStore {
  constructor() {
    super();

    this._state = {};

    // Words per minute
    this.wpm = 200;
    this.nextNodeTimeoutId = null;
    this.paused = true;
    this.nodes = [];
    this.lastNode = {};
    this.lastNodeIndex = 0;
    this.nodeIndex = 0;
    this.jumped = false;

    // /////////////////////////////////////////////////////////////////////////
    // Constants for delay calculations
    // /////////////////////////////////////////////////////////////////////////
    this.waitAfterShortWord = 1.2;
    this.waitAfterComma = 2;
    this.waitAfterPeriod = 3;
    this.waitAfterParagraph = 3.5;
    this.waitAfterLongWord = 1.5;
    this.salutations = {
      'Mr.': true,
      'Mrs.': true,
      'Ms.': true,
      'Mx.': true,
    };
    this.setWpm(this.wpm);
  }

  play() {
    this.paused = false;
    this.trigger('squirt.hideWPMSelector');
    this._nextNode();
  }

  pause() {
    this.paused = true;
    clearTimeout(this.nextNodeTimeoutId);
    this.trigger('squirt.pause');
  }
  //
  // restart() {
  //
  // }
  //
  // rewind() {
  //
  // }

  getWpm() {
    return _.clone(this.wpm);
  }

  setWpm(wpm) {
    this.wpm = wpm;
    // 60 seconds * 1000 milliseconds / words per minute
    this.intervalMilliseconds = 60 * 1000 / wpm;
  }

  setNodes(nodes) {
    this.nodes = nodes;
    this.lastNode = {};
    this.lastNodeIndex = 0;
    this.nodeIndex = 0;
  }

  _getDelay(node, jumped) {
    const word = node.word;
    // If jumped to position, give longest delay to allow for readjustment
    if (jumped) return this.waitAfterPeriod;
    if (_.get(this.salutations[word])) return 1;
    let lastChar = word[word.length - 1];
    // Ignore
    if (lastChar.match('”|"')) lastChar = word[word.length];
    // Paragraph
    if (lastChar === '\n') return this.waitAfterParagraph;
    // Peroid length pause
    if ('.!?'.indexOf(lastChar) !== -1) return this.waitAfterPeriod;
    // Comma length pause
    if (',;:–'.indexOf(lastChar) !== -1) return this.waitAfterComma;
    // Short Word
    if (word.length < 4) return this.waitAfterShortWord;
    // Long Word
    if (word. length > 11) return this.waitAfterLongWord;
    // Default to 1
    return 1;
  }

  _incrementNodeIndex(increment) {
    const returnValue = this.nodeIndex;
    this.nodeIndex += increment || 1;
    this.nodeIndex = Math.max(0, this.nodeIndex);
    return returnValue;
  }

  _nextNode() {
    const nextIndex = this._incrementNodeIndex();
    if (nextIndex >= this.nodes.length) {
      this.trigger('squirt.finalWord');
      return;
    }
    this.trigger('squirt.nextWord', this.lastNode);
    this.lastNode = this.nodes[nextIndex];

    if (this.paused) return;

    const delay = this.intervalMilliseconds * this._getDelay(this.lastNode, this.jumped);
    this.nextNodetimeoutId = setTimeout(this._nextNode.bind(this), delay);
  }
}

export default new SquirtStore();