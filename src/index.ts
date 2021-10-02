import "./_variables.scss";
import "./master.scss";
import "./media.scss";
import "./tetriminos.scss";
//import * as deepEqual from "deep-equal";

import { setButtonActions } from "./buttonAction";
import { Swiper } from "./SwiperClass";
import { addKeyActions, removeKeyActions } from "./keyinput";
import { Enum, toUpperFirstLetter, cloneArray, shuffle, includesArray, minArray, toLowerFirstLetter, setCssVar } from "./general";
import { startSound, lockDownSound, hardDropSound, tspinSound } from './sounds';
import { Tetrimino, Pos, Mino, normalBufferHeight, normalFieldHeight, normalFieldWidth, TetriminoEnum, getMirrorField, getMirrorFieldAtRnd } from "./global";
import { ChangeSizeOfMatrix, GameRule } from './gameRule';
import { TimerOfAbilityToEsc } from "./timerOfAbilityToEsc";
import { GameOption } from "./gameOptions";

//
//
// const
//
//

const TetriminosFromNum = new Map<Number,Tetrimino>();
TetriminosFromNum.set(-2,"wall");
TetriminosFromNum.set(-1,"empty");
TetriminosFromNum.set(0,"i");
TetriminosFromNum.set(1,"o");
TetriminosFromNum.set(2,"s");
TetriminosFromNum.set(3,"z");
TetriminosFromNum.set(4,"j");
TetriminosFromNum.set(5,"l");
TetriminosFromNum.set(6,"t");

function FallingSpeed(level: number): number {
	return 1000*(0.8 - ((level-1) * 0.007))**(level-1);
}

const ShapesOfTetrimino = new Map<Tetrimino,number[][]>();
ShapesOfTetrimino.set("i", [[1,0,1,1]]);
ShapesOfTetrimino.set("o", [[1,1],[0,1]])
ShapesOfTetrimino.set("s", [[-1,1,1],[1,0,-1]])
ShapesOfTetrimino.set("z", [[1,1,-1],[-1,0,1]])
ShapesOfTetrimino.set("j", [[1,-1,-1],[1,0,1]])
ShapesOfTetrimino.set("l", [[-1,-1,1],[1,0,1]])
ShapesOfTetrimino.set("t", [[-1,1,-1],[1,0,1]])

const NumOfNext = 6;

const Actions = ['none','single','double','triple','tetris','mini_tspin','mini_tspin_single','tspin','tspin_single','tspin_double','tspin_triple','back_to_back','softDrop','hardDrop','ren','singlePerfectClear','doublePerfectClear','triplePerfectClear','tetrisPerfectClear','tetrisBtoBPerfectClear'] as const;
type Action = typeof Actions[number];

const ScoreOfAction = new Map<Action, number>();
ScoreOfAction.set("none", 0);
ScoreOfAction.set("single", 100);
ScoreOfAction.set("double", 300);
ScoreOfAction.set("triple", 500);
ScoreOfAction.set("tetris", 800);
ScoreOfAction.set("mini_tspin", 100);
ScoreOfAction.set("mini_tspin_single", 200);
ScoreOfAction.set("tspin", 400);
ScoreOfAction.set("tspin_single", 800);
ScoreOfAction.set("tspin_double", 1200);
ScoreOfAction.set("tspin_triple", 1600);
ScoreOfAction.set("back_to_back", 1.5);
ScoreOfAction.set("softDrop", 1);
ScoreOfAction.set("hardDrop", 2);
ScoreOfAction.set("ren", 50);
ScoreOfAction.set("singlePerfectClear", 800);
ScoreOfAction.set("doublePerfectClear", 1200);
ScoreOfAction.set("triplePerfectClear", 1800);
ScoreOfAction.set("tetrisPerfectClear", 2000);
ScoreOfAction.set("tetrisBtoBPerfectClear", 3200);

const DisplayTitleOfAction = new Map<String, String>();
DisplayTitleOfAction.set("none", '');
DisplayTitleOfAction.set("single", 'Single');
DisplayTitleOfAction.set("double", 'Double');
DisplayTitleOfAction.set("triple", 'Triple');
DisplayTitleOfAction.set("tetris", 'Tetris');
DisplayTitleOfAction.set("mini_tspin", '');
DisplayTitleOfAction.set("mini_tspin_single", 'Mini T-spin Single');
DisplayTitleOfAction.set("tspin", '');
DisplayTitleOfAction.set("tspin_single", 'T-spin Single');
DisplayTitleOfAction.set("tspin_double", 'T-spin Double');
DisplayTitleOfAction.set("tspin_triple", 'T-spin Triple');
DisplayTitleOfAction.set("back_to_back", '');
DisplayTitleOfAction.set("softDrop", '');
DisplayTitleOfAction.set("hardDrop", '');
DisplayTitleOfAction.set("ren", '');
DisplayTitleOfAction.set("score", 'score');
DisplayTitleOfAction.set("ren", 'REN');
DisplayTitleOfAction.set("perfectClear", "perfectClear");

const ActionsEnum = [];

/**
 * scoreに表示しないaction
 * @type {Array}
 */
const notScorings:Action[] = ['hardDrop','softDrop','back_to_back','mini_tspin','tspin','none','ren','singlePerfectClear','doublePerfectClear','triplePerfectClear','tetrisPerfectClear','tetrisBtoBPerfectClear']

//const Direction = defineEnum({
//	Up: {
//		string: 'up',
//		value: 0
//	},
//	Right: {
//		string: 'right',
//		value: 1
//	},
//	Down: {
//		string: 'down',
//		value: 2
//	},
//	Left: {
//		string: 'left',
//		value: 3
//	}
//})

/**
 * SRSのとき、中心がどれだけ変わるかの値
 * @type {Object} spinRule[minoType][formerDirection][0:right,1:left][num]=[dx,dy]
 *
 */
const spinRule = new Map<Tetrimino,Pos[][][]>();
spinRule.set("i", [
	[
		[
			{x:-2,y:0},
			{x:1,y:0},
			{x:-2,y:1},
			{x:1,y:-2}
		],[
			{x:-1,y:0},
			{x:2,y:0},
			{x:-1,y:-2},
			{x:2,y:1}
		]
	],[
		[
			{x:-1,y:0},
			{x:2,y:0},
			{x:-1,y:-2},
			{x:2,y:1}
		],[
			{x:2,y:0},
			{x:-1,y:0},
			{x:2,y:-1},
			{x:-1,y:2}
		]
	],[
		[
			{x:2,y:0},
			{x:-1,y:0},
			{x:2,y:-1},
			{x:-1,y:2}
		],[
			{x:1,y:0},
			{x:-2,y:0},
			{x:1,y:2},
			{x:-2,y:-1}
		]
	],[
		[
			{x:-2,y:0},
			{x:1,y:0},
			{x:1,y:2},
			{x:-2,y:-1}
		],[
			{x:1,y:0},
			{x:-2,y:0},
			{x:-2,y:1},
			{x:1,y:-2}
		]
	]
])
spinRule.set("o", [
	[
		[//right
			{x:0,y:0},
			{x:0,y:0},
			{x:0,y:0},
			{x:0,y:0},
		],[//left
			{x:0,y:0},
			{x:0,y:0},
			{x:0,y:0},
			{x:0,y:0},
		]
	],[
		[
			{x:0,y:0},
			{x:0,y:0},
			{x:0,y:0},
			{x:0,y:0},
		],[
			{x:0,y:0},
			{x:0,y:0},
			{x:0,y:0},
			{x:0,y:0},
		]
	],[
		[
			{x:0,y:0},
			{x:0,y:0},
			{x:0,y:0},
			{x:0,y:0},
		],[
			{x:0,y:0},
			{x:0,y:0},
			{x:0,y:0},
			{x:0,y:0},
		]
	],[
		[
			{x:0,y:0},
			{x:0,y:0},
			{x:0,y:0},
			{x:0,y:0},
		],[
			{x:0,y:0},
			{x:0,y:0},
			{x:0,y:0},
			{x:0,y:0},
		]
	]
])
spinRule.set('l', [
	[
		[//right
			{x:-1,y:0},
			{x:-1,y:-1},
			{x:0,y:2},
			{x:-1,y:2}
		],[//left
			{x:1,y:0},
			{x:1,y:-1},
			{x:0,y:2},
			{x:1,y:2}
		]
	],[
		[
			{x:1,y:0},
			{x:1,y:1},
			{x:0,y:-2},
			{x:1,y:-2}
		],[
			{x:1,y:0},
			{x:1,y:1},
			{x:0,y:-2},
			{x:1,y:-2}
		]
	],[
		[
			{x:1,y:0},
			{x:1,y:-1},
			{x:0,y:2},
			{x:1,y:2}
		],[
			{x:-1,y:0},
			{x:-1,y:-1},
			{x:0,y:2},
			{x:-1,y:2}
		]
	],[
		[
			{x:-1,y:0},
			{x:-1,y:1},
			{x:0,y:-2},
			{x:-1,y:-2}
		],[
			{x:-1,y:0},
			{x:-1,y:1},
			{x:0,y:-2},
			{x:-1,y:-2}
		]
	]
])
spinRule.set("j",[
	[
		[//right
			{x:-1,y:0},
			{x:-1,y:-1},
			{x:0,y:2},
			{x:-1,y:2}
		],[//left
			{x:1,y:0},
			{x:1,y:-1},
			{x:0,y:2},
			{x:1,y:2}
		]
	],[
		[
			{x:1,y:0},
			{x:1,y:1},
			{x:0,y:-2},
			{x:1,y:-2}
		],[
			{x:1,y:0},
			{x:1,y:1},
			{x:0,y:-2},
			{x:1,y:-2}
		]
	],[
		[
			{x:1,y:0},
			{x:1,y:-1},
			{x:0,y:2},
			{x:1,y:2}
		],[
			{x:-1,y:0},
			{x:-1,y:-1},
			{x:0,y:2},
			{x:-1,y:2}
		]
	],[
		[
			{x:-1,y:0},
			{x:-1,y:1},
			{x:0,y:-2},
			{x:-1,y:-2}
		],[
			{x:-1,y:0},
			{x:-1,y:1},
			{x:0,y:-2},
			{x:-1,y:-2}
		]
	]
])
spinRule.set("s",[
	[
		[//right
			{x:-1,y:0},
			{x:-1,y:-1},
			{x:0,y:2},
			{x:-1,y:2}
		],[//left
			{x:1,y:0},
			{x:1,y:-1},
			{x:0,y:2},
			{x:1,y:2}
		]
	],[
		[
			{x:1,y:0},
			{x:1,y:1},
			{x:0,y:-2},
			{x:1,y:-2}
		],[
			{x:1,y:0},
			{x:1,y:1},
			{x:0,y:-2},
			{x:1,y:-2}
		]
	],[
		[
			{x:1,y:0},
			{x:1,y:-1},
			{x:0,y:2},
			{x:1,y:2}
		],[
			{x:-1,y:0},
			{x:-1,y:-1},
			{x:0,y:2},
			{x:-1,y:2}
		]
	],[
		[
			{x:-1,y:0},
			{x:-1,y:1},
			{x:0,y:-2},
			{x:-1,y:-2}
		],[
			{x:-1,y:0},
			{x:-1,y:1},
			{x:0,y:-2},
			{x:-1,y:-2}
		]
	]
])
spinRule.set("z",[
	[
		[//right
			{x:-1,y:0},
			{x:-1,y:-1},
			{x:0,y:2},
			{x:-1,y:2}
		],[//left
			{x:1,y:0},
			{x:1,y:-1},
			{x:0,y:2},
			{x:1,y:2}
		]
	],[
		[
			{x:1,y:0},
			{x:1,y:1},
			{x:0,y:-2},
			{x:1,y:-2}
		],[
			{x:1,y:0},
			{x:1,y:1},
			{x:0,y:-2},
			{x:1,y:-2}
		]
	],[
		[
			{x:1,y:0},
			{x:1,y:-1},
			{x:0,y:2},
			{x:1,y:2}
		],[
			{x:-1,y:0},
			{x:-1,y:-1},
			{x:0,y:2},
			{x:-1,y:2}
		]
	],[
		[
			{x:-1,y:0},
			{x:-1,y:1},
			{x:0,y:-2},
			{x:-1,y:-2}
		],[
			{x:-1,y:0},
			{x:-1,y:1},
			{x:0,y:-2},
			{x:-1,y:-2}
		]
	]
])
spinRule.set("t",[
	[
		[//right
			{x:-1,y:0},
			{x:-1,y:-1},
			{x:0,y:2},
			{x:-1,y:2}
		],[//left
			{x:1,y:0},
			{x:1,y:-1},
			{x:0,y:2},
			{x:1,y:2}
		]
	],[
		[
			{x:1,y:0},
			{x:1,y:1},
			{x:0,y:-2},
			{x:1,y:-2}
		],[
			{x:1,y:0},
			{x:1,y:1},
			{x:0,y:-2},
			{x:1,y:-2}
		]
	],[
		[
			{x:1,y:0},
			{x:1,y:-1},
			{x:0,y:2},
			{x:1,y:2}
		],[
			{x:-1,y:0},
			{x:-1,y:-1},
			{x:0,y:2},
			{x:-1,y:2}
		]
	],[
		[
			{x:-1,y:0},
			{x:-1,y:1},
			{x:0,y:-2},
			{x:-1,y:-2}
		],[
			{x:-1,y:0},
			{x:-1,y:1},
			{x:0,y:-2},
			{x:-1,y:-2}
		]
	]
])


