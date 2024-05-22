'use strict';
//
// フレーム
const FPS = 32;
const FRM = 1000 / FPS;
// diceの場所
let dicePosX = 2;
let dicePosY = 3;
//
let playerPosX = 1;
let playerPosY = 1;
//
// ステージサイズ
const stagePosX_MAX = 4;
const stagePosY_MAX = 4;
// ステージの配列
const stageMap = [
	[ 0, 0, 0, 0 ],
	[ 0, 0, 0, 0 ],
	[ 0, 0, 0, 0 ],
	[ 0, 0, 0, 0 ],
];
//
let currentFace_global = 0;
let nextFace_global = 0;
let focusStatus_global = 0;
let footStatus_global = 0;
//
let maxChainList = [0,0,0,0,0,0];
let chainNumList = [0,0,0,0,0,0];
let deleteNumList = [0,0,0,0,0,0];
//
// ゲームのmainタイマー
let gameMainTimer_id = null;
//
// dices生成タイマー
const newDiceINTERVAL = 10*1000;
let newDiceINTERVAL_id = null;
let focusCheckLoop_id = 0;
//
// ゲーム情報の表示関係
let stageMapHTML = ``;
let checkedMapHTML = ``;
let diceStHTML = ``;
let controlStHTML = ``;
let deleteInfoHTML = ``;
// ゲーム情報の表示
function viewVal(){
	const valView = document.body.querySelector('.valview');
	let mesHTML = stageMapHTML;
	//
	stageMapHTML = `
				<div class="viewVal">${stageMap[0]}</div>
				<div class="viewVal">${stageMap[1]}</div>
				<div class="viewVal">${stageMap[2]}</div>
				<div class="viewVal">${stageMap[3]}</div>
				<div class="viewVal">++++++++++++++</div>
				`;
	diceStHTML = `			
				<div class="viewVal">current:::${currentFace_global}</div>
				<div class="viewVal">---next:::${nextFace_global}</div>
				<div class="viewVal">focusST:::${focusStatus_global}</div>
				<div class="viewVal">footST::::${footStatus_global}</div>
				<div class="viewVal">--Dices:::${diceList.length}</div>
				`;
	//
	//mesHTML += checkedMapHTML;
	mesHTML += diceStHTML;
	mesHTML += controlStHTML;
	mesHTML += '<div class="viewVal">***********</div>';
	mesHTML += deleteInfoHTML;
	//
	valView.innerHTML = mesHTML;
}
// ゲームモード
const gameModeLIST = ['DebugMode','TimeTrial2min','Servival','dice10Challenge','practice'];
let selectedGameMode = 0;
// 
let usrScore = 0;
let viewScore = 0;
let hiScore = 100;
const hiScoreView = document.body.querySelector('.hiScoreView .gameText');
hiScoreView.textContent = String(hiScore).padStart(10,0);
// ranking.phpを監視して、hiScoreをロードする
document.addEventListener('DOMContentLoaded', function(evt) {
	document.querySelector('iframe.rankingView').addEventListener('load', function(evt) {
		console.log('phploaded');
		console.log('hiScore get test:::', document.querySelector('iframe.rankingView').contentWindow.testVal);
		hiScore = document.querySelector('iframe.rankingView').contentWindow.testVal;
		hiScoreView.textContent = String(hiScore).padStart(10,0);
	});
});

