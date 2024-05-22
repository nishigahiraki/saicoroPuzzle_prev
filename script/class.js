'use strict';

// 処理のヘルパー
const helperOBJ = {
	setCSS : function( elmt, attr, val ) { // CSSへ設定
		elmt.style.setProperty( attr, val );
	},
	getCSS : function( elmt, attr, flg=false ) { // CSSから取得
		let val = getComputedStyle( elmt ).getPropertyValue( attr );
		if(!flg) {
			val = this.returnNumber( val ); // 単位をとって数値化
		}
		return val;
	},
	returnNumber : function( val ) { // 単位の除去（CSSの単位はpxで読み込まれるっぽい）
		if(val.indexOf('px') != -1) {
			return Number( val.slice(0,-'px'.length) );
		}
		else { return Number( val ); }
	}
};

// Dice クラス
class Dice {
	constructor() {
		// サイコロのElement
		this.element = this.createDice();
		//
		// サイコロの位置（ポジション:1~）
		this.posX = 0;
		this.posY = 0;
		//
		// 賽の目情報
		this.surface = { 
				   'Top' : { 'face' : 5, 'rotate' : 0, 'nextFace' : 5},
				'Bottom' : { 'face' : 2, 'rotate' : 0, 'nextFace' : 2},
				  'Left' : { 'face' : 4, 'rotate' : 0, 'nextFace' : 4},
				 'Right' : { 'face' : 3, 'rotate' : 0, 'nextFace' : 3},
					'Up' : { 'face' : 6, 'rotate' : 0, 'nextFace' : 6},
				  'Down' : { 'face' : 1, 'rotate' : 0, 'nextFace' : 1},
		};
		//
		// dice面の初期化
		for(let i=1; i<=6; i++) {
			this.surface['face'+i] = document.createElement('div');
			this.surface['face'+i].className = 'dotWrap';
			let dotsWrap = ''
			for(let j=1; j<=i; j++) {
				dotsWrap += `<span class="dots${i}"></span>`;
			}
			this.surface['face'+i].innerHTML = dotsWrap;
		}
		//表面の更新
		this.updataFace();
		this.crushIs = false;
		//
		// 消し込みの寿命
		this.deleteLife = 320;
		// ダイスの高さ
		this.height = 100;
		//
		// タイマーの記憶
		this.timerid = 0;
	}
	num = 0;
	createDice() { // サイコロの生成
		const ele = document.createElement('div');
		const diceHTML = `
			<!--div class="dice"-->
				<div class="face Top"></div>
				<div class="face Down"></div>
				<div class="face Bottom"></div>
				<div class="face Right"></div>
				<div class="face Left"></div>
				<div class="face Up"></div>
			<!--/div-->`;
		ele.innerHTML = diceHTML;
		ele.className = 'dice';
		//
		this.num++;
		//
		return ele;
	}
	randomSetFace() { // 賽の目をランダムで生成
		//console.log('randomSetFace');
		// 一旦 鏡像体を許す
		const numList = [1,2,3,4,5,6]; // 面候補
		// topの選択
		const topNum = Math.floor(Math.random()*numList.length)+1;
		const bottomNum = 7 - topNum; // bottomは一意
		// 面候補の更新 (選択した数を取り除く)
		numList[topNum-1] = 0; numList[bottomNum-1] = 0;
		numList.sort(); numList.shift(); numList.shift();
		// leftの選択
		const leftNum = numList[ Math.floor(Math.random()*numList.length) ];
		const rightNum = 7 - leftNum; // rightは一意
		for(let i=0; i<numList.length; i++) {
			if( numList[i] === leftNum || numList[i] === rightNum ) { numList[i] = 0; }
		}
		numList.sort(); numList.shift(); numList.shift();
		// upの選択
		const selected = Math.floor(Math.random()*2);
		const upNum = numList[ selected ];
		const downNum = 7 - upNum; // downは一意
		//
		// 賽の目情報の反映
		this.surface['Top']['face'] = this.surface['Top']['nextFace'] = topNum;
		this.surface['Bottom']['face'] = this.surface['Bottom']['nextFace'] = bottomNum;
		this.surface['Left']['face'] = this.surface['Left']['nextFace'] = leftNum;
		this.surface['Right']['face'] = this.surface['Right']['nextFace'] = rightNum;
		this.surface['Up']['face'] = this.surface['Up']['nextFace'] = upNum;
		this.surface['Down']['face'] = this.surface['Down']['nextFace'] = downNum;
		//
		//表面の更新
		this.updataFace();
	}
	setFace(topNum, rightNum, downNum) { // 賽の目の設定
		const bottomNum = 7 - topNum;
		const leftNum = 7 - rightNum;
		const upNum = 7 - downNum;
		//
		// 賽の目情報の反映
		this.surface['Top']['face'] = this.surface['Top']['nextFace'] = topNum;
		this.surface['Bottom']['face'] = this.surface['Bottom']['nextFace'] = bottomNum;
		this.surface['Left']['face'] = this.surface['Left']['nextFace'] = leftNum;
		this.surface['Right']['face'] = this.surface['Right']['nextFace'] = rightNum;
		this.surface['Up']['face'] = this.surface['Up']['nextFace'] = upNum;
		this.surface['Down']['face'] = this.surface['Down']['nextFace'] = downNum;
		//
		//表面の更新
		this.updataFace();
	}
	getTopFace() { // Topの目を取得
		return this.surface['Top']['face'];
	}
	putOnStage( stage ) {
		stage.appendChild(this.element);
	}
	setPos(posX, posY) { // サイコロの表示位置設定
		const dice_ele = this.element;
		this.posX = posX;
		this.posY = posY;
		helperOBJ.setCSS(dice_ele, '--posX', this.posX);
		helperOBJ.setCSS(dice_ele, '--posY', this.posY);
		//console.log(dice_ele, this.posX, this.posY);
	}
	setSurface( target, attr, val) { // 賽の目の設定
		let value = val;
		// 設定要素で場合分け
		if( attr === 'rotate' ) {
			value = val;
			if(value >= 4) { value = 0; }
			if(value <= -1) { value = 3; }
		}
		else if( attr === 'nextFace' ) {
			// 次のfaceをvalに入れて投げているので、ここでは何もしない
		}
		this.surface[target][attr]  = value;
	}
	rotateMove( direction ) {
		let changeRotateList = [];
		let changeFaceList = [];
		let rotateDelta = 0;
		switch( direction ) {
			case 'Left' : // 左へ転がすと...
				// 対症療法　(Bottomの向きがになるで)
				const bFace = this.surface['Bottom']['face'];
				const bRotate = this.surface['Bottom']['rotate'];
				this.surface['face'+bFace].style['transform'] = `rotate(${(bRotate + 2)*90}deg)`; // 正確に作れば問題ないハズなので要検討
				//
				// faceの回転がUp,Downに-90
				changeRotateList = ['Up','Down'];
				rotateDelta = -1;
				// 転がした後のfaceの入れ替え
				// left -> bottom, top -> left, right -> top, bottom -> right
				changeFaceList = ['Left','Top','Right','Bottom']; // 入れ替えリスト
			break;
			case 'Right' : // 右へ転がすと...
				// faceの回転がUp,Downに+90
				changeRotateList = ['Up','Down'];
				rotateDelta = 1;
				// 転がした後のfaceの入れ替え
				// right -> bottom -> left -> top -> right
				changeFaceList = ['Right','Top','Left','Bottom']; // 入れ替えリスト
			break;
			case 'Up' : // 上へ転がすと...
				// faceの回転がにleft,right-90
				changeRotateList = ['Left','Right'];
				rotateDelta = 1;
				// 転がした後のfaceの入れ替え
				// Up -> bottom -> Down -> top -> Up
				changeFaceList = ['Up','Top','Down','Bottom']; // 入れ替えリスト
			break;
			case 'Down' : // 下へ転がすと...
				// faceの回転がUp,Downに+90
				changeRotateList = ['Left','Right'];
				rotateDelta = -1;
				// 転がした後のfaceの入れ替え
				// Down -> bottom -> Up -> top -> Down
				changeFaceList = ['Down','Top','Up','Bottom']; // 入れ替えリスト
			break;
		}
		// rotateの設定
		for(let i=0; i<changeRotateList.length; i++) {
			const target = changeRotateList[i];
			this.setSurface(target, 'rotate', this.surface[target]['rotate'] + rotateDelta);
		}
		// nextFaceの設定
		let tmpRotates = [];
		tmpRotates.push(this.surface[changeFaceList[changeFaceList.length-1]]['rotate']);
		for(let i=0; i<changeFaceList.length; i++) {
			const target = changeFaceList[i];
			let face = 0;
			let rotate = 0;
			// faceの引継ぎ
			if(i+1 >= changeFaceList.length) {
				face = this.surface[changeFaceList[0]]['face'];
			}
			else {
				face = this.surface[changeFaceList[i+1]]['face'];
			}
			// 回転の引継ぎ
			tmpRotates.push(this.surface[changeFaceList[i]]['rotate']);
			rotate = tmpRotates.shift();
			//
			this.setSurface(target, 'nextFace', face);
			this.setSurface(target, 'rotate', rotate);
			//console.log(target,rotate);
		}
	}
	updataFace() { // 面の更新
		const targets = ['Top', 'Bottom', 'Left', 'Right', 'Up', 'Down'];
		for(let i=0; i<targets.length; i++) {
			const target = targets[i];
			if(this.surface[target]['nextFace'] == 0) { continue; } // 押しつぶし指定あり
			else if(this.surface[target]['nextFace'] < 0) { this.surface[target]['nextFace'] = Math.abs(this.surface[target]['nextFace']); }
			const face_ele = this.surface['face'+this.surface[target]['nextFace']];
			// nextFaseのfaceを面に張り込む
			const targetSurface = this.element.querySelector('.face.'+target);
			targetSurface.innerHTML = '';
			targetSurface.appendChild(face_ele);
			// 回転の反映
			let rotate = this.surface[target]['rotate'];
			if(target === 'Right') {
				rotate += 1;
			}
			else if(target === 'Left') {
				rotate -= 1;
			}
			else if(target === 'Up') {
				rotate += 2;
			}
			face_ele.style['transform'] = `rotate(${rotate*90}deg)`;
			// faceの更新
			this.surface[target]['face'] = this.surface[target]['nextFace'];
			//
			//console.log(this[target]);
		}
	}
	crushDice() { // diceの圧し潰し
		//console.log('crushDice:::', this.element);
		this.element.style['display'] = 'none';
		this.surface['Top']['face'] = 0; // 床と化す
		this.surface['Top']['nextFace'] = 0; 
		this.crushIs = true;
	}
	deleteDice() { // diceの削除
		//console.log('deleteDice:::', this.element, this.crushIs);
		this.element.parentElement.removeChild(this.element);
	}
	getDiceHeightByDeleteLife() { // 寿命によるdiceの高さを取得
		this.height = 100*this.deleteLife/320;
		return this.height;
	}
	updataDiceHeightByDeleteLife() { // 寿命に合わせた高さで表示
		//console.log(`${100-100*this.deleteLife/320}px`);
		//const temp = `translate3d(calc((var(--posX) - 1)*100px), ${tempY}, calc((var(--posY) - 1)*100px)) rotateX(0deg) rotateZ(0deg)`;
		const temp = `translateX(calc((var(--posX) - 1)*100px))
					translateY(${100-this.getDiceHeightByDeleteLife()}px)
					translateZ(calc((var(--posY) - 1)*100px))
					rotateX(0deg) rotateZ(0deg)`;
		helperOBJ.setCSS(this.element, 'transform', temp);
	}
	downDeleteLife() { // 消し込みでdiceが沈んでいく処理
		// console.log('deleteLife',this.deleteLife);
		// 寿命を減らす
		this.deleteLife--;
		// 寿命にあった表示位置に更新
		this.updataDiceHeightByDeleteLife();
		//
		// 寿命がつきたら...
		if( this.deleteLife <= 0 ) {
			this.deleteLife = 0;
			return true;
		}
		else {
			return false;
		}
	}
	upDeleteLife() { // 連鎖でdiceの寿命を延ばす処理
		//console.log('upDeleteLife');
		// 寿命を延ばす
		const MAX = 320;
		this.deleteLife += 50;
		if( this.deleteLife >= MAX ) { this.deleteLife = MAX; }
		//
		// 寿命にあった表示位置に更新
		this.updataDiceHeightByDeleteLife();
	}
}
//
// 計測用 時計オブジェクト
const timerOBJ = {
	elmt : document.querySelector('.timeView .gameText'),
	now : new Date(),
	timeLimit : 0,
	timeUpIs : false,
	startTime : 0,
	stopTime: 0,
	timerFlg : false,
	setStartTime : function() {
		this.startTime = (new Date()).getTime();
		this.timeUpIs = false;
		this.elmt.classList.remove('LIMIT');
		this.elmt.classList.remove('LIMITani');
	},
	getPastTime : function() {
		return (new Date()).getTime() - this.startTime;
	},
	timeList : [],
	initTimeList : function() { this.timeList = []; },
	pushTimeList : function( time ) { this.timeList.push( time ); },
	getTotalTime : function() {
		let total = 0;
		for(const time of this.timeList) {
			total += time;
		}
		return total;
	},
	viewUpdata : function( MESSAGE, CLS = null ) {
		//console.log('MESSAGE:::',MESSAGE);
		this.elmt.innerHTML = MESSAGE;
		this.elmt.classList.remove('LIMIT');
		this.elmt.classList.remove('LIMITani');
		if(CLS != null) {
			this.elmt.classList.add(CLS);
		}
	},
	start : function() {
		this.timerFlg = true;
		if(this.timerFlg) {
			if(this.timeList.length >= this.timeListMAX) {
				// リストは、(timeListMAX)こまで。 
				this.initTimeList(); // リストの初期化
			}
			// 開始用
			this.setStartTime();
			setTimeout(this.viewNowTime, 1000/24);
		}
	},
	stop : function() {
		this.timerFlg = false;
	},
	viewNowTime : function () { //ストップウォッチのループ関数
		let TIME = timerOBJ.timeLimit - timerOBJ.getPastTime();
		let cls = null;
		if( timerOBJ.timeLimit > 0 && TIME <= 10*1000) {
			cls = 'LIMITani'
		}
		if( timerOBJ.timeLimit > 0 && TIME <= 0) {
			timerOBJ.timerFlg = false;
			timerOBJ.timeUpIs = true;
			TIME = 0;
			cls = 'LIMIT'
		}
		TIME = Math.abs(TIME);
		/*
		const min = String(Math.floor(TIME/(60*1000))).padStart(2,0);
		const sec = String(Math.floor(TIME/1000)%60).padStart(2,0);
		const ms = String(TIME%1000).padStart(3,0);
		timerOBJ.viewUpdata(`${min}:${sec}.${ms}`, cls);
		*/
		timerOBJ.viewUpdata( timerOBJ.viewFormat(TIME), cls);
		if( timerOBJ.timerFlg ) {
			setTimeout(timerOBJ.viewNowTime, 1000/32);
		}
		else {
			timerOBJ.stopTime = timerOBJ.getPastTime();
			/*
			const currentPastTime = timerOBJ.getPastTime();
			this.pushTimeList(currentPastTime); // 経過時間をリストにpush
			console.log( `${timerOBJ.timeList.length}times::: ${currentPastTime}`);
			if(timerOBJ.timeList.length == timeListMAX) {
				// リストに(timeListMAX)こたまったら...
				console.log('timeList:::',timerOBJ.timeList);
				console.log('total is:::',timerOBJ.getTotalTime());
			}
			*/
		}
	},
	viewFormat : function( milliSeconds ) {
		const min = String(Math.floor(milliSeconds/(60*1000))).padStart(2,0);
		const sec = String(Math.floor(milliSeconds/1000)%60).padStart(2,0);
		const ms = String(milliSeconds%1000).padStart(3,0);
		return `${min}:${sec}.${ms}`;
	}
}