//
//
// dialogs
//
//

function initDialogs(): void {
	$('.dialogs').each((i, obj) => {
		//console.log(i,obj);
		$(obj).dialog({
			autoOpen: false,
			modal: false,
			title: 'dialog',
			buttons: { 'ok': function(){
					$(obj).dialog('close')
				}
			}
		})
	})
}

$(function () {
	$('#gameoverDialog').dialog({
		title: 'game over',
		modal: true,
		open: function () {
			$(this).parent().find('.ui-dialog-titlebar-close').hide();
		},
		buttons: {
			'restart': function () {
				startTetris();
				$(this).dialog('close');
			},
			'toMainMenu': function () {
				toMainMenu();
				$(this).dialog('close');
			}
		},
	})

	$('#pauseDialog').dialog({
		title: 'pause',
		modal: true,
		closeOnEscape: false,
		open: function () {
			isPausing = true;
			currentMinoLockDownTimer.pauseTimeout();
			pauseTimer('fall');
			addKeyActions({code:'Escape', keydownAc:function() {
				removeKeyActions('Escape');
				$('#pauseDialog').dialog('close');
				if (canFall()) {
					restartTimer('fall');
				} else {
					currentMinoLockDownTimer.restartTimeout();
				}
			}});
			$(this).parent().find('.ui-dialog-titlebar-close').hide();
		},
		close: function () {
			removeKeyActions('Escape');
			addPauseKeyActions('Escape');
			isPausing = false;
		},
		buttons: {
			'close': function () {
				$(this).dialog('close');
				if (canFall()) {
					restartTimer('fall');
				} else {
					currentMinoLockDownTimer.restartTimeout();
				}
			},
			'restart': function () {
				endTetris();
				$(this).dialog('close');
				startTetris();
			},
			'toMainMenu': function () {
				endTetris();
				$(this).dialog('close');
				toMainMenu();
			}
		}
	})
})


//
//
// gameOptions
//
//

//let currentMethodOfOperationForTouch = 'swipe';

//const options = ['GameRule']


//
//
// tetrisGameType
//
//

//const GameRuleClasses = ['Normal','Terrain'] as const;
//type GameRuleClass = typeof GameRuleClasses[number];

//const GameRules = ['normal', 'practiceFor4ren'] as const;

const PracticeFor4ren = new GameRule({
	name:'practiceFor4ren',
	title:'4line REN',
	generateTerrain:() => {
		let terrainArray = GameRule.Normal.generateTerrain();
		forEachMinoOnField((pos) => {
			if (pos.x<3 || pos.x>6) {
				terrainArray[pos.y][pos.x] = 'wall';
			}
		})
		terrainArray[21][3] = 'wall';
		terrainArray[21][4] = 'wall';
		terrainArray[21][5] = 'wall';

		return terrainArray;
	},
	generateRegularlyTerrain:() => {
		let terrain:Tetrimino[] = GameRule.Normal.generateRegularlyTerrain();
		terrain[0] = 'wall';
		terrain[1] = 'wall';
		terrain[2] = 'wall';
		terrain[7] = 'wall';
		terrain[8] = 'wall';
		terrain[9] = 'wall';

		return terrain;
	}
})

const wideMatrix = new ChangeSizeOfMatrix(
	'wide Matrix',
	'wide Matrix',
	25,15,2
)

const HideFallingMinos = new GameRule({
	name: 'hideFallingMinos',
	title: 'to hide falling minos',
	cssClass: 'hideFallingMinos',
})

const StackingForPerfect: GameRule = new GameRule({
	name: 'stackingForPerfect',
	title: 'パフェ積み',
	generateTerrain: () => {
		const normalTerrain = GameRule.Normal.generateTerrain();

		return getMirrorFieldAtRnd(setWall(normalTerrain,
					[
						{x:0,y:21},{x:1,y:21},{x:2,y:21},{x:7,y:21},{x:8,y:21},{x:9,y:21},
						{x:0,y:20},{x:1,y:20},{x:2,y:20},{x:3,y:20},{x:7,y:20},{x:8,y:20},{x:9,y:20},
						{x:0,y:19},{x:1,y:19},{x:2,y:19},{x:7,y:19},{x:8,y:19},{x:9,y:19},
						{x:0,y:18},{x:1,y:18},{x:7,y:18},{x:8,y:18},{x:9,y:18}
					]
				))
	},
	arrangeFirstSituation: () => {
		holdMinoType = 'i'
		displayHold()
	},
	arrangeSituation: () => {
		if (totalFallenTetrimino%4==0) {
			holdMinoType = 'i';
			fieldArray = StackingForPerfect.generateTerrain();
			displayAllMinos()
			displayHold()
			followingMinos = [];
		}
	}
})

function setWall(field: readonly Tetrimino[][],poses: readonly Pos[]): Tetrimino[][] {
	let field_cloned = cloneArray(field);
	for (const pos of poses) {
		field_cloned[pos.y][pos.x] = 'wall';
	}
	return field_cloned;
}

const GameRules: GameRule[] = [GameRule.Normal, PracticeFor4ren, wideMatrix, HideFallingMinos, StackingForPerfect]
//type GameRule = typeof GameRules[number];
const EnumOfGameRule:Enum<GameRule> = {
	defArray: GameRules,
	toEnum: toGameRule,
	toString: GameRule.toString,
	getTitle: GameRule.getTitle,
}

function toString(arg: string): string {
	return arg as string;
}

const gameRuleOption = new GameOption<GameRule>('gameRule', 0, EnumOfGameRule);

function toGameRule(arg: any): GameRule|undefined {
	if (GameRules.includes(arg as GameRule)) {
		return arg as GameRule;
	}
	return undefined;
}

//function toString(arg: GameRule): string {
//	return arg as string;
//}
//function getTitleOfGameRule(arg: GameRule): string {
//	switch (arg) {
//		case 'normal': return 'Normal';
//		case 'practiceFor4ren': return '4ren'
//	}
//}