let timerRest = 2*60*1000; // のこり時間2分(ms)
// ゲーム設定
let autoCreateDiceIs = false; // 自動生成フラグ
const autoCreateDiceBox5s = document.body.querySelector('#autoCreateDiceBox5s');
const autoCreateDiceBox10s = document.body.querySelector('#autoCreateDiceBox10s');
autoCreateDiceBox5s.addEventListener('change', function(evt) {
	clearInterval(newDiceINTERVAL_id); // 自動生成タイマーのクリア
	if(autoCreateDiceBox10s.checked) { autoCreateDiceBox10s.checked = false; }
	// dice追加タイマーのスタート
	if( autoCreateDiceIs = evt.target.checked ) {
		newDiceINTERVAL_id = setInterval( addNewDiceOnGame, 5*1000 );
	}
});
autoCreateDiceBox10s.addEventListener('change', function(evt) {
	clearInterval(newDiceINTERVAL_id); // 自動生成タイマーのクリア
	if(autoCreateDiceBox5s.checked) { autoCreateDiceBox5s.checked = false; }
	// dice追加タイマーのスタート
	if( autoCreateDiceIs = evt.target.checked ) {
		newDiceINTERVAL_id = setInterval( addNewDiceOnGame, 10*1000 );
	}
});
let create2DiceIs = false; // 生成diceの天面面を2にするフラグ
const create2DiceBox = document.body.querySelector('#create2DiceBox');
create2DiceBox.addEventListener('change', function(evt) {
	create2DiceIs = !create2DiceIs;
});
let createDiceByShiftIs = false; // Shiftの押下でdiceを生成できるフラグ
const createDiceByShiftBox = document.body.querySelector('#createDiceByShiftBox');
createDiceByShiftBox.addEventListener('change', function(evt) {
	createDiceByShiftIs = !createDiceByShiftIs;
});
//
// Diceの生成
// ステージ上のdiceのリスト
const diceList = [];
const diceNum = 10; // 一旦 初期配置数
while( diceList.length < diceNum ) {
	const tmpDice = new Dice();
	diceList.push( tmpDice );
	tmpDice.putOnStage( document.body.querySelector('.diceWrap') );
	tmpDice.randomSetFace();
}
// サイコロをMAP上の空白の場所にランダムで出す。
function selectEmptyPos( MAP ) {
	// 全マスチェック法
	// MAP上の候補地をあげる
	const emptyPosList = getEmptyPosList( MAP );
	//
	if( emptyPosList.length === 0 ) {
		// 候補地がなかった場合...
		return false;
	}
	else {
		// 候補地があれば、ランダムで選択
		return emptyPosList[ Math.floor(emptyPosList.length*Math.random()) ];
	}
}
// diceのランダム配置
for(const dice of diceList) {
	updataStageMap(); // stageMapの更新
	let selectedPos = selectEmptyPos( stageMap );
	let count = 0;
	while( !selectedPos ) {
		count++;
		if( count>stageMap.length * stageMap[0].length ) {
			console.log('候補地エラー');
			break;
		}
		selectedPos = selectEmptyPos( stageMap );
	}
	if( !selectedPos ) { break; } // 生成せずにループを抜ける
	dice.setPos(selectedPos[0], selectedPos[1]);
	updataStageMap(); // stageMapの更新
}
// ゲーム読み込み時のdice設定
function firstDiceInit() {
	// 初期設定をリセット
	diceList.length = 0;
	const target = document.body.querySelector('.diceWrap');
	while( target.children.length > 0 ) {
		target.removeChild(target.lastChild);
	}
	//
	while( diceList.length < 1 ) {
		diceList.push( new Dice() );
	}
	console.log(diceList);
	//
	diceList[0].putOnStage( document.body.querySelector('.diceWrap') );
	diceList[0].setPos(2, 2);
	diceList[0].setFace(1, 3, 2);
}
// テストの場合の設定
const testIs = true;
if(testIs) {
	// 初期設定をリセット
	diceList.length = 0;
	const target = document.body.querySelector('.diceWrap');
	while( target.children.length > 0 ) {
		target.removeChild(target.lastChild);
	}
	//
	while( diceList.length < 1 ) {
		diceList.push( new Dice() );
	}
	console.log(diceList);
	//
	diceList[0].putOnStage( document.body.querySelector('.diceWrap') );
	diceList[0].setPos(2, 2);
	diceList[0].setFace(1, 3, 2);
	/*
	diceList[1].putOnStage( document.body.querySelector('.diceWrap') );
	diceList[1].setPos(2, 3);
	diceList[1].setFace(2, 4, 1);
	//
	diceList[0].putOnStage( document.body.querySelector('.diceWrap') );
	diceList[0].setPos(2, 2);
	diceList[0].setFace(2, 3, 6);
	//
	diceList[2].putOnStage( document.body.querySelector('.diceWrap') );
	diceList[2].setPos(3, 2);
	diceList[2].setFace(1, 2, 3);
	//
	diceList[3].putOnStage( document.body.querySelector('.diceWrap') );
	diceList[3].setPos(3, 4);
	diceList[3].setFace(2, 3, 1);
	/*
	diceList[0].deleteLife = 180;
	diceList[0].updataDiceHeightByDeleteLife();
	diceList[2].deleteLife = 70;
	diceList[2].updataDiceHeightByDeleteLife();
	*/
	console.log(diceList);
}
// diceの開始状態を記録
let backupDicesInfo =[];
function backupDicesInfoFunc( LIST ) {
	backupDicesInfo =[];
	for(let index=0; index<LIST.length; index++) {
		backupDicesInfo.push( {
			'topNum' : LIST[index].surface['Top']['face'],
			'rightNum' : LIST[index].surface['Right']['face'],
			'downNum' : LIST[index].surface['Down']['face'],
			'posX' : LIST[index].posX,
			'posY' : LIST[index].posY,
		} );
	}
}
backupDicesInfoFunc( diceList );
//
// 床
const floorDice = new Dice();
floorDice.surface['Top']['face'] = floorDice.surface['Top']['nextFace'] = 0;
floorDice.deleteLife = 0;
//
/* indexOfで拾えるかテスト
const testDice = diceList[Math.floor(Math.random()*6)];
console.log( testDice.posX, testDice.posY );
const testIndex = diceList.indexOf(testDice);
console.log(testIndex);
console.log( diceList[testIndex].posX, diceList[testIndex].posY );
*/
//
// ステージ上の配置状況の更新
function updataStageMap() {
	// ステージMapのリセット
	stageMap[0] = [0,0,0,0];
	stageMap[1] = [0,0,0,0];
	stageMap[2] = [0,0,0,0];
	stageMap[3] = [0,0,0,0];
	//console.log(diceList);
	for(let i=0; i<diceList.length; i++) {
		if( diceList[i].posX < 1 && diceList[i].posY < 1 ) { continue; }
		const _X = diceList[i].posX-1;
		const _Y = diceList[i].posY-1;
		const tmpFace = diceList[i].getTopFace();
		// diceの圧し潰し時につけた0(床)のフラグで
		// playerDiceが上書きされてしまう可能性があったので...
		if( tmpFace != 0 ) {
			stageMap[_Y][_X] = tmpFace;
		}
	}
	/*
	console.log('=====================');
	for(let i=0; i<stageMap.length; i++) {
		console.log(stageMap[i]);
	}
	console.log('=====================');
	*/
}
// ステージのリセット
function resetStage() {
	// リセット
	// diceのリセット
	for( const dice of diceList) {
		dice.deleteDice();
	}
	diceList.length = 0;
	//
	// 得点のリセット
	chainNumList = [0,0,0,0,0,0];
	deleteNumList = [0,0,0,0,0,0];
	/*
	const target = document.body.querySelector('.diceWrap');
	while( target.children.length > 0 ) {
		target.removeChild(target.lastChild);
	}
	*/
}
//
const focusOBJ = {
	elemt : document.body.querySelector('.playerFocus'),
	shadow : document.body.querySelector('.playerShadow'),
	mark : document.body.querySelector('.playerMark'),
	posX : 0,
	posY : 0,
	currentDir : 135,
	requestDir : null, // 操作要求
	heightIsValiable : true, // 高さが可変か否か
	height : 100, // 100が通常dice上,0が床
	timerid : 0, // timer ID
	setPos : function( posX, posY ) {
		this.posX = posX;
		this.posY = posY;
		helperOBJ.setCSS(focusOBJ.elemt, '--posX', posX);
		helperOBJ.setCSS(focusOBJ.elemt, '--posY', posY);
		// shadow
		helperOBJ.setCSS(focusOBJ.shadow, '--posX', posX);
		helperOBJ.setCSS(focusOBJ.shadow, '--posY', posY);
		// mark
		helperOBJ.setCSS(focusOBJ.mark, '--posX', posX);
		helperOBJ.setCSS(focusOBJ.mark, '--posY', posY);
	},
	setDir : function( angle ) {
		helperOBJ.setCSS(focusOBJ.elemt, '--rotate', angle + 45); // 先端の向きを吸収している
		this.currentDir = angle; // 現在の向きとして待避
		//shadow
		helperOBJ.setCSS(focusOBJ.shadow, '--rotate', angle + 45);
	},
	turnJudge : function( direction ) {
		if(this.elemt.classList.contains('ROTATE') ) { return false; }
		const angleList = ['Up','Right','Down','Left'];
		const goalAngleNum = angleList.indexOf(direction);
		const currentAngleNum = this.currentDir%360 / 90; //currentDirは正とする
		const turn = goalAngleNum - currentAngleNum;
		//console.log(`入力時::${this.currentDir}、目標::${goalAngleNum*90}`);
		//console.log(`入力時差分::${turn}`);
		// turn < 0 左回り、 turn > 0　右回り
		// turn = 0 or 4 回転なし or 一回転 4以上は出ないはず
		if( turn == 0 ) { return false; } // 回転しない
		else if( Math.abs(turn) <= 2 ) { return 90*turn; }
		else  if( Math.abs(turn) >= 3 ) {
			if(currentAngleNum == 0 && goalAngleNum == 3) { return -90; }
			else if(currentAngleNum == 3 && goalAngleNum == 0) { return 90; }
			else {
				console.log('範囲外：：', currentAngleNum, goalAngleNum);
				return turn > 0 ? 90 : -90;
			}
		}
	},
	rotate : function( angle ) { // playerFocusの回転
		//console.log(`回転開始::${this.currentDir}`);
		//const thisElement = this.elemt;
		const duration = 200;//8*FRM;
		this.elemt.classList.add('ROTATE');
		this.shadow.classList.add('ROTATE');
		this.elemt.style['transition-duration'] = `${duration}ms`;
		this.shadow.style['transition-duration'] = `${duration}ms`;
		//focusOBJ.setDir( focusOBJ.currentDir + delta );
		//const tmpAngle = this.currentDir + angle;
		this.setDir( angle );
		//
		setTimeout( ()=> {
			this.elemt.classList.remove('ROTATE');
			this.shadow.classList.remove('ROTATE');
			this.elemt.style['transition-duration'] = null;
			this.shadow.style['transition-duration'] = null;
			// 数値の矯正
			//console.log( helperOBJ.getCSS(focusOBJ.elemt, 'transform') );
			if(angle < 0) {
				this.setDir( angle%360 + 360 );
			}
			else {
				this.setDir( angle%360 );
			}
			//console.log(`回転終了::${this.currentDir}`);
		}, duration);
	},
	translate : function( posX, posY ) { // playerFocus位置の移動処理
		//console.log('tranlate in');
		//const thisElement = this.elemt;
		const duration = 400;//10*FRM;
		this.elemt.classList.add('TRANSLATE');
		this.shadow.classList.add('TRANSLATE');
		this.mark.classList.add('TRANSLATE');
		this.elemt.style['transition-duration'] = `${duration}ms`;
		this.shadow.style['transition-duration'] = `${duration}ms`;
		this.mark.style['transition-duration'] = `${duration}ms`;

		this.setPos( posX, posY );
		clearTimeout(this.timerid);
		this.timerid = setTimeout( ()=> {
			this.elemt.classList.remove('TRANSLATE');
			this.shadow.classList.remove('TRANSLATE');
			this.mark.classList.remove('TRANSLATE');
			this.elemt.style['transition-duration'] = null;
			this.shadow.style['transition-duration'] = null;
			this.mark.style['transition-duration'] = null;
			//console.log('tranlate out');
		},duration);
	},
	updataFocusHeight : function( height ) {
		if(height != null) {
			this.height = height; // 高さの引継ぎ
		}
		const temp = `translateY(${(100-this.height)-10}px) rotateX(90deg)`;
		const tempShadow = `translateY(${(100-this.height)-2}px) rotateX(90deg)`;
		const tempMark = `translateY(${(100-this.height)/1.5-70}px) rotateX(90deg)`;
		//console.log('diceLife on focus:::', temp);
		//console.log(this.elemt.parentElement);
		helperOBJ.setCSS(this.elemt.parentElement, 'transform', temp);
		helperOBJ.setCSS(this.shadow.parentElement, 'transform', tempShadow);
		helperOBJ.setCSS(this.mark.parentElement, 'transform', tempMark);
	}
}
//console.log(focusOBJ.elemt);
//
// 現在のDice状態の表示
const currentView = {
	init : function() {
		this.view = document.body.querySelector('.currentWrap');
		this.dice = new Dice();
		//
		this.dice.putOnStage( this.view );
	},
	updata : function( targetDice = null ) {
		if(targetDice === false || targetDice === null) {
			console.log('targetDiceなし');
			this.dice.element.style['visibility'] = 'hidden';
			return;
		}
		else if(targetDice === floorDice) {
			//console.log('床上');
			this.dice.element.style['visibility'] = 'hidden';
			return;
		}
		this.dice.element.style['visibility'] = 'visible';
		// 賽の目情報の反映
		this.dice.surface['Top']['face'] = targetDice.surface['Top']['face']
		this.dice.surface['Bottom']['face'] = targetDice.surface['Bottom']['face']
		this.dice.surface['Left']['face'] = targetDice.surface['Left']['face']
		this.dice.surface['Right']['face'] = targetDice.surface['Right']['face'];
		this.dice.surface['Up']['face'] = targetDice.surface['Up']['face'];
		this.dice.surface['Down']['face'] = targetDice.surface['Down']['face'];
		this.dice.surface['Top']['nextFace'] = targetDice.surface['Top']['nextFace'];
		this.dice.surface['Bottom']['nextFace'] = targetDice.surface['Bottom']['nextFace'];
		this.dice.surface['Left']['nextFace'] = targetDice.surface['Left']['nextFace'];
		this.dice.surface['Right']['nextFace'] = targetDice.surface['Right']['nextFace'];
		this.dice.surface['Up']['nextFace'] = targetDice.surface['Up']['nextFace'];
		this.dice.surface['Down']['nextFace'] = targetDice.surface['Down']['nextFace'];
		this.dice.surface['Top']['rotate'] = targetDice.surface['Top']['rotate'];
		this.dice.surface['Bottom']['rotate'] = targetDice.surface['Bottom']['rotate'];
		this.dice.surface['Left']['rotate'] = targetDice.surface['Left']['rotate'];
		this.dice.surface['Right']['rotate'] = targetDice.surface['Right']['rotate'];
		this.dice.surface['Up']['rotate'] = targetDice.surface['Up']['rotate'];
		this.dice.surface['Down']['rotate'] = targetDice.surface['Down']['rotate'];
		//
		//表面の更新
		this.dice.updataFace();
	}
};
//
currentView.init(); // 現在のdice状態表示の初期化
currentView.updata(diceList[0]); // 現在のdice状態表示の更新
//
// ページロード時init
window.addEventListener('load', function(evt) {
	console.log('onload');
	// ウィンドウの監視
	windowAreaCheck(); // レイアウト更新
	window.addEventListener('resize', windowAreaCheck);
	//
	updataStageMap();
	//
	// ゲームロード直後表示
	titleViewFunc();
	// ゲームメニュー画面へ
	viewGameMenuFunc();
});
// ウィンドウの監視
function windowAreaCheck(evt) {
	// スコア群 表示位置の設定
	const scoresWrap = document.body.querySelector('.scoresWrap');
	const screenWrap = document.body.querySelector('.screenWrap');
	scoresWrap.style['left'] = screenWrap.getBoundingClientRect().x -5 + 'px';
	scoresWrap.style['top'] = screenWrap.getBoundingClientRect().y -15 + 'px';
	// コントローラ　 表示位置の設定
	const controlWrap = document.body.querySelector('.controlWrap');
	controlWrap.style['left'] = scoresWrap.getBoundingClientRect().x + scoresWrap.getBoundingClientRect().width + 15 + 'px';
	controlWrap.style['top'] = scoresWrap.getBoundingClientRect().y -15 + 'px';
	// gameMode群 表示位置の設定
	const gameSelectView = document.body.querySelector('.gameSelectView');
	gameSelectView.style['left'] = screenWrap.getBoundingClientRect().x +5 + 'px';
	const gameModeInfoView = document.body.querySelector('.gameModeInfoView');
	gameModeInfoView.style['left'] = screenWrap.getBoundingClientRect().x +5 +
	gameSelectView.getBoundingClientRect().width +5 + 'px';
}
// gameModeInfoの挙動設定 (まとめて設定)
const gameModeBtns = [];
for(let i=0; i<gameModeLIST.length; i++) {
	const BTN = document.body.querySelector('#' + gameModeLIST[i]);
	gameModeBtns.push(BTN); // 念の為退避
	// リスナー設定
	BTN.addEventListener('click', gameSelectFunc);
}
function gameSelectFunc(evt) {
	//console.log(this.id);
	const targetBTN = document.body.querySelector(`#${this.id}`);
	if( targetBTN.classList.contains('selected') ) {
		// 選択済みだったら・・・
		document.body.querySelector('#gameStartBtn').dispatchEvent(new Event('click'));
		return;
	}
	// gameModeのハイスコアをロード　　=> ranking.phpを読み込む
	//document.querySelector("iframe.rankingView").contentWindow.location.reload();
	if( this.id === 'TimeTrial2min' ||
		 this.id === 'Servival' ) {
		submitRankingFunc(this.id, null, null, 'score', false);
	}
	else if( this.id === 'dice10Challenge' ) {
		submitRankingFunc(this.id, null, null, 'time', false);
	}
	//
	// gameModeの選択状態のクリア
	for(let i=0; i<gameModeLIST.length; i++) {
		const BTN = document.body.querySelector(`#${gameModeLIST[i]}`);
		BTN.classList.remove('selected');
		const INFO = document.body.querySelector(`.gameModeInfo.${gameModeLIST[i]}`);
		INFO.classList.remove('open');
	}
	// gameModeを選択状態に
	//const targetBTN = document.body.querySelector(`#${this.id}`);
	targetBTN.classList.add('selected');
	const targetINFO = document.body.querySelector(`.gameModeInfo.${this.id}`);
	targetINFO.classList.add('open');
	//
	selectedGameMode = gameModeLIST.indexOf(this.id);
	//console.log('selectedGameMode:::', selectedGameMode);
}
// ゲーム中のdice追加
function addNewDiceOnGame() {
	//console.log('addNewDiceOnGame:::',autoCreateDiceIs);
	//if( !autoCreateDiceIs ) { return; } // autoCreateDiceIsが falaseなら追加処理をしない
	// stageの空き状況の確認
	updataStageMap(); // stageMapの更新
	const emptyPos = selectEmptyPos( stageMap );
	if(!emptyPos) { 
		console.log('ステージが埋め尽くされていました。')
		clearInterval( newDiceINTERVAL_id ); // タイマーをクリア
		return; // 空きマスが無ければ、処理を抜ける
	}
	//
	// Diceを生成
	const tmpDice = new Dice();
	diceList.push( tmpDice );
	tmpDice.putOnStage( document.body.querySelector('.diceWrap') );
	tmpDice.randomSetFace(); // 表示面をランダムに生成
	if(create2DiceIs) {
		tmpDice.setFace(2, 1, 3); // test設定
	}
	//
	tmpDice.deleteLife = 0; // ライフ0から始める
	tmpDice.element.classList.add('BIRTH'); // 生まれたてのdice
	tmpDice.element.classList.add('first');
	//
	// 配置場所をランダムに選択
	// ステージに配置
	tmpDice.setPos(emptyPos[0], emptyPos[1]);
	setTimeout(function() {tmpDice.element.classList.remove('first');}, 1*FRM);
	updataStageMap(); // stageMapの更新
	//
	// diceのせり上がり
	const timerid = tmpDice.timer_id = setInterval(function() {
		tmpDice.deleteLife++;
		if( tmpDice === playersDice ) {
			//console.log('onFocus');
			tmpDice.deleteLife++;
			if( tmpDice.deleteLife >= 320 ) { tmpDice.deleteLife = 320; }
		}
		//
		tmpDice.updataDiceHeightByDeleteLife(); // 高さの更新
		if( tmpDice.deleteLife >= 320 || !tmpDice.element.classList.contains('BIRTH')) {
			//console.log('生まれたよ::::',tmpDice.posX,tmpDice.posY);
			//console.log(tmpDice.element.classList);
			tmpDice.element.classList.remove('BIRTH');
			tmpDice.element.style['transform'] = null;
			//console.log(tmpDice.element.classList);
			clearInterval(timerid);
		}
	},1*FRM);
	/*
	setTimeout(function() {
		tmpDice.element.classList.remove('BIRTH');
		tmpDice.element.classList.add('RISE'); // diceのせり上がり
		setTimeout(function() {
			tmpDice.element.classList.remove('RISE');
		},10*1000);
	},1*FRM);
	*/
}
function getEmptyPosList( MAP ) {
	// 全マスチェック法
	// MAP上の候補地をあげる
	const emptyPosList = [];
	for(let y=0; y<MAP.length; y++) {
		for(let x=0; x<MAP[y].length; x++) {
			if( MAP[y][x] === 0 ) {
				emptyPosList.push([x+1,y+1]);
			}
		}	
	}
	return emptyPosList;
}
//
/* サイコロの位置設定
function setDicePos(posX, posY) {
    const dice_ele = document.body.querySelector('.dice');
    helperOBJ.setCSS(dice_ele, '--posX', posX);
    helperOBJ.setCSS(dice_ele, '--posY', posY);
}
*/
// diceの初期設定
let playersDice = diceList[0];
// playerのfocus
//updataPlayerFocus( playersDice.posX, playersDice.posY )
focusOBJ.setDir( focusOBJ.currentDir );
focusOBJ.setPos( playersDice.posX, playersDice.posY );
//
let canDiceMove = true;
// keyリスナー
window.addEventListener('keydown', keyCheck);
function keyCheck(evt) {
	//console.log(evt.key);
	if(evt.key == 'ArrowLeft' || evt.key == 'ArrowRight' || evt.key == 'ArrowUp' || evt.key == 'ArrowDown') {
		evt.preventDefault();
	}
	else if(createDiceByShiftIs && evt.key == 'Shift') { addNewDiceOnGame(); evt.preventDefault(); return; }
	else if(evt.key == ' ') { evt.preventDefault(); console.log('================'); return; }
	else { return; }
	// if( !canDiceMove ) { return; } // 何もしない <= リクエストはスルーする仕様に変更
	// actionKeyから'Arrow'を抜く
	const direction = (evt.key).slice('Arrow'.length);
	// 操作のチェック
	//controlCheck( direction ) <= focusCheckLoopで要求のチェックをする仕様に変更
	// focusに操作要求を出す
	focusOBJ.requestDir = direction;
}
//
// 操作のチェック
function controlCheck( direction ) {
	//console.log('request:::',direction);
	// forcusで位置取り
	const currentX = helperOBJ.getCSS(focusOBJ.elemt, '--posX', false);
	const currentY = helperOBJ.getCSS(focusOBJ.elemt, '--posY', false);
	//console.log(currentX,currentY);
	// 次のポジション
	let nextX = currentX;
	let nextY = currentY;
	//
	// player focusの向き
	const delta = focusOBJ.turnJudge(direction);
	if( delta !== false ) {
		focusOBJ.rotate( focusOBJ.currentDir + delta ); // focusの回転処理
		return; // focusが進行方向に向いていない時は進行方向の設定のみ
	}
	//
	if( focusOBJ.elemt.classList.contains('TRANSLATE') ||
		!canDiceMove ) { 
		//console.log('request:::',direction,'動作中スルー');
		return false; // 動作中ならスルー
	}
	// 操作のチェック
	switch( direction ) {
		case 'Left' :
			if(currentX === 1) { return; }
			nextX = currentX > 1 ? currentX-1 : 1;
		break;
		case 'Right' :
			if(currentX === stagePosX_MAX) { return; }
			nextX = (currentX+1 < stagePosX_MAX) ? currentX+1 : stagePosX_MAX;
		break;
		case 'Up' :
			if(currentY === 1) { return; }
			nextY = currentY > 1 ? currentY-1 : 1;
		break;
		case 'Down' :
			if(currentY === stagePosY_MAX) { return; }
			nextY = (currentY+1 < stagePosY_MAX) ? currentY+1 : stagePosY_MAX;
		break;
	}
	//
	// focusの現在の立ち位置 と 次の高さ (通常dice:100, 床:0)
	const currentDice = getDiceByPosition( currentX, currentY );
	const currentHeight = focusOBJ.height;
	const nextDice = getDiceByPosition( nextX, nextY );
	const nextHeight = ( nextDice != false ) ? nextDice.height : 0;
	const differenceHeight = Math.abs(nextHeight) - Math.abs(currentHeight);
	const limitHEIGHT = 60;
	//
	/*
	console.log('current:::',currentHeight,currentDice);
	console.log('next::::::',nextHeight,nextDice);
	console.log('differenceHeight:::',differenceHeight)
	*/
	// mapのチェック
	currentFace_global = `Map:${stageMap[currentY-1][currentX-1]},H:${currentHeight},F:${currentDice!=false?currentDice.getTopFace():0}`;
	nextFace_global = `Map:${stageMap[nextY-1][nextX-1]},H:${nextHeight},F:${nextDice!=false?nextDice.getTopFace():0}`;
	//
	//updataStageMap();
	// console.log('currentMap:::',stageMap[currentY-1][currentX-1]);
	// console.log('nextMap:::',stageMap[nextY-1][nextX-1]);
	// 移動パターンをチェック
	let diceRollIS = false; // diceを転がすかどうか
	// 次のマスの状態で場合分け
	if( stageMap[nextY-1][nextX-1] < 0 ) { // 次がDELETE
		if( stageMap[currentY-1][currentX-1] > 0 ) { // 今がdice
			// BIRTHなら転がせないので処理を抜ける
			if(currentDice.element.classList.contains('BIRTH')) { return; }
			// 次のDELETEの高さが指定以下なら
			if( nextHeight <= 75 ) { // 圧し潰し可能の高さ
				// diceの圧し潰し処理
				nextDice.crushDice(); // 次のDELETE diceを床にする
				deleteDiceAtDiceList(nextDice); // リストからdiceの削除
				// diceの転がし処理 = playersDiceの変更なし
				canDiceMove = false;
				// Diceに移動先位置の反映
				playersDice.posX = nextX;
				playersDice.posY = nextY;
				// faceの回転設定
				playersDice.rotateMove( direction );
				//　playerFocus位置の更新
				focusOBJ.translate( nextX, nextY ); // playerFocus位置の移動処理
				// 実際のdice操作
				diceControlByPlayer( direction );
				//
				diceRollIS = true; // 転がった
			}
		}
		else if( stageMap[currentY-1][currentX-1] < 0 ) { // 今がDELETE
			//console.log('DELETE間移動');
			// DELETE上なら高さの差があっても移動可とする = playersDiceの入れ替えあり
			focusOBJ.translate( nextX, nextY ); // playerFocus位置の移動処理　
			//
			// 飛び降りの高さの変更タイミングを遅らせる
			if( differenceHeight < 0 ) {
				setTimeout( function() {
					if( nextDice != false ){
						playersDice = nextDice;
					}
					playersDice.posX = nextX;
					playersDice.posY = nextY;
				}, 6*FRM);
			}
			else {
				if( nextDice != false ){
					playersDice = nextDice;
				}
			}
		}
		else if( stageMap[currentY-1][currentX-1] == 0 ) { // 今が床
			// 高さの差がlimit以下なら単純にfocusの移動(登れる) = playersDiceの入れ替えあり
			//console.log('登れる?');
			if( Math.abs(differenceHeight) <= limitHEIGHT ) {
				//console.log('登れた。',nextHeight);
				focusOBJ.translate( nextX, nextY ); // playerFocus位置の移動処理
				//focusOBJ.updataFocusHeight(nextHeight); // playerFocusの高さ更新
				if( nextDice != false ){
					playersDice = nextDice;
				}
				//currentView.updata(nextDice); // 現在のdice状態表示の更新
			}
		}
	}
	else if( stageMap[nextY-1][nextX-1] > 0 ) { // 次がdice
		//console.log('next is Dice');
		// 今の位置がどこでも、高さの差がlimit以下なら単純にfocusの移動(登り下り可)
		if( Math.abs(differenceHeight) <= limitHEIGHT ) { // 高低差が　limit以下
			// diceの乗り換え = playersDiceの変更あり
			//console.log('under limit');
			focusOBJ.translate( nextX, nextY ); // playerFocus位置の移動処理　
			//focusOBJ.updataFocusHeight(nextHeight); // playerFocusの高さ更新
			if( nextDice != false ){
				playersDice = nextDice;
			}
			if(differenceHeight < 0) {
				focusOBJ.heightIsValiable = false;
				// 飛び降り時の高さの変更タイミングを遅らせる　<- 即時高さの調整をするとdiceに埋まるので
				setTimeout( function() {
					focusOBJ.heightIsValiable = true;
				}, 6*FRM);
			}
			//currentView.updata(playersDice); // 現在のdice状態表示の更新
		}
		else if( differenceHeight > 0 ) { // 高低差がlimitより高く、相手が高く進行方向の1つ奥が床なら...
			// diceを押せるなら、圧した後に隙間ができるので、床に落ちる = playersDiceの変更あり(床に)
			//console.log('slide Move');
			// 向こう側を取得
			let overX = nextX;
			let overY = nextY;
			switch( direction ) {
				case 'Left' :
					if(nextX === 1) { return; }
					overX = nextX > 1 ? nextX-1 : 1;
				break;
				case 'Right' :
					if(nextX === stagePosX_MAX) { return; }
					overX = (nextX+1 < stagePosX_MAX) ? nextX+1 : stagePosX_MAX;
				break;
				case 'Up' :
					if(nextY === 1) { return; }
					overY = nextY > 1 ? nextY-1 : 1;
				break;
				case 'Down' :
					if(nextY === stagePosY_MAX) { return; }
					overY = (nextY+1 < stagePosY_MAX) ? nextY+1 : stagePosY_MAX;
				break;
			}
			//
			if( stageMap[overY-1][overX-1] != 0 ) { // 進行方向の1つ奥が床じゃなければ処理を抜ける
				//console.log('向こうはdiceづまり');
				return;
			}
			// 押し込み処理
			canDiceMove = false;
			//　playerFocus位置の更新
			focusOBJ.translate( nextX, nextY ); // playerFocus位置の移動処理
			//focusOBJ.updataFocusHeight(0); // playerFocusの高さ更新
			// 実際のdice操作
			nextDice.setPos( overX, overY ); // 押し込んだdiceの移動
			//
			playersDice = floorDice; // 床に設定
			playersDice.posX = nextX;
			playersDice.posY = nextY;
			//
			// 実際diceの操作
			setTimeout(function(){
				// 後始末
				canDiceMove = true;
				// 移動後Mapの更新
				updataStageMap();
				// 消し込みチェック
				const targetFACE = nextDice.getTopFace();
				deleteDiceAtList( buildLinkDiceList( nextDice ) , targetFACE );
				updataStageMap(); // ステージMapの更新
			}, 600);
		}
		else if( differenceHeight < 0 ) { // 高低差がlimitより高く、相手が低いBIRTHなら...
			// diceを転がした際に位置を入れ替える
			// 自分がDELETEなら処理を抜ける
			if( currentDice.element.classList.contains('DELETE')) { return; }
			// BIRTHじゃないので処理を抜ける
			if(!nextDice.element.classList.contains('BIRTH')) { return; }
			// nextDiceの位置を替える
			nextDice.element.style['transition-duration'] = '0s';
			setTimeout(function() {
				nextDice.setPos(currentX, currentY);
			}, 300);
			setTimeout(function() {
				nextDice.element.style['transition-duration'] = null;
			}, 300+1*FRM);
			// currentDiceの転がし処理
			canDiceMove = false;
			// Diceに移動先位置の反映
			playersDice.posX = nextX;
			playersDice.posY = nextY;
			// faceの回転設定
			playersDice.rotateMove( direction );
			//　playerFocus位置の更新
			focusOBJ.translate( nextX, nextY ); // playerFocus位置の移動処理
			//focusOBJ.updataFocusHeight(nextHeight); // playerFocusの高さ更新
			// 実際のdice操作
			diceControlByPlayer( direction );
			//
			diceRollIS = true; // 転がった
		}
	}
	else { // 次が床
		if( stageMap[currentY-1][currentX-1] > 0 ) { // 今がdice上なら = playerDice変更なし
			// BIRTHなら転がせないので処理を抜ける
			if(currentDice.element.classList.contains('BIRTH')) { return; }
			// diceの転がし処理
			canDiceMove = false;
			// Diceに移動先位置の反映
			playersDice.posX = nextX;
			playersDice.posY = nextY;
			// faceの回転設定
			playersDice.rotateMove( direction );
			//　playerFocus位置の更新
			focusOBJ.translate( nextX, nextY ); // playerFocus位置の移動処理
			//focusOBJ.updataFocusHeight(nextHeight); // playerFocusの高さ更新
			// 実際のdice操作
			diceControlByPlayer( direction );
			//
			diceRollIS = true; // 転がった
		}
		else if( stageMap[currentY-1][currentX-1] < 0 ) { // 今がDELETE上なら = playersDiceを床に変更
			//console.log('飛び降り?');
			// 高さの差が指定以下ならfocusの単純移動
			if( Math.abs(differenceHeight) <= 75 ) { // 飛び降り可能を75以下に
				//console.log('飛び降りれた。',nextHeight);
				playersDice = floorDice; // playersDiceの更新
				playersDice.posX = nextX;
				playersDice.posY = nextY;
				focusOBJ.translate( nextX, nextY ); // playerFocus位置の移動処理　の設定
				focusOBJ.heightIsValiable = false;
				//focusOBJ.updataFocusHeight(nextHeight); // playerFocusの高さ更新
				//
				// 飛び降り時の高さの変更タイミングを遅らせる　<- 即時高さの調整をするとdiceに埋まるので
				setTimeout( function() {
					focusOBJ.heightIsValiable = true;
				}, 200);
			}
		}
		else if( stageMap[currentY-1][currentX-1] === 0 ) { // 今が床なら = playersDiceの変更なし
			// focusの単純移動
			focusOBJ.translate( nextX, nextY ); // playerFocus位置の移動処理　
			//focusOBJ.updataFocusHeight(nextHeight); // playerFocusの高さ更新
			
			playersDice.posX = nextX;
			playersDice.posY = nextY;
		}
	}
	// 転がさない時はまとめて現在のdice表示を更新
	if(!diceRollIS) {
		currentView.updata(playersDice); // 現在のdice状態表示の更新
	}
} 
//
// ステージ上の指定ポジションにあるdiceを取得
function getDiceByPosition( posX, posY ) {
	//console.log('getDiceByPosition',posX,posY);
	for(const tmpDice of diceList) {
		if( tmpDice.posX == posX && tmpDice.posY == posY ) {
			return tmpDice;
		}
	}
	return false;
}
// diceにplayerの操作を伝える
function diceControlByPlayer( direction ) {
	//console.log('サイコロ転がし始め');
	// diceの実際の動き
	const dice = playersDice; // 呼び出し時のplayersDiceで処理をする
	//
	const duration = 500; //  transitionの時間(ms)
	dice.element.style['transition-duration'] = `${duration}ms`;
	dice.element.style['transition-delay'] = `${200}ms`;
	dice.element.classList.add(direction); // モーションのクラス設定
	//
	// currentViewの表示
	const currentViewDice_ele = currentView.dice.element;
	currentViewDice_ele.style['transition-duration'] = `${duration}ms`;
	currentViewDice_ele.style['transition-delay'] = `${200}ms`;
	currentViewDice_ele.classList.add('notMove'); // モーションのクラス設定
	currentViewDice_ele.classList.add(direction); // モーションのクラス設定
	//
	setTimeout(function(){
		//console.log('サイコロ転がし終わり');
		// 後始末
		dice.element.style['transition-duration'] = '0s'; // 単純な入れ替え用にdurationを0に
		dice.element.style['transition-delay'] = `${0}ms`;
		dice.setPos(dice.posX, dice.posY);
		dice.element.classList.remove(direction);
		dice.updataFace(); // Dice面の更新
		canDiceMove = true;
		// 移動後Mapの更新
		updataStageMap();
		//
		// currentViewの表示
		currentViewDice_ele.style['transition-duration'] = `0s`;
		currentViewDice_ele.style['transition-delay'] = `${0}ms`;
		currentViewDice_ele.classList.remove(direction); // モーションのクラス設定
		//
		currentView.updata(playersDice); // 現在のdice状態表示の更新
		//
		setTimeout(function() {
			// 消し込みチェック
			const targetFACE = dice.getTopFace();
			//console.log('playersDice:::',dice.posX,dice.posY);
			deleteDiceAtList( buildLinkDiceList( dice ) , targetFACE );
			updataStageMap(); // ステージMapの更新
		}, 1*FPS); // 対症療法( 動きの設定が残るので少し間をとる)
	}, duration);
	//
}
// mapをチェックして、消し込み候補のdiceをリスト化
function buildLinkDiceList( DICE ) {
	// 新規チェックになるので、playersDiceを起点に確認 => 汎用性を持たせて引数にdiceを指定
	const linkDiceList = []; // 起点からのつながっているDiceのリスト <- あとで数をチェックする
	const checkedMap = [
		[false, false, false, false],
		[false, false, false, false],
		[false, false, false, false],
		[false, false, false, false],
		]; // チェック済みのMap
	const targetFACE = DICE.getTopFace(); // 起点の top face
	if( targetFACE === 0 ) { return []; } // 床の時は、処理なし
	else if( targetFACE === 1 ) { // top faceが1の時の処理
		// 上下左右で消し込み中のdiceに接していれば...
		const targetX = DICE.posX -1;
		const targetY = DICE.posY -1;
		//
		let flg = false;
		if( targetY-1 >= 0 && stageMap[targetY-1][targetX] < 0 ) { flg = true; }
		if( targetY+1 < stageMap.length && stageMap[targetY+1][targetX] < 0 ) { flg = true; }
		if( targetX-1 >= 0 &&  stageMap[targetY][targetX-1] < 0 ) { flg = true; }
		if( targetX+1 < stageMap[1].length && stageMap[targetY][targetX+1] < 0 ) { flg = true; }
		//
		// 起点以外でtop faceが1のdice全部
		if(flg) {
			for(let _Y=0; _Y<stageMap.length; _Y++) {
				for(let _X=0; _X<stageMap[_Y].length; _X++) {
					if( 1 === Math.abs(stageMap[_Y][_X]) && 
						(_X != DICE.posX-1 || _Y != DICE.posY-1 )) {
						linkDiceList.push([_X+1,_Y+1]);
					}
				}
			}
		}
	}
	else { // 1以外の処理
		makeLinkDiceList( targetFACE, DICE.posX-1, DICE.posY-1 ); // linkDiceListの生成
	}
	//console.log(`linkDiceList at ${targetFACE}::::${linkDiceList}`);
	checkedMapHTML = `
				<div class="viewVal">${checkedMap[0]}</div>
				<div class="viewVal">${checkedMap[1]}</div>
				<div class="viewVal">${checkedMap[2]}</div>
				<div class="viewVal">${checkedMap[3]}</div>
				<div class="viewVal">${linkDiceList}</div>
				<div class="viewVal">++++++++++++++</div>
				`;
	// console.log('targetFACE:::',targetFACE);
	// // for(let i=0;i<4;i++) {
	// // 	console.log(checkedMap[i]);
	// // }
	// console.log('================');
	// for(let i=0;i<4;i++) {
	// 	console.log(stageMap[i]);
	// }
	// console.log('================');
	return linkDiceList;
	//
	// linkDiceListを回帰処理で生成
	function makeLinkDiceList(topface, _X, _Y) {
		//console.log('makeLinkDiceList:::',_X,_Y);
		// チェック済みにマーク
		checkedMap[_Y][_X] = true;
		// 消し込み対象になるかチェック
		// 消し込み中のマークとして、top faceをマイナス値にしているので、絶対値で検査
		if( topface === Math.abs(stageMap[_Y][_X]) ) {
			// 天面の数字があっているのでリストに追加
			linkDiceList.push([_X+1,_Y+1]);
		}
		else {
			// 繋がりが切れているので、チェックを抜ける
			return;
		}
		// 
		// 上下左右にチェックをだす。
		// 上 : stageMap[_Y-1][_X]
		if( _Y-1 >= 0 ) {
			if( checkedMap[_Y-1][_X] !== true ) {
				makeLinkDiceList(topface, _X, _Y-1);
			}
		}
		// 下 : stageMap[_Y+1][_X]
		if( _Y+1 < stagePosY_MAX) {
			if(checkedMap[_Y+1][_X] !== true ) {
				makeLinkDiceList(topface, _X, _Y+1);
			}
		}
		// 左 : stageMap[_Y][_X-1]
		if( _X-1 >= 0 ) {
			if( checkedMap[_Y][_X-1] !== true ) {
				makeLinkDiceList(topface, _X-1, _Y);
			}
		}
		// 右 : stageMap[_Y][_X+1]
		if( _X+1 < stagePosX_MAX ) {
			if( checkedMap[_Y][_X+1] !== true ) {
				makeLinkDiceList(topface, _X+1, _Y);
			}
		}
	}
	//
}
//
// 消し込み処理
function deleteDiceAtList( LIST, targetFACE ) {
	// top face(targetFACE)の数字以上つながっていれば消し込み発動（1の時は別処理）
	let chainIs = false;
	if( LIST.length < targetFACE ) { return; } // 規定数に満たなければ、何もしない
	//
	// 消し込み中のマークとして、top faceをマイナス値にする
	//console.log('削除発動:::',LIST);
	for(const temp of LIST) {
		const tmpDice = getDiceByPosition( temp[0], temp[1] );
		//console.log('delete:::',tmpDice);
		if( tmpDice === false ) { console.log('continue'); continue; }
		if( tmpDice.element.classList.contains('DELETE') ) {
			// リスト内にDELETE付きが含まれていたら連鎖中
			chainIs = true;
			// DELETE diceまたは、該当無しだった場合は次のチェックへ
			continue;
		}
		// 新しく消し込みdiceが見つかってきたら...
		if( tmpDice.element.classList.contains('BIRTH') ) {
			tmpDice.element.classList.remove('BIRTH'); // 誕生ダイスのclassを削除
		}
		tmpDice.element.classList.add('DELETE');
		tmpDice.element.classList.add('FLASH');
		// 消すdiceの加算
		deleteNumList[ targetFACE - 1 ] += 1;
		//
		setTimeout(function(evt){
			tmpDice.element.classList.remove('FLASH'); // 消し込み演出で光らせる
		}, 4*FRM);
		tmpDice.surface['Top']['face'] = -1*( targetFACE ); // 消し込みの目印

		tmpDice.element.style['transition-duration'] = null; // 移動時につけた duration設定が邪魔
		//console.log('deleteProc:::', tmpDice);
		/*
		setTimeout(function(){ <= dice寿命をチェックするカタチに変更したので不要?
			// 後始末
			deleteDice(tmpDice); // diceの削除
			//tmpDice.element.classList.remove('DELETE'); 
			updataStageMap();
		}, 10000);
		*/
		clearInterval( tmpDice.timerid );
		tmpDice.element.style['transition'] = 'none'; // 既定のtransitionを除去
		const timer_id =tmpDice.timerid = setInterval(function() {
			if( tmpDice.downDeleteLife() ) { // downDeleteLife:diceの寿命が尽きたら、trueを返す。
				console.log('delete');
				// 後始末
				clearInterval(timer_id); // タイマーのクリア
				deleteDiceAtDiceList(tmpDice); // diceの削除
				tmpDice.element.classList.remove('DELETE');
				updataStageMap();
			}
		}, 1*FRM);
	}
	// 連鎖 diceの加算
	if(chainIs) {
		chainNumList[ targetFACE - 1 ] += 1;
		// 連鎖中のdiceの高さチェック
		for(const temp of LIST) {
			const tmpDice = getDiceByPosition( temp[0], temp[1] );
			// 連鎖が起きれば、DElETEの寿命を延ばしたい。　<= 済
			// 沈んでいく処理をTimerで対応するべき?　<= 済
			// 初期値：100pxを10sで沈む設定
			// 32FRM * 10 フレーム => deleteLife 320としてみる　<= 済
			// DELETEが始まってから 1づつ減少させる。　<= 済
			// 連鎖が起きると10回復する?　<= 済　<= 回復レートは要検討
			if(tmpDice != false) {
				tmpDice.upDeleteLife();
			}
		}
		// chain表示
		const chainView = document.body.querySelector('.chainView');
		chainView.classList.remove('out');
		chainView.classList.add('in');
		chainView.textContent = chainNumList[ targetFACE - 1 ] + 'chain';

		setTimeout(function(){ 
			chainView.classList.add('out');
			chainView.classList.remove('in');
		 },200);
	}
	else {

		// 連鎖が途切れたので、maxChainを確認
		if( maxChainList[ targetFACE - 1 ] < chainNumList[ targetFACE - 1 ] ) {
			maxChainList[ targetFACE - 1 ] = chainNumList[ targetFACE - 1 ]; // maxChainを更新
		}
		chainNumList[ targetFACE - 1 ] = 0; // リストにDELETEが含まれていなければ、リセット　<=分割連鎖には対応していない
	}
	//
	// 点数加算
	usrScore += targetFACE * LIST.length * ( chainNumList[ targetFACE - 1 ] + 1 );
	//
	// ゲーム状態表示 HTML
	deleteInfoHTML = `<div class="viewVal">list:::::::::01,02,03,04,05,06</div>`;
	deleteInfoHTML += `<div class="viewVal">maxC:::::`+String(maxChainList[0]).padStart(2,'0');
	for(let i=1; i<maxChainList.length; i++) {
		deleteInfoHTML += ','+String(maxChainList[i]).padStart(2,'0');
	}
	deleteInfoHTML += `<div class="viewVal">chain:::::`+String(chainNumList[0]).padStart(2,'0');
	for(let i=1; i<chainNumList.length; i++) {
		deleteInfoHTML += ','+String(chainNumList[i]).padStart(2,'0');
	}
	deleteInfoHTML += '</div>';
	deleteInfoHTML += `<div class="viewVal">delete:::`+String(deleteNumList[0]).padStart(2,'0');
	for(let i=1; i<deleteNumList.length; i++) {
		deleteInfoHTML += ','+String(deleteNumList[i]).padStart(2,'0');
	}
	deleteInfoHTML += '</div>';
	//

	//
}
function deleteDiceAtDiceList( targetDice ) { // リストと実体のtargetDiceを削除する
	const index = diceList.indexOf(targetDice);
	if(index != -1) {
		diceList.splice(index,1); // リストからtargeDiceを抜く
		targetDice.deleteDice(); // targetDiceの削除処理
	}
	else {
		console.log('リストに無い');
	}
	//console.log('diceList:::',diceList);
}
//
// GAME start
const gameRules = { // ゲーム条件
	createDiceDuration : 5000,
	createDiceByShift : false,
	createDiceTop2 : false,
	allDeleteIsClear : false,
	limitTime : 2*60*1000,
	startDiceNum : 6,
	starPos : [2,2],
	veiwStatus : true,
	viewViewContorol : true,
	viewScore : true,
	veiwTimer : true,
	recordIs : false,
}
function gameStartFunc( MODE ) {
	console.log('gameStartFunc');
	const mode = gameModeLIST[MODE];
	document.body.querySelector('.gameModeView').textContent = mode;
	document.body.querySelector('.gameModeView').classList.add('open');
	// ゲームルールの設定
	switch( mode ) {
		case 'DebugMode': 
			gameRules['createDiceDuration'] = -1;
			gameRules['createDiceByShift'] = true;
			gameRules['createDiceTop2'] = false;
			gameRules['allDeleteIsClear'] = false;
			gameRules['limitTime'] = 0; //
			gameRules['startDiceNum'] = 0;
			gameRules['starPos'] = [2,2];
			gameRules['veiwStatus'] = true;
			gameRules['viewViewContorol'] = true;
			gameRules['viewScore'] = true;
			gameRules['viewTimer'] = true;
			gameRules['recordIs'] = false;
		break;
		case 'TimeTrial2min': 
			gameRules['createDiceDuration'] = 5*1000;
			gameRules['createDiceByShift'] = false;
			gameRules['createDiceTop2'] = false;
			gameRules['allDeleteIsClear'] = false;
			gameRules['limitTime'] = 2*60*1000;
			gameRules['startDiceNum'] = 6;
			gameRules['starPos'] = -1;
			gameRules['veiwStatus'] = false;
			gameRules['viewViewContorol'] = false;
			gameRules['viewScore'] = true;
			gameRules['viewTimer'] = true;
			gameRules['recordIs'] = 'score';
		break;
		case 'Servival': 
			gameRules['createDiceDuration'] = 10*1000;
			gameRules['createDiceByShift'] = false;
			gameRules['createDiceTop2'] = false;
			gameRules['allDeleteIsClear'] = false;
			gameRules['limitTime'] = 0;
			gameRules['startDiceNum'] = 6;
			gameRules['starPos'] = -1;
			gameRules['veiwStatus'] = false;
			gameRules['viewViewContorol'] = false;
			gameRules['viewScore'] = true;
			gameRules['viewTimer'] = true;
			gameRules['recordIs'] = 'score';
		break;
		case 'dice10Challenge': 
			gameRules['createDiceDuration'] = -1;
			gameRules['createDiceByShift'] = false;
			gameRules['createDiceTop2'] = false;
			gameRules['allDeleteIsClear'] = true;
			gameRules['limitTime'] = 0;
			gameRules['startDiceNum'] = 10;
			gameRules['starPos'] = -1;
			gameRules['veiwStatus'] = false;
			gameRules['viewViewContorol'] = false;
			gameRules['viewScore'] = true;
			gameRules['viewTimer'] = true;
			gameRules['recordIs'] = 'time';
		break;
		case 'practice': 
			gameRules['createDiceDuration'] = -1;
			gameRules['createDiceByShift'] = true;
			gameRules['createDiceTop2'] = false;
			gameRules['allDeleteIsClear'] = false;
			gameRules['limitTime'] = -1;
			gameRules['startDiceNum'] = 6;
			gameRules['starPos'] = -1;
			gameRules['veiwStatus'] = false;
			gameRules['viewViewContorol'] = false;
			gameRules['viewScore'] = true;
			gameRules['viewTimer'] = false;
			gameRules['recordIs'] = false;
		break;
	}
	// ゲームの初期化
	setGameInitByRules();
	// ループの設置
}
// ゲームルールに沿ってゲームの初期化
function setGameInitByRules( RETRY = false ) {
	console.log('setGameInitByRules');
	// タイマーのクリア
	clearInterval(newDiceINTERVAL_id);
	// 得点の初期化
	usrScore = 0;
	viewScore = 0;
	// 得点表示の初期化
	const scoreView = document.body.querySelector('.scoreView .gameText');
	scoreView.textContent = String(viewScore).padStart(10,0);
	// 表示の設定
	gameViewByRules();
	// diceの初期配置
	if(RETRY && 
		(selectedGameMode === 1 || selectedGameMode === 2 || selectedGameMode === 3) ) {
		loadDicePosByBackup(); // バックアップから読み込み
	}
	else {
		setStartDiceByRules(); // 新規配置&配置をバックアップする
	}
	// focusのスタート位置
	setFocusPosByRules();
	// ゲームの挙動に関する設定
	// diceの自動生成
	const autoCreateDiceBox5s = document.body.querySelector('#autoCreateDiceBox5s');
	const autoCreateDiceBox10s = document.body.querySelector('#autoCreateDiceBox10s');
	autoCreateDiceBox5s.checked = false;
	autoCreateDiceBox10s.checked = false;
	if( gameRules['createDiceDuration'] === 5*1000 ) {
		autoCreateDiceBox5s.checked = true;
	}
	else if( gameRules['createDiceDuration'] === 10*1000 ) {
		autoCreateDiceBox10s.checked = true;
	}
	// ゲーム開始時に設定時間が-1でなければ、newDiceINTERVAL_id = setInterval( addNewDiceOnGame, gameRules['createDiceDuration'] );
	// shiftでdice生成
	const createDiceByShiftBox = document.body.querySelector('#createDiceByShiftBox');
	createDiceByShiftBox.checked = gameRules['createDiceByShift'];
	createDiceByShiftIs = gameRules['createDiceByShift'];
	// 生成diceの天面を2にする設定
	const create2DiceBox = document.body.querySelector('#create2DiceBox');
	create2DiceBox.checked = gameRules['createDiceTop2'];
	create2DiceIs = gameRules['createDiceTop2'];
	// limitTimeの設定
	// gameRules['limitTime'] = 0:カウントアップ,-1:時間設定なし,0以上ならカウントダウン
	timerOBJ.viewUpdata('00:00.000');
	timerOBJ.timeLimit = gameRules['limitTime'];
	if( gameRules['limitTime'] > 0 ) {
		const LIMIT = gameRules['limitTime'];
		const min = String(Math.floor(gameRules['limitTime']/(60*1000))).padStart(2,0);
		const sec = String(Math.floor(gameRules['limitTime']/1000)%60).padStart(2,0);
		const ms = String(gameRules['limitTime']%1000).padStart(3,0);
		//console.log('limit:::', min, sec, ms);
		timerOBJ.viewUpdata(`${min}:${sec}.${ms}`);
	}
	//
	// ゲーム開始表示
	gamingViewFunc();
	//
	// ゲームスタート待ち
	window.addEventListener('keydown', function (evt) {
		//console.log(evt.key);
		// if(evt.key == 'ArrowLeft' || evt.key == 'ArrowRight' || evt.key == 'ArrowUp' || evt.key == 'ArrowDown') {
			if( gameRules['limitTime'] >= 0 ) {
				console.log('timerCheck');
				timerOBJ.start(); // タイマースタート
			}
			if( gameRules['createDiceDuration'] > 0 ) {
				//console.log(gameRules['createDiceDuration']);
				newDiceINTERVAL_id = setInterval( addNewDiceOnGame, gameRules['createDiceDuration'] ); // dice自動生成タイマーのスタート
			}
			// giveupボタンの表示
			document.body.querySelector('#giveupBtn').style['display'] = null;
			// fucusの監視ループ
			focusCheckLoop_id = setInterval(focusCheckLoop, 1*FRM);
			evt.preventDefault();
		// }
	}, {once: true});
}
function gameViewByRules() {
	// 状態ウィンドウ
	const controlView = document.body.querySelector('.controlView');
	if(gameRules['veiwStatus']) {
		controlView.classList.add('open');
	}
	else { controlView.classList.remove('open'); }
	// 表示操作類
	const viewControlsView = document.body.querySelector('.viewControlsView');
	if(gameRules['viewViewContorol']) {
		viewControlsView.classList.add('open');
	}
	else { viewControlsView.classList.remove('open'); }
	// スコア
	const hiScoreView = document.body.querySelector('.hiScoreView');
	const scoreView = document.body.querySelector('.scoreView');
	if(gameRules['viewScore']) {
		hiScoreView.style['display'] = null;
		scoreView.style['display'] = null;
	}
	else { 
		hiScoreView.style['display'] = 'none';
		scoreView.style['display'] = 'none';
	}
	// タイマー
	const timeView = document.body.querySelector('.timeView');
	if(gameRules['viewTimer']) {
		timeView.style['display'] = null;
	}
	else { 
		timeView.style['display'] = 'none';
	}
}
function setStartDiceByRules() {
	// ステージのリセット
	resetStage();
	//
	if( gameRules['startDiceNum'] <= 0 ) { return; }
	//
	while( diceList.length < gameRules['startDiceNum'] ) {
		const tmpDice = new Dice();
		diceList.push( tmpDice );
		tmpDice.putOnStage( document.body.querySelector('.diceWrap') );
		tmpDice.randomSetFace();
	}
	//
	// ランダム配置
	for(const dice of diceList) {
		updataStageMap(); // stageMapの更新
		let selectedPos = selectEmptyPos( stageMap );
		let count = 0;
		while( !selectedPos ) {
			count++;
			if( count>stageMap.length * stageMap[0].length ) {
				console.log('候補地エラー');
				break;
			}
			selectedPos = selectEmptyPos( stageMap );
		}
		if( !selectedPos ) { break; } // 生成せずにループを抜ける
		dice.setPos(selectedPos[0], selectedPos[1]);
		updataStageMap(); // stageMapの更新
		//
	}
	// バックアップ
	backupDicesInfoFunc( diceList );
	//
}
function loadDicePosByBackup() {
	// ステージのリセット
	resetStage();
	// dice配置をbackupから読み込み
	for( let i=0; i<backupDicesInfo.length; i++ ) {
		const tmpDice = new Dice();
		diceList[i] =  tmpDice;
		tmpDice.putOnStage( document.body.querySelector('.diceWrap') );
		tmpDice.setFace(
			backupDicesInfo[i]['topNum'],
			backupDicesInfo[i]['rightNum'],
			backupDicesInfo[i]['downNum'],
		);
		tmpDice.setPos( backupDicesInfo[i]['posX'], backupDicesInfo[i]['posY'] );
	}
	updataStageMap(); // stageMapの更新
}
function setFocusPosByRules() {
	let posX = 0;
	let posY = 0;
	if(gameRules['starPos'] === -1){
		playersDice = diceList[0];
		focusOBJ.setDir( focusOBJ.currentDir = 135 );
		posX = playersDice.posX;
		posY = playersDice.posY;
	}
	else {
		playersDice = floorDice;
		posX = gameRules['starPos'][0];
		posY = gameRules['starPos'][1];
	}
	focusOBJ.setPos(posX, posY);
	// 足元チェック
	const footDice = getDiceByPosition(focusOBJ.posX,focusOBJ.posY);
	focusFootCheck( footDice ); 
}
// ゲームクリア判定
function judgeGameClearByRules() { // ゲームクリアならtrueを返す
	//console.log('judgeGameClearByRules:::',gameRules['allDeleteIsClear']);
	let flg = false;
	// クリア条件:全消し
	if( gameRules['allDeleteIsClear'] ) {
		//console.log('check:allDeleteIsClear');
		flg = true;
		// ステージ上が全て0 or -値
		for(let i=0; i<stageMap.length; i++){
			for(let j=0; j<stageMap[i].length; j++){
				if( stageMap[i][j] > 0 ) { flg = false; break;} // 生きたdice発見
			}
			if(!flg) { break; } // 生きたdiceが見つかっていれば、ループを抜ける
		}
	}
	//
	return flg;
}
// ゲームオーバー判定
function judgeGameOverByRules() { // ゲームオーバーならtrueを返す
	let flg = false;
	// タイムアップ
	if( timerOBJ.timeUpIs ) { return true; }
	//
	// 床が埋まっている
	// ステージ上が全てがdice(+値)
	flg = true;
	let livingDiceCount = 0;
	let livingDiceTopFaces =[0,0,0,0,0,0];
	for(let i=0; i<stageMap.length; i++){
		for(let j=0; j<stageMap[i].length; j++){
			if( stageMap[i][j] <= 0 ) {
				flg = false; // 空白 or DLETE
			}
			else {
				livingDiceCount++; // 生きたdiceのカウント
				livingDiceTopFaces[stageMap[i][j]-1] += 1; // topFaceが同じものをカウント
			}
		}
	}
	//
	if(flg) { return flg; }
	//
	/* クリア不能条件
	if(gameRules['createDiceDuration'] === -1 && !gameRules['createDiceByShift']) { // 追加diceの設定が無い状態
		// diceが1つになってしまった。DELETEが無い状態で
		if(livingDiceCount === 1) { return true; }
		// 床に落ちてしまった。
		if(focusOBJ.height === 0) {
			console.log('onFloorCheck:::',livingDiceTopFaces);
			// diceの天面の数が合わない場合
			flg = true;
			for(let i=1; i<livingDiceTopFaces.length; i++) {
				if( i+1 < livingDiceTopFaces[i] ) {
					flg = false;
					break; // 消せる可能性がるので、ループを抜ける
				}
			}
			if(flg) { return flg; }
		}
	}
	*/
	return false;
}
// ゲーム終了処理
function gemeEndFunc(clear, over, MES = null) {
	// 各タイマーのストップ
	timerOBJ.stop();
	clearInterval( newDiceINTERVAL_id );
	clearInterval( focusCheckLoop_id );
	// giveupボタンの非表示
	document.body.querySelector('#giveupBtn').style['display'] = 'none';
	// 表示設定
	gameoverViewFunc();
	// メッセージ表示
	const gameoverView = document.body.querySelector('.gameoverView');
	if(MES === null) {
		if(clear) { MES = 'Clear!!'; }
		else { MES = 'GAME OVER'; }
	}
	gameoverView.querySelector('.viewText').textContent = MES;
	// メニュー
	// ranking可能状態の指定
	if( clear || // ゲームクリア時
		(over && selectedGameMode === 1) || // TimeTrial2minをやり切った
		selectedGameMode === 2 // Servivalモードはギブアップでも
		) {
		document.body.querySelector('#rankingBtn').disabled = false;
	}
	setTimeout(function() {
		gameoverView.classList.add('open');
	}, 800);
}
// GAME loop
function gameLoop( phase ) {
	switch( phase ) {
		case 'init' : break;
		case 'title' : break;
		case 'onGame' : break;
		case 'judge' : break;
		case 'gameOver' : break;
	}
}
//focusCheckLoop_id = setInterval(focusCheckLoop, 1*FRM);
function focusFootCheck( footDice ) {
	// 足元のチェック
	//console.log('focusOBJ:::',focusOBJ.posX,focusOBJ.posY);
	//const footDice = getDiceByPosition(focusOBJ.posX,focusOBJ.posY);
	if( footDice != false ) { // focusとdiceが重なっていたら、
		playersDice = footDice;
		currentView.updata(playersDice);
	}
	//console.log('dice height:::', playersDice.getDiceHeightByDeleteLife() );
	// focusの高さをplayersDice の高さに合わせる
	if( focusOBJ.heightIsValiable ) { // focusの高さが可変になっていれば...
		const height = playersDice.getDiceHeightByDeleteLife();
		focusOBJ.updataFocusHeight( height );
		if( focusOBJ.height <= 0) {
			floorDice.setPos(focusOBJ.posX, focusOBJ.posY);
			currentView.updata(floorDice); // 現在のdice状態表示の更新
		}
	}
}
function focusCheckLoop() { // focusの監視
	//console.log('focusCheckLoop');
	updataStageMap(); // Mapの更新
	// 動作要求のチェック
	if( focusOBJ.requestDir != null ) { // 要求があれば...
		controlCheck( focusOBJ.requestDir );
	}
	focusOBJ.requestDir = null; // 要求を空に
	//
	// 足元のチェック
	/*console.log('focusOBJ:::',focusOBJ.posX,focusOBJ.posY);
	const footDice = getDiceByPosition(focusOBJ.posX,focusOBJ.posY);
	if( footDice != false ) { // focusとdiceが重なっていたら、
		playersDice = footDice;
	}
	//console.log('dice height:::', playersDice.getDiceHeightByDeleteLife() );
	// focusの高さをplayersDice の高さに合わせる
	if( focusOBJ.heightIsValiable ) { // focusの高さが可変になっていれば...
		const height = playersDice.getDiceHeightByDeleteLife();
		focusOBJ.updataFocusHeight( height );
		if( focusOBJ.height <= 0) {
			floorDice.setPos(focusOBJ.posX, focusOBJ.posY);
			currentView.updata(floorDice); // 現在のdice状態表示の更新
		}
	}
	*/
	const footDice = getDiceByPosition(focusOBJ.posX,focusOBJ.posY);
	focusFootCheck( footDice ); 
	//
	// ステータス確認用情報入力
	focusStatus_global = `POS(${focusOBJ.posX},${focusOBJ.posY}), H:${Math.floor(focusOBJ.height)}, D:${Math.floor(focusOBJ.currentDir)}`;
	// 足元の情報
	if(footDice != false) {
		const footTopface = footDice.getTopFace();
		const footLife = footDice.deleteLife;
		const footHeight = Math.floor(footDice.height);
		const footClass = footDice.element.classList;
		footStatus_global = `T:${footTopface},L:${footLife},H:${footHeight}<br>footClass::${footClass}`;
	}
	else {
		footStatus_global = `ゆか`;
	}
	viewVal();
	//
	// 点数
	const scoreView = document.body.querySelector('.scoreView .gameText');
	if( viewScore < usrScore ) { // 表示スコアがユーザースコアより小さければ...
		viewScore++;
		scoreView.textContent = String(viewScore).padStart(10,0);
	}
	// ハイスコア
	const hiScoreView = document.body.querySelector('.hiScoreView .gameText');
	if( hiScore < viewScore ) { // 表示スコアがハイスコアより小さければ...
		hiScoreView.textContent = String(viewScore).padStart(10,0);
	}
	//
	// 終了判定
	const gameClearIs = judgeGameClearByRules();
	const gameOverIs = judgeGameOverByRules();
	if(gameClearIs) {
		console.log('game clear');
	}
	if(gameOverIs) {
		console.log('game over');
	}
	// 終了処理
	if( gameClearIs || gameOverIs ) {
		gemeEndFunc(gameClearIs, gameOverIs);
	}
}
// 以上 ゲームルール関係
//
/******* ボタン類 *******/
// ゲームスタートボタン
const gameStartBTN = document.body.querySelector('#gameStartBtn');
gameStartBTN.addEventListener('click',gameStartBtnClick);
function gameStartBtnClick(evt) {
	// gameModeの選択状態のクリア
	for(let i=0; i<gameModeLIST.length; i++) {
		const BTN = document.body.querySelector(`#${gameModeLIST[i]}`);
		BTN.classList.remove('selected');
		const INFO = document.body.querySelector(`.gameModeInfo.${gameModeLIST[i]}`);
		INFO.classList.remove('open');
	}
	// gameModeウィンドウのclose
	document.body.querySelector('.gameSelectView').style['display'] = 'none';
	document.body.querySelector('.gameModeInfoView').style['display'] = 'none';
	// ゲームスタート処理へ
	gameStartFunc(selectedGameMode);
}
// give upボタン
const giveupBTN = document.body.querySelector('#giveupBtn');
giveupBTN.addEventListener('click', giveupFunc);
function giveupFunc(evt) {
	// ギブアップ処理
	// 強制ゲームオーバー設定
	gemeEndFunc(false, false, 'GIVE UP');
}
// ゲームオーバー時のボタン
// リトライ
const retryBTN = document.body.querySelector('#retryBtn');
function retryFunc(evt) {
	// タイマーのクリア
	clearInterval(newDiceINTERVAL_id);
	// ステージのリセット
	resetStage();
	//
	// 配置があるゲームモードの場合は、
	// backupDicesInfoから情報を読み出して設定
	setGameInitByRules(true); // trueでバックアップから起動
	//
	// ゲームオーバー表示の片付け
	const gameoverView = document.body.querySelector('.gameoverView');
	gameoverView.classList.remove('open');
}
// ランキング
const rankingBTN = document.body.querySelector('#rankingBtn');
rankingBTN.addEventListener('click', rankingFunc);
function rankingFunc(evt) { 
	console.log('rankingFunc');
	// ランキングのための処理
	const sendGameMode = gameModeLIST[selectedGameMode];
	let tmpTime = 0;
	switch( gameModeLIST[selectedGameMode] ) {
		case 'TimeTrial2min': 
		tmpTime = gameRules['limitTime'];
		break;
		case 'Servival': 
		case 'dice10Challenge': 
		tmpTime = timerOBJ.stopTime;
		break;
	}
	const sendTime = tmpTime;
	const sendScore = usrScore;
	// 結果の表示
	document.body.querySelector('.resultView').classList.add('open');
	// スコアの流し込み
	document.body.querySelector('.resultView .resultGameMode .userVal').textContent = sendGameMode;
	document.body.querySelector('.resultView .resultTime .userVal').textContent = timerOBJ.viewFormat(sendTime);
	document.body.querySelector('.resultView .resultScore .userVal').textContent = sendScore;
	// ゲームオーバー表示を非表示
	const gameoverView = document.body.querySelector('.gameoverView');
	gameoverView.classList.remove('open');
	//
	// yes or no
	document.body.querySelector('.resultView .gamebtn.yes').addEventListener('click',function(evt){
		// ランキングを開いておく
		const rankingViewWrap = document.body.querySelector('.rankingViewWrap');
		rankingViewWrap.classList.remove('shrink');
		// submitの実行
		submitRankingFunc(sendGameMode, sendTime, sendScore, gameRules['recordIs'], true);
		// 結果の非表示
		document.body.querySelector('.resultView').classList.remove('open');
		// gameoverViewの表示
		gameoverView.classList.add('open');
		// rankingを非対応にする
		document.body.querySelector('#rankingBtn').disabled = true;
	});
	document.body.querySelector('.resultView .gamebtn.no').addEventListener('click', function(evt) {
		// submitのキャンセル
		gameoverView.classList.add('open');
		// 結果の非表示
		document.body.querySelector('.resultView').classList.remove('open');
	});
}
// タイトルへ戻る
const backTitleBTN = document.body.querySelector('#backTitleBtn');
backTitleBTN.addEventListener('click', backTileFunc);
function backTileFunc(evt) {
	// タイトルへ戻す処理
	// ゲームオーバー表示の片付け
	const gameoverView = document.body.querySelector('.gameoverView');
	gameoverView.classList.remove('open');
	// ステージのリセット
	resetStage();
	// diceの初期位置
	firstDiceInit();
	playersDice = diceList[0];
	focusOBJ.setDir( focusOBJ.currentDir );
	focusOBJ.setPos( playersDice.posX, playersDice.posY );
	focusFootCheck( playersDice ); 
	// ゲームロード直後表示
	titleViewFunc();
	// メニューの表示処理
	viewGameMenuFunc();
}
// メニューの表示時処理
function viewGameMenuFunc() {
	// ゲーム画面の設定
	gameMenuViewFunc();
	// giveupボタンの非表示
	document.body.querySelector('#giveupBtn').style['display'] = 'none';
	// スコア類の表示
	document.body.querySelector('.hiScoreView').style['display'] = null;
	document.body.querySelector('.scoreView').style['display'] = null;
	document.body.querySelector('.timeView').style['display'] = null;
	// ゲームモード表示のclose
	document.body.querySelector('.gameModeView').classList.remove('open');
	// gameModeウィンドウのopen
	document.body.querySelector('.gameSelectView').style['display'] = null;
	document.body.querySelector('.gameModeInfoView').style['display'] = null;
}
//
// 再起動
const rebootBTN = document.body.querySelector('#rebootBtn');
rebootBTN.addEventListener('click', rebootFunc);
function rebootFunc(evt) {
	// 再起動処理
	// タイマーのクリア
	clearInterval(newDiceINTERVAL_id);
	// ステージのリセット
	resetStage();
	//
	while( diceList.length < diceNum ) {
		const tmpDice = new Dice();
		diceList.push( tmpDice );
		tmpDice.putOnStage( document.body.querySelector('.diceWrap') );
		tmpDice.randomSetFace();
	}
	//
	// ランダム配置
	for(const dice of diceList) {
		updataStageMap(); // stageMapの更新
		let selectedPos = selectEmptyPos( stageMap );
		let count = 0;
		while( !selectedPos ) {
			count++;
			if( count>stageMap.length * stageMap[0].length ) {
				console.log('候補地エラー');
				break;
			}
			selectedPos = selectEmptyPos( stageMap );
		}
		if( !selectedPos ) { break; } // 生成せずにループを抜ける
		dice.setPos(selectedPos[0], selectedPos[1]);
		updataStageMap(); // stageMapの更新
		//
	}
	// バックアップ
	backupDicesInfoFunc( diceList );
	//
	playersDice = diceList[0];
	focusOBJ.setDir( focusOBJ.currentDir );
	focusOBJ.setPos( playersDice.posX, playersDice.posY );
	//
	//タイマーの設定
	if(autoCreateDiceBox5s.checked) { // diceの自動生成がONなら
		newDiceINTERVAL_id = setInterval(addNewDiceOnGame, 5*1000);
	}
	if(autoCreateDiceBox10s.checked) { // diceの自動生成がONなら
		newDiceINTERVAL_id = setInterval(addNewDiceOnGame, 10*1000);
	}
}
// リトライ
const retryBTN_test = document.body.querySelector('#retryBtn_test');
retryBTN_test.addEventListener('click', retryFunc);
retryBTN.addEventListener('click', retryFunc);
// Dice生成
const addDiceBTN = document.body.querySelector('#addDiceBtn');
addDiceBTN.addEventListener('click', addDiceFunc);
function addDiceFunc(evt) {
	addNewDiceOnGame();
}
// viewBtn
let viewRotateX = -30;
const viewUpBTN = document.body.querySelector('#viewUpBtn');
viewUpBTN.addEventListener('click', viewUpFunc);
function viewUpFunc(evt) {
	viewRotateX -= 5;
	stageViewChange();
}
const viewDownBTN = document.body.querySelector('#viewDownBtn');
viewDownBTN.addEventListener('click', viewDownFunc);
function viewDownFunc(evt) {
	viewRotateX += 5;
	stageViewChange();
}
let viewRotateY = -40;
const viewLeftBTN = document.body.querySelector('#viewLeftBtn');
viewLeftBTN.addEventListener('click', viewLeftFunc);
function viewLeftFunc(evt) {
	viewRotateY -= 5;
	stageViewChange();
}
const viewRightBTN = document.body.querySelector('#viewRightBtn');
viewRightBTN.addEventListener('click', viewRightFunc);
function viewRightFunc(evt) {
	viewRotateY += 5;
	stageViewChange();
}
let viewScale = 0.8;
const scaleUpBTN = document.body.querySelector('#scaleUpBtn');
scaleUpBTN.addEventListener('click', scaleUpFunc);
function scaleUpFunc(evt) {
	viewScale += 0.1;
	helperOBJ.setCSS(document.querySelector('.gameScreen'),'--scale',viewScale);
	stageViewChange();
}
const scaleDownBTN = document.body.querySelector('#scaleDownBtn');
scaleDownBTN.addEventListener('click', scaleDownFunc);
function scaleDownFunc(evt) {
	viewScale -= 0.1;
	helperOBJ.setCSS(document.querySelector('.gameScreen'),'--scale',viewScale);
	stageViewChange();
}
function stageViewChange() {
	const transformTxt = `rotateX(${viewRotateX}deg) rotateY(${viewRotateY}deg) rotateZ(0deg) 
				scaleX(var(--scale)) scaleY(var(--scale)) scaleZ(var(--scale))`;
	document.querySelector('.gameScreen').style['transform'] = transformTxt;
	document.querySelector('.gameScreen').style['transition'] = `1s ease 0s`;
	setTimeout(function(){
		document.querySelector('.gameScreen').style['transition'] = null;
	}, 1000);
}
//
const titleViewBTN = document.body.querySelector('#titleViewBtn');
titleViewBTN.addEventListener('click', gameMenuViewFunc);
// タイトル画面の表示設定
function titleViewFunc(evt) {
	const gameScreen = document.querySelector('.gameScreen');
	viewRotateX = -15;
	viewRotateY = -45;
	viewScale = 0.8;
	helperOBJ.setCSS(gameScreen,'--scale',viewScale);
	gameScreen.style['left'] = '219px';
	gameScreen.style['top'] = '260px';
	stageViewChange();
}
// ゲームモード選択中の表示設定
function gameMenuViewFunc(evt) {
	const gameScreen = document.querySelector('.gameScreen');
	viewRotateX = -5;
	viewRotateY = -45;
	viewScale = 1;
	helperOBJ.setCSS(gameScreen,'--scale',viewScale);
	gameScreen.style['left'] = '310px';
	gameScreen.style['top'] = '290px';
	stageViewChange();
}
const gamingViewBTN = document.body.querySelector('#gamingViewBtn');
gamingViewBTN.addEventListener('click', gamingViewFunc);
// ゲーム中の表示設定
function gamingViewFunc(evt) {
	const gameScreen = document.querySelector('.gameScreen');
	viewRotateX = -25;
	viewRotateY = -40;
	viewScale = 0.8;
	helperOBJ.setCSS(gameScreen,'--scale',viewScale);
	gameScreen.style['left'] = '202px';
	gameScreen.style['top'] = '170px';
	stageViewChange();
}
const gameoverViewBTN = document.body.querySelector('#gameoverViewBtn');
gameoverViewBTN.addEventListener('click', gameoverViewFunc);
// ゲームオーバー時の表示設定
function gameoverViewFunc(evt) {
	const gameScreen = document.querySelector('.gameScreen');
	viewRotateX = -90;
	viewRotateY = -45;
	viewScale = 0.8;
	helperOBJ.setCSS(gameScreen,'--scale',viewScale);
	gameScreen.style['left'] = '219px';
	gameScreen.style['top'] = '-8px';
	stageViewChange();
}
// gameSelectView
const gameSelectView = document.body.querySelector('.gameSelectView');
gameSelectView.addEventListener('pointermove', dragFunc);
const gameModeInfoView = document.body.querySelector('.gameModeInfoView');
gameModeInfoView.addEventListener('pointermove', dragFunc);
// controlView
const controlView = document.body.querySelector('.controlView');
controlView.addEventListener('pointermove', dragFunc);
// 仮コントローラー　リスナー
document.body.querySelector('#ArrowUp').addEventListener('pointerdown', vControlerClick);
document.body.querySelector('#ArrowDown').addEventListener('pointerdown', vControlerClick);
document.body.querySelector('#ArrowLeft').addEventListener('pointerdown', vControlerClick);
document.body.querySelector('#ArrowRight').addEventListener('pointerdown', vControlerClick);
//
function vControlerClick(evt) {
	controlView.removeEventListener('pointermove', dragFunc);
	const timerid = setInterval( function() {;
		const direction = evt.target.classList[1];
		//console.log('vControlerClick:::', direction);
		// 操作のチェック
		controlCheck( direction );
	}, 1*FRM);
	window.addEventListener('pointerup', function(){ 
		clearInterval(timerid);
		controlView.addEventListener('pointermove', dragFunc);
	});
}
// コントローラーのドラッグ
const controlWrap = document.body.querySelector('.controlWrap');
const draggableMark = document.body.querySelector('.draggableMark');
//draggableMark.addEventListener('pointermove', draggableMarkMove);
draggableMark.addEventListener('pointerdown', function(evt) {
	window.addEventListener('pointermove', draggableMarkMove);
	draggableMark.addEventListener('pointerup', function(evt) {
		window.removeEventListener('pointermove', draggableMarkMove);
	});
});
function draggableMarkMove(evt) {
	if(evt.buttons) {
		//console.log(evt.movementX, evt.movementY);
		controlWrap.style.left = helperOBJ.getCSS(controlWrap, 'left') + evt.movementX + 'px';
		controlWrap.style.top = helperOBJ.getCSS(controlWrap, 'top') + evt.movementY + 'px';
	}
}
// ステージのドラッグ
const gameScreen = document.body.querySelector('.gameScreen');
gameScreen.addEventListener('pointermove', dragFunc);

