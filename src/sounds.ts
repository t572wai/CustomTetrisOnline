//import { Howl } from "howler";

//// import {Howl} from 'howler';
////
//// const sound = new Howl({
//// 	src: 'sound/lockDownSE.mp3'
//// })




import { Howl, Howler } from 'howler';
//const howler = require('howler');

export const lockDownSound = new Howl({
	src: [
		"sounds/lockDownSE.mp3",
	],
	volume: 0.5
});
export const hardDropSound = new Howl({
	src: [
		"sounds/hardDropSE.mp3",
	],
	volume: 0.5
});

export const startSound = new Howl({
	src: [
		"sounds/startSound.mp3",
	],
	volume: 0.7
})

export const tspinSound = new Howl({
	src: [
		"sounds/tspinSE2.mp3"
	],
	volume: 0.6
})