//const gameRuleConfigs = new Map<GameRule,GameRuleClass[]>();
//gameRuleConfigs.set('normal', ['Normal']);
//gameRuleConfigs.set('practiceFor4ren', ['Terrain']);

//const generateTerrain = new Map<GameRule, ()=>Tetrimino[][]>();
//generateTerrain.set('normal', () => {
//	let terrainArray:Tetrimino[][] = [];
//	for (let i = 0; i < normalFieldHeight; i++) {
//		terrainArray.push(new Array(normalFieldWidth).fill('empty'))
//	}
//	return terrainArray;
//})
//generateTerrain.set('practiceFor4ren', () => {
//	const generateTerrainFn = generateTerrain.get('normal');
//	if (typeof generateTerrainFn !== 'undefined') {
//		let terrainArray = generateTerrainFn();
//		forEachMinoOnField((pos) => {
//			if (pos.x<3 || pos.x>6) {
//				terrainArray[pos.y][pos.x] = 'wall';
//			}
//		})
//		terrainArray[21][3] = 'wall';
//		terrainArray[21][4] = 'wall';
//		terrainArray[21][5] = 'wall';

//		return terrainArray;
//	}
//	return []
//})

//const generateRegularlyTerrain = new Map<GameRule, ()=>Tetrimino[]>();
//generateRegularlyTerrain.set(GameRule.Normal, ()=>{
//	return Array(normalFieldWidth).fill('empty');
//})
//generateRegularlyTerrain.set('practiceFor4ren', ()=>{
//	const generateRegularlyTerrainTemp = generateRegularlyTerrain.get('normal');
//	if (typeof generateRegularlyTerrainTemp !== 'undefined') {
//		let terrain:Tetrimino[] = generateRegularlyTerrainTemp();
//		terrain[0] = 'wall';
//		terrain[1] = 'wall';
//		terrain[2] = 'wall';
//		terrain[7] = 'wall';
//		terrain[8] = 'wall';
//		terrain[9] = 'wall';

//		return terrain;
//	}
//	return [];
//})

//function hasGameRuleType(rule: GameRule,type: GameRuleClass) {
//	const config = gameRuleConfigs.get(rule);
//	if (typeof config !== 'undefined') {
//		return config.includes(type);
//	}
//	return false;
//}

function resetField() {
	console.log(gameRuleOption.currentOption);
	fieldArray = gameRuleOption.currentOption.generateTerrain();
	//if (hasGameRuleType(gameRuleOption.currentOption, "Terrain")) {
	//	const generateTerrainTemp = generateTerrain.get(gameRuleOption.currentOption);
	//	if (typeof generateTerrainTemp !== 'undefined') {
	//		fieldArray = generateTerrainTemp();
	//	}
	//} else {
	//	const generateTerrainTemp = generateTerrain.get('normal');
	//	if (typeof generateTerrainTemp !== 'undefined') {
	//		fieldArray = generateTerrainTemp();
	//	}}
}

function getRegularlyTerrain() {
	return gameRuleOption.currentOption.generateRegularlyTerrain();
	//if (hasGameRuleType(gameRuleOption.currentOption, "Terrain")) {
	//	const generateRegularlyTerrainTemp = generateRegularlyTerrain.get(gameRuleOption.currentOption)
	//	if (typeof generateRegularlyTerrainTemp !== 'undefined') {
	//		return generateRegularlyTerrainTemp()
	//	}
	//} else {
	//	const generateRegularlyTerrainTemp = generateRegularlyTerrain.get('normal')
	//	if (typeof generateRegularlyTerrainTemp !== 'undefined') {
	//		return generateRegularlyTerrainTemp()
	//	}
	//}
}

//
//
// display
//
//

const TouchScreenQuery = window.matchMedia('(pointer: coarse)');
/**
 * [fieldArray description]
 * @type {Array} fieldArray[y][x]=TetriminoEnum
 */
let fieldArray:Tetrimino[][] = [];

/**
 * scoreに表示する値
 * @type {Object}
 */
//let scoring = {};
let scoring = new Map<string, number>();
//
//
//	メインメニュー
//
//

function hideAll() {
	$('#gameArea').css('display', 'none');
	$('#mainMenuArea').css('display', 'none');
	$('#keyBindingsArea').css('display', 'none');
}

function toMainMenu(): void {
	displayMainMenu();
	clearField();
	clearScoreArea();
	clearHoldArea();
	clearNextArea();
	clearHoldQueue();
	clearNextQueue();
	hideAll();
	removeKeyActions('Escape')
	$('#mainMenuArea').css('display','block');
	$('#pauseButton').css('display', 'none');
}
function toGame() {
	hideAll();
	$('#gameArea').css('display','grid');
	$('#pauseButton').css('display', 'block');
}
function toKeyBindings() {
	hideAll();
	$('#keyBindingsArea').css('display','block');
	displayKeyBindings()
}

function displayMainMenu(): void {
	displayStartButton();
	displayOptions();
}

function displayStartButton(): void {
	$('#startButtonArea').html(textOfStartButton());
}

function displayOptions(): void {
	$('#optionsArea').html(textOfOptions());
	gameRuleOption.displayRadioOption('#optionsArea');

	//$('input[name="gameRule"]').val([gameRuleOption.currentOption]);
}

function textOfStartButton(): string {
	return	'<button id="startButton">ゲームスタート</button>'
}

function textOfOptions(): string {
	let text = '';
	text += '<button id="toKeyBindings">操作設定</button>'
	text += '<div></div>';
	return text;
}

function displayKeyBindings() {
	$('#keyBindingsArea').html(textOfFromKeyToMainMenu());
	if (TouchScreenQuery.matches) {
		MethodOfOpForTouchOption.displayRadioOption('#keyBindingsArea')
		//$('#keyBindingsArea').append(textOfKeyBindingsForTouch());
	} else {
		$('#keyBindingsArea').append(textOfKeyBindingsForPC());

		for (const operation of Operations) {
			//console.log(operation, keyBinding.get(operation));
			$('#keyFor'+toUpperFirstLetter(operation)).text(keyBinding.get(operation)!);
		}
	}
}

function textOfFromKeyToMainMenu(): string {
	return '<button id="fromKeyToMainMenu">メインメニュー</button>';
}

//function textOfKeyBindingsForTouch(): string {
//	let text = '';
//	text += `
//		<div class="optionRadio" id="methodOfOperationForTouchRadioContainer">
//			<div class="radio">
//				<input type="radio" name="methodOfOperationForTouch" value="swipe" id="methodForTouch-swipe" checked>
//				<label for="methodForTouch-swipe" class="radio-label">スワイプ</label>
//			</div>
//			<div class="radio">
//				<input type="radio" name="methodOfOperationForTouch" value="button" id="methodForTouch-button">
//				<label for="methodForTouch-button" class="radio-label">ボタン</label>
//			</div>
//		</div>
//	`
//	return text;
//}

function textOfKeyBindingsForPC(): string {
	let text = '';
	text += `
		<table border='1'>
			<tr>
				<th>操作</th>
				<th>キー</th>
			</tr>
			<tr>
				<td>左移動</td>
				<td>
					<p class='keyForAny' id='keyForLeft'>
						a
					</p>
				</td>
			</tr>
			<tr>
				<td>右移動</td>
				<td>
					<p class='keyForAny' id='keyForRight'>
						d
					</p>
				</td>
			</tr>
			<tr>
				<td>ソフトドロップ</td>
				<td>
					<p class='keyForAny' id='keyForSoftDrop'>
						s
					</p>
				</td>
			</tr>
			<tr>
				<td>ハードドロップ</td>
				<td>
					<p class='keyForAny' id='keyForHardDrop'>
						w
					</p>
				</td>
			</tr>
			<tr>
				<td>左回転</td>
				<td>
					<p class='keyForAny' id='keyForLeftRotation'>
						ArrowLeft
					</p>
				</td>
			</tr>
			<tr>
				<td>右回転</td>
				<td>
					<p class='keyForAny' id='keyForRightRotation'>
						ArrowRight
					</p>
				</td>
			</tr>
			<tr>
				<td>ホールド</td>
				<td>
					<p class='keyForAny' id='keyForHold'>
						Shift
					</p>
				</td>
			</tr>
		</table>
	`
	return text;
}

//
//
// フィールド
//
//

function displayMatrix(): void {
	let matrixText = "";
	setSizeOfMatrix()

	forEachMinoOnMatrix((pos) => {
			matrixText += "<div class='minos' data-x='"+pos.x+"' data-y='"+pos.y+"'></div>"
	})

	$('#field').html(matrixText);
}

function clearField(): void {
	resetField();
	displayAllMinos();
}

function displayAllMinos(): void {
	console.log(fieldArray);
	forEachMinoOnMatrix((pos) => {
			$('.minos[data-x="'+pos.x+'"][data-y="'+pos.y+'"]').attr('class','minos '+fieldArray[pos.y][pos.x]+"Minos placedMinos "+gameRuleOption.currentOption.cssClass);
	})
}

//function setMinosStyle(): void {
//	for (const mino of TetriminoEnum.defArray) {
//		$('.'+mino+'Minos.placedMinos').css(gameRuleOption.currentOption.getStyle(mino));
//		$('.'+mino+'Minos.fallingMinos').css(gameRuleOption.currentOption.getStyleFalling(mino));
//		console.log(`style is ${JSON.stringify(gameRuleOption.currentOption.getStyleFalling(mino))} and ${JSON.stringify(gameRuleOption.currentOption.getStyle(mino))}`);
//	}
//}