const controlWrap2 = document.body.querySelector('.controlWrap2');
controlWrap2.addEventListener('pointermove', dragFunc);
// ドラッグ処理本体
function dragFunc(evt) {
	if(evt.buttons) {
		this.style.left = this.offsetLeft + evt.movementX + 'px';
		this.style.top = this.offsetTop + evt.movementY + 'px';
		this.draggable = false;
		this.setPointerCapture(evt.pointerId);
		//document.body.style['overflow'] = 'hidden';
	}
}
// pointerのドラッグ
const controlPoint = document.body.querySelector('.controlPoint');
controlPoint.addEventListener('pointerdown', pointerDownFunc);
function pointerDownFunc(evt) {
	document.body.querySelector('.controlPoint').style['background-color'] = 'yellow';
	//
	let timerid = 0;
	let moveX = controlWrap2.clientLeft/2;
	let moveY = controlWrap2.clientTop/2;
	let pointerX = moveX - controlPoint.clientWidth/2;
	let pointerY = moveY - controlPoint.clientHeight/2;
	//
	// pointerdown時のリスナーの出し入れ
	controlWrap2.removeEventListener('pointermove', dragFunc);
	controlPoint.addEventListener('pointermove', dragPointerFunc);
	window.addEventListener('pointerup', pointerUpFunc, {once: true});
	//
	function timerSet() {
		const border = 10;
		console.log('timerSet:::', moveX);
		if( Math.abs(moveX - controlWrap2.clientWidth/2) < border &&  Math.abs(moveY - controlWrap2.clientHeight/2) < border ) { return; }
		else {
			clearInterval(timerid);
			timerid = setInterval(focusMoveFunc,1*FRM);
		}
	}
	//
	function dragPointerFunc(evt) {
		// pointerのdrag
		clearInterval(timerid); // intervalのクリア
		// drag処理
		moveX = evt.clientX - controlWrap2.getBoundingClientRect().x;
		moveY = evt.clientY - controlWrap2.getBoundingClientRect().y;
		pointerX = moveX - controlPoint.clientWidth/2;
		pointerY = moveY - controlPoint.clientHeight/2;
		//
		if(evt.buttons) {
			// pointerの移動
			this.style.left = pointerX + evt.movementX + 'px';
			this.style.top = pointerY + evt.movementY + 'px';
			this.draggable = false;
			this.setPointerCapture(evt.pointerId);
			document.body.style['overflow'] = 'hidden';
			//
			timerid = timerSet(); // pointerの移動直後から、focusの移動timerをセット
		}
		else {return;}
		//
		let controlStHTML = `
					<div class="viewVal">****************</div>
					<div class="viewVal">moveX:::${moveX}</div>
					<div class="viewVal">moveY:::${moveY}</div>
					<div class="viewVal">pointerX:::${pointerX}</div>
					<div class="viewVal">pointerY:::${pointerY}</div>
					<div class="viewVal">X:::${this.style.left}</div>
					<div class="viewVal">Y:::${this.style.top}</div>
					`;
		//
	}
	function focusMoveFunc() {
		// focusが動いていたら、一旦保留
		if( focusOBJ.elemt.classList.contains('ROTATE') || focusOBJ.elemt.classList.contains('TRANSLATE') ) { return; }
		//
		console.log('focusMoveFunc');
		console.log('x:::',moveX - controlWrap2.clientWidth/2 - controlPoint.clientWidth/2);
		console.log('y:::',moveY - controlWrap2.clientHeight/2 - controlPoint.clientHeight/2);
		//
		if( Math.abs(pointerX - controlWrap2.clientWidth/2) === Math.abs(pointerY - controlPoint.clientHeight/2) ) { return; }
		else if( Math.abs(pointerX - controlWrap2.clientWidth/2) < Math.abs(pointerY - controlPoint.clientHeight/2) ) {
			// 横移動
			if( pointerY === controlWrap2.clientHeight/2 ) { return; }
			else if( pointerY > controlWrap2.clientHeight/2  ) {
				// down
				document.body.querySelector('.ArrowDown').dispatchEvent(new Event('click'));
			}
			else {
				// up
				document.body.querySelector('.ArrowUp').dispatchEvent(new Event('click'));
			}
		}
		else {
			// 縦移動
			if( pointerX === controlWrap2.clientWidth/2 ) { return; }
			else if( pointerX > controlWrap2.clientWidth/2  ) {
				// right
				document.body.querySelector('.ArrowRight').dispatchEvent(new Event('click'));
			}
			else {
				// left
				document.body.querySelector('.ArrowLeft').dispatchEvent(new Event('click'));
			}
		}
	}
	function pointerUpFunc(evt) {
		clearInterval(timerid);
		//
		controlPoint.style=null;
		document.body.style=null;
		//
		window.removeEventListener('pointermove', dragPointerFunc);
		window.removeEventListener('pointerup', pointerUpFunc, {once: true});
		controlWrap2.addEventListener('pointermove', dragFunc);
	}
}
/*
controlPoint.addEventListener('pointerdown', pointerDownFunc);
function pointerDownFunc(evt) {
	document.body.style['overflow'] = 'hidden';
	document.body.querySelector('.controlPoint').style['background-color'] = 'yellow';
	controlWrap2.removeEventListener('pointermove', dragFunc);
	// pointer down時の処理
	window.addEventListener('pointermove', pointerMoveFunc);
	window.addEventListener('pointerup', pointerUpFunc, {once: true});
}
function pointerMoveFunc(evt) {
	document.body.style['overflow'] = 'hidden';
	const rect = controlWrap2.getBoundingClientRect();
	const moveX = evt.clientX - rect.x;
	const moveY = evt.clientY - rect.y;
	const pointerX = moveX - controlPoint.clientWidth/2;
	const pointerY = moveY - controlPoint.clientHeight/2;
	controlPoint.style['left'] = pointerX + 'px';
	controlPoint.style['top'] = pointerY + 'px';
	//
	if( focusOBJ.elemt.classList.contains('ROTATE') || 
		focusOBJ.elemt.classList.contains('TRANSLATE') ) { return; }
	//
	console.log('x:::',pointerX);
	console.log('y:::',pointerY);
	//
	if( Math.abs(pointerX - rect.width/2) < 10 ||
		 Math.abs(pointerY - rect.height/2) < 10 ) { return; }
	if( Math.abs(pointerX - rect.width/2) === Math.abs(pointerY - rect.height/2) ) {return;}
	else if( Math.abs(pointerX - rect.width/2) < Math.abs(pointerY - rect.height/2) ) {
		// 横移動
		if( pointerY === rect.height/2 ) { return; }
		else if( pointerY > rect.height/2  ) {
			// down
			document.body.querySelector('.ArrowDown').dispatchEvent(new Event('click'));
		}
		else {
			// up
			document.body.querySelector('.ArrowUp').dispatchEvent(new Event('click'));
		}
	}
	else {
		// 縦移動
		if( pointerX === rect.width/2 ) { return; }
		else if( pointerX > rect.width/2  ) {
			// right
			document.body.querySelector('.ArrowRight').dispatchEvent(new Event('click'));
		}
		else {
			// left
			document.body.querySelector('.ArrowLeft').dispatchEvent(new Event('click'));
		}
	}
}*/
// ランキング
// submit
function submitRankingFunc(gMODE, TIME, SCORE, RECORD, writeFlg) {
	const sendForm = document.querySelector('#sendScore');
	// ゲームモード
	const gameModeInput = document.createElement('input');
	gameModeInput.setAttribute('type', 'hidden');
	gameModeInput.setAttribute('name', 'gMode');
	gameModeInput.value = gMODE;
	sendForm.appendChild(gameModeInput);
	// クリアタイム
	const timeInput = document.createElement('input');
	timeInput.setAttribute('type', 'hidden');
	timeInput.setAttribute('name', 'time');
	timeInput.value = TIME;
	sendForm.appendChild(timeInput);
	// スコア
	const scoreInput = document.createElement('input');
	scoreInput.setAttribute('type', 'hidden');
	scoreInput.setAttribute('name', 'score');
	scoreInput.value = SCORE;
	sendForm.appendChild(scoreInput);
	// 優先記録
	const recordInput = document.createElement('input');
	recordInput.setAttribute('type', 'hidden');
	recordInput.setAttribute('name', 'record');
	recordInput.value = RECORD;
	sendForm.appendChild(recordInput);
	// 書き込みフラグ
	const writeInput = document.createElement('input');
	writeInput.setAttribute('type', 'hidden');
	writeInput.setAttribute('name', 'wrFlg');
	writeInput.value = writeFlg;
	sendForm.appendChild(writeInput);
	//
	document.body.querySelector('iframe.rankingView').focus();
	sendForm.submit(); // データ送信
}
// ドラッグ
const rankingViewWrap = document.body.querySelector('.rankingViewWrap');
rankingViewWrap.addEventListener('pointermove', function(evt){ 
	this.style['transition-duration'] = '0s';
	if(evt.buttons) {
		this.style.left = this.offsetLeft + evt.movementX + 'px';
		this.style.top = this.offsetTop + evt.movementY + 'px';
		this.draggable = false;
		this.setPointerCapture(evt.pointerId);
		//document.body.style['overflow'] = 'hidden';
	}
	window.addEventListener('pointerup', function() { rankingViewWrap.style['transition-duration'] = null; });
});
// shrink
const rankingTitle = document.body.querySelector('.ranking.title');
rankingTitle.addEventListener('click', rankingShrinkFunc);
function rankingShrinkFunc(evt) {
	rankingViewWrap.classList.toggle('shrink');
}