function setSizeOfMatrix() {
	//$(':root').style.setProperty()
	setCssVar('--heightOfMatrix', gameRuleOption.currentOption.matrixHeight.toString());
	setCssVar('--widthOfMatrix', gameRuleOption.currentOption.matrixWidth.toString());
	if (TouchScreenQuery.matches){
		const sizeOfMino = 15 * 10 / gameRuleOption.currentOption.matrixWidth;
		//console.log(gameRuleOption.currentOption.matrixWidth,`sizeOfMino is ${sizeOfMino}`);
		setCssVar('--sizeOfMino', sizeOfMino + 'px');
	}
}

function displayDifferFallingMinos(differs: Mino[],callback: ()=>void): void {
	for (var mino of differs) {
		displayFallingMino(mino)
		updateMatrixArray(mino)
	}

	callback()
}
function displayDifferPlacedMinos(differs: Mino[],callback: ()=>void): void {
	for (var mino of differs) {
		displayPlacedMino(mino)
		updateMatrixArray(mino)
	}

	callback()
}

function displayDifferWithDelay(differs: Mino[],callback: ()=>void) {
	let differsTemp = cloneArray(differs)

	clearTimer('fall')
	setTimer('fall',displayDifferFallingMinos.bind(null,differsTemp,callback),currentFallingSpeed(currentLevel))
	console.log(moveTimers.get('fall'));
}

function displayGhostMinos(): void {
	for (let tile of ghostMinos) {
		displayGhostMino(tile)
	}
}

function removeGhostMinos(): void {
	const formerGhost = cloneArray<Mino>(ghostMinos)
	for (let tile of formerGhost) {
		removeGhostMino(tile)
	}
}

function displayFallingMino(mino: Mino): void {
	$('.minos[data-x="'+mino.x+'"][data-y="'+mino.y+'"]').attr('class','minos '+mino.mino+"Minos fallingMinos "+gameRuleOption.currentOption.cssClass);
	//$('.minos[data-x="'+mino.x+'"][data-y="'+mino.y+'"]').css(gameRuleOption.currentOption.getStyleFalling(mino.mino));
}
function displayPlacedMino(mino: Mino): void {
	$('.minos[data-x="'+mino.x+'"][data-y="'+mino.y+'"]').attr('class','minos '+mino.mino+"Minos placedMinos "+gameRuleOption.currentOption.cssClass);
	//$('.minos[data-x="'+mino.x+'"][data-y="'+mino.y+'"]').css(gameRuleOption.currentOption.getStyle(mino.mino));
}

function displayGhostMino(mino: Mino): void {
	if (mino.y< gameRuleOption.currentOption.bufferHeight) {
		return ;
	}
	let ghostText = "<div class='ghostMinos "+mino.mino+"GhostMinos "+gameRuleOption.currentOption.cssClass+"'></div>"
	$('.minos[data-x="'+mino.x+'"][data-y="'+mino.y+'"]').html(ghostText);
}

function removeGhostMino(mino: Mino | Pos): void {
	$('.minos[data-x="'+mino.x+'"][data-y="'+mino.y+'"]').html("");
}

function displayButtonsToOperate(): void {
	$('#buttonsToOperateArea').html(textOfButtonsToOperate);
}
function hideButtonsToOperate(): void {
	$('#buttonsToOperateArea').html('');
}

function textOfButtonsToOperate(): string {
	let text = '';
	text += `
		<button class='buttonsToOperate' data-operate='left'></button>
		<button class='buttonsToOperate' data-operate='right'></button>
		<button class='buttonsToOperate' data-operate='softDrop'></button>
		<button class='buttonsToOperate' data-operate='hardDrop'></button>
		<button class='buttonsToOperate' data-operate='leftRotation'></button>
		<button class='buttonsToOperate' data-operate='rightRotation'></button>
		<button class='buttonsToOperate' data-operate='hold'>Hold</button>
	`;
	//text += `
	//	<button class='buttonsToOperate' data-operate='left'><img src='imgs/right.png'></button>
	//	<button class='buttonsToOperate' data-operate='right'><img src='imgs/right.png'></button>
	//	<button class='buttonsToOperate' data-operate='softDrop'><img src='imgs/right.png'></button>
	//	<button class='buttonsToOperate' data-operate='hardDrop'><img src='imgs/right-double.png'></button>
	//	<button class='buttonsToOperate' data-operate='leftRotation'><img src='imgs/leftRotation.png'></button>
	//	<button class='buttonsToOperate' data-operate='rightRotation'><img src='imgs/rightRotation.png'></button>
	//	<button class='buttonsToOperate' data-operate='hold'>Hold</button>
	//`;
	return text;
}

function displayNext(): void {
	$('#nextArea').html(textOfNext())
}

function textOfNext(): string {
	let text = "<p id='nextHead'>Next</p>";
	for (let i = 0; i < NumOfNext; i++) {
		if(typeof followingMinos[i] !== 'undefined') {
			text += textOfMinoAlone(followingMinos[i] as Tetrimino);
		}
	}
	return text;
}

function displayHold(): void {
	$('#holdArea').html(textOfHold())
}

function textOfHold(): string {
	let text = "<p id='holdHead'>hold</p>"+textOfMinoAlone(holdMinoType);
	return text;
}

function textOfMinoAlone(type: Tetrimino): string {
	// console.log(type);
	let text = "<div class='displayers'>";
	if (!type || type=='empty') {
		for (var i = 0; i < 8; i++) {
			text += '<div class="minos emptyMinos"></div>'
		}
		text + '</div>'
		return text;
	}

	const shape = ShapesOfTetrimino.get(type);
	if (typeof shape !== 'undefined') {
		const shape_defined = shape as number[][];
		for (let line of shape_defined) {
			if (type != 'i') {
				if (type == 'o') {
					text += '<div class="minos emptyMinos"></div>'
					text += '<div class="minos emptyMinos"></div>'
				} else {
					text += '<div class="minos emptyMinos"></div>'
				}
			}
			for (let tile of line) {
				if (tile==-1) {
					text += '<div class="minos emptyMinos"></div>'
				} else {
					text += '<div class="minos '+type+'Minos"></div>'
				}
			}
		}
	}
	if (type=='i') {
		text += '<div class="minos emptyMinos"></div><div class="minos emptyMinos"></div><div class="minos emptyMinos"></div><div class="minos emptyMinos"></div>'
	}
	text += '</div>'
	return text;
}

function displayScoreArea(): void {
	$('#scoreArea').html(textOfScoreArea())
}

function textOfScoreArea(): string {
	let text = ''
	scoring.forEach((val,key) => {
		text += DisplayTitleOfAction.get(key)+":"+scoring.get(key)+"<br>"
	})
	return text;
}

function clearHoldArea():void {
	$('#holdArea').html('')
}

function clearNextArea(): void {
	$('#nextArea').html('')
}

function clearScoreArea(): void {
	$('#scoreArea').html('')
}

//
//
// global
//
//

let currentLevel: number = 1;

//let currentMino: Mino;
let followingMinos:Tetrimino[] = [];

let holdMinoType: Tetrimino;

function currentFallingSpeed(level: number): number {
	let speedRate = 1;
	if(currentMinoIsSoftDrop) {
		speedRate = 0.05;
	}
	return FallingSpeed(level)*speedRate;
}

let canHold: boolean;

let score: number;

let currentREN:number = -1;

let totalClearedLine: number;
let totalFallenTetrimino: number;

let isJustNowSpin: number;

let isPlayingTetris: boolean;

let swiper: Swiper;

//let currentGameRule: GameRule = 'normal';

//
//
// systems
//
//

function startTetris() {
	//ion.sound.play("startSound",{volume:'0.4'})
	startSound.play()
	displayMatrix()
	reset()
	gameRuleOption.currentOption.arrangeFirstSituation();
	startToAppearMinos()
	if (MethodOfOpForTouchOption.currentOption=='swipe') {
		swiper = new Swiper(document, 40, 300, 50)
	}
	addPauseKeyActions('Escape')
	console.log(gameRuleOption.currentOption);
	//setMinosStyle();
}

function initTetris() {
	toGame()
}


function startToAppearMinos() {
	console.log('start');

	if ( gameRuleOption.currentOption.shouldGenerateTetriminos(followingMinos) ) {
		followingMinos = gameRuleOption.currentOption.generateNextTetriminos(followingMinos);
	}
	console.log(followingMinos);

	initMino(followingMinos[0]);
	followingMinos.shift()
	displayHold()
	displayNext()
	displayScoreArea()
	currentMinoLockedDownCallback = function (ind: number) {
		//console.log(ind);
		withGameOver(ind,function () {
			endTetris()
			$('#gameoverDialog').dialog('open')
		},function () {
			canHold = true;
			gameRuleOption.currentOption.arrangeSituation();
			startToAppearMinos()
		})
	}
	startFall()
}

function isGameOver(indicator: number): boolean {
	// console.log(indicator);
	return isLockOut(indicator);
}

function isLockOut(indicator: number): boolean {
	return indicator<gameRuleOption.currentOption.bufferHeight;
}

function withGameOver(indicator: number, gameoverCb: ()=>void, continueCb: ()=>void): void {
	if (isGameOver(indicator)) {
		gameoverCb()
	} else {
		continueCb()
	}
}

//function checkGenerationOfTetriminos(minos: Tetrimino[]) {
//	let newMinos;
//	if (minos.length < NumOfNext+1) {
//		return minos.concat(generateTetriminos());
//	} else {
//		return minos;
//	}
//}

//function generateTetriminos(): Tetrimino[] {
//	//ミノをランダムにソート
//	const nextArray = shuffle(['i','o','s','z','j','l','t'] as Tetrimino[]);
//	return nextArray;
//}

function updateMatrixArray(mino: Mino) {
	//console.log(tile,fieldArray[tile[1]]);
	fieldArray[mino.y][mino.x] = mino.mino;
}

function reset() {
	score = 0;
	totalClearedLine = 0;
	totalFallenTetrimino = 0;

	clearHoldQueue();
	clearNextQueue();
	if (MethodOfOpForTouchOption.currentOption=='button') {
		displayButtonsToOperate();
	} else {
		hideButtonsToOperate();
	}
	displayHold();
	clearField();
	resetBag();
	resetScoringArray();
	displayScoreArea();
}

function hold() {
	if (!currentMinoDidLockDown && canHold) {
		canHold = false;
		if (holdMinoType && holdMinoType != 'empty') {
			// console.log(holdMinoType);
			let minoTypeTemp = holdMinoType;
			holdMinoType = currentMinoType;
			followingMinos.unshift(minoTypeTemp)
		} else {
			holdMinoType = currentMinoType;
		}
		hideCurrentMino(function () {
			clearTimer('fall')
			//clearTimeout(currentMinoLockDownTimer)
			currentMinoLockDownTimer.clearTimeout()
			startToAppearMinos()
		})
	}
}

function resetBag() {
	canHold = true;
}

function isScoring(str: Action) {
	return !notScorings.includes(str);
}

function resetScoringArray() {
	scoring.set('score', 0);
	scoring.set('ren', 0);
	scoring.set('perfectClear', 0);
	Actions.forEach(item => {
		if (isScoring(item)) {
			scoring.set(item, 0);
		}
	});
}

function addScore(actionStr: Action,rate=1) {
	const action = ScoreOfAction.get(actionStr);
	if (typeof action !== 'undefined') {
		score += action*rate;
		if (isScoring(actionStr)) {
			const scoringTemp = scoring.get(actionStr);
			if (typeof scoringTemp !== 'undefined') {
				scoring.set(actionStr,scoringTemp+1);
			}
		}
		scoring.set('score', score);
		displayScoreArea()
	}
}

function checkLine(callback: ()=>void) {
	let didClear = false;
	let linesToClear = [];
	for (var i = 0; i < fieldArray.length; i++) {
		if (isLineFilled(fieldArray[i])) {
			linesToClear.push(i)
			didClear = true;
		}
	}
	const numOfClearedLine = linesToClear.length;
	if (numOfClearedLine > 0) {
		currentREN++;
		if (currentREN>0) {
			addScore('ren', currentREN*currentLevel)
		}
	} else {
		currentREN = -1;
	}
	scoring.set('ren' ,(currentREN>0)?currentREN:0);
	displayScoreArea();
	afterAction(checkAction(numOfClearedLine));
	for (let ind of linesToClear) {
		clearLine(ind)
	}
	checkPerfectClear(numOfClearedLine);
	if (didClear) {
		displayAllMinos()
	}
	callback()
}


function checkAction(currentNumOfClearedLine: number): Action {
	switch (currentNumOfClearedLine) {
		case 1:
			switch(isTSpin()) {
				case 0:
					return 'tspin_single';
				case 1:
					return 'mini_tspin_single';
				default:
					return 'single';
			}
		case 2:
			return (isTSpin()==0)?'tspin_double':'double';
		case 3:
			return (isTSpin()==0)?'tspin_triple':'triple';
		case 4:
			return 'tetris';
		default:
			switch(isTSpin()) {
				case 0:
					return 'tspin';
				case 1:
					return 'mini_tspin';
				default:
					return 'none';
			}
	}
}

function checkPerfectClear(num: number): void {
	console.log(totalClearedLine, totalFallenTetrimino);
	if (fieldArray.find((line) => line.find((mino) => mino != 'empty') !== undefined) == undefined) {
		scoring.set('perfectClear', scoring.get('perfectClear')!+1);
		switch (num) {
			case 1:
				afterAction('singlePerfectClear')
				break;
			case 2:
				afterAction('doublePerfectClear');
				break;
			case 3:
				afterAction('triplePerfectClear');
				break;
			case 4:
				afterAction('tetrisPerfectClear');
				break;
			default:
				break;
		}
		displayScoreArea();
	}
}

/**
 * @return {number} -1:normal 0:t-spin 1:mini t-spin
 */
function isTSpin() {
	if(currentMinoType!='t' || isJustNowSpin==-1) return -1;

	let indicatorArray:Pos[] = getFilledTilesAroundT_normalized()
	//console.log(indicatorArray,includesArray<Pos>(indicatorArray,{x:-1,y:-1}) && includesArray<Pos>(indicatorArray,{x:1,y:-1}));

	if (isJustNowSpin==5) {
		return 0;
	}

	if (indicatorArray.length<3) {
		return -1;
	} else if (includesArray(indicatorArray,{x:-1,y:-1}) && includesArray(indicatorArray,{x:1,y:-1})) {
		return 0;
	} else {
		console.log(indicatorArray);
		return 1;
	}
}

function getFilledTilesAroundT(): Pos[] {
	let tiles:Pos[] = [];

	if (isFilledOrWall(currentMinoX-1,currentMinoY-1)) tiles.push({x:-1,y:-1})
	if (isFilledOrWall(currentMinoX-1,currentMinoY+1)) tiles.push({x:-1,y: 1})
	if (isFilledOrWall(currentMinoX+1,currentMinoY-1)) tiles.push({x: 1,y:-1})
	if (isFilledOrWall(currentMinoX+1,currentMinoY+1)) tiles.push({x: 1,y: 1})

	//console.log(tiles);
	return tiles;
}

function getFilledTilesAroundT_normalized(): Pos[] {
	return changeFacing(getFilledTilesAroundT(),currentMinoFacing)
}

function afterAction(type: Action) {
	// console.log(type);
	addScore(type,currentLevel)
}

function clearLine(i: number) {
	for (var j = i-1; j >= 0; j--) {
		fieldArray[j+1] = cloneArray(fieldArray[j]);
	}
	fieldArray[0] = getRegularlyTerrain();
	//const generateRegularlyTerrainFn = generateRegularlyTerrain.get(gameRuleOption.currentOption);
	//if (typeof generateRegularlyTerrainFn !== 'undefined') {
	//	fieldArray[0] = generateRegularlyTerrainFn();
	//}
	totalClearedLine++;
}

function isLineFilled(array: Tetrimino[]) {
	return  !array.find((e) => e == "empty");
}

function endTetris() {
	console.log('end tetris');
	isPlayingTetris = false;
	clearTimer('fall');
	//clearTimeout(currentMinoLockDownTimer);
	currentMinoLockDownTimer.clearTimeout();
	if (typeof swiper !== 'undefined') {
		swiper.destructor()
	}
}

function clearHoldQueue() {
	holdMinoType = 'empty';
}

function clearNextQueue() {
	followingMinos = [];
}

/**
 *
 * @param {function} fn [fn(x,y)]
 */
function forEachMinoOnMatrix(fn: (p:Pos)=>void) {
	for (let i = gameRuleOption.currentOption.bufferHeight-1; i < gameRuleOption.currentOption.fieldHeight; i++) {
		for (let j = 0; j < gameRuleOption.currentOption.fieldWidth; j++) {
			fn({x:j,y:i})
		}
	}
}

/**
 *
 * @param {function} fn [fn(x,y)]
 */
function forEachMinoOnField(fn: (p:Pos)=>void) {
	for (let i = 0; i < gameRuleOption.currentOption.fieldHeight; i++) {
		for (let j = 0; j < gameRuleOption.currentOption.fieldWidth; j++) {
			fn({x:j,y:i})
		}
	}
}

//
//
// tetriminos
//
//

let currentMinoType: Tetrimino;

let currentMinoFacing: number;
let currentMinoX: number;
let currentMinoY: number;

let currentMinoTiles: Mino[];
let currentMinoIsVisible: boolean;

let currentMinoIsSoftDrop: boolean;
let currentMinoIsHardDrop: boolean;

let lowestPos: number;
let lowestPosWithLowerFace: number;
let numberOfMoveWithLowerFace: number;
let currentMinoDidLockDown: boolean;
let currentMinoLockDownTimer: TimerOfAbilityToEsc = new TimerOfAbilityToEsc();
let currentMinoLockedDownCallback: (lower: number) => void;

let isLoopingOfFalling: boolean;

let indicatorForLockDown;

let isMoving;

let moveTimers: Map<string, TimerOfAbilityToEsc>;

let ghostMinos: Mino[];
let ghostPos: Pos;

let isPausing: boolean;

function initMino( type: Tetrimino ) {
	currentMinoType = type;
	currentMinoFacing = 0;
	currentMinoX = 4;
	currentMinoY = 1;
	currentMinoTiles = getTetrimino(currentMinoType,currentMinoX,currentMinoY,currentMinoType)
	currentMinoIsVisible = true;
	currentMinoDidLockDown = false;
	currentMinoIsSoftDrop = false;
	currentMinoIsHardDrop = false;
	setNumberOfMoveWithLowerFace(0);
	lowestPos = currentMinoY;
	currentMinoLockedDownCallback = function () {}
	moveTimers = new Map();
	ghostMinos = []
	isPlayingTetris = true;
	isPausing = false;
}

function setCurrentMinoY(y: number): number {
	if (lowestPos < y) {
		lowestPos = y;
		setNumberOfMoveWithLowerFace(0)
	}
	currentMinoY = y;
	return currentMinoY;
}

function setNumberOfMoveWithLowerFace(num: number): number {
	console.log('%c' + num, 'color: red');
	numberOfMoveWithLowerFace = num;

	return numberOfMoveWithLowerFace;
}

function lowerPos(): number {
	let lower = -1;
	$.each(currentMinoTiles ,(i, tile: Mino) => {
		if(tile.y>lower) lower=tile.y;
	});
	//console.log(lower);
	return lower;
}

function setTimer(name: string, callback: ()=>void, delay: number): void {
	if(name=='fall') isLoopingOfFalling = true;
	//moveTimers[name] = setTimeout(callback,delay)
	console.log(new TimerOfAbilityToEsc(callback, delay));
	moveTimers.set(name, new TimerOfAbilityToEsc(callback, delay));
	moveTimers.get(name)!.setTimeout();
}

function clearTimer(name: string): void {
	if(name=='fall') isLoopingOfFalling = false;
	//clearTimeout(moveTimers[name])
	//console.log(name,moveTimers.get(name));
	const Timer = moveTimers.get(name);
	if (typeof Timer !== 'undefined') {
		Timer.clearTimeout();
	}
}

function pauseTimer(name: string): void {
	if (name=='fall') isLoopingOfFalling = false;
	moveTimers.get(name)!.pauseTimeout();
}

function restartTimer(name: string): void {
	if (name=='fall') isLoopingOfFalling = true;
	moveTimers.get(name)!.restartTimeout();
}

function isWall(x: number, y: number): boolean {
	return (x<0 || x>gameRuleOption.currentOption.fieldWidth-1 || y>gameRuleOption.currentOption.fieldHeight-1)
}

function isOutOfField(x: number, y: number): boolean {
	return isWall(x,y) || y<0
}
function isOutOfMatrix(x: number, y: number): boolean {
	return isWall(x,y) || y<gameRuleOption.currentOption.bufferHeight-1
}

function isFilledOrWall(x: number, y:number): boolean{
	if (isWall(x,y)) return true;

	if (fieldArray[y][x]!='empty') return true;

	return false;
}

function canMove(followingMinos: Mino[]): boolean {
	for (let tile of followingMinos) {
		if (isOutOfField(tile.x,tile.y)) {
			return false;
		}
		if (isOtherTiles(tile)) {
			return false;
		}
	}
	return true;
}

function canBeAppeared(): boolean {
	for (const mino of currentMinoTiles) {
		if (isOutOfField(mino.x,mino.y)) {
			return false;
		}
		if (fieldArray[mino.y][mino.x]!='empty') {
			return false;
		}
	}
	return true;
}

function isOtherTiles(tile: Mino | Pos): boolean {
	if (fieldArray[tile.y][tile.x] != 'empty') {
		if ( !currentMinoIsVisible ) return true;
		if ( !currentMinoTiles.find((element) => {return element.x==tile.x && element.y==tile.y }) ) {
			return true;
		}
	}
	return false;
}

function fall(callback: (b: boolean)=>void): void {
	moveWithDelay(0,1,'fall',callback);
}

function getShaft(): Pos {
	if (currentMinoType!='i') {
		return {x:currentMinoX,y:currentMinoY}
	} else {
		const dif = [
			{x:0,y:0},
			{x:1,y:0},
			{x:1,y:1},
			{x:0,y:1}
		]
		return {x:currentMinoX+dif[currentMinoFacing].x,y:currentMinoY+dif[currentMinoFacing].y}
	}
}
function setShaftClass(pos: Pos|Mino): void {
	$('.shaft').removeClass('shaft');
	$(`.minos[data-x="${pos.x}"][data-y="${pos.y}"]`).addClass('shaft');
}
function setGhostShaftClass(pos: Pos|Mino): void {
	$('.ghostShaft').removeClass('ghostShaft');
	$(`.minos[data-x="${pos.x}"][data-y="${pos.y}"] > .ghostMinos`).addClass('ghostShaft');
}

function move(dx: number, dy: number, callback: (b:boolean)=>void): void {
	moveAndRotate(dx,dy,0,callback)
}

function moveAndRotate(dx: number, dy: number, sgn: number, callback: (b:boolean)=>void): void {
	const followingTiles = getMovedAndRotatedTetrimino(dx,dy,sgn);
	if (canMove(followingTiles)) {
		currentMinoX += dx;
		setCurrentMinoY(currentMinoY + dy);
		console.log(currentMinoX,currentMinoY);
		changeCurrentMinos(followingTiles, function () {
			currentMinoFacing = (currentMinoFacing + sgn) % 4;
			setShaftClass(getShaft());
			displayGhost()
			callback(true)
		})
	} else {
		callback(false)
	}
}


function replaceMinos(tiles: Mino[], type: Tetrimino): Mino[] {
	let replacedTiles:Mino[] = [];
	for (let tile of tiles) {
		replacedTiles.push({x:tile.x,y:tile.y,mino:type})
	}
	return replacedTiles;
}

function moveWithDelay(dx: number, dy: number, timerName: string, callback: (b:boolean)=>void): void {
	moveAndRotateWithDelay(dx,dy,0,timerName,callback)
}

function moveAndRotateWithDelay(dx: number, dy: number, sgn: number, timerName: string, callback: (b:boolean)=>void): void {
	clearTimer(timerName)
	setTimer(timerName,moveAndRotate.bind(null,dx,dy,sgn,callback),currentFallingSpeed(currentLevel))
}

function changeCurrentMinos(followingTiles: Mino[],callback: ()=>void): void {
	let formerTiles = replaceMinos(currentMinoTiles,'empty')
	currentMinoTiles = cloneArray(followingTiles)
	displayDifferPlacedMinos(formerTiles,function () {
		displayDifferFallingMinos(followingTiles,callback)
		setShaftClass(getShaft());
	})
}

function hideCurrentMino(callback: ()=>void) {
	removeGhostMinos()
	displayDifferPlacedMinos(replaceMinos(currentMinoTiles,'empty'),callback)
}

function checkGhost(): number {
	let hightOfAbleToDrop = []
	for (let tile of currentMinoTiles) {
		for (var i = tile.y; i < gameRuleOption.currentOption.fieldHeight; i++) {
			if (isOtherTiles({x:tile.x,y:i})) {
				hightOfAbleToDrop.push(i-tile.y-1)
				break;
			} else if (i==gameRuleOption.currentOption.fieldHeight-1) {
				hightOfAbleToDrop.push(i-tile.y)
				break;
			}
		}
	}
	const hightOfDropping = minArray(hightOfAbleToDrop)
	if (hightOfDropping == 0) {
		ghostMinos = []
		ghostPos = {x:-1, y:-1}
	} else {
		ghostMinos = getMovedAndRotatedTetrimino(0,hightOfDropping,0)
		ghostPos = {x:getShaft().x,y:getShaft().y+hightOfDropping}
	}
	console.log(hightOfDropping, ghostPos);
	return hightOfDropping;
}


function displayGhost(): void {
	console.log('displayGhost');
	removeGhostMinos()
	checkGhost()
	displayGhostMinos()
	setGhostShaftClass(ghostPos);
}

function hardDrop(): void {
	if (canOperate()) {
		isJustNowSpin = -1;
		let hightOfDropping = checkGhost()
		removeGhostMinos()
		clearTimer('fall')
		let followingMinos = ghostMinos;
		setCurrentMinoY(currentMinoY+hightOfDropping)
		addScore('hardDrop',hightOfDropping)
		if (ghostMinos.length == 0) {
			followingMinos = currentMinoTiles;
		}
		changeCurrentMinos(followingMinos,lockDown.bind(null,'hardDrop'))
	}
}

function softDrop(b: boolean): void {
	if (b && canFall() && !currentMinoIsSoftDrop && !isPausing) {
		clearTimer('fall')
		currentMinoIsSoftDrop = true
		loopOfFall()
	} else if(!b) {
		currentMinoIsSoftDrop = false
	}
}

function startFall(): void {
	if (!currentMinoDidLockDown) {
		console.log('start to fall');
		//clearTimeout(currentMinoLockDownTimer)
		currentMinoLockDownTimer.clearTimeout()
		if (canBeAppeared()) {
			currentMinoIsVisible = true;
			currentMinoDidLockDown = false;
			displayDifferFallingMinos(currentMinoTiles,function () {
				displayGhost()
				if(!canFall())countLockDownTimer()
				loopOfFall()
			})
		} else {
			console.log(lowerPos());
			currentMinoLockedDownCallback(lowerPos())
		}
	}
}

function canFall(): boolean {
	let fallenTiles = getMovedTetrimino(0,1)
	let b = canMove(fallenTiles);
	if (isPlayingTetris) {
		return b;
	}
	return false;
}

function loopOfFall(): void {
	console.log('fall');
	isLoopingOfFalling = canFall()
	fall(function (b) {
		if (b) {
			isJustNowSpin = -1;
		}
		if (currentMinoIsSoftDrop) {
			addScore('softDrop')
		}
		if (canFall()) {
			loopOfFall()
		} else {
			console.log('clearTimeout');
			clearTimer('fall')
			countLockDownTimer();
		}
	})
}

function restartFall(): void {
	if (canFall() && !isLoopingOfFalling) {
		console.log('clear all timer');
		//clearTimeout(currentMinoLockDownTimer)
		currentMinoLockDownTimer.clearTimeout()
		clearTimer('fall')
		loopOfFall()
	}
}

function countLockDownTimer(): void {
	console.log('set timer');
	if (!currentMinoDidLockDown) {
		//clearTimeout(currentMinoLockDownTimer)
		currentMinoLockDownTimer.clearTimeout()
		currentMinoLockDownTimer = new TimerOfAbilityToEsc(lockDown.bind(null,'softDrop'), 500)
		currentMinoLockDownTimer.setTimeout()
		//currentMinoLockDownTimer = setTimeout(function () {
		//	lockDown()
		//},500)
	}
}

function lockDown(type: 'softDrop'|'hardDrop'): void {
	console.log('mino locks down');
	currentMinoDidLockDown = true;
	//clearTimeout(currentMinoLockDownTimer)
	currentMinoLockDownTimer.clearTimeout()
	for (const mino of currentMinoTiles) {
		$('.minos[data-x="'+mino.x+'"][data-y="'+mino.y+'"]').addClass('placedMinos')
		$('.minos[data-x="'+mino.x+'"][data-y="'+mino.y+'"]').removeClass('fallingMinos')
		//$('.minos[data-x="'+mino.x+'"][data-y="'+mino.y+'"]').css(gameRuleOption.currentOption.getStyle(mino.mino));
	}
	//ion.sound.play("lockDownSE", {
	//	ended_callback : function () {
	//		console.log("lockDownSE end");
	//	}
	//})
	const afterSoundFn = () => {
		let lower = lowerPos()
		totalFallenTetrimino++;
		checkLine(currentMinoLockedDownCallback.bind(null,lower))
	}
	if (type == 'hardDrop' ) {
		hardDropSound.play();
		hardDropSound.once('end', afterSoundFn)
	} else if ( isTSpin() == -1 ) {
		lockDownSound.play()
		lockDownSound.once('end', afterSoundFn)
	} else {
		afterSoundFn()
	}
}

function moveToLeft(callback: (b:boolean)=>void): void {
	operate(-1,0,0,callback)
}

function moveToRight(callback: (b:boolean)=>void): void {
	operate(1,0,0,callback)
}

function isAllowedOperate(): boolean {
	return numberOfMoveWithLowerFace<15;
}

function operate(dx: number, dy: number, sgn: number, callback: (b:boolean)=>void): void {
	if (canOperate()) {
		const formerCanFall = canFall();
		moveAndRotate(dx, dy, sgn, function(b) {
			if (b) {
				onOperating(formerCanFall)
			}
			callback(b)
		})
	}
}

function onOperating(formerCanFall: boolean): void {
	let currentCanFall = canFall()
	if (!currentCanFall && !isAllowedOperate()) {
		lockDown('softDrop')
		return;
	}
	if (!formerCanFall) {
		setNumberOfMoveWithLowerFace(numberOfMoveWithLowerFace+1);
		//clearTimeout(currentMinoLockDownTimer);
		currentMinoLockDownTimer.clearTimeout()
		if (currentCanFall) {
			restartFall()
		} else {
			countLockDownTimer()
		}
	} else {
		if (!currentCanFall) {
			countLockDownTimer()
			clearTimer('fall')
		}
	}
}

function canOperate(): boolean {
	return !currentMinoDidLockDown && isPlayingTetris && !isPausing;
}


function getTetriminoShape(type: Tetrimino): Pos[] | null {
	let minoArray:Pos[] = [];
	const shape: number[][] | undefined = ShapesOfTetrimino.get(type);
	let originPos:Pos = {x:0,y:0};
	if (typeof shape != 'undefined') {
		for (var i = 0; i < shape.length; i++) {
			for (var j = 0; j < shape[i].length; j++) {
				if (shape[i][j]!=-1){
					minoArray.push({x:j,y:i});
				}
				if (shape[i][j]==0) {
					originPos = {x:j,y:i}
				}
			}
		}
		return getMovedMinos(minoArray,-originPos.x,-originPos.y);
	} else {
		return null;
	}
}

function getMovedMinos(tiles: Pos[], dx: number, dy: number): Pos[] {
	return tiles.map((tile) => ({x:tile.x+dx,y:tile.y+dy}))
}

function getRotatedTetriminoShape(type: Tetrimino,d: number): Pos[] {
	const shape: Pos[] | null = getTetriminoShape(type);
	if (typeof shape !== null) {
		const shape_pos: Pos[] = shape as Pos[];
		if (type=='o') {
			return shape_pos;
		} else if (type=='i') {
			const differ = [
				[0,0],
				[1,0],
				[1,1],
				[0,1]
			]
			return getMovedMinos(changeFacing(shape_pos,d), differ[d][0], differ[d][1]);
		} else {
			console.log(type, shape, shape_pos);
			return changeFacing(shape_pos,d);
		}
	} else {
		return []
	}
}

function getTetrimino(type: Tetrimino, x: number, y: number, mino: Tetrimino): Mino[] {
	return getRotatedTetrimino(type,x,y,currentMinoFacing,mino)
}

function getRotatedTetrimino(type: Tetrimino, x: number, y: number, d: number, mino: Tetrimino): Mino[] {
	return getRotatedTetriminoShape(type,d).map((pos: Pos) => ({x:x+pos.x,y:y+pos.y,mino:mino}));
}
function getDifferOfMovedAndRotatedTetrimino(sgn: number): Pos {
	if (currentMinoType == 'o') {
		return {x:0,y:0};
	} else if (currentMinoType == 'i') {
		const dif = [
			{x:0,y:0},
			{x:1,y:0},
			{x:1,y:1},
			{x:0,y:1}
		]
		return dif[(sgn + currentMinoFacing) % 4];
	} else {
		return {x:0,y:0};
	}
}

function getMovedTetrimino(dx: number, dy: number): Mino[] {
	return getTetrimino(currentMinoType,currentMinoX+dx,currentMinoY+dy,currentMinoType)
}

function getMovedAndRotatedTetrimino(dx: number, dy: number, sgn: number): Mino[] {
	return getRotatedTetrimino(currentMinoType,currentMinoX+dx,currentMinoY+dy,(currentMinoFacing+sgn)%4,currentMinoType);
}

/**
 *
 * @param {number} formerFacing
 * @param {number} followingFacing
 * @returns どれだけ回転させるのか[n:n回右回転]
 */
function signOfRotation(formerFacing: number, followingFacing: number): number {
	return (((followingFacing - formerFacing) % 4) + 4) % 4;
}


/**
 * [changeDirection description]
 * @param  {Array<number>} tiles               [x,y]
 * @param  {number} sgn                 [0-3]
 * @return {Array<number>}       [0-3]
 */
function changeFacing(tiles: Pos[], sgn: number): Pos[] {
	//console.log(tiles);
	let newTiles:Pos[] = cloneArray<Pos>(tiles)
	//console.log(newTiles);
	if (sgn==0) {
		return newTiles;
	} else if(sgn==1) {
		newTiles = newTiles.map((tile) => ({x: -tile.y, y: tile.x}))
		return newTiles;
	} else if(sgn==2) {
		newTiles = newTiles.map((tile) => ({x:-tile.x, y:-tile.y}))
		return newTiles;
	} else {
		newTiles = newTiles.map((tile) => ({x: tile.y, y: -tile.x}))
		return newTiles;
	}
}


function superRotation(spinDirection: number, callback: (b:boolean)=>void): void {
	let i=0;
	moveSRS(spinDirection,i,function (b) {
		if (b) isJustNowSpin = i;
		callback(b)
	})
}

function moveSRS(spinDirection: number,i: number,callback: (b:boolean)=>void): void {
	let dx = 0;
	let dy = 0;
	if (i!=0) {
		const spinRuleTemp = spinRule.get(currentMinoType);
		if (typeof spinRuleTemp !== 'undefined') {
			const spinRuleTemp_defined = spinRuleTemp as Pos[][][];
			let differ = spinRuleTemp_defined[currentMinoFacing][spinDirection][i-1];
			dx = differ.x;
			dy = differ.y;
		}
	}
	// console.log(dx,dy);
	let sgn = (spinDirection==0)?1:3;
	operate(dx,dy,sgn,function(b){
		if (!b) {
			const spinRuleTemp = spinRule.get(currentMinoType);
			if (typeof spinRuleTemp !== 'undefined') {
				const spinRuleTemp_defined = spinRuleTemp as Pos[][][];
				if(spinRuleTemp_defined[currentMinoFacing][spinDirection][i]) {
					moveSRS(spinDirection,++i,callback)
				} else {
					callback(false)
				}
			} else {
				callback(false)
			}
		} else {
			callback(true)
		}
	})
}

function rightRotation() {
	console.log('rightSpin');
	if (canOperate()) {
		superRotation(0, function(b) {
			if (b && isTSpin()!=-1) {
				tspinSound.play()
			}
		})
	}
}

function leftRotation() {
	console.log('leftSpin');
	if (canOperate()) {
		superRotation(1, function (b) {
			if (b && isTSpin()!=-1) {
				tspinSound.play()
				// isJustNowSpin = b;
			}
		})
	}
}

//
//
// tetrisKeyinput
//
//

let dv2Border = 4.5;

const Operations = ['left','right','hardDrop','softDrop','leftRotation','rightRotation','hold'] as const;
type Operate = typeof Operations[number];

const MethodsOfOpForTouch = ['swipe', 'button'] as const;
type MethodOfOpForTouch = typeof MethodsOfOpForTouch[number];
const MethodOfOpForTouchEnum: Enum<MethodOfOpForTouch> = {
	defArray: MethodsOfOpForTouch,
	toEnum: toMethodsOfOpForTouch,
	toString: toString,
	getTitle: getTitleOfMethodOfOpForTouch,
}
const MethodOfOpForTouchOption = new GameOption('methodOfOpForTouch', 0, MethodOfOpForTouchEnum);

function toMethodsOfOpForTouch(arg: any): MethodOfOpForTouch|undefined {
	if (typeof arg !== 'string') {
		return undefined
	}
	if (MethodsOfOpForTouch.includes(arg as MethodOfOpForTouch)) {
		return arg as MethodOfOpForTouch;
	}
	return undefined;
}
//function toString(arg: MethodOfOpForTouch): string {
//	console.log(arg,arg as string);
//	return arg as string;
//}
function getTitleOfMethodOfOpForTouch(arg: MethodOfOpForTouch): string {
	switch (arg) {
		case 'swipe':
			return 'スワイプ'

		case 'button':
			return 'ボタン';
	}
}

let keyBinding = new Map<Operate, string>();

document.oncontextmenu = function () {return false;}
document.body.oncontextmenu = () => {
	return false;
}
document.addEventListener('touchmove', function (e) {
	e.preventDefault();
}, {passive: false})

function addRightKeyActions(key: string): void {
	addKeyActions({code:key, keydownAc:onRight, longpressAc:onRight, sec:300, interval:50});
	keyBinding.set('right', key);
}

function addLeftKeyActions(key:string) {
	addKeyActions({code:key, keydownAc:onLeft, longpressAc:onLeft, sec:300, interval:50});
	keyBinding.set('left', key);
}

function addHardDropKeyActions(key:string) {
	addKeyActions({code:key, keydownAc:onHardDrop, longpressAc:onHardDrop, sec:300, interval: 300})
	keyBinding.set('hardDrop', key);
}

function addSoftDropKeyActions(key:string) {
	addKeyActions({code:key, keydownAc:onSoftDrop.bind(null,true), keyupAc:onSoftDrop.bind(null,false), longpressAc:onSoftDrop.bind(null,true)})
	keyBinding.set('softDrop', key);
}

function addLeftRotationActions(key:string) {
	addKeyActions({code:key, keydownAc:onLeftRotation})
	keyBinding.set('leftRotation', key);
}

function addRightRotationActions(key:string) {
	addKeyActions({code:key, keydownAc:onRightRotation})
	keyBinding.set('rightRotation', key);
}

function addHoldActions(key:string) {
	addKeyActions({code:key, keydownAc:onHold})
	keyBinding.set('hold', key);
}

function addKeyBinding(type:string, key:string) {
	switch (type) {
		case 'left':
			addLeftKeyActions(key);
			break;
		case 'right':
			addRightKeyActions(key)
			break;
		case 'softDrop':
			addSoftDropKeyActions(key);
			break;
		case 'hardDrop':
			addHardDropKeyActions(key);
			break;
		case 'leftRotation':
			addLeftRotationActions(key);
			break;
		case 'rightRotation':
			addRightRotationActions(key);
			break;
		case 'hold':
			addHoldActions(key);
			break;
		default:
			break;
	}
}

function addPauseKeyActions(key: string) {
	addKeyActions({code:key, keydownAc:()=> {
		removeKeyActions(key);
		$('#pauseDialog').dialog('open');
	}})
}

addRightKeyActions('d');
addLeftKeyActions('a');
addHardDropKeyActions('w');
addSoftDropKeyActions('s');
addLeftRotationActions('ArrowLeft');
addRightRotationActions('ArrowRight');
addHoldActions('Shift');

//addPauseKeyActions('Escape');

function toOperate(str: string): Operate|undefined {
	if (Operations.includes(str as Operate)) {
		return str as Operate;
	} else {
		return undefined;
	}
}

$(document).on('click', '.keyForAny', (e1) => {
	const type_pre = $(e1.currentTarget).attr('id');
	//console.log(e1,type_pre);
	if (typeof type_pre === 'string') {
		const type = type_pre.slice(6);
		const type_lower = toLowerFirstLetter(type);
		const formerKey = keyBinding.get(toOperate(type_lower)!);
		if (typeof formerKey !== 'undefined') {
			removeKeyActions(formerKey);
		}
		$(document).off('.onClickKeyForAny');
		$(document).on('keydown.onClickKeyForAny', (e) => {
			const currentKey = e.key;
			$(document).off('.onClickKeyForAny');
			if (typeof currentKey === 'string') {
				//console.log(type,currentKey);
				const thisKeybinding = keyBinding.get(toOperate(type_lower)!)!;
				for (const iterator of keyBinding.entries()) {
					//console.log(iterator[1],currentKey,thisKeybinding);
					if (iterator[1]==currentKey) {
						console.log(iterator[0],'#keyFor'+toUpperFirstLetter(iterator[0]));
						removeKeyActions(currentKey);
						addKeyBinding(iterator[0], thisKeybinding);
						$('#keyFor'+toUpperFirstLetter(iterator[0])).text(thisKeybinding);
					}
				}
				addKeyBinding(type_lower, currentKey);
				$('#keyFor'+type).text(currentKey);
			}
		})
	}
})


setButtonActions('.buttonsToOperate[data-operate="left"]', 300, 50);
setButtonActions('.buttonsToOperate[data-operate="right"]', 300, 50);
setButtonActions('.buttonsToOperate[data-operate="softDrop"]');
setButtonActions('.buttonsToOperate[data-operate="hardDrop"]');
setButtonActions('.buttonsToOperate[data-operate="leftRotation"]');
setButtonActions('.buttonsToOperate[data-operate="rightRotation"]');
setButtonActions('.buttonsToOperate[data-operate="hold"]');

$(document).on('pressstart', '.buttonsToOperate[data-operate="left"]', (e) => {
	//console.log('pressstart');
	onLeft()
})
$(document).on('longpress', '.buttonsToOperate[data-operate="left"]', (e) => {
	//console.log('longpress');
	onLeft()
})
$(document).on('pressstart', '.buttonsToOperate[data-operate="right"]', (e) => {
	//console.log('pressstart');
	onRight()
})
$(document).on('longpress', '.buttonsToOperate[data-operate="right"]', (e) => {
	//console.log('longpress');
	onRight()
})
$(document).on('pressstart', '.buttonsToOperate[data-operate="softDrop"]', (e) => {
	onSoftDrop(true);
})
$(document).on('pressend', '.buttonsToOperate[data-operate="softDrop"]', (e) => {
	onSoftDrop(false);
})
$(document).on('pressstart', '.buttonsToOperate[data-operate="hardDrop"]', (e) => {
	onHardDrop()
})
$(document).on('pressstart', '.buttonsToOperate[data-operate="leftRotation"]', (e) => {
	onLeftRotation()
})
$(document).on('pressstart', '.buttonsToOperate[data-operate="rightRotation"]', (e) => {
	onRightRotation()
})
$(document).on('pressstart', '.buttonsToOperate[data-operate="hold"]', (e) => {
	onHold()
})

function switchOperate(type:Operate, b?: boolean): void {
	switch(type) {
		case 'left':
			onLeft();
			break;
		case 'right':
			onRight();
			break;
		case 'softDrop':
			if (typeof b !== 'undefined') {
				onSoftDrop(b);
			}
			break;
		case 'hardDrop':
			onHardDrop();
			break;
		case 'leftRotation':
			onLeftRotation();
			break;
		case 'rightRotation':
			onRightRotation();
			break;
		case 'hold':
			onHold();
			break;
		default:
			break;
	}
}

$(document).on('swipedist', function (e, d, dv2) {
	console.log(d);
	switch (d) {
		case 'left':
			onLeft()
			break;
		case 'right':
			onRight()
			break;
	}
})

$(document).on('swipestart', function (e, d, dv2) {
	switch (d) {
		case 'up':
			onHold()
			break;
	}
})

$(document).on('longswipe', function (e, d, dv2) {
	//console.log(redLog + dv2 + resetLogColor);
	// console.log(greenLog + d + resetLogColor);
	if (d != "down") {
		onSoftDrop(false)
	}
	switch (d) {
		case 'down':
			onSoftDrop(true)
			break;
		case 'up':
			onHold()
			break;
	}
})

$(document).on('swipeend', function (e, d, dv2) {
	//console.log(redLog + dv2 + resetLogColor);
	onSoftDrop(false)
	switch (d) {
		case 'down':
			if (dv2 > dv2Border) {
				onHardDrop()
			}
			break;
		case 'up':
			onHold()
			break;
	}
})

$(document).on('touched', function (e, x, y) {
	console.log(x,y);
	const pointElement = jQuery(document.elementFromPoint(x,y)!);
	if (pointElement.get(0).tagName == 'BUTTON') {
		pointElement.trigger('click');
	} else if (x > $(window).width()! / 2) {
		onRightRotation()
	} else {
		onLeftRotation()
	}
})


function onLeft() {
	moveToLeft(function (b) {
		// if(b)restartFall()
	})
}

function onRight() {
	moveToRight(function (b) {
		// if(b)restartFall()
	})
}

function onSoftDrop(b: boolean) {
	softDrop(b)
}

function onHardDrop() {
	hardDrop()
}

function onRightRotation() {
	rightRotation()
}

function onLeftRotation() {
	leftRotation()
}

function onHold() {
	hold()
}

//
//
// init
//
//

// // ビジーwaitを使う方法
// function sleep(waitMsec) {
// 	var startMsec = new Date();
//
// 	// 指定ミリ秒間だけループさせる（CPUは常にビジー状態）
// 	while (new Date() - startMsec < waitMsec);
// }

initDialogs()

$('#startButton').off('click');
$(document).on('click','#startButton', () => {
	console.log('start!!');
	initTetris();
	startTetris()
})
//$(document).on('touched','#startButton', () => {
	//	initTetris();
	//	startTetris();
	//})

$('#toKeyBindings').off('click');
$(document).on('click','#toKeyBindings', () => {
	toKeyBindings();
})

$('#fromKeyToMainMenu').off('click');
$(document).on('click','#fromKeyToMainMenu', () => {
	$(document).off('.onClickKeyForAny');
	toMainMenu();
})

$('#pauseButton').off('click');
$(document).on('click', '#pauseButton', ()=>{
	$('#pauseDialog').dialog('open');
})

//$(document).on('touched','#fromKeyToMainMenu', () => {
//	toMainMenu();
//})

toMainMenu()

// $('#startButton').off()

// reset();
//
// startToAppearMinos();

//
//
// main system
//
//

function start() {
// initDisplay()
// initVars()
// organizeBag()
//
// startToAppear(//)
